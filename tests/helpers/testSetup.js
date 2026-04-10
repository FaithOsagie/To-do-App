// Shared test setup: connects to a test DB and provides a helper to get an auth cookie.

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../app');

// Connect to the test database before all tests
const connectTestDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/todoapp_test');
  }
};

// Drop all collections after each test file
const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

const disconnectTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};

// Register a user and return the auth cookie for authenticated requests
const getAuthCookie = async (username = 'testuser', password = 'password123') => {
  // Create the user
  await request(app).post('/auth/signup').send({ username, password, confirmPassword: password });
  // Log in and extract the cookie
  const res = await request(app).post('/auth/login').send({ username, password });
  return res.headers['set-cookie'];
};

module.exports = { connectTestDB, clearTestDB, disconnectTestDB, getAuthCookie };