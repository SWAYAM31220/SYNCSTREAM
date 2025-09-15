/**
 * SYNCSTREAM PARTICLES SYSTEM
 * Advanced floating particles with interactive effects
 * Deep purple theme with gold accents
 */

class ParticlesSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.mouse = { x: null, y: null };
        this.animationId = null;
        this.isActive = true;
        
        // Particle settings
        this.particleCount = window.innerWidth < 768 ? 50 : 120;
        this.connectionDistance = 200;
        this.mouseRadius = 150;
        
        this.init();
    }
    
    init() {
        this.createCanvas();
        this.createParticles();
        this.bindEvents();
        this.animate();
    }
    
    createCanvas() {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'particles-canvas';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.opacity = '1';
        this.canvas.style.mixBlendMode = 'screen';
        
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        this.particles = [];
        
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                size: Math.random() * 4 + 2,
                color: this.getParticleColor(),
                opacity: Math.random() * 0.9 + 0.3,
                glowSize: Math.random() * 15 + 8,
                pulseSpeed: Math.random() * 0.02 + 0.01,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
    }
    
    getParticleColor() {
        const colors = [
            '#6C63FF',  // Deep Purple
            '#8A2BE2',  // Neon Violet  
            '#FFD700',  // Gold
            '#FF8C00',  // Orange Gold
            '#9370DB',  // Medium Purple
            '#DDA0DD',  // Plum
            '#BA55D3'   // Medium Orchid
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    bindEvents() {
        // Mouse tracking
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        document.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.createParticles();
        });
        
        // Visibility change (pause when tab not active)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                if (!this.isActive) {
                    this.isActive = true;
                    this.animate();
                }
            } else {
                this.isActive = false;
                if (this.animationId) {
                    cancelAnimationFrame(this.animationId);
                }
            }
        });
        
        // Respect reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.particleCount = Math.min(this.particleCount, 30);
            this.createParticles();
        }
        
        // Debug log
        console.log(`Particles system initialized with ${this.particleCount} particles`);
        console.log('Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
    }
    
    updateParticle(particle) {
        // Basic movement
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Wrap around edges
        if (particle.x < 0) particle.x = this.canvas.width;
        if (particle.x > this.canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = this.canvas.height;
        if (particle.y > this.canvas.height) particle.y = 0;
        
        // Pulse effect
        particle.pulsePhase += particle.pulseSpeed;
        const pulseFactor = Math.sin(particle.pulsePhase) * 0.3 + 0.7;
        particle.currentSize = particle.size * pulseFactor;
        particle.currentGlowSize = particle.glowSize * pulseFactor;
        
        // Mouse interaction
        if (this.mouse.x !== null && this.mouse.y !== null) {
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.mouseRadius) {
                const force = (this.mouseRadius - distance) / this.mouseRadius;
                const angle = Math.atan2(dy, dx);
                
                // Attract particles to mouse
                particle.vx += Math.cos(angle) * force * 0.02;
                particle.vy += Math.sin(angle) * force * 0.02;
                
                // Increase brightness near mouse
                particle.currentOpacity = Math.min(particle.opacity + force * 0.5, 1);
                particle.currentGlowSize *= (1 + force);
            } else {
                particle.currentOpacity = particle.opacity;
            }
        } else {
            particle.currentOpacity = particle.opacity;
        }
        
        // Damping to prevent excessive speed
        particle.vx *= 0.99;
        particle.vy *= 0.99;
    }
    
    drawParticle(particle) {
        const ctx = this.ctx;
        
        // Create radial gradient for glow effect
        const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.currentGlowSize
        );
        
        const color = particle.color;
        gradient.addColorStop(0, color + Math.floor(particle.currentOpacity * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.4, color + Math.floor(particle.currentOpacity * 0.6 * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, color + '00');
        
        // Draw glow
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.currentGlowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw core particle
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = color + Math.floor(particle.currentOpacity * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.currentSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawConnections() {
        const ctx = this.ctx;
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const particle1 = this.particles[i];
                const particle2 = this.particles[j];
                
                const dx = particle1.x - particle2.x;
                const dy = particle1.y - particle2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.connectionDistance) {
                    const opacity = (1 - distance / this.connectionDistance) * 0.5;
                    
                    // Create gradient line
                    const gradient = ctx.createLinearGradient(
                        particle1.x, particle1.y,
                        particle2.x, particle2.y
                    );
                    gradient.addColorStop(0, `rgba(108, 99, 255, ${opacity})`);
                    gradient.addColorStop(0.5, `rgba(255, 215, 0, ${opacity * 0.8})`);
                    gradient.addColorStop(1, `rgba(138, 43, 226, ${opacity})`);
                    
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(particle1.x, particle1.y);
                    ctx.lineTo(particle2.x, particle2.y);
                    ctx.stroke();
                }
            }
        }
    }
    
    animate() {
        if (!this.isActive) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        for (const particle of this.particles) {
            this.updateParticle(particle);
            this.drawParticle(particle);
        }
        
        // Draw connections between particles
        this.drawConnections();
        
        // Continue animation
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    destroy() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Initialize particles when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.particlesSystem = new ParticlesSystem();
    });
} else {
    window.particlesSystem = new ParticlesSystem();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.particlesSystem) {
        window.particlesSystem.destroy();
    }
});
                    
                    ctx.strokeStyle = `rgba(108, 99, 255, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particle1.x, particle1.y);
                    ctx.lineTo(particle2.x, particle2.y);
                    ctx.stroke();
                }
            }
        }
    }
    
    animate() {
        if (!this.isActive) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        for (const particle of this.particles) {
            this.updateParticle(particle);
            this.drawParticle(particle);
        }
        
        // Draw connections between particles
        this.drawConnections();
        
        // Continue animation
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    destroy() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Initialize particles when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.particlesSystem = new ParticlesSystem();
    });
} else {
    window.particlesSystem = new ParticlesSystem();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.particlesSystem) {
        window.particlesSystem.destroy();
    }
});
