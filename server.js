const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const serverless = require('serverless-http'); // You'll need to install this
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// IMPORTANT: Disable buffering completely in serverless
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 30000);

// Global connection cache for Lambda
let cachedDb = null;

const connectDB = async () => {
    // If already connected, reuse connection
    if (cachedDb && mongoose.connection.readyState === 1) {
        console.log('✅ Using cached MongoDB connection');
        return cachedDb;
    }

    // Close any existing connection
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }

    try {
        console.log('🔄 Connecting to MongoDB Atlas...');
        
        // Connect with Lambda-optimized settings
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 60000,
            connectTimeoutMS: 10000,
            maxPoolSize: 1, // Lambda only needs 1 connection
            minPoolSize: 0,
            maxIdleTimeMS: 60000,
            waitQueueTimeoutMS: 5000,
            bufferCommands: false, // Critical for Lambda
            bufferMaxEntries: 0,
        });
        
        cachedDb = conn;
        console.log('✅ Connected to MongoDB Atlas');
        return cachedDb;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        cachedDb = null;
        throw error;
    }
};

// Import models
const Project = require('./models/Project');

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        await connectDB();
        res.json({
            status: 'ok',
            database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Get projects endpoint - with connection handling
app.get('/api/json/projects', async (req, res) => {
    try {
        // Ensure database is connected before query
        await connectDB();
        
        console.log('🔍 Fetching projects...');
        
        const projects = await Project.find()
            .sort({ createdAt: -1 })
            .lean()
            .maxTimeMS(30000); // Query timeout
        
        console.log(`✅ Found ${projects.length} projects`);
        res.json(projects);
        
    } catch (error) {
        console.error('❌ Error fetching projects:', error);
        
        // Check for specific error types
        if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
            return res.status(503).json({
                error: 'Database connection timeout',
                message: 'Please try again in a few seconds',
                retry: true
            });
        }
        
        res.status(500).json({
            error: 'Failed to fetch projects',
            message: error.message
        });
    }
});

// Get single project endpoint
app.get('/api/json/projects/:id', async (req, res) => {
    try {
        await connectDB();
        
        const project = await Project.findById(req.params.id).lean();
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        res.json(project);
    } catch (error) {
        console.error('❌ Error fetching project:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Export for serverless
exports.handler = serverless(app);
