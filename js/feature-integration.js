/**
 * SYNCSTREAM FEATURE INTEGRATION
 * Integrates all features for SyncStream and ensures they work together seamlessly
 */

class FeatureIntegration {
    constructor() {
        this.features = {
            theaterMode: false,
            pictureInPicture: false,
            videoReactions: false,
            userProfiles: false,
            analytics: false,
            advancedControls: false,
            mobileFeatures: false
        };
        
        this.toast = null;
        this.isRoomPage = false;
        this.isHomePage = false;
        
        this.init();
    }
    
    init() {
        // Initialize toast manager
        if (window.ToastManager) {
            this.toast = new window.ToastManager();
        }
        
        // Detect current page
        this.detectCurrentPage();
        
        // Detect available features
        this.detectFeatures();
        
        // Connect features together
        this.connectFeatures();
        
        // Update room UI if on room page
        if (this.isRoomPage) {
            this.enhanceRoomUI();
        }
        
        // Add script loader for delayed feature loading
        this.addScriptLoader();
        
        // Register with global SyncStream API
        window.SyncStreamFeatures = this;
        
        // Log initialization
        console.log('🟣 SyncStream Feature Integration initialized', this.features);
    }
    
    detectCurrentPage() {
        const path = window.location.pathname;
        this.isRoomPage = path.includes('room.html');
        this.isHomePage = path.includes('index.html') || path === '/' || path.endsWith('/');
    }
    
    detectFeatures() {
        // Check for each feature's global object
        this.features.theaterMode = !!window.theaterMode;
        this.features.pictureInPicture = !!window.pictureInPictureMode;
        this.features.videoReactions = !!window.videoReactionSystem;
        this.features.userProfiles = !!window.userProfileSystem;
        this.features.analytics = !!window.analyticsDashboard;
        this.features.advancedControls = !!window.advancedVideoControls;
        this.features.mobileFeatures = !!window.mobileFeatures;
        
        // Load missing features if needed
        this.loadMissingFeatures();
    }
    
    loadMissingFeatures() {
        // Theater Mode & PiP (required for room page)
        if (this.isRoomPage) {
            if (!this.features.theaterMode) {
                this.loadScript('js/theater-mode.js');
            }
            
            if (!this.features.pictureInPicture) {
                this.loadScript('js/picture-in-picture.js');
            }
        }
        
        // User Profiles (required for all pages)
        if (!this.features.userProfiles) {
            this.loadScript('js/user-profiles.js');
        }
        
        // Analytics (useful for all pages)
        if (!this.features.analytics) {
            this.loadScript('js/analytics-dashboard.js');
        }
        
        // Advanced Video Controls (required for room page)
        if (this.isRoomPage && !this.features.advancedControls) {
            this.loadScript('js/advanced-video-controls.js');
        }
        
        // Video Reactions (required for room page)
        if (this.isRoomPage && !this.features.videoReactions) {
            this.loadScript('js/video-reactions.js');
        }
        
        // Mobile Features (useful for all pages)
        if (!this.features.mobileFeatures) {
            this.loadScript('js/mobile-features.js');
        }
    }
    
    loadScript(src) {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.defer = true;
        script.onload = () => this.handleScriptLoaded(src);
        document.head.appendChild(script);
        
        console.log(`🔄 Loading feature: ${src}`);
    }
    
    handleScriptLoaded(src) {
        // Update feature detection after script load
        setTimeout(() => {
            this.detectFeatures();
            this.connectFeatures();
            
            console.log(`✅ Loaded feature: ${src}`);
            
            if (this.toast) {
                const featureName = src.split('/').pop().replace('.js', '').replace(/-/g, ' ');
                this.toast.info(`${featureName} feature loaded`);
            }
        }, 500);
    }
    
    connectFeatures() {
        // Connect Theater Mode with Picture-in-Picture
        if (this.features.theaterMode && this.features.pictureInPicture) {
            this.connectTheaterAndPiP();
        }
        
        // Connect Video Reactions with Room Manager
        if (this.features.videoReactions && window.roomManager) {
            this.connectReactionsWithRoom();
        }
        
        // Connect User Profiles with Analytics
        if (this.features.userProfiles && this.features.analytics) {
            this.connectProfilesWithAnalytics();
        }
        
        // Connect Advanced Controls with Room Manager
        if (this.features.advancedControls && window.roomManager) {
            this.connectControlsWithRoom();
        }
        
        // Connect Mobile Features with other features
        if (this.features.mobileFeatures) {
            this.connectMobileFeatures();
        }
    }
    
    connectTheaterAndPiP() {
        // Ensure theater mode exits when PiP enters
        const originalEnterPip = window.pictureInPictureMode.enterPipMode;
        if (originalEnterPip && !window.pictureInPictureMode._integrated) {
            window.pictureInPictureMode.enterPipMode = function() {
                // Exit theater mode first if active
                if (window.theaterMode && window.theaterMode.isActive) {
                    window.theaterMode.exitTheaterMode();
                }
                
                // Call original method
                originalEnterPip.apply(this, arguments);
            };
            
            // Ensure PiP exits when theater enters
            const originalEnterTheater = window.theaterMode.enterTheaterMode;
            window.theaterMode.enterTheaterMode = function() {
                // Exit PiP mode first if active
                if (window.pictureInPictureMode && window.pictureInPictureMode.isActive) {
                    window.pictureInPictureMode.exitPipMode();
                }
                
                // Call original method
                originalEnterTheater.apply(this, arguments);
            };
            
            // Mark as integrated
            window.pictureInPictureMode._integrated = true;
            window.theaterMode._integrated = true;
            
            console.log('🔄 Connected Theater Mode with Picture-in-Picture');
        }
    }
    
    connectReactionsWithRoom() {
        // Connect video reactions with room manager for sync
        if (window.roomManager && !window.roomManager._reactionsIntegrated) {
            // Add reaction broadcasting to room manager
            window.roomManager.broadcastReaction = function(reactionData) {
                if (this.supabase && this.roomId && this.currentUser) {
                    // Send reaction to Supabase
                    this.supabase
                        .from('reactions')
                        .insert({
                            room_id: this.roomId,
                            user_id: this.currentUser.id || 'anonymous',
                            user_name: this.currentUser.name || 'Guest',
                            emoji: reactionData.emoji,
                            position_x: reactionData.position?.x,
                            position_y: reactionData.position?.y,
                            timestamp: new Date().toISOString()
                        })
                        .then(() => console.log('Reaction broadcast success'))
                        .catch(err => console.error('Reaction broadcast error:', err));
                }
            };
            
            // Add reaction receiving to room manager
            if (window.roomManager.initializeSupabase) {
                const originalInitSupabase = window.roomManager.initializeSupabase;
                window.roomManager.initializeSupabase = async function() {
                    await originalInitSupabase.apply(this, arguments);
                    
                    // Subscribe to reactions
                    if (this.supabase && this.roomId) {
                        this.supabase
                            .from(`reactions:room_id=eq.${this.roomId}`)
                            .on('INSERT', payload => {
                                // Convert to reaction data format
                                const reaction = {
                                    emoji: payload.new.emoji,
                                    reactionData: window.videoReactionSystem.availableReactions.find(
                                        r => r.emoji === payload.new.emoji
                                    ),
                                    position: payload.new.position_x ? {
                                        x: payload.new.position_x,
                                        y: payload.new.position_y
                                    } : null,
                                    userId: payload.new.user_id,
                                    timestamp: new Date(payload.new.timestamp).getTime()
                                };
                                
                                // Dispatch reaction event
                                document.dispatchEvent(new CustomEvent('reaction_received', { 
                                    detail: reaction 
                                }));
                            })
                            .subscribe();
                    }
                };
            }
            
            // Mark as integrated
            window.roomManager._reactionsIntegrated = true;
            console.log('🔄 Connected Video Reactions with Room Manager');
        }
    }
    
    connectProfilesWithAnalytics() {
        // Connect user profiles with analytics
        if (window.userProfileSystem && window.analyticsDashboard) {
            // Add analytics tracking to profile actions
            const originalSaveProfile = window.userProfileSystem.saveProfile;
            if (originalSaveProfile && !window.userProfileSystem._analyticsIntegrated) {
                window.userProfileSystem.saveProfile = function() {
                    const result = originalSaveProfile.apply(this, arguments);
                    
                    // Track profile update in analytics
                    window.analyticsDashboard.trackEvent('profile_updated', {
                        user_id: this.currentUser?.id,
                        has_email: !!this.currentUser?.email
                    });
                    
                    return result;
                };
                
                // Mark as integrated
                window.userProfileSystem._analyticsIntegrated = true;
                console.log('🔄 Connected User Profiles with Analytics');
            }
        }
    }
    
    connectControlsWithRoom() {
        // Connect advanced controls with room manager
        if (window.advancedVideoControls && window.roomManager) {
            // Sync room state to advanced controls
            const originalUpdateTime = window.advancedVideoControls.updateTime;
            if (originalUpdateTime && !window.advancedVideoControls._roomIntegrated) {
                // Connect room manager video time updates to advanced controls
                if (window.roomManager.updateTimeDisplay) {
                    const originalUpdateTimeDisplay = window.roomManager.updateTimeDisplay;
                    window.roomManager.updateTimeDisplay = function(currentTime, duration) {
                        originalUpdateTimeDisplay.apply(this, arguments);
                        
                        // Update advanced controls display
                        window.advancedVideoControls.updateTime(currentTime, duration);
                    };
                }
                
                // Add video state sync to room manager
                if (!window.roomManager.syncVideoState) {
                    window.roomManager.syncVideoState = function(stateData) {
                        if (this.supabase && this.roomId && this.isHost) {
                            // Send state to Supabase
                            this.supabase
                                .from('video_states')
                                .insert({
                                    room_id: this.roomId,
                                    user_id: this.currentUser?.id || 'anonymous',
                                    action: stateData.action,
                                    data: stateData,
                                    timestamp: new Date().toISOString()
                                })
                                .then(() => console.log('Video state sync success'))
                                .catch(err => console.error('Video state sync error:', err));
                        }
                    };
                }
                
                // Mark as integrated
                window.advancedVideoControls._roomIntegrated = true;
                console.log('🔄 Connected Advanced Controls with Room Manager');
            }
        }
    }
    
    connectMobileFeatures() {
        // Connect mobile features with other components
        if (window.mobileFeatures) {
            // Connect with theater mode for orientation changes
            if (window.theaterMode && !window.mobileFeatures._theaterIntegrated) {
                const originalAdjustLayout = window.mobileFeatures.adjustLayoutForOrientation;
                window.mobileFeatures.adjustLayoutForOrientation = function() {
                    originalAdjustLayout.apply(this, arguments);
                    
                    // Auto-enter theater mode in landscape on mobile
                    const isLandscape = window.orientation === 90 || window.orientation === -90;
                    if (isLandscape && window.theaterMode && !window.theaterMode.isActive) {
                        window.theaterMode.enterTheaterMode();
                    }
                };
                
                // Mark as integrated
                window.mobileFeatures._theaterIntegrated = true;
            }
            
            // Connect with profile system
            if (window.userProfileSystem && !window.mobileFeatures._profilesIntegrated) {
                // Add mobile navigation awareness to profile system
                const originalShowProfileModal = window.userProfileSystem.showProfileModal;
                window.userProfileSystem.showProfileModal = function() {
                    originalShowProfileModal.apply(this, arguments);
                    
                    // Add mobile optimizations to profile modal
                    const modal = document.getElementById('profileModal');
                    if (modal && window.mobileFeatures.isMobile) {
                        modal.classList.add('mobile-optimized');
                    }
                };
                
                // Mark as integrated
                window.mobileFeatures._profilesIntegrated = true;
            }
            
            console.log('🔄 Connected Mobile Features with other components');
        }
    }
    
    enhanceRoomUI() {
        // Only run if on room page
        if (!this.isRoomPage) return;
        
        // Add feature toggles to video controls
        const videoControls = document.querySelector('.video-controls');
        if (videoControls) {
            // Add divider
            const divider = document.createElement('div');
            divider.className = 'controls-divider';
            divider.style.cssText = `
                width: 1px;
                height: 24px;
                background: rgba(255, 255, 255, 0.2);
                margin: 0 0.5rem;
            `;
            videoControls.appendChild(divider);
            
            // Add space for better layout
            videoControls.style.gap = '0.5rem';
            videoControls.style.flexWrap = 'wrap';
            videoControls.style.justifyContent = 'center';
        }
        
        // Add keyboard shortcuts guide button
        this.addKeyboardShortcutsGuide();
    }
    
    addKeyboardShortcutsGuide() {
        // Create keyboard shortcuts button
        const shortcutsBtn = document.createElement('button');
        shortcutsBtn.id = 'keyboardShortcutsBtn';
        shortcutsBtn.className = 'btn btn-sm btn-ghost-luxury';
        shortcutsBtn.innerHTML = '⌨️';
        shortcutsBtn.title = 'Keyboard Shortcuts';
        shortcutsBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 1000;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            opacity: 0.7;
            transition: opacity 0.2s ease;
        `;
        
        shortcutsBtn.addEventListener('mouseenter', () => {
            shortcutsBtn.style.opacity = '1';
        });
        
        shortcutsBtn.addEventListener('mouseleave', () => {
            shortcutsBtn.style.opacity = '0.7';
        });
        
        shortcutsBtn.addEventListener('click', () => {
            this.showKeyboardShortcutsModal();
        });
        
        document.body.appendChild(shortcutsBtn);
    }
    
    showKeyboardShortcutsModal() {
        const modal = document.createElement('div');
        modal.className = 'keyboard-shortcuts-modal glass-luxury';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(20px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;
        
        // Define keyboard shortcuts from all features
        const shortcuts = [
            { key: 'Space / K', action: 'Play/Pause video' },
            { key: 'F', action: 'Toggle fullscreen' },
            { key: 'T', action: 'Toggle theater mode' },
            { key: 'P', action: 'Toggle picture-in-picture' },
            { key: 'M', action: 'Mute/Unmute' },
            { key: '← / →', action: 'Seek -10s / +10s' },
            { key: '↑ / ↓', action: 'Volume +5% / -5%' },
            { key: 'C', action: 'Toggle subtitles' },
            { key: '< / >', action: 'Decrease/Increase playback speed' },
            { key: '1-0', action: 'Add quick reactions (1=❤️, 2=😂, etc.)' },
            { key: 'Esc', action: 'Close current modal or exit fullscreen' }
        ];
        
        // Create shortcuts content
        modal.innerHTML = `
            <div class="shortcuts-content glass-luxury" style="
                width: 90%;
                max-width: 600px;
                background: linear-gradient(135deg, rgba(108, 99, 255, 0.1), rgba(255, 215, 0, 0.05));
                border-radius: 20px;
                padding: 2rem;
                position: relative;
                border: 1px solid rgba(255, 215, 0, 0.2);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            ">
                <div class="shortcuts-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    border-bottom: 1px solid rgba(255, 215, 0, 0.2);
                    padding-bottom: 1rem;
                ">
                    <h2 class="text-luxury" style="margin: 0; font-size: 1.5rem;">
                        ⌨️ Keyboard Shortcuts
                    </h2>
                    <button id="closeShortcuts" class="btn btn-sm btn-ghost" style="
                        background: rgba(255, 0, 0, 0.2);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 30px;
                        height: 30px;
                        font-size: 1rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">✕</button>
                </div>
                
                <div class="shortcuts-list" style="
                    display: grid;
                    grid-template-columns: auto 1fr;
                    gap: 0.75rem 1.5rem;
                    align-items: center;
                ">
                    ${shortcuts.map(shortcut => `
                        <div class="shortcut-key" style="
                            background: rgba(255, 215, 0, 0.1);
                            padding: 0.5rem 0.75rem;
                            border-radius: 8px;
                            font-family: monospace;
                            font-weight: bold;
                            color: #FFD700;
                            text-align: center;
                            min-width: 80px;
                            border: 1px solid rgba(255, 215, 0, 0.3);
                        ">${shortcut.key}</div>
                        <div class="shortcut-action" style="
                            color: white;
                        ">${shortcut.action}</div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle close
        const closeBtn = document.getElementById('closeShortcuts');
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', function closeOnEsc(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', closeOnEsc);
            }
        });
    }
    
    addScriptLoader() {
        // Add a global function to load additional scripts
        window.SyncStreamLoadScript = (src, callback) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            if (callback) {
                script.onload = callback;
            }
            
            document.head.appendChild(script);
            console.log(`🔄 Loading additional script: ${src}`);
            
            return script;
        };
    }
}

// CSS for feature integration
const integrationStyles = document.createElement('style');
integrationStyles.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .mobile-optimized {
        padding: 0 !important;
    }
    
    .mobile-optimized .shortcuts-content,
    .mobile-optimized .profile-content {
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 0 !important;
        height: 100% !important;
        max-height: 100% !important;
    }
    
    /* Fix z-index stacking for various components */
    #reactionToggle { z-index: 1001 !important; }
    #reactionPanel { z-index: 1000 !important; }
    .reactions-overlay { z-index: 999 !important; }
    .video-controls { z-index: 1002 !important; }
    .mobile-nav { z-index: 1003 !important; }
    
    /* Media query for better mobile layout */
    @media (max-width: 768px) {
        .video-controls {
            padding: 0.5rem !important;
        }
        
        .btn {
            padding: 0.5rem !important;
        }
        
        .controls-divider {
            display: none !important;
        }
        
        #keyboardShortcutsBtn {
            bottom: 70px !important;
        }
    }
`;
document.head.appendChild(integrationStyles);

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.featureIntegration = new FeatureIntegration();
    });
} else {
    window.featureIntegration = new FeatureIntegration();
}
