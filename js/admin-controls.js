/**
 * SYNCSTREAM ADMIN CONTROLS
 * Restricts video controls to admin/host users only
 */

class AdminControlSystem {
    constructor() {
        this.roomManager = null;
        this.isAdmin = false;
        this.isHost = false;
        this.currentUser = null;
        this.adminUserId = null;
        this.toast = null;
        this.restrictedControls = new Set([
            'playBtn', 'pauseBtn', 'syncBtn', 'speedBtn', 'qualityBtn',
            'theaterModeBtn', 'pipModeBtn', 'addVideoBtn', 'nextVideoBtn'
        ]);
        
        this.adminOnlySelectors = [
            '.video-controls button',
            '.advanced-controls button',
            '#theaterModeBtn',
            '#pipModeBtn',
            '#speedBtn', 
            '#qualityBtn',
            '#addVideoBtn',
            '.queue-controls button'
        ];
        
        this.init();
    }
    
    init() {
        this.toast = window.ToastManager ? new window.ToastManager() : null;
        this.roomManager = window.roomManager || window.EnhancedRoomManager || null;
        
        // Wait for room manager to initialize
        if (!this.roomManager) {
            setTimeout(() => this.init(), 1000);
            return;
        }
        
        this.bindToRoomManager();
        this.createAdminIndicator();
        this.setupPermissionSystem();
        this.addAdminTransferUI();
        
        console.log('👑 Admin Control System initialized');
    }
    
    bindToRoomManager() {
        // Hook into room manager's join process
        if (this.roomManager && this.roomManager.handleJoinRoom) {
            const originalJoinRoom = this.roomManager.handleJoinRoom.bind(this.roomManager);
            this.roomManager.handleJoinRoom = async (...args) => {
                const result = await originalJoinRoom(...args);
                
                // Check if user becomes admin after joining
                this.checkAdminStatus();
                this.updateControlPermissions();
                
                return result;
            };
        }
        
        // Hook into user status updates
        if (this.roomManager.updateParticipants) {
            const originalUpdateParticipants = this.roomManager.updateParticipants.bind(this.roomManager);
            this.roomManager.updateParticipants = (...args) => {
                originalUpdateParticipants(...args);
                this.checkAdminStatus();
                this.updateControlPermissions();
            };
        }
    }
    
    checkAdminStatus() {
        // Get current user info
        this.currentUser = this.roomManager?.currentUser || 
                          (window.userProfileSystem ? window.userProfileSystem.getCurrentUser() : null);
        
        if (!this.currentUser) return;
        
        // Check if user is the room creator (host) or designated admin
        this.isHost = this.roomManager?.isHost || false;
        this.isAdmin = this.isHost || this.checkIfUserIsAdmin();
        
        // Store admin info
        if (this.isHost && !this.adminUserId) {
            this.adminUserId = this.currentUser.id;
            this.storeAdminInfo();
        }
        
        this.updateAdminIndicator();
        
        console.log(`Admin status: Host=${this.isHost}, Admin=${this.isAdmin}, User=${this.currentUser.name}`);
    }
    
    checkIfUserIsAdmin() {
        // Check if current user is in the admin list (stored locally or in database)
        const storedAdmin = localStorage.getItem(`syncstream_room_${this.roomManager?.roomId}_admin`);
        return storedAdmin === this.currentUser?.id;
    }
    
    storeAdminInfo() {
        if (this.roomManager?.roomId && this.adminUserId) {
            localStorage.setItem(`syncstream_room_${this.roomManager.roomId}_admin`, this.adminUserId);
        }
    }
    
    createAdminIndicator() {
        // Create admin status indicator
        const indicator = document.createElement('div');
        indicator.id = 'adminIndicator';
        indicator.className = 'admin-indicator glass-luxury';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 0.5rem 1rem;
            background: rgba(255, 215, 0, 0.1);
            border: 1px solid rgba(255, 215, 0, 0.3);
            border-radius: 25px;
            backdrop-filter: blur(20px);
            z-index: 1000;
            display: none;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
            font-weight: 600;
            color: #FFD700;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            animation: slideDown 0.3s ease;
        `;
        
        indicator.innerHTML = `
            <div class="admin-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 6L14.5 11H21L16.5 15L18 21L12 18L6 21L7.5 15L3 11H9.5L12 6Z" 
                          fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>
                </svg>
            </div>
            <span class="admin-text">Admin</span>
        `;
        
        document.body.appendChild(indicator);
    }
    
    updateAdminIndicator() {
        const indicator = document.getElementById('adminIndicator');
        if (!indicator) return;
        
        if (this.isAdmin) {
            indicator.style.display = 'flex';
            const iconElement = indicator.querySelector('.admin-icon svg');
            const textElement = indicator.querySelector('.admin-text');
            
            if (this.isHost) {
                textElement.textContent = 'Host';
                // Crown icon for host
                iconElement.innerHTML = `
                    <path d="M12 6L14.5 11H21L16.5 15L18 21L12 18L6 21L7.5 15L3 11H9.5L12 6Z" 
                          fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>
                `;
            } else {
                textElement.textContent = 'Admin';
                // Shield icon for admin
                iconElement.innerHTML = `
                    <path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z" 
                          fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>
                    <path d="M9 12L11 14L15 10" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                `;
            }
        } else {
            indicator.style.display = 'none';
        }
    }
    
    setupPermissionSystem() {
        // Override video control functions to check admin status
        this.overrideVideoControls();
        
        // Add visual indicators to restricted controls
        this.updateControlPermissions();
        
        // Set up periodic permission checks
        setInterval(() => {
            this.checkAdminStatus();
            this.updateControlPermissions();
        }, 5000);
    }
    
    overrideVideoControls() {
        // Override play/pause functions
        if (this.roomManager) {
            this.overrideMethod('playVideo', 'play the video');
            this.overrideMethod('pauseVideo', 'pause the video');
            this.overrideMethod('syncAllParticipants', 'sync participants');
            this.overrideMethod('addVideoToQueue', 'add videos to queue');
            this.overrideMethod('loadVideo', 'change the video');
        }
        
        // Override advanced video controls
        if (window.advancedVideoControls) {
            this.overrideAdvancedControlMethod('changeSpeed', 'change playback speed');
            this.overrideAdvancedControlMethod('changeQuality', 'change video quality');
            this.overrideAdvancedControlMethod('seekToTime', 'seek in the video');
            this.overrideAdvancedControlMethod('toggleFullscreen', 'toggle fullscreen');
        }
        
        // Override theater mode and PiP
        if (window.theaterMode) {
            this.overrideTheaterMethod('toggle', 'toggle theater mode');
        }
        
        if (window.pictureInPictureMode) {
            this.overridePiPMethod('toggle', 'toggle picture-in-picture');
        }
    }
    
    overrideMethod(methodName, action) {
        if (!this.roomManager[methodName]) return;
        
        const originalMethod = this.roomManager[methodName].bind(this.roomManager);
        this.roomManager[methodName] = (...args) => {
            if (!this.checkPermission(action)) {
                return;
            }
            return originalMethod(...args);
        };
    }
    
    overrideAdvancedControlMethod(methodName, action) {
        if (!window.advancedVideoControls[methodName]) return;
        
        const originalMethod = window.advancedVideoControls[methodName].bind(window.advancedVideoControls);
        window.advancedVideoControls[methodName] = (...args) => {
            if (!this.checkPermission(action)) {
                return;
            }
            return originalMethod(...args);
        };
    }
    
    overrideTheaterMethod(methodName, action) {
        if (!window.theaterMode[methodName]) return;
        
        const originalMethod = window.theaterMode[methodName].bind(window.theaterMode);
        window.theaterMode[methodName] = (...args) => {
            if (!this.checkPermission(action)) {
                return;
            }
            return originalMethod(...args);
        };
    }
    
    overridePiPMethod(methodName, action) {
        if (!window.pictureInPictureMode[methodName]) return;
        
        const originalMethod = window.pictureInPictureMode[methodName].bind(window.pictureInPictureMode);
        window.pictureInPictureMode[methodName] = (...args) => {
            if (!this.checkPermission(action)) {
                return;
            }
            return originalMethod(...args);
        };
    }
    
    checkPermission(action) {
        if (this.isAdmin) {
            return true;
        }
        
        // Show permission denied message
        if (this.toast) {
            this.toast.warning(`Only the room admin can ${action}`, 'Permission Denied');
        }
        
        // Add visual feedback
        this.showPermissionDeniedAnimation();
        
        return false;
    }
    
    showPermissionDeniedAnimation() {
        // Create temporary permission denied indicator
        const indicator = document.createElement('div');
        indicator.className = 'permission-denied glass-luxury';
        indicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 1rem 2rem;
            background: rgba(255, 0, 0, 0.9);
            color: white;
            border-radius: 50px;
            backdrop-filter: blur(20px);
            z-index: 10000;
            font-weight: 600;
            font-size: 1.1rem;
            border: 2px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            animation: shake 0.5s ease-in-out;
        `;
        
        indicator.innerHTML = `
            <div class="permission-icon" style="margin-right: 0.75rem; display: flex; align-items: center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="11" width="18" height="10" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.2"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" fill="none"/>
                    <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
                </svg>
            </div>
            <span style="font-weight: 700; letter-spacing: 0.5px;">ACCESS RESTRICTED</span>
        `;
        
        document.body.appendChild(indicator);
        
        // Remove after animation
        setTimeout(() => {
            indicator.remove();
        }, 1500);
        
        // Vibrate on mobile if available
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
    }
    
    updateControlPermissions() {
        // Update visual state of all controls
        this.adminOnlySelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                this.updateElementPermission(element);
            });
        });
        
        // Update restricted controls by ID
        this.restrictedControls.forEach(controlId => {
            const element = document.getElementById(controlId);
            if (element) {
                this.updateElementPermission(element);
            }
        });
    }
    
    updateElementPermission(element) {
        if (!element) return;
        
        if (this.isAdmin) {
            // Enable for admin
            element.disabled = false;
            element.style.opacity = '1';
            element.style.cursor = 'pointer';
            element.classList.remove('admin-restricted');
            element.removeAttribute('title');
        } else {
            // Disable for non-admin
            element.disabled = true;
            element.style.opacity = '0.5';
            element.style.cursor = 'not-allowed';
            element.classList.add('admin-restricted');
            element.title = 'Only room admin can use this control';
            
            // Add click handler to show permission message
            element.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.checkPermission('use this control');
            }, { passive: false });
        }
    }
    
    addAdminTransferUI() {
        // Create admin transfer button (only visible to current admin)
        const transferBtn = document.createElement('button');
        transferBtn.id = 'adminTransferBtn';
        transferBtn.className = 'btn btn-sm btn-secondary-luxury';
        transferBtn.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 6L14.5 11H21L16.5 15L18 21L12 18L6 21L7.5 15L3 11H9.5L12 6Z" 
                          fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>
                </svg>
                <span>Transfer Admin</span>
            </div>
        `;
        transferBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            display: none;
        `;
        
        transferBtn.addEventListener('click', () => {
            this.showAdminTransferModal();
        });
        
        document.body.appendChild(transferBtn);
        
        // Show/hide based on admin status
        const updateTransferBtn = () => {
            if (this.isHost || this.isAdmin) {
                transferBtn.style.display = 'block';
            } else {
                transferBtn.style.display = 'none';
            }
        };
        
        // Update button visibility periodically
        setInterval(updateTransferBtn, 1000);
    }
    
    showAdminTransferModal() {
        if (!this.isAdmin) return;
        
        const modal = document.createElement('div');
        modal.className = 'admin-transfer-modal glass-luxury';
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
        `;
        
        // Get participant list
        const participants = this.roomManager?.participants || [];
        const nonAdminParticipants = participants.filter(p => p.id !== this.currentUser?.id);
        
        modal.innerHTML = `
            <div class="transfer-content glass-luxury" style="
                width: 90%;
                max-width: 500px;
                background: linear-gradient(135deg, rgba(108, 99, 255, 0.1), rgba(255, 215, 0, 0.05));
                border-radius: 20px;
                padding: 2rem;
                border: 1px solid rgba(255, 215, 0, 0.2);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            ">
                <div class="transfer-header" style="
                    text-align: center;
                    margin-bottom: 2rem;
                    border-bottom: 1px solid rgba(255, 215, 0, 0.2);
                    padding-bottom: 1rem;
                ">
                    <div style="display: flex; align-items: center; gap: 1rem; justify-content: center; margin-bottom: 0.5rem;">
                        <div class="transfer-icon" style="padding: 0.5rem; background: rgba(255, 215, 0, 0.1); border-radius: 50%; border: 1px solid rgba(255, 215, 0, 0.3);">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16 21V19C16 16.7909 14.2091 15 12 15H5C2.79086 15 1 16.7909 1 19V21" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <circle cx="8.5" cy="7" r="4" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M20 8V14M23 11L20 14L17 11" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <h2 class="text-luxury" style="margin: 0;">Transfer Admin Rights</h2>
                    </div>
                    <p style="color: rgba(255, 255, 255, 0.7); margin: 0;">
                        Select a participant to make them the new room admin
                    </p>
                </div>
                
                <div class="participants-list" style="margin-bottom: 2rem;">
                    ${nonAdminParticipants.length > 0 ? 
                        nonAdminParticipants.map(participant => `
                            <div class="participant-item" data-user-id="${participant.id}" style="
                                display: flex;
                                align-items: center;
                                gap: 1rem;
                                padding: 1rem;
                                background: rgba(255, 215, 0, 0.1);
                                border-radius: 10px;
                                margin-bottom: 0.5rem;
                                cursor: pointer;
                                transition: all 0.2s ease;
                                border: 1px solid rgba(255, 215, 0, 0.2);
                            ">
                                <div class="participant-avatar" style="
                                    width: 40px;
                                    height: 40px;
                                    border-radius: 50%;
                                    background: linear-gradient(135deg, #667eea, #764ba2);
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 1.2rem;
                                ">
                                    ${participant.avatar ? participant.avatar : `
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            <circle cx="12" cy="7" r="4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    `}
                                </div>
                                <div class="participant-info" style="flex: 1;">
                                    <div class="participant-name" style="color: white; font-weight: 600;">
                                        ${participant.name}
                                    </div>
                                    <div class="participant-status" style="color: rgba(255, 255, 255, 0.6); font-size: 0.9rem;">
                                        Click to transfer admin rights
                                    </div>
                                </div>
                            </div>
                        `).join('') : 
                        `<div style="text-align: center; color: rgba(255, 255, 255, 0.6); padding: 2rem;">
                            No other participants in the room
                        </div>`
                    }
                </div>
                
                <div class="transfer-actions" style="
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                ">
                    <button id="cancelTransfer" class="btn btn-secondary-luxury">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Bind events
        modal.querySelectorAll('.participant-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = item.dataset.userId;
                const participant = participants.find(p => p.id === userId);
                this.transferAdminRights(participant);
                modal.remove();
            });
            
            // Add hover effect
            item.addEventListener('mouseenter', () => {
                item.style.background = 'rgba(255, 215, 0, 0.2)';
                item.style.transform = 'translateY(-2px)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.background = 'rgba(255, 215, 0, 0.1)';
                item.style.transform = 'translateY(0)';
            });
        });
        
        document.getElementById('cancelTransfer').addEventListener('click', () => {
            modal.remove();
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    transferAdminRights(newAdmin) {
        if (!newAdmin || !this.isAdmin) return;
        
        // Update local admin status
        this.adminUserId = newAdmin.id;
        this.isHost = false;
        this.isAdmin = false;
        
        // Store new admin info
        this.storeAdminInfo();
        
        // Update UI immediately
        this.updateControlPermissions();
        this.updateAdminIndicator();
        
        // Notify all participants (in a real app, this would go through the server)
        if (this.roomManager && this.roomManager.broadcastMessage) {
            this.roomManager.broadcastMessage({
                type: 'admin_transfer',
                newAdminId: newAdmin.id,
                newAdminName: newAdmin.name,
                previousAdminName: this.currentUser?.name
            });
        }
        
        // Show success message
        if (this.toast) {
            this.toast.success(`Admin rights transferred to ${newAdmin.name}`, 'Transfer Successful');
        }
        
        console.log(`Admin rights transferred to: ${newAdmin.name} (${newAdmin.id})`);
    }
    
    // Public API methods
    
    makeUserAdmin(userId) {
        if (!this.isHost) return false;
        
        this.adminUserId = userId;
        this.storeAdminInfo();
        this.checkAdminStatus();
        this.updateControlPermissions();
        
        return true;
    }
    
    removeAdminRights() {
        if (!this.isHost) return false;
        
        this.adminUserId = this.currentUser?.id; // Revert to host
        this.storeAdminInfo();
        this.checkAdminStatus();
        this.updateControlPermissions();
        
        return true;
    }
    
    getCurrentAdminId() {
        return this.adminUserId;
    }
    
    isUserAdmin(userId) {
        return userId === this.adminUserId || (this.isHost && userId === this.currentUser?.id);
    }
}

// Add admin control CSS
const adminStyles = document.createElement('style');
adminStyles.textContent = `
    @keyframes slideDown {
        from {
            transform: translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes shake {
        0%, 100% { transform: translate(-50%, -50%) translateX(0); }
        25% { transform: translate(-50%, -50%) translateX(-5px); }
        75% { transform: translate(-50%, -50%) translateX(5px); }
    }
    
    @keyframes glow {
        0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }
        50% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.6); }
    }
    
    .admin-indicator {
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.125);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .admin-indicator:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 12px 40px rgba(255, 215, 0, 0.4);
        animation: glow 2s infinite;
    }
    
    .admin-indicator .admin-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
    }
    
    .admin-indicator:hover .admin-icon {
        transform: scale(1.1) rotate(5deg);
    }
    
    .admin-restricted {
        position: relative;
        filter: grayscale(70%) brightness(0.7);
        transition: all 0.3s ease;
    }
    
    .admin-restricted::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 2px,
            rgba(255, 0, 0, 0.1) 2px,
            rgba(255, 0, 0, 0.1) 4px
        );
        pointer-events: none;
        border-radius: inherit;
    }
    
    .admin-restricted:hover {
        filter: grayscale(50%) brightness(0.9);
        transform: scale(0.98);
    }
    
    .permission-denied {
        animation: shake 0.5s ease-in-out !important;
        background: linear-gradient(135deg, rgba(220, 38, 127, 0.9), rgba(239, 68, 68, 0.9)) !important;
        border: 2px solid rgba(255, 255, 255, 0.3) !important;
        box-shadow: 0 20px 40px rgba(220, 38, 127, 0.4) !important;
    }
    
    .permission-icon svg {
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }
    
    .participant-item {
        position: relative;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .participant-item::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        transition: left 0.5s ease;
    }
    
    .participant-item:hover::before {
        left: 100%;
    }
    
    .participant-item:hover {
        transform: translateY(-3px) scale(1.02);
        box-shadow: 0 15px 35px rgba(255, 215, 0, 0.3) !important;
        background: rgba(255, 215, 0, 0.15) !important;
        border-color: rgba(255, 215, 0, 0.4) !important;
    }
    
    .transfer-icon {
        transition: all 0.3s ease;
    }
    
    .transfer-icon:hover {
        transform: scale(1.1) rotate(10deg);
        box-shadow: 0 5px 20px rgba(255, 215, 0, 0.4);
    }
    
    #adminTransferBtn {
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid rgba(255, 255, 255, 0.125);
    }
    
    #adminTransferBtn:hover {
        transform: translateX(-50%) translateY(-5px) scale(1.05);
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
    }
    
    .admin-transfer-modal {
        animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .transfer-content {
        animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(50px) scale(0.9);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    /* Mobile optimizations */
    @media (max-width: 768px) {
        .admin-indicator {
            top: 15px;
            right: 15px;
            padding: 0.4rem 0.8rem;
            font-size: 0.85rem;
            border-radius: 20px;
        }
        
        .admin-indicator .admin-icon svg {
            width: 14px;
            height: 14px;
        }
        
        #adminTransferBtn {
            bottom: 80px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            padding: 0.6rem 1.2rem;
            font-size: 0.9rem;
            border-radius: 25px;
            min-width: 140px;
        }
        
        #adminTransferBtn:hover {
            transform: translateX(-50%) translateY(-3px) scale(1.02) !important;
        }
        
        .transfer-content {
            width: 95% !important;
            padding: 1.5rem !important;
            margin: 1rem;
            border-radius: 15px;
        }
        
        .participant-item {
            padding: 1rem !important;
            margin-bottom: 0.75rem !important;
            border-radius: 12px;
        }
        
        .participant-avatar {
            width: 35px !important;
            height: 35px !important;
            font-size: 1rem !important;
        }
        
        .permission-denied {
            padding: 0.8rem 1.5rem !important;
            font-size: 1rem !important;
            border-radius: 25px !important;
        }
        
        .permission-icon svg {
            width: 18px !important;
            height: 18px !important;
        }
        
        .transfer-icon {
            padding: 0.4rem !important;
        }
        
        .transfer-icon svg {
            width: 20px !important;
            height: 20px !important;
        }
    }
    
    @media (max-width: 480px) {
        .admin-indicator {
            top: 10px;
            right: 10px;
            padding: 0.3rem 0.6rem;
            font-size: 0.8rem;
        }
        
        .transfer-content {
            width: 98% !important;
            padding: 1rem !important;
        }
        
        #adminTransferBtn {
            bottom: 70px !important;
            padding: 0.5rem 1rem;
            font-size: 0.85rem;
            min-width: 120px;
        }
    }
`;
document.head.appendChild(adminStyles);

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.adminControlSystem = new AdminControlSystem();
    });
} else {
    window.adminControlSystem = new AdminControlSystem();
}
