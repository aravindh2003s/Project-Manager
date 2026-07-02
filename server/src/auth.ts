import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, User } from '@prisma/client';

const sessions = new Map<string, string>();

export const prisma = new PrismaClient();

export function hashPassword(password: string) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) return false;
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
}

export function createSession(userId: string) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, userId);
    return token;
}

export function destroySession(token: string) {
    sessions.delete(token);
}

export function getSessionToken(req: Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.slice('Bearer '.length);
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = getSessionToken(req);
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const userId = sessions.get(token);
    if (!userId) return res.status(401).json({ error: 'Session expired. Please sign in again.' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    res.locals.user = user;
    res.locals.sessionToken = token;
    next();
}

export function serializeUser(user: User) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        bio: user.bio,
        website: user.website,
        location: user.location,
        theme: user.theme,
        language: user.language,
        emailNotifications: user.emailNotifications,
        pushNotifications: user.pushNotifications,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
