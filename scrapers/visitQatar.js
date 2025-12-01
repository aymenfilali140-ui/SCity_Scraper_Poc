/**
 * Visit Qatar Scraper
 * Based on successful Python implementation
 * Extracts JSON data from vq-event-listing HTML attribute
 */

const axios = require('axios');
const cheerio = require('cheerio');

class VisitQatarScraper {
    constructor() {
        this.baseUrl = 'https://visitqatar.com';
        this.eventsUrl = 'https://visitqatar.com/intl-en/events-calendar/all-events';
    }

    /**
     * Scrape events from Visit Qatar
     * Uses JSON extraction from HTML attribute (brilliant approach from Python project!)
     */
    async scrape() {
        try {
            console.log('Scraping Visit Qatar...');
            const response = await axios.get(this.eventsUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);

            // Find the vq-event-listing tag (Vue.js component)
            const eventListingTag = $('vq-event-listing');
            if (!eventListingTag.length) {
                console.log('Visit Qatar: Could not find vq-event-listing tag');
                return this.getMockEvents();
            }

            // Extract the :events attribute which contains JSON data
            let rawEventsData = eventListingTag.attr(':events');
            if (!rawEventsData) {
                console.log('Visit Qatar: No :events attribute found');
                return this.getMockEvents();
            }

            // Clean HTML entities and parse JSON
            const cleanedData = this.cleanRawData(rawEventsData);

            try {
                // Parse the JSON data
                const events = JSON.parse(cleanedData);

                if (!Array.isArray(events) || events.length === 0) {
                    console.log('Visit Qatar: No events in parsed data');
                    return this.getMockEvents();
                }

                // Transform to our format
                const transformedEvents = events
                    .map(event => this.transformEvent(event))
                    .filter(event => event !== null);

                console.log(`Visit Qatar: Successfully scraped ${transformedEvents.length} events`);

                if (transformedEvents.length === 0) {
                    return this.getMockEvents();
                }

                return transformedEvents;

            } catch (parseError) {
                console.error('Visit Qatar: Error parsing JSON:', parseError.message);
                return this.getMockEvents();
            }

        } catch (error) {
            console.error('Visit Qatar scraping error:', error.message);
            return this.getMockEvents();
        }
    }

    /**
     * Clean raw data string (remove HTML entities)
     */
    cleanRawData(rawData) {
        // Remove surrounding quotes if present
        if (rawData.startsWith("'") && rawData.endsWith("'")) {
            rawData = rawData.slice(1, -1);
        }
        if (rawData.startsWith('"') && rawData.endsWith('"')) {
            rawData = rawData.slice(1, -1);
        }

        // Replace HTML entities
        const replacements = {
            '&#34;': '"',
            '&quot;': '"',
            '&amp;': '&',
            '&nbsp;': ' ',
            '&lt;': '<',
            '&gt;': '>',
            '&#39;': "'",
            '&apos;': "'",
            '\n': '',
            '\r': '',
            '\t': ''
        };

        for (const [old, newVal] of Object.entries(replacements)) {
            rawData = rawData.split(old).join(newVal);
        }

        return rawData;
    }

    /**
     * Transform raw event data to our format
     */
    transformEvent(rawEvent) {
        try {
            // Extract dates
            const startDate = rawEvent.startDate || {};
            const endDate = rawEvent.endDate || {};

            const startDateStr = `${startDate.day || '?'} ${startDate.monthAndYear || '?'}`;
            const endDateStr = `${endDate.day || '?'} ${endDate.monthAndYear || '?'}`;

            // Parse to ISO date
            const isoDate = this.parseDate(startDateStr);

            // Extract time
            const timeInfo = rawEvent.time || {};
            let timeStr = '';
            if (typeof timeInfo === 'object' && timeInfo.formatted12Hour) {
                timeStr = timeInfo.formatted12Hour;
            } else if (typeof timeInfo === 'string') {
                timeStr = timeInfo;
            }

            // Extract categories
            const categories = rawEvent.category || [];
            const categoryStr = Array.isArray(categories) ? categories.join(', ') : 'Events';

            // Extract location
            let location = 'Qatar';
            if (rawEvent.location) {
                if (typeof rawEvent.location === 'object' && rawEvent.location.name) {
                    location = rawEvent.location.name;
                } else if (typeof rawEvent.location === 'string') {
                    location = rawEvent.location;
                }
            }

            // Extract description and clean HTML tags
            let description = rawEvent.description || '';
            description = description
                .replace(/<[^>]*>/g, '') // Remove HTML tags
                .replace(/&nbsp;/g, ' ')
                .trim();

            // Extract link
            let link = this.eventsUrl;
            if (rawEvent.linkToDetailPage) {
                if (typeof rawEvent.linkToDetailPage === 'object' && rawEvent.linkToDetailPage.url) {
                    link = rawEvent.linkToDetailPage.url;
                    if (!link.startsWith('http')) {
                        link = `${this.baseUrl}${link}`;
                    }
                } else if (typeof rawEvent.linkToDetailPage === 'string') {
                    link = rawEvent.linkToDetailPage;
                }
            }

            // Extract image
            let image = '';
            if (rawEvent.image) {
                image = typeof rawEvent.image === 'string' ? rawEvent.image : '';
                if (image && !image.startsWith('http')) {
                    image = `${this.baseUrl}${image}`;
                }
            }

            // Determine price
            const price = rawEvent.free === true ? 'Free' : 'Check website';

            return {
                id: rawEvent.id || link,
                title: rawEvent.title || 'No Title',
                description: description || 'Click to view more details about this event.',
                date: isoDate,
                time: timeStr,
                price: price,
                category: categoryStr || 'Events',
                image: image || 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800',
                link: link,
                venue: location,
                organizer: 'Visit Qatar'
            };
        } catch (error) {
            console.error('Error transforming event:', error.message);
            return null;
        }
    }

    /**
     * Parse date string to ISO format
     */
    parseDate(dateStr) {
        if (!dateStr || dateStr.includes('?')) {
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
                title: 'Desert Safari Adventure',
                description: 'Experience the beauty of the Qatari desert with dune bashing, camel rides, and traditional Bedouin dinner.',
                date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
                time: '3:00 PM',
                price: 'QAR 250',
                category: 'Adventure',
                image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800',
                link: 'https://www.visitqatar.com/events/desert-safari',
                venue: 'Inland Sea',
                organizer: 'Visit Qatar'
            },
            {
                id: 2,
                title: 'Souq Waqif Walking Tour',
                description: 'Guided tour through the historic Souq Waqif, exploring traditional markets and local culture.',
                date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                time: '4:00 PM',
                price: 'Free',
                category: 'Cultural',
                image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800',
                link: 'https://www.visitqatar.com/events/souq-tour',
                venue: 'Souq Waqif',
                organizer: 'Visit Qatar'
            },
            {
                id: 3,
                title: 'Dhow Cruise Dinner',
                description: 'Enjoy a luxurious dinner cruise on a traditional dhow boat along Doha Bay.',
                date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                time: '7:00 PM',
                price: 'QAR 180',
                category: 'Dining',
                image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
                link: 'https://www.visitqatar.com/events/dhow-cruise',
                venue: 'Doha Bay',
                organizer: 'Visit Qatar'
            },
            {
                id: 4,
                title: 'Museum of Islamic Art Tour',
                description: "Explore one of the world's finest collections of Islamic art spanning 1,400 years.",
                date: new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString(),
                time: '11:00 AM',
                price: 'Free',
                category: 'Art & Culture',
                image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800',
                link: 'https://www.visitqatar.com/events/mia-tour',
                venue: 'Museum of Islamic Art',
                organizer: 'Visit Qatar'
            },
            {
                id: 5,
                title: 'Katara Beach Festival',
                description: 'Beach sports, water activities, and live entertainment at Katara Cultural Village.',
                date: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
                time: '10:00 AM',
                price: 'Free',
                category: 'Sports',
                image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
                link: 'https://www.visitqatar.com/events/beach-festival',
                venue: 'Katara Beach',
                organizer: 'Visit Qatar'
            }
        ];
    }
}

module.exports = new VisitQatarScraper();
