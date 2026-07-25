"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.createSession = createSession;
exports.destroySession = destroySession;
exports.getSessionToken = getSessionToken;
exports.requireAuth = requireAuth;
exports.authorize = authorize;
exports.serializeUser = serializeUser;
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_enterprise_key_change_me';
exports.prisma = new client_1.PrismaClient();
function hashPassword(password) {
    const salt = crypto_1.default.randomBytes(16).toString('hex');
    const hash = crypto_1.default.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}
function verifyPassword(password, storedHash) {
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash)
        return false;
    const hash = crypto_1.default.scryptSync(password, salt, 64).toString('hex');
    return crypto_1.default.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
}
function createSession(userId, role = 'USER') {
    // Return a JWT instead of a random string in-memory map
    const token = jsonwebtoken_1.default.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
    return token;
}
function destroySession(token) {
    // JWTs are stateless. In a real enterprise system, we might add it to a Redis blacklist.
    // For now, client just deletes the token.
}
function getSessionToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
        return null;
    return authHeader.slice('Bearer '.length);
}
async function requireAuth(req, res, next) {
    const token = getSessionToken(req);
    if (!token)
        return res.status(401).json({ error: 'Authentication required' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await exports.prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user)
            return res.status(401).json({ error: 'User not found' });
        res.locals.user = user;
        res.locals.sessionToken = token;
        next();
    }
    catch (e) {
        return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    }
}
// RBAC Middleware
function authorize(allowedRoles) {
    return (req, res, next) => {
        const user = res.locals.user;
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
}
function serializeUser(user) {
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
