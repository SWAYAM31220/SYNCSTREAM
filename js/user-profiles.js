/**
 * SYNCSTREAM USER PROFILES
 * User registration, avatars, viewing history, and social features
 */

class UserProfileSystem {
    constructor() {
        this.currentUser = null;
        this.users = new Map();
        this.friends = new Map();
        this.viewingHistory = [];
        this.avatarSystem = null;
        this.toast = null;
        this.isProfileModalVisible = false;
        
        this.init();
    }
    
    init() {
        this.toast = window.ToastManager ? new window.ToastManager() : null;
        this.avatarSystem = new AvatarSystem();
        this.loadUserData();
        this.createProfileButton();
        this.createProfileModal();
        this.createAvatarSelector();
        this.bindEvents();
        this.initializeGuestUser();
    }
    
    loadUserData() {
        // Load user data from localStorage (in production, this would be from a database)
        const userData = localStorage.getItem('syncstream_user');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
            } catch (e) {
                console.warn('Failed to load user data:', e);
            }
        }
        
        // Load viewing history
        const history = localStorage.getItem('syncstream_viewing_history');
        if (history) {
            try {
                this.viewingHistory = JSON.parse(history);
            } catch (e) {
                console.warn('Failed to load viewing history:', e);
            }
        }
    }
    
    saveUserData() {
        if (this.currentUser) {
            localStorage.setItem('syncstream_user', JSON.stringify(this.currentUser));
        }
        localStorage.setItem('syncstream_viewing_history', JSON.stringify(this.viewingHistory));
    }
    
    initializeGuestUser() {
        if (!this.currentUser) {
            this.currentUser = {
                id: 'guest_' + Math.random().toString(36).substring(2, 8),
                name: 'Guest User',
                email: null,
                avatar: this.avatarSystem.getRandomAvatar(),
                isGuest: true,
                createdAt: Date.now(),
                preferences: {
                    theme: 'auto',
                    notifications: true,
                    autoJoin: false
                },
                stats: {
                    totalWatchTime: 0,
                    roomsJoined: 0,
                    messagesSet: 0,
                    reactionsGiven: 0
                }
            };
            this.saveUserData();
        }
        
        this.updateUserDisplay();
    }
    
    createProfileButton() {
        // Add to header
        const header = document.querySelector('.site-header, .room-header');
        if (header) {
            const profileBtn = document.createElement('button');
            profileBtn.id = 'profileBtn';
            profileBtn.className = 'profile-btn btn btn-sm btn-ghost-luxury';
            profileBtn.innerHTML = `
                <div class="profile-avatar-mini" style="
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 0.5rem;
                    font-size: 1rem;
                ">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <span class="profile-name">Profile</span>
            `;
            profileBtn.setAttribute('aria-label', 'Open user profile');
            profileBtn.style.cssText = `
                position: absolute;
                top: 1rem;
                left: 1rem;
                z-index: 100;
                display: flex;
                align-items: center;
                background: rgba(108, 99, 255, 0.2);
                border: 1px solid rgba(255, 215, 0, 0.3);
                padding: 0.5rem 1rem;
                border-radius: 25px;
                backdrop-filter: blur(20px);
                transition: all 0.3s ease;
            `;
            
            profileBtn.addEventListener('click', () => this.toggleProfileModal());
            
            profileBtn.addEventListener('mouseenter', () => {
                profileBtn.style.background = 'rgba(255, 215, 0, 0.2)';
                profileBtn.style.transform = 'scale(1.05)';
            });
            
            profileBtn.addEventListener('mouseleave', () => {
                profileBtn.style.background = 'rgba(108, 99, 255, 0.2)';
                profileBtn.style.transform = 'scale(1)';
            });
            
            header.appendChild(profileBtn);
        }
    }
    
    createProfileModal() {
        const modal = document.createElement('div');
        modal.id = 'profileModal';
        modal.className = 'profile-modal glass-luxury';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(20px);
            z-index: 10000;
            display: none;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div class="profile-content glass-luxury" style="
                width: 90%;
                max-width: 600px;
                background: linear-gradient(135deg, rgba(108, 99, 255, 0.1), rgba(255, 215, 0, 0.05));
                border-radius: 20px;
                padding: 2rem;
                position: relative;
                border: 1px solid rgba(255, 215, 0, 0.2);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                max-height: 80vh;
                overflow-y: auto;
            ">
                <div class="profile-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    border-bottom: 1px solid rgba(255, 215, 0, 0.2);
                    padding-bottom: 1rem;
                ">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div class="profile-icon" style="padding: 0.5rem; background: rgba(255, 215, 0, 0.1); border-radius: 50%; border: 1px solid rgba(255, 215, 0, 0.3);">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <circle cx="12" cy="7" r="4" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <h2 class="text-luxury" style="margin: 0; font-size: 1.8rem;">User Profile</h2>
                    </div>
                    <button id="closeProfile" class="btn btn-sm btn-ghost" style="
                        background: rgba(255, 0, 0, 0.2);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 35px;
                        height: 35px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease;
                    ">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
                
                <div class="profile-sections">
                    <div class="profile-basic glass-luxury" style="
                        background: rgba(108, 99, 255, 0.1);
                        padding: 1.5rem;
                        border-radius: 15px;
                        border: 1px solid rgba(255, 215, 0, 0.2);
                        margin-bottom: 1.5rem;
                    ">
                        <div class="profile-avatar-section" style="
                            display: flex;
                            align-items: center;
                            gap: 1.5rem;
                            margin-bottom: 1.5rem;
                        ">
                            <div id="currentAvatar" class="profile-avatar" style="
                                width: 80px;
                                height: 80px;
                                border-radius: 50%;
                                background: linear-gradient(135deg, #667eea, #764ba2);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 2.5rem;
                                border: 3px solid rgba(255, 215, 0, 0.3);
                                cursor: pointer;
                                transition: all 0.3s ease;
                            ">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div class="avatar-info">
                                <div class="avatar-label" style="
                                    color: rgba(255, 255, 255, 0.7);
                                    font-size: 0.9rem;
                                    margin-bottom: 0.5rem;
                                ">Click avatar to change</div>
                                <button id="changeAvatarBtn" class="btn btn-sm btn-secondary-luxury" style="display: flex; align-items: center; gap: 0.5rem;">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/>
                                        <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/>
                                        <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/>
                                        <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor"/>
                                        <path d="M12 2C13.3132 2 14.6136 2.25866 15.8268 2.7612C17.0401 3.26375 18.1425 4.00035 19.0711 4.92893C19.9997 5.85752 20.7362 6.95991 21.2388 8.17317C21.7413 9.38642 22 10.6868 22 12L12 12V2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M21.21 15.89A10 10 0 1 1 8.11 2.79" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    <span>Change Avatar</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="profile-form">
                            <div class="form-group" style="margin-bottom: 1rem;">
                                <label for="userName" style="
                                    display: block;
                                    color: #FFD700;
                                    margin-bottom: 0.5rem;
                                    font-weight: 600;
                                ">Display Name</label>
                                <input type="text" id="userName" class="input" placeholder="Your name" style="
                                    width: 100%;
                                    padding: 0.75rem;
                                    border: 1px solid rgba(255, 215, 0, 0.3);
                                    border-radius: 10px;
                                    background: rgba(255, 215, 0, 0.1);
                                    color: white;
                                ">
                            </div>
                            
                            <div class="form-group" style="margin-bottom: 1rem;">
                                <label for="userEmail" style="
                                    display: block;
                                    color: #FFD700;
                                    margin-bottom: 0.5rem;
                                    font-weight: 600;
                                ">Email (Optional)</label>
                                <input type="email" id="userEmail" class="input" placeholder="your@email.com" style="
                                    width: 100%;
                                    padding: 0.75rem;
                                    border: 1px solid rgba(255, 215, 0, 0.3);
                                    border-radius: 10px;
                                    background: rgba(255, 215, 0, 0.1);
                                    color: white;
                                ">
                            </div>
                            
                            <button id="saveProfileBtn" class="btn btn-primary-luxury" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                                    <polyline points="17,21 17,13 7,13 7,21" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                                    <polyline points="7,3 7,8 15,8" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                                </svg>
                                <span>Save Profile</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="profile-stats glass-luxury" style="
                        background: rgba(138, 43, 226, 0.1);
                        padding: 1.5rem;
                        border-radius: 15px;
                        border: 1px solid rgba(255, 215, 0, 0.2);
                        margin-bottom: 1.5rem;
                    ">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                            <div class="stats-icon" style="padding: 0.4rem; background: rgba(255, 215, 0, 0.1); border-radius: 8px; border: 1px solid rgba(255, 215, 0, 0.3);">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <line x1="12" y1="20" x2="12" y2="10" stroke="#FFD700" stroke-width="2" stroke-linecap="round"/>
                                    <line x1="18" y1="20" x2="18" y2="4" stroke="#FFD700" stroke-width="2" stroke-linecap="round"/>
                                    <line x1="6" y1="20" x2="6" y2="16" stroke="#FFD700" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </div>
                            <h3 class="text-luxury" style="margin: 0; font-size: 1.3rem;">Your Stats</h3>
                        </div>
                        <div class="stats-grid" style="
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 1rem;
                        ">
                            <div class="stat-item" style="text-align: center;">
                                <div class="stat-value" id="userWatchTime" style="
                                    font-size: 1.5rem;
                                    font-weight: bold;
                                    color: #FFD700;
                                ">0h</div>
                                <div class="stat-label" style="
                                    color: rgba(255, 255, 255, 0.7);
                                    font-size: 0.9rem;
                                ">Watch Time</div>
                            </div>
                            <div class="stat-item" style="text-align: center;">
                                <div class="stat-value" id="userRooms" style="
                                    font-size: 1.5rem;
                                    font-weight: bold;
                                    color: #FFD700;
                                ">0</div>
                                <div class="stat-label" style="
                                    color: rgba(255, 255, 255, 0.7);
                                    font-size: 0.9rem;
                                ">Rooms Joined</div>
                            </div>
                            <div class="stat-item" style="text-align: center;">
                                <div class="stat-value" id="userMessages" style="
                                    font-size: 1.5rem;
                                    font-weight: bold;
                                    color: #FFD700;
                                ">0</div>
                                <div class="stat-label" style="
                                    color: rgba(255, 255, 255, 0.7);
                                    font-size: 0.9rem;
                                ">Messages</div>
                            </div>
                            <div class="stat-item" style="text-align: center;">
                                <div class="stat-value" id="userReactions" style="
                                    font-size: 1.5rem;
                                    font-weight: bold;
                                    color: #FFD700;
                                ">0</div>
                                <div class="stat-label" style="
                                    color: rgba(255, 255, 255, 0.7);
                                    font-size: 0.9rem;
                                ">Reactions</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="profile-history glass-luxury" style="
                        background: rgba(255, 215, 0, 0.1);
                        padding: 1.5rem;
                        border-radius: 15px;
                        border: 1px solid rgba(255, 215, 0, 0.3);
                        margin-bottom: 1.5rem;
                    ">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                            <div class="history-icon" style="padding: 0.4rem; background: rgba(255, 215, 0, 0.1); border-radius: 8px; border: 1px solid rgba(255, 215, 0, 0.3);">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="2" y="4" width="20" height="16" rx="2" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M8 2V6" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M16 2V6" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <polygon points="10,12 14,10 14,14" fill="#FFD700"/>
                                </svg>
                            </div>
                            <h3 class="text-luxury" style="margin: 0; font-size: 1.3rem;">Viewing History</h3>
                        </div>
                        <div id="viewingHistory" class="history-list">
                            <div class="loading-state">No viewing history yet</div>
                        </div>
                    </div>
                    
                    <div class="profile-preferences glass-luxury" style="
                        background: rgba(108, 99, 255, 0.1);
                        padding: 1.5rem;
                        border-radius: 15px;
                        border: 1px solid rgba(255, 215, 0, 0.2);
                    ">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                            <div class="preferences-icon" style="padding: 0.4rem; background: rgba(255, 215, 0, 0.1); border-radius: 8px; border: 1px solid rgba(255, 215, 0, 0.3);">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="3" stroke="#FFD700" stroke-width="2"/>
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82L20 17a2 2 0 0 1 0 2.83L19 20a2 2 0 0 1-2.83 0L15.82 19.67a1.65 1.65 0 0 0-1.82.33 1.65 1.65 0 0 0-1.65 1v.83a2 2 0 0 1-2 2H8.5a2 2 0 0 1-2-2v-.83a1.65 1.65 0 0 0-1.65-1 1.65 1.65 0 0 0-1.82-.33L2.67 20a2 2 0 0 1-2.83 0L0 19a2 2 0 0 1 0-2.83L.33 15.82a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1-1.65H.83a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2h.83a1.65 1.65 0 0 0 1-1.65 1.65 1.65 0 0 0-.33-1.82L.33 2.67a2 2 0 0 1 0-2.83L2 .33a2 2 0 0 1 2.83 0L5.18.33a1.65 1.65 0 0 0 1.82.33H7a1.65 1.65 0 0 0 1.65 1H8.5a2 2 0 0 1 2 2v.83a1.65 1.65 0 0 0 1 1.65 1.65 1.65 0 0 0 1.82-.33L14.67.33a2 2 0 0 1 2.83 0L20 2a2 2 0 0 1 0 2.83L19.67 5.18a1.65 1.65 0 0 0-.33 1.82V7a1.65 1.65 0 0 0 1 1.65h.83a2 2 0 0 1 2 2V12.5a2 2 0 0 1-2 2h-.83a1.65 1.65 0 0 0-1 1.65Z" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <h3 class="text-luxury" style="margin: 0; font-size: 1.3rem;">Preferences</h3>
                        </div>
                        <div class="preference-item" style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 1rem;
                        ">
                            <label style="color: white;">Enable Notifications</label>
                            <input type="checkbox" id="prefNotifications" class="toggle-switch">
                        </div>
                        <div class="preference-item" style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 1rem;
                        ">
                            <label style="color: white;">Auto-join Rooms</label>
                            <input type="checkbox" id="prefAutoJoin" class="toggle-switch">
                        </div>
                        <div class="preference-item" style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        ">
                            <label style="color: white;">Theme</label>
                            <select id="prefTheme" class="input" style="
                                padding: 0.5rem;
                                border-radius: 8px;
                                background: rgba(255, 215, 0, 0.1);
                                border: 1px solid rgba(255, 215, 0, 0.3);
                                color: white;
                                width: 120px;
                            ">
                                <option value="auto">Auto</option>
                                <option value="dark">Dark</option>
                                <option value="light">Light</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    createAvatarSelector() {
        const selector = document.createElement('div');
        selector.id = 'avatarSelector';
        selector.className = 'avatar-selector glass-luxury';
        selector.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(20px);
            z-index: 10001;
            display: none;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;
        
        const avatars = this.avatarSystem.getAllAvatars();
        
        selector.innerHTML = `
            <div class="avatar-selector-content glass-luxury" style="
                width: 90%;
                max-width: 600px;
                background: linear-gradient(135deg, rgba(108, 99, 255, 0.15), rgba(255, 215, 0, 0.1));
                border-radius: 20px;
                padding: 2rem;
                border: 1px solid rgba(255, 215, 0, 0.3);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
                max-height: 70vh;
                overflow-y: auto;
            ">
                <div class="selector-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    border-bottom: 1px solid rgba(255, 215, 0, 0.3);
                    padding-bottom: 1rem;
                ">
                    <h3 class="text-luxury" style="margin: 0; font-size: 1.5rem;">
                        🎨 Choose Your Avatar
                    </h3>
                    <button id="closeAvatarSelector" class="btn btn-sm btn-ghost" style="
                        background: rgba(255, 0, 0, 0.2);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 35px;
                        height: 35px;
                    ">✕</button>
                </div>
                
                <div class="avatar-categories">
                    <div class="category-tabs" style="
                        display: flex;
                        gap: 1rem;
                        margin-bottom: 1.5rem;
                        flex-wrap: wrap;
                    ">
                        ${Object.keys(avatars).map(category => `
                            <button class="category-tab btn btn-sm btn-secondary-luxury" data-category="${category}" style="
                                padding: 0.5rem 1rem;
                                border-radius: 20px;
                                font-size: 0.9rem;
                            ">
                                ${category.charAt(0).toUpperCase() + category.slice(1)}
                            </button>
                        `).join('')}
                    </div>
                    
                    <div class="avatar-grid" id="avatarGrid" style="
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
                        gap: 1rem;
                        max-height: 300px;
                        overflow-y: auto;
                        padding: 1rem;
                        background: rgba(255, 215, 0, 0.05);
                        border-radius: 15px;
                        border: 1px solid rgba(255, 215, 0, 0.2);
                    ">
                        <!-- Avatars will be populated here -->
                    </div>
                </div>
                
                <div class="selector-actions" style="
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    margin-top: 1.5rem;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(255, 215, 0, 0.2);
                ">
                    <button id="randomAvatarBtn" class="btn btn-secondary-luxury">
                        🎲 Random Avatar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(selector);
    }
    
    toggleProfileModal() {
        const modal = document.getElementById('profileModal');
        if (!modal) return;
        
        if (this.isProfileModalVisible) {
            this.hideProfileModal();
        } else {
            this.showProfileModal();
        }
    }
    
    showProfileModal() {
        const modal = document.getElementById('profileModal');
        if (!modal) return;
        
        this.isProfileModalVisible = true;
        modal.style.display = 'flex';
        
        this.populateProfileModal();
        this.bindProfileEvents();
        
        if (this.toast) {
            this.toast.info('Profile opened');
        }
    }
    
    hideProfileModal() {
        const modal = document.getElementById('profileModal');
        if (!modal) return;
        
        this.isProfileModalVisible = false;
        modal.style.display = 'none';
    }
    
    populateProfileModal() {
        if (!this.currentUser) return;
        
        // Populate basic info
        document.getElementById('userName').value = this.currentUser.name || '';
        document.getElementById('userEmail').value = this.currentUser.email || '';
        document.getElementById('currentAvatar').textContent = this.currentUser.avatar || '👤';
        
        // Populate stats
        document.getElementById('userWatchTime').textContent = 
            Math.round((this.currentUser.stats?.totalWatchTime || 0) / 3600) + 'h';
        document.getElementById('userRooms').textContent = this.currentUser.stats?.roomsJoined || 0;
        document.getElementById('userMessages').textContent = this.currentUser.stats?.messagesSet || 0;
        document.getElementById('userReactions').textContent = this.currentUser.stats?.reactionsGiven || 0;
        
        // Populate preferences
        document.getElementById('prefNotifications').checked = this.currentUser.preferences?.notifications !== false;
        document.getElementById('prefAutoJoin').checked = this.currentUser.preferences?.autoJoin === true;
        document.getElementById('prefTheme').value = this.currentUser.preferences?.theme || 'auto';
        
        // Populate viewing history
        this.populateViewingHistory();
    }
    
    populateViewingHistory() {
        const container = document.getElementById('viewingHistory');
        if (!container) return;
        
        if (this.viewingHistory.length === 0) {
            container.innerHTML = '<div class="loading-state">No viewing history yet</div>';
            return;
        }
        
        const recentHistory = this.viewingHistory.slice(-10).reverse();
        
        container.innerHTML = recentHistory.map(item => `
            <div class="history-item" style="
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 0.75rem;
                background: rgba(255, 215, 0, 0.05);
                border-radius: 10px;
                margin-bottom: 0.5rem;
                border: 1px solid rgba(255, 215, 0, 0.1);
            ">
                <div class="history-icon" style="
                    font-size: 1.5rem;
                    width: 40px;
                    text-align: center;
                ">🎬</div>
                <div class="history-info" style="flex: 1;">
                    <div class="history-title" style="
                        color: white;
                        font-weight: 600;
                        font-size: 0.9rem;
                        margin-bottom: 0.2rem;
                    ">${item.title || 'Unknown Video'}</div>
                    <div class="history-time" style="
                        color: rgba(255, 255, 255, 0.6);
                        font-size: 0.8rem;
                    ">${new Date(item.timestamp).toLocaleDateString()}</div>
                </div>
                <div class="history-duration" style="
                    color: #FFD700;
                    font-size: 0.8rem;
                    font-weight: 600;
                ">${Math.round((item.duration || 0) / 60)}m</div>
            </div>
        `).join('');
    }
    
    bindProfileEvents() {
        // Save profile
        document.getElementById('saveProfileBtn').addEventListener('click', () => {
            this.saveProfile();
        });
        
        // Change avatar
        document.getElementById('changeAvatarBtn').addEventListener('click', () => {
            this.showAvatarSelector();
        });
        
        document.getElementById('currentAvatar').addEventListener('click', () => {
            this.showAvatarSelector();
        });
        
        // Close modal
        document.getElementById('closeProfile').addEventListener('click', () => {
            this.hideProfileModal();
        });
        
        // Close on backdrop click
        document.getElementById('profileModal').addEventListener('click', (e) => {
            if (e.target.id === 'profileModal') {
                this.hideProfileModal();
            }
        });
        
        // Preferences
        document.getElementById('prefNotifications').addEventListener('change', (e) => {
            this.updatePreference('notifications', e.target.checked);
        });
        
        document.getElementById('prefAutoJoin').addEventListener('change', (e) => {
            this.updatePreference('autoJoin', e.target.checked);
        });
        
        document.getElementById('prefTheme').addEventListener('change', (e) => {
            this.updatePreference('theme', e.target.value);
            this.applyTheme(e.target.value);
        });
    }
    
    showAvatarSelector() {
        const selector = document.getElementById('avatarSelector');
        if (!selector) return;
        
        selector.style.display = 'flex';
        this.populateAvatarGrid('emoji'); // Default category
        this.bindAvatarSelectorEvents();
    }
    
    hideAvatarSelector() {
        const selector = document.getElementById('avatarSelector');
        if (selector) {
            selector.style.display = 'none';
        }
    }
    
    populateAvatarGrid(category) {
        const grid = document.getElementById('avatarGrid');
        if (!grid) return;
        
        const avatars = this.avatarSystem.getAvatarsByCategory(category);
        
        grid.innerHTML = avatars.map(avatar => `
            <div class="avatar-option" data-avatar="${avatar}" style="
                width: 60px;
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, rgba(108, 99, 255, 0.2), rgba(255, 215, 0, 0.1));
                border-radius: 50%;
                font-size: 2rem;
                cursor: pointer;
                border: 2px solid transparent;
                transition: all 0.3s ease;
                ${this.currentUser?.avatar === avatar ? 'border-color: #FFD700; background: rgba(255, 215, 0, 0.2);' : ''}
            ">
                ${avatar}
            </div>
        `).join('');
    }
    
    bindAvatarSelectorEvents() {
        // Category tabs
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Update active tab
                document.querySelectorAll('.category-tab').forEach(t => {
                    t.style.background = 'rgba(108, 99, 255, 0.2)';
                });
                e.target.style.background = 'rgba(255, 215, 0, 0.3)';
                
                // Update grid
                this.populateAvatarGrid(e.target.dataset.category);
            });
        });
        
        // Avatar selection
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('avatar-option')) {
                const avatar = e.target.dataset.avatar;
                this.selectAvatar(avatar);
            }
        });
        
        // Random avatar
        document.getElementById('randomAvatarBtn').addEventListener('click', () => {
            const randomAvatar = this.avatarSystem.getRandomAvatar();
            this.selectAvatar(randomAvatar);
        });
        
        // Close selector
        document.getElementById('closeAvatarSelector').addEventListener('click', () => {
            this.hideAvatarSelector();
        });
    }
    
    selectAvatar(avatar) {
        if (this.currentUser) {
            this.currentUser.avatar = avatar;
            this.saveUserData();
            this.updateUserDisplay();
            this.hideAvatarSelector();
            
            // Update current avatar in profile modal
            const currentAvatar = document.getElementById('currentAvatar');
            if (currentAvatar) {
                currentAvatar.textContent = avatar;
            }
            
            if (this.toast) {
                this.toast.success('Avatar updated!');
            }
        }
    }
    
    saveProfile() {
        if (!this.currentUser) return;
        
        const name = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        
        if (!name) {
            if (this.toast) {
                this.toast.warning('Please enter a display name');
            }
            return;
        }
        
        this.currentUser.name = name;
        this.currentUser.email = email || null;
        this.currentUser.isGuest = !email; // If email provided, no longer a guest
        
        this.saveUserData();
        this.updateUserDisplay();
        
        if (this.toast) {
            this.toast.success('Profile saved successfully!');
        }
    }
    
    updatePreference(key, value) {
        if (this.currentUser) {
            this.currentUser.preferences[key] = value;
            this.saveUserData();
            
            if (this.toast) {
                this.toast.info(`Preference updated: ${key}`);
            }
        }
    }
    
    applyTheme(theme) {
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
        
        if (theme === 'auto') {
            // Use system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    }
    
    updateUserDisplay() {
        // Update profile button
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn && this.currentUser) {
            const avatar = profileBtn.querySelector('.profile-avatar-mini');
            const name = profileBtn.querySelector('.profile-name');
            
            if (avatar) {
                avatar.textContent = this.currentUser.avatar || '👤';
            }
            
            if (name) {
                name.textContent = this.currentUser.name || 'Profile';
            }
        }
        
        // Update any other user displays in the app
        this.updateUserDisplayInChat();
    }
    
    updateUserDisplayInChat() {
        // Update user display in chat if available
        const currentUserElement = document.getElementById('currentUser');
        if (currentUserElement && this.currentUser) {
            currentUserElement.textContent = this.currentUser.name;
        }
    }
    
    // Public methods for other components to use
    
    addToViewingHistory(videoData) {
        const historyItem = {
            id: Date.now().toString(),
            videoUrl: videoData.url,
            title: videoData.title || 'Unknown Video',
            thumbnail: videoData.thumbnail || null,
            duration: videoData.duration || 0,
            timestamp: Date.now()
        };
        
        this.viewingHistory.push(historyItem);
        
        // Keep only last 50 items
        if (this.viewingHistory.length > 50) {
            this.viewingHistory = this.viewingHistory.slice(-50);
        }
        
        this.saveUserData();
        
        // Update stats
        this.updateUserStats('totalWatchTime', videoData.duration || 0);
    }
    
    updateUserStats(statType, value) {
        if (!this.currentUser) return;
        
        if (!this.currentUser.stats) {
            this.currentUser.stats = {
                totalWatchTime: 0,
                roomsJoined: 0,
                messagesSet: 0,
                reactionsGiven: 0
            };
        }
        
        switch (statType) {
            case 'totalWatchTime':
                this.currentUser.stats.totalWatchTime += value;
                break;
            case 'roomsJoined':
                this.currentUser.stats.roomsJoined++;
                break;
            case 'messagesSet':
                this.currentUser.stats.messagesSet++;
                break;
            case 'reactionsGiven':
                this.currentUser.stats.reactionsGiven++;
                break;
        }
        
        this.saveUserData();
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    bindEvents() {
        // Global event listeners for tracking user activity
        
        // Track chat messages
        document.addEventListener('click', (e) => {
            if (e.target.id === 'sendBtn' || 
                (e.target.closest('form') && e.target.closest('form').id === 'chatForm')) {
                this.updateUserStats('messagesSet', 1);
            }
        });
        
        // Track reactions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('emoji-btn') || 
                e.target.classList.contains('reaction-count')) {
                this.updateUserStats('reactionsGiven', 1);
            }
        });
        
        // Track room joins
        if (window.location.pathname.includes('room.html')) {
            this.updateUserStats('roomsJoined', 1);
        }
    }
}

// Avatar System Class
class AvatarSystem {
    constructor() {
        this.avatars = {
            emoji: [
                '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
                '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚',
                '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩'
            ],
            animals: [
                '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
                '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔'
            ],
            objects: [
                '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
                '🎮', '🕹️', '🎲', '🎯', '🎳', '🎪', '🎨', '🎭', '🎪', '🎫'
            ],
            nature: [
                '🌸', '🌺', '🌻', '🌷', '🌹', '🥀', '🌲', '🌳', '🌴', '🌵',
                '🌾', '🌿', '☘️', '🍀', '🍃', '🍂', '🍁', '🌰', '🌱', '🌙'
            ],
            food: [
                '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑',
                '🥝', '🍅', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🥒', '🥬'
            ]
        };
    }
    
    getAllAvatars() {
        return this.avatars;
    }
    
    getAvatarsByCategory(category) {
        return this.avatars[category] || this.avatars.emoji;
    }
    
    getRandomAvatar() {
        const allAvatars = Object.values(this.avatars).flat();
        return allAvatars[Math.floor(Math.random() * allAvatars.length)];
    }
}

// CSS for toggle switches and additional styling
const profileStyles = document.createElement('style');
profileStyles.textContent = `
    .toggle-switch {
        appearance: none;
        width: 50px;
        height: 26px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 13px;
        position: relative;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 1px solid rgba(255, 215, 0, 0.3);
    }
    
    .toggle-switch:checked {
        background: rgba(255, 215, 0, 0.3);
    }
    
    .toggle-switch::before {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: white;
        top: 2px;
        left: 2px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .toggle-switch:checked::before {
        transform: translateX(24px);
        background: #FFD700;
    }
    
    .avatar-option:hover {
        transform: scale(1.1);
        border-color: rgba(255, 215, 0, 0.5) !important;
        background: rgba(255, 215, 0, 0.2) !important;
    }
    
    .category-tab.active {
        background: rgba(255, 215, 0, 0.3) !important;
    }
    
    @media (max-width: 768px) {
        .profile-content, .avatar-selector-content {
            width: 95%;
            padding: 1rem;
        }
        
        .stats-grid {
            grid-template-columns: 1fr !important;
        }
        
        .profile-avatar-section {
            flex-direction: column;
            text-align: center;
        }
    }
`;
document.head.appendChild(profileStyles);

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.userProfileSystem = new UserProfileSystem();
    });
} else {
    window.userProfileSystem = new UserProfileSystem();
}
