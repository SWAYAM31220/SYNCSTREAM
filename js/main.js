// Main JavaScript for SyncStream Landing Page

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const videoUrlInput = document.getElementById('videoUrl');
    const createRoomBtn = document.getElementById('createRoomBtn');
    const roomCreatedSection = document.getElementById('roomCreated');
    const shareLinkInput = document.getElementById('shareLink');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const joinRoomBtn = document.getElementById('joinRoomBtn');

    let currentRoomData = null;

    // Event Listeners
    createRoomBtn.addEventListener('click', handleCreateRoom);
    copyLinkBtn.addEventListener('click', handleCopyLink);
    videoUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleCreateRoom();
        }
    });

    // Handle room creation
    async function handleCreateRoom() {
        const videoUrl = videoUrlInput.value.trim();
        
        // Validate input
        if (!videoUrl) {
            showError('Please enter a YouTube video URL');
            return;
        }

        if (!SupabaseAPI.isValidYouTubeUrl(videoUrl)) {
            showError('Please enter a valid YouTube video URL');
            return;
        }

        // Show loading state
        createRoomBtn.disabled = true;
        createRoomBtn.textContent = 'Creating Room...';

        try {
            // Create room using Supabase API
            const roomData = await SupabaseAPI.createRoom(videoUrl);
            
            if (roomData) {
                currentRoomData = roomData;
                showRoomCreated(roomData);
            } else {
                showError('Failed to create room. Please try again.');
            }
        } catch (error) {
            console.error('Error creating room:', error);
            showError('Failed to create room. Please try again.');
        } finally {
            // Reset button state
            createRoomBtn.disabled = false;
            createRoomBtn.textContent = 'Create Room';
        }
    }

    // Show room created section
    function showRoomCreated(roomData) {
        const roomUrl = `${window.location.origin}${window.location.pathname.replace('index.html', '')}room.html?room=${roomData.id}`;
        
        shareLinkInput.value = roomUrl;
        joinRoomBtn.href = roomUrl;
        
        roomCreatedSection.classList.remove('hidden');
        roomCreatedSection.scrollIntoView({ behavior: 'smooth' });
        
        // Clear form
        videoUrlInput.value = '';
        
        // Show success animation
        roomCreatedSection.style.animation = 'fadeIn 0.5s ease';
    }

    // Handle copy link
    async function handleCopyLink() {
        try {
            await navigator.clipboard.writeText(shareLinkInput.value);
            
            // Visual feedback
            const originalText = copyLinkBtn.textContent;
            copyLinkBtn.textContent = 'Copied!';
            copyLinkBtn.style.background = '#28a745';
            
            setTimeout(() => {
                copyLinkBtn.textContent = originalText;
                copyLinkBtn.style.background = '';
            }, 2000);
            
        } catch (error) {
            console.error('Failed to copy:', error);
            // Fallback for older browsers
            shareLinkInput.select();
            document.execCommand('copy');
            
            copyLinkBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyLinkBtn.textContent = 'Copy Link';
            }, 2000);
        }
    }

    // Show error message
    function showError(message) {
        // Create error element if it doesn't exist
        let errorDiv = document.getElementById('error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'error-message';
            errorDiv.style.cssText = `
                background: #ff6b6b;
                color: white;
                padding: 1rem;
                border-radius: 10px;
                margin: 1rem 0;
                text-align: center;
                animation: fadeIn 0.3s ease;
            `;
            
            const createRoomSection = document.querySelector('.create-room-section');
            createRoomSection.appendChild(errorDiv);
        }
        
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    // Handle URL parameters (if someone visits with a room ID)
    function checkUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('room');
        
        if (roomId) {
            // Redirect to room page
            window.location.href = `room.html?room=${roomId}`;
        }
    }

    // Initialize
    checkUrlParameters();
    
    // Add some interactive features
    addInteractiveFeatures();
});

// Add interactive features to enhance UX
function addInteractiveFeatures() {
    // Add hover effects to feature cards
    const features = document.querySelectorAll('.feature');
    features.forEach(feature => {
        feature.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        feature.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-5px)';
        });
    });

    // Add floating animation to the logo
    const logo = document.querySelector('.logo');
    if (logo) {
        let isAnimating = false;
        logo.addEventListener('click', function() {
            if (!isAnimating) {
                isAnimating = true;
                this.style.animation = 'bounce 1s ease';
                setTimeout(() => {
                    this.style.animation = '';
                    isAnimating = false;
                }, 1000);
            }
        });
    }

    // Add CSS for bounce animation if not already present
    const style = document.createElement('style');
    style.textContent = `
        @keyframes bounce {
            0%, 20%, 60%, 100% {
                transform: translateY(0);
            }
            40% {
                transform: translateY(-20px);
            }
            80% {
                transform: translateY(-10px);
            }
        }
        
        .video-input:focus, .create-btn:focus {
            outline: 3px solid rgba(102, 126, 234, 0.3);
            outline-offset: 2px;
        }
        
        .create-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none !important;
        }
        
        .feature {
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(style);

    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        // Press 'c' to focus on create room input
        if (e.key === 'c' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            document.getElementById('videoUrl').focus();
        }
        
        // Press 'Escape' to hide room created section
        if (e.key === 'Escape') {
            const roomCreated = document.getElementById('roomCreated');
            if (!roomCreated.classList.contains('hidden')) {
                roomCreated.classList.add('hidden');
            }
        }
    });

    console.log('🟣 SyncStream loaded successfully!');
    console.log('💡 Tip: Press "c" to quickly focus on the video URL input');
}
