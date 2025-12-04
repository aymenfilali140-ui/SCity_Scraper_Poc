/**
 * RAG Chatbot
 * Uses Gemini API for embeddings and chat responses
 * Implements Retrieval-Augmented Generation pipeline with MongoDB persistence
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const VectorStore = require('./vectorStore');

class Chatbot {
    constructor(apiKey) {
        this.vectorStore = new VectorStore();
        this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
        this.embeddingModel = this.genAI ? this.genAI.getGenerativeModel({ model: 'text-embedding-004' }) : null;
        this.chatModel = this.genAI ? this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' }) : null;
        this.hasApiKey = !!apiKey;
        this.isInitialized = false;
    }

    /**
     * Initialize chatbot with database
     */
    async initialize(database) {
        await this.vectorStore.initialize(database);
        this.isInitialized = true;
        console.log('Chatbot: Initialized with database support');
    }

    /**
     * Generate embedding for text
     */
    async generateEmbedding(text) {
        if (!this.hasApiKey) {
            throw new Error('Gemini API key not configured');
        }

        try {
            const result = await this.embeddingModel.embedContent(text);
            return result.embedding.values;
        } catch (error) {
            console.error('Error generating embedding:', error.message);
            throw error;
        }
    }

    /**
     * Index events in vector store (smart indexing - only new events)
     */
    async indexEvents(events) {
        if (!this.hasApiKey) {
            console.log('Chatbot: No API key, skipping event indexing');
            return;
        }

        if (!this.isInitialized) {
            console.log('Chatbot: Not initialized, skipping indexing');
            return;
        }

        console.log(`Chatbot: Checking ${events.length} events for indexing...`);

        try {
            // Filter out events that already have embeddings
            const eventsToIndex = [];
            for (const event of events) {
                const hasEmbedding = await this.vectorStore.hasEmbedding(event.id);
                if (!hasEmbedding) {
                    eventsToIndex.push(event);
                }
            }

            if (eventsToIndex.length === 0) {
                console.log('Chatbot: All events already indexed, skipping');
                return;
            }

            console.log(`Chatbot: Indexing ${eventsToIndex.length} new events...`);

            // Generate embeddings for new events
            const embeddings = [];
            for (const event of eventsToIndex) {
                // Create searchable text from event
                const searchableText = this.createSearchableText(event);
                const embedding = await this.generateEmbedding(searchableText);
                embeddings.push(embedding);
            }

            // Add to vector store (will save to database)
            await this.vectorStore.addVectors(eventsToIndex, embeddings);
            console.log(`Chatbot: Successfully indexed ${eventsToIndex.length} new events`);
        } catch (error) {
            console.error('Error indexing events:', error.message);
        }
    }

    /**
     * Create searchable text from event
     */
    createSearchableText(event) {
        const parts = [
            event.title,
            event.description,
            event.category,
            event.venue,
            event.dateDisplay || new Date(event.date).toLocaleDateString(),
            event.price
        ].filter(Boolean);

        return parts.join(' ');
    }

    /**
     * Chat with RAG pipeline
     */
    async chat(userQuery, allEvents = []) {
        if (!this.hasApiKey) {
            return {
                response: "I'm sorry, but the chatbot is not configured. Please set up your Gemini API key to enable chat functionality.",
                events: []
            };
        }

        const isEmpty = await this.vectorStore.isEmpty();
        if (isEmpty) {
            return {
                response: "I don't have any events indexed yet. Please wait for the events to load.",
                events: []
            };
        }

        try {
            // Step 1: Generate query embedding
            const queryEmbedding = await this.generateEmbedding(userQuery);

            // Step 2: Retrieve similar events (pass full event metadata)
            const results = await this.vectorStore.search(queryEmbedding, 5, allEvents);

            // Step 3: Build context from retrieved events
            const context = this.buildContext(results);

            // Step 4: Generate response using Gemini
            const prompt = this.buildPrompt(userQuery, context);
            const result = await this.chatModel.generateContent(prompt);
            const response = result.response.text();

            // Return response with relevant events
            return {
                response: response,
                events: results.map(r => r.metadata)
            };
        } catch (error) {
            console.error('Chat error:', error.message);
            return {
                response: "I'm sorry, I encountered an error processing your request. Please try again.",
                events: []
            };
        }
    }

    /**
     * Build context from retrieved events
     */
    buildContext(results) {
        return results.map((result, index) => {
            const event = result.metadata;
            return `Event ${index + 1}:
Title: ${event.title}
Date: ${event.dateDisplay || new Date(event.date).toLocaleDateString()}
Category: ${event.category}
Venue: ${event.venue}
Price: ${event.price}
Description: ${event.description}
`;
        }).join('\n');
    }

    /**
     * Build prompt for Gemini
     */
    buildPrompt(userQuery, context) {
        return `You are a helpful assistant for the Qatar Events Aggregator. Your role is to help users find and learn about events in Qatar.

Here are the most relevant events based on the user's query:

${context}

User Query: ${userQuery}

Please provide a helpful, conversational response. If the user is asking about specific events, reference them by name. If they're looking for recommendations, suggest the most relevant events from the list above. Keep your response concise and friendly.`;
    }

    /**
     * Get vector store stats
     */
    async getStats() {
        const totalEvents = await this.vectorStore.size();
        return {
            totalEvents,
            hasApiKey: this.hasApiKey,
            isInitialized: this.isInitialized
        };
    }
}

module.exports = Chatbot;
