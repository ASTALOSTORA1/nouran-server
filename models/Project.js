const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    imageUrl: {
        type: String,
        required: [true, 'Image URL is required']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update updatedAt on save
projectSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// الخطأ كان هنا: يجب أن يكون projectSchema وليس projectModel
module.exports = mongoose.model('Project', projectSchema);