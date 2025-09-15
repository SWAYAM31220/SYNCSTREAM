/**
 * SYNCSTREAM VIDEO REACTIONS
 * Real-time floating emoji reactions synchronized across all users
 */

class VideoReactionSystem {
    constructor() {
        this.reactions = [];
        this.reactionPool = [];
        this.availableReactions = [
            { emoji: '❤️', name: 'love', color: '#ff4757', weight: 1.2 },
            { emoji: '😂', name: 'laugh', color: '#ffa502', weight: 1.0 },
            { emoji: '😮', name: 'wow', color: '#3742fa', weight: 0.9 },
            { emoji: '😢', name: 'sad', color: '#5352ed', weight: 1.1 },
            { emoji: '👍', name: 'like', color: '#2ed573', weight: 0.8 },
            { emoji: '👎', name: 'dislike', color: '#ff6348', weight: 0.8 },
            { emoji: '🔥', name: 'fire', color: '#ff9f43', weight: 1.3 },
            { emoji: '💯', name: 'hundred', color: '#ffd700', weight: 1.4 },
            { emoji: '🎉', name: 'party', color: '#ff6b81', weight: 1.2 },
            { emoji: '😴', name: 'sleep', color: '#a4b0be', weight: 0.7 }
        ];
        this.reactionHistory = new Map();
        this.maxReactions = 100;
        this.isInitialized = false;
        this.videoContainer = null;
        this.reactionContainer = null;
        this.reactionPanel = null;
        this.toastManager = null;
        this.roomManager = null;
        
        this.init();
    }
    
    init() {
        this.toastManager = window.ToastManager ? new window.ToastManager() : null;
        this.roomManager = window.roomManager || null;
        this.setupReactionContainer();
        this.createReactionPanel();
        this.bindEvents();
        this.startReactionEngine();
        this.isInitialized = true;
        
        console.log('🎭 Video Reaction System initialized');
    }
    
    setupReactionContainer() {
        // Find video container
        this.videoContainer = document.querySelector('.video-section, .video-container, #videoPlayer');
        
        if (!this.videoContainer) {
            console.warn('Video container not found, creating fallback');
            this.videoContainer = document.body;
        }
        
        // Create reactions overlay
        this.reactionContainer = document.createElement('div');
        this.reactionContainer.id = 'reactionsOverlay';
        this.reactionContainer.className = 'reactions-overlay';
        this.reactionContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
            overflow: hidden;
        `;
        
        // Make video container relative if not already
        const computedStyle = window.getComputedStyle(this.videoContainer);
        if (computedStyle.position === 'static') {
            this.videoContainer.style.position = 'relative';
        }
        
        this.videoContainer.appendChild(this.reactionContainer);
    }
    
    createReactionPanel() {
        // Create floating reaction panel
        this.reactionPanel = document.createElement('div');
        this.reactionPanel.id = 'reactionPanel';
        this.reactionPanel.className = 'reaction-panel glass-luxury';
        this.reactionPanel.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            background: rgba(108, 99, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 215, 0, 0.3);
            border-radius: 50px;
            padding: 0.5rem;
            display: none;
            flex-direction: column;
            gap: 0.5rem;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        // Add reaction buttons
        this.availableReactions.forEach(reaction => {
            const reactionBtn = document.createElement('button');
            reactionBtn.className = 'reaction-btn';
            reactionBtn.dataset.reaction = reaction.name;
            reactionBtn.innerHTML = reaction.emoji;
            reactionBtn.style.cssText = `
                width: 50px;
                height: 50px;
                border-radius: 50%;
                border: none;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                overflow: hidden;
            `;
            
            // Add hover effects
            reactionBtn.addEventListener('mouseenter', () => {
                reactionBtn.style.transform = 'scale(1.2)';
                reactionBtn.style.background = `${reaction.color}20`;
                reactionBtn.style.boxShadow = `0 0 20px ${reaction.color}40`;
            });
            
            reactionBtn.addEventListener('mouseleave', () => {
                reactionBtn.style.transform = 'scale(1)';
                reactionBtn.style.background = 'rgba(255, 255, 255, 0.1)';
                reactionBtn.style.boxShadow = 'none';
            });
            
            // Add click handler
            reactionBtn.addEventListener('click', () => {
                this.addReaction(reaction.emoji, reaction);
                this.vibrate(50);
            });
            
            this.reactionPanel.appendChild(reactionBtn);
        });
        
        // Add quick reaction toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'reactionToggle';
        toggleBtn.className = 'reaction-toggle btn btn-primary-luxury magnetic-hover';
        toggleBtn.innerHTML = '<span>😊</span>';
        toggleBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        `;
        
        toggleBtn.addEventListener('click', () => {
            this.toggleReactionPanel();
        });
        
        document.body.appendChild(this.reactionPanel);
        document.body.appendChild(toggleBtn);
    }
    
    toggleReactionPanel() {
        const isVisible = this.reactionPanel.style.transform === 'translateX(0px)';
        
        if (isVisible) {
            this.hideReactionPanel();
        } else {
            this.showReactionPanel();
        }
    }
    
    showReactionPanel() {
        this.reactionPanel.style.display = 'flex';
        setTimeout(() => {
            this.reactionPanel.style.transform = 'translateX(0)';
        }, 50);
        
        // Auto-hide after 5 seconds of inactivity
        clearTimeout(this.panelTimeout);
        this.panelTimeout = setTimeout(() => {
            this.hideReactionPanel();
        }, 5000);
    }
    
    hideReactionPanel() {
        this.reactionPanel.style.transform = 'translateX(100%)';
        setTimeout(() => {
            this.reactionPanel.style.display = 'none';
        }, 300);
    }
    
    addReaction(emoji, reactionData = null, position = null, userId = null) {
        if (!this.reactionContainer) return;
        
        // Find reaction data if not provided
        if (!reactionData) {
            reactionData = this.availableReactions.find(r => r.emoji === emoji) || 
                          { emoji, name: 'custom', color: '#ffffff', weight: 1.0 };
        }
        
        // Generate random position if not provided
        if (!position) {
            position = {
                x: Math.random() * (this.reactionContainer.offsetWidth - 50),
                y: Math.random() * (this.reactionContainer.offsetHeight - 50)
            };
        }
        
        // Create reaction element
        const reactionElement = this.createReactionElement(reactionData, position);
        
        // Add to container
        this.reactionContainer.appendChild(reactionElement);
        
        // Store reaction data
        this.reactions.push({
            id: Date.now() + Math.random(),
            emoji,
            element: reactionElement,
            data: reactionData,
            position,
            timestamp: Date.now(),
            userId: userId || this.getCurrentUserId()
        });
        
        // Update reaction history
        this.updateReactionHistory(reactionData.name);
        
        // Sync with other users if in room
        if (this.roomManager && !userId) {
            this.syncReaction(emoji, reactionData, position);
        }
        
        // Show success feedback
        if (!userId && this.toastManager) {
            this.toastManager.info(`Added ${emoji} reaction!`);
        }
        
        // Clean up old reactions
        this.cleanupReactions();
        
        // Hide panel after reaction
        if (!userId) {
            this.hideReactionPanel();
        }
    }
    
    createReactionElement(reactionData, position) {
        const element = document.createElement('div');
        element.className = 'floating-reaction';
        element.innerHTML = reactionData.emoji;
        
        // Apply base styles
        element.style.cssText = `
            position: absolute;
            left: ${position.x}px;
            top: ${position.y}px;
            font-size: 2rem;
            pointer-events: none;
            z-index: 1001;
            user-select: none;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            animation: reactionFloat ${3 + Math.random() * 2}s ease-out forwards;
            transform: scale(0);
        `;
        
        // Add glow effect
        element.style.filter = `drop-shadow(0 0 10px ${reactionData.color}80)`;
        
        // Start animation after a brief delay
        setTimeout(() => {
            element.style.transform = 'scale(1)';
            element.style.animation = `
                reactionFloat ${3 + Math.random() * 2}s ease-out forwards,
                reactionGlow ${1 + Math.random()}s ease-in-out infinite alternate
            `;
        }, 50);
        
        // Add physics-based movement
        this.applyReactionPhysics(element, reactionData);
        
        return element;
    }
    
    applyReactionPhysics(element, reactionData) {
        const startTime = Date.now();
        const duration = 3000 + Math.random() * 2000;
        const initialY = parseFloat(element.style.top);
        const targetY = initialY - (100 + Math.random() * 100);
        const drift = (Math.random() - 0.5) * 50;
        const weight = reactionData.weight || 1.0;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                element.remove();
                return;
            }
            
            // Apply easing function
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            // Calculate position
            const currentY = initialY + (targetY - initialY) * easeOut;
            const currentX = parseFloat(element.style.left) + (drift * progress * 0.01);
            
            // Apply weight effect
            const weightedY = currentY + (weight - 1) * 10 * Math.sin(progress * Math.PI);
            
            // Update position
            element.style.top = weightedY + 'px';
            element.style.left = currentX + 'px';
            
            // Apply opacity fade
            element.style.opacity = 1 - (progress * 0.8);
            
            // Apply scale effect
            const scale = 1 + (Math.sin(progress * Math.PI * 2) * 0.1);
            element.style.transform = `scale(${scale})`;
            
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }
    
    updateReactionHistory(reactionName) {
        const current = this.reactionHistory.get(reactionName) || 0;
        this.reactionHistory.set(reactionName, current + 1);
        
        // Update analytics if available
        if (window.analyticsDashboard) {
            window.analyticsDashboard.trackEvent('emoji_reaction', {
                emoji: reactionName,
                timestamp: Date.now()
            });
        }
    }
    
    syncReaction(emoji, reactionData, position) {
        if (!this.roomManager || typeof this.roomManager.broadcastReaction !== 'function') {
            // Fallback: store for later sync
            this.storeReactionForSync(emoji, reactionData, position);
            return;
        }
        
        this.roomManager.broadcastReaction({
            emoji,
            reactionData,
            position,
            timestamp: Date.now(),
            userId: this.getCurrentUserId()
        });
    }
    
    storeReactionForSync(emoji, reactionData, position) {
        // Store reaction for later synchronization
        const pendingReactions = JSON.parse(localStorage.getItem('syncstream_pending_reactions') || '[]');
        pendingReactions.push({
            emoji,
            reactionData,
            position,
            timestamp: Date.now(),
            userId: this.getCurrentUserId()
        });
        localStorage.setItem('syncstream_pending_reactions', JSON.stringify(pendingReactions));
    }
    
    receiveReaction(reactionData) {
        // Receive reaction from another user
        this.addReaction(
            reactionData.emoji,
            reactionData.reactionData,
            reactionData.position,
            reactionData.userId
        );
    }
    
    cleanupReactions() {
        // Remove reactions that exceed the maximum limit
        if (this.reactions.length > this.maxReactions) {
            const reactionsToRemove = this.reactions.splice(0, this.reactions.length - this.maxReactions);
            reactionsToRemove.forEach(reaction => {
                if (reaction.element && reaction.element.parentNode) {
                    reaction.element.remove();
                }
            });
        }
        
        // Remove expired reactions
        const now = Date.now();
        this.reactions = this.reactions.filter(reaction => {
            if (now - reaction.timestamp > 10000) { // 10 seconds
                if (reaction.element && reaction.element.parentNode) {
                    reaction.element.remove();
                }
                return false;
            }
            return true;
        });
    }
    
    startReactionEngine() {
        // Start the reaction engine that handles cleanup and animations
        setInterval(() => {
            this.cleanupReactions();
        }, 1000);
        
        // Start reaction burst system for special moments
        this.startReactionBurstDetection();
    }
    
    startReactionBurstDetection() {
        // Detect when multiple users react at the same time
        let recentReactions = [];
        
        setInterval(() => {
            const now = Date.now();
            
            // Remove old reactions from recent list
            recentReactions = recentReactions.filter(r => now - r.timestamp < 3000);
            
            // Check for burst (5+ reactions in 3 seconds)
            if (recentReactions.length >= 5) {
                this.triggerReactionBurst(recentReactions);
                recentReactions = []; // Reset to prevent repeated bursts
            }
        }, 500);
        
        // Track all reactions
        const originalAddReaction = this.addReaction.bind(this);
        this.addReaction = (emoji, reactionData, position, userId) => {
            originalAddReaction(emoji, reactionData, position, userId);
            recentReactions.push({
                emoji,
                timestamp: Date.now(),
                userId: userId || this.getCurrentUserId()
            });
        };
    }
    
    triggerReactionBurst(reactions) {
        // Create spectacular burst effect
        if (this.toastManager) {
            this.toastManager.success('🎆 Reaction burst!', 'Amazing!');
        }
        
        // Create burst animation
        this.createBurstEffect(reactions);
        
        // Vibrate for mobile users
        this.vibrate([100, 50, 100, 50, 200]);
    }
    
    createBurstEffect(reactions) {
        const burstContainer = document.createElement('div');
        burstContainer.className = 'reaction-burst';
        burstContainer.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 1002;
        `;
        
        // Create burst particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            const reaction = reactions[i % reactions.length];
            particle.innerHTML = reaction.emoji;
            particle.style.cssText = `
                position: absolute;
                font-size: 1.5rem;
                animation: burstParticle 2s ease-out forwards;
                animation-delay: ${i * 0.1}s;
                transform: translate(-50%, -50%);
            `;
            
            // Random direction
            const angle = (i / 20) * Math.PI * 2;
            const distance = 100 + Math.random() * 100;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance;
            
            particle.style.setProperty('--end-x', endX + 'px');
            particle.style.setProperty('--end-y', endY + 'px');
            
            burstContainer.appendChild(particle);
        }
        
        this.reactionContainer.appendChild(burstContainer);
        
        // Remove burst after animation
        setTimeout(() => {
            burstContainer.remove();
        }, 3000);
    }
    
    getCurrentUserId() {
        // Get current user ID from user profile system or generate one
        if (window.userProfileSystem && window.userProfileSystem.getCurrentUser()) {
            return window.userProfileSystem.getCurrentUser().id;
        }
        
        // Fallback: use session storage
        let userId = sessionStorage.getItem('syncstream_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('syncstream_user_id', userId);
        }
        return userId;
    }
    
    bindEvents() {
        // Keyboard shortcuts for quick reactions
        document.addEventListener('keydown', (e) => {
            if (e.target.matches('input, textarea, [contenteditable]')) return;
            
            const reactionMap = {
                '1': '❤️', '2': '😂', '3': '😮', '4': '😢', '5': '👍',
                '6': '👎', '7': '🔥', '8': '💯', '9': '🎉', '0': '😴'
            };
            
            if (reactionMap[e.key]) {
                e.preventDefault();
                const reactionData = this.availableReactions.find(r => r.emoji === reactionMap[e.key]);
                this.addReaction(reactionMap[e.key], reactionData);
            }
        });
        
        // Double-click anywhere on video to add heart reaction
        if (this.videoContainer) {
            this.videoContainer.addEventListener('dblclick', (e) => {
                const rect = this.reactionContainer.getBoundingClientRect();
                const position = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
                
                const heartReaction = this.availableReactions.find(r => r.emoji === '❤️');
                this.addReaction('❤️', heartReaction, position);
            });
        }
        
        // Long press on mobile to show reaction panel
        let longPressTimer;
        let longPressActive = false;
        
        document.addEventListener('touchstart', (e) => {
            longPressActive = true;
            longPressTimer = setTimeout(() => {
                if (longPressActive) {
                    this.showReactionPanel();
                    this.vibrate(50);
                }
            }, 500);
        });
        
        document.addEventListener('touchend', () => {
            longPressActive = false;
            clearTimeout(longPressTimer);
        });
        
        document.addEventListener('touchmove', () => {
            longPressActive = false;
            clearTimeout(longPressTimer);
        });
        
        // Hide panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#reactionPanel, #reactionToggle')) {
                this.hideReactionPanel();
            }
        });
        
        // Handle room events
        if (this.roomManager) {
            // Listen for incoming reactions
            document.addEventListener('reaction_received', (e) => {
                this.receiveReaction(e.detail);
            });
        }
    }
    
    vibrate(pattern) {
        if ('vibrate' in navigator && window.mobileFeatures && window.mobileFeatures.vibrationEnabled) {
            navigator.vibrate(pattern);
        }
    }
    
    // Public API methods
    
    getReactionHistory() {
        return Object.fromEntries(this.reactionHistory);
    }
    
    getMostPopularReaction() {
        let maxCount = 0;
        let popularReaction = null;
        
        for (const [reaction, count] of this.reactionHistory) {
            if (count > maxCount) {
                maxCount = count;
                popularReaction = reaction;
            }
        }
        
        return popularReaction;
    }
    
    clearAllReactions() {
        this.reactions.forEach(reaction => {
            if (reaction.element && reaction.element.parentNode) {
                reaction.element.remove();
            }
        });
        this.reactions = [];
        
        if (this.toastManager) {
            this.toastManager.info('All reactions cleared');
        }
    }
    
    addCustomReaction(emoji, name, color = '#ffffff', weight = 1.0) {
        const customReaction = { emoji, name, color, weight };
        this.availableReactions.push(customReaction);
        
        // Rebuild reaction panel
        this.rebuildReactionPanel();
        
        if (this.toastManager) {
            this.toastManager.success(`Added custom reaction: ${emoji}`);
        }
    }
    
    rebuildReactionPanel() {
        // Remove existing panel content
        const existingButtons = this.reactionPanel.querySelectorAll('.reaction-btn');
        existingButtons.forEach(btn => btn.remove());
        
        // Re-add all reaction buttons
        this.availableReactions.forEach(reaction => {
            // ... (same button creation code as in createReactionPanel)
        });
    }
    
    exportReactionData() {
        return {
            reactions: this.reactions.map(r => ({
                emoji: r.emoji,
                timestamp: r.timestamp,
                userId: r.userId
            })),
            history: Object.fromEntries(this.reactionHistory),
            totalReactions: this.reactions.length
        };
    }
    
    importReactionData(data) {
        // Import reaction history
        if (data.history) {
            this.reactionHistory = new Map(Object.entries(data.history));
        }
        
        // Replay recent reactions
        if (data.reactions) {
            const recentReactions = data.reactions.filter(r => 
                Date.now() - r.timestamp < 30000 // Last 30 seconds
            );
            
            recentReactions.forEach(reaction => {
                const reactionData = this.availableReactions.find(r => r.emoji === reaction.emoji);
                if (reactionData) {
                    this.addReaction(reaction.emoji, reactionData, null, reaction.userId);
                }
            });
        }
    }
}

// Add reaction CSS animations
const reactionStyles = document.createElement('style');
reactionStyles.textContent = `
    @keyframes reactionFloat {
        0% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
        }
        10% {
            opacity: 1;
            transform: scale(1.2) rotate(5deg);
        }
        50% {
            opacity: 1;
            transform: scale(1) rotate(-2deg);
        }
        100% {
            opacity: 0;
            transform: scale(0.8) rotate(3deg) translateY(-100px);
        }
    }
    
    @keyframes reactionGlow {
        0% {
            filter: drop-shadow(0 0 5px currentColor);
        }
        100% {
            filter: drop-shadow(0 0 15px currentColor) brightness(1.2);
        }
    }
    
    @keyframes burstParticle {
        0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        100% {
            opacity: 0;
            transform: translate(calc(-50% + var(--end-x)), calc(-50% + var(--end-y))) scale(0.5);
        }
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .reaction-btn:active {
        transform: scale(0.9);
    }
    
    .reaction-toggle:hover {
        transform: scale(1.1);
    }
    
    .floating-reaction {
        will-change: transform, opacity;
        backface-visibility: hidden;
    }
    
    .reactions-overlay {
        will-change: contents;
    }
    
    .reaction-panel {
        will-change: transform;
    }
    
    /* Mobile optimizations */
    @media (max-width: 768px) {
        .reaction-panel {
            bottom: 80px;
            right: 10px;
        }
        
        .reaction-toggle {
            bottom: 10px;
            right: 10px;
            width: 50px !important;
            height: 50px !important;
        }
        
        .floating-reaction {
            font-size: 1.5rem !important;
        }
        
        .reaction-btn {
            width: 40px !important;
            height: 40px !important;
            font-size: 1.2rem !important;
        }
    }
    
    /* High contrast mode support */
    @media (prefers-contrast: high) {
        .floating-reaction {
            text-shadow: 2px 2px 4px #000000;
            filter: none !important;
        }
        
        .reaction-panel {
            border-width: 2px;
            background: rgba(0, 0, 0, 0.8);
        }
    }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
        .floating-reaction {
            animation-duration: 1s !important;
        }
        
        .reaction-panel {
            transition-duration: 0.1s !important;
        }
        
        @keyframes reactionFloat {
            0% { opacity: 0; transform: scale(0); }
            50% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0.8) translateY(-50px); }
        }
    }
`;
document.head.appendChild(reactionStyles);

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.videoReactionSystem = new VideoReactionSystem();
    });
} else {
    window.videoReactionSystem = new VideoReactionSystem();
}
