/**
 * Qatar Events Aggregator - Frontend Application
 */

class EventsApp {
    constructor() {
        this.events = [];
        this.filteredEvents = [];
        this.categories = new Set();
        this.currentDateRange = 'week';
        this.currentCategory = 'all';

        this.initializeElements();
        this.attachEventListeners();
        this.loadEvents();
        this.loadCategories();
    }

    initializeElements() {
        this.eventsGrid = document.getElementById('eventsGrid');
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.emptyState = document.getElementById('emptyState');
        this.errorMessage = document.getElementById('errorMessage');

        // Quick action buttons
        this.todayBtn = document.getElementById('todayBtn');
        this.weekBtn = document.getElementById('weekBtn');
        this.monthBtn = document.getElementById('monthBtn');
        this.allBtn = document.getElementById('allBtn');

        // Sidebar elements
        this.categorySidebar = document.getElementById('categorySidebar');
        this.categoryList = document.getElementById('categoryList');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.sidebarClose = document.getElementById('sidebarClose');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');

        this.refreshBtn = document.getElementById('refreshBtn');
        this.totalEventsEl = document.getElementById('totalEvents');
        this.lastUpdateEl = document.getElementById('lastUpdate');
        this.modal = document.getElementById('eventModal');
        this.modalBody = document.getElementById('modalBody');
        this.modalClose = document.getElementById('modalClose');
        this.modalOverlay = document.getElementById('modalOverlay');

        // Search and Top Stats
        this.searchInput = document.getElementById('searchInput');
        this.topTotalEventsEl = document.getElementById('topTotalEvents');

        // Theme toggle
        this.themeToggle = document.getElementById('themeToggle');
        this.initializeTheme();
    }

    initializeTheme() {
        // Check local storage or system preference
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else {
            // Default to dark mode if no preference
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

    attachEventListeners() {
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Search input
        this.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.filterAndRenderEvents();
        });

        // Quick action buttons for date range
        this.todayBtn.addEventListener('click', () => this.setDateRange('today'));
        this.weekBtn.addEventListener('click', () => this.setDateRange('week'));
        this.monthBtn.addEventListener('click', () => this.setDateRange('month'));
        this.allBtn.addEventListener('click', () => this.setDateRange('all'));

        // Sidebar toggle
        this.sidebarToggle.addEventListener('click', () => this.openSidebar());
        this.sidebarClose.addEventListener('click', () => this.closeSidebar());
        this.sidebarOverlay.addEventListener('click', () => this.closeSidebar());

        this.refreshBtn.addEventListener('click', () => {
            this.refreshEvents();
        });

        this.modalClose.addEventListener('click', () => {
            this.closeModal();
        });

        this.modalOverlay.addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.modal.classList.contains('active')) {
                    this.closeModal();
                } else if (this.categorySidebar.classList.contains('open')) {
                    this.closeSidebar();
                }
            }
        });
    }

    openSidebar() {
        this.categorySidebar.classList.add('open');
        this.sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeSidebar() {
        this.categorySidebar.classList.remove('open');
        this.sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    setDateRange(range) {
        this.currentDateRange = range;

        // Update active state on buttons
        [this.todayBtn, this.weekBtn, this.monthBtn, this.allBtn].forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = {
            'today': this.todayBtn,
            'week': this.weekBtn,
            'month': this.monthBtn,
            'all': this.allBtn
        }[range];

        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        this.loadEvents();
    }

    setCategory(category) {
        this.currentCategory = category;

        // Update active state on category chips
        const chips = this.categoryChips.querySelectorAll('.category-chip');
        chips.forEach(chip => {
            chip.classList.remove('active');
            if (chip.dataset.category === category) {
                chip.classList.add('active');
            }
        });

        this.filterAndRenderEvents();
    }

    async loadEvents() {
        try {
            this.showLoading();

            const response = await fetch(`/api/events?range=${this.currentDateRange}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to load events');
            }

            this.events = data.events || [];
            this.updateLastUpdate(data.lastUpdate);
            this.filterAndRenderEvents();

        } catch (err) {
            this.showError(err.message);
        }
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();

            if (data.success && data.categories) {
                this.updateCategoryFilter(data.categories);
            }
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    }

    async refreshEvents() {
        try {
            this.refreshBtn.classList.add('refreshing');
            this.refreshBtn.disabled = true;

            const response = await fetch('/api/refresh', {
                method: 'POST'
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to refresh events');
            }

            // Wait a bit for scraping to complete
            setTimeout(() => {
                this.loadEvents();
                this.loadCategories();
                this.refreshBtn.classList.remove('refreshing');
                this.refreshBtn.disabled = false;
            }, 2000);

        } catch (err) {
            this.refreshBtn.classList.remove('refreshing');
            this.refreshBtn.disabled = false;
            this.showError(err.message);
        }
    }

    filterAndRenderEvents() {
        // Filter by category
        let filtered = [...this.events];

        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(event =>
                event.category.toLowerCase() === this.currentCategory.toLowerCase()
            );
        }

        // Filter by search query
        if (this.searchQuery) {
            filtered = filtered.filter(event =>
                event.title.toLowerCase().includes(this.searchQuery) ||
                event.description.toLowerCase().includes(this.searchQuery) ||
                event.venue.toLowerCase().includes(this.searchQuery)
            );
        }

        this.filteredEvents = filtered;
        this.renderEvents();
    }

    renderEvents() {
        this.hideAllStates();

        if (this.filteredEvents.length === 0) {
            this.showEmptyState();
            // Update stats even if empty
            this.totalEventsEl.textContent = '0';
            this.topTotalEventsEl.textContent = '0';
            return;
        }

        this.eventsGrid.innerHTML = '';
        this.totalEventsEl.textContent = this.filteredEvents.length;
        this.topTotalEventsEl.textContent = this.filteredEvents.length;

        this.filteredEvents.forEach((event, index) => {
            const card = this.createEventCard(event, index);
            this.eventsGrid.appendChild(card);
        });
    }

    createEventCard(event, index) {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.style.animationDelay = `${index * 0.05}s`;

        const eventDate = new Date(event.date);
        // Use dateDisplay if available (for ranges), otherwise format the date
        const formattedDate = event.dateDisplay || this.formatDate(eventDate);

        const isInstagram = event.link && event.link.includes('instagram.com');
        const linkText = isInstagram ? 'Instagram' : event.source;
        const linkClass = isInstagram ? 'btn-instagram' : 'btn-primary';

        card.innerHTML = `
            <div class="event-image-container">
                <img src="${event.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800'}" 
                     alt="${event.title}" 
                     class="event-image"
                     onerror="this.src='https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800'">
                <span class="category-badge">${event.category}</span>
            </div>
            <div class="event-content">
                <h3 class="event-title">${event.title}</h3>
                <div class="event-meta">
                    <div class="event-meta-item">
                        <span>${formattedDate}</span>
                    </div>
                    ${event.venue ? `
                        <div class="event-meta-item">
                            <span>${event.venue}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="event-footer">
                    <span class="event-price">${event.price || 'Free'}</span>
                    <a href="${event.link}" target="_blank" class="event-link-btn ${linkClass}" onclick="event.stopPropagation()">
                        ${linkText} →
                    </a>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            this.showEventDetails(event);
        });

        return card;
    }

    showEventDetails(event) {
        const eventDate = new Date(event.date);
        // Use dateDisplay if available (for ranges), otherwise format the date
        const formattedDate = event.dateDisplay || this.formatDate(eventDate);

        const isInstagram = event.link && event.link.includes('instagram.com');
        const linkText = isInstagram ? 'Open on Instagram' : `Open on ${event.source}`;
        const linkClass = isInstagram ? 'btn-instagram' : 'btn-primary';

        this.modalBody.innerHTML = `
            <img src="${event.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800'}" 
                 alt="${event.title}" 
                 class="modal-image"
                 onerror="this.src='https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800'">
            <div class="modal-header">
                <span class="event-category">${event.category}</span>
                <h2 class="modal-title">${event.title}</h2>
            </div>
            <div class="modal-meta">
                <div class="modal-meta-item">
                    <strong>Date:</strong> ${formattedDate}
                </div>
                ${event.time ? `
                    <div class="modal-meta-item">
                        <strong>Time:</strong> ${event.time}
                    </div>
                ` : ''}
                ${event.venue ? `
                    <div class="modal-meta-item">
                        <strong>Venue:</strong> ${event.venue}
                    </div>
                ` : ''}
                <div class="modal-meta-item">
                    <strong>Price:</strong> ${event.price || 'Free'}
                </div>
            </div>
            ${event.description ? `
                <div class="modal-description">
                    ${event.description}
                </div>
            ` : ''}
            <div class="modal-actions">
                <a href="${event.link}" target="_blank" class="btn ${linkClass}">
                    ${linkText} →
                </a>
            </div>
        `;

        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    setCategory(category) {
        this.currentCategory = category;

        // Update active state on category items
        const items = this.categoryList.querySelectorAll('.category-item');
        items.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.category === category) {
                item.classList.add('active');
            }
        });

        this.filterAndRenderEvents();
        this.closeSidebar();
    }

    updateCategoryFilter(categories) {
        // Keep the "All Categories" item that's already in HTML
        const allItem = this.categoryList.querySelector('[data-category="all"]');

        // Clear other items (keep only "All Categories")
        this.categoryList.innerHTML = '';
        this.categoryList.appendChild(allItem);

        // Category icons mapping
        const categoryIcons = {
            'arts & culture': '🎨',
            'music & concerts': '🎵',
            'sports & fitness': '⚽',
            'food & dining': '🍽️',
            'family & kids': '👨‍👩‍👧‍👦',
            'entertainment': '🎬',
            'education & workshops': '📚',
            'business & networking': '💼',
            'community & social': '🤝',
            'tourism & travel': '✈️',
            'exhibitions': '🖼️',
            'festivals': '🎉',
            'other': '📌'
        };

        // Add category items
        categories.forEach(category => {
            const item = document.createElement('button');
            item.className = 'category-item';
            item.dataset.category = category.toLowerCase();

            const icon = categoryIcons[category.toLowerCase()] || '📌';

            item.innerHTML = `
                <span class="category-icon">${icon}</span>
                <span>${category}</span>
            `;

            item.addEventListener('click', () => {
                this.setCategory(category.toLowerCase());
            });

            this.categoryList.appendChild(item);
        });

        // Add click listener to "All Categories" item
        allItem.addEventListener('click', () => {
            this.setCategory('all');
        });
    }

    formatDate(date) {
        const options = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return date.toLocaleDateString('en-US', options);
    }

    updateLastUpdate(timestamp) {
        if (!timestamp) {
            this.lastUpdateEl.textContent = 'Never';
            return;
        }

        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) {
            this.lastUpdateEl.textContent = 'Just now';
        } else if (diffMins < 60) {
            this.lastUpdateEl.textContent = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        } else {
            const diffHours = Math.floor(diffMins / 60);
            this.lastUpdateEl.textContent = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        }
    }

    showLoading() {
        this.hideAllStates();
        this.loading.style.display = 'flex';
    }

    showError(message) {
        this.hideAllStates();
        this.errorMessage.textContent = message;
        this.error.style.display = 'block';
    }

    showEmptyState() {
        this.hideAllStates();
        this.emptyState.style.display = 'block';
        this.totalEventsEl.textContent = '0';
    }

    hideAllStates() {
        this.loading.style.display = 'none';
        this.error.style.display = 'none';
        this.emptyState.style.display = 'none';
        this.eventsGrid.style.display = 'grid';
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new EventsApp();
});
