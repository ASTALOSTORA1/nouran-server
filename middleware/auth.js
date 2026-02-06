const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                error: 'Access denied. No token provided.' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid token. User not found.' 
            });
        }

        // Attach user to request
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ 
            success: false, 
            error: 'Invalid or expired token.' 
        });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            error: 'Access denied. Admin only.' 
        });
    }
    next();
};

module.exports = { auth, isAdmin };