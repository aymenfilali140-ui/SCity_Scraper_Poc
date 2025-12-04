/**
 * Event Aggregator - Combines and normalizes events from multiple sources
 * Now with MongoDB persistence
 */

const Event = require('../models/Event');

class EventAggregator {
    constructor() {
        this.inMemoryEvents = []; // Fallback for when DB is unavailable
        this.lastUpdate = null;
        this.useDatabase = false;
    }

    /**
     * Initialize with database support
     */
    async initialize(database) {
        this.database = database;
        this.useDatabase = database && database.isConnected;
        
        if (this.useDatabase) {
            console.log('EventAggregator: Using MongoDB for persistence');
        } else {
            console.log('EventAggregator: Using in-memory storage (no persistence)');
        }
    }

    /**
     * Add events from a source
     */
    async addEvents(events, source) {
        const normalizedEvents = events.map(event => this.normalizeEvent(event, source));
        
        if (this.useDatabase) {
            try {
                // Bulk upsert to database
                const bulkOps = normalizedEvents.map(event => ({
                    updateOne: {
                        filter: { eventId: event.id },
                        update: {
                            $set: {
                                eventId: event.id,
                                title: event.title,
                                description: event.description,
                                date: event.date,
                                endDate: event.endDate,
                                time: event.time,
                                price: event.price,
                                category: event.category,
                                venue: event.venue,
                                organizer: event.organizer,
                                image: event.image,
                                link: event.link,
                                source: event.source
                            }
                        },
                        upsert: true
                    }
                }));

                if (bulkOps.length > 0) {
                    await Event.bulkWrite(bulkOps);
                    console.log(`Saved ${bulkOps.length} events from ${source} to database`);
                }
            } catch (error) {
                console.error('Error saving events to database:', error.message);
                // Fallback to in-memory
                this.inMemoryEvents = [...this.inMemoryEvents, ...normalizedEvents];
            }
        } else {
            // Use in-memory storage
            this.inMemoryEvents = [...this.inMemoryEvents, ...normalizedEvents];
        }
        
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
    async getAllEvents() {
        if (this.useDatabase) {
            try {
                const events = await Event.find({}).sort({ date: 1 }).lean();
                return this.convertDbEventsToFormat(events);
            } catch (error) {
                console.error('Error fetching events from database:', error.message);
                return this.removeDuplicates(this.inMemoryEvents).sort((a, b) =>
                    new Date(a.date) - new Date(b.date)
                );
            }
        }
        
        return this.removeDuplicates(this.inMemoryEvents).sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );
    }

    /**
     * Get events for today
     */
    async getTodayEvents() {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        return this.filterByDateRange(startOfDay, endOfDay);
    }

    /**
     * Get events for current week
     */
    async getWeekEvents() {
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        return this.filterByDateRange(now, weekFromNow);
    }

    /**
     * Get events for upcoming month
     */
    async getMonthEvents() {
        const now = new Date();
        const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        return this.filterByDateRange(now, monthFromNow);
    }

    /**
     * Filter events by date range
     */
    async filterByDateRange(startDate, endDate) {
        if (this.useDatabase) {
            try {
                const events = await Event.findByDateRange(startDate, endDate).lean();
                return this.convertDbEventsToFormat(events);
            } catch (error) {
                console.error('Error filtering events by date:', error.message);
                // Fallback to in-memory
                const filtered = this.inMemoryEvents.filter(event => {
                    const eventDate = new Date(event.date);
                    return eventDate >= startDate && eventDate <= endDate;
                });
                return this.removeDuplicates(filtered).sort((a, b) =>
                    new Date(a.date) - new Date(b.date)
                );
            }
        }

        const filtered = this.inMemoryEvents.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= startDate && eventDate <= endDate;
        });

        return this.removeDuplicates(filtered).sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );
    }

    /**
     * Convert database events to API format
     */
    convertDbEventsToFormat(dbEvents) {
        return dbEvents.map(event => ({
            id: event.eventId,
            title: event.title,
            description: event.description,
            date: event.date,
            dateDisplay: new Date(event.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }),
            endDate: event.endDate,
            time: event.time,
            price: event.price,
            category: event.category,
            venue: event.venue,
            organizer: event.organizer,
            image: event.image,
            link: event.link,
            source: event.source
        }));
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
                continue;
            }

            // Check for similar events (fuzzy matching)
            let isDuplicate = false;
            for (const [seenKey, seenEvent] of seen.entries()) {
                if (this.areEventsSimilar(event, seenEvent)) {
                    isDuplicate = true;
                    break;
                }
            }

            if (!isDuplicate) {
                seen.set(key, event);
                result.push(event);
            }
        }

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
    async getEventsByCategory(category) {
        if (this.useDatabase) {
            try {
                const events = await Event.findByCategory(category).lean();
                return this.convertDbEventsToFormat(events);
            } catch (error) {
                console.error('Error fetching events by category:', error.message);
                const allEvents = await this.getAllEvents();
                return allEvents.filter(event =>
                    event.category.toLowerCase() === category.toLowerCase()
                );
            }
        }

        const allEvents = await this.getAllEvents();
        return allEvents.filter(event =>
            event.category.toLowerCase() === category.toLowerCase()
        );
    }

    /**
     * Get all unique categories
     */
    async getCategories() {
        if (this.useDatabase) {
            try {
                return await Event.getCategories();
            } catch (error) {
                console.error('Error fetching categories:', error.message);
                // Fallback to in-memory
                const categories = new Set();
                this.inMemoryEvents.forEach(event => {
                    if (event.category) {
                        categories.add(event.category);
                    }
                });
                return Array.from(categories).sort();
            }
        }

        const categories = new Set();
        this.inMemoryEvents.forEach(event => {
            if (event.category) {
                categories.add(event.category);
            }
        });
        return Array.from(categories).sort();
    }

    /**
     * Clear all events
     */
    async clear() {
        if (this.useDatabase) {
            try {
                await Event.deleteMany({});
                console.log('Cleared all events from database');
            } catch (error) {
                console.error('Error clearing events from database:', error.message);
            }
        }
        
        this.inMemoryEvents = [];
        this.lastUpdate = null;
    }

    /**
     * Get statistics
     */
    async getStats() {
        let totalEvents = 0;
        let uniqueEvents = 0;
        let categories = 0;

        if (this.useDatabase) {
            try {
                totalEvents = await Event.countDocuments();
                uniqueEvents = totalEvents; // DB already handles uniqueness
                const cats = await this.getCategories();
                categories = cats.length;
            } catch (error) {
                console.error('Error getting stats from database:', error.message);
                totalEvents = this.inMemoryEvents.length;
                const allEvents = await this.getAllEvents();
                uniqueEvents = allEvents.length;
                const cats = await this.getCategories();
                categories = cats.length;
            }
        } else {
            totalEvents = this.inMemoryEvents.length;
            const allEvents = await this.getAllEvents();
            uniqueEvents = allEvents.length;
            const cats = await this.getCategories();
            categories = cats.length;
        }

        return {
            totalEvents,
            uniqueEvents,
            categories,
            lastUpdate: this.lastUpdate,
            usingDatabase: this.useDatabase
        };
    }
}

module.exports = new EventAggregator();
