import { Router } from 'express';
import { createSession, destroySession, getSessionToken, hashPassword, prisma, requireAuth, serializeUser, verifyPassword } from '../auth';

const router = Router();

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        const user = await prisma.user.create({
            data: {
                email,
                password: hashPassword(password),
                name: name?.trim() || email.split('@')[0],
            },
        });

        await prisma.workspace.create({
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

        const token = createSession(user.id);
        res.status(201).json({ token, user: serializeUser(user) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create account' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body as { email?: string; password?: string };
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !verifyPassword(password, user.password)) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = createSession(user.id);
        res.json({ token, user: serializeUser(user) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to sign in' });
    }
});

router.get('/me', requireAuth, async (_req, res) => {
    res.json({ user: serializeUser(res.locals.user) });
});

router.patch('/me', requireAuth, async (req, res) => {
    try {
        const user = res.locals.user;
        const {
            name,
            bio,
            website,
            location,
            theme,
            language,
            emailNotifications,
            pushNotifications,
            twoFactorEnabled,
        } = req.body;

        const updatedUser = await prisma.user.update({
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

        res.json({ user: serializeUser(updatedUser) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

router.post('/logout', requireAuth, async (req, res) => {
    const token = getSessionToken(req);
    if (token) destroySession(token);
    res.json({ success: true });
});

export default router;
