/**
 * Database Configuration
 * Handles MongoDB connection and lifecycle
 */

const mongoose = require('mongoose');

class Database {
    constructor() {
        this.connection = null;
        this.isConnected = false;
    }

    /**
     * Connect to MongoDB
     */
    async connect() {
        if (this.isConnected) {
            console.log('Database already connected');
            return this.connection;
        }

        try {
            const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/qatar-events';
            
            console.log('Connecting to MongoDB...');
            
            // Connection options
            const options = {
                serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
                socketTimeoutMS: 45000,
            };

            await mongoose.connect(mongoUri, options);
            
            this.connection = mongoose.connection;
            this.isConnected = true;

            // Connection event handlers
            this.connection.on('connected', () => {
                console.log('✓ MongoDB connected successfully');
            });

            this.connection.on('error', (err) => {
                console.error('MongoDB connection error:', err);
                this.isConnected = false;
            });

            this.connection.on('disconnected', () => {
                console.log('MongoDB disconnected');
                this.isConnected = false;
            });

            return this.connection;
        } catch (error) {
            console.error('Failed to connect to MongoDB:', error.message);
            this.isConnected = false;
            
            // Don't throw error - allow app to run without database
            // Events will be stored in memory only
            console.log('⚠ Running without database - events will not persist');
            return null;
        }
    }

    /**
     * Disconnect from MongoDB
     */
    async disconnect() {
        if (!this.isConnected) {
            return;
        }

        try {
            await mongoose.disconnect();
            this.isConnected = false;
            console.log('MongoDB disconnected gracefully');
        } catch (error) {
            console.error('Error disconnecting from MongoDB:', error);
        }
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            name: mongoose.connection.name
        };
    }

    /**
     * Check if database is healthy
     */
    async healthCheck() {
        if (!this.isConnected) {
            return { healthy: false, message: 'Not connected to database' };
        }

        try {
            // Ping the database
            await mongoose.connection.db.admin().ping();
            return { 
                healthy: true, 
                message: 'Database connection healthy',
                ...this.getStatus()
            };
        } catch (error) {
            return { 
                healthy: false, 
                message: error.message 
            };
        }
    }
}

// Export singleton instance
module.exports = new Database();
