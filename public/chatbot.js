/**
 * Chatbot UI Component
 * Handles chat interface and communication with backend
 */

class ChatbotUI {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.init();
    }

    init() {
        this.createChatbotElements();
        this.attachEventListeners();
    }

    createChatbotElements() {
        // Create chatbot container
        const chatbotHTML = `
            <div class="chatbot-container" id="chatbotContainer">
                <div class="chatbot-header">
                    <div class="chatbot-title">
                        <span class="chatbot-icon">🤖</span>
                        <span>Events Assistant</span>
                    </div>
                    <button class="chatbot-close" id="chatbotClose">✕</button>
                </div>
                <div class="chatbot-messages" id="chatbotMessages">
                    <div class="bot-message">
                        <div class="message-avatar">🤖</div>
                        <div class="message-content">
                            Hi! I'm your events assistant. Ask me anything about events in Qatar! 
                            <br><br>
                            Try asking:
                            <ul>
                                <li>"What events are happening this weekend?"</li>
                                <li>"Show me free events"</li>
                                <li>"Sports events in December"</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="chatbot-input-container">
                    <input 
                        type="text" 
                        class="chatbot-input" 
                        id="chatbotInput" 
                        placeholder="Ask about events..."
                        autocomplete="off"
                    >
                    <button class="chatbot-send" id="chatbotSend">
                        <span>➤</span>
                    </button>
                </div>
            </div>
            <button class="chatbot-toggle" id="chatbotToggle">
                <span class="chatbot-toggle-icon">💬</span>
            </button>
        `;

        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    }

    attachEventListeners() {
        const toggle = document.getElementById('chatbotToggle');
        const close = document.getElementById('chatbotClose');
        const send = document.getElementById('chatbotSend');
        const input = document.getElementById('chatbotInput');

        toggle.addEventListener('click', () => this.toggleChat());
        close.addEventListener('click', () => this.closeChat());
        send.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    toggleChat() {
        const container = document.getElementById('chatbotContainer');
        const toggle = document.getElementById('chatbotToggle');

        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            container.classList.add('active');
            toggle.classList.add('hidden');
            document.getElementById('chatbotInput').focus();
        } else {
            container.classList.remove('active');
            toggle.classList.remove('hidden');
        }
    }

    closeChat() {
        this.isOpen = false;
        document.getElementById('chatbotContainer').classList.remove('active');
        document.getElementById('chatbotToggle').classList.remove('hidden');
    }

    async sendMessage() {
        const input = document.getElementById('chatbotInput');
        const query = input.value.trim();

        if (!query) return;

        // Add user message
        this.addMessage(query, 'user');
        input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Send to backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });

            const data = await response.json();

            // Remove typing indicator
            this.hideTypingIndicator();

            if (data.success) {
                // Add bot response
                this.addMessage(data.response, 'bot', data.events);
            } else {
                this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
            }
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Sorry, I couldn\'t connect to the server. Please try again.', 'bot');
        }
    }

    addMessage(content, type, events = []) {
        const messagesContainer = document.getElementById('chatbotMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;

        if (type === 'user') {
            messageDiv.innerHTML = `
                <div class="message-content">${this.escapeHtml(content)}</div>
                <div class="message-avatar">👤</div>
            `;
        } else {
            let eventCards = '';
            if (events && events.length > 0) {
                eventCards = '<div class="chat-events">' +
                    events.slice(0, 3).map(event => this.createEventCard(event)).join('') +
                    '</div>';
            }

            messageDiv.innerHTML = `
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    ${content}
                    ${eventCards}
                </div>
            `;
        }

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    createEventCard(event) {
        return `
            <div class="chat-event-card">
                <img src="${event.image}" alt="${event.title}" class="chat-event-image">
                <div class="chat-event-info">
                    <h4 class="chat-event-title">${this.escapeHtml(event.title)}</h4>
                    <p class="chat-event-date">${event.dateDisplay || new Date(event.date).toLocaleDateString()}</p>
                    <p class="chat-event-venue">${this.escapeHtml(event.venue)}</p>
                    <a href="${event.link}" target="_blank" class="chat-event-link">View Details →</a>
                </div>
            </div>
        `;
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatbotMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'bot-message typing-indicator';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatbotUI();
});
