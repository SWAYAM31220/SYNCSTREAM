/**
 * SYNCSTREAM ADVANCED VIDEO CONTROLS
 * Enhanced video controls with speed sync, quality selection, timestamps, and subtitles
 */

class AdvancedVideoControls {
    constructor() {
        this.player = null;
        this.playbackSpeed = 1;
        this.videoQuality = 'auto';
        this.subtitlesEnabled = false;
        this.currentTime = 0;
        this.duration = 0;
        this.isFullscreen = false;
        this.volume = 100;
        this.toast = null;
        this.roomManager = null;
        
        this.init();
    }
    
    init() {
        this.toast = window.ToastManager ? new window.ToastManager() : null;
        this.roomManager = window.roomManager || null;
        this.createAdvancedControls();
        this.createQualitySelector();
        this.createSpeedSelector();
        this.createTimestampShare();
        this.createSubtitleToggle();
        this.bindEvents();
        this.enhanceSeekbar();
    }
    
    createAdvancedControls() {
        const videoControls = document.querySelector('.video-controls');
        if (!videoControls) return;
        
        // Create advanced controls container
        const advancedControls = document.createElement('div');
        advancedControls.className = 'advanced-controls';
        advancedControls.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-left: 1rem;
        `;
        
        // Playback speed control
        const speedBtn = document.createElement('button');
        speedBtn.id = 'speedBtn';
        speedBtn.className = 'btn btn-sm btn-secondary btn-secondary-luxury glow-on-hover';
        speedBtn.innerHTML = '<span id="speedText">1x</span>';
        speedBtn.setAttribute('aria-label', 'Change playback speed');
        speedBtn.setAttribute('title', 'Playback speed');
        advancedControls.appendChild(speedBtn);
        
        // Quality control
        const qualityBtn = document.createElement('button');
        qualityBtn.id = 'qualityBtn';
        qualityBtn.className = 'btn btn-sm btn-secondary btn-secondary-luxury glow-on-hover';
        qualityBtn.innerHTML = '<span id="qualityText">Auto</span>';
        qualityBtn.setAttribute('aria-label', 'Change video quality');
        qualityBtn.setAttribute('title', 'Video quality');
        advancedControls.appendChild(qualityBtn);
        
        // Timestamp share
        const timestampBtn = document.createElement('button');
        timestampBtn.id = 'timestampBtn';
        timestampBtn.className = 'btn btn-sm btn-secondary btn-secondary-luxury magnetic-hover';
        timestampBtn.innerHTML = '<span>🔗</span>';
        timestampBtn.setAttribute('aria-label', 'Share timestamp');
        timestampBtn.setAttribute('title', 'Share current time');
        advancedControls.appendChild(timestampBtn);
        
        // Subtitles toggle
        const subtitlesBtn = document.createElement('button');
        subtitlesBtn.id = 'subtitlesBtn';
        subtitlesBtn.className = 'btn btn-sm btn-secondary btn-secondary-luxury';
        subtitlesBtn.innerHTML = '<span>CC</span>';
        subtitlesBtn.setAttribute('aria-label', 'Toggle subtitles');
        subtitlesBtn.setAttribute('title', 'Subtitles');
        advancedControls.appendChild(subtitlesBtn);
        
        // Volume control
        const volumeControl = document.createElement('div');
        volumeControl.className = 'volume-control';
        volumeControl.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;
        
        const volumeBtn = document.createElement('button');
        volumeBtn.id = 'volumeBtn';
        volumeBtn.className = 'btn btn-sm btn-secondary btn-secondary-luxury';
        volumeBtn.innerHTML = '<span id="volumeIcon">🔊</span>';
        volumeBtn.setAttribute('aria-label', 'Toggle mute');
        
        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.id = 'volumeSlider';
        volumeSlider.min = '0';
        volumeSlider.max = '100';
        volumeSlider.value = '100';
        volumeSlider.className = 'volume-slider';
        volumeSlider.style.cssText = `
            width: 80px;
            height: 4px;
            background: rgba(255, 215, 0, 0.3);
            outline: none;
            border-radius: 2px;
            appearance: none;
        `;
        
        volumeControl.appendChild(volumeBtn);
        volumeControl.appendChild(volumeSlider);
        advancedControls.appendChild(volumeControl);
        
        // Insert advanced controls
        videoControls.appendChild(advancedControls);
    }
    
    createQualitySelector() {
        const selector = document.createElement('div');
        selector.id = 'qualitySelector';
        selector.className = 'quality-selector glass-luxury';
        selector.style.cssText = `
            position: absolute;
            bottom: 100%;
            right: 0;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 215, 0, 0.3);
            border-radius: 10px;
            padding: 0.5rem;
            display: none;
            z-index: 1000;
            min-width: 120px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        `;
        
        const qualities = [
            { value: 'auto', label: 'Auto', desc: 'Best available' },
            { value: 'hd1080', label: '1080p', desc: 'Full HD' },
            { value: 'hd720', label: '720p', desc: 'HD' },
            { value: 'medium', label: '480p', desc: 'Standard' },
            { value: 'small', label: '360p', desc: 'Mobile' },
            { value: 'tiny', label: '240p', desc: 'Low bandwidth' }
        ];
        
        selector.innerHTML = `
            <div class="selector-header" style="
                padding: 0.5rem;
                border-bottom: 1px solid rgba(255, 215, 0, 0.2);
                margin-bottom: 0.5rem;
                color: #FFD700;
                font-weight: 600;
                font-size: 0.9rem;
            ">Video Quality</div>
            ${qualities.map(quality => `
                <div class="quality-option" data-quality="${quality.value}" style="
                    padding: 0.5rem;
                    cursor: pointer;
                    border-radius: 5px;
                    transition: all 0.2s ease;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: white;
                    font-size: 0.9rem;
                ">
                    <span>${quality.label}</span>
                    <span style="color: rgba(255, 255, 255, 0.6); font-size: 0.8rem;">${quality.desc}</span>
                </div>
            `).join('')}
        `;
        
        document.body.appendChild(selector);
    }
    
    createSpeedSelector() {
        const selector = document.createElement('div');
        selector.id = 'speedSelector';
        selector.className = 'speed-selector glass-luxury';
        selector.style.cssText = `
            position: absolute;
            bottom: 100%;
            right: 0;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 215, 0, 0.3);
            border-radius: 10px;
            padding: 0.5rem;
            display: none;
            z-index: 1000;
            min-width: 100px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        `;
        
        const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
        
        selector.innerHTML = `
            <div class="selector-header" style="
                padding: 0.5rem;
                border-bottom: 1px solid rgba(255, 215, 0, 0.2);
                margin-bottom: 0.5rem;
                color: #FFD700;
                font-weight: 600;
                font-size: 0.9rem;
            ">Playback Speed</div>
            ${speeds.map(speed => `
                <div class="speed-option" data-speed="${speed}" style="
                    padding: 0.5rem;
                    cursor: pointer;
                    border-radius: 5px;
                    transition: all 0.2s ease;
                    color: white;
                    font-size: 0.9rem;
                    text-align: center;
                    ${speed === 1 ? 'background: rgba(255, 215, 0, 0.2);' : ''}
                ">
                    ${speed}x ${speed === 1 ? '(Normal)' : ''}
                </div>
            `).join('')}
        `;
        
        document.body.appendChild(selector);
    }
    
    createTimestampShare() {
        const modal = document.createElement('div');
        modal.id = 'timestampModal';
        modal.className = 'timestamp-modal glass-luxury';
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
            <div class="timestamp-content glass-luxury" style="
                width: 90%;
                max-width: 500px;
                background: linear-gradient(135deg, rgba(108, 99, 255, 0.1), rgba(255, 215, 0, 0.05));
                border-radius: 20px;
                padding: 2rem;
                border: 1px solid rgba(255, 215, 0, 0.2);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                text-align: center;
            ">
                <h3 class="text-luxury" style="margin-top: 0; margin-bottom: 1.5rem;">
                    🔗 Share Timestamp
                </h3>
                
                <div class="timestamp-info" style="
                    background: rgba(255, 215, 0, 0.1);
                    border-radius: 15px;
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                    border: 1px solid rgba(255, 215, 0, 0.2);
                ">
                    <div class="current-time" style="
                        font-size: 2rem;
                        font-weight: bold;
                        color: #FFD700;
                        margin-bottom: 0.5rem;
                    " id="currentTimestamp">00:00</div>
                    <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">
                        Share this specific moment with others
                    </div>
                </div>
                
                <div class="timestamp-link" style="margin-bottom: 1.5rem;">
                    <input type="text" id="timestampLink" readonly class="input" style="
                        width: 100%;
                        padding: 0.75rem;
                        border: 1px solid rgba(255, 215, 0, 0.3);
                        border-radius: 10px;
                        background: rgba(255, 215, 0, 0.1);
                        color: white;
                        text-align: center;
                        font-family: monospace;
                    ">
                </div>
                
                <div class="timestamp-actions" style="
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                ">
                    <button id="copyTimestampBtn" class="btn btn-primary-luxury">
                        📋 Copy Link
                    </button>
                    <button id="closeTimestampModal" class="btn btn-secondary-luxury">
                        Close
                    </button>
                </div>
                
                <div class="timestamp-tips" style="
                    margin-top: 1.5rem;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(255, 215, 0, 0.2);
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.8rem;
                ">
                    💡 Tip: Anyone clicking this link will jump to this exact moment in the video
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    createSubtitleToggle() {
        // Subtitle functionality would integrate with YouTube's CC API
        // For now, we'll create a UI for it
    }
    
    enhanceSeekbar() {
        // Check if seekbar exists and enhance it
        const seekbar = document.getElementById('currentTime') || document.querySelector('.seekbar');
        if (!seekbar) return;
        
        // Add hover previews and better interaction
        const seekContainer = document.createElement('div');
        seekContainer.className = 'enhanced-seekbar-container';
        seekContainer.style.cssText = `
            position: relative;
            width: 100%;
            margin: 0 1rem;
        `;
        
        const seekbarInput = document.createElement('input');
        seekbarInput.type = 'range';
        seekbarInput.id = 'enhancedSeekbar';
        seekbarInput.min = '0';
        seekbarInput.max = '100';
        seekbarInput.value = '0';
        seekbarInput.className = 'enhanced-seekbar';
        seekbarInput.style.cssText = `
            width: 100%;
            height: 6px;
            background: linear-gradient(to right, #FFD700 0%, rgba(255, 215, 0, 0.3) 0%, rgba(255, 255, 255, 0.2) 0%);
            outline: none;
            border-radius: 3px;
            appearance: none;
            cursor: pointer;
            position: relative;
        `;
        
        // Time display
        const timeDisplay = document.createElement('div');
        timeDisplay.className = 'time-display';
        timeDisplay.style.cssText = `
            display: flex;
            justify-content: space-between;
            margin-top: 0.25rem;
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.7);
        `;
        
        timeDisplay.innerHTML = `
            <span id="currentTimeDisplay">0:00</span>
            <span id="durationDisplay">0:00</span>
        `;
        
        seekContainer.appendChild(seekbarInput);
        seekContainer.appendChild(timeDisplay);
        
        // Replace existing seekbar or add to controls
        const videoControls = document.querySelector('.video-controls');
        if (videoControls && !document.getElementById('enhancedSeekbar')) {
            const controlsMain = videoControls.querySelector('.controls-main') || videoControls;
            controlsMain.appendChild(seekContainer);
        }
    }
    
    bindEvents() {
        this.bindQualitySelector();
        this.bindSpeedSelector();
        this.bindTimestampShare();
        this.bindVolumeControls();
        this.bindSeekbarEnhancements();
        this.bindKeyboardShortcuts();
    }
    
    bindQualitySelector() {
        const qualityBtn = document.getElementById('qualityBtn');
        const qualitySelector = document.getElementById('qualitySelector');
        
        if (qualityBtn && qualitySelector) {
            qualityBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.positionSelector(qualitySelector, qualityBtn);
                qualitySelector.style.display = qualitySelector.style.display === 'block' ? 'none' : 'block';
            });
            
            qualitySelector.addEventListener('click', (e) => {
                if (e.target.classList.contains('quality-option')) {
                    const quality = e.target.dataset.quality;
                    this.changeQuality(quality);
                    qualitySelector.style.display = 'none';
                }
            });
            
            // Add hover effects
            qualitySelector.querySelectorAll('.quality-option').forEach(option => {
                option.addEventListener('mouseenter', () => {
                    option.style.background = 'rgba(255, 215, 0, 0.2)';
                });
                
                option.addEventListener('mouseleave', () => {
                    option.style.background = '';
                });
            });
        }
    }
    
    bindSpeedSelector() {
        const speedBtn = document.getElementById('speedBtn');
        const speedSelector = document.getElementById('speedSelector');
        
        if (speedBtn && speedSelector) {
            speedBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.positionSelector(speedSelector, speedBtn);
                speedSelector.style.display = speedSelector.style.display === 'block' ? 'none' : 'block';
            });
            
            speedSelector.addEventListener('click', (e) => {
                if (e.target.classList.contains('speed-option')) {
                    const speed = parseFloat(e.target.dataset.speed);
                    this.changeSpeed(speed);
                    speedSelector.style.display = 'none';
                }
            });
            
            // Add hover effects
            speedSelector.querySelectorAll('.speed-option').forEach(option => {
                option.addEventListener('mouseenter', () => {
                    option.style.background = 'rgba(255, 215, 0, 0.2)';
                });
                
                option.addEventListener('mouseleave', () => {
                    if (parseFloat(option.dataset.speed) !== this.playbackSpeed) {
                        option.style.background = '';
                    }
                });
            });
        }
    }
    
    bindTimestampShare() {
        const timestampBtn = document.getElementById('timestampBtn');
        const timestampModal = document.getElementById('timestampModal');
        const copyBtn = document.getElementById('copyTimestampBtn');
        const closeBtn = document.getElementById('closeTimestampModal');
        
        if (timestampBtn) {
            timestampBtn.addEventListener('click', () => {
                this.showTimestampModal();
            });
        }
        
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyTimestampLink();
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideTimestampModal();
            });
        }
        
        if (timestampModal) {
            timestampModal.addEventListener('click', (e) => {
                if (e.target === timestampModal) {
                    this.hideTimestampModal();
                }
            });
        }
    }
    
    bindVolumeControls() {
        const volumeBtn = document.getElementById('volumeBtn');
        const volumeSlider = document.getElementById('volumeSlider');
        
        if (volumeBtn) {
            volumeBtn.addEventListener('click', () => {
                this.toggleMute();
            });
        }
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.setVolume(parseInt(e.target.value));
            });
            
            volumeSlider.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -5 : 5;
                const newVolume = Math.max(0, Math.min(100, this.volume + delta));
                this.setVolume(newVolume);
                volumeSlider.value = newVolume;
            });
        }
    }
    
    bindSeekbarEnhancements() {
        const seekbar = document.getElementById('enhancedSeekbar');
        if (!seekbar) return;
        
        seekbar.addEventListener('input', (e) => {
            const percentage = e.target.value;
            this.seekToPercentage(percentage);
        });
        
        // Add preview on hover (would need video frames for full implementation)
        seekbar.addEventListener('mousemove', (e) => {
            const rect = seekbar.getBoundingClientRect();
            const percentage = ((e.clientX - rect.left) / rect.width) * 100;
            const time = (percentage / 100) * this.duration;
            
            // Update tooltip (basic implementation)
            seekbar.title = this.formatTime(time);
        });
    }
    
    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not typing in input fields
            if (e.target.matches('input, textarea, [contenteditable]')) return;
            
            switch (e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                    
                case 'f':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
                    
                case 'm':
                    e.preventDefault();
                    this.toggleMute();
                    break;
                    
                case 'arrowleft':
                    e.preventDefault();
                    this.seekBy(-10);
                    break;
                    
                case 'arrowright':
                    e.preventDefault();
                    this.seekBy(10);
                    break;
                    
                case 'arrowup':
                    e.preventDefault();
                    this.adjustVolume(5);
                    break;
                    
                case 'arrowdown':
                    e.preventDefault();
                    this.adjustVolume(-5);
                    break;
                    
                case '<':
                case ',':
                    e.preventDefault();
                    this.changeSpeed(Math.max(0.25, this.playbackSpeed - 0.25));
                    break;
                    
                case '>':
                case '.':
                    e.preventDefault();
                    this.changeSpeed(Math.min(2, this.playbackSpeed + 0.25));
                    break;
                    
                case 'c':
                    e.preventDefault();
                    this.toggleSubtitles();
                    break;
            }
        });
        
        // Hide selectors when clicking outside
        document.addEventListener('click', (e) => {
            const qualitySelector = document.getElementById('qualitySelector');
            const speedSelector = document.getElementById('speedSelector');
            
            if (qualitySelector && !e.target.closest('#qualityBtn, #qualitySelector')) {
                qualitySelector.style.display = 'none';
            }
            
            if (speedSelector && !e.target.closest('#speedBtn, #speedSelector')) {
                speedSelector.style.display = 'none';
            }
        });
    }
    
    positionSelector(selector, button) {
        const buttonRect = button.getBoundingClientRect();
        const selectorRect = selector.getBoundingClientRect();
        
        // Position above the button
        selector.style.position = 'fixed';
        selector.style.bottom = (window.innerHeight - buttonRect.top + 10) + 'px';
        selector.style.left = (buttonRect.left - selectorRect.width + buttonRect.width) + 'px';
        
        // Ensure it's within viewport
        if (parseInt(selector.style.left) < 0) {
            selector.style.left = '10px';
        }
    }
    
    changeQuality(quality) {
        this.videoQuality = quality;
        const qualityText = document.getElementById('qualityText');
        
        const qualityLabels = {
            'auto': 'Auto',
            'hd1080': '1080p',
            'hd720': '720p',
            'medium': '480p',
            'small': '360p',
            'tiny': '240p'
        };
        
        if (qualityText) {
            qualityText.textContent = qualityLabels[quality] || 'Auto';
        }
        
        // In a real implementation, this would communicate with YouTube API
        this.syncQualityChange(quality);
        
        if (this.toast) {
            this.toast.info(`Video quality changed to ${qualityLabels[quality] || 'Auto'}`);
        }
    }
    
    changeSpeed(speed) {
        this.playbackSpeed = speed;
        const speedText = document.getElementById('speedText');
        
        if (speedText) {
            speedText.textContent = speed + 'x';
        }
        
        // Update UI to show current speed
        const speedOptions = document.querySelectorAll('.speed-option');
        speedOptions.forEach(option => {
            if (parseFloat(option.dataset.speed) === speed) {
                option.style.background = 'rgba(255, 215, 0, 0.2)';
            } else {
                option.style.background = '';
            }
        });
        
        // In a real implementation, this would communicate with YouTube API and sync with room
        this.syncSpeedChange(speed);
        
        if (this.toast) {
            this.toast.info(`Playback speed: ${speed}x`);
        }
    }
    
    syncQualityChange(quality) {
        // Sync quality change with room members
        if (this.roomManager && typeof this.roomManager.syncVideoState === 'function') {
            this.roomManager.syncVideoState({
                action: 'quality_change',
                quality: quality,
                timestamp: Date.now()
            });
        }
    }
    
    syncSpeedChange(speed) {
        // Sync speed change with room members
        if (this.roomManager && typeof this.roomManager.syncVideoState === 'function') {
            this.roomManager.syncVideoState({
                action: 'speed_change',
                speed: speed,
                timestamp: Date.now()
            });
        }
    }
    
    showTimestampModal() {
        const modal = document.getElementById('timestampModal');
        const timestampDisplay = document.getElementById('currentTimestamp');
        const timestampLink = document.getElementById('timestampLink');
        
        if (!modal) return;
        
        // Update current time
        const formattedTime = this.formatTime(this.currentTime);
        if (timestampDisplay) {
            timestampDisplay.textContent = formattedTime;
        }
        
        // Generate timestamp link
        const currentUrl = new URL(window.location);
        currentUrl.searchParams.set('t', Math.floor(this.currentTime));
        
        if (timestampLink) {
            timestampLink.value = currentUrl.toString();
        }
        
        modal.style.display = 'flex';
        
        if (this.toast) {
            this.toast.info('Timestamp share opened');
        }
    }
    
    hideTimestampModal() {
        const modal = document.getElementById('timestampModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    copyTimestampLink() {
        const timestampLink = document.getElementById('timestampLink');
        if (!timestampLink) return;
        
        timestampLink.select();
        timestampLink.setSelectionRange(0, 99999); // For mobile
        
        try {
            document.execCommand('copy');
            if (this.toast) {
                this.toast.success('Timestamp link copied!');
            }
            this.hideTimestampModal();
        } catch (err) {
            if (this.toast) {
                this.toast.error('Failed to copy link');
            }
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(100, volume));
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeIcon = document.getElementById('volumeIcon');
        
        if (volumeSlider) {
            volumeSlider.value = this.volume;
        }
        
        if (volumeIcon) {
            if (this.volume === 0) {
                volumeIcon.textContent = '🔇';
            } else if (this.volume < 33) {
                volumeIcon.textContent = '🔈';
            } else if (this.volume < 66) {
                volumeIcon.textContent = '🔉';
            } else {
                volumeIcon.textContent = '🔊';
            }
        }
        
        // Apply volume to player (would integrate with YouTube API)
        this.applyVolumeToPlayer(this.volume);
    }
    
    toggleMute() {
        if (this.volume === 0) {
            this.setVolume(50); // Restore to 50%
        } else {
            this.setVolume(0);
        }
    }
    
    adjustVolume(delta) {
        this.setVolume(this.volume + delta);
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.value = this.volume;
        }
    }
    
    togglePlayPause() {
        // Would integrate with room manager's play/pause functionality
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (playBtn && playBtn.style.display !== 'none') {
            playBtn.click();
        } else if (pauseBtn && pauseBtn.style.display !== 'none') {
            pauseBtn.click();
        }
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            const videoContainer = document.querySelector('.video-section, .video-container');
            if (videoContainer && videoContainer.requestFullscreen) {
                videoContainer.requestFullscreen();
                this.isFullscreen = true;
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                this.isFullscreen = false;
            }
        }
    }
    
    seekBy(seconds) {
        const newTime = Math.max(0, Math.min(this.duration, this.currentTime + seconds));
        this.seekToTime(newTime);
        
        // Show seek feedback
        this.showSeekFeedback(seconds > 0 ? `+${seconds}s` : `${seconds}s`);
    }
    
    seekToTime(time) {
        this.currentTime = time;
        this.updateSeekbar();
        
        // Would integrate with YouTube API to actually seek
        if (this.roomManager && typeof this.roomManager.seekTo === 'function') {
            this.roomManager.seekTo(time);
        }
    }
    
    seekToPercentage(percentage) {
        const time = (percentage / 100) * this.duration;
        this.seekToTime(time);
    }
    
    updateSeekbar() {
        const seekbar = document.getElementById('enhancedSeekbar');
        const currentTimeDisplay = document.getElementById('currentTimeDisplay');
        const durationDisplay = document.getElementById('durationDisplay');
        
        if (seekbar) {
            const percentage = (this.currentTime / this.duration) * 100;
            seekbar.value = percentage;
            
            // Update progress bar background
            seekbar.style.background = `linear-gradient(to right, #FFD700 ${percentage}%, rgba(255, 215, 0, 0.3) ${percentage}%, rgba(255, 255, 255, 0.2) ${percentage}%)`;
        }
        
        if (currentTimeDisplay) {
            currentTimeDisplay.textContent = this.formatTime(this.currentTime);
        }
        
        if (durationDisplay) {
            durationDisplay.textContent = this.formatTime(this.duration);
        }
    }
    
    toggleSubtitles() {
        this.subtitlesEnabled = !this.subtitlesEnabled;
        const subtitlesBtn = document.getElementById('subtitlesBtn');
        
        if (subtitlesBtn) {
            if (this.subtitlesEnabled) {
                subtitlesBtn.style.background = 'rgba(255, 215, 0, 0.3)';
                subtitlesBtn.style.color = '#FFD700';
            } else {
                subtitlesBtn.style.background = '';
                subtitlesBtn.style.color = '';
            }
        }
        
        // Would integrate with YouTube API to toggle subtitles
        this.applySubtitleToggle(this.subtitlesEnabled);
        
        if (this.toast) {
            this.toast.info(`Subtitles ${this.subtitlesEnabled ? 'enabled' : 'disabled'}`);
        }
    }
    
    showSeekFeedback(text) {
        const feedback = document.createElement('div');
        feedback.className = 'seek-feedback';
        feedback.textContent = text;
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: #FFD700;
            padding: 1rem 2rem;
            border-radius: 50px;
            font-size: 1.2rem;
            font-weight: bold;
            z-index: 10000;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 215, 0, 0.3);
            animation: seekFeedback 1s ease-out forwards;
        `;
        
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 1000);
    }
    
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
    }
    
    // Integration methods (would be called by room manager or YouTube API)
    
    updateTime(currentTime, duration) {
        this.currentTime = currentTime;
        this.duration = duration;
        this.updateSeekbar();
    }
    
    applyVolumeToPlayer(volume) {
        // Would integrate with YouTube player API
        if (window.ytPlayer && typeof window.ytPlayer.setVolume === 'function') {
            window.ytPlayer.setVolume(volume);
        }
    }
    
    applySubtitleToggle(enabled) {
        // Would integrate with YouTube player API
        if (window.ytPlayer) {
            if (enabled && typeof window.ytPlayer.loadModule === 'function') {
                window.ytPlayer.loadModule('captions');
            } else if (!enabled && typeof window.ytPlayer.unloadModule === 'function') {
                window.ytPlayer.unloadModule('captions');
            }
        }
    }
}

// Add advanced video controls CSS
const advancedControlsStyles = document.createElement('style');
advancedControlsStyles.textContent = `
    .advanced-controls {
        animation: slideIn 0.3s ease;
    }
    
    .volume-slider::-webkit-slider-thumb {
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #FFD700;
        cursor: pointer;
        border: 2px solid rgba(255, 255, 255, 0.2);
        transition: all 0.2s ease;
    }
    
    .volume-slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
    }
    
    .enhanced-seekbar::-webkit-slider-thumb {
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #FFD700;
        cursor: pointer;
        border: 3px solid rgba(255, 255, 255, 0.2);
        transition: all 0.2s ease;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    }
    
    .enhanced-seekbar::-webkit-slider-thumb:hover {
        transform: scale(1.3);
        box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
    }
    
    @keyframes seekFeedback {
        0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
        }
        50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1);
        }
    }
    
    .quality-selector,
    .speed-selector {
        animation: slideUp 0.2s ease;
    }
    
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .advanced-controls .btn:hover {
        transform: scale(1.05);
    }
    
    .time-display {
        user-select: none;
    }
    
    @media (max-width: 768px) {
        .advanced-controls {
            flex-wrap: wrap;
            gap: 0.25rem;
        }
        
        .volume-control {
            order: -1;
            width: 100%;
            justify-content: center;
            margin-bottom: 0.5rem;
        }
        
        .volume-slider {
            width: 150px !important;
        }
    }
`;
document.head.appendChild(advancedControlsStyles);

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.advancedVideoControls = new AdvancedVideoControls();
    });
} else {
    window.advancedVideoControls = new AdvancedVideoControls();
}
