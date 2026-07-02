import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FolderOpen, Trash2, Code2, Clock, CheckCircle,
    AlertCircle, FileArchive, RefreshCw, ChevronRight, CloudUpload
} from 'lucide-react';

const API = 'http://localhost:3000/api';

interface UploadedRepo {
    name: string;
    path: string;
    uploadedAt: string;
    fileCount?: number;
    size?: number;
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString();
}

export default function UploadProject() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [repos, setRepos] = useState<UploadedRepo[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const [lastUploaded, setLastUploaded] = useState<UploadedRepo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [deletingName, setDeletingName] = useState<string | null>(null);

    const fetchList = useCallback(async () => {
        setLoadingList(true);
        try {
            const res = await fetch(`${API}/upload/list`);
            const data = await res.json();
            setRepos(Array.isArray(data) ? data : []);
        } catch {
            setRepos([]);
        } finally {
            setLoadingList(false);
        }
    }, []);

    useEffect(() => { fetchList(); }, [fetchList]);

    const doUpload = async (file: File) => {
        if (!file.name.endsWith('.zip')) {
            setError('Only .zip files are supported. Please zip your project folder first.');
            return;
        }
        setError(null);
        setUploading(true);
        setUploadProgress(0);
        setLastUploaded(null);

        // Simulate progress while uploading
        const progressInterval = setInterval(() => {
            setUploadProgress(p => Math.min(p + Math.random() * 15, 88));
        }, 200);

        try {
            const formData = new FormData();
            formData.append('project', file);

            const res = await fetch(`${API}/upload`, {
                method: 'POST',
                body: formData,
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Upload failed');
            }

            const data = await res.json();
            setLastUploaded(data);
            await fetchList();
        } catch (e: any) {
            clearInterval(progressInterval);
            setError(e.message || 'Upload failed');
        } finally {
            setUploading(false);
            setTimeout(() => setUploadProgress(0), 1500);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) doUpload(file);
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) doUpload(file);
    };

    const handleDelete = async (name: string) => {
        setDeletingName(name);
        try {
            await fetch(`${API}/upload/${encodeURIComponent(name)}`, { method: 'DELETE' });
            await fetchList();
        } catch {
            setError('Failed to delete project');
        } finally {
            setDeletingName(null);
        }
    };

    const openInIDE = (repoPath: string) => {
        navigate(`/app/repo?repo=${encodeURIComponent(repoPath)}`);
    };

    return (
        <div className="upload-page">
            {/* Page Header */}
            <div className="upload-page-header">
                <div>
                    <h1>Upload Project</h1>
                    <p className="upload-page-sub">
                        ZIP your existing project and upload it to browse in the Code &amp; IDE viewer
                    </p>
                </div>
                <button className="btn btn-secondary" onClick={fetchList} title="Refresh list">
                    <RefreshCw size={14} className={loadingList ? 'spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Upload Zone */}
            <div
                className={`upload-dropzone ${dragOver ? 'upload-dropzone-active' : ''} ${uploading ? 'upload-dropzone-uploading' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                aria-label="Upload project ZIP file"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip"
                    onChange={handleFileChange}
                    hidden
                    aria-hidden="true"
                    id="projectFileInput"
                    title="Select a project ZIP file"
                />
                {uploading ? (
                    <div className="upload-progress-wrap">
                        <CloudUpload size={40} className="upload-zone-icon uploading-icon" />
                        <p className="upload-zone-title">Uploading &amp; extracting…</p>
                        <div className="upload-progress-bar-wrap">
                            <div className="upload-progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                        </div>
                        <span className="upload-progress-pct">{Math.round(uploadProgress)}%</span>
                    </div>
                ) : (
                    <>
                        <FileArchive size={40} className="upload-zone-icon" />
                        <p className="upload-zone-title">
                            {dragOver ? 'Drop your ZIP here!' : 'Drag & drop your project ZIP'}
                        </p>
                        <p className="upload-zone-sub">or click to browse — up to 200 MB</p>
                        <div className="upload-zone-steps">
                            <div className="upload-step">
                                <span className="upload-step-num">1</span>
                                <span>Zip your project folder</span>
                            </div>
                            <ChevronRight size={14} className="upload-step-arrow" />
                            <div className="upload-step">
                                <span className="upload-step-num">2</span>
                                <span>Drop or click to upload</span>
                            </div>
                            <ChevronRight size={14} className="upload-step-arrow" />
                            <div className="upload-step">
                                <span className="upload-step-num">3</span>
                                <span>Browse in Code &amp; IDE</span>
                            </div>
                        </div>
                        <p className="upload-zone-note">
                            <strong>Note:</strong> <code>node_modules/</code>, <code>dist/</code>, and <code>.git/</code> are automatically excluded.
                        </p>
                    </>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="upload-alert upload-alert-error">
                    <AlertCircle size={15} />
                    <span>{error}</span>
                    <button className="upload-alert-close" onClick={() => setError(null)} title="Dismiss">×</button>
                </div>
            )}

            {/* Success */}
            {lastUploaded && !uploading && (
                <div className="upload-alert upload-alert-success">
                    <CheckCircle size={15} />
                    <span>
                        <strong>{lastUploaded.name}</strong> uploaded successfully
                        {lastUploaded.fileCount ? ` — ${lastUploaded.fileCount} files` : ''}
                        {lastUploaded.size ? `, ${formatBytes(lastUploaded.size)}` : ''}
                    </span>
                    <button className="btn btn-sm btn-primary" onClick={() => openInIDE(lastUploaded.path)}>
                        Open in IDE <Code2 size={12} />
                    </button>
                </div>
            )}

            {/* Uploaded Repos List */}
            <div className="upload-repos-section">
                <h2 className="upload-repos-title">
                    <FolderOpen size={15} /> Uploaded Projects
                    <span className="upload-repos-count">{repos.length}</span>
                </h2>

                {loadingList ? (
                    <div className="upload-repos-loading">
                        <RefreshCw size={16} className="spin" /> Loading…
                    </div>
                ) : repos.length === 0 ? (
                    <div className="upload-repos-empty">
                        <FileArchive size={32} />
                        <p>No projects uploaded yet</p>
                        <p className="upload-repos-empty-sub">Upload a ZIP above to get started</p>
                    </div>
                ) : (
                    <div className="upload-repo-list">
                        {repos.map(repo => (
                            <div key={repo.name} className="upload-repo-card">
                                <div className="upload-repo-icon">
                                    <FolderOpen size={20} />
                                </div>
                                <div className="upload-repo-info">
                                    <div className="upload-repo-name">{repo.name}</div>
                                    <div className="upload-repo-meta">
                                        <Clock size={11} />
                                        <span>Uploaded {formatDate(repo.uploadedAt)}</span>
                                    </div>
                                </div>
                                <div className="upload-repo-actions">
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => openInIDE(repo.path)}
                                        title="Browse in IDE"
                                    >
                                        <Code2 size={13} /> Open in IDE
                                    </button>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleDelete(repo.name)}
                                        disabled={deletingName === repo.name}
                                        title="Delete project"
                                    >
                                        {deletingName === repo.name
                                            ? <RefreshCw size={13} className="spin" />
                                            : <Trash2 size={13} />
                                        }
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
