/**
 * Event Aggregator - Combines and normalizes events from multiple sources
 */

class EventAggregator {
    constructor() {
        this.events = [];
        this.lastUpdate = null;
    }

    /**
     * Add events from a source
     */
    addEvents(events, source) {
        const normalizedEvents = events.map(event => this.normalizeEvent(event, source));
        this.events = [...this.events, ...normalizedEvents];
        this.lastUpdate = new Date();
    }

    /**
     * Normalize event data to a consistent format
     */
    normalizeEvent(event, source) {
        return {
            id: `${source}-${event.id || this.generateId(event.title)}`,
            title: event.title || 'Untitled Event',
            description: event.description || '',
            date: this.parseDate(event.date),
            endDate: event.endDate ? this.parseDate(event.endDate) : null,
            time: event.time || '',
            price: event.price || 'Free',
            category: event.category || 'General',
            image: event.image || '',
            link: event.link || '',
            source: source,
            venue: event.venue || '',
            organizer: event.organizer || ''
        };
    }

    /**
     * Generate a simple ID from title
     */
    generateId(title) {
        return title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);
    }

    /**
     * Parse date string to Date object
     */
    parseDate(dateString) {
        if (!dateString) return new Date();

        let date = new Date(dateString);
        const currentYear = new Date().getFullYear();

        // If parsing fails or returns an old default year (like 2001), try to fix it
        if (isNaN(date.getTime()) || date.getFullYear() < currentYear - 1) {
            // Try appending current year
            if (typeof dateString === 'string') {
                // Clean the string first
                const cleanDate = dateString.replace(/,?\s*\d{4}.*$/, '');
                date = new Date(`${cleanDate}, ${currentYear}`);
            }
        }

        if (!isNaN(date.getTime())) {
            // If the date is still way in the past (e.g. 2001), force it to current year
            if (date.getFullYear() < currentYear - 1) {
                date.setFullYear(currentYear);
            }

            // Handle year transition (e.g. scraping "January 1" in December)
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            // If date is more than 30 days in the past, assume it's for next year
            if (date < thirtyDaysAgo) {
                date.setFullYear(date.getFullYear() + 1);
            }

            return date;
        }

        return new Date();
    }

    /**
     * Get all events
     */
    getAllEvents() {
        return this.removeDuplicates(this.events).sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );
    }

    /**
     * Get events for today
     */
    getTodayEvents() {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        return this.filterByDateRange(startOfDay, endOfDay);
    }

    /**
     * Get events for current week
     */
    getWeekEvents() {
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        return this.filterByDateRange(now, weekFromNow);
    }

    /**
     * Get events for upcoming month
     */
    getMonthEvents() {
        const now = new Date();
        const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        return this.filterByDateRange(now, monthFromNow);
    }

    /**
     * Filter events by date range
     */
    filterByDateRange(startDate, endDate) {
        const filtered = this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= startDate && eventDate <= endDate;
        });

        return this.removeDuplicates(filtered).sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );
    }

    /**
     * Remove duplicate events based on title and date similarity
     * Enhanced to handle cross-website duplicates better
     */
    removeDuplicates(events) {
        const seen = new Map();
        const result = [];

        for (const event of events) {
            // Normalize title for better matching
            const normalizedTitle = this.normalizeTitle(event.title);
            const eventDate = new Date(event.date);
            const dateKey = eventDate.toDateString();

            // Create a key based on normalized title and date
            const key = `${normalizedTitle}-${dateKey}`;

            // Check if we've seen this exact match
            if (seen.has(key)) {
                // Skip this duplicate
                console.log(`Duplicate detected: "${event.title}" from ${event.source}`);
                continue;
            }

            // Check for similar events (fuzzy matching)
            let isDuplicate = false;
            for (const [seenKey, seenEvent] of seen.entries()) {
                if (this.areEventsSimilar(event, seenEvent)) {
                    console.log(`Similar event detected: "${event.title}" ≈ "${seenEvent.title}"`);
                    isDuplicate = true;
                    break;
                }
            }

            if (!isDuplicate) {
                seen.set(key, event);
                result.push(event);
            }
        }

        console.log(`Removed ${events.length - result.length} duplicate events`);
        return result;
    }

    /**
     * Normalize title for better duplicate detection
     */
    normalizeTitle(title) {
        return title
            .toLowerCase()
            .trim()
            // Remove special characters
            .replace(/[^\w\s]/g, '')
            // Remove extra whitespace
            .replace(/\s+/g, ' ')
            // Remove common words that don't help matching
            .replace(/\b(the|a|an|in|at|on|for)\b/g, '')
            .trim();
    }

    /**
     * Check if two events are similar (likely duplicates)
     */
    areEventsSimilar(event1, event2) {
        // Must be on the same date
        const date1 = new Date(event1.date).toDateString();
        const date2 = new Date(event2.date).toDateString();
        if (date1 !== date2) {
            return false;
        }

        // Compare normalized titles
        const title1 = this.normalizeTitle(event1.title);
        const title2 = this.normalizeTitle(event2.title);

        // Exact match after normalization
        if (title1 === title2) {
            return true;
        }

        // Check if one title contains the other (substring match)
        if (title1.includes(title2) || title2.includes(title1)) {
            return true;
        }

        // Calculate similarity score (Levenshtein-like)
        const similarity = this.calculateSimilarity(title1, title2);

        // If titles are more than 80% similar, consider them duplicates
        return similarity > 0.8;
    }

    /**
     * Calculate similarity between two strings (0 to 1)
     */
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) {
            return 1.0;
        }

        // Count matching characters
        let matches = 0;
        const shorterWords = shorter.split(' ');
        const longerWords = longer.split(' ');

        for (const word of shorterWords) {
            if (longerWords.includes(word) && word.length > 2) {
                matches += word.length;
            }
        }

        return matches / longer.length;
    }

    /**
     * Get events by category
     */
    getEventsByCategory(category) {
        return this.getAllEvents().filter(event =>
            event.category.toLowerCase() === category.toLowerCase()
        );
    }

    /**
     * Get all unique categories
     */
    getCategories() {
        const categories = new Set();
        this.events.forEach(event => {
            if (event.category) {
                categories.add(event.category);
            }
        });
        return Array.from(categories).sort();
    }

    /**
     * Clear all events
     */
    clear() {
        this.events = [];
        this.lastUpdate = null;
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            totalEvents: this.events.length,
            uniqueEvents: this.getAllEvents().length,
            categories: this.getCategories().length,
            lastUpdate: this.lastUpdate
        };
    }
}

module.exports = new EventAggregator();
