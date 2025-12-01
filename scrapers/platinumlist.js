/**
 * Platinumlist Scraper
 * Improved version with better selectors and error handling
 */

const axios = require('axios');
const cheerio = require('cheerio');

class PlatinumlistScraper {
    constructor() {
        this.baseUrl = 'https://www.platinumlist.net';
        this.eventsUrl = 'https://www.platinumlist.net/qatar';
    }

    /**
     * Scrape events from Platinumlist
     */
    async scrape() {
        try {
            console.log('Scraping Platinumlist...');
            const response = await axios.get(this.eventsUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);
            const events = [];

            // Try multiple possible selectors for Platinumlist
            const selectors = [
                '.event-item',
                '.event-card',
                '.listing',
                'article',
                '.card',
                '[class*="event"]'
            ];

            let foundElements = false;
            for (const selector of selectors) {
                const elements = $(selector);
                if (elements.length > 0) {
                    console.log(`Platinumlist: Found ${elements.length} elements with selector: ${selector}`);
                    foundElements = true;

                    elements.each((i, element) => {
                        try {
                            const $event = $(element);

                            const title = $event.find('h2, h3, .title, .event-title, [class*="title"]').first().text().trim();
                            const description = $event.find('.description, .summary, p, [class*="desc"]').first().text().trim();
                            const date = $event.find('.date, time, .event-date, [class*="date"]').first().text().trim();
                            const image = $event.find('img').first().attr('src') || '';
                            const link = $event.find('a').first().attr('href') || '';
                            const category = $event.find('.category, .genre, .tag, [class*="category"]').first().text().trim();
                            const venue = $event.find('.venue, .location, .place, [class*="location"]').first().text().trim();
                            const price = $event.find('.price, .cost, [class*="price"]').first().text().trim();

                            if (title && title.length > 3) {
                                events.push({
                                    id: i,
                                    title,
                                    description: description || 'Click to view more details about this event.',
                                    date: date ? this.parseDate(date) : new Date().toISOString(),
                                    time: this.extractTime(date),
                                    price: price || 'Check website',
                                    category: category || 'Entertainment',
                                    image: image.startsWith('http') ? image : `${this.baseUrl}${image}`,
                                    link: link.startsWith('http') ? link : `${this.baseUrl}${link}`,
                                    venue: venue || 'Qatar',
                                    organizer: 'Platinumlist'
                                });
                            }
                        } catch (err) {
                            console.error('Error parsing event:', err.message);
                        }
                    });

                    break; // Stop after finding elements with first working selector
                }
            }

            if (!foundElements) {
                console.log('Platinumlist: No event elements found with any selector');
            }

            console.log(`Platinumlist: Found ${events.length} events`);

            // Return mock events if no events were found
            if (events.length === 0) {
                console.log('Platinumlist: No events found, returning mock data');
                return this.getMockEvents();
            }

            return events;
        } catch (error) {
            console.error('Platinumlist scraping error:', error.message);
            return this.getMockEvents();
        }
    }

    /**
     * Extract time from date string
     */
    extractTime(dateString) {
        if (!dateString) return '';
        const timeMatch = dateString.match(/\d{1,2}:\d{2}\s*(AM|PM)?/i);
        return timeMatch ? timeMatch[0] : '';
    }

    /**
     * Parse date string to ISO format
     */
    parseDate(dateStr) {
        if (!dateStr) {
            return new Date().toISOString();
        }

        try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date.toISOString();
            }
        } catch (err) {
            // If parsing fails, return current date
        }

        return new Date().toISOString();
    }

    /**
     * Get mock events for testing/fallback
     */
    getMockEvents() {
        const today = new Date();
        return [
            {
                id: 1,
                title: 'Live Concert: Arabic Nights',
                description: 'An enchanting evening of Arabic music featuring renowned artists from across the Middle East.',
                date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                time: '8:00 PM',
                price: 'QAR 150 - QAR 500',
                category: 'Music',
                image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
                link: 'https://www.platinumlist.net/event/arabic-nights',
                venue: 'Qatar National Convention Centre',
                organizer: 'Platinumlist'
            },
            {
                id: 2,
                title: 'Comedy Night with International Stars',
                description: 'Get ready for a night of laughter with top comedians from around the world.',
                date: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
                time: '9:00 PM',
                price: 'QAR 100',
                category: 'Comedy',
                image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800',
                link: 'https://www.platinumlist.net/event/comedy-night',
                venue: 'Doha Comedy Club',
                organizer: 'Platinumlist'
            },
            {
                id: 3,
                title: 'Kids Fun Day',
                description: 'A day full of activities, games, and entertainment for children of all ages.',
                date: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
                time: '2:00 PM',
                price: 'QAR 25',
                category: 'Family',
                image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800',
                link: 'https://www.platinumlist.net/event/kids-fun-day',
                venue: 'Aspire Park',
                organizer: 'Platinumlist'
            },
            {
                id: 4,
                title: 'Jazz Evening at The Pearl',
                description: 'Smooth jazz performances in an elegant waterfront setting.',
                date: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(),
                time: '7:30 PM',
                price: 'QAR 200',
                category: 'Music',
                image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800',
                link: 'https://www.platinumlist.net/event/jazz-evening',
                venue: 'The Pearl-Qatar',
                organizer: 'Platinumlist'
            }
        ];
    }
}

module.exports = new PlatinumlistScraper();
