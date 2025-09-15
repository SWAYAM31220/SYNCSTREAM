/**
 * SYNCSTREAM MOBILE FEATURES
 * Enhanced PWA with push notifications, offline mode, and mobile gestures
 */

class MobileFeatures {
    constructor() {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.isInstalled = false;
        this.deferredPrompt = null;
        this.pushSubscription = null;
        this.offlineData = new Map();
        this.gestureController = null;
        this.toastManager = null;
        this.swipeDistance = 0;
        this.swipeStartX = 0;
        this.swipeStartY = 0;
        this.isSwipingVolume = false;
        this.isSwipingSeek = false;
        this.vibrationEnabled = 'vibrate' in navigator;
        
        this.init();
    }
    
    init() {
        this.toastManager = window.ToastManager ? new window.ToastManager() : null;
        this.detectInstallation();
        this.setupPWAInstall();
        this.setupPushNotifications();
        this.setupOfflineMode();
        this.setupGestureControls();
        this.setupMobileOptimizations();
        this.bindEvents();
        this.loadOfflineData();
    }
    
    detectInstallation() {
        // Detect if app is running as PWA
        this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone ||
                          document.referrer.includes('android-app://');
        
        if (this.isInstalled) {
            this.onAppInstalled();
        }
    }
    
    setupPWAInstall() {
        // Handle PWA install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });
        
        // Handle successful installation
        window.addEventListener('appinstalled', () => {
            this.onAppInstalled();
        });
    }
    
    showInstallPrompt() {
        if (!this.deferredPrompt || this.isInstalled) return;
        
        const installPrompt = document.createElement('div');
        installPrompt.className = 'install-prompt glass-luxury';
        installPrompt.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: linear-gradient(135deg, rgba(108, 99, 255, 0.9), rgba(255, 215, 0, 0.1));
            border-radius: 15px;
            padding: 1rem;
            border: 1px solid rgba(255, 215, 0, 0.3);
            z-index: 10000;
            animation: slideUpMobile 0.3s ease;
            backdrop-filter: blur(20px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;
        
        installPrompt.innerHTML = `
            <div class="install-content" style="
                display: flex;
                align-items: center;
                gap: 1rem;
            ">
                <div class="install-icon" style="
                    font-size: 2rem;
                    flex-shrink: 0;
                ">📱</div>
                <div class="install-text" style="
                    flex: 1;
                    color: white;
                ">
                    <div style="font-weight: 600; margin-bottom: 0.25rem;">
                        Install SyncStream
                    </div>
                    <div style="font-size: 0.9rem; opacity: 0.8;">
                        Get the full app experience with offline features
                    </div>
                </div>
                <div class="install-actions" style="
                    display: flex;
                    gap: 0.5rem;
                    flex-shrink: 0;
                ">
                    <button id="installApp" class="btn btn-sm btn-primary-luxury">
                        Install
                    </button>
                    <button id="dismissInstall" class="btn btn-sm btn-ghost" style="
                        background: rgba(255, 255, 255, 0.1);
                    ">✕</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(installPrompt);
        
        // Bind install actions
        document.getElementById('installApp').addEventListener('click', () => {
            this.installPWA();
            installPrompt.remove();
        });
        
        document.getElementById('dismissInstall').addEventListener('click', () => {
            installPrompt.remove();
        });
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (installPrompt.parentNode) {
                installPrompt.remove();
            }
        }, 10000);
    }
    
    async installPWA() {
        if (!this.deferredPrompt) return;
        
        try {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                if (this.toastManager) {
                    this.toastManager.success('App installation started!');
                }
            }
            
            this.deferredPrompt = null;
        } catch (error) {
            console.error('PWA installation failed:', error);
        }
    }
    
    onAppInstalled() {
        this.isInstalled = true;
        if (this.toastManager) {
            this.toastManager.success('Welcome to SyncStream PWA! 🚀');
        }
        
        // Enable additional PWA features
        this.enablePWAFeatures();
    }
    
    enablePWAFeatures() {
        // Add PWA-specific UI enhancements
        document.body.classList.add('pwa-installed');
        
        // Create status bar
        this.createStatusBar();
        
        // Enable background sync
        this.enableBackgroundSync();
    }
    
    createStatusBar() {
        if (!this.isMobile) return;
        
        const statusBar = document.createElement('div');
        statusBar.className = 'mobile-status-bar';
        statusBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: env(safe-area-inset-top, 20px);
            background: linear-gradient(135deg, rgba(108, 99, 255, 0.8), rgba(255, 215, 0, 0.1));
            z-index: 10001;
            backdrop-filter: blur(20px);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.8);
        `;
        
        statusBar.innerHTML = `
            <span class="status-indicator">🟣 SyncStream</span>
        `;
        
        document.body.prepend(statusBar);
        
        // Adjust main content for status bar
        document.body.style.paddingTop = 'env(safe-area-inset-top, 20px)';
    }
    
    async setupPushNotifications() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications not supported');
            return;
        }
        
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            await this.requestNotificationPermission();
            
            if (Notification.permission === 'granted') {
                await this.subscribeToPush(registration);
            }
        } catch (error) {
            console.error('Push notification setup failed:', error);
        }
    }
    
    async requestNotificationPermission() {
        if (Notification.permission === 'granted') return true;
        if (Notification.permission === 'denied') return false;
        
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    
    async subscribeToPush(registration) {
        try {
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(
                    'BJWbxGXhKt9MKVFc4MKYJSSuqkFiWbBzq2aA4DnJwJnGTmIcHPdGFfMrMJ8JBRHsq2aA4DnJwJnGTmIcHPdGFfM'
                )
            });
            
            this.pushSubscription = subscription;
            await this.sendSubscriptionToServer(subscription);
            
            if (this.toastManager) {
                this.toastManager.success('Push notifications enabled!');
            }
        } catch (error) {
            console.error('Push subscription failed:', error);
        }
    }
    
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\\-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
    
    async sendSubscriptionToServer(subscription) {
        // In a real app, send subscription to your server
        localStorage.setItem('syncstream_push_subscription', JSON.stringify(subscription));
    }
    
    sendNotification(title, options = {}) {
        if (!this.pushSubscription || Notification.permission !== 'granted') return;
        
        const notificationOptions = {
            body: options.body || '',
            icon: options.icon || '/icon-192x192.png',
            badge: '/badge-72x72.png',
            tag: options.tag || 'syncstream',
            data: options.data || {},
            actions: options.actions || [],
            vibrate: this.vibrationEnabled ? [200, 100, 200] : undefined,
            ...options
        };
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, notificationOptions);
            });
        } else {
            new Notification(title, notificationOptions);
        }
    }
    
    setupOfflineMode() {
        // Cache management for offline functionality
        this.cacheVersion = 'syncstream-v1';
        this.staticCacheName = 'syncstream-static-v1';
        this.dynamicCacheName = 'syncstream-dynamic-v1';
        
        // Listen for connection changes
        window.addEventListener('online', () => {
            this.onOnline();
        });
        
        window.addEventListener('offline', () => {
            this.onOffline();
        });
        
        // Check initial connection status
        if (!navigator.onLine) {
            this.onOffline();
        }
    }
    
    onOnline() {
        if (this.toastManager) {
            this.toastManager.success('Connection restored! 📶');
        }
        
        // Sync offline data
        this.syncOfflineData();
        
        // Update UI
        document.body.classList.remove('offline-mode');
        this.updateConnectionStatus(true);
    }
    
    onOffline() {
        if (this.toastManager) {
            this.toastManager.warning('You\'re offline. Some features may be limited. 📴');
        }
        
        // Update UI
        document.body.classList.add('offline-mode');
        this.updateConnectionStatus(false);
        
        // Show offline indicator
        this.showOfflineIndicator();
    }
    
    updateConnectionStatus(isOnline) {
        const statusIndicator = document.querySelector('.status-indicator');
        if (statusIndicator) {
            if (isOnline) {
                statusIndicator.innerHTML = '🟣 SyncStream';
            } else {
                statusIndicator.innerHTML = '📴 Offline';
            }
        }
    }
    
    showOfflineIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'offline-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: env(safe-area-inset-top, 20px);
            left: 20px;
            right: 20px;
            background: rgba(255, 165, 0, 0.9);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 25px;
            text-align: center;
            font-size: 0.9rem;
            font-weight: 600;
            z-index: 10002;
            animation: slideDownMobile 0.3s ease;
            backdrop-filter: blur(10px);
        `;
        
        indicator.innerHTML = '📴 You\'re offline - Limited functionality available';
        
        document.body.appendChild(indicator);
        
        // Remove when back online
        const removeOnOnline = () => {
            if (navigator.onLine && indicator.parentNode) {
                indicator.remove();
                window.removeEventListener('online', removeOnOnline);
            }
        };
        
        window.addEventListener('online', removeOnOnline);
    }
    
    setupGestureControls() {
        if (!this.isMobile) return;
        
        this.gestureController = new GestureController();
        
        const videoContainer = document.querySelector('.video-section, .video-container, #videoPlayer');
        if (videoContainer) {
            this.addTouchGestures(videoContainer);
        }
        
        // Double-tap to like/react
        this.setupDoubleTapReaction();
        
        // Swipe gestures for navigation
        this.setupSwipeNavigation();
    }
    
    addTouchGestures(element) {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        let isDoubleTap = false;
        let lastTap = 0;
        
        element.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
            this.swipeStartX = touchStartX;
            this.swipeStartY = touchStartY;
            
            // Detect double tap
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
                isDoubleTap = true;
                this.handleDoubleTap(e);
            }
            lastTap = currentTime;
        });
        
        element.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                this.handleSwipeGesture(e);
            }
        });
        
        element.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            
            if (!isDoubleTap) {
                this.handleSwipeEnd(touchStartX, touchStartY, touchEndX, touchEndY);
            }
            
            isDoubleTap = false;
            this.isSwipingVolume = false;
            this.isSwipingSeek = false;
        });
    }
    
    handleSwipeGesture(e) {
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = currentX - this.swipeStartX;
        const deltaY = currentY - this.swipeStartY;
        
        // Right side vertical swipe for volume
        if (currentX > window.innerWidth * 0.7 && Math.abs(deltaY) > Math.abs(deltaX)) {
            this.isSwipingVolume = true;
            this.handleVolumeSwipe(deltaY);
            e.preventDefault();
        }
        
        // Left side vertical swipe for brightness (mobile specific)
        else if (currentX < window.innerWidth * 0.3 && Math.abs(deltaY) > Math.abs(deltaX)) {
            this.handleBrightnessSwipe(deltaY);
            e.preventDefault();
        }
        
        // Horizontal swipe for seeking
        else if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            this.isSwipingSeek = true;
            this.handleSeekSwipe(deltaX);
            e.preventDefault();
        }
    }
    
    handleVolumeSwipe(deltaY) {
        const volumeChange = -deltaY / window.innerHeight * 100; // Negative because swiping up increases volume
        const advancedControls = window.advancedVideoControls;
        
        if (advancedControls) {
            const currentVolume = advancedControls.volume || 100;
            const newVolume = Math.max(0, Math.min(100, currentVolume + volumeChange));
            advancedControls.setVolume(newVolume);
        }
        
        // Show volume feedback
        this.showVolumeIndicator(Math.round((100 + deltaY / window.innerHeight * 100) / 10) * 10);
        
        // Haptic feedback
        this.vibrate(50);
    }
    
    handleBrightnessSwipe(deltaY) {
        // Screen brightness control (limited support on web)
        const brightnessChange = -deltaY / window.innerHeight;
        this.showBrightnessIndicator(Math.round((0.5 + brightnessChange) * 100));
    }
    
    handleSeekSwipe(deltaX) {
        const seekTime = deltaX / window.innerWidth * 60; // Max 60 seconds per full swipe
        
        // Show seek preview
        this.showSeekPreview(seekTime);
        
        // Haptic feedback
        this.vibrate(25);
    }
    
    handleSwipeEnd(startX, startY, endX, endY) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance < 50) return; // Too short to be a swipe
        
        // Horizontal swipes for navigation
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 100) {
                this.handleSwipeRight();
            } else if (deltaX < -100) {
                this.handleSwipeLeft();
            }
        }
        
        // Vertical swipes
        else if (Math.abs(deltaY) > Math.abs(deltaX)) {
            if (deltaY > 100) {
                this.handleSwipeDown();
            } else if (deltaY < -100) {
                this.handleSwipeUp();
            }
        }
    }
    
    handleDoubleTap(e) {
        // Add heart reaction at tap position
        const rect = e.target.getBoundingClientRect();
        const x = e.changedTouches[0].clientX - rect.left;
        const y = e.changedTouches[0].clientY - rect.top;
        
        this.createFloatingReaction('❤️', x, y);
        
        // Send reaction if in room
        if (window.roomManager && typeof window.roomManager.sendReaction === 'function') {
            window.roomManager.sendReaction('❤️');
        }
        
        // Haptic feedback
        this.vibrate(100);
    }
    
    setupDoubleTapReaction() {
        // Enhanced double-tap reactions for mobile
        const reactionEmojis = ['❤️', '😂', '😮', '👍', '🔥'];
        let reactionIndex = 0;
        
        // Allow cycling through reactions with multiple double-taps
        this.reactionCooldown = false;
        
        document.addEventListener('doubletap', (e) => {
            if (this.reactionCooldown) return;
            
            const emoji = reactionEmojis[reactionIndex % reactionEmojis.length];
            this.createFloatingReaction(emoji, e.detail.x, e.detail.y);
            
            reactionIndex++;
            this.reactionCooldown = true;
            
            setTimeout(() => {
                this.reactionCooldown = false;
            }, 1000);
        });
    }
    
    setupSwipeNavigation() {
        // Custom swipe gestures for app navigation
        document.addEventListener('swipeleft', () => {
            this.navigateToNextSection();
        });
        
        document.addEventListener('swiperight', () => {
            this.navigateToPreviousSection();
        });
        
        document.addEventListener('swipeup', () => {
            this.showQuickActions();
        });
        
        document.addEventListener('swipedown', () => {
            this.minimizePlayer();
        });
    }
    
    handleSwipeRight() {
        // Navigate to previous page or show sidebar
        if (this.toastManager) {
            this.toastManager.info('Swipe right detected 👈');
        }
    }
    
    handleSwipeLeft() {
        // Navigate to next page or hide sidebar
        if (this.toastManager) {
            this.toastManager.info('Swipe left detected 👉');
        }
    }
    
    handleSwipeUp() {
        // Show full controls or go fullscreen
        if (window.theaterMode && typeof window.theaterMode.enterTheaterMode === 'function') {
            window.theaterMode.enterTheaterMode();
        }
    }
    
    handleSwipeDown() {
        // Exit fullscreen or show mini player
        if (window.pictureInPictureMode && typeof window.pictureInPictureMode.enterPipMode === 'function') {
            window.pictureInPictureMode.enterPipMode();
        }
    }
    
    showVolumeIndicator(volume) {
        const indicator = this.getOrCreateIndicator('volume');
        indicator.innerHTML = `
            <div class="indicator-icon">🔊</div>
            <div class="indicator-bar">
                <div class="indicator-fill" style="width: ${volume}%"></div>
            </div>
            <div class="indicator-text">${volume}%</div>
        `;
        this.showIndicator(indicator);
    }
    
    showBrightnessIndicator(brightness) {
        const indicator = this.getOrCreateIndicator('brightness');
        indicator.innerHTML = `
            <div class="indicator-icon">☀️</div>
            <div class="indicator-bar">
                <div class="indicator-fill" style="width: ${brightness}%"></div>
            </div>
            <div class="indicator-text">${brightness}%</div>
        `;
        this.showIndicator(indicator);
    }
    
    showSeekPreview(seekTime) {
        const indicator = this.getOrCreateIndicator('seek');
        const direction = seekTime > 0 ? 'forward' : 'backward';
        const icon = seekTime > 0 ? '⏩' : '⏪';
        
        indicator.innerHTML = `
            <div class="indicator-icon">${icon}</div>
            <div class="indicator-text">${Math.abs(Math.round(seekTime))}s</div>
        `;
        this.showIndicator(indicator);
    }
    
    getOrCreateIndicator(type) {
        let indicator = document.getElementById(`mobile-indicator-${type}`);
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = `mobile-indicator-${type}`;
            indicator.className = 'mobile-indicator glass-luxury';
            indicator.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 1rem;
                border-radius: 15px;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                z-index: 10000;
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 215, 0, 0.3);
                min-width: 120px;
                opacity: 0;
                transition: opacity 0.2s ease;
            `;
            
            document.body.appendChild(indicator);
        }
        
        return indicator;
    }
    
    showIndicator(indicator) {
        indicator.style.opacity = '1';
        
        clearTimeout(indicator.hideTimeout);
        indicator.hideTimeout = setTimeout(() => {
            indicator.style.opacity = '0';
        }, 1500);
    }
    
    createFloatingReaction(emoji, x, y) {
        const reaction = document.createElement('div');
        reaction.className = 'floating-reaction';
        reaction.textContent = emoji;
        reaction.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            font-size: 2rem;
            pointer-events: none;
            z-index: 10000;
            animation: floatReactionMobile 2s ease-out forwards;
        `;
        
        document.body.appendChild(reaction);
        setTimeout(() => reaction.remove(), 2000);
    }
    
    setupMobileOptimizations() {
        if (!this.isMobile) return;
        
        // Add mobile-specific styles
        this.addMobileStyles();
        
        // Optimize touch targets
        this.optimizeTouchTargets();
        
        // Handle orientation changes
        this.handleOrientationChange();
        
        // Prevent zoom on input focus
        this.preventInputZoom();
        
        // Add mobile navigation
        this.createMobileNavigation();
    }
    
    addMobileStyles() {
        const mobileStyles = document.createElement('style');
        mobileStyles.textContent = `
            @media (max-width: 768px) {
                .container {
                    padding: 0.5rem !important;
                }
                
                .btn {
                    min-height: 44px !important;
                    min-width: 44px !important;
                    touch-action: manipulation;
                }
                
                .glass-luxury {
                    backdrop-filter: blur(10px) !important;
                }
                
                .mobile-indicator .indicator-bar {
                    width: 80px;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 2px;
                    overflow: hidden;
                }
                
                .mobile-indicator .indicator-fill {
                    height: 100%;
                    background: #FFD700;
                    border-radius: 2px;
                    transition: width 0.1s ease;
                }
                
                @keyframes floatReactionMobile {
                    0% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.5) translateY(-30px);
                    }
                    100% {
                        opacity: 0;
                        transform: scale(1) translateY(-80px);
                    }
                }
                
                @keyframes slideUpMobile {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideDownMobile {
                    from {
                        transform: translateY(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            }
        `;
        document.head.appendChild(mobileStyles);
    }
    
    optimizeTouchTargets() {
        // Ensure all interactive elements meet minimum touch target size
        const interactiveElements = document.querySelectorAll('button, input, a, [role="button"]');
        
        interactiveElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
                element.style.minWidth = '44px';
                element.style.minHeight = '44px';
                element.style.padding = Math.max(8, parseInt(element.style.padding) || 0) + 'px';
            }
        });
    }
    
    handleOrientationChange() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                // Adjust layout for orientation change
                this.adjustLayoutForOrientation();
                
                // Update viewport
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                    viewport.setAttribute('content', 
                        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
                    );
                }
            }, 100);
        });
    }
    
    adjustLayoutForOrientation() {
        const isLandscape = window.orientation === 90 || window.orientation === -90;
        
        document.body.classList.toggle('landscape', isLandscape);
        document.body.classList.toggle('portrait', !isLandscape);
        
        if (isLandscape) {
            // Enter immersive mode in landscape
            if (window.theaterMode && !window.theaterMode.isActive) {
                window.theaterMode.enterTheaterMode();
            }
        }
    }
    
    preventInputZoom() {
        // Prevent zoom on input focus for iOS Safari
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (parseFloat(window.getComputedStyle(input).fontSize) < 16) {
                input.style.fontSize = '16px';
            }
        });
    }
    
    createMobileNavigation() {
        const nav = document.createElement('div');
        nav.className = 'mobile-nav glass-luxury';
        nav.style.cssText = `
            position: fixed;
            bottom: env(safe-area-inset-bottom, 0);
            left: 0;
            right: 0;
            height: calc(60px + env(safe-area-inset-bottom, 0));
            background: rgba(108, 99, 255, 0.1);
            backdrop-filter: blur(20px);
            border-top: 1px solid rgba(255, 215, 0, 0.2);
            display: flex;
            align-items: center;
            justify-content: space-around;
            z-index: 1000;
            padding-bottom: env(safe-area-inset-bottom, 0);
        `;
        
        const navItems = [
            { icon: '🏠', label: 'Home', action: () => window.location.href = 'index.html' },
            { icon: '📊', label: 'Analytics', action: () => window.analyticsDashboard?.toggleDashboard() },
            { icon: '👤', label: 'Profile', action: () => window.userProfileSystem?.toggleProfileModal() },
            { icon: '🎭', label: 'Theater', action: () => window.theaterMode?.toggle() },
            { icon: '⚙️', label: 'Settings', action: () => this.showMobileSettings() }
        ];
        
        nav.innerHTML = navItems.map(item => `
            <button class="nav-item btn btn-ghost" style="
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.25rem;
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.7rem;
                min-width: 50px;
                min-height: 50px;
                padding: 0.5rem;
                border-radius: 10px;
                transition: all 0.2s ease;
            " data-action="${item.label.toLowerCase()}">
                <span style="font-size: 1.2rem;">${item.icon}</span>
                <span>${item.label}</span>
            </button>
        `).join('');
        
        // Bind navigation actions
        navItems.forEach((item, index) => {
            const button = nav.children[index];
            button.addEventListener('click', () => {
                this.vibrate(50);
                item.action();
                
                // Visual feedback
                button.style.background = 'rgba(255, 215, 0, 0.2)';
                setTimeout(() => {
                    button.style.background = 'none';
                }, 200);
            });
        });
        
        document.body.appendChild(nav);
        
        // Add padding to main content
        document.body.style.paddingBottom = 'calc(60px + env(safe-area-inset-bottom, 0))';
    }
    
    showMobileSettings() {
        const settingsModal = document.createElement('div');
        settingsModal.className = 'mobile-settings-modal glass-luxury';
        settingsModal.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, rgba(108, 99, 255, 0.1), rgba(255, 215, 0, 0.05));
            border-radius: 20px 20px 0 0;
            padding: 1rem;
            padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0));
            z-index: 10001;
            transform: translateY(100%);
            transition: transform 0.3s ease;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 215, 0, 0.2);
            max-height: 50vh;
            overflow-y: auto;
        `;
        
        settingsModal.innerHTML = `
            <div class="settings-header" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                border-bottom: 1px solid rgba(255, 215, 0, 0.2);
                padding-bottom: 1rem;
            ">
                <h3 class="text-luxury" style="margin: 0;">⚙️ Mobile Settings</h3>
                <button id="closeMobileSettings" class="btn btn-sm btn-ghost">✕</button>
            </div>
            
            <div class="settings-options">
                <div class="setting-item" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                ">
                    <span style="color: white;">Vibration</span>
                    <input type="checkbox" id="vibrationToggle" class="toggle-switch" ${this.vibrationEnabled ? 'checked' : ''}>
                </div>
                
                <div class="setting-item" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                ">
                    <span style="color: white;">Push Notifications</span>
                    <input type="checkbox" id="notificationsToggle" class="toggle-switch" ${Notification.permission === 'granted' ? 'checked' : ''}>
                </div>
                
                <button class="setting-item btn btn-ghost" style="
                    width: 100%;
                    text-align: left;
                    justify-content: flex-start;
                    padding: 0.75rem 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                " onclick="window.mobileFeatures.clearOfflineData()">
                    <span>🗑️ Clear Offline Data</span>
                </button>
                
                <button class="setting-item btn btn-ghost" style="
                    width: 100%;
                    text-align: left;
                    justify-content: flex-start;
                    padding: 0.75rem 0;
                " onclick="window.mobileFeatures.showInstallPrompt()">
                    <span>📱 Install App</span>
                </button>
            </div>
        `;
        
        document.body.appendChild(settingsModal);
        
        // Animate in
        setTimeout(() => {
            settingsModal.style.transform = 'translateY(0)';
        }, 50);
        
        // Bind events
        document.getElementById('closeMobileSettings').addEventListener('click', () => {
            settingsModal.style.transform = 'translateY(100%)';
            setTimeout(() => settingsModal.remove(), 300);
        });
        
        document.getElementById('vibrationToggle').addEventListener('change', (e) => {
            this.vibrationEnabled = e.target.checked;
            localStorage.setItem('syncstream_vibration', this.vibrationEnabled);
            if (this.vibrationEnabled) this.vibrate(100);
        });
        
        document.getElementById('notificationsToggle').addEventListener('change', async (e) => {
            if (e.target.checked) {
                await this.requestNotificationPermission();
                if (Notification.permission !== 'granted') {
                    e.target.checked = false;
                }
            }
        });
    }
    
    enableBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            navigator.serviceWorker.ready.then(registration => {
                return registration.sync.register('background-sync');
            });
        }
    }
    
    saveOfflineData(key, data) {
        this.offlineData.set(key, {
            data,
            timestamp: Date.now()
        });
        
        try {
            localStorage.setItem('syncstream_offline_data', JSON.stringify(Object.fromEntries(this.offlineData)));
        } catch (error) {
            console.error('Failed to save offline data:', error);
        }
    }
    
    getOfflineData(key) {
        const item = this.offlineData.get(key);
        return item ? item.data : null;
    }
    
    loadOfflineData() {
        try {
            const storedData = localStorage.getItem('syncstream_offline_data');
            if (storedData) {
                const parsed = JSON.parse(storedData);
                this.offlineData = new Map(Object.entries(parsed));
            }
        } catch (error) {
            console.error('Failed to load offline data:', error);
        }
    }
    
    async syncOfflineData() {
        if (!navigator.onLine) return;
        
        // Sync any pending offline data with server
        for (const [key, item] of this.offlineData) {
            try {
                // In a real app, sync with your server here
                console.log(`Syncing offline data: ${key}`, item.data);
            } catch (error) {
                console.error(`Failed to sync ${key}:`, error);
            }
        }
    }
    
    clearOfflineData() {
        this.offlineData.clear();
        localStorage.removeItem('syncstream_offline_data');
        
        if (this.toastManager) {
            this.toastManager.success('Offline data cleared');
        }
    }
    
    vibrate(pattern) {
        if (this.vibrationEnabled && 'vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }
    
    bindEvents() {
        // Handle app state changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // App went to background
                this.onAppBackground();
            } else {
                // App came to foreground
                this.onAppForeground();
            }
        });
        
        // Handle page lifecycle events
        window.addEventListener('beforeunload', () => {
            this.onAppClose();
        });
        
        // Handle network changes
        window.addEventListener('online', () => this.onOnline());
        window.addEventListener('offline', () => this.onOffline());
    }
    
    onAppBackground() {
        // Save state, reduce functionality
        this.saveOfflineData('app_state', {
            url: window.location.href,
            timestamp: Date.now()
        });
    }
    
    onAppForeground() {
        // Restore state, resume functionality
        if (this.toastManager) {
            this.toastManager.info('Welcome back! 👋');
        }
        
        // Check for updates
        this.checkForUpdates();
    }
    
    onAppClose() {
        // Clean up, save important data
        this.syncOfflineData();
    }
    
    async checkForUpdates() {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                registration.update();
            }
        }
    }
}

// Gesture Controller for advanced touch interactions
class GestureController {
    constructor() {
        this.gestures = new Map();
        this.isRecording = false;
    }
    
    recordGesture(name, element) {
        // Record custom gestures
        this.gestures.set(name, {
            element,
            path: [],
            callbacks: []
        });
    }
    
    recognizeGesture(path) {
        // Simple gesture recognition
        // In a full implementation, this would use machine learning
        for (const [name, gesture] of this.gestures) {
            if (this.matchGesture(path, gesture.path)) {
                return name;
            }
        }
        return null;
    }
    
    matchGesture(path1, path2) {
        // Simplified gesture matching
        return false; // Placeholder
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mobileFeatures = new MobileFeatures();
    });
} else {
    window.mobileFeatures = new MobileFeatures();
}
