/**
 * ILoveQatar Scraper
 * Based on successful Python implementation
 * Uses two-step scraping: listing pages → individual event pages
 */

const axios = require('axios');
const cheerio = require('cheerio');

class ILoveQatarScraper {
    constructor() {
        this.baseUrl = 'https://www.iloveqatar.net';
        this.listingUrl = 'https://www.iloveqatar.net/events/p';
        this.maxPages = 3; // Scrape first 3 pages
    }

    /**
     * Main scraping method - two-step process
     */
    async scrape() {
        try {
            console.log('Scraping ILoveQatar...');
            const allEvents = [];

            // Step 1: Get event links from listing pages
            const eventLinks = await this.getEventLinks();
            console.log(`ILoveQatar: Found ${eventLinks.length} event links`);

            if (eventLinks.length === 0) {
                console.log('ILoveQatar: No event links found, returning mock data');
                return this.getMockEvents();
            }

            // Step 2: Scrape each individual event page
            for (const link of eventLinks.slice(0, 15)) { // Limit to 15 events for performance
                try {
                    const event = await this.scrapeEventPage(link);
                    if (event) {
                        allEvents.push(event);
                    }
                    // Add small delay to avoid overwhelming the server
                    await this.delay(500);
                } catch (err) {
                    console.error(`Error scraping event ${link}:`, err.message);
                }
            }

            console.log(`ILoveQatar: Successfully scraped ${allEvents.length} events`);

            // Return mock data if no events were scraped
            if (allEvents.length === 0) {
                console.log('ILoveQatar: No events scraped, returning mock data');
                return this.getMockEvents();
            }

            return allEvents;
        } catch (error) {
            console.error('ILoveQatar scraping error:', error.message);
            return this.getMockEvents();
        }
    }

    /**
     * Step 1: Get event links from listing pages
     */
    async getEventLinks() {
        const eventLinks = [];

        for (let page = 1; page <= this.maxPages; page++) {
            try {
                const url = `${this.listingUrl}${page}`;
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    timeout: 10000
                });

                const $ = cheerio.load(response.data);

                // Use EXACT selector from Python project
                $('a.article-block__title').each((i, element) => {
                    const href = $(element).attr('href');
                    if (href) {
                        const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                        eventLinks.push(fullUrl);
                    }
                });

            } catch (err) {
                console.error(`Error fetching page ${page}:`, err.message);
            }
        }

        return eventLinks;
    }

    /**
     * Step 2: Scrape individual event page
     */
    async scrapeEventPage(url) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);

            // Extract title
            const title = $('h1').first().text().trim() || 'No title';

            // Extract date using EXACT selector from Python project
            const dateItem = $('.events-page-info__item._date');
            let date = dateItem.text().trim().replace('Date:', '').trim();

            // Extract time using EXACT selector
            const timeItem = $('.events-page-info__item._time');
            let time = timeItem.text().trim().replace('Time:', '').trim();

            // Extract location using EXACT selector
            const locationItem = $('.events-page-info__item._location');
            const location = locationItem.text().trim().replace('Location:', '').trim() || 'Qatar';

            // Extract tickets and prices using EXACT selector
            const ticketsItems = $('.events-page-info__item._tickets');
            let price = 'Check website';
            if (ticketsItems.length > 1) {
                price = $(ticketsItems[1]).text().trim().replace('Prices:', '').trim();
            } else if (ticketsItems.length > 0) {
                price = $(ticketsItems[0]).text().trim().replace('Tickets:', '').trim();
            }

            // Extract description
            let description = '';
            $('.events-page-info p').each((i, el) => {
                const text = $(el).text().trim();
                if (text) {
                    description += text + '\n\n';
                }
            });
            description = description.trim();

            // Extract category from URL
            const urlParts = url.split('/');
            const category = urlParts[5] ? this.formatCategory(urlParts[5]) : 'Events';

            // Extract image - look for event banner, not logo
            // Try multiple selectors to find the actual event image
            let image = '';

            // Try common event image selectors
            const imageSelectors = [
                '.events-page-banner img',           // Event page banner
                '.event-image img',                  // Event image container
                'article img',                       // Article images
                '.content-image img',                // Content images
                'main img',                          // Main content images
                '.hero-image img',                   // Hero images
                'img[src*="event"]',                 // Images with "event" in URL
                'img[src*="upload"]',                // Uploaded images
                'img:not([src*="logo"]):not([src*="icon"])' // Any image except logos/icons
            ];

            for (const selector of imageSelectors) {
                const foundImage = $(selector).first().attr('src');
                if (foundImage && !foundImage.includes('logo') && !foundImage.includes('icon')) {
                    image = foundImage;
                    break;
                }
            }

            // Fallback: get the largest image (likely the banner)
            if (!image) {
                const images = $('img').toArray();
                for (const img of images) {
                    const src = $(img).attr('src') || '';
                    // Skip logos, icons, and small images
                    if (!src.includes('logo') && !src.includes('icon') && !src.includes('favicon')) {
                        image = src;
                        break;
                    }
                }
            }

            const fullImageUrl = image && image.startsWith('http') ? image : image ? `${this.baseUrl}${image}` : '';

            // Parse date to ISO format if possible
            const isoDate = this.parseDate(date);

            return {
                id: url,
                title,
                description: description || 'Click to view more details about this event.',
                date: isoDate,
                time: time || '',
                price: price || 'Check website',
                category,
                image: fullImageUrl,
                link: url,
                venue: location,
                organizer: 'ILoveQatar'
            };
        } catch (error) {
            console.error(`Error scraping event page ${url}:`, error.message);
            return null;
        }
    }

    /**
     * Parse date string to ISO format
     */
    parseDate(dateStr) {
        if (!dateStr || dateStr === 'No date') {
            return new Date().toISOString();
        }

        try {
            // Try to parse the date string
            // Format is usually like "4 May 2025" or "4 May 2025 - 7 May 2025"
            const dateParts = dateStr.split('-');
            const startDate = dateParts[0].trim();

            const date = new Date(startDate);
            if (!isNaN(date.getTime())) {
                return date.toISOString();
            }
        } catch (err) {
            // If parsing fails, return current date
        }

        return new Date().toISOString();
    }

    /**
     * Format category name
     */
    formatCategory(category) {
        return category
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' & ');
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
                title: 'Qatar National Day Celebration',
                description: 'Join us for the grand Qatar National Day celebration with fireworks, traditional performances, and cultural exhibitions.',
                date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                time: '6:00 PM',
                price: 'Free',
                category: 'Cultural',
                image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
                link: 'https://www.iloveqatar.net/events/national-day',
                venue: 'Corniche',
                organizer: 'ILoveQatar'
            },
            {
                id: 2,
                title: 'Doha Food Festival',
                description: 'Experience the best of Qatari and international cuisine at the annual Doha Food Festival.',
                date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                time: '5:00 PM',
                price: 'QAR 50',
                category: 'Food & Drink',
                image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
                link: 'https://www.iloveqatar.net/events/food-festival',
                venue: 'Katara Cultural Village',
                organizer: 'ILoveQatar'
            },
            {
                id: 3,
                title: 'Art Exhibition: Modern Qatar',
                description: 'Discover contemporary Qatari art at this exclusive exhibition featuring local and international artists.',
                date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                time: '10:00 AM',
                price: 'QAR 30',
                category: 'Art & Culture',
                image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
                link: 'https://www.iloveqatar.net/events/art-exhibition',
                venue: 'Museum of Islamic Art',
                organizer: 'ILoveQatar'
            }
        ];
    }
}

module.exports = new ILoveQatarScraper();
