"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const isomorphic_git_1 = __importDefault(require("isomorphic-git"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const auth_1 = require("../auth");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// Default: the project itself. Uploaded repos live in UPLOADS_DIR.
const DEFAULT_REPO = path_1.default.resolve(__dirname, '../../../');
const UPLOADS_DIR = path_1.default.resolve(__dirname, '../../uploads');
/** Resolve which repo directory to serve based on optional ?repo= param */
function resolveRepo(repo) {
    if (!repo || repo === '__default__')
        return DEFAULT_REPO;
    const target = path_1.default.join(UPLOADS_DIR, repo.replace(/\.\.+/g, ''));
    if (!target.startsWith(UPLOADS_DIR))
        return DEFAULT_REPO;
    return fs_1.default.existsSync(target) ? target : DEFAULT_REPO;
}
// Helper: check if path is a git repo
async function isGitRepo(dir) {
    try {
        await isomorphic_git_1.default.resolveRef({ fs: fs_1.default, dir, ref: 'HEAD' });
        return true;
    }
    catch {
        return false;
    }
}
// GET /api/git/info — repo metadata
router.get('/info', async (req, res) => {
    try {
        const dir = resolveRepo(req.query.repo);
        const isRepo = await isGitRepo(dir);
        if (!isRepo)
            return res.json({ isRepo: false, name: 'nexus-platform', branch: 'main', commits: 0 });
        const branch = await isomorphic_git_1.default.currentBranch({ fs: fs_1.default, dir }) || 'main';
        const commits = await isomorphic_git_1.default.log({ fs: fs_1.default, dir, depth: 100 });
        const remotes = await isomorphic_git_1.default.listRemotes({ fs: fs_1.default, dir });
        res.json({
            isRepo: true,
            name: path_1.default.basename(dir),
            branch,
            commitCount: commits.length,
            latestCommit: commits[0] ? {
                oid: commits[0].oid.slice(0, 7),
                message: commits[0].commit.message.trim(),
                author: commits[0].commit.author.name,
                timestamp: commits[0].commit.author.timestamp,
            } : null,
            remotes: remotes.map(r => ({ name: r.remote, url: r.url })),
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/git/tree?path= — file tree
router.get('/tree', async (req, res) => {
    try {
        const dir = resolveRepo(req.query.repo);
        const reqPath = req.query.path || '.';
        const fullPath = path_1.default.resolve(dir, reqPath);
        // Security: ensure path stays within repo root
        if (!fullPath.startsWith(dir)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const entries = await fs_1.default.promises.readdir(fullPath, { withFileTypes: true });
        const IGNORE = new Set(['.git', 'node_modules', 'dist', '.cache', '__pycache__', '.next']);
        const items = entries
            .filter(e => !IGNORE.has(e.name) && !e.name.startsWith('.env'))
            .map(e => ({
            name: e.name,
            type: e.isDirectory() ? 'directory' : 'file',
            path: path_1.default.relative(dir, path_1.default.join(fullPath, e.name)).replace(/\\/g, '/'),
        }))
            .sort((a, b) => {
            if (a.type !== b.type)
                return a.type === 'directory' ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
        res.json({ path: reqPath, items });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/git/file?path= — file content
router.get('/file', async (req, res) => {
    try {
        const dir = resolveRepo(req.query.repo);
        const reqPath = req.query.path;
        if (!reqPath)
            return res.status(400).json({ error: 'path required' });
        const fullPath = path_1.default.resolve(dir, reqPath);
        if (!fullPath.startsWith(dir))
            return res.status(403).json({ error: 'Access denied' });
        const stats = await fs_1.default.promises.stat(fullPath);
        if (stats.size > 500 * 1024) {
            return res.json({ content: '// File too large to display (>500KB)', language: 'text', size: stats.size, tooLarge: true });
        }
        const content = await fs_1.default.promises.readFile(fullPath, 'utf-8');
        const ext = path_1.default.extname(reqPath).slice(1).toLowerCase();
        const langMap = {
            ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
            css: 'css', scss: 'scss', html: 'html', json: 'json', md: 'markdown',
            py: 'python', rs: 'rust', go: 'go', java: 'java', cpp: 'cpp',
            c: 'c', sh: 'shell', yaml: 'yaml', yml: 'yaml', toml: 'toml',
            prisma: 'prisma', sql: 'sql', txt: 'plaintext', env: 'plaintext',
        };
        res.json({ content, language: langMap[ext] || 'plaintext', size: stats.size, path: reqPath });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// POST /api/git/file — save file content  
router.post('/file', async (req, res) => {
    try {
        const dir = resolveRepo(req.body.repo);
        const { path: reqPath, content } = req.body;
        if (!reqPath || content === undefined)
            return res.status(400).json({ error: 'path and content required' });
        const fullPath = path_1.default.resolve(dir, reqPath);
        if (!fullPath.startsWith(dir))
            return res.status(403).json({ error: 'Access denied' });
        await fs_1.default.promises.writeFile(fullPath, content, 'utf-8');
        res.json({ success: true, path: reqPath });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/git/commits — commit history
router.get('/commits', async (req, res) => {
    try {
        const dir = resolveRepo(req.query.repo);
        const depth = parseInt(req.query.depth) || 30;
        const isRepo = await isGitRepo(dir);
        if (!isRepo)
            return res.json([]);
        const commits = await isomorphic_git_1.default.log({ fs: fs_1.default, dir, depth });
        res.json(commits.map(c => ({
            oid: c.oid,
            shortOid: c.oid.slice(0, 7),
            message: c.commit.message.trim(),
            author: c.commit.author.name,
            email: c.commit.author.email,
            timestamp: c.commit.author.timestamp,
        })));
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/git/branches — list branches
router.get('/branches', async (req, res) => {
    try {
        const dir = resolveRepo(req.query.repo);
        const isRepo = await isGitRepo(dir);
        if (!isRepo)
            return res.json({ current: 'main', branches: ['main'] });
        const branches = await isomorphic_git_1.default.listBranches({ fs: fs_1.default, dir });
        const current = await isomorphic_git_1.default.currentBranch({ fs: fs_1.default, dir }) || 'main';
        res.json({ current, branches });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/git/diff?oid=&repo= — diff for a commit
router.get('/diff', async (req, res) => {
    try {
        const dir = resolveRepo(req.query.repo);
        const oid = req.query.oid;
        if (!oid)
            return res.status(400).json({ error: 'oid required' });
        const isRepo = await isGitRepo(dir);
        if (!isRepo)
            return res.json({ patch: '' });
        // Get the patch using native git which handles everything beautifully
        const { stdout } = await execAsync(`git show ${oid} --format=`, { cwd: dir });
        res.json({
            oid,
            patch: stdout
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
