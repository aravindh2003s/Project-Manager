import { Router, Request, Response } from 'express';
import multer from 'multer';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { requireAuth, prisma } from '../auth';

const router = Router();
router.use(requireAuth);

// ── Upload directory ─────────────────────────────────
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Store ZIP in memory (max 200 MB)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 200 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/zip' ||
            file.mimetype === 'application/x-zip-compressed' ||
            file.originalname.endsWith('.zip')) {
            cb(null, true);
        } else {
            cb(new Error('Only .zip files are supported'));
        }
    }
});

// ── POST /api/upload ─────────────────────────────────
// Accepts: multipart/form-data with field "project" (zip file)
router.post('/', upload.single('project'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded. Use field name "project".' });
        }

        // Derive a clean folder name from the zip filename
        const baseName = path.basename(req.file.originalname, '.zip')
            .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
            .trim() || 'project';

        // If a project with same name exists, suffix with timestamp
        let projectDir = path.join(UPLOADS_DIR, baseName);
        if (fs.existsSync(projectDir)) {
            projectDir = path.join(UPLOADS_DIR, `${baseName}_${Date.now()}`);
        }
        fs.mkdirSync(projectDir, { recursive: true });

        // Extract ZIP
        const zip = new AdmZip(req.file.buffer);
        const entries = zip.getEntries();

        // Detect top-level wrapper folder (many zippers add one)
        const topFolders = new Set<string>();
        entries.forEach(e => {
            const parts = e.entryName.replace(/\\/g, '/').split('/');
            if (parts.length > 1) topFolders.add(parts[0]);
        });
        const hasWrapper = topFolders.size === 1 && entries.length > 1;
        const wrapperPrefix = hasWrapper ? [...topFolders][0] + '/' : '';

        const IGNORE_PATTERNS = ['node_modules/', '__pycache__/', '.cache/', 'dist/', '.next/', '.git/'];

        let fileCount = 0;
        for (const entry of entries) {
            const normalizedName = entry.entryName.replace(/\\/g, '/');

            // Skip ignored directories
            if (IGNORE_PATTERNS.some(p => normalizedName.includes(p))) continue;

            // Strip wrapper prefix
            const relativePath = wrapperPrefix
                ? normalizedName.startsWith(wrapperPrefix)
                    ? normalizedName.slice(wrapperPrefix.length)
                    : normalizedName
                : normalizedName;

            if (!relativePath || relativePath === '/') continue;

            const destPath = path.join(projectDir, relativePath);

            if (entry.isDirectory) {
                if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
            } else {
                const dirPath = path.dirname(destPath);
                if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
                fs.writeFileSync(destPath, entry.getData());
                fileCount++;
            }
        }

        const projectName = path.basename(projectDir);

        // CREATE KANBAN PROJECT IN DATABASE
        const user = res.locals.user;
        if (user) {
            // Find or create a default workspace for the user
            let workspace = await prisma.workspace.findFirst({
                where: { ownerId: user.id }
            });
            
            if (!workspace) {
                workspace = await prisma.workspace.create({
                    data: {
                        name: 'Personal Projects',
                        ownerId: user.id,
                        members: { create: { userId: user.id, role: 'ADMIN' } }
                    }
                });
            }
            
            // Create the new Kanban project to show up on the Dashboard
            await prisma.project.create({
                data: {
                    name: projectName,
                    description: 'Imported from ZIP upload',
                    workspaceId: workspace.id,
                    columns: {
                        create: [
                            { name: 'To Do', order: 0 },
                            { name: 'In Progress', order: 1 },
                            { name: 'Done', order: 2 }
                        ]
                    }
                }
            });
        }

        res.json({
            success: true,
            name: projectName,
            path: projectName,          // relative path used by /api/git/tree?repo=...
            fileCount,
            size: req.file.size,
            uploadedAt: new Date().toISOString(),
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// ── GET /api/upload/list ─────────────────────────────
// Returns list of all uploaded projects
router.get('/list', (_req: Request, res: Response) => {
    try {
        if (!fs.existsSync(UPLOADS_DIR)) return res.json([]);

        const entries = fs.readdirSync(UPLOADS_DIR, { withFileTypes: true });
        const repos = entries
            .filter(e => e.isDirectory())
            .map(e => {
                const dir = path.join(UPLOADS_DIR, e.name);
                const stats = fs.statSync(dir);
                return {
                    name: e.name,
                    path: e.name,
                    uploadedAt: stats.mtime.toISOString(),
                };
            })
            .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

        res.json(repos);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// ── DELETE /api/upload/:name ─────────────────────────
router.delete('/:name', (req: Request, res: Response) => {
    try {
        const name = (req.params.name as string).replace(/\.\./g, ''); // prevent traversal
        const dir = path.join(UPLOADS_DIR, name);
        if (!dir.startsWith(UPLOADS_DIR)) return res.status(403).json({ error: 'Access denied' });
        if (!fs.existsSync(dir)) return res.status(404).json({ error: 'Not found' });

        fs.rmSync(dir, { recursive: true, force: true });
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
