// const axios = require('axios');
// const FormData = require('form-data');

// // @desc    Upload image to ImgBB
// // @route   POST /api/upload
// // @access  Private
// exports.uploadImage = async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'لم يتم توفير صورة'
//             });
//         }

//         const imageFile = req.file;
        
//         // التحقق من حجم الملف (10MB كحد أقصى)
//         if (imageFile.size > 10 * 1024 * 1024) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'حجم الصورة كبير جداً. الحد الأقصى 10MB'
//             });
//         }

//         // تحويل الصورة إلى base64
//         const base64Image = imageFile.buffer.toString('base64');
        
//         // رفع إلى ImgBB باستخدام form-data
//         const formData = new FormData();
//         formData.append('key', process.env.IMGBB_API_KEY);
//         formData.append('image', base64Image);

//         const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
//             headers: formData.getHeaders()
//         });

//         if (response.data.success) {
//             res.json({
//                 success: true,
//                 data: {
//                     url: response.data.data.url,
//                     thumb: response.data.data.thumb.url,
//                     medium: response.data.data.medium.url
//                 }
//             });
//         } else {
//             throw new Error(response.data.error?.message || 'فشل في رفع الصورة');
//         }
//     }
//         catch (error) {
//         console.error('Upload error:', error);
        
//         // في حالة فشل الرفع، يمكن استخدام صورة افتراضية
//         const fallbackUrl = 'https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=400&h=300&fit=crop';
        
//         res.json({
//             success: true,
//             data: {
//                 url: fallbackUrl,
//                 thumb: fallbackUrl,
//                 medium: fallbackUrl,
//                 note: 'تم استخدام صورة افتراضية بسبب مشكلة في الرفع'
//             }
//         });
//     }



// };




// const axios = require('axios');
// const FormData = require('form-data');

// // @desc    Upload image to ImgBB
// // @route   POST /api/upload
// // @access  Private
// exports.uploadImage = async (req, res) => {
//     try {
//         // ✅ التحقق من وجود الصورة
//         if (!req.file) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'لم يتم توفير صورة'
//             });
//         }

//         const imageFile = req.file;

//         // ✅ التحقق من حجم الملف (10MB كحد أقصى)
//         if (imageFile.size > 10 * 1024 * 1024) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'حجم الصورة كبير جداً. الحد الأقصى 10MB'
//             });
//         }

//         // ✅ تحويل الصورة إلى base64
//         const base64Image = imageFile.buffer.toString('base64');

//         // ✅ إعداد FormData للرفع
//         const formData = new FormData();
//         formData.append('key', process.env.IMGBB_API_KEY);
//         formData.append('image', base64Image);

//         // ✅ رفع الصورة إلى ImgBB
//         const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
//             headers: formData.getHeaders()
//         });

//         console.log('ImgBB Response:', response.data); // لتصحيح أي مشكلة مستقبلية

//         if (response.data.success) {
//             const imageData = response.data.data;

//             // ✅ استخدام Optional Chaining لتجنب أي TypeError
//             res.json({
//                 success: true,
//                 data: {
//                     url: imageData.url,
//                     thumb: imageData.thumb?.url || imageData.url,
//                     medium: imageData.medium?.url || imageData.url
//                 }
//             });
//         } else {
//             throw new Error(response.data.error?.message || 'فشل في رفع الصورة');
//         }

//     } catch (error) {
//         // ✅ عرض الخطأ الحقيقي من ImgBB أو Axios
//         console.error('Upload error:', error.response?.data || error.message);

//         return res.status(500).json({
//             success: false,
//             error: error.response?.data || error.message
//         });
//     }
// };






const axios = require('axios');
const FormData = require('form-data');

// @desc    Upload image to ImgBB
// @route   POST /api/upload
// @access  Private
exports.uploadImage = async (req, res) => {
    try {
        // 1. التحقق من وجود الملف
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'لم يتم توفير صورة'
            });
        }

        const imageFile = req.file;

        // 2. التحقق من الحجم (10 ميجا كحد أقصى)
        if (imageFile.size > 10 * 1024 * 1024) {
            return res.status(400).json({
                success: false,
                error: 'حجم الصورة كبير جداً. الحد الأقصى 10 ميجابايت'
            });
        }

        console.log(`Uploading file: ${imageFile.originalname}, size: ${(imageFile.size / 1024 / 1024).toFixed(2)} MB`);

        // 3. إعداد FormData لـ ImgBB (binary مباشرة – أفضل وأسرع)
        const formData = new FormData();
        formData.append('key', process.env.IMGBB_API_KEY);
        formData.append('image', imageFile.buffer, {
            filename: imageFile.originalname,
            contentType: imageFile.mimetype
        });

        // اختياري: إضافة expiration لو عايز الصورة تتمسح بعد وقت (بالثواني)
        // formData.append('expiration', 60 * 60 * 24 * 30); // مثلاً 30 يوم

        // 4. الرفع لـ ImgBB
        const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
            headers: {
                ...formData.getHeaders(),
            },
            // مهم جدًا على Vercel عشان يسمح بحجم كبير
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 60000 // 60 ثانية timeout
        });

        // 5. التحقق من نجاح الرفع
        if (!response.data.success) {
            throw new Error(response.data.error?.message || 'ImgBB رد بفشل بدون success=true');
        }

        const imgData = response.data.data;

        console.log('ImgBB upload successful:', imgData.url);

        // 6. الرد الناجح
        res.status(200).json({
            success: true,
            data: {
                url: imgData.url,
                thumb: imgData.thumb?.url || imgData.url,
                medium: imgData.medium?.url || imgData.url,
                delete_url: imgData.delete_url,      // اختياري – لو عايز تمسح الصورة بعدين
                size: imgData.size,
                expiration: imgData.expiration
            }
        });

    } catch (error) {
        console.error('UPLOAD ERROR DETAILS:');
        console.error('Message:', error.message);
        if (error.response) {
            console.error('ImgBB Response Status:', error.response.status);
            console.error('ImgBB Response Data:', error.response.data);
        } else if (error.request) {
            console.error('No response from ImgBB – request details:', error.request);
        } else {
            console.error('Error before request:', error.stack);
        }

        // رد واضح بالخطأ – بدون placeholder تلقائي
        res.status(500).json({
            success: false,
            error: 'فشل رفع الصورة على ImgBB',
            message: error.message,
            details: error.response?.data || null
        });
    }
};





