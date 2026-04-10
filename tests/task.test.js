// Tests: task creation, retrieval, filtering, and authorization enforcement

require('dotenv').config({ path: '.env.test' });
const request = require('supertest');
const app = require('../app');
const { connectTestDB, clearTestDB, disconnectTestDB, getAuthCookie } = require('./helpers/testSetup');

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(disconnectTestDB);

describe('Tasks — Create', () => {
  test('should create a task when authenticated', async () => {
    const cookie = await getAuthCookie('alice');
    const res = await request(app)
      .post('/tasks')
      .set('Cookie', cookie)
      .send({ title: 'Buy groceries', description: 'Milk, eggs' });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/tasks');
  });

  test('should reject task creation without a title', async () => {
    const cookie = await getAuthCookie('alice');
    const res = await request(app)
      .post('/tasks')
      .set('Cookie', cookie)
      .send({ title: '', description: 'No title here' });
    expect(res.statusCode).toBe(400);
    expect(res.text).toContain('Task title is required');
  });

  test('should redirect to login if not authenticated', async () => {
    const res = await request(app).post('/tasks').send({ title: 'Unauthorized task' });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });
});

describe('Tasks — Read', () => {
  test('should show tasks list when authenticated', async () => {
    const cookie = await getAuthCookie('alice');
    const res = await request(app).get('/tasks').set('Cookie', cookie);
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('My Tasks');
  });

  test('should only show current user\'s tasks', async () => {
    // Alice creates a task
    const aliceCookie = await getAuthCookie('alice');
    await request(app).post('/tasks').set('Cookie', aliceCookie)
      .send({ title: "Alice's secret task" });

    // Bob should NOT see Alice's task
    const bobCookie = await getAuthCookie('bob');
    const res = await request(app).get('/tasks').set('Cookie', bobCookie);
    expect(res.statusCode).toBe(200);
    expect(res.text).not.toContain("Alice's secret task");
  });
});

describe('Tasks — Authorization', () => {
  test('should prevent a user from editing another user\'s task', async () => {
    // Alice creates a task
    const aliceCookie = await getAuthCookie('alice');
    const Task = require('../src/models/Task');
    const User = require('../src/models/User');
    const alice = await User.findOne({ username: 'alice' });
    const task = await Task.create({ title: 'Private task', userId: alice._id });

    // Bob tries to edit Alice's task
    const bobCookie = await getAuthCookie('bob');
    const res = await request(app)
      .post(`/tasks/${task._id}`)
      .set('Cookie', bobCookie)
      .send({ title: 'Hijacked!', description: '', status: 'completed' });

    expect(res.statusCode).toBe(404); // Task not found for Bob
  });

  test('should prevent a user from deleting another user\'s task', async () => {
    const aliceCookie = await getAuthCookie('alice');
    const Task = require('../src/models/Task');
    const User = require('../src/models/User');
    const alice = await User.findOne({ username: 'alice' });
    const task = await Task.create({ title: 'Do not delete', userId: alice._id });

    const bobCookie = await getAuthCookie('bob');
    const res = await request(app)
      .post(`/tasks/${task._id}/delete`)
      .set('Cookie', bobCookie);

    expect(res.statusCode).toBe(404);
    // Verify task still exists and is not deleted
    const unchanged = await Task.findById(task._id);
    expect(unchanged.status).toBe('pending');
  });
});

describe('Tasks — Filtering', () => {
  test('should filter and return only completed tasks', async () => {
    const cookie = await getAuthCookie('alice');
    const Task = require('../src/models/Task');
    const User = require('../src/models/User');
    const alice = await User.findOne({ username: 'alice' });

    await Task.create({ title: 'Pending task', status: 'pending', userId: alice._id });
    await Task.create({ title: 'Done task', status: 'completed', userId: alice._id });

    const res = await request(app)
      .get('/tasks?filter=completed')
      .set('Cookie', cookie);

    expect(res.text).toContain('Done task');
    expect(res.text).not.toContain('Pending task');
  });
});