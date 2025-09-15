/* ==========================================================================
   SYNCSTREAM - ENHANCED MAIN JAVASCRIPT
   Production-Ready with Toast Notifications, Error Handling, and Security
   ========================================================================== */

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================

class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = new Map();
        this.init();
    }

    init() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            this.container.setAttribute('role', 'region');
            this.container.setAttribute('aria-live', 'polite');
            this.container.setAttribute('aria-label', 'Notifications');
            document.body.appendChild(this.container);
        }
    }

    show(message, type = 'info', duration = 5000, title = null) {
        const id = Date.now().toString();
        const toast = this.createToast(id, message, type, title);
        
        this.container.appendChild(toast);
        this.toasts.set(id, toast);

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(id);
            }, duration);
        }

        return id;
    }

    createToast(id, message, type, title) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');

        const header = document.createElement('div');
        header.className = 'toast-header';

        if (title) {
            const titleEl = document.createElement('h4');
            titleEl.className = 'toast-title';
            titleEl.textContent = title;
            header.appendChild(titleEl);
        }

        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '×';
        closeBtn.setAttribute('aria-label', 'Close notification');
        closeBtn.addEventListener('click', () => this.dismiss(id));
        header.appendChild(closeBtn);

        const messageEl = document.createElement('p');
        messageEl.className = 'toast-message';
        messageEl.textContent = message;

        toast.appendChild(header);
        toast.appendChild(messageEl);

        return toast;
    }

    dismiss(id) {
        const toast = this.toasts.get(id);
        if (toast) {
            toast.classList.add('toast-exit');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                this.toasts.delete(id);
            }, 200);
        }
    }

    success(message, title = 'Success') {
        return this.show(message, 'success', 4000, title);
    }

    error(message, title = 'Error') {
        return this.show(message, 'error', 8000, title);
    }

    warning(message, title = 'Warning') {
        return this.show(message, 'warning', 6000, title);
    }

    info(message, title = null) {
        return this.show(message, 'info', 5000, title);
    }
}

// Security utilities
class SecurityUtils {
    static sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    static validateURL(url) {
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
    }

    static validateYouTubeURL(url) {
        if (!this.validateURL(url)) return false;
        
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        return youtubeRegex.test(url);
    }

    static rateLimit(func, delay) {
        let timeoutId;
        let lastExecTime = 0;
        
        return function (...args) {
            const currentTime = Date.now();
            
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    }
}

// Performance utilities
class PerformanceUtils {
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static lazy(selector, callback) {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        callback(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            });

            document.querySelectorAll(selector).forEach(el => {
                observer.observe(el);
            });
        } else {
            // Fallback for older browsers
            document.querySelectorAll(selector).forEach(callback);
        }
    }
}

// ==========================================================================
// ENHANCED MAIN APPLICATION
// ==========================================================================

class EnhancedSyncStreamApp {
    constructor() {
        this.toast = new ToastManager();
        this.elements = {};
        this.currentRoomData = null;
        this.isSubmitting = false;
        this.connectionRetries = 0;
        this.maxRetries = 3;
        
        // Bind methods
        this.handleCreateRoom = this.handleCreateRoom.bind(this);
        this.handleCopyLink = this.handleCopyLink.bind(this);
        this.handleKeyboardShortcuts = this.handleKeyboardShortcuts.bind(this);
        
        this.init();
    }

    async init() {
        try {
            await this.waitForDOM();
            this.cacheElements();
            this.setupEventListeners();
            this.setupKeyboardShortcuts();
            this.setupPerformanceOptimizations();
            this.initializeFeatures();
            this.checkUrlParameters();
            
            console.log('🟣 Enhanced SyncStream initialized successfully');
        } catch (error) {
            console.error('Failed to initialize SyncStream:', error);
            this.toast.error('Failed to initialize application. Please refresh the page.');
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
            'videoUrl', 'createRoomBtn', 'roomCreated', 'shareLink', 
            'copyLinkBtn', 'joinRoomBtn', 'error-message'
        ];
        
        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });

        // Cache commonly used elements
        this.elements.form = document.querySelector('form.input-group');
        this.elements.features = document.querySelectorAll('.feature');
        this.elements.logo = document.querySelector('.logo');
        this.elements.createRoomSection = document.querySelector('.create-room-section');
    }

    setupEventListeners() {
        // Form submission
        if (this.elements.form) {
            this.elements.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateRoom();
            });
        }

        // Button clicks
        if (this.elements.createRoomBtn) {
            this.elements.createRoomBtn.addEventListener('click', (e) => {
                if (e.target.closest('form')) return; // Handled by form submit
                this.handleCreateRoom();
            });
        }

        if (this.elements.copyLinkBtn) {
            this.elements.copyLinkBtn.addEventListener('click', this.handleCopyLink);
        }

        // Input validation
        if (this.elements.videoUrl) {
            const debouncedValidation = PerformanceUtils.debounce(
                this.validateInput.bind(this), 
                300
            );
            this.elements.videoUrl.addEventListener('input', debouncedValidation);
            this.elements.videoUrl.addEventListener('paste', (e) => {
                setTimeout(debouncedValidation, 50);
            });
        }

        // Logo interaction
        if (this.elements.logo) {
            this.elements.logo.addEventListener('click', this.handleLogoClick.bind(this));
        }

        // Error handling for network issues
        window.addEventListener('online', () => {
            this.toast.success('Connection restored');
            this.connectionRetries = 0;
        });

        window.addEventListener('offline', () => {
            this.toast.warning('Connection lost. Some features may not work.');
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', this.handleKeyboardShortcuts);
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + Enter to create room
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (this.elements.videoUrl && this.elements.videoUrl === document.activeElement) {
                this.handleCreateRoom();
            }
        }

        // 'C' key to focus URL input
        if (e.key === 'c' && !e.target.matches('input, textarea, [contenteditable]')) {
            e.preventDefault();
            if (this.elements.videoUrl) {
                this.elements.videoUrl.focus();
                this.toast.info('Focus moved to video URL input', null);
            }
        }

        // Escape to hide room created section
        if (e.key === 'Escape') {
            this.hideRoomCreated();
        }
    }

    setupPerformanceOptimizations() {
        // Lazy load animations for feature cards
        PerformanceUtils.lazy('.feature', (feature) => {
            feature.style.opacity = '0';
            feature.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                feature.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                feature.style.opacity = '1';
                feature.style.transform = 'translateY(0)';
            }, 100 * Array.from(this.elements.features).indexOf(feature));
        });

        // Preload critical resources
        this.preloadCriticalResources();
    }

    preloadCriticalResources() {
        // Preload room.html for faster navigation
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = 'room.html';
        document.head.appendChild(link);

        // Preload YouTube iframe API
        const script = document.createElement('link');
        script.rel = 'dns-prefetch';
        script.href = '//www.youtube.com';
        document.head.appendChild(script);
    }

    initializeFeatures() {
        // Initialize Supabase connection with retry
        this.initializeSupabase();

        // Add interactive hover effects
        this.addFeatureInteractions();

        // Initialize service worker if available
        this.initializeServiceWorker();
    }

    async initializeSupabase() {
        try {
            if (typeof SupabaseAPI !== 'undefined') {
                const initialized = await SupabaseAPI.init();
                if (!initialized && this.connectionRetries < this.maxRetries) {
                    this.connectionRetries++;
                    setTimeout(() => this.initializeSupabase(), 2000);
                }
            }
        } catch (error) {
            console.warn('Supabase initialization failed, using offline mode:', error);
        }
    }

    addFeatureInteractions() {
        this.elements.features.forEach((feature, index) => {
            const icon = feature.querySelector('.feature-icon');
            if (icon) {
                icon.style.animationDelay = `${index * 0.5}s`;
            }

            feature.addEventListener('mouseenter', () => {
                feature.style.transform = 'translateY(-8px) scale(1.02)';
            });

            feature.addEventListener('mouseleave', () => {
                feature.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    async initializeServiceWorker() {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered successfully');
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    validateInput() {
        const url = this.elements.videoUrl?.value.trim();
        const button = this.elements.createRoomBtn;
        
        if (!url) {
            this.clearValidationState();
            return;
        }

        if (!SecurityUtils.validateYouTubeURL(url)) {
            this.showValidationError('Please enter a valid YouTube URL');
            if (button) button.disabled = true;
        } else {
            this.showValidationSuccess();
            if (button) button.disabled = false;
        }
    }

    showValidationError(message) {
        const input = this.elements.videoUrl;
        if (input) {
            input.setAttribute('aria-invalid', 'true');
            input.style.borderColor = 'var(--color-error-500)';
        }
        
        this.showInlineError(message);
    }

    showValidationSuccess() {
        const input = this.elements.videoUrl;
        if (input) {
            input.setAttribute('aria-invalid', 'false');
            input.style.borderColor = 'var(--color-success-500)';
        }
        
        this.hideInlineError();
    }

    clearValidationState() {
        const input = this.elements.videoUrl;
        if (input) {
            input.removeAttribute('aria-invalid');
            input.style.borderColor = '';
        }
        
        this.hideInlineError();
    }

    showInlineError(message) {
        let errorDiv = document.getElementById('inline-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'inline-error';
            errorDiv.className = 'inline-error';
            errorDiv.setAttribute('role', 'alert');
            errorDiv.setAttribute('aria-live', 'polite');
            
            const createSection = this.elements.createRoomSection;
            if (createSection) {
                createSection.appendChild(errorDiv);
            }
        }
        
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    hideInlineError() {
        const errorDiv = document.getElementById('inline-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    async handleCreateRoom() {
        if (this.isSubmitting) return;

        const videoUrl = this.elements.videoUrl?.value.trim();
        
        if (!this.validateCreateRoomInput(videoUrl)) return;

        this.isSubmitting = true;
        this.setLoadingState(true);

        try {
            const roomData = await this.createRoomWithRetry(videoUrl);
            
            if (roomData) {
                this.currentRoomData = roomData;
                this.showRoomCreated(roomData);
                this.toast.success('Room created successfully! Share the link with your friends.');
                
                // Clear the input
                if (this.elements.videoUrl) {
                    this.elements.videoUrl.value = '';
                    this.clearValidationState();
                }

                // Analytics (if available)
                this.trackEvent('room_created', { video_url: videoUrl });
            }
        } catch (error) {
            console.error('Error creating room:', error);
            this.toast.error('Failed to create room. Please check your connection and try again.');
        } finally {
            this.isSubmitting = false;
            this.setLoadingState(false);
        }
    }

    validateCreateRoomInput(videoUrl) {
        if (!videoUrl) {
            this.toast.warning('Please enter a YouTube video URL');
            if (this.elements.videoUrl) {
                this.elements.videoUrl.focus();
            }
            return false;
        }

        if (!SecurityUtils.validateYouTubeURL(videoUrl)) {
            this.toast.error('Please enter a valid YouTube video URL');
            if (this.elements.videoUrl) {
                this.elements.videoUrl.focus();
                this.elements.videoUrl.select();
            }
            return false;
        }

        return true;
    }

    async createRoomWithRetry(videoUrl, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                if (typeof SupabaseAPI !== 'undefined') {
                    return await SupabaseAPI.createRoom(videoUrl);
                } else {
                    // Fallback mock for development
                    return {
                        id: this.generateRoomId(),
                        video_url: videoUrl,
                        created_at: new Date().toISOString()
                    };
                }
            } catch (error) {
                if (i === retries - 1) throw error;
                
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                this.toast.info(`Retrying... (${i + 1}/${retries})`);
            }
        }
    }

    setLoadingState(loading) {
        const button = this.elements.createRoomBtn;
        if (!button) return;

        if (loading) {
            button.disabled = true;
            button.classList.add('loading');
            const originalText = button.textContent;
            button.setAttribute('data-original-text', originalText);
            button.innerHTML = `<span class="spinner"></span> Creating Room...`;
        } else {
            button.disabled = false;
            button.classList.remove('loading');
            const originalText = button.getAttribute('data-original-text') || 'Create Room';
            button.textContent = originalText;
        }
    }

    showRoomCreated(roomData) {
        const roomUrl = this.generateRoomUrl(roomData.id);
        
        if (this.elements.shareLink) {
            this.elements.shareLink.value = roomUrl;
        }
        
        if (this.elements.joinRoomBtn) {
            this.elements.joinRoomBtn.href = roomUrl;
        }
        
        if (this.elements.roomCreated) {
            this.elements.roomCreated.classList.remove('hidden');
            this.elements.roomCreated.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            // Announce to screen readers
            this.elements.roomCreated.setAttribute('aria-live', 'polite');
        }
    }

    hideRoomCreated() {
        if (this.elements.roomCreated && !this.elements.roomCreated.classList.contains('hidden')) {
            this.elements.roomCreated.classList.add('hidden');
        }
    }

    generateRoomUrl(roomId) {
        const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
        return `${baseUrl}room.html?room=${roomId}`;
    }

    async handleCopyLink() {
        const shareLink = this.elements.shareLink?.value;
        if (!shareLink) return;

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(shareLink);
            } else {
                // Fallback for older browsers or non-secure contexts
                this.elements.shareLink.select();
                document.execCommand('copy');
            }
            
            this.showCopySuccess();
            this.toast.success('Room link copied to clipboard!');
            
            // Analytics
            this.trackEvent('link_copied', { room_id: this.currentRoomData?.id });
            
        } catch (error) {
            console.error('Failed to copy:', error);
            this.toast.error('Failed to copy link. Please select and copy manually.');
        }
    }

    showCopySuccess() {
        const button = this.elements.copyLinkBtn;
        if (!button) return;

        const originalText = button.textContent;
        button.textContent = '✓ Copied!';
        button.style.background = 'var(--color-success-500)';
        button.disabled = true;

        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
            button.disabled = false;
        }, 2000);
    }

    handleLogoClick() {
        // Easter egg: Create confetti effect
        this.createConfettiEffect();
        this.toast.info('Thanks for using SyncStream! 🎉');
    }

    createConfettiEffect() {
        // Simple confetti effect
        const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.cssText = `
                    position: fixed;
                    width: 10px;
                    height: 10px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    top: -10px;
                    left: ${Math.random() * 100}vw;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 10000;
                    animation: confetti-fall 3s ease-out forwards;
                `;
                
                document.body.appendChild(confetti);
                
                setTimeout(() => {
                    confetti.remove();
                }, 3000);
            }, i * 50);
        }
    }

    checkUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('room');
        
        if (roomId) {
            window.location.href = `room.html?room=${roomId}`;
        }
    }

    generateRoomId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    trackEvent(eventName, properties = {}) {
        // Analytics tracking (replace with your analytics service)
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, properties);
        }
        
        console.log(`📊 Event: ${eventName}`, properties);
    }
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================

// Initialize the enhanced app
let syncStreamApp;

document.addEventListener('DOMContentLoaded', () => {
    syncStreamApp = new EnhancedSyncStreamApp();
});

// Add global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    if (syncStreamApp?.toast) {
        syncStreamApp.toast.error(
            'An unexpected error occurred. Please refresh the page if problems persist.'
        );
    }
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (syncStreamApp?.toast) {
        syncStreamApp.toast.error(
            'A network error occurred. Please check your connection.'
        );
    }
});

// Export for use in other scripts
window.SyncStreamApp = EnhancedSyncStreamApp;
window.ToastManager = ToastManager;
window.SecurityUtils = SecurityUtils;
window.PerformanceUtils = PerformanceUtils;
