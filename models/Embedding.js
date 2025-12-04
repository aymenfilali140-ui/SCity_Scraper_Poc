/**
 * Embedding Model
 * MongoDB schema for storing vector embeddings for RAG
 */

const mongoose = require('mongoose');

const embeddingSchema = new mongoose.Schema({
    // Reference to the event
    eventId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Vector embedding (768 dimensions for text-embedding-004)
    embedding: {
        type: [Number],
        required: true,
        validate: {
            validator: function(v) {
                return Array.isArray(v) && v.length > 0;
            },
            message: 'Embedding must be a non-empty array of numbers'
        }
    },
    
    // Model used to generate embedding
    model: {
        type: String,
        default: 'text-embedding-004'
    },
    
    // Dimension of the embedding
    dimension: {
        type: Number,
        default: 768
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Index for faster lookups
embeddingSchema.index({ eventId: 1 });

// Static method to find embedding by event ID
embeddingSchema.statics.findByEventId = function(eventId) {
    return this.findOne({ eventId });
};

// Static method to get all embeddings
embeddingSchema.statics.getAllEmbeddings = function() {
    return this.find({}).select('eventId embedding');
};

// Static method to bulk upsert embeddings
embeddingSchema.statics.bulkUpsert = async function(embeddingsData) {
    const bulkOps = embeddingsData.map(data => ({
        updateOne: {
            filter: { eventId: data.eventId },
            update: {
                $set: {
                    embedding: data.embedding,
                    model: data.model || 'text-embedding-004',
                    dimension: data.embedding.length
                }
            },
            upsert: true
        }
    }));
    
    if (bulkOps.length > 0) {
        return this.bulkWrite(bulkOps);
    }
    return null;
};

const Embedding = mongoose.model('Embedding', embeddingSchema);

module.exports = Embedding;
