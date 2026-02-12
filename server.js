const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Disable Mongoose buffering to fail fast
mongoose.set('bufferCommands', false);

// MongoDB Atlas Connection
const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false; // Track connection state

const connectDB = async () => {
    if (isConnected) return;
    
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        isConnected = true;
        console.log('✅ Connected to MongoDB Atlas');
        console.log(`📊 Database: ${mongoose.connection.name}`);
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('💡 Make sure:');
        console.log('   1. Your IP is whitelisted in MongoDB Atlas');
        console.log('   2. Database user has correct permissions');
        console.log('   3. Network allows connections');
        
        // Retry connection after 5 seconds
        setTimeout(connectDB, 5000);
        throw err;
    }
};

// Connect to database
connectDB();

// Routes (define after ensuring connection or handle connection state)
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const uploadRoutes = require('./routes/upload');

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/upload', uploadRoutes);

const Project = require('./models/Project');

// Connection status middleware
app.use((req, res, next) => {
    req.dbReady = mongoose.connection.readyState === 1;
    next();
});

// Basic route
app.get('/', (req, res) => {
    res.json({ 
        message: '🎨 Gallery Management API',
        version: '1.0.0',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        endpoints: {
            auth: '/api/auth',
            projects: '/api/projects',
            upload: '/api/upload'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';
    res.json({
        status: 'ok',
        timestamp: new Date(),
        database: dbStatus,
        databaseState: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
        uptime: process.uptime()
    });
});

// Get data - with connection check
app.get('/api/json/projects', async (req, res) => {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
            error: 'Database not ready', 
            state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState]
        });
    }

    try {
        const projects = await Project.find()
            .sort({ createdAt: -1 })
            .lean()
            .maxTimeMS(30000); // Add timeout for the query itself
        
        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ 
            error: 'Failed to fetch projects',
            message: error.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;

// Don't start server until DB connects (optional but recommended)
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📡 API URL: http://localhost:${PORT}`);
            console.log(`🌐 MongoDB: ${mongoose.connection.host || 'Connected'}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer();

// Or start server immediately but handle connection state (alternative)
// app.listen(PORT, () => {
//     console.log(`🚀 Server running on port ${PORT}`);
// });
