// Handles the MongoDB connection using Mongoose.
// Exported as a function so it can be called after env vars are loaded.

const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1); // Exit process on connection failure
  }
};

module.exports = connectDB;