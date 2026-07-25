"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const adm_zip_1 = __importDefault(require("adm-zip"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const auth_1 = require("../auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// ── Upload directory ─────────────────────────────────
const UPLOADS_DIR = path_1.default.resolve(__dirname, '../../uploads');
if (!fs_1.default.existsSync(UPLOADS_DIR))
    fs_1.default.mkdirSync(UPLOADS_DIR, { recursive: true });
// Store ZIP in memory (max 200 MB)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 200 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/zip' ||
            file.mimetype === 'application/x-zip-compressed' ||
            file.originalname.endsWith('.zip')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only .zip files are supported'));
        }
    }
});
// ── POST /api/upload ─────────────────────────────────
// Accepts: multipart/form-data with field "project" (zip file)
router.post('/', upload.single('project'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded. Use field name "project".' });
        }
        // Derive a clean folder name from the zip filename
        const baseName = path_1.default.basename(req.file.originalname, '.zip')
            .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
            .trim() || 'project';
        // If a project with same name exists, suffix with timestamp
        let projectDir = path_1.default.join(UPLOADS_DIR, baseName);
        if (fs_1.default.existsSync(projectDir)) {
            projectDir = path_1.default.join(UPLOADS_DIR, `${baseName}_${Date.now()}`);
        }
        fs_1.default.mkdirSync(projectDir, { recursive: true });
        // Extract ZIP
        const zip = new adm_zip_1.default(req.file.buffer);
        const entries = zip.getEntries();
        // Detect top-level wrapper folder (many zippers add one)
        const topFolders = new Set();
        entries.forEach(e => {
            const parts = e.entryName.replace(/\\/g, '/').split('/');
            if (parts.length > 1)
                topFolders.add(parts[0]);
        });
        const hasWrapper = topFolders.size === 1 && entries.length > 1;
        const wrapperPrefix = hasWrapper ? [...topFolders][0] + '/' : '';
        const IGNORE_PATTERNS = ['node_modules/', '__pycache__/', '.cache/', 'dist/', '.next/', '.git/'];
        let fileCount = 0;
        for (const entry of entries) {
            const normalizedName = entry.entryName.replace(/\\/g, '/');
            // Skip ignored directories
            if (IGNORE_PATTERNS.some(p => normalizedName.includes(p)))
                continue;
            // Strip wrapper prefix
            const relativePath = wrapperPrefix
                ? normalizedName.startsWith(wrapperPrefix)
                    ? normalizedName.slice(wrapperPrefix.length)
                    : normalizedName
                : normalizedName;
            if (!relativePath || relativePath === '/')
                continue;
            const destPath = path_1.default.join(projectDir, relativePath);
            if (entry.isDirectory) {
                if (!fs_1.default.existsSync(destPath))
                    fs_1.default.mkdirSync(destPath, { recursive: true });
            }
            else {
                const dirPath = path_1.default.dirname(destPath);
                if (!fs_1.default.existsSync(dirPath))
                    fs_1.default.mkdirSync(dirPath, { recursive: true });
                fs_1.default.writeFileSync(destPath, entry.getData());
                fileCount++;
            }
        }
        const projectName = path_1.default.basename(projectDir);
        // CREATE KANBAN PROJECT IN DATABASE
        const user = res.locals.user;
        if (user) {
            // Find or create a default workspace for the user
            let workspace = await auth_1.prisma.workspace.findFirst({
                where: { ownerId: user.id }
            });
            if (!workspace) {
                workspace = await auth_1.prisma.workspace.create({
                    data: {
                        name: 'Personal Projects',
                        ownerId: user.id,
                        members: { create: { userId: user.id, role: 'ADMIN' } }
                    }
                });
            }
            // Create the new Kanban project to show up on the Dashboard
            await auth_1.prisma.project.create({
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
            path: projectName, // relative path used by /api/git/tree?repo=...
            fileCount,
            size: req.file.size,
            uploadedAt: new Date().toISOString(),
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// ── GET /api/upload/list ─────────────────────────────
// Returns list of all uploaded projects
router.get('/list', (_req, res) => {
    try {
        if (!fs_1.default.existsSync(UPLOADS_DIR))
            return res.json([]);
        const entries = fs_1.default.readdirSync(UPLOADS_DIR, { withFileTypes: true });
        const repos = entries
            .filter(e => e.isDirectory())
            .map(e => {
            const dir = path_1.default.join(UPLOADS_DIR, e.name);
            const stats = fs_1.default.statSync(dir);
            return {
                name: e.name,
                path: e.name,
                uploadedAt: stats.mtime.toISOString(),
            };
        })
            .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
        res.json(repos);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// ── DELETE /api/upload/:name ─────────────────────────
router.delete('/:name', (req, res) => {
    try {
        const name = req.params.name.replace(/\.\./g, ''); // prevent traversal
        const dir = path_1.default.join(UPLOADS_DIR, name);
        if (!dir.startsWith(UPLOADS_DIR))
            return res.status(403).json({ error: 'Access denied' });
        if (!fs_1.default.existsSync(dir))
            return res.status(404).json({ error: 'Not found' });
        fs_1.default.rmSync(dir, { recursive: true, force: true });
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
