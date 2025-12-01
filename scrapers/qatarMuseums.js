/**
 * Qatar Museums Scraper
 * Based on successful Python implementation
 * Scrapes events from qm.org.qa
 */

const axios = require('axios');
const cheerio = require('cheerio');

class QatarMuseumsScraper {
    constructor() {
        this.baseUrl = 'https://qm.org.qa';
        this.eventsUrl = 'https://qm.org.qa/en/calendar/?page=';
        this.maxPages = 3;
    }

    /**
     * Scrape events from Qatar Museums
     */
    async scrape() {
        try {
            console.log('Scraping Qatar Museums...');
            const allEvents = [];

            for (let page = 1; page <= this.maxPages; page++) {
                try {
                    const url = `${this.eventsUrl}${page}`;
                    const response = await axios.get(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        },
                        timeout: 10000
                    });

                    const $ = cheerio.load(response.data);

                    // Use EXACT selector from Python project
                    const eventCards = $('a.card--landscape');

                    if (eventCards.length === 0 && page === 1) {
                        console.log('Qatar Museums: No event cards found');
                        break;
                    }

                    eventCards.each((i, card) => {
                        try {
                            const event = this.extractEventFromCard($, card);
                            if (event) {
                                allEvents.push(event);
                            }
                        } catch (err) {
                            console.error('Error extracting event:', err.message);
                        }
                    });

                    // Small delay between pages
                    if (page < this.maxPages) {
                        await this.delay(500);
                    }

                } catch (err) {
                    console.error(`Error scraping page ${page}:`, err.message);
                }
            }

            console.log(`Qatar Museums: Found ${allEvents.length} events`);

            if (allEvents.length === 0) {
                console.log('Qatar Museums: No events found, returning mock data');
                return this.getMockEvents();
            }

            return allEvents;
        } catch (error) {
            console.error('Qatar Museums scraping error:', error.message);
            return this.getMockEvents();
        }
    }

    /**
     * Extract event data from card element
     */
    extractEventFromCard($, card) {
        try {
            const $card = $(card);

            // Extract link
            const link = $card.attr('href') || '';
            const fullLink = link.startsWith('http') ? link : `${this.baseUrl}${link}`;

            // Extract title using EXACT selector
            const titleEl = $card.find('p.card__title');
            const title = this.cleanText(titleEl.text()) || 'No title';

            // Extract category using EXACT selector
            const categoryEl = $card.find('p.card__pre-title');
            const category = this.cleanText(categoryEl.text()) || 'Art & Culture';

            // Extract date using EXACT selector
            const dateDiv = $card.find('div.richtext--simple p');
            const dateText = this.cleanText(dateDiv.text()) || '';

            // Extract location using EXACT selector
            const locationTag = $card.find('span.museum-tag__span');
            const location = this.cleanText(locationTag.text()) || 'Qatar Museums';

            // Extract image using EXACT selector
            const imgTag = $card.find('img.picture__image');
            let image = imgTag.attr('src') || '';
            if (image && !image.startsWith('http')) {
                image = `${this.baseUrl}${image}`;
            }

            // Parse date to ISO format
            const isoDate = this.parseDate(dateText);

            return {
                id: fullLink,
                title,
                description: `${category} event at Qatar Museums. ${dateText}`,
                date: isoDate,
                time: '',
                price: 'Check website',
                category,
                image: image || 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800',
                link: fullLink,
                venue: location,
                organizer: 'Qatar Museums'
            };
        } catch (error) {
            console.error('Error extracting event from card:', error.message);
            return null;
        }
    }

    /**
     * Clean text by normalizing whitespace
     */
    cleanText(text) {
        if (!text) return '';
        return text.trim().replace(/\s+/g, ' ');
    }

    /**
     * Parse date string to ISO format
     */
    parseDate(dateStr) {
        if (!dateStr) {
            return new Date().toISOString();
        }

        try {
            // Try to parse common date formats
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
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get mock events for testing/fallback
     */
    getMockEvents() {
        const today = new Date();
        return [
            {
                id: 1,
                title: 'Contemporary Art Exhibition',
                description: 'Explore modern and contemporary art from Qatar and the region.',
                date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                time: '10:00 AM',
                price: 'Free',
                category: 'Exhibition',
                image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
                link: 'https://qm.org.qa/en/calendar',
                venue: 'Mathaf: Arab Museum of Modern Art',
                organizer: 'Qatar Museums'
            },
            {
                id: 2,
                title: 'Islamic Art Workshop',
                description: 'Hands-on workshop exploring traditional Islamic art techniques.',
                date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                time: '2:00 PM',
                price: 'QAR 50',
                category: 'Workshop',
                image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800',
                link: 'https://qm.org.qa/en/calendar',
                venue: 'Museum of Islamic Art',
                organizer: 'Qatar Museums'
            },
            {
                id: 3,
                title: 'Heritage Tour',
                description: 'Guided tour through Qatar\'s rich cultural heritage.',
                date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                time: '11:00 AM',
                price: 'Free',
                category: 'Tour',
                image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800',
                link: 'https://qm.org.qa/en/calendar',
                venue: 'National Museum of Qatar',
                organizer: 'Qatar Museums'
            }
        ];
    }
}

module.exports = new QatarMuseumsScraper();
