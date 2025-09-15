/**
 * SYNCSTREAM ANALYTICS DASHBOARD
 * Real-time analytics and insights for watch parties
 */

class AnalyticsDashboard {
    constructor() {
        this.analytics = {
            rooms: new Map(),
            users: new Map(),
            videos: new Map(),
            globalStats: {
                totalRooms: 0,
                totalUsers: 0,
                totalVideos: 0,
                totalWatchTime: 0,
                popularEmojis: {},
                peakUsers: 0,
                avgRoomSize: 0
            }
        };
        
        this.isVisible = false;
        this.updateInterval = null;
        this.toast = null;
        
        this.init();
    }
    
    init() {
        this.toast = window.ToastManager ? new window.ToastManager() : null;
        this.createDashboardButton();
        this.createDashboardModal();
        this.startAnalyticsCollection();
        this.bindEvents();
    }
    
    createDashboardButton() {
        // Add to video controls if in room
        const videoControls = document.querySelector('.video-controls');
        if (videoControls) {
            const analyticsBtn = document.createElement('button');
            analyticsBtn.id = 'analyticsBtn';
            analyticsBtn.className = 'btn btn-sm btn-secondary btn-secondary-luxury glow-on-hover';
            analyticsBtn.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="20" x2="12" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <line x1="18" y1="20" x2="18" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <line x1="6" y1="20" x2="6" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <span>Analytics</span>
                </div>
            `;
            analyticsBtn.setAttribute('aria-label', 'View room analytics');
            analyticsBtn.setAttribute('title', 'Real-time room statistics');
            
            analyticsBtn.addEventListener('click', () => this.toggleDashboard());
            videoControls.appendChild(analyticsBtn);
        }
        
        // Add to main page
        const header = document.querySelector('.site-header, .room-header');
        if (header && !document.getElementById('analyticsBtn')) {
            const analyticsBtn = document.createElement('button');
            analyticsBtn.id = 'analyticsBtn';
            analyticsBtn.className = 'btn btn-sm btn-ghost btn-ghost-luxury';
            analyticsBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="12" y1="20" x2="12" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <line x1="18" y1="20" x2="18" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <line x1="6" y1="20" x2="6" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            `;
            analyticsBtn.setAttribute('aria-label', 'View platform analytics');
            analyticsBtn.style.cssText = `
                position: absolute;
                top: 1rem;
                right: 1rem;
                z-index: 100;
            `;
            
            analyticsBtn.addEventListener('click', () => this.toggleDashboard());
            header.appendChild(analyticsBtn);
        }
    }
    
    createDashboardModal() {
        const modal = document.createElement('div');
        modal.id = 'analyticsModal';
        modal.className = 'analytics-modal glass-luxury';
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
            <div class="analytics-content glass-luxury" style="
                width: 90%;
                max-width: 1200px;
                height: 90%;
                background: linear-gradient(135deg, rgba(108, 99, 255, 0.1), rgba(255, 215, 0, 0.05));
                border-radius: 20px;
                padding: 2rem;
                position: relative;
                overflow-y: auto;
                border: 1px solid rgba(255, 215, 0, 0.2);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            ">
                <div class="analytics-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    border-bottom: 1px solid rgba(255, 215, 0, 0.2);
                    padding-bottom: 1rem;
                ">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div class="analytics-icon" style="padding: 0.75rem; background: rgba(255, 215, 0, 0.1); border-radius: 12px; border: 1px solid rgba(255, 215, 0, 0.3);">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <line x1="12" y1="20" x2="12" y2="10" stroke="#FFD700" stroke-width="2" stroke-linecap="round"/>
                                <line x1="18" y1="20" x2="18" y2="4" stroke="#FFD700" stroke-width="2" stroke-linecap="round"/>
                                <line x1="6" y1="20" x2="6" y2="16" stroke="#FFD700" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <h2 class="text-luxury" style="margin: 0; font-size: 2rem;">SyncStream Analytics</h2>
                    </div>
                    <button id="closeAnalytics" class="btn btn-sm btn-ghost" style="
                        background: rgba(255, 0, 0, 0.2);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease;
                    ">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
                
                <div class="analytics-grid" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                ">
                    <div class="stat-card glass-luxury" style="
                        background: rgba(108, 99, 255, 0.1);
                        padding: 1.5rem;
                        border-radius: 15px;
                        border: 1px solid rgba(255, 215, 0, 0.2);
                        text-align: center;
                    ">
                        <div class="stat-icon" style="margin-bottom: 1rem; padding: 0.75rem; background: rgba(255, 215, 0, 0.1); border-radius: 50%; border: 1px solid rgba(255, 215, 0, 0.3); display: inline-block;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <polyline points="9,22 9,12 15,12 15,22" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="stat-value" id="totalRooms" style="font-size: 2rem; font-weight: bold; color: #FFD700;">0</div>
                        <div class="stat-label" style="color: rgba(255, 255, 255, 0.7);">Total Rooms</div>
                    </div>
                    
                    <div class="stat-card glass-luxury" style="
                        background: rgba(108, 99, 255, 0.1);
                        padding: 1.5rem;
                        border-radius: 15px;
                        border: 1px solid rgba(255, 215, 0, 0.2);
                        text-align: center;
                    ">
                        <div class="stat-icon" style="margin-bottom: 1rem; padding: 0.75rem; background: rgba(255, 215, 0, 0.1); border-radius: 50%; border: 1px solid rgba(255, 215, 0, 0.3); display: inline-block;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <circle cx="9" cy="7" r="4" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="stat-value" id="totalUsers" style="font-size: 2rem; font-weight: bold; color: #FFD700;">0</div>
                        <div class="stat-label" style="color: rgba(255, 255, 255, 0.7);">Active Users</div>
                    </div>
                    
                    <div class="stat-card glass-luxury" style="
                        background: rgba(108, 99, 255, 0.1);
                        padding: 1.5rem;
                        border-radius: 15px;
                        border: 1px solid rgba(255, 215, 0, 0.2);
                        text-align: center;
                    ">
                        <div class="stat-icon" style="margin-bottom: 1rem; padding: 0.75rem; background: rgba(255, 215, 0, 0.1); border-radius: 50%; border: 1px solid rgba(255, 215, 0, 0.3); display: inline-block;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <polygon points="23,12 8,22 8,2" fill="#FFD700" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <rect x="1" y="7" width="6" height="10" rx="1" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                            </svg>
                        </div>
                        <div class="stat-value" id="totalVideos" style="font-size: 2rem; font-weight: bold; color: #FFD700;">0</div>
                        <div class="stat-label" style="color: rgba(255, 255, 255, 0.7);">Videos Watched</div>
                    </div>
                    
                    <div class="stat-card glass-luxury" style="
                        background: rgba(108, 99, 255, 0.1);
                        padding: 1.5rem;
                        border-radius: 15px;
                        border: 1px solid rgba(255, 215, 0, 0.2);
                        text-align: center;
                    ">
                        <div class="stat-icon" style="margin-bottom: 1rem; padding: 0.75rem; background: rgba(255, 215, 0, 0.1); border-radius: 50%; border: 1px solid rgba(255, 215, 0, 0.3); display: inline-block;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <polyline points="12,6 12,12 16,14" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="stat-value" id="totalWatchTime" style="font-size: 2rem; font-weight: bold; color: #FFD700;">0h</div>
                        <div class="stat-label" style="color: rgba(255, 255, 255, 0.7);">Watch Time</div>
                    </div>
                </div>
                
                <div class="analytics-charts" style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                    margin-bottom: 2rem;
                ">
                    <div class="chart-container glass-luxury" style="
                        background: rgba(138, 43, 226, 0.1);
                        padding: 1.5rem;
                        border-radius: 15px;
                        border: 1px solid rgba(255, 215, 0, 0.2);
                    ">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                            <div class="trending-icon" style="padding: 0.4rem; background: rgba(255, 215, 0, 0.1); border-radius: 8px; border: 1px solid rgba(255, 215, 0, 0.3);">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <polyline points="17,6 23,6 23,12" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <h3 class="text-luxury" style="margin: 0; font-size: 1.3rem;">Popular Videos</h3>
                        </div>
                        <div id="popularVideos" class="popular-videos-list">
                            <div class="loading-state">Collecting data...</div>
                        </div>
                    </div>
                    
                    <div class="chart-container glass-luxury" style="
                        background: rgba(138, 43, 226, 0.1);
                        padding: 1.5rem;
                        border-radius: 15px;
                        border: 1px solid rgba(255, 215, 0, 0.2);
                    ">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                            <div class="reactions-icon" style="padding: 0.4rem; background: rgba(255, 215, 0, 0.1); border-radius: 8px; border: 1px solid rgba(255, 215, 0, 0.3);">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.5783 8.50903 2.9987 7.05 2.9987C5.59096 2.9987 4.19169 3.5783 3.16 4.61C2.1283 5.6417 1.5487 7.04097 1.5487 8.5C1.5487 9.95903 2.1283 11.3583 3.16 12.39L12 21.23L20.84 12.39C21.351 11.8792 21.7564 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.0621 22.0329 6.39462C21.7564 5.72714 21.351 5.1208 20.84 4.61V4.61Z" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <h3 class="text-luxury" style="margin: 0; font-size: 1.3rem;">Popular Reactions</h3>
                        </div>
                        <div id="popularEmojis" class="popular-emojis-list">
                            <div class="loading-state">Collecting data...</div>
                        </div>
                    </div>
                </div>
                
                <div class="realtime-stats glass-luxury" style="
                    background: rgba(255, 215, 0, 0.1);
                    padding: 1.5rem;
                    border-radius: 15px;
                    border: 1px solid rgba(255, 215, 0, 0.3);
                ">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                        <div class="activity-icon" style="padding: 0.4rem; background: rgba(255, 215, 0, 0.1); border-radius: 8px; border: 1px solid rgba(255, 215, 0, 0.3);">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="#FFD700"/>
                            </svg>
                        </div>
                        <h3 class="text-luxury" style="margin: 0; font-size: 1.3rem;">Real-time Activity</h3>
                    </div>
                    <div id="realtimeActivity" class="activity-feed">
                        <div class="activity-item">
                            <span class="activity-time">Starting analytics collection...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Bind close event
        document.getElementById('closeAnalytics').addEventListener('click', () => this.toggleDashboard());
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.toggleDashboard();
            }
        });
    }
    
    toggleDashboard() {
        const modal = document.getElementById('analyticsModal');
        if (!modal) return;
        
        if (this.isVisible) {
            this.hideDashboard();
        } else {
            this.showDashboard();
        }
    }
    
    showDashboard() {
        const modal = document.getElementById('analyticsModal');
        if (!modal) return;
        
        this.isVisible = true;
        modal.style.display = 'flex';
        modal.style.animation = 'fadeIn 0.3s ease';
        
        this.updateDashboardData();
        
        // Start real-time updates
        this.updateInterval = setInterval(() => {
            this.updateDashboardData();
        }, 5000);
        
        if (this.toast) {
            this.toast.info('Analytics dashboard opened');
        }
    }
    
    hideDashboard() {
        const modal = document.getElementById('analyticsModal');
        if (!modal) return;
        
        this.isVisible = false;
        modal.style.animation = 'fadeOut 0.3s ease';
        
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        
        // Stop updates
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    startAnalyticsCollection() {
        // Collect page visit
        this.trackEvent('page_view', {
            page: window.location.pathname,
            timestamp: Date.now()
        });
        
        // Track user sessions
        this.trackUserSession();
        
        // Track video interactions
        this.trackVideoInteractions();
        
        // Track chat activity
        this.trackChatActivity();
    }
    
    trackEvent(event, data = {}) {
        const eventData = {
            event,
            data: {
                ...data,
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                url: window.location.href
            }
        };
        
        // Update analytics data
        this.updateAnalyticsData(eventData);
        
        // Log for debugging
        console.log('📊 Analytics:', eventData);
    }
    
    updateAnalyticsData(eventData) {
        const { event, data } = eventData;
        
        switch (event) {
            case 'room_created':
                this.analytics.globalStats.totalRooms++;
                this.analytics.rooms.set(data.roomId || 'unknown', {
                    id: data.roomId,
                    createdAt: data.timestamp,
                    videoUrl: data.videoUrl,
                    users: [],
                    messages: 0,
                    reactions: {}
                });
                break;
                
            case 'user_joined':
                this.analytics.globalStats.totalUsers++;
                if (data.roomId) {
                    const room = this.analytics.rooms.get(data.roomId);
                    if (room) {
                        room.users.push(data.userId || 'anonymous');
                    }
                }
                break;
                
            case 'video_played':
                this.analytics.globalStats.totalVideos++;
                const videoId = data.videoId || data.videoUrl;
                if (videoId) {
                    const video = this.analytics.videos.get(videoId) || {
                        id: videoId,
                        title: data.title || 'Unknown',
                        playCount: 0,
                        totalWatchTime: 0
                    };
                    video.playCount++;
                    this.analytics.videos.set(videoId, video);
                }
                break;
                
            case 'watch_time':
                this.analytics.globalStats.totalWatchTime += data.duration || 0;
                break;
                
            case 'emoji_reaction':
                const emoji = data.emoji;
                if (emoji) {
                    this.analytics.globalStats.popularEmojis[emoji] = 
                        (this.analytics.globalStats.popularEmojis[emoji] || 0) + 1;
                }
                break;
                
            case 'chat_message':
                if (data.roomId) {
                    const room = this.analytics.rooms.get(data.roomId);
                    if (room) {
                        room.messages++;
                    }
                }
                break;
        }
        
        // Update peak users
        this.analytics.globalStats.peakUsers = Math.max(
            this.analytics.globalStats.peakUsers,
            this.analytics.globalStats.totalUsers
        );
        
        // Update average room size
        const totalRoomUsers = Array.from(this.analytics.rooms.values())
            .reduce((sum, room) => sum + room.users.length, 0);
        this.analytics.globalStats.avgRoomSize = this.analytics.rooms.size > 0 ? 
            Math.round(totalRoomUsers / this.analytics.rooms.size * 10) / 10 : 0;
    }
    
    updateDashboardData() {
        // Update global stats
        document.getElementById('totalRooms').textContent = this.analytics.globalStats.totalRooms;
        document.getElementById('totalUsers').textContent = this.analytics.globalStats.totalUsers;
        document.getElementById('totalVideos').textContent = this.analytics.globalStats.totalVideos;
        document.getElementById('totalWatchTime').textContent = 
            Math.round(this.analytics.globalStats.totalWatchTime / 3600) + 'h';
        
        // Update popular videos
        this.updatePopularVideos();
        
        // Update popular emojis
        this.updatePopularEmojis();
        
        // Update real-time activity
        this.updateRealtimeActivity();
    }
    
    updatePopularVideos() {
        const container = document.getElementById('popularVideos');
        if (!container) return;
        
        const videos = Array.from(this.analytics.videos.values())
            .sort((a, b) => b.playCount - a.playCount)
            .slice(0, 5);
        
        if (videos.length === 0) {
            container.innerHTML = '<div class="loading-state">No videos played yet</div>';
            return;
        }
        
        container.innerHTML = videos.map((video, index) => `
            <div class="popular-item" style="
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 0.5rem;
                background: rgba(255, 215, 0, 0.1);
                border-radius: 8px;
                margin-bottom: 0.5rem;
            ">
                <div class="rank" style="
                    font-size: 1.2rem;
                    font-weight: bold;
                    color: #FFD700;
                    min-width: 30px;
                ">${index + 1}</div>
                <div class="video-info" style="flex: 1;">
                    <div class="video-title" style="
                        font-weight: 600;
                        color: white;
                        font-size: 0.9rem;
                        margin-bottom: 0.2rem;
                    ">${video.title}</div>
                    <div class="video-stats" style="
                        color: rgba(255, 255, 255, 0.7);
                        font-size: 0.8rem;
                    ">${video.playCount} plays</div>
                </div>
            </div>
        `).join('');
    }
    
    updatePopularEmojis() {
        const container = document.getElementById('popularEmojis');
        if (!container) return;
        
        const emojis = Object.entries(this.analytics.globalStats.popularEmojis)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8);
        
        if (emojis.length === 0) {
            container.innerHTML = '<div class="loading-state">No reactions yet</div>';
            return;
        }
        
        container.innerHTML = `
            <div class="emoji-grid" style="
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 1rem;
            ">
                ${emojis.map(([emoji, count]) => `
                    <div class="emoji-item" style="
                        background: rgba(255, 215, 0, 0.1);
                        border-radius: 10px;
                        padding: 1rem;
                        text-align: center;
                        border: 1px solid rgba(255, 215, 0, 0.2);
                    ">
                        <div class="emoji" style="font-size: 2rem; margin-bottom: 0.5rem;">${emoji}</div>
                        <div class="count" style="
                            color: #FFD700;
                            font-weight: bold;
                        ">${count}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    updateRealtimeActivity() {
        const container = document.getElementById('realtimeActivity');
        if (!container) return;
        
        // Simulate real-time activity (in real app, this would come from websockets)
        const activities = [
            '👥 User joined room ABC123',
            '🎬 Video started playing',
            '💬 New message in room XYZ789',
            '😂 Reaction added to video',
            '🆕 New room created'
        ];
        
        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        const timestamp = new Date().toLocaleTimeString();
        
        // Add new activity to the top
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.style.cssText = `
            padding: 0.5rem;
            border-left: 3px solid #FFD700;
            margin-bottom: 0.5rem;
            background: rgba(255, 215, 0, 0.05);
            border-radius: 0 8px 8px 0;
            animation: slideInLeft 0.3s ease;
        `;
        activityItem.innerHTML = `
            <div class="activity-text" style="color: white; font-size: 0.9rem;">${randomActivity}</div>
            <div class="activity-time" style="color: rgba(255, 255, 255, 0.5); font-size: 0.8rem;">${timestamp}</div>
        `;
        
        container.insertBefore(activityItem, container.firstChild);
        
        // Keep only last 10 activities
        const activities_els = container.querySelectorAll('.activity-item');
        if (activities_els.length > 10) {
            activities_els[activities_els.length - 1].remove();
        }
    }
    
    trackUserSession() {
        // Track when user becomes active/inactive
        let isActive = true;
        let sessionStart = Date.now();
        
        const trackActivity = () => {
            if (!isActive) {
                isActive = true;
                sessionStart = Date.now();
                this.trackEvent('user_active');
            }
        };
        
        const trackInactivity = () => {
            if (isActive) {
                isActive = false;
                const sessionTime = Date.now() - sessionStart;
                this.trackEvent('user_inactive', { sessionTime });
            }
        };
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                trackInactivity();
            } else {
                trackActivity();
            }
        });
        
        // Track on page unload
        window.addEventListener('beforeunload', () => {
            const sessionTime = Date.now() - sessionStart;
            this.trackEvent('session_end', { sessionTime });
        });
    }
    
    trackVideoInteractions() {
        // Observer for video events
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Track video elements
                        const videos = node.querySelectorAll ? node.querySelectorAll('iframe[src*="youtube"]') : [];
                        videos.forEach(video => {
                            this.trackEvent('video_loaded', {
                                videoUrl: video.src
                            });
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    trackChatActivity() {
        // Observer for chat messages
        const chatContainer = document.getElementById('chatMessages');
        if (chatContainer) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.classList?.contains('message')) {
                            this.trackEvent('chat_message', {
                                roomId: this.getCurrentRoomId(),
                                messageLength: node.textContent?.length || 0
                            });
                        }
                    });
                });
            });
            
            observer.observe(chatContainer, { childList: true });
        }
    }
    
    getCurrentRoomId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('room');
    }
    
    bindEvents() {
        // Track emoji reactions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('emoji-btn') || 
                e.target.closest('.emoji-btn')) {
                const emoji = e.target.textContent;
                this.trackEvent('emoji_reaction', { emoji });
            }
        });
        
        // Track video controls
        document.addEventListener('click', (e) => {
            if (e.target.id === 'playBtn') {
                this.trackEvent('video_played');
            } else if (e.target.id === 'pauseBtn') {
                this.trackEvent('video_paused');
            }
        });
    }
}

// Add analytics CSS
const analyticsStyles = document.createElement('style');
analyticsStyles.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    @keyframes slideInLeft {
        from { 
            opacity: 0;
            transform: translateX(-20px);
        }
        to { 
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .analytics-content {
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 215, 0, 0.5) rgba(255, 215, 0, 0.1);
    }
    
    .analytics-content::-webkit-scrollbar {
        width: 8px;
    }
    
    .analytics-content::-webkit-scrollbar-track {
        background: rgba(255, 215, 0, 0.1);
        border-radius: 4px;
    }
    
    .analytics-content::-webkit-scrollbar-thumb {
        background: rgba(255, 215, 0, 0.5);
        border-radius: 4px;
    }
    
    .stat-card {
        transition: all 0.3s ease;
    }
    
    .stat-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
    }
    
    .loading-state {
        color: rgba(255, 255, 255, 0.5);
        text-align: center;
        padding: 2rem;
        font-style: italic;
    }
`;
document.head.appendChild(analyticsStyles);

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.analyticsDashboard = new AnalyticsDashboard();
    });
} else {
    window.analyticsDashboard = new AnalyticsDashboard();
}
