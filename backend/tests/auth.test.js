/**
 * Auth endpoint tests — uses a mocked DB so no real MySQL is required.
 * Run: npm test
 */

const request = require('supertest');

// Mock pool before requiring app so controllers use the mock
jest.mock('../src/config/db', () => ({
  execute: jest.fn(),
}));

const app = require('../app');
const pool = require('../src/config/db');

describe('POST /api/auth/register — validation', () => {
  it('returns 422 when name is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 when email format is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'not-an-email', password: 'password123' });

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 when password is shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'test@example.com', password: 'short' });

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Password must be at least 8 characters');
  });
});

describe('POST /api/auth/login — validation', () => {
  it('returns 422 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' });

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 when user does not exist', async () => {
    pool.execute.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'password123' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
  });
});

describe('GET /api/tasks — protected route', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/tasks');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Authentication token is required');
  });

  it('returns 401 when token is malformed', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', 'Bearer this.is.invalid');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid or expired token');
  });
});
