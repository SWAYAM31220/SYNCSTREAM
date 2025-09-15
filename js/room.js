// Room JavaScript for SyncStream

let roomManager = null;

document.addEventListener('DOMContentLoaded', function() {
    roomManager = new RoomManager();
    roomManager.init();
});

class RoomManager {
    constructor() {
        this.roomId = null;
        this.currentUser = null;
        this.ytPlayer = null;
        this.isHost = false;
        this.participants = [];
        this.messages = [];
        this.subscriptions = [];
        
        // DOM elements
        this.elements = {
            joinModal: document.getElementById('joinModal'),
            userName: document.getElementById('userName'),
            joinBtn: document.getElementById('joinBtn'),
            currentRoomId: document.getElementById('currentRoomId'),
            participantCount: document.getElementById('participantCount'),
            currentUserEl: document.getElementById('currentUser'),
            shareRoomBtn: document.getElementById('shareRoomBtn'),
            videoPlayer: document.getElementById('videoPlayer'),
            playBtn: document.getElementById('playBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            syncBtn: document.getElementById('syncBtn'),
            currentTime: document.getElementById('currentTime'),
            hostControls: document.getElementById('hostControls'),
            chatMessages: document.getElementById('chatMessages'),
            chatInput: document.getElementById('chatInput'),
            sendBtn: document.getElementById('sendBtn'),
            onlineUsers: document.getElementById('onlineUsers'),
            shareModal: document.getElementById('shareModal'),
            shareRoomLink: document.getElementById('shareRoomLink'),
            copyRoomLinkBtn: document.getElementById('copyRoomLinkBtn'),
            closeShareModal: document.getElementById('closeShareModal')
        };
    }

    async init() {
        // Get room ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.roomId = urlParams.get('room');
        
        if (!this.roomId) {
            this.showError('Invalid room URL');
            return;
        }

        this.elements.currentRoomId.textContent = this.roomId;
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize YouTube API
        window.onYouTubeIframeAPIReady = () => this.initYouTubePlayer();
        
        // Show join modal
        this.showJoinModal();
    }

    setupEventListeners() {
        // Join room
        this.elements.joinBtn.addEventListener('click', () => this.handleJoinRoom());
        this.elements.userName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleJoinRoom();
        });

        // Video controls
        this.elements.playBtn.addEventListener('click', () => this.playVideo());
        this.elements.pauseBtn.addEventListener('click', () => this.pauseVideo());
        this.elements.syncBtn.addEventListener('click', () => this.syncAllParticipants());

        // Chat
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        this.elements.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Share room
        this.elements.shareRoomBtn.addEventListener('click', () => this.showShareModal());
        this.elements.copyRoomLinkBtn.addEventListener('click', () => this.copyRoomLink());
        this.elements.closeShareModal.addEventListener('click', () => this.hideShareModal());

        // Close modal on outside click
        this.elements.shareModal.addEventListener('click', (e) => {
            if (e.target === this.elements.shareModal) {
                this.hideShareModal();
            }
        });
    }

    showJoinModal() {
        this.elements.joinModal.style.display = 'flex';
        this.elements.userName.focus();
    }

    hideJoinModal() {
        this.elements.joinModal.style.display = 'none';
    }

    async handleJoinRoom() {
        const userName = this.elements.userName.value.trim();
        
        if (!userName) {
            this.showError('Please enter your name');
            return;
        }

        this.elements.joinBtn.disabled = true;
        this.elements.joinBtn.textContent = 'Joining...';

        try {
            // Get room data
            const roomData = await SupabaseAPI.getRoom(this.roomId);
            
            if (!roomData) {
                this.showError('Room not found');
                return;
            }

            // Add participant
            await SupabaseAPI.addParticipant(this.roomId, userName);
            
            this.currentUser = userName;
            this.elements.currentUserEl.textContent = userName;
            
            // Load video
            await this.loadVideo(roomData.video_url);
            
            // Setup real-time subscriptions
            this.setupRealtimeSubscriptions();
            
            // Load existing messages and participants
            await this.loadMessages();
            await this.updateParticipants();
            
            // Hide join modal
            this.hideJoinModal();
            
            // Add welcome message
            this.addSystemMessage(`${userName} joined the room`);
            
        } catch (error) {
            console.error('Error joining room:', error);
            this.showError('Failed to join room');
        } finally {
            this.elements.joinBtn.disabled = false;
            this.elements.joinBtn.textContent = 'Join Room';
        }
    }

    async loadVideo(videoUrl) {
        const videoId = SupabaseAPI.extractVideoId(videoUrl);
        
        if (!videoId) {
            this.showError('Invalid video URL');
            return;
        }

        // Create YouTube player
        this.ytPlayer = new YT.Player('videoPlayer', {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
                'playsinline': 1,
                'controls': 0,
                'rel': 0,
                'modestbranding': 1
            },
            events: {
                'onReady': () => this.onPlayerReady(),
                'onStateChange': (event) => this.onPlayerStateChange(event)
            }
        });
    }

    async onPlayerReady() {
        console.log('YouTube player ready');
        
        // Load video state
        const videoState = await SupabaseAPI.getVideoState(this.roomId);
        
        if (videoState.video_time > 0) {
            this.ytPlayer.seekTo(videoState.video_time);
        }
        
        if (videoState.is_playing) {
            this.ytPlayer.playVideo();
        }
        
        // Start time update interval
        this.startTimeUpdater();
        
        // Check if user is host (first participant or only one)
        const participants = await SupabaseAPI.getParticipants(this.roomId);
        this.isHost = participants.length <= 1 || participants[0].name === this.currentUser;
        
        if (this.isHost) {
            this.elements.hostControls.style.display = 'block';
        }
    }

    onPlayerStateChange(event) {
        const isPlaying = event.data === YT.PlayerState.PLAYING;
        const isPaused = event.data === YT.PlayerState.PAUSED;
        
        if (isPlaying || isPaused) {
            const currentTime = this.ytPlayer.getCurrentTime();
            SupabaseAPI.updateVideoState(this.roomId, currentTime, isPlaying);
        }
    }

    playVideo() {
        if (this.ytPlayer) {
            this.ytPlayer.playVideo();
        }
    }

    pauseVideo() {
        if (this.ytPlayer) {
            this.ytPlayer.pauseVideo();
        }
    }

    async syncAllParticipants() {
        if (!this.isHost || !this.ytPlayer) return;
        
        const currentTime = this.ytPlayer.getCurrentTime();
        const isPlaying = this.ytPlayer.getPlayerState() === YT.PlayerState.PLAYING;
        
        await SupabaseAPI.updateVideoState(this.roomId, currentTime, isPlaying);
        
        // Visual feedback
        this.elements.syncBtn.textContent = 'Synced!';
        setTimeout(() => {
            this.elements.syncBtn.textContent = '🔄 Sync All';
        }, 2000);
    }

    startTimeUpdater() {
        setInterval(() => {
            if (this.ytPlayer && this.ytPlayer.getCurrentTime) {
                const currentTime = this.ytPlayer.getCurrentTime();
                this.elements.currentTime.textContent = this.formatTime(currentTime);
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

        // Video state subscription
        const videoSub = SupabaseAPI.subscribeToVideoState(this.roomId, (payload) => {
            if (payload.new && !this.isHost) {
                this.syncToVideoState(payload.new);
            }
        });
        if (videoSub) this.subscriptions.push(videoSub);

        // Participants subscription
        const participantsSub = SupabaseAPI.subscribeToParticipants(this.roomId, () => {
            this.updateParticipants();
        });
        if (participantsSub) this.subscriptions.push(participantsSub);
    }

    async syncToVideoState(videoState) {
        if (!this.ytPlayer) return;
        
        const currentTime = this.ytPlayer.getCurrentTime();
        const targetTime = videoState.video_time;
        const timeDiff = Math.abs(currentTime - targetTime);
        
        // Only sync if difference is significant (>2 seconds)
        if (timeDiff > 2) {
            this.ytPlayer.seekTo(targetTime);
        }
        
        const currentState = this.ytPlayer.getPlayerState();
        const shouldBePlaying = videoState.is_playing;
        
        if (shouldBePlaying && currentState !== YT.PlayerState.PLAYING) {
            this.ytPlayer.playVideo();
        } else if (!shouldBePlaying && currentState === YT.PlayerState.PLAYING) {
            this.ytPlayer.pauseVideo();
        }
    }

    async loadMessages() {
        const messages = await SupabaseAPI.getMessages(this.roomId);
        messages.forEach(message => this.addMessage(message));
    }

    async sendMessage() {
        const message = this.elements.chatInput.value.trim();
        
        if (!message || !this.currentUser) return;
        
        this.elements.chatInput.value = '';
        this.elements.sendBtn.disabled = true;
        
        try {
            await SupabaseAPI.sendMessage(this.roomId, this.currentUser, message);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            this.elements.sendBtn.disabled = false;
        }
    }

    addMessage(messageData) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message';
        
        const time = new Date(messageData.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageEl.innerHTML = `
            <div class="message-header">
                <span class="sender-name">${messageData.sender_name}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content">${this.escapeHtml(messageData.message)}</div>
        `;
        
        this.elements.chatMessages.appendChild(messageEl);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    addSystemMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'system-message';
        messageEl.textContent = message;
        
        this.elements.chatMessages.appendChild(messageEl);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    async updateParticipants() {
        try {
            const participants = await SupabaseAPI.getParticipants(this.roomId);
            this.participants = participants;
            
            this.elements.participantCount.textContent = participants.length;
            
            const userNames = participants.map(p => p.name).join(', ');
            this.elements.onlineUsers.textContent = userNames || 'Loading...';
        } catch (error) {
            console.error('Error updating participants:', error);
        }
    }

    showShareModal() {
        const roomUrl = `${window.location.origin}${window.location.pathname}?room=${this.roomId}`;
        this.elements.shareRoomLink.value = roomUrl;
        this.elements.shareModal.classList.remove('hidden');
    }

    hideShareModal() {
        this.elements.shareModal.classList.add('hidden');
    }

    async copyRoomLink() {
        try {
            await navigator.clipboard.writeText(this.elements.shareRoomLink.value);
            
            const originalText = this.elements.copyRoomLinkBtn.textContent;
            this.elements.copyRoomLinkBtn.textContent = 'Copied!';
            
            setTimeout(() => {
                this.elements.copyRoomLinkBtn.textContent = originalText;
            }, 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            this.elements.shareRoomLink.select();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        alert(message); // Simple error handling for MVP
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

// YouTube API ready handler
function onYouTubeIframeAPIReady() {
    if (roomManager) {
        roomManager.initYouTubePlayer();
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (roomManager) {
        roomManager.cleanup();
    }
});
