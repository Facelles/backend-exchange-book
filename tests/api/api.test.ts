import request from 'supertest';
import app from '../../src/app';
import sequelize from '../../src/config/database';
import { User, Book, ExchangeRequest } from '../../src/models';
import { Op } from 'sequelize';

beforeEach(async () => {
  // Clean up only test users before each test, which will cascade delete their books and requests
  await User.destroy({ where: { email: { [Op.like]: '%@test.com' } } });
});

afterAll(async () => {
  await sequelize.close();
});

const registerUser = async (
  email = 'user@test.com',
  password = 'password123',
  role: 'USER' | 'ADMIN' = 'USER'
) => {
  const res = await request(app)
    .post('/api/register')
    .send({ email, password, role });
  return { token: res.body.token as string, userId: res.body.user.id as number };
};

describe('POST /api/register', () => {
  it('creates a user and returns 201 with a JWT token', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ email: 'new@test.com', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
    expect(res.body.user).toMatchObject({ email: 'new@test.com', role: 'USER' });
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.password).toBeUndefined();
  });
});

describe('POST /api/login', () => {
  it('returns 401 when password is incorrect', async () => {
    await registerUser('login@test.com', 'correct-password');

    const res = await request(app)
      .post('/api/login')
      .send({ email: 'login@test.com', password: 'WRONG-password' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });
});

describe('GET /api/books', () => {
  it('returns paginated books and filters by name via ILIKE search', async () => {
    const { token } = await registerUser();

    await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Harry Potter', author: 'J.K. Rowling' });

    await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dune', author: 'Frank Herbert' });

    const res = await request(app)
      .get('/api/books')
      .query({ search: 'harry', limit: 10, offset: 0 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('data');
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].name).toBe('Harry Potter');
  });
});

describe('POST /api/books (protected)', () => {
  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app)
      .post('/api/books')
      .send({ name: 'Ghost Book', author: 'No One' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });
});

describe('DELETE /api/books/:id (ownership)', () => {
  it('returns 204 for the owner and 403 for another user', async () => {
    const { token: ownerToken } = await registerUser('owner@test.com', 'pass1');
    const { token: strangerToken } = await registerUser('stranger@test.com', 'pass2');

    const createRes = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'My Private Book', author: 'Owner' });

    const bookId: number = createRes.body.id;

    const forbiddenRes = await request(app)
      .delete(`/api/books/${bookId}`)
      .set('Authorization', `Bearer ${strangerToken}`);

    expect(forbiddenRes.status).toBe(403);

    const deleteRes = await request(app)
      .delete(`/api/books/${bookId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(deleteRes.status).toBe(204);
  });
});

import * as mailerService from '../../src/services/mailerService';

describe('POST /api/books/:id/exchange', () => {
  let sendEmailSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Mock the mailer to avoid sending real emails during tests
    sendEmailSpy = jest.spyOn(mailerService, 'sendExchangeEmail').mockResolvedValue();
  });

  afterEach(() => {
    sendEmailSpy.mockRestore();
  });

  it('creates an exchange request and sends an email', async () => {
    const { token: ownerToken } = await registerUser('owner@test.com', 'pass1');
    const { token: requesterToken, userId: requesterId } = await registerUser('requester@test.com', 'pass2');

    // Owner creates a book
    const createRes = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Book to exchange', author: 'Author' });
    
    const bookId: number = createRes.body.id;

    // Requester requests the exchange
    const exchangeRes = await request(app)
      .post(`/api/books/${bookId}/exchange`)
      .set('Authorization', `Bearer ${requesterToken}`);

    expect(exchangeRes.status).toBe(200);
    expect(exchangeRes.body.message).toMatch(/Exchange request sent/);
    
    // Verify email was attempted
    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
    
    // Verify it was saved to DB
    const requestsInDb = await ExchangeRequest.findAll({ where: { bookId } });
    expect(requestsInDb.length).toBe(1);
    expect(requestsInDb[0].senderId).toBe(requesterId);
    expect(requestsInDb[0].status).toBe('PENDING');
  });

  it('returns 400 if user tries to exchange their own book', async () => {
    const { token: ownerToken } = await registerUser('owner-self@test.com', 'pass1');

    const createRes = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'My Own Book', author: 'Author' });
    
    const bookId: number = createRes.body.id;

    const exchangeRes = await request(app)
      .post(`/api/books/${bookId}/exchange`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(exchangeRes.status).toBe(400);
    expect(exchangeRes.body.message).toBe('You cannot exchange your own book');
    expect(sendEmailSpy).not.toHaveBeenCalled();
  });
});
