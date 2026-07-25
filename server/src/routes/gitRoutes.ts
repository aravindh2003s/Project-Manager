import { Router } from 'express';
import git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { requireAuth } from '../auth';

const execAsync = promisify(exec);
const router = Router();
router.use(requireAuth);

// Default: the project itself. Uploaded repos live in UPLOADS_DIR.
const DEFAULT_REPO = path.resolve(__dirname, '../../../');
const UPLOADS_DIR  = path.resolve(__dirname, '../../uploads');

/** Resolve which repo directory to serve based on optional ?repo= param */
function resolveRepo(repo?: string): string {
    if (!repo || repo === '__default__') return DEFAULT_REPO;
    const target = path.join(UPLOADS_DIR, repo.replace(/\.\.+/g, ''));
    if (!target.startsWith(UPLOADS_DIR)) return DEFAULT_REPO;
    return fs.existsSync(target) ? target : DEFAULT_REPO;
}

// Helper: check if path is a git repo
async function isGitRepo(dir: string): Promise<boolean> {
    try {
        await git.resolveRef({ fs, dir, ref: 'HEAD' });
        return true;
    } catch {
        return false;
    }
}

// GET /api/git/info — repo metadata
router.get('/info', async (req, res) => {
    try {
        const dir = resolveRepo(req.query.repo as string | undefined);
        const isRepo = await isGitRepo(dir);
        if (!isRepo) return res.json({ isRepo: false, name: 'nexus-platform', branch: 'main', commits: 0 });

        const branch = await git.currentBranch({ fs, dir }) || 'main';
        const commits = await git.log({ fs, dir, depth: 100 });
        const remotes = await git.listRemotes({ fs, dir });

        res.json({
            isRepo: true,
            name: path.basename(dir),
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
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/git/tree?path= — file tree
router.get('/tree', async (req, res) => {
    try {
        const dir = resolveRepo(req.query.repo as string | undefined);
        const reqPath = (req.query.path as string) || '.';
        const fullPath = path.resolve(dir, reqPath);

        // Security: ensure path stays within repo root
        if (!fullPath.startsWith(dir)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const entries = await fs.promises.readdir(fullPath, { withFileTypes: true });
        const IGNORE = new Set(['.git', 'node_modules', 'dist', '.cache', '__pycache__', '.next']);

        const items = entries
            .filter(e => !IGNORE.has(e.name) && !e.name.startsWith('.env'))
            .map(e => ({
                name: e.name,
                type: e.isDirectory() ? 'directory' : 'file',
                path: path.relative(dir, path.join(fullPath, e.name)).replace(/\\/g, '/'),
            }))
            .sort((a, b) => {
                if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
                return a.name.localeCompare(b.name);
            });

        res.json({ path: reqPath, items });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/git/file?path= — file content
router.get('/file', async (req, res) => {
    try {
        const dir = resolveRepo(req.query.repo as string | undefined);
        const reqPath = req.query.path as string;
        if (!reqPath) return res.status(400).json({ error: 'path required' });

        const fullPath = path.resolve(dir, reqPath);
        if (!fullPath.startsWith(dir)) return res.status(403).json({ error: 'Access denied' });

        const stats = await fs.promises.stat(fullPath);
        if (stats.size > 500 * 1024) {
            return res.json({ content: '// File too large to display (>500KB)', language: 'text', size: stats.size, tooLarge: true });
        }

        const content = await fs.promises.readFile(fullPath, 'utf-8');
        const ext = path.extname(reqPath).slice(1).toLowerCase();

        const langMap: Record<string, string> = {
            ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
            css: 'css', scss: 'scss', html: 'html', json: 'json', md: 'markdown',
            py: 'python', rs: 'rust', go: 'go', java: 'java', cpp: 'cpp',
            c: 'c', sh: 'shell', yaml: 'yaml', yml: 'yaml', toml: 'toml',
            prisma: 'prisma', sql: 'sql', txt: 'plaintext', env: 'plaintext',
        };

        res.json({ content, language: langMap[ext] || 'plaintext', size: stats.size, path: reqPath });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/git/file — save file content  
router.post('/file', async (req, res) => {
    try {
        const dir = resolveRepo((req.body.repo as string | undefined));
        const { path: reqPath, content } = req.body;
        if (!reqPath || content === undefined) return res.status(400).json({ error: 'path and content required' });

        const fullPath = path.resolve(dir, reqPath);
        if (!fullPath.startsWith(dir)) return res.status(403).json({ error: 'Access denied' });

        await fs.promises.writeFile(fullPath, content, 'utf-8');
        res.json({ success: true, path: reqPath });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/git/commits — commit history
router.get('/commits', async (req, res) => {
    try {
        const dir = resolveRepo(req.query.repo as string | undefined);
        const depth = parseInt(req.query.depth as string) || 30;
        const isRepo = await isGitRepo(dir);
        if (!isRepo) return res.json([]);

        const commits = await git.log({ fs, dir, depth });
        res.json(commits.map(c => ({
            oid: c.oid,
            shortOid: c.oid.slice(0, 7),
            message: c.commit.message.trim(),
            author: c.commit.author.name,
            email: c.commit.author.email,
            timestamp: c.commit.author.timestamp,
        })));
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/git/branches — list branches
router.get('/branches', async (req, res) => {
    try {
        const dir = resolveRepo(req.query.repo as string | undefined);
        const isRepo = await isGitRepo(dir);
        if (!isRepo) return res.json({ current: 'main', branches: ['main'] });

        const branches = await git.listBranches({ fs, dir });
        const current = await git.currentBranch({ fs, dir }) || 'main';
        res.json({ current, branches });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/git/diff?oid=&repo= — diff for a commit
router.get('/diff', async (req, res) => {
    try {
        const dir = resolveRepo(req.query.repo as string | undefined);
        const oid = req.query.oid as string;
        
        if (!oid) return res.status(400).json({ error: 'oid required' });

        const isRepo = await isGitRepo(dir);
        if (!isRepo) return res.json({ patch: '' });

        // Get the patch using native git which handles everything beautifully
        const { stdout } = await execAsync(`git show ${oid} --format=`, { cwd: dir });
        
        res.json({
            oid,
            patch: stdout
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
