// Tests: user registration, login, duplicate usernames, bad credentials

require('dotenv').config({ path: '.env.test' });
const request = require('supertest');
const app = require('../app');
const { connectTestDB, clearTestDB, disconnectTestDB } = require('./helpers/testSetup');

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(disconnectTestDB);

describe('Auth — Signup', () => {
  test('should create a new user and redirect to /tasks', async () => {
    const res = await request(app).post('/auth/signup').send({
      username: 'alice',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/tasks');
    // JWT cookie should be set
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('should reject signup with mismatched passwords', async () => {
    const res = await request(app).post('/auth/signup').send({
      username: 'alice',
      password: 'password123',
      confirmPassword: 'different',
    });
    expect(res.statusCode).toBe(400);
    expect(res.text).toContain('Passwords do not match');
  });

  test('should reject duplicate usernames', async () => {
    await request(app).post('/auth/signup').send({
      username: 'alice', password: 'password123', confirmPassword: 'password123',
    });
    const res = await request(app).post('/auth/signup').send({
      username: 'alice', password: 'different123', confirmPassword: 'different123',
    });
    expect(res.statusCode).toBe(400);
    expect(res.text).toContain('already taken');
  });

  test('should reject usernames shorter than 3 characters', async () => {
    const res = await request(app).post('/auth/signup').send({
      username: 'ab', password: 'password123', confirmPassword: 'password123',
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('Auth — Login', () => {
  beforeEach(async () => {
    // Register a user before each login test
    await request(app).post('/auth/signup').send({
      username: 'alice', password: 'password123', confirmPassword: 'password123',
    });
  });

  test('should login with correct credentials and set cookie', async () => {
    const res = await request(app).post('/auth/login').send({
      username: 'alice', password: 'password123',
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/tasks');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('should reject incorrect password', async () => {
    const res = await request(app).post('/auth/login').send({
      username: 'alice', password: 'wrongpassword',
    });
    expect(res.statusCode).toBe(401);
    expect(res.text).toContain('Invalid username or password');
  });

  test('should reject non-existent username', async () => {
    const res = await request(app).post('/auth/login').send({
      username: 'nobody', password: 'password123',
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('Auth — Logout', () => {
  test('should clear the cookie on logout', async () => {
    const { getAuthCookie } = require('./helpers/testSetup');
    const cookie = await getAuthCookie('alice');
    const res = await request(app).post('/auth/logout').set('Cookie', cookie);
    expect(res.statusCode).toBe(302);
    // The cookie should be cleared (max-age=0 or expires in past)
    expect(res.headers['set-cookie'][0]).toContain('token=;');
  });
});