const axios = require('axios');
const FormData = require('form-data');

// @desc    Upload image to ImgBB
// @route   POST /api/upload
// @access  Private
exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'لم يتم توفير صورة'
            });
        }

        const imageFile = req.file;
        
        // التحقق من حجم الملف (10MB كحد أقصى)
        if (imageFile.size > 10 * 1024 * 1024) {
            return res.status(400).json({
                success: false,
                error: 'حجم الصورة كبير جداً. الحد الأقصى 10MB'
            });
        }

        // تحويل الصورة إلى base64
        const base64Image = imageFile.buffer.toString('base64');
        
        // رفع إلى ImgBB باستخدام form-data
        const formData = new FormData();
        formData.append('key', process.env.IMGBB_API_KEY);
        formData.append('image', base64Image);

        const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
            headers: formData.getHeaders()
        });

        if (response.data.success) {
            res.json({
                success: true,
                data: {
                    url: response.data.data.url,
                    thumb: response.data.data.thumb.url,
                    medium: response.data.data.medium.url
                }
            });
        } else {
            throw new Error(response.data.error?.message || 'فشل في رفع الصورة');
        }
    } catch (error) {
        console.error('Upload error:', error);
        
        // في حالة فشل الرفع، يمكن استخدام صورة افتراضية
        const fallbackUrl = 'https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=400&h=300&fit=crop';
    }
};

