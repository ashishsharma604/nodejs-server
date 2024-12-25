module.exports = async function connectDB() {
    const mongoose = require('mongoose');
    const dotenv = require('dotenv');

    dotenv.config();

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};