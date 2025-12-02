/**
 * Simple In-Memory Vector Store
 * Stores event embeddings and performs cosine similarity search
 */

class VectorStore {
    constructor() {
        this.vectors = new Map(); // eventId -> { embedding, metadata }
    }

    /**
     * Add or update an event embedding
     */
    addVector(eventId, embedding, metadata) {
        this.vectors.set(eventId, {
            embedding: embedding,
            metadata: metadata
        });
    }

    /**
     * Add multiple vectors at once
     */
    addVectors(events, embeddings) {
        events.forEach((event, index) => {
            this.addVector(
                event.id,
                embeddings[index],
                {
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
            );
        });
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
     * @returns {Array} - Array of {metadata, similarity} objects
     */
    search(queryEmbedding, topK = 5) {
        const results = [];

        for (const [eventId, data] of this.vectors.entries()) {
            const similarity = this.cosineSimilarity(queryEmbedding, data.embedding);
            results.push({
                eventId: eventId,
                metadata: data.metadata,
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
    size() {
        return this.vectors.size;
    }

    /**
     * Clear all vectors
     */
    clear() {
        this.vectors.clear();
    }

    /**
     * Check if store has vectors
     */
    isEmpty() {
        return this.vectors.size === 0;
    }
}

module.exports = VectorStore;
