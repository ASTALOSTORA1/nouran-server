const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const uploadRoutes = require('./routes/upload');

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/upload', uploadRoutes);


const Project = require('./models/Project');


// MongoDB Atlas Connection
const MONGODB_URI = process.env.MONGODB_URI ;

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
.then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    console.log(`📊 Database: ${mongoose.connection.name}`);
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('💡 Make sure:');
    console.log('   1. Your IP is whitelisted in MongoDB Atlas');
    console.log('   2. Database user has correct permissions');
    console.log('   3. Network allows connections');
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
        uptime: process.uptime()
    });
});

// get data 
app.get('/api/json/projects', async (req, res) => {
    try {
        const projects = await Project.find()
            .sort({ createdAt: -1 })
            .lean();
        
        // Returns pure JSON array
        res.json(projects);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
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
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API URL: http://localhost:${PORT}`);
    console.log(`🌐 MongoDB: ${mongoose.connection.host || 'Connecting...'}`);
});