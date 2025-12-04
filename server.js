/**
 * Qatar Events Aggregator Server
 * Aggregates events from multiple Qatar websites
 */

// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');

// Import database
const database = require('./config/database');

// Import scrapers
const iLoveQatarScraper = require('./scrapers/iLoveQatar');
const qatarMuseumsScraper = require('./scrapers/qatarMuseums');
const visitQatarScraper = require('./scrapers/visitQatar');

// Import event aggregator and AI classifier
const eventAggregator = require('./utils/eventAggregator');
const categoryClassifier = require('./utils/categoryClassifier');
const Chatbot = require('./utils/chatbot');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Track scraping status
let isScrapingInProgress = false;
let lastScrapingTime = null;

// Initialize chatbot
const chatbot = new Chatbot(process.env.GEMINI_API_KEY);
let scrapingError = null;

/**
 * Scrape all sources and aggregate events
 */
async function scrapeAllSources() {
    if (isScrapingInProgress) {
        console.log('Scraping already in progress, skipping...');
        return;
    }

    try {
        isScrapingInProgress = true;
        scrapingError = null;
        console.log('Starting event scraping...');

        // Clear previous events
        eventAggregator.clear();

        // Scrape all sources in parallel
        const [iLoveQatarEvents, qatarMuseumsEvents, visitQatarEvents] = await Promise.all([
            iLoveQatarScraper.scrape(),
            qatarMuseumsScraper.scrape(),
            visitQatarScraper.scrape()
        ]);

        console.log('Applying AI category classification...');

        // Apply AI category classification to improve categories
        const [classifiedILQ, classifiedQM, classifiedVQ] = await Promise.all([
            categoryClassifier.classifyBatch(iLoveQatarEvents),
            categoryClassifier.classifyBatch(qatarMuseumsEvents),
            categoryClassifier.classifyBatch(visitQatarEvents)
        ]);

        // Add events to aggregator
        eventAggregator.addEvents(classifiedILQ, 'ILoveQatar');
        eventAggregator.addEvents(classifiedQM, 'Qatar Museums');
        eventAggregator.addEvents(classifiedVQ, 'Visit Qatar');

        lastScrapingTime = new Date();
        console.log('Scraping completed successfully');
        console.log('Stats:', eventAggregator.getStats());

        // Index events for chatbot
        const allEvents = eventAggregator.getAllEvents();
        await chatbot.indexEvents(allEvents);
    } catch (error) {
        console.error('Error during scraping:', error);
        scrapingError = error.message;
    } finally {
        isScrapingInProgress = false;
    }
}

// API Routes

/**
 * GET /api/events
 * Get events with optional filtering
 * Query params:
 *   - range: 'week' | 'month' | 'all' (default: 'all')
 *   - category: filter by category
 */
app.get('/api/events', async (req, res) => {
    try {
        const { range, category } = req.query;
        let events;

        // Filter by date range
        if (range === 'today') {
            events = await eventAggregator.getTodayEvents();
        } else if (range === 'week') {
            events = await eventAggregator.getWeekEvents();
        } else if (range === 'month') {
            events = await eventAggregator.getMonthEvents();
        } else {
            events = await eventAggregator.getAllEvents();
        }

        // Filter by category if specified
        if (category && category !== 'all') {
            events = events.filter(event =>
                event.category.toLowerCase() === category.toLowerCase()
            );
        }

        res.json({
            success: true,
            count: events.length,
            events: events,
            lastUpdate: lastScrapingTime
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/categories
 * Get all available event categories
 */
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await eventAggregator.getCategories();
        res.json({
            success: true,
            categories: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/stats
 * Get aggregator statistics
 */
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await eventAggregator.getStats();
        res.json({
            success: true,
            stats: {
                ...stats,
                lastScrapingTime,
                isScrapingInProgress,
                scrapingError
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/refresh
 * Manually trigger event scraping
 */
app.post('/api/refresh', async (req, res) => {
    try {
        if (isScrapingInProgress) {
            return res.status(429).json({
                success: false,
                error: 'Scraping already in progress'
            });
        }

        // Start scraping in background
        scrapeAllSources();

        res.json({
            success: true,
            message: 'Scraping started'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/health
 * Database and system health check
 */
app.get('/api/health', async (req, res) => {
    try {
        const dbHealth = await database.healthCheck();
        const stats = await eventAggregator.getStats();
        const chatbotStats = await chatbot.getStats();

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            database: dbHealth,
            events: {
                total: stats.totalEvents,
                usingDatabase: stats.usingDatabase
            },
            chatbot: chatbotStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/chat
 * Handle chatbot queries
 */
app.post('/api/chat', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query is required'
            });
        }

        // Get all events for metadata
        const allEvents = await eventAggregator.getAllEvents();

        // Get response from chatbot
        const result = await chatbot.chat(query, allEvents);

        res.json({
            success: true,
            response: result.response,
            events: result.events
        });
    } catch (error) {
        console.error('Chat API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /
 * Serve the frontend
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Schedule automatic scraping every 6 hours
cron.schedule('0 */6 * * *', () => {
    console.log('Running scheduled scraping...');
    scrapeAllSources();
});

/**
 * Initialize application
 */
async function initializeApp() {
    console.log('Initializing Qatar Events Aggregator...');

    // Connect to database
    await database.connect();

    // Initialize event aggregator with database
    await eventAggregator.initialize(database);

    // Initialize chatbot with database
    await chatbot.initialize(database);

    // Initial scraping on server start
    scrapeAllSources();

    console.log('✓ Application initialized successfully');
}

// Start server
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Qatar Events Aggregator running on:`);
    console.log(`- Local:   http://localhost:${PORT}`);

    // Log network IP
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                console.log(`- Network: http://${net.address}:${PORT}`);
            }
        }
    }

    // Initialize application
    await initializeApp();
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await database.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nShutting down gracefully...');
    await database.disconnect();
    process.exit(0);
});
