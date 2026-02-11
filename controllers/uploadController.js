const axios = require('axios');
const FormData = require('form-data');

// @desc    Upload image to ImgBB
// @route   POST /api/upload
// @access  Private
exports.uploadImage = async (req, res) => {
    try {
        // ✅ التحقق من وجود الصورة
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'لم يتم توفير صورة'
            });
        }

        const imageFile = req.file;

        // ✅ التحقق من حجم الملف (5MB كحد أقصى - خليها 5 زي الفرونت)
        if (imageFile.size > 5 * 1024 * 1024) {
            return res.status(400).json({
                success: false,
                error: 'حجم الصورة كبير جداً. الحد الأقصى 5MB'
            });
        }

        // ✅ تحويل الصورة إلى base64
        const base64Image = imageFile.buffer.toString('base64');

        // ✅ إعداد FormData للرفع
        const formData = new FormData();
        formData.append('key', process.env.IMGBB_API_KEY);
        formData.append('image', base64Image);

        // ✅ رفع الصورة إلى ImgBB
        const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
            headers: formData.getHeaders(),
            timeout: 10000 // 10 ثواني كحد أقصى
        });

        console.log('✅ ImgBB Success:', response.data?.data?.url);

        if (response.data?.success) {
            const imageData = response.data.data;

            res.json({
                success: true,
                data: {
                    url: imageData.url,
                    thumb: imageData.thumb?.url || imageData.url,
                    medium: imageData.medium?.url || imageData.url
                }
            });
        } else {
            // ❌ مش بنجح - نرجع error حقيقي
            throw new Error(response.data?.error?.message || 'فشل في رفع الصورة');
        }

    } catch (error) {
        // ✅ عرض الخطأ الحقيقي
        console.error('❌ Upload Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        // ❌ مهم جداً: نرجع status 500 و success false
        // مش بنرجع success true مع صورة افتراضية!
        return res.status(500).json({
            success: false,
            error: error.message || 'فشل في رفع الصورة'
        });
    }
};
