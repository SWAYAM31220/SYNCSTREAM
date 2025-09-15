/**
 * SYNCSTREAM THEATER MODE
 * Immersive fullscreen viewing experience with ambient lighting
 */

class TheaterMode {
    constructor() {
        this.isActive = false;
        this.ambientLighting = null;
        this.originalStyles = new Map();
        this.canvas = null;
        this.ctx = null;
        this.videoElement = null;
        
        this.init();
    }
    
    init() {
        this.createTheaterButton();
        this.setupAmbientCanvas();
        this.bindEvents();
    }
    
    createTheaterButton() {
        const videoControls = document.querySelector('.video-controls');
        if (!videoControls) return;
        
        const theaterBtn = document.createElement('button');
        theaterBtn.id = 'theaterModeBtn';
        theaterBtn.className = 'btn btn-sm btn-secondary btn-secondary-luxury magnetic-hover';
        theaterBtn.innerHTML = '<span>🎭 Theater</span>';
        theaterBtn.setAttribute('aria-label', 'Toggle theater mode');
        theaterBtn.setAttribute('title', 'Immersive theater experience');
        
        theaterBtn.addEventListener('click', () => this.toggle());
        videoControls.appendChild(theaterBtn);
    }
    
    setupAmbientCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'ambient-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            pointer-events: none;
            opacity: 0;
            transition: opacity 1s ease;
            mix-blend-mode: multiply;
        `;
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
    }
    
    toggle() {
        if (this.isActive) {
            this.exitTheaterMode();
        } else {
            this.enterTheaterMode();
        }
    }
    
    enterTheaterMode() {
        this.isActive = true;
        
        // Hide UI elements
        this.hideUIElements();
        
        // Style video container
        this.styleVideoContainer();
        
        // Start ambient lighting
        this.startAmbientLighting();
        
        // Add theater class to body
        document.body.classList.add('theater-mode');
        
        // Update button
        const btn = document.getElementById('theaterModeBtn');
        if (btn) {
            btn.innerHTML = '<span>🚪 Exit Theater</span>';
            btn.setAttribute('aria-label', 'Exit theater mode');
        }
        
        // Show notification
        this.showTheaterNotification('Theater Mode Activated', '🎭');
        
        console.log('Theater mode activated');
    }
    
    exitTheaterMode() {
        this.isActive = false;
        
        // Restore UI elements
        this.restoreUIElements();
        
        // Stop ambient lighting
        this.stopAmbientLighting();
        
        // Remove theater class
        document.body.classList.remove('theater-mode');
        
        // Update button
        const btn = document.getElementById('theaterModeBtn');
        if (btn) {
            btn.innerHTML = '<span>🎭 Theater</span>';
            btn.setAttribute('aria-label', 'Toggle theater mode');
        }
        
        this.showTheaterNotification('Theater Mode Deactivated', '🚪');
        
        console.log('Theater mode deactivated');
    }
    
    hideUIElements() {
        const elementsToHide = [
            '.room-header',
            '.chat-section', 
            '.video-queue',
            '.scroll-progress',
            'header',
            '.site-header'
        ];
        
        elementsToHide.forEach(selector => {
            const element = document.querySelector(selector);
            if (element && !element.classList.contains('hidden')) {
                this.originalStyles.set(selector, {
                    display: element.style.display || '',
                    opacity: element.style.opacity || '',
                    transform: element.style.transform || ''
                });
                
                element.style.transition = 'all 0.8s ease';
                element.style.opacity = '0';
                element.style.transform = 'translateY(-20px)';
                
                setTimeout(() => {
                    element.style.display = 'none';
                }, 800);
            }
        });
    }
    
    restoreUIElements() {
        this.originalStyles.forEach((styles, selector) => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.display = styles.display;
                element.style.opacity = styles.opacity;
                element.style.transform = styles.transform;
                element.style.transition = 'all 0.8s ease';
            }
        });
        this.originalStyles.clear();
    }
    
    styleVideoContainer() {
        const videoSection = document.querySelector('.video-section, .video-container');
        if (videoSection) {
            videoSection.style.cssText += `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                z-index: 1000 !important;
                background: #000 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                transition: all 1s ease !important;
            `;
            
            const videoPlayer = videoSection.querySelector('#videoPlayer, #player');
            if (videoPlayer) {
                videoPlayer.style.cssText += `
                    width: 100% !important;
                    height: 100% !important;
                    max-width: 100vw !important;
                    max-height: 100vh !important;
                `;
                this.videoElement = videoPlayer;
            }
        }
    }
    
    startAmbientLighting() {
        if (!this.videoElement || !this.canvas) return;
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.opacity = '0.3';
        
        this.ambientLighting = setInterval(() => {
            this.updateAmbientColors();
        }, 100);
    }
    
    stopAmbientLighting() {
        if (this.ambientLighting) {
            clearInterval(this.ambientLighting);
            this.ambientLighting = null;
        }
        if (this.canvas) {
            this.canvas.style.opacity = '0';
        }
        
        // Reset video container
        const videoSection = document.querySelector('.video-section, .video-container');
        if (videoSection) {
            videoSection.style.cssText = '';
        }
    }
    
    updateAmbientColors() {
        if (!this.ctx || !this.videoElement) return;
        
        try {
            // Create ambient glow based on video colors
            const colors = [
                'rgba(108, 99, 255, 0.1)',
                'rgba(255, 215, 0, 0.1)', 
                'rgba(138, 43, 226, 0.1)'
            ];
            
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Create radial gradients for ambient effect
            colors.forEach((color, i) => {
                const gradient = this.ctx.createRadialGradient(
                    this.canvas.width * (i * 0.3 + 0.2), 
                    this.canvas.height * 0.5,
                    0,
                    this.canvas.width * (i * 0.3 + 0.2),
                    this.canvas.height * 0.5,
                    this.canvas.width * 0.4
                );
                
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, 'transparent');
                
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            });
            
        } catch (e) {
            console.warn('Ambient lighting error:', e);
        }
    }
    
    showTheaterNotification(message, icon) {
        // Create theater notification
        const notification = document.createElement('div');
        notification.className = 'theater-notification';
        notification.innerHTML = `
            <div class="theater-icon">${icon}</div>
            <div class="theater-message">${message}</div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 50px;
            right: 50px;
            background: rgba(108, 99, 255, 0.9);
            color: white;
            padding: 1rem 2rem;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 600;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 1rem;
            backdrop-filter: blur(20px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            transition: all 0.5s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Animate out
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
    
    bindEvents() {
        // Exit on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.exitTheaterMode();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.canvas && this.isActive) {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            }
        });
    }
}

// Add theater mode CSS
const theaterStyles = document.createElement('style');
theaterStyles.textContent = `
    .theater-mode {
        overflow: hidden;
    }
    
    .theater-mode .video-controls {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10001;
        background: rgba(0, 0, 0, 0.8);
        padding: 1rem 2rem;
        border-radius: 50px;
        backdrop-filter: blur(20px);
    }
    
    .theater-icon {
        font-size: 1.5rem;
    }
    
    .theater-notification {
        animation: slideIn 0.5s ease;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
    }
`;
document.head.appendChild(theaterStyles);

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.theaterMode = new TheaterMode();
    });
} else {
    window.theaterMode = new TheaterMode();
}
