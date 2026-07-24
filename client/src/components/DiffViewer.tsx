import React from 'react';
import './DiffViewer.css';

interface DiffViewerProps {
    patch: string;
    onClose: () => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ patch, onClose }) => {
    // Basic parser for unified diff
    const lines = patch.split('\n');

    return (
        <div className="diff-modal-overlay" onClick={onClose}>
            <div className="diff-modal-content" onClick={e => e.stopPropagation()}>
                <div className="diff-modal-header">
                    <h2>Commit Changes</h2>
                    <button className="diff-close-btn" onClick={onClose}>×</button>
                </div>
                <div className="diff-modal-body">
                    {lines.length === 0 || patch.trim() === '' ? (
                        <div className="diff-empty">No changes found or patch is empty.</div>
                    ) : (
                        <pre className="diff-container">
                            {lines.map((line, idx) => {
                                let type = 'context';
                                if (line.startsWith('+') && !line.startsWith('+++')) type = 'add';
                                else if (line.startsWith('-') && !line.startsWith('---')) type = 'remove';
                                else if (line.startsWith('@@')) type = 'chunk';
                                else if (line.startsWith('diff --git')) type = 'file';

                                return (
                                    <div key={idx} className={`diff-line diff-${type}`}>
                                        <span className="diff-line-content">{line}</span>
                                    </div>
                                );
                            })}
                        </pre>
                    )}
                </div>
            </div>
        </div>
    );
};
