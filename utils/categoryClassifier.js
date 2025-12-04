/**
 * AI Category Classifier
 * Uses Gemini AI to improve event categorization
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class CategoryClassifier {
    constructor() {
        // Standard event categories
        this.standardCategories = [
            'Arts & Culture',
            'Music & Concerts',
            'Sports & Fitness',
            'Food & Dining',
            'Family & Kids',
            'Entertainment',
            'Education & Workshops',
            'Business & Networking',
            'Community & Social',
            'Tourism & Travel',
            'Exhibitions',
            'Festivals',
            'Other'
        ];

        // Initialize Gemini AI (will be null if no API key)
        this.genAI = null;
        this.model = null;

        if (process.env.GEMINI_API_KEY) {
            try {
                this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
                console.log('AI Category Classifier: Gemini AI initialized');
            } catch (error) {
                console.log('AI Category Classifier: Failed to initialize Gemini AI:', error.message);
            }
        } else {
            console.log('AI Category Classifier: No GEMINI_API_KEY found, using rule-based classification');
        }
    }

    /**
     * Classify event category using AI or rules
     */
    async classifyCategory(event) {
        const originalCategory = event.category || '';

        // If category looks good already, keep it
        if (this.isGoodCategory(originalCategory)) {
            return originalCategory;
        }

        // Try AI classification if available
        if (this.model) {
            try {
                const aiCategory = await this.classifyWithAI(event);
                if (aiCategory) {
                    return aiCategory;
                }
            } catch (error) {
                console.error('AI classification error:', error.message);
            }
        }

        // Fallback to rule-based classification
        return this.classifyWithRules(event);
    }

    /**
     * Check if category is already good
     */
    isGoodCategory(category) {
        if (!category) return false;

        // Check if it matches our standard categories (case-insensitive)
        const normalized = category.toLowerCase().trim();
        return this.standardCategories.some(std =>
            std.toLowerCase() === normalized ||
            normalized.includes(std.toLowerCase())
        );
    }

    /**
     * Classify using Gemini AI
     */
    async classifyWithAI(event) {
        try {
            const prompt = `You are an event categorization expert. Given an event, classify it into ONE of these categories:
${this.standardCategories.join(', ')}

Event Details:
Title: ${event.title}
Description: ${event.description || 'N/A'}
Original Category: ${event.category || 'N/A'}
Venue: ${event.venue || 'N/A'}
Organizer: ${event.organizer || 'N/A'}

Return ONLY the category name, nothing else. Choose the most appropriate single category.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const category = response.text().trim();

            // Validate that the response is one of our standard categories
            const matchedCategory = this.standardCategories.find(std =>
                category.toLowerCase().includes(std.toLowerCase()) ||
                std.toLowerCase().includes(category.toLowerCase())
            );

            return matchedCategory || null;
        } catch (error) {
            console.error('Gemini AI classification error:', error.message);
            return null;
        }
    }

    /**
     * Classify using rule-based approach (fallback)
     */
    classifyWithRules(event) {
        const text = `${event.title} ${event.description} ${event.category}`.toLowerCase();

        // Rule-based classification
        if (text.match(/concert|music|jazz|orchestra|performance|singer/i)) {
            return 'Music & Concerts';
        }
        if (text.match(/art|exhibition|gallery|museum|painting|sculpture/i)) {
            return 'Arts & Culture';
        }
        if (text.match(/sport|fitness|run|marathon|football|basketball|yoga/i)) {
            return 'Sports & Fitness';
        }
        if (text.match(/food|dining|restaurant|cuisine|chef|cooking/i)) {
            return 'Food & Dining';
        }
        if (text.match(/kids|children|family|playground/i)) {
            return 'Family & Kids';
        }
        if (text.match(/workshop|training|seminar|course|education|learn/i)) {
            return 'Education & Workshops';
        }
        if (text.match(/business|networking|conference|summit/i)) {
            return 'Business & Networking';
        }
        if (text.match(/festival|celebration|carnival/i)) {
            return 'Festivals';
        }
        if (text.match(/tour|travel|desert|safari|cruise/i)) {
            return 'Tourism & Travel';
        }
        if (text.match(/comedy|theater|show|entertainment/i)) {
            return 'Entertainment';
        }
        if (text.match(/community|volunteer|charity|social/i)) {
            return 'Community & Social';
        }

        // Default category
        return event.category || 'Other';
    }

    /**
     * Batch classify multiple events
     */
    async classifyBatch(events) {
        const results = [];

        for (const event of events) {
            try {
                const category = await this.classifyCategory(event);
                results.push({
                    ...event,
                    category,
                    originalCategory: event.category
                });

                // Small delay to avoid rate limiting
                if (this.model) {
                    await this.delay(100);
                }
            } catch (error) {
                console.error(`Error classifying event ${event.title}:`, error.message);
                results.push(event); // Keep original if classification fails
            }
        }

        return results;
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new CategoryClassifier();
