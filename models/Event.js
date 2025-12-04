/**
 * Event Model
 * MongoDB schema for storing event data
 */

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    // Unique identifier (source-based)
    eventId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Basic event information
    title: {
        type: String,
        required: true,
        index: true
    },
    
    description: {
        type: String,
        default: ''
    },
    
    // Date and time
    date: {
        type: Date,
        required: true,
        index: true
    },
    
    endDate: {
        type: Date,
        default: null
    },
    
    time: {
        type: String,
        default: ''
    },
    
    // Event details
    price: {
        type: String,
        default: 'Free'
    },
    
    category: {
        type: String,
        required: true,
        index: true
    },
    
    venue: {
        type: String,
        default: ''
    },
    
    organizer: {
        type: String,
        default: ''
    },
    
    // Media and links
    image: {
        type: String,
        default: ''
    },
    
    link: {
        type: String,
        default: ''
    },
    
    // Source tracking
    source: {
        type: String,
        required: true,
        index: true
    },
    
    // Pre-computed searchable text for RAG
    searchableText: {
        type: String,
        default: ''
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Compound index for efficient date range queries
eventSchema.index({ date: 1, category: 1 });
eventSchema.index({ source: 1, date: 1 });

// Method to generate searchable text
eventSchema.methods.generateSearchableText = function() {
    const parts = [
        this.title,
        this.description,
        this.category,
        this.venue,
        this.price,
        this.organizer
    ].filter(Boolean);
    
    return parts.join(' ');
};

// Pre-save hook to generate searchable text
eventSchema.pre('save', function(next) {
    if (this.isModified('title') || this.isModified('description') || !this.searchableText) {
        this.searchableText = this.generateSearchableText();
    }
    next();
});

// Static method to find events by date range
eventSchema.statics.findByDateRange = function(startDate, endDate) {
    return this.find({
        date: {
            $gte: startDate,
            $lte: endDate
        }
    }).sort({ date: 1 });
};

// Static method to find events by category
eventSchema.statics.findByCategory = function(category) {
    return this.find({ category }).sort({ date: 1 });
};

// Static method to get all unique categories
eventSchema.statics.getCategories = async function() {
    const categories = await this.distinct('category');
    return categories.sort();
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
