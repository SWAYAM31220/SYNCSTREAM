/* ==========================================================================
   SYNCSTREAM - ENHANCED ROOM JAVASCRIPT
   Production-Ready with Video Queue, Admin Controls, and Security
   ========================================================================== */

// ==========================================================================
// VIDEO QUEUE MANAGER
// ==========================================================================

class VideoQueue {
    constructor(roomManager) {
        this.roomManager = roomManager;
        this.queue = [];
        this.currentIndex = 0;
        this.isProcessing = false;
    }

    add(videoUrl, title = null) {
        const videoId = SupabaseAPI.extractVideoId(videoUrl);
        if (!videoId) return false;

        const queueItem = {
            id: Date.now().toString(),
            videoUrl,
            videoId,
            title: title || 'Unknown Video',
            addedAt: new Date().toISOString(),
            addedBy: this.roomManager.currentUser
        };

        this.queue.push(queueItem);
        this.renderQueue();
        this.roomManager.toast?.success('Video added to queue');
        return true;
    }

    remove(itemId) {
        const index = this.queue.findIndex(item => item.id === itemId);
        if (index !== -1) {
            this.queue.splice(index, 1);
            this.renderQueue();
            this.roomManager.toast?.success('Video removed from queue');
        }
    }

    async next() {
        if (this.isProcessing || this.queue.length === 0) return false;

        this.isProcessing = true;
        
        try {
            const nextVideo = this.queue.shift();
            await this.roomManager.loadVideo(nextVideo.videoUrl);
            this.renderQueue();
            this.roomManager.toast?.info(`Now playing: ${nextVideo.title}`);
            return true;
        } catch (error) {
            console.error('Failed to play next video:', error);
            this.roomManager.toast?.error('Failed to load next video');
            return false;
        } finally {
            this.isProcessing = false;
        }
    }

    clear() {
        this.queue = [];
        this.renderQueue();
        this.roomManager.toast?.info('Queue cleared');
    }

    renderQueue() {
        const queueList = document.getElementById('queueList');
        const placeholder = queueList?.querySelector('.queue-placeholder');
        
        if (!queueList) return;

        if (this.queue.length === 0) {
            if (placeholder) {
                placeholder.style.display = 'block';
            }
            queueList.querySelectorAll('.queue-item').forEach(item => item.remove());
            return;
        }

        if (placeholder) {
            placeholder.style.display = 'none';
        }

        // Clear existing items
        queueList.querySelectorAll('.queue-item').forEach(item => item.remove());

        // Render queue items
        this.queue.forEach((item, index) => {
            const itemEl = this.createQueueItem(item, index);
            queueList.appendChild(itemEl);
        });
    }

    createQueueItem(item, index) {
        const itemEl = document.createElement('div');
        itemEl.className = 'queue-item';
        itemEl.setAttribute('role', 'listitem');
        
        if (index === 0) {
            itemEl.classList.add('current');
        }

        itemEl.innerHTML = `
            <div class="queue-item-info">
                <div class="queue-item-title">${SecurityUtils.sanitizeHTML(item.title)}</div>
                <div class="queue-item-url">${SecurityUtils.sanitizeHTML(item.videoUrl)}</div>
            </div>
            <div class="queue-item-actions">
                ${index === 0 ? 
                    `<button class="btn btn-sm btn-primary" onclick="roomManager.videoQueue.next()" aria-label="Play now">▶️</button>` : 
                    ''
                }
                <button class="btn btn-sm btn-ghost" onclick="roomManager.videoQueue.remove('${item.id}')" aria-label="Remove from queue">🗑️</button>
            </div>
        `;

        return itemEl;
    }
}

// ==========================================================================
// ENHANCED ROOM MANAGER
// ==========================================================================

class EnhancedRoomManager {
    constructor() {
        this.roomId = null;
        this.currentUser = null;
        this.ytPlayer = null;
        this.isHost = false;
        this.isAdmin = false;
        this.participants = [];
        this.messages = [];
        this.subscriptions = [];
        this.videoQueue = new VideoQueue(this);
        this.toast = new ToastManager();
        this.messageRateLimit = SecurityUtils.rateLimit(this.sendMessageInternal.bind(this), 1000);
        this.lastSyncTime = 0;
        this.connectionRetries = 0;
        this.maxRetries = 3;
        
        // DOM elements
        this.elements = {};
        
        this.init();
    }

    async init() {
        try {
            await this.waitForDOM();
            this.cacheElements();
            this.getRoomIdFromUrl();
            this.setupEventListeners();
            this.setupKeyboardShortcuts();
            this.initializeYouTubeAPI();
            this.showJoinModal();
            
            console.log('🟣 Enhanced Room Manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Room Manager:', error);
            this.toast.error('Failed to initialize room. Please refresh the page.');
        }
    }

    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    cacheElements() {
        const elementIds = [
            'joinModal', 'userName', 'joinBtn', 'currentRoomId', 'participantCount',
            'currentUser', 'shareRoomBtn', 'videoPlayer', 'playBtn', 'pauseBtn',
            'syncBtn', 'currentTime', 'hostControls', 'chatMessages', 'chatInput',
            'sendBtn', 'onlineUsers', 'shareModal', 'shareRoomLink', 'copyRoomLinkBtn',
            'closeShareModal', 'addVideoBtn', 'videoQueue', 'toggleQueueBtn',
            'queueForm', 'nextVideoUrl', 'addToQueueBtn', 'queueList'
        ];
        
        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });

        this.elements.joinForm = document.getElementById('joinForm');
        this.elements.chatForm = document.getElementById('chatForm');
    }

    getRoomIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        this.roomId = urlParams.get('room');
        
        if (!this.roomId) {
            this.toast.error('Invalid room URL');
            setTimeout(() => window.location.href = 'index.html', 3000);
            return;
        }

        if (this.elements.currentRoomId) {
            this.elements.currentRoomId.textContent = this.roomId;
        }
    }

    setupEventListeners() {
        // Join form
        if (this.elements.joinForm) {
            this.elements.joinForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleJoinRoom();
            });
        }

        // Video controls
        if (this.elements.playBtn) {
            this.elements.playBtn.addEventListener('click', () => this.playVideo());
        }
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.addEventListener('click', () => this.pauseVideo());
        }
        if (this.elements.syncBtn) {
            this.elements.syncBtn.addEventListener('click', () => this.syncAllParticipants());
        }

        // Chat form
        if (this.elements.chatForm) {
            this.elements.chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendMessage();
            });
        }

        // Share room
        if (this.elements.shareRoomBtn) {
            this.elements.shareRoomBtn.addEventListener('click', () => this.showShareModal());
        }
        if (this.elements.copyRoomLinkBtn) {
            this.elements.copyRoomLinkBtn.addEventListener('click', () => this.copyRoomLink());
        }
        if (this.elements.closeShareModal) {
            this.elements.closeShareModal.addEventListener('click', () => this.hideShareModal());
        }

        // Video queue controls (admin only)
        if (this.elements.addVideoBtn) {
            this.elements.addVideoBtn.addEventListener('click', () => this.toggleVideoQueue());
        }
        if (this.elements.toggleQueueBtn) {
            this.elements.toggleQueueBtn.addEventListener('click', () => this.toggleQueueForm());
        }
        if (this.elements.addToQueueBtn) {
            this.elements.addToQueueBtn.addEventListener('click', () => this.addVideoToQueue());
        }

        // Modal close on outside click
        if (this.elements.shareModal) {
            this.elements.shareModal.addEventListener('click', (e) => {
                if (e.target === this.elements.shareModal) {
                    this.hideShareModal();
                }
            });
        }

        // Network status
        window.addEventListener('online', () => {
            this.toast.success('Connection restored');
            this.reconnectToRoom();
        });

        window.addEventListener('offline', () => {
            this.toast.warning('Connection lost. Attempting to reconnect...');
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Space to play/pause (when not typing)
            if (e.code === 'Space' && !e.target.matches('input, textarea, [contenteditable]')) {
                e.preventDefault();
                if (this.ytPlayer) {
                    const state = this.ytPlayer.getPlayerState();
                    if (state === YT.PlayerState.PLAYING) {
                        this.pauseVideo();
                    } else {
                        this.playVideo();
                    }
                }
            }

            // Enter to send message in chat
            if (e.key === 'Enter' && e.target === this.elements.chatInput) {
                if (!e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            }

            // Escape to close modals
            if (e.key === 'Escape') {
                this.hideShareModal();
            }

            // Admin shortcuts
            if (this.isAdmin && (e.ctrlKey || e.metaKey)) {
                if (e.key === 's') {
                    e.preventDefault();
                    this.syncAllParticipants();
                }
                if (e.key === 'q') {
                    e.preventDefault();
                    this.toggleVideoQueue();
                }
            }
        });
    }

    initializeYouTubeAPI() {
        if (typeof YT !== 'undefined' && YT.Player) {
            this.onYouTubeIframeAPIReady();
        } else {
            window.onYouTubeIframeAPIReady = () => this.onYouTubeIframeAPIReady();
        }
    }

    onYouTubeIframeAPIReady() {
        console.log('YouTube API ready');
        // Player will be initialized when joining room
    }

    showJoinModal() {
        if (this.elements.joinModal) {
            this.elements.joinModal.style.display = 'flex';
            if (this.elements.userName) {
                this.elements.userName.focus();
            }
        }
    }

    hideJoinModal() {
        if (this.elements.joinModal) {
            this.elements.joinModal.style.display = 'none';
        }
    }

    async handleJoinRoom() {
        const userName = this.elements.userName?.value.trim();
        
        if (!this.validateJoinInput(userName)) return;

        this.setJoinLoading(true);

        try {
            // Get room data
            const roomData = await this.getRoomWithRetry();
            if (!roomData) return;

            // Add participant
            await SupabaseAPI.addParticipant(this.roomId, userName);
            
            this.currentUser = userName;
            if (this.elements.currentUser) {
                this.elements.currentUser.textContent = userName;
            }
            
            // Determine if user is admin (first to join or room creator)
            const participants = await SupabaseAPI.getParticipants(this.roomId);
            this.isHost = participants.length <= 1 || participants[0].name === userName;
            this.isAdmin = this.isHost; // For now, host = admin
            
            // Load video
            await this.loadVideo(roomData.video_url);
            
            // Setup real-time subscriptions
            this.setupRealtimeSubscriptions();
            
            // Load existing data
            await Promise.all([
                this.loadMessages(),
                this.updateParticipants()
            ]);
            
            // Show admin controls if applicable
            if (this.isAdmin) {
                this.showAdminControls();
            }
            
            // Hide join modal
            this.hideJoinModal();
            
            // Welcome message
            this.addSystemMessage(`${userName} joined the room`);
            this.toast.success(`Welcome to the room, ${userName}!`);
            
        } catch (error) {
            console.error('Error joining room:', error);
            this.toast.error('Failed to join room. Please try again.');
        } finally {
            this.setJoinLoading(false);
        }
    }

    validateJoinInput(userName) {
        if (!userName) {
            this.toast.warning('Please enter your name');
            if (this.elements.userName) {
                this.elements.userName.focus();
            }
            return false;
        }

        if (userName.length > 50) {
            this.toast.error('Name is too long (max 50 characters)');
            return false;
        }

        if (!/^[a-zA-Z0-9\s\-_]+$/.test(userName)) {
            this.toast.error('Name can only contain letters, numbers, spaces, hyphens, and underscores');
            return false;
        }

        return true;
    }

    async getRoomWithRetry() {
        for (let i = 0; i < this.maxRetries; i++) {
            try {
                const roomData = await SupabaseAPI.getRoom(this.roomId);
                if (roomData) return roomData;
                throw new Error('Room not found');
            } catch (error) {
                if (i === this.maxRetries - 1) {
                    this.toast.error('Room not found or connection failed');
                    setTimeout(() => window.location.href = 'index.html', 3000);
                    return null;
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }

    setJoinLoading(loading) {
        const button = this.elements.joinBtn;
        if (!button) return;

        if (loading) {
            button.disabled = true;
            button.innerHTML = `<span class="spinner"></span> Joining...`;
        } else {
            button.disabled = false;
            button.textContent = 'Join Room';
        }
    }

    showAdminControls() {
        if (this.elements.hostControls) {
            this.elements.hostControls.style.display = 'flex';
        }
        if (this.elements.videoQueue) {
            this.elements.videoQueue.style.display = 'block';
        }
    }

    async loadVideo(videoUrl) {
        const videoId = SupabaseAPI.extractVideoId(videoUrl);
        
        if (!videoId) {
            this.toast.error('Invalid video URL');
            return;
        }

        try {
            // Create YouTube player
            this.ytPlayer = new YT.Player('videoPlayer', {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    'playsinline': 1,
                    'controls': 1,
                    'rel': 0,
                    'modestbranding': 1,
                    'fs': 1,
                    'cc_load_policy': 1
                },
                events: {
                    'onReady': (event) => this.onPlayerReady(event),
                    'onStateChange': (event) => this.onPlayerStateChange(event),
                    'onError': (event) => this.onPlayerError(event)
                }
            });

            this.toast.success('Video loaded successfully');
        } catch (error) {
            console.error('Failed to load video:', error);
            this.toast.error('Failed to load video');
        }
    }

    async onPlayerReady(event) {
        console.log('YouTube player ready');
        
        try {
            // Load video state
            const videoState = await SupabaseAPI.getVideoState(this.roomId);
            
            if (videoState && videoState.video_time > 0) {
                this.ytPlayer.seekTo(videoState.video_time);
            }
            
            if (videoState && videoState.is_playing) {
                this.ytPlayer.playVideo();
            }
            
            // Start time update interval
            this.startTimeUpdater();
            
        } catch (error) {
            console.error('Error setting up player:', error);
        }
    }

    onPlayerStateChange(event) {
        if (!this.isAdmin) return; // Only admin can update video state

        const isPlaying = event.data === YT.PlayerState.PLAYING;
        const isPaused = event.data === YT.PlayerState.PAUSED;
        const isEnded = event.data === YT.PlayerState.ENDED;
        
        if (isPlaying || isPaused) {
            const currentTime = this.ytPlayer.getCurrentTime();
            const now = Date.now();
            
            // Rate limit sync updates
            if (now - this.lastSyncTime > 2000) {
                SupabaseAPI.updateVideoState(this.roomId, currentTime, isPlaying);
                this.lastSyncTime = now;
            }
        }

        if (isEnded && this.videoQueue.queue.length > 0) {
            // Auto-play next video in queue
            setTimeout(() => this.videoQueue.next(), 2000);
        }
    }

    onPlayerError(event) {
        console.error('YouTube player error:', event.data);
        let errorMessage = 'Video playback error';
        
        switch (event.data) {
            case 2:
                errorMessage = 'Invalid video ID';
                break;
            case 5:
                errorMessage = 'Video not playable in HTML5 player';
                break;
            case 100:
                errorMessage = 'Video not found or private';
                break;
            case 101:
            case 150:
                errorMessage = 'Video not allowed to be played in embedded players';
                break;
        }
        
        this.toast.error(errorMessage);
        
        // Try next video in queue if available
        if (this.videoQueue.queue.length > 0) {
            setTimeout(() => this.videoQueue.next(), 3000);
        }
    }

    playVideo() {
        if (this.ytPlayer && this.isAdmin) {
            this.ytPlayer.playVideo();
        }
    }

    pauseVideo() {
        if (this.ytPlayer && this.isAdmin) {
            this.ytPlayer.pauseVideo();
        }
    }

    async syncAllParticipants() {
        if (!this.isAdmin || !this.ytPlayer) return;
        
        try {
            const currentTime = this.ytPlayer.getCurrentTime();
            const isPlaying = this.ytPlayer.getPlayerState() === YT.PlayerState.PLAYING;
            
            await SupabaseAPI.updateVideoState(this.roomId, currentTime, isPlaying);
            
            // Visual feedback
            const button = this.elements.syncBtn;
            if (button) {
                const originalText = button.textContent;
                button.textContent = '✓ Synced!';
                button.disabled = true;
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 2000);
            }
            
            this.toast.success('All participants synced');
        } catch (error) {
            console.error('Sync failed:', error);
            this.toast.error('Failed to sync participants');
        }
    }

    startTimeUpdater() {
        setInterval(() => {
            if (this.ytPlayer && this.ytPlayer.getCurrentTime) {
                const currentTime = this.ytPlayer.getCurrentTime();
                if (this.elements.currentTime) {
                    this.elements.currentTime.textContent = this.formatTime(currentTime);
                }
            }
        }, 1000);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    setupRealtimeSubscriptions() {
        // Messages subscription
        const messagesSub = SupabaseAPI.subscribeToMessages(this.roomId, (payload) => {
            if (payload.new) {
                this.addMessage(payload.new);
            }
        });
        if (messagesSub) this.subscriptions.push(messagesSub);

        // Video state subscription (for non-admin users)
        if (!this.isAdmin) {
            const videoSub = SupabaseAPI.subscribeToVideoState(this.roomId, (payload) => {
                if (payload.new) {
                    this.syncToVideoState(payload.new);
                }
            });
            if (videoSub) this.subscriptions.push(videoSub);
        }

        // Participants subscription
        const participantsSub = SupabaseAPI.subscribeToParticipants(this.roomId, () => {
            this.updateParticipants();
        });
        if (participantsSub) this.subscriptions.push(participantsSub);
    }

    async syncToVideoState(videoState) {
        if (!this.ytPlayer || this.isAdmin) return;
        
        try {
            const currentTime = this.ytPlayer.getCurrentTime();
            const targetTime = videoState.video_time;
            const timeDiff = Math.abs(currentTime - targetTime);
            
            // Only sync if difference is significant (>3 seconds)
            if (timeDiff > 3) {
                this.ytPlayer.seekTo(targetTime);
            }
            
            const currentState = this.ytPlayer.getPlayerState();
            const shouldBePlaying = videoState.is_playing;
            
            if (shouldBePlaying && currentState !== YT.PlayerState.PLAYING) {
                this.ytPlayer.playVideo();
            } else if (!shouldBePlaying && currentState === YT.PlayerState.PLAYING) {
                this.ytPlayer.pauseVideo();
            }
        } catch (error) {
            console.error('Sync error:', error);
        }
    }

    sendMessage() {
        const message = this.elements.chatInput?.value.trim();
        if (!message || !this.currentUser || message.length > 500) {
            if (message.length > 500) {
                this.toast.warning('Message is too long (max 500 characters)');
            }
            return;
        }
        
        // Use rate-limited send
        this.messageRateLimit(message);
        this.elements.chatInput.value = '';
    }

    async sendMessageInternal(message) {
        const sendButton = this.elements.sendBtn;
        if (sendButton) sendButton.disabled = true;
        
        try {
            // Sanitize message
            const sanitizedMessage = SecurityUtils.sanitizeHTML(message);
            await SupabaseAPI.sendMessage(this.roomId, this.currentUser, sanitizedMessage);
        } catch (error) {
            console.error('Error sending message:', error);
            this.toast.error('Failed to send message');
        } finally {
            if (sendButton) sendButton.disabled = false;
        }
    }

    async loadMessages() {
        try {
            const messages = await SupabaseAPI.getMessages(this.roomId);
            messages.forEach(message => this.addMessage(message));
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }

    addMessage(messageData) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message';
        messageEl.setAttribute('role', 'listitem');
        
        const time = new Date(messageData.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageEl.innerHTML = `
            <div class="message-header">
                <span class="sender-name">${SecurityUtils.sanitizeHTML(messageData.sender_name)}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content">${SecurityUtils.sanitizeHTML(messageData.message)}</div>
        `;
        
        if (this.elements.chatMessages) {
            this.elements.chatMessages.appendChild(messageEl);
            this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        }
    }

    addSystemMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'system-message';
        messageEl.textContent = message;
        
        if (this.elements.chatMessages) {
            this.elements.chatMessages.appendChild(messageEl);
            this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        }
    }

    async updateParticipants() {
        try {
            const participants = await SupabaseAPI.getParticipants(this.roomId);
            this.participants = participants;
            
            if (this.elements.participantCount) {
                this.elements.participantCount.textContent = participants.length;
            }
            
            const userNames = participants.map(p => p.name).join(', ');
            if (this.elements.onlineUsers) {
                this.elements.onlineUsers.textContent = userNames || 'Loading...';
            }
        } catch (error) {
            console.error('Error updating participants:', error);
        }
    }

    // Video Queue Management
    toggleVideoQueue() {
        if (!this.isAdmin) {
            this.toast.warning('Only room admin can manage the video queue');
            return;
        }

        const queue = this.elements.videoQueue;
        if (queue) {
            const isVisible = queue.style.display !== 'none';
            queue.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                this.videoQueue.renderQueue();
            }
        }
    }

    toggleQueueForm() {
        const form = this.elements.queueForm;
        const button = this.elements.toggleQueueBtn;
        
        if (form && button) {
            const isVisible = form.style.display !== 'none';
            form.style.display = isVisible ? 'none' : 'block';
            button.textContent = isVisible ? '➕' : '➖';
            
            if (!isVisible && this.elements.nextVideoUrl) {
                this.elements.nextVideoUrl.focus();
            }
        }
    }

    async addVideoToQueue() {
        if (!this.isAdmin) {
            this.toast.warning('Only room admin can add videos to the queue');
            return;
        }

        const urlInput = this.elements.nextVideoUrl;
        const videoUrl = urlInput?.value.trim();
        
        if (!videoUrl) {
            this.toast.warning('Please enter a YouTube video URL');
            return;
        }

        if (!SecurityUtils.validateYouTubeURL(videoUrl)) {
            this.toast.error('Please enter a valid YouTube video URL');
            return;
        }

        try {
            // Try to get video title (this would require YouTube Data API)
            const title = 'Video'; // Placeholder
            
            if (this.videoQueue.add(videoUrl, title)) {
                urlInput.value = '';
                this.toggleQueueForm(); // Hide form after adding
            } else {
                this.toast.error('Failed to add video to queue');
            }
        } catch (error) {
            console.error('Failed to add video:', error);
            this.toast.error('Failed to add video to queue');
        }
    }

    // Share functionality
    showShareModal() {
        const modal = this.elements.shareModal;
        const linkInput = this.elements.shareRoomLink;
        
        if (modal && linkInput) {
            const roomUrl = `${window.location.origin}${window.location.pathname}?room=${this.roomId}`;
            linkInput.value = roomUrl;
            modal.classList.remove('hidden');
            linkInput.select();
        }
    }

    hideShareModal() {
        if (this.elements.shareModal) {
            this.elements.shareModal.classList.add('hidden');
        }
    }

    async copyRoomLink() {
        const linkInput = this.elements.shareRoomLink;
        if (!linkInput?.value) return;

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(linkInput.value);
            } else {
                linkInput.select();
                document.execCommand('copy');
            }
            
            this.toast.success('Room link copied to clipboard!');
            
            const button = this.elements.copyRoomLinkBtn;
            if (button) {
                const originalText = button.textContent;
                button.textContent = '✓ Copied!';
                setTimeout(() => {
                    button.textContent = originalText;
                }, 2000);
            }
            
        } catch (error) {
            console.error('Failed to copy:', error);
            this.toast.error('Failed to copy link');
        }
    }

    async reconnectToRoom() {
        if (this.connectionRetries >= this.maxRetries) return;
        
        this.connectionRetries++;
        
        try {
            // Re-establish connections
            await this.setupRealtimeSubscriptions();
            await this.updateParticipants();
            this.toast.success('Reconnected to room');
            this.connectionRetries = 0;
        } catch (error) {
            console.error('Reconnection failed:', error);
            setTimeout(() => this.reconnectToRoom(), 5000);
        }
    }

    cleanup() {
        // Clean up subscriptions
        this.subscriptions.forEach(sub => {
            if (sub && sub.unsubscribe) {
                sub.unsubscribe();
            }
        });
        
        // Stop YouTube player
        if (this.ytPlayer && this.ytPlayer.destroy) {
            this.ytPlayer.destroy();
        }
    }
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================

let roomManager;

document.addEventListener('DOMContentLoaded', () => {
    roomManager = new EnhancedRoomManager();
});

// YouTube API ready handler
function onYouTubeIframeAPIReady() {
    if (roomManager) {
        roomManager.onYouTubeIframeAPIReady();
    }
}

// Global access
window.roomManager = roomManager;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (roomManager) {
        roomManager.cleanup();
    }
});

// Global error handling
window.addEventListener('error', (event) => {
    console.error('Room error:', event.error);
    if (roomManager?.toast) {
        roomManager.toast.error('An error occurred. Please refresh if issues persist.');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Room promise rejection:', event.reason);
    if (roomManager?.toast) {
        roomManager.toast.error('A network error occurred.');
    }
});
