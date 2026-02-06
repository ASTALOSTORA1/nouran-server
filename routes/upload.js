const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadImage } = require('../controllers/uploadController');
const { auth } = require('../middleware/auth');

// تكوين multer لتخزين الذاكرة المؤقتة
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        // قبول الصور فقط
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('ليس صورة! يرجى رفع ملف صورة فقط.'), false);
        }
    }
});

// رفع صورة واحدة
router.post('/', auth, upload.single('image'), uploadImage);

module.exports = router;