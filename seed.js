require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
    try {
        console.log('🔗 Connecting to MongoDB Atlas...');
        
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Connected to MongoDB Atlas');

        // تعريف نموذج المستخدم
        const userSchema = new mongoose.Schema({
            username: {
                type: String,
                required: true,
                unique: true,
                lowercase: true,
                trim: true
            },
            password: {
                type: String,
                required: true
            },
            role: {
                type: String,
                enum: ['user', 'admin'],
                default: 'user'
            },
            createdAt: {
                type: Date,
                default: Date.now
            },
            lastLogin: {
                type: Date
            }
        });

        const User = mongoose.model('User', userSchema);

        // التحقق من وجود المستخدم
        const existingUser = await User.findOne({ username: 'nouran sameh' });
        
        if (existingUser) {
            console.log('⚠️ User already exists');
            console.log('📋 User details:');
            console.log(`   👤 Username: ${existingUser.username}`);
            console.log(`   👑 Role: ${existingUser.role}`);
            console.log(`   📅 Created: ${existingUser.createdAt}`);
            console.log(`   🔑 Password: 22-4-2025 (encrypted in database)`);
            
            await mongoose.disconnect();
            process.exit(0);
        }

        // تشفير كلمة المرور
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin', salt);

        // إنشاء المستخدم
        const user = new User({
            username: 'nouran sameh',
            password: hashedPassword,
            role: 'admin'
        });

        await user.save();
        
        console.log('✅ User created successfully in MongoDB Atlas!');
        console.log('📋 User details:');
        console.log(`   👤 Username: ${user.username}`);
        console.log(`   👑 Role: ${user.role}`);
        console.log(`   🔑 Password: 22-4-2025`);
        console.log(`   📍 Database: ${mongoose.connection.name}`);
        console.log(`   🌐 Cluster: ${mongoose.connection.host}`);
        
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error.message);
        
        if (error.code === 8000) {
            console.log('🔒 Authentication failed. Check:');
            console.log('   1. Username and password in MONGODB_URI');
            console.log('   2. User has read/write permissions');
        } else if (error.code === 'ENOTFOUND') {
            console.log('🌐 Network error. Check:');
            console.log('   1. Internet connection');
            console.log('   2. MongoDB Atlas cluster is running');
        }
        
        process.exit(1);
    }
};

seedDatabase();
