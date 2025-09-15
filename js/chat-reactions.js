/**
 * SYNCSTREAM CHAT REACTIONS
 * Animated emoji reactions and smart chat enhancements
 */

class ChatReactions {
    constructor() {
        this.reactionEmojis = ['❤️', '😂', '😮', '😍', '👍', '👎', '🔥', '💯', '🎉', '😢'];
        this.activeReactions = new Map();
        this.reactionPicker = null;
        
        this.init();
    }
    
    init() {
        this.createReactionPicker();
        this.enhanceChatInput();
        this.bindChatEvents();
    }
    
    createReactionPicker() {
        this.reactionPicker = document.createElement('div');
        this.reactionPicker.className = 'reaction-picker glass-luxury';
        this.reactionPicker.style.cssText = `
            position: absolute;
            bottom: 60px;
            right: 0;
            background: rgba(108, 99, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 215, 0, 0.2);
            border-radius: 15px;
            padding: 10px;
            display: none;
            z-index: 1000;
            flex-wrap: wrap;
            gap: 5px;
            width: 200px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
        `;
        
        this.reactionEmojis.forEach(emoji => {
            const emojiBtn = document.createElement('button');
            emojiBtn.className = 'emoji-btn btn-ghost-luxury';
            emojiBtn.textContent = emoji;
            emojiBtn.style.cssText = `
                background: transparent;
                border: none;
                font-size: 1.5rem;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            emojiBtn.addEventListener('click', () => {
                this.addReactionToMessage(emoji);
                this.hideReactionPicker();
            });
            
            emojiBtn.addEventListener('mouseenter', () => {
                emojiBtn.style.transform = 'scale(1.3)';
                emojiBtn.style.background = 'rgba(255, 215, 0, 0.2)';
            });
            
            emojiBtn.addEventListener('mouseleave', () => {
                emojiBtn.style.transform = 'scale(1)';
                emojiBtn.style.background = 'transparent';
            });
            
            this.reactionPicker.appendChild(emojiBtn);
        });
    }
    
    enhanceChatInput() {
        const chatForm = document.getElementById('chatForm');
        const chatInput = document.getElementById('chatInput');
        
        if (!chatForm || !chatInput) return;
        
        // Add reaction button to chat input
        const reactionBtn = document.createElement('button');
        reactionBtn.type = 'button';
        reactionBtn.className = 'reaction-toggle-btn btn-ghost-luxury';
        reactionBtn.innerHTML = '😊';
        reactionBtn.style.cssText = `
            position: absolute;
            right: 60px;
            top: 50%;
            transform: translateY(-50%);
            background: transparent;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 5px;
            border-radius: 50%;
            transition: all 0.2s ease;
        `;
        
        reactionBtn.addEventListener('click', () => this.toggleReactionPicker());
        
        // Make chat input container relative
        const inputGroup = chatForm.querySelector('.input-group');
        if (inputGroup) {
            inputGroup.style.position = 'relative';
            inputGroup.appendChild(reactionBtn);
            inputGroup.appendChild(this.reactionPicker);
        }
        
        // Add emoji support to typing
        chatInput.addEventListener('input', (e) => {
            this.handleEmojiShortcuts(e);
        });
        
        // Add message reactions on right-click
        this.addMessageReactionSupport();
    }
    
    toggleReactionPicker() {
        if (this.reactionPicker.style.display === 'flex') {
            this.hideReactionPicker();
        } else {
            this.showReactionPicker();
        }
    }
    
    showReactionPicker() {
        this.reactionPicker.style.display = 'flex';
        this.reactionPicker.style.animation = 'slideUp 0.3s ease';
    }
    
    hideReactionPicker() {
        this.reactionPicker.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => {
            this.reactionPicker.style.display = 'none';
        }, 300);
    }
    
    addReactionToMessage(emoji) {
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            const currentValue = chatInput.value;
            chatInput.value = currentValue + emoji;
            chatInput.focus();
        }
    }
    
    handleEmojiShortcuts(e) {
        const input = e.target;
        const value = input.value;
        
        // Convert common emoji shortcuts
        const shortcuts = {
            ':)': '😊',
            ':D': '😃',
            ':(': '😢',
            ':P': '😛',
            ':o': '😮',
            '<3': '❤️',
            '</3': '💔',
            ':fire:': '🔥',
            ':100:': '💯',
            ':party:': '🎉',
            ':thumbsup:': '👍',
            ':thumbsdown:': '👎'
        };
        
        let newValue = value;
        Object.keys(shortcuts).forEach(shortcut => {
            newValue = newValue.replace(new RegExp(shortcut.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), shortcuts[shortcut]);
        });
        
        if (newValue !== value) {
            input.value = newValue;
        }
    }
    
    addMessageReactionSupport() {
        // Observer to add reaction support to new messages
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE && 
                        (node.classList?.contains('message') || node.querySelector?.('.message'))) {
                        this.addReactionButtonToMessage(node.classList?.contains('message') ? node : node.querySelector('.message'));
                    }
                });
            });
        });
        
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            observer.observe(chatMessages, { childList: true, subtree: true });
            
            // Add to existing messages
            chatMessages.querySelectorAll('.message').forEach(message => {
                this.addReactionButtonToMessage(message);
            });
        }
    }
    
    addReactionButtonToMessage(messageElement) {
        if (!messageElement || messageElement.querySelector('.message-reactions')) return;
        
        const reactionsContainer = document.createElement('div');
        reactionsContainer.className = 'message-reactions';
        reactionsContainer.style.cssText = `
            display: flex;
            gap: 5px;
            margin-top: 5px;
            flex-wrap: wrap;
        `;
        
        const addReactionBtn = document.createElement('button');
        addReactionBtn.className = 'add-reaction-btn';
        addReactionBtn.innerHTML = '+';
        addReactionBtn.style.cssText = `
            background: rgba(108, 99, 255, 0.2);
            border: 1px solid rgba(255, 215, 0, 0.3);
            border-radius: 12px;
            padding: 2px 8px;
            font-size: 0.8rem;
            cursor: pointer;
            color: rgba(255, 255, 255, 0.7);
            transition: all 0.2s ease;
        `;
        
        addReactionBtn.addEventListener('click', () => {
            this.showMessageReactionPicker(messageElement, reactionsContainer);
        });
        
        reactionsContainer.appendChild(addReactionBtn);
        messageElement.appendChild(reactionsContainer);
        
        // Add hover effect to show add button
        messageElement.addEventListener('mouseenter', () => {
            addReactionBtn.style.opacity = '1';
        });
        
        messageElement.addEventListener('mouseleave', () => {
            if (!reactionsContainer.querySelector('.reaction-count:not(.add-reaction-btn)')) {
                addReactionBtn.style.opacity = '0.5';
            }
        });
    }
    
    showMessageReactionPicker(messageElement, reactionsContainer) {
        const picker = document.createElement('div');
        picker.className = 'mini-reaction-picker';
        picker.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 215, 0, 0.3);
            border-radius: 10px;
            padding: 5px;
            display: flex;
            gap: 5px;
            z-index: 1001;
            animation: popIn 0.2s ease;
        `;
        
        this.reactionEmojis.slice(0, 6).forEach(emoji => {
            const emojiBtn = document.createElement('button');
            emojiBtn.textContent = emoji;
            emojiBtn.style.cssText = `
                background: transparent;
                border: none;
                font-size: 1.2rem;
                padding: 5px;
                cursor: pointer;
                border-radius: 5px;
                transition: all 0.2s ease;
            `;
            
            emojiBtn.addEventListener('click', () => {
                this.addReactionToMessageElement(messageElement, emoji);
                picker.remove();
            });
            
            emojiBtn.addEventListener('mouseenter', () => {
                emojiBtn.style.background = 'rgba(255, 215, 0, 0.2)';
                emojiBtn.style.transform = 'scale(1.2)';
            });
            
            picker.appendChild(emojiBtn);
        });
        
        // Position picker
        const rect = reactionsContainer.getBoundingClientRect();
        picker.style.top = (rect.top - 50) + 'px';
        picker.style.left = rect.left + 'px';
        
        document.body.appendChild(picker);
        
        // Remove on click outside
        setTimeout(() => {
            const handleClick = (e) => {
                if (!picker.contains(e.target)) {
                    picker.remove();
                    document.removeEventListener('click', handleClick);
                }
            };
            document.addEventListener('click', handleClick);
        }, 100);
    }
    
    addReactionToMessageElement(messageElement, emoji) {
        const reactionsContainer = messageElement.querySelector('.message-reactions');
        if (!reactionsContainer) return;
        
        // Check if reaction already exists
        let existingReaction = Array.from(reactionsContainer.children).find(
            child => child.textContent.includes(emoji)
        );
        
        if (existingReaction && existingReaction.classList.contains('reaction-count')) {
            // Increment existing reaction
            const countSpan = existingReaction.querySelector('.count');
            const count = parseInt(countSpan.textContent) + 1;
            countSpan.textContent = count;
            
            // Animate
            existingReaction.style.animation = 'reactionPulse 0.3s ease';
        } else {
            // Create new reaction
            const reactionBtn = document.createElement('button');
            reactionBtn.className = 'reaction-count';
            reactionBtn.innerHTML = `${emoji} <span class="count">1</span>`;
            reactionBtn.style.cssText = `
                background: rgba(108, 99, 255, 0.3);
                border: 1px solid rgba(255, 215, 0, 0.4);
                border-radius: 12px;
                padding: 2px 8px;
                font-size: 0.8rem;
                cursor: pointer;
                color: white;
                transition: all 0.2s ease;
                animation: reactionAppear 0.3s ease;
            `;
            
            reactionBtn.addEventListener('click', () => {
                this.toggleReactionVote(reactionBtn, emoji);
            });
            
            reactionsContainer.insertBefore(reactionBtn, reactionsContainer.lastChild);
        }
        
        // Show floating reaction animation
        this.showFloatingReaction(messageElement, emoji);
    }
    
    showFloatingReaction(messageElement, emoji) {
        const floatingReaction = document.createElement('div');
        floatingReaction.textContent = emoji;
        floatingReaction.style.cssText = `
            position: absolute;
            font-size: 1.5rem;
            pointer-events: none;
            z-index: 1002;
            animation: floatReaction 2s ease-out forwards;
        `;
        
        const rect = messageElement.getBoundingClientRect();
        floatingReaction.style.left = (rect.right - 30) + 'px';
        floatingReaction.style.top = rect.top + 'px';
        
        document.body.appendChild(floatingReaction);
        
        setTimeout(() => floatingReaction.remove(), 2000);
    }
    
    toggleReactionVote(reactionBtn, emoji) {
        const countSpan = reactionBtn.querySelector('.count');
        const count = parseInt(countSpan.textContent);
        
        // Simple toggle simulation (in real app, this would sync with server)
        if (reactionBtn.classList.contains('voted')) {
            reactionBtn.classList.remove('voted');
            countSpan.textContent = Math.max(0, count - 1);
            reactionBtn.style.background = 'rgba(108, 99, 255, 0.3)';
        } else {
            reactionBtn.classList.add('voted');
            countSpan.textContent = count + 1;
            reactionBtn.style.background = 'rgba(255, 215, 0, 0.3)';
        }
        
        // Remove if count reaches 0
        if (parseInt(countSpan.textContent) === 0) {
            reactionBtn.style.animation = 'reactionDisappear 0.3s ease';
            setTimeout(() => reactionBtn.remove(), 300);
        }
    }
    
    bindChatEvents() {
        // Hide picker when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.reactionPicker.contains(e.target) && 
                !e.target.classList.contains('reaction-toggle-btn')) {
                this.hideReactionPicker();
            }
        });
    }
}

// Add reaction animations CSS
const reactionStyles = document.createElement('style');
reactionStyles.textContent = `
    @keyframes slideUp {
        from { 
            opacity: 0; 
            transform: translateY(10px) scale(0.9); 
        }
        to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
        }
    }
    
    @keyframes slideDown {
        from { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
        }
        to { 
            opacity: 0; 
            transform: translateY(10px) scale(0.9); 
        }
    }
    
    @keyframes reactionAppear {
        from { 
            opacity: 0; 
            transform: scale(0) rotate(180deg); 
        }
        to { 
            opacity: 1; 
            transform: scale(1) rotate(0deg); 
        }
    }
    
    @keyframes reactionDisappear {
        from { 
            opacity: 1; 
            transform: scale(1); 
        }
        to { 
            opacity: 0; 
            transform: scale(0); 
        }
    }
    
    @keyframes reactionPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); background: rgba(255, 215, 0, 0.5); }
        100% { transform: scale(1); }
    }
    
    @keyframes floatReaction {
        0% { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
        }
        100% { 
            opacity: 0; 
            transform: translateY(-50px) scale(1.5); 
        }
    }
    
    @keyframes popIn {
        from { 
            opacity: 0; 
            transform: scale(0.5); 
        }
        to { 
            opacity: 1; 
            transform: scale(1); 
        }
    }
    
    .reaction-toggle-btn:hover {
        background: rgba(255, 215, 0, 0.2) !important;
        transform: translateY(-50%) scale(1.1) !important;
    }
    
    .message-reactions {
        opacity: 0;
        transition: opacity 0.2s ease;
    }
    
    .message:hover .message-reactions {
        opacity: 1;
    }
    
    .add-reaction-btn {
        opacity: 0.5;
    }
    
    .reaction-count:hover {
        background: rgba(255, 215, 0, 0.4) !important;
        transform: scale(1.05);
    }
`;
document.head.appendChild(reactionStyles);

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.chatReactions = new ChatReactions();
    });
} else {
    window.chatReactions = new ChatReactions();
}
