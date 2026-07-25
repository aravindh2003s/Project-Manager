import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, User } from '@prisma/client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_enterprise_key_change_me';

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

export function createSession(userId: string, role: string = 'USER') {
    // Return a JWT instead of a random string in-memory map
    const token = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
    return token;
}

export function destroySession(token: string) {
    // JWTs are stateless. In a real enterprise system, we might add it to a Redis blacklist.
    // For now, client just deletes the token.
}

export function getSessionToken(req: Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.slice('Bearer '.length);
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = getSessionToken(req);
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role: string };
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user) return res.status(401).json({ error: 'User not found' });

        res.locals.user = user;
        res.locals.sessionToken = token;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    }
}

// RBAC Middleware
export function authorize(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = res.locals.user as User;
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
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
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
