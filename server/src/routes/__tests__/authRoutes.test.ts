import request from 'supertest';
import { app } from '../../index';

jest.mock('../../auth', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        workspace: {
            create: jest.fn(),
        }
    },
    hashPassword: jest.fn(() => 'hashed'),
    verifyPassword: jest.fn(() => true),
    createSession: jest.fn(() => 'mock-token'),
    serializeUser: jest.fn((user) => user),
    requireAuth: jest.fn((req, res, next) => next()),
}));

import { prisma } from '../../auth';

describe('Auth API Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.user.create as jest.Mock).mockResolvedValue({
                id: '1',
                email: 'test@example.com',
                name: 'Test User',
                password: 'hashed'
            });
            (prisma.workspace.create as jest.Mock).mockResolvedValue({ id: '1' });

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    name: 'Test User'
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe('test@example.com');
        });

        it('should return error if user already exists', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1', email: 'test@example.com' });

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    name: 'Test User'
                });

            expect(res.status).toBe(409);
            expect(res.body).toHaveProperty('error', 'An account with this email already exists');
        });
    });
});
