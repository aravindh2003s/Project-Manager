"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../auth");
const router = (0, express_1.Router)();
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const existingUser = await auth_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }
        const user = await auth_1.prisma.user.create({
            data: {
                email,
                password: (0, auth_1.hashPassword)(password),
                name: name?.trim() || email.split('@')[0],
            },
        });
        await auth_1.prisma.workspace.create({
            data: {
                name: `${user.name || 'My'} Workspace`,
                ownerId: user.id,
                members: {
                    create: {
                        userId: user.id,
                        role: 'ADMIN',
                    },
                },
            },
        });
        const token = (0, auth_1.createSession)(user.id);
        res.status(201).json({ token, user: (0, auth_1.serializeUser)(user) });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create account' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = await auth_1.prisma.user.findUnique({ where: { email } });
        if (!user || !(0, auth_1.verifyPassword)(password, user.password)) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = (0, auth_1.createSession)(user.id);
        res.json({ token, user: (0, auth_1.serializeUser)(user) });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to sign in' });
    }
});
router.get('/me', auth_1.requireAuth, async (_req, res) => {
    res.json({ user: (0, auth_1.serializeUser)(res.locals.user) });
});
router.patch('/me', auth_1.requireAuth, async (req, res) => {
    try {
        const user = res.locals.user;
        const { name, bio, website, location, theme, language, emailNotifications, pushNotifications, twoFactorEnabled, } = req.body;
        const updatedUser = await auth_1.prisma.user.update({
            where: { id: user.id },
            data: {
                name,
                bio,
                website,
                location,
                theme,
                language,
                emailNotifications,
                pushNotifications,
                twoFactorEnabled,
            },
        });
        res.json({ user: (0, auth_1.serializeUser)(updatedUser) });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});
router.post('/logout', auth_1.requireAuth, async (req, res) => {
    const token = (0, auth_1.getSessionToken)(req);
    if (token)
        (0, auth_1.destroySession)(token);
    res.json({ success: true });
});
exports.default = router;
