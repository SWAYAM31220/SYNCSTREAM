/* ==========================================================================
   SYNCSTREAM - PREMIUM VISUAL EFFECTS SYSTEM
   Luxury animations, particles, and immersive interactions
   ========================================================================== */

class PremiumVisualEffects {
    constructor() {
        this.particleSystem = null;
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.mousePosition = { x: 0, y: 0 };
        this.isMouseMoving = false;
        this.backgroundWaves = [];
        this.animationId = null;
        this.performanceMode = this.detectPerformanceMode();
        
        this.init();
    }

    init() {
        this.createCanvas();
        this.setupEventListeners();
        this.initializeParticles();
        this.initializeBackgroundWaves();
        this.startAnimation();
        this.addInteractiveElements();
        this.setupScrollEffects();
    }

    detectPerformanceMode() {
        // Detect device capabilities for performance optimization
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        const hasWebGL = !!gl;
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const hasHighRefreshRate = window.screen?.refreshRate > 60;
        
        return {
            hasWebGL,
            isMobile,
            hasHighRefreshRate,
            particleCount: isMobile ? 15 : hasWebGL ? 40 : 25,
            enableComplexEffects: !isMobile && hasWebGL
        };
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'premium-effects-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 1;
            opacity: 0.6;
            mix-blend-mode: screen;
        `;
        
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        this.resizeCanvas();
        
        // Insert canvas as first child of body
        document.body.insertBefore(this.canvas, document.body.firstChild);
    }

    resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        this.ctx.scale(dpr, dpr);
    }

    setupEventListeners() {
        let mouseMoveTimeout;
        
        document.addEventListener('mousemove', (e) => {
            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;
            this.isMouseMoving = true;
            
            clearTimeout(mouseMoveTimeout);
            mouseMoveTimeout = setTimeout(() => {
                this.isMouseMoving = false;
            }, 100);
            
            // Add magnetic effect to particles near cursor
            this.particles.forEach(particle => {
                const dx = e.clientX - particle.x;
                const dy = e.clientY - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    const force = (100 - distance) / 100;
                    particle.vx += dx * force * 0.001;
                    particle.vy += dy * force * 0.001;
                }
            });
        });

        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.initializeParticles();
        });

        // Performance optimization: pause on tab visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimation();
            } else {
                this.resumeAnimation();
            }
        });
    }

    initializeParticles() {
        this.particles = [];
        const count = this.performanceMode.particleCount;
        
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 3 + 1,
                opacity: Math.random() * 0.5 + 0.3,
                hue: Math.random() * 60 + 240, // Purple/blue range
                pulseSpeed: Math.random() * 0.02 + 0.01,
                pulsePhase: Math.random() * Math.PI * 2,
                trail: []
            });
        }
    }

    initializeBackgroundWaves() {
        this.backgroundWaves = [];
        const waveCount = this.performanceMode.isMobile ? 2 : 4;
        
        for (let i = 0; i < waveCount; i++) {
            this.backgroundWaves.push({
                amplitude: Math.random() * 50 + 30,
                frequency: Math.random() * 0.005 + 0.002,
                phase: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.01 + 0.005,
                offset: (i / waveCount) * window.innerHeight,
                color: `hsla(${240 + i * 15}, 70%, 60%, 0.1)`
            });
        }
    }

    updateParticles() {
        this.particles.forEach((particle, index) => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Boundary wrapping
            if (particle.x < 0) particle.x = window.innerWidth;
            if (particle.x > window.innerWidth) particle.x = 0;
            if (particle.y < 0) particle.y = window.innerHeight;
            if (particle.y > window.innerHeight) particle.y = 0;
            
            // Add slight drift towards center
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            particle.vx += (centerX - particle.x) * 0.00001;
            particle.vy += (centerY - particle.y) * 0.00001;
            
            // Damping
            particle.vx *= 0.999;
            particle.vy *= 0.999;
            
            // Pulse animation
            particle.pulsePhase += particle.pulseSpeed;
            particle.currentSize = particle.size + Math.sin(particle.pulsePhase) * 0.5;
            
            // Trail effect for premium feel
            if (this.performanceMode.enableComplexEffects) {
                particle.trail.push({ x: particle.x, y: particle.y });
                if (particle.trail.length > 10) {
                    particle.trail.shift();
                }
            }
        });
    }

    drawParticles() {
        this.particles.forEach(particle => {
            // Draw trail first
            if (this.performanceMode.enableComplexEffects && particle.trail.length > 1) {
                this.ctx.strokeStyle = `hsla(${particle.hue}, 80%, 70%, 0.1)`;
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
                
                for (let i = 1; i < particle.trail.length; i++) {
                    this.ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
                }
                this.ctx.stroke();
            }
            
            // Draw main particle with glow effect
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.currentSize * 3
            );
            
            gradient.addColorStop(0, `hsla(${particle.hue}, 90%, 80%, ${particle.opacity})`);
            gradient.addColorStop(0.5, `hsla(${particle.hue}, 70%, 60%, ${particle.opacity * 0.3})`);
            gradient.addColorStop(1, `hsla(${particle.hue}, 50%, 40%, 0)`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.currentSize * 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Core particle
            this.ctx.fillStyle = `hsla(${particle.hue}, 100%, 90%, ${particle.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.currentSize, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawBackgroundWaves() {
        if (!this.performanceMode.enableComplexEffects) return;
        
        this.backgroundWaves.forEach(wave => {
            wave.phase += wave.speed;
            
            this.ctx.strokeStyle = wave.color;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            
            for (let x = 0; x <= window.innerWidth; x += 5) {
                const y = wave.offset + 
                    Math.sin(x * wave.frequency + wave.phase) * wave.amplitude +
                    Math.sin(x * wave.frequency * 0.5 + wave.phase * 1.3) * wave.amplitude * 0.3;
                
                if (x === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            
            this.ctx.stroke();
        });
    }

    drawConnections() {
        if (!this.performanceMode.enableComplexEffects) return;
        
        this.particles.forEach((particle, i) => {
            this.particles.slice(i + 1).forEach(otherParticle => {
                const dx = particle.x - otherParticle.x;
                const dy = particle.y - otherParticle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 120) {
                    const opacity = (120 - distance) / 120 * 0.1;
                    this.ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(otherParticle.x, otherParticle.y);
                    this.ctx.stroke();
                }
            });
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        
        // Draw background effects
        this.drawBackgroundWaves();
        
        // Update and draw particles
        this.updateParticles();
        this.drawParticles();
        this.drawConnections();
        
        // Continue animation
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    startAnimation() {
        this.animate();
    }

    pauseAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    resumeAnimation() {
        if (!this.animationId) {
            this.startAnimation();
        }
    }

    addInteractiveElements() {
        // Add magnetic hover effects to buttons and cards
        const interactiveElements = document.querySelectorAll('.btn, .glass-card, .feature');
        
        interactiveElements.forEach(element => {
            let magnetStrength = 15;
            let isHovered = false;
            
            element.addEventListener('mouseenter', () => {
                isHovered = true;
                element.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            });
            
            element.addEventListener('mouseleave', () => {
                isHovered = false;
                element.style.transform = 'translate3d(0, 0, 0) scale(1)';
            });
            
            element.addEventListener('mousemove', (e) => {
                if (!isHovered) return;
                
                const rect = element.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                const deltaX = (e.clientX - centerX) / (rect.width / 2);
                const deltaY = (e.clientY - centerY) / (rect.height / 2);
                
                const rotateX = deltaY * 5;
                const rotateY = deltaX * 5;
                const translateX = deltaX * magnetStrength;
                const translateY = deltaY * magnetStrength;
                
                element.style.transform = `
                    translate3d(${translateX}px, ${translateY}px, 0) 
                    rotateX(${rotateX}deg) 
                    rotateY(${rotateY}deg) 
                    scale(1.05)
                `;
            });
        });
    }

    setupScrollEffects() {
        // Parallax and scroll-triggered animations
        let ticking = false;
        
        const updateOnScroll = () => {
            const scrollY = window.pageYOffset;
            const scrollPercent = scrollY / (document.documentElement.scrollHeight - window.innerHeight);
            
            // Parallax effect for background elements
            const parallaxElements = document.querySelectorAll('.hero-section, .features');
            parallaxElements.forEach((element, index) => {
                const speed = (index + 1) * 0.5;
                element.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`;
            });
            
            // Update particle system based on scroll
            this.particles.forEach(particle => {
                particle.hue = 240 + scrollPercent * 60; // Shift from purple to blue
            });
            
            ticking = false;
        };
        
        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateOnScroll);
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', requestTick, { passive: true });
    }

    // Public methods for integration
    createRippleEffect(x, y, color = '#8b5cf6') {
        const ripple = document.createElement('div');
        ripple.className = 'premium-ripple';
        ripple.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: radial-gradient(circle, ${color}88, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            left: ${x}px;
            top: ${y}px;
            transform: translate(-50%, -50%);
        `;
        
        document.body.appendChild(ripple);
        
        // Animate ripple
        ripple.animate([
            { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
            { transform: 'translate(-50%, -50%) scale(20)', opacity: 0 }
        ], {
            duration: 800,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }).onfinish = () => {
            ripple.remove();
        };
    }

    addParticleBurst(x, y, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                size: Math.random() * 2 + 1,
                opacity: 1,
                hue: Math.random() * 60 + 240,
                pulseSpeed: Math.random() * 0.05 + 0.02,
                pulsePhase: Math.random() * Math.PI * 2,
                trail: [],
                life: 60 // Temporary particles
            });
        }
    }

    destroy() {
        this.pauseAnimation();
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Initialize the premium visual effects system
let premiumEffects;

document.addEventListener('DOMContentLoaded', () => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
        premiumEffects = new PremiumVisualEffects();
        
        // Make effects available globally
        window.PremiumEffects = premiumEffects;
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (premiumEffects) {
        premiumEffects.destroy();
    }
});

export { PremiumVisualEffects };
