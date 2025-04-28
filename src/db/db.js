const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const DB_URI = process.env.MONGO_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(DB_URI, {
            dbName: 'debugiz'
        });
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection failed', err);
    }
};

module.exports = connectDB;