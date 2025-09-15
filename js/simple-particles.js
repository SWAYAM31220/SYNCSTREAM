/**
 * SIMPLE CSS PARTICLES FALLBACK
 * Creates visible floating particles using CSS animations
 */

function createCSSParticles() {
    // Remove existing particles
    const existingParticles = document.querySelectorAll('.css-particle');
    existingParticles.forEach(p => p.remove());
    
    const colors = [
        '#6C63FF',
        '#8A2BE2', 
        '#FFD700',
        '#FF8C00',
        '#9370DB',
        '#DDA0DD'
    ];
    
    const particleCount = window.innerWidth < 768 ? 15 : 25;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'css-particle';
        particle.style.cssText = `
            position: fixed;
            width: ${Math.random() * 6 + 3}px;
            height: ${Math.random() * 6 + 3}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: 50%;
            left: ${Math.random() * 100}vw;
            top: ${Math.random() * 100}vh;
            opacity: ${Math.random() * 0.8 + 0.2};
            z-index: -1;
            pointer-events: none;
            box-shadow: 0 0 ${Math.random() * 20 + 10}px currentColor;
            animation: 
                cssFloat ${Math.random() * 20 + 10}s ease-in-out infinite ${Math.random() * -10}s,
                cssPulse ${Math.random() * 4 + 2}s ease-in-out infinite alternate;
        `;
        document.body.appendChild(particle);
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes cssFloat {
        0%, 100% { 
            transform: translate(0, 0) scale(1); 
        }
        25% { 
            transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(1.2); 
        }
        50% { 
            transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(0.8); 
        }
        75% { 
            transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(1.1); 
        }
    }
    
    @keyframes cssPulse {
        0% { opacity: 0.3; }
        100% { opacity: 0.9; }
    }
    
    .css-particle {
        filter: blur(1px);
        mix-blend-mode: screen;
    }
`;
document.head.appendChild(style);

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createCSSParticles);
} else {
    createCSSParticles();
}

// Recreate on resize
window.addEventListener('resize', () => {
    setTimeout(createCSSParticles, 100);
});

console.log('Simple CSS particles loaded as fallback');
