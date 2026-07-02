import { useEffect, useState, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import {
    Folder, FolderOpen, FileText, ChevronRight, ChevronDown,
    GitBranch, GitCommit, Clock, Save, RefreshCw, Eye, Code2,
    AlertCircle, CheckCircle
} from 'lucide-react';
import { gitApi } from '../api/gitApi';
import type { FileTreeItem, Commit, RepoInfo, DiffLine } from '../api/gitApi';

// ── File Icon helper ────────────────────────────────
function getFileIcon(name: string) {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const colorMap: Record<string, string> = {
        ts: '#3178c6', tsx: '#3178c6', js: '#f7df1e', jsx: '#61dafb',
        css: '#563d7c', scss: '#c6538c', html: '#e34c26', json: '#ffa500',
        md: '#aaaaaa', py: '#3572a5', prisma: '#16a085', sql: '#e38c00',
        yaml: '#cb171e', yml: '#cb171e', sh: '#89e051', env: '#ecd53f',
    };
    return colorMap[ext] || '#8b949e';
}

// ── Tree Node component ──────────────────────────────
interface TreeNodeProps {
    item: FileTreeItem;
    depth: number;
    selectedPath: string;
    onSelect: (path: string, isDir: boolean) => void;
}

function TreeNode({ item, depth, selectedPath, onSelect }: TreeNodeProps) {
    const [expanded, setExpanded] = useState(depth < 1);
    const [children, setChildren] = useState<FileTreeItem[]>([]);
    const [loadingChildren, setLoadingChildren] = useState(false);
    const isSelected = selectedPath === item.path;

    const handleClick = async () => {
        if (item.type === 'directory') {
            if (!expanded && children.length === 0) {
                setLoadingChildren(true);
                try {
                    const result = await gitApi.getTree(item.path);
                    setChildren(result.items);
                } catch { }
                setLoadingChildren(false);
            }
            setExpanded(!expanded);
        }
        onSelect(item.path, item.type === 'directory');
    };

    return (
        <div>
            <div
                className={`repo-tree-node ${isSelected ? 'repo-tree-node-active' : ''}`}
                style={{ paddingLeft: `${8 + depth * 14}px` }}
                onClick={handleClick}
            >
                {item.type === 'directory' ? (
                    <>
                        <span className="repo-tree-arrow">
                            {loadingChildren ? <RefreshCw size={10} className="spin" /> :
                                expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </span>
                        {expanded ? <FolderOpen size={14} className="repo-tree-folder-open" /> : <Folder size={14} className="repo-tree-folder" />}
                    </>
                ) : (
                    <>
                        <span className="repo-tree-arrow"></span>
                        <FileText size={13} style={{ color: getFileIcon(item.name), flexShrink: 0 }} />
                    </>
                )}
                <span className="repo-tree-name">{item.name}</span>
            </div>
            {expanded && item.type === 'directory' && children.length > 0 && (
                <div>
                    {children.map(child => (
                        <TreeNode key={child.path} item={child} depth={depth + 1} selectedPath={selectedPath} onSelect={onSelect} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Diff Viewer ──────────────────────────────────────
function DiffViewer({ lines, filePath }: { lines: DiffLine[]; filePath: string }) {
    // Only show changed context — surrounding 3 lines
    const relevant: { line: DiffLine; idx: number }[] = [];
    const changedIdxs = new Set<number>();
    lines.forEach((l, i) => { if (l.type !== 'context') { for (let j = Math.max(0, i - 3); j <= Math.min(lines.length - 1, i + 3); j++) changedIdxs.add(j); } });
    lines.forEach((l, i) => { if (changedIdxs.has(i)) relevant.push({ line: l, idx: i }); });

    if (lines.length === 0) return <div className="diff-empty">No diff data available</div>;

    return (
        <div className="diff-viewer">
            <div className="diff-header">
                <FileText size={14} />
                <span>{filePath}</span>
            </div>
            <div className="diff-body">
                {relevant.length === 0 ? (
                    <div className="diff-empty">No changes detected between last two commits.</div>
                ) : (
                    relevant.map(({ line, idx }) => (
                        <div key={idx} className={`diff-line diff-line-${line.type}`}>
                            <span className="diff-line-type">
                                {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                            </span>
                            <span className="diff-line-no">{line.lineNo}</span>
                            <code className="diff-line-code">{line.content}</code>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ── Main Repository Viewer ───────────────────────────
type TabType = 'editor' | 'commits' | 'diff' | 'branches';

export default function RepositoryViewer() {
    const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
    const [treeItems, setTreeItems] = useState<FileTreeItem[]>([]);
    const [selectedPath, setSelectedPath] = useState('');
    const [fileContent, setFileContent] = useState('');
    const [fileLang, setFileLang] = useState('typescript');
    const [editorContent, setEditorContent] = useState('');
    const [commits, setCommits] = useState<Commit[]>([]);
    const [branches, setBranches] = useState<string[]>([]);
    const [currentBranch, setCurrentBranch] = useState('main');
    const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
    const [diffFile, setDiffFile] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('editor');
    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [isDirty, setIsDirty] = useState(false);
    const [loadingFile, setLoadingFile] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [info, tree, commitsData, branchData] = await Promise.all([
                gitApi.getInfo(),
                gitApi.getTree('.'),
                gitApi.getCommits(30),
                gitApi.getBranches(),
            ]);
            setRepoInfo(info);
            setTreeItems(tree.items);
            setCommits(commitsData);
            setBranches(branchData.branches);
            setCurrentBranch(branchData.current);
        } catch (e) {
            console.error('Failed to load repo data:', e);
        }
        setLoading(false);
    };

    const handleFileSelect = useCallback(async (filePath: string, isDir: boolean) => {
        if (isDir) { setSelectedPath(filePath); return; }
        setSelectedPath(filePath);
        setLoadingFile(true);
        setIsDirty(false);
        setActiveTab('editor');
        try {
            const file = await gitApi.getFile(filePath);
            setFileContent(file.content);
            setEditorContent(file.content);
            setFileLang(file.language);
        } catch (e) {
            setFileContent('// Error loading file');
            setEditorContent('// Error loading file');
        }
        setLoadingFile(false);
    }, []);

    const handleSave = async () => {
        if (!selectedPath || !isDirty) return;
        setSaveStatus('saving');
        try {
            await gitApi.saveFile(selectedPath, editorContent);
            setFileContent(editorContent);
            setIsDirty(false);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    const handleShowDiff = async (filePath: string) => {
        setDiffFile(filePath);
        setActiveTab('diff');
        try {
            const diff = await gitApi.getDiff(filePath);
            setDiffLines(diff.lines);
        } catch {
            setDiffLines([]);
        }
    };

    const formatTime = (ts: number) => {
        const d = new Date(ts * 1000);
        const diff = Date.now() - d.getTime();
        const days = Math.floor(diff / 86400000);
        if (days === 0) return 'today';
        if (days === 1) return 'yesterday';
        if (days < 30) return `${days}d ago`;
        return d.toLocaleDateString();
    };



    return (
        <div className="repo-layout">
            {/* Left: File Tree Sidebar */}
            <div className="repo-sidebar">
                <div className="repo-sidebar-header">
                    <div className="repo-sidebar-title">
                        <Folder size={16} className="repo-folder-icon" />
                        <span>{repoInfo?.name || 'Loading...'}</span>
                    </div>
                    <div className="repo-branch-badge">
                        <GitBranch size={11} />
                        <span>{currentBranch}</span>
                    </div>
                </div>

                {repoInfo && (
                    <div className="repo-meta-strip">
                        <span className="repo-meta-item">
                            <GitCommit size={11} />{repoInfo.commitCount} commits
                        </span>
                        {repoInfo.latestCommit && (
                            <span className="repo-meta-item repo-meta-commit" title={repoInfo.latestCommit.message}>
                                {repoInfo.latestCommit.oid}
                            </span>
                        )}
                    </div>
                )}

                <div className="repo-tree-container">
                    {loading ? (
                        <div className="repo-tree-loading">
                            <RefreshCw size={16} className="spin" />
                            <span>Loading...</span>
                        </div>
                    ) : (
                        treeItems.map(item => (
                            <TreeNode key={item.path} item={item} depth={0} selectedPath={selectedPath} onSelect={handleFileSelect} />
                        ))
                    )}
                </div>
            </div>

            {/* Right: Editor + Tabs */}
            <div className="repo-editor-area">
                {/* Editor Header */}
                <div className="repo-editor-header">
                    <div className="repo-editor-tabs">
                        <button className={`repo-tab ${activeTab === 'editor' ? 'active' : ''}`} onClick={() => setActiveTab('editor')}>
                            <Code2 size={13} /> Editor
                        </button>
                        <button className={`repo-tab ${activeTab === 'commits' ? 'active' : ''}`} onClick={() => setActiveTab('commits')}>
                            <GitCommit size={13} /> Commits
                        </button>
                        <button className={`repo-tab ${activeTab === 'diff' ? 'active' : ''}`} onClick={() => setActiveTab('diff')}>
                            <Eye size={13} /> Diff
                        </button>
                        <button className={`repo-tab ${activeTab === 'branches' ? 'active' : ''}`} onClick={() => setActiveTab('branches')}>
                            <GitBranch size={13} /> Branches
                        </button>
                    </div>

                    {selectedPath && activeTab === 'editor' && (
                        <div className="repo-editor-actions">
                            <span className="repo-file-path">{selectedPath}</span>
                            {isDirty && <span className="repo-dirty-dot" title="Unsaved changes"></span>}
                            {selectedPath && (
                                <button className="repo-action-btn" title="View diff" onClick={() => handleShowDiff(selectedPath)}>
                                    <Eye size={13} />
                                </button>
                            )}
                            <button
                                className={`repo-save-btn ${isDirty ? 'active' : ''}`}
                                onClick={handleSave}
                                disabled={!isDirty || saveStatus === 'saving'}
                                title="Save file (Ctrl+S)"
                            >
                                {saveStatus === 'saving' ? <RefreshCw size={13} className="spin" /> :
                                    saveStatus === 'saved' ? <CheckCircle size={13} className="repo-save-ok" /> :
                                        saveStatus === 'error' ? <AlertCircle size={13} className="repo-save-err" /> :
                                            <Save size={13} />}
                                {saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Tab Content */}
                <div className="repo-editor-body">
                    {activeTab === 'editor' && (
                        <>
                            {!selectedPath ? (
                                <div className="repo-empty-state">
                                    <Folder size={56} />
                                    <h3>Select a file to edit</h3>
                                    <p>Click any file in the tree to open it in the Monaco editor</p>
                                </div>
                            ) : loadingFile ? (
                                <div className="repo-empty-state">
                                    <RefreshCw size={32} className="spin" />
                                    <p>Loading file...</p>
                                </div>
                            ) : (
                                <MonacoEditor
                                    height="100%"
                                    language={fileLang}
                                    value={editorContent}
                                    theme="vs-dark"
                                    onChange={(val) => {
                                        setEditorContent(val || '');
                                        setIsDirty((val || '') !== fileContent);
                                    }}
                                    options={{
                                        fontSize: 13,
                                        fontFamily: '"Fira Code", "Cascadia Code", monospace',
                                        fontLigatures: true,
                                        minimap: { enabled: true },
                                        scrollBeyondLastLine: false,
                                        smoothScrolling: true,
                                        cursorBlinking: 'smooth',
                                        formatOnPaste: true,
                                        renderLineHighlight: 'line',
                                        lineNumbers: 'on',
                                        glyphMargin: false,
                                        folding: true,
                                        wordWrap: 'on',
                                        tabSize: 2,
                                        automaticLayout: true,
                                    }}
                                    onMount={(editor) => {
                                        // Ctrl+S to save
                                        editor.addCommand(
                                            // Monaco.KeyMod.CtrlCmd | Monaco.KeyCode.KeyS
                                            2097 | 49,
                                            handleSave
                                        );
                                    }}
                                />
                            )}
                        </>
                    )}

                    {activeTab === 'commits' && (
                        <div className="commits-list">
                            <div className="commits-header">
                                <GitCommit size={14} />
                                <span>{commits.length} commits</span>
                            </div>
                            {commits.length === 0 ? (
                                <div className="repo-empty-state"><p>No commits found in this repository.</p></div>
                            ) : commits.map(commit => (
                                <div key={commit.oid} className="commit-row" onClick={() => handleShowDiff(selectedPath || 'client/src/App.tsx')}>
                                    <div className="commit-icon"><GitCommit size={14} /></div>
                                    <div className="commit-body">
                                        <div className="commit-message">{commit.message}</div>
                                        <div className="commit-meta">
                                            <span className="commit-author">{commit.author}</span>
                                            <span className="commit-oid">{commit.shortOid}</span>
                                            <span className="commit-time"><Clock size={11} />{formatTime(commit.timestamp)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'diff' && (
                        <div className="repo-diff-panel">
                            {diffLines.length === 0 && !diffFile ? (
                                <div className="repo-empty-state">
                                    <Eye size={48} />
                                    <h3>No file selected for diff</h3>
                                    <p>Open a file in the editor and click the diff button</p>
                                </div>
                            ) : (
                                <DiffViewer lines={diffLines} filePath={diffFile || selectedPath} />
                            )}
                        </div>
                    )}

                    {activeTab === 'branches' && (
                        <div className="branches-panel">
                            <div className="branches-header">
                                <GitBranch size={14} /> <span>All branches</span>
                            </div>
                            {branches.map(b => (
                                <div key={b} className={`branch-row ${b === currentBranch ? 'branch-current' : ''}`}>
                                    <GitBranch size={14} />
                                    <span className="branch-name">{b}</span>
                                    {b === currentBranch && <span className="branch-current-badge">current</span>}
                                </div>
                            ))}
                            {branches.length === 0 && <div className="repo-empty-state"><p>No branches found.</p></div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
