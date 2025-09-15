/**
 * SYNCSTREAM PICTURE-IN-PICTURE MODE
 * Smart floating video with drag & resize functionality
 */

class PictureInPictureMode {
    constructor() {
        this.isActive = false;
        this.pipContainer = null;
        this.originalParent = null;
        this.videoElement = null;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.startLeft = 0;
        this.startTop = 0;
        
        this.init();
    }
    
    init() {
        this.createPipButton();
        this.createPipContainer();
        this.bindEvents();
    }
    
    createPipButton() {
        const videoControls = document.querySelector('.video-controls');
        if (!videoControls) return;
        
        const pipBtn = document.createElement('button');
        pipBtn.id = 'pipModeBtn';
        pipBtn.className = 'btn btn-sm btn-secondary btn-secondary-luxury glow-on-hover';
        pipBtn.innerHTML = '<span>📺 PiP</span>';
        pipBtn.setAttribute('aria-label', 'Toggle picture-in-picture mode');
        pipBtn.setAttribute('title', 'Floating video window');
        
        pipBtn.addEventListener('click', () => this.toggle());
        videoControls.appendChild(pipBtn);
    }
    
    createPipContainer() {
        this.pipContainer = document.createElement('div');
        this.pipContainer.id = 'pip-container';
        this.pipContainer.className = 'pip-container glass-luxury';
        this.pipContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 320px;
            height: 180px;
            background: rgba(0, 0, 0, 0.9);
            border-radius: 15px;
            overflow: hidden;
            z-index: 9999;
            cursor: move;
            display: none;
            backdrop-filter: blur(20px);
            border: 2px solid rgba(255, 215, 0, 0.3);
            box-shadow: 
                0 20px 40px rgba(0, 0, 0, 0.4),
                0 0 0 1px rgba(255, 255, 255, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
            resize: both;
            min-width: 240px;
            min-height: 135px;
            max-width: 80vw;
            max-height: 80vh;
        `;
        
        // Add PiP controls
        const pipControls = document.createElement('div');
        pipControls.className = 'pip-controls';
        pipControls.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            display: flex;
            gap: 8px;
            z-index: 10001;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.className = 'pip-close-btn';
        closeBtn.style.cssText = `
            background: rgba(255, 0, 0, 0.8);
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeBtn.addEventListener('click', () => this.toggle());
        
        const expandBtn = document.createElement('button');
        expandBtn.innerHTML = '⛶';
        expandBtn.className = 'pip-expand-btn';
        expandBtn.style.cssText = `
            background: rgba(108, 99, 255, 0.8);
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        expandBtn.addEventListener('click', () => this.expandPip());
        
        pipControls.appendChild(expandBtn);
        pipControls.appendChild(closeBtn);
        this.pipContainer.appendChild(pipControls);
        
        document.body.appendChild(this.pipContainer);
    }
    
    toggle() {
        if (this.isActive) {
            this.exitPipMode();
        } else {
            this.enterPipMode();
        }
    }
    
    enterPipMode() {
        const videoPlayer = document.querySelector('#videoPlayer, #player');
        if (!videoPlayer) return;
        
        this.isActive = true;
        this.originalParent = videoPlayer.parentElement;
        this.videoElement = videoPlayer;
        
        // Move video to PiP container
        this.pipContainer.appendChild(videoPlayer);
        this.pipContainer.style.display = 'block';
        
        // Style video for PiP
        videoPlayer.style.cssText = `
            width: 100% !important;
            height: 100% !important;
            object-fit: cover;
        `;
        
        // Update button
        const btn = document.getElementById('pipModeBtn');
        if (btn) {
            btn.innerHTML = '<span>📱 Exit PiP</span>';
            btn.setAttribute('aria-label', 'Exit picture-in-picture mode');
        }
        
        // Show notification
        this.showPipNotification('Picture-in-Picture Activated', '📺');
        
        // Add hover effects
        this.pipContainer.addEventListener('mouseenter', this.showPipControls);
        this.pipContainer.addEventListener('mouseleave', this.hidePipControls);
        
        console.log('PiP mode activated');
    }
    
    exitPipMode() {
        if (!this.videoElement || !this.originalParent) return;
        
        this.isActive = false;
        
        // Move video back to original container
        this.originalParent.appendChild(this.videoElement);
        this.pipContainer.style.display = 'none';
        
        // Reset video styles
        this.videoElement.style.cssText = '';
        
        // Update button
        const btn = document.getElementById('pipModeBtn');
        if (btn) {
            btn.innerHTML = '<span>📺 PiP</span>';
            btn.setAttribute('aria-label', 'Toggle picture-in-picture mode');
        }
        
        this.showPipNotification('Picture-in-Picture Deactivated', '📱');
        
        console.log('PiP mode deactivated');
    }
    
    expandPip() {
        if (!this.isActive) return;
        
        // Animate to larger size
        this.pipContainer.style.transition = 'all 0.5s ease';
        this.pipContainer.style.width = '480px';
        this.pipContainer.style.height = '270px';
        this.pipContainer.style.top = '50%';
        this.pipContainer.style.left = '50%';
        this.pipContainer.style.transform = 'translate(-50%, -50%)';
        
        setTimeout(() => {
            this.pipContainer.style.transition = 'all 0.3s ease';
            this.pipContainer.style.transform = '';
        }, 500);
    }
    
    showPipControls() {
        const controls = document.querySelector('.pip-controls');
        if (controls) controls.style.opacity = '1';
    }
    
    hidePipControls() {
        const controls = document.querySelector('.pip-controls');
        if (controls) controls.style.opacity = '0';
    }
    
    showPipNotification(message, icon) {
        const notification = document.createElement('div');
        notification.className = 'pip-notification';
        notification.innerHTML = `
            <div class="pip-icon">${icon}</div>
            <div class="pip-message">${message}</div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-100%);
            background: rgba(138, 43, 226, 0.9);
            color: white;
            padding: 0.8rem 1.5rem;
            border-radius: 25px;
            font-size: 0.9rem;
            font-weight: 600;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            backdrop-filter: blur(20px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            transition: all 0.4s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);
        
        // Animate out
        setTimeout(() => {
            notification.style.transform = 'translateX(-50%) translateY(-100%)';
            setTimeout(() => notification.remove(), 400);
        }, 2500);
    }
    
    bindEvents() {
        // Drag functionality
        this.pipContainer.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('pip-close-btn') || 
                e.target.classList.contains('pip-expand-btn')) return;
            
            this.isDragging = true;
            this.startX = e.clientX;
            this.startY = e.clientY;
            
            const rect = this.pipContainer.getBoundingClientRect();
            this.startLeft = rect.left;
            this.startTop = rect.top;
            
            this.pipContainer.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const deltaX = e.clientX - this.startX;
            const deltaY = e.clientY - this.startY;
            
            let newLeft = this.startLeft + deltaX;
            let newTop = this.startTop + deltaY;
            
            // Keep within viewport bounds
            const containerRect = this.pipContainer.getBoundingClientRect();
            newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - containerRect.width));
            newTop = Math.max(0, Math.min(newTop, window.innerHeight - containerRect.height));
            
            this.pipContainer.style.left = newLeft + 'px';
            this.pipContainer.style.top = newTop + 'px';
            this.pipContainer.style.right = 'auto';
            this.pipContainer.style.bottom = 'auto';
        });
        
        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.pipContainer.style.cursor = 'move';
                document.body.style.userSelect = '';
            }
        });
        
        // Double-click to expand
        this.pipContainer.addEventListener('dblclick', () => {
            this.expandPip();
        });
        
        // Escape key to exit
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.exitPipMode();
            }
        });
    }
}

// Add PiP CSS
const pipStyles = document.createElement('style');
pipStyles.textContent = `
    .pip-container:hover {
        border-color: rgba(255, 215, 0, 0.6);
        box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.5),
            0 0 0 2px rgba(255, 215, 0, 0.3),
            0 0 20px rgba(255, 215, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
    }
    
    .pip-close-btn:hover,
    .pip-expand-btn:hover {
        transform: scale(1.1);
        transition: transform 0.2s ease;
    }
    
    .pip-container::after {
        content: '↘';
        position: absolute;
        bottom: 4px;
        right: 4px;
        color: rgba(255, 255, 255, 0.5);
        font-size: 12px;
        pointer-events: none;
    }
`;
document.head.appendChild(pipStyles);

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pictureInPictureMode = new PictureInPictureMode();
    });
} else {
    window.pictureInPictureMode = new PictureInPictureMode();
}
