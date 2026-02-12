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

// Basic route
app.get('/', (req, res) => {
    res.json({ 
        message: '🎨 Gallery Management API',
        version: '1.0.0',
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

// Get all projects as JSON array
app.get('/api/json/projects', async (req, res) => {
    try {
        // Check if database is connected
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ 
                error: 'Database not connected',
                state: mongoose.connection.readyState 
            });
        }

        const projects = await Project.find()
            .sort({ createdAt: -1 })
            .lean();
        
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

// 🔴🔴🔴 IMPORTANT: Connection and Server Startup
const startServer = async () => {
    try {
        // Check if MONGODB_URI exists
        if (!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI is not defined in .env file');
            console.log('💡 Create .env file and add: MONGODB_URI=your_connection_string');
            process.exit(1);
        }

        console.log('🔌 Attempting to connect to MongoDB Atlas...');
        console.log('📌 URI starts with:', process.env.MONGODB_URI.substring(0, 20) + '...');

        // Connect to MongoDB first
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000, // 10 seconds
            socketTimeoutMS: 45000,
            family: 4 // Force IPv4
        });

        console.log('✅ Connected to MongoDB Atlas');
        console.log(`📊 Database: ${mongoose.connection.name}`);
        console.log(`🌐 Host: ${mongoose.connection.host}`);

        // Start server after successful connection
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📡 API URL: http://localhost:${PORT}`);
            console.log(`📊 Database Status: Connected`);
        });

    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.log('\n💡 Troubleshooting Checklist:');
        console.log('   1️⃣ Check if .env file exists');
        console.log('   2️⃣ Verify MONGODB_URI in .env file is correct');
        console.log('   3️⃣ Whitelist your IP in MongoDB Atlas');
        console.log('   4️⃣ Check if database user has correct permissions');
        console.log('   5️⃣ Make sure network allows outbound connections');
        console.log('   6️⃣ Try using IPv4 only (already set)');
        console.log('   7️⃣ Check if MongoDB Atlas cluster is running\n');
        
        console.log('🔧 Attempting to reconnect in 5 seconds...');
        
        // Retry connection after 5 seconds
        setTimeout(() => {
            console.log('🔄 Retrying connection...');
            startServer();
        }, 5000);
    }
};

// Start the server
startServer();

module.exports = app;
