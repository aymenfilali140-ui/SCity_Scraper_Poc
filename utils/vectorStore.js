/**
 * Vector Store with MongoDB Persistence
 * Stores event embeddings and performs cosine similarity search
 */

const Embedding = require('../models/Embedding');

class VectorStore {
    constructor() {
        this.inMemoryVectors = new Map(); // Fallback for when DB is unavailable
        this.useDatabase = false;
        this.vectorCache = null; // Cache for search operations
        this.cacheTimestamp = null;
    }

    /**
     * Initialize with database support
     */
    async initialize(database) {
        this.database = database;
        this.useDatabase = database && database.isConnected;
        
        if (this.useDatabase) {
            console.log('VectorStore: Using MongoDB for persistence');
            // Load vectors into cache for faster search
            await this.refreshCache();
        } else {
            console.log('VectorStore: Using in-memory storage (no persistence)');
        }
    }

    /**
     * Refresh the vector cache from database
     */
    async refreshCache() {
        if (!this.useDatabase) return;

        try {
            const embeddings = await Embedding.getAllEmbeddings().lean();
            this.vectorCache = new Map();
            
            embeddings.forEach(emb => {
                this.vectorCache.set(emb.eventId, {
                    embedding: emb.embedding,
                    metadata: { eventId: emb.eventId }
                });
            });
            
            this.cacheTimestamp = Date.now();
            console.log(`VectorStore: Cached ${embeddings.length} embeddings`);
        } catch (error) {
            console.error('Error refreshing vector cache:', error.message);
            this.vectorCache = null;
        }
    }

    /**
     * Add or update an event embedding
     */
    async addVector(eventId, embedding, metadata) {
        if (this.useDatabase) {
            try {
                await Embedding.findOneAndUpdate(
                    { eventId },
                    {
                        eventId,
                        embedding,
                        dimension: embedding.length
                    },
                    { upsert: true, new: true }
                );
                
                // Update cache
                if (this.vectorCache) {
                    this.vectorCache.set(eventId, { embedding, metadata });
                }
            } catch (error) {
                console.error('Error saving embedding to database:', error.message);
                // Fallback to in-memory
                this.inMemoryVectors.set(eventId, { embedding, metadata });
            }
        } else {
            this.inMemoryVectors.set(eventId, { embedding, metadata });
        }
    }

    /**
     * Add multiple vectors at once
     */
    async addVectors(events, embeddings) {
        if (this.useDatabase) {
            try {
                const embeddingsData = events.map((event, index) => ({
                    eventId: event.id,
                    embedding: embeddings[index],
                    model: 'text-embedding-004'
                }));

                await Embedding.bulkUpsert(embeddingsData);
                console.log(`VectorStore: Saved ${embeddingsData.length} embeddings to database`);
                
                // Refresh cache after bulk insert
                await this.refreshCache();
            } catch (error) {
                console.error('Error bulk saving embeddings:', error.message);
                // Fallback to in-memory
                events.forEach((event, index) => {
                    this.inMemoryVectors.set(
                        event.id,
                        {
                            embedding: embeddings[index],
                            metadata: {
                                title: event.title,
                                description: event.description,
                                date: event.date,
                                dateDisplay: event.dateDisplay,
                                category: event.category,
                                venue: event.venue,
                                price: event.price,
                                link: event.link,
                                organizer: event.organizer,
                                image: event.image
                            }
                        }
                    );
                });
            }
        } else {
            events.forEach((event, index) => {
                this.inMemoryVectors.set(
                    event.id,
                    {
                        embedding: embeddings[index],
                        metadata: {
                            title: event.title,
                            description: event.description,
                            date: event.date,
                            dateDisplay: event.dateDisplay,
                            category: event.category,
                            venue: event.venue,
                            price: event.price,
                            link: event.link,
                            organizer: event.organizer,
                            image: event.image
                        }
                    }
                );
            });
        }
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    cosineSimilarity(vecA, vecB) {
        if (vecA.length !== vecB.length) {
            throw new Error('Vectors must have the same length');
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);

        if (normA === 0 || normB === 0) {
            return 0;
        }

        return dotProduct / (normA * normB);
    }

    /**
     * Search for similar events
     * @param {Array} queryEmbedding - The query vector
     * @param {number} topK - Number of results to return
     * @param {Array} eventMetadata - Full event metadata for results
     * @returns {Array} - Array of {metadata, similarity} objects
     */
    async search(queryEmbedding, topK = 5, eventMetadata = []) {
        const results = [];
        let vectorSource = null;

        // Determine which vector source to use
        if (this.useDatabase && this.vectorCache) {
            vectorSource = this.vectorCache;
        } else {
            vectorSource = this.inMemoryVectors;
        }

        // Create a map of event metadata for quick lookup
        const metadataMap = new Map();
        eventMetadata.forEach(event => {
            metadataMap.set(event.id, event);
        });

        // Calculate similarity for all vectors
        for (const [eventId, data] of vectorSource.entries()) {
            const similarity = this.cosineSimilarity(queryEmbedding, data.embedding);
            
            // Get full metadata if available
            const fullMetadata = metadataMap.get(eventId) || data.metadata;
            
            results.push({
                eventId: eventId,
                metadata: fullMetadata,
                similarity: similarity
            });
        }

        // Sort by similarity (highest first) and return top K
        results.sort((a, b) => b.similarity - a.similarity);
        return results.slice(0, topK);
    }

    /**
     * Get total number of vectors
     */
    async size() {
        if (this.useDatabase) {
            try {
                return await Embedding.countDocuments();
            } catch (error) {
                console.error('Error counting embeddings:', error.message);
                return this.inMemoryVectors.size;
            }
        }
        return this.inMemoryVectors.size;
    }

    /**
     * Clear all vectors
     */
    async clear() {
        if (this.useDatabase) {
            try {
                await Embedding.deleteMany({});
                console.log('Cleared all embeddings from database');
                this.vectorCache = new Map();
            } catch (error) {
                console.error('Error clearing embeddings from database:', error.message);
            }
        }
        
        this.inMemoryVectors.clear();
    }

    /**
     * Check if store has vectors
     */
    async isEmpty() {
        const count = await this.size();
        return count === 0;
    }

    /**
     * Check if an event already has an embedding
     */
    async hasEmbedding(eventId) {
        if (this.useDatabase) {
            try {
                const embedding = await Embedding.findByEventId(eventId);
                return !!embedding;
            } catch (error) {
                return this.inMemoryVectors.has(eventId);
            }
        }
        return this.inMemoryVectors.has(eventId);
    }
}

module.exports = VectorStore;
