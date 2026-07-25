import { useState, useCallback, useRef, useEffect } from 'react';
import {
    ReactFlow, Background, Controls, MiniMap,
    addEdge, useNodesState, useEdgesState, Handle, Position,
    type Node, type Edge, type Connection, type NodeProps,
    BackgroundVariant, Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    Play, Code2, Download, Copy, Check, Plus, Trash2, Zap, X, Save
} from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { apiFetch } from '../api/http';
import { NODE_CATALOG, getDefaultConfig, type PipelineNodeCategory, type NodeConfigDef } from './pipeline/nodeCatalog';
import { generateYAML } from './pipeline/yamlGenerator';
import './PipelineBuilder.css';

interface PipelineNodeData {
    label: string;
    type: string;
    config: Record<string, string>;
    executing?: boolean;
    [key: string]: unknown;
}

function PipelineNode({ data, selected }: NodeProps) {
    const nodeData = data as PipelineNodeData;
    const config = NODE_CATALOG.find(c => c.type === nodeData.type);
    if (!config) return <div className="pipeline-node-azure">Unknown Node</div>;

    return (
        <div className={`pipeline-node-azure ${selected ? 'selected' : ''} ${nodeData.executing ? 'executing' : ''}`} style={{ borderLeftColor: config.color }}>
            <Handle type="target" position={Position.Left} className="pipeline-handle-azure" />
            <div className="pipeline-node-azure-content">
                <div className="pipeline-node-azure-icon" style={{ color: config.color }}>
                    {config.icon}
                </div>
                <div className="pipeline-node-azure-text">
                    <div className="pipeline-node-azure-title">{nodeData.label}</div>
                    <div className="pipeline-node-azure-subtitle">{config.description}</div>
                </div>
            </div>
            <Handle type="source" position={Position.Right} className="pipeline-handle-azure" />
        </div>
    );
}

const nodeTypes = { pipelineNode: PipelineNode };

const INIT_NODES: Node[] = [
    { id: '1', type: 'pipelineNode', position: { x: 50, y: 150 }, data: { label: 'GitHub Push', type: 'github_push', config: getDefaultConfig('github_push') } },
    { id: '2', type: 'pipelineNode', position: { x: 350, y: 50 }, data: { label: 'Snyk Scan', type: 'snyk_scan', config: getDefaultConfig('snyk_scan') } },
    { id: '3', type: 'pipelineNode', position: { x: 350, y: 150 }, data: { label: 'Jest Tests', type: 'jest_test', config: getDefaultConfig('jest_test') } },
    { id: '5', type: 'pipelineNode', position: { x: 650, y: 150 }, data: { label: 'NPM Build', type: 'npm_build', config: getDefaultConfig('npm_build') } },
    { id: '6', type: 'pipelineNode', position: { x: 950, y: 100 }, data: { label: 'Docker Build & Push', type: 'docker_build_push', config: getDefaultConfig('docker_build_push') } },
    { id: '8', type: 'pipelineNode', position: { x: 1250, y: 150 }, data: { label: 'AWS ECS Deploy', type: 'aws_ecs_deploy', config: getDefaultConfig('aws_ecs_deploy') } },
];

const INIT_EDGES: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: true },
    { id: 'e1-3', source: '1', target: '3', type: 'smoothstep', animated: true },
    { id: 'e2-5', source: '2', target: '5', type: 'smoothstep', animated: true },
    { id: 'e3-5', source: '3', target: '5', type: 'smoothstep', animated: true },
    { id: 'e5-6', source: '5', target: '6', type: 'smoothstep', animated: true },
    { id: 'e6-8', source: '6', target: '8', type: 'smoothstep', animated: true },
];

export default function PipelineBuilder() {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [isProjectSelected, setIsProjectSelected] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [showYaml, setShowYaml] = useState(false);
    const [yaml, setYaml] = useState('');
    const [copied, setCopied] = useState(false);
    const [nodeCounter, setNodeCounter] = useState(INIT_NODES.length + 10);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    const { projects, fetchProjects, savePipeline } = useProjectStore();
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [pipelineName, setPipelineName] = useState('My Pipeline');
    const [isSaving, setIsSaving] = useState(false);

    // Search and Filtering in Palette
    const [searchQuery, setSearchQuery] = useState('');

    // Execution Simulation State
    const [isExecuting, setIsExecuting] = useState(false);
    const [showTerminal, setShowTerminal] = useState(false);
    const [executionLogs, setExecutionLogs] = useState<React.ReactNode[]>([]);
    const terminalBodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (projects.length === 0) fetchProjects();
    }, [projects.length, fetchProjects]);

    useEffect(() => {
        if (terminalBodyRef.current) {
            terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
        }
    }, [executionLogs]);

    const handleProjectSelect = async (projectId: string) => {
        setSelectedProjectId(projectId);
        const proj = projects.find(p => p.id === projectId);
        if (!proj) return;
        
        setAnalyzing(true);
        try {
            const data = await apiFetch<any>(`/pipeline/analyze?project=${encodeURIComponent(proj.name)}`);
            if (data.nodes && data.edges) {
                // Map basic nodes to catalog if possible
                const mappedNodes = data.nodes.map((n: any) => {
                    let type = n.data.type;
                    if (type === 'trigger') type = 'github_push';
                    if (type === 'build') type = 'npm_build';
                    if (type === 'test') type = 'jest_test';
                    if (type === 'lint') type = 'jest_test';
                    if (type === 'security') type = 'snyk_scan';
                    if (type === 'docker') type = 'docker_build_push';
                    if (type === 'database') type = 'prisma_migrate';
                    if (type === 'deploy') type = 'vercel_deploy';
                    if (type === 'notify') type = 'slack_notify';

                    return {
                        ...n,
                        data: {
                            ...n.data,
                            type,
                            config: { ...getDefaultConfig(type), ...n.data.config }
                        }
                    };
                });
                
                setNodes(mappedNodes);
                setEdges(data.edges);
                setNodeCounter(data.nodes.length + 1);
            }
        } catch (e) {
            console.error("Analysis failed", e);
        } finally {
            setAnalyzing(false);
            setIsProjectSelected(true);
        }
    };

    const onConnect = useCallback((params: Connection) => {
        setEdges(eds => addEdge({ ...params, type: 'smoothstep', animated: true }, eds));
    }, [setEdges]);

    const addNode = (type: string, label: string) => {
        const id = String(nodeCounter + 1);
        const config = getDefaultConfig(type);
        const newNode: Node = {
            id,
            type: 'pipelineNode',
            position: { x: 100 + Math.random() * 400, y: 100 + Math.random() * 300 },
            data: { label, type, config },
        };
        setNodes(nds => [...nds, newNode]);
        setNodeCounter(c => c + 1);
    };

    const selectedNode = nodes.find(n => n.selected);

    const updateNodeConfig = (nodeId: string, key: string, value: string) => {
        setNodes(nds => nds.map(n => {
            if (n.id === nodeId) {
                return {
                    ...n,
                    data: {
                        ...n.data,
                        config: {
                            ...(n.data as PipelineNodeData).config,
                            [key]: value
                        }
                    }
                };
            }
            return n;
        }));
    };

    const handleGenerateYaml = () => {
        const generated = generateYAML(nodes, edges);
        setYaml(generated);
        setShowYaml(true);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(yaml);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([yaml], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pipeline.yml';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleRunPipeline = async () => {
        if (nodes.length === 0) return;
        setIsExecuting(true);
        setShowTerminal(true);
        setExecutionLogs([<span key="init" className="log-info">[INFO] Initializing CI/CD pipeline simulation...</span>]);
        
        // Topo-sort mock: just execute from left to right (x position)
        const runOrder = [...nodes].sort((a, b) => a.position.x - b.position.x);
        
        let logIndex = 0;
        const addLog = (log: React.ReactNode) => setExecutionLogs(logs => [...logs, <div key={logIndex++} className="log-line">{log}</div>]);

        for (const node of runOrder) {
            setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, executing: true } } : n));
            const nodeData = node.data as PipelineNodeData;
            addLog(<span className="log-info">[START] Executing task: {nodeData.label}...</span>);
            
            await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
            addLog(<span className="log-success">[OK] Completed {nodeData.label}.</span>);
            
            await new Promise(r => setTimeout(r, 500));
            setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, executing: false } } : n));
        }
        
        addLog(<span className="log-success">[INFO] Pipeline execution finished successfully!</span>);
        setIsExecuting(false);
    };

    const handleSaveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProjectId) return;
        setIsSaving(true);
        try {
            const flowState = JSON.stringify({ nodes, edges });
            await savePipeline(selectedProjectId, { name: pipelineName, yaml, flowState });
            setShowSaveModal(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    // Group catalog for the palette
    const groupedCatalog = NODE_CATALOG.reduce((acc, node) => {
        if (!acc[node.category]) acc[node.category] = [];
        if (node.label.toLowerCase().includes(searchQuery.toLowerCase()) || node.description.toLowerCase().includes(searchQuery.toLowerCase())) {
            acc[node.category].push(node);
        }
        return acc;
    }, {} as Record<PipelineNodeCategory, NodeConfigDef[]>);

    return (
        <div className="pipeline-layout-azure">
            {!isProjectSelected ? (
                <div className="pipeline-project-selection">
                    <div className="card modal-card" style={{ maxWidth: '500px', margin: 'auto', marginTop: '100px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Create Pipeline</h3>
                        </div>
                        <div className="modal-body" style={{ padding: '20px' }}>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                                Select a project to automatically generate a tailored CI/CD pipeline based on its tech stack. This works for both imported and created projects.
                            </p>
                            <label className="form-label">Select Project</label>
                            <select 
                                className="modal-input modal-select" 
                                value={selectedProjectId} 
                                onChange={e => handleProjectSelect(e.target.value)}
                                disabled={analyzing}
                            >
                                <option value="" disabled>Select a project...</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            
                            {analyzing && (
                                <div style={{ marginTop: '20px', color: 'var(--accent)' }}>
                                    <Zap size={14} className="spin-icon" style={{ marginRight: '8px' }} />
                                    Analyzing project and building pipeline...
                                </div>
                            )}
                            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                <button className="btn" onClick={() => { setNodes(INIT_NODES); setEdges(INIT_EDGES); setIsProjectSelected(true); }}>
                                    Skip & Start from Scratch
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Canvas */}
                    <div className="pipeline-canvas-wrap" ref={reactFlowWrapper}>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            nodeTypes={nodeTypes}
                            fitView
                            fitViewOptions={{ padding: 0.2 }}
                            snapToGrid={true}
                            snapGrid={[20, 20]}
                            defaultEdgeOptions={{ type: 'smoothstep', animated: true }}
                            style={{ background: 'rgba(10,10,15,0.7)' }}
                        >
                            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.05)" />
                            <Controls className="pipeline-flow-controls" />
                            <MiniMap
                                className="pipeline-minimap-azure"
                                nodeColor={(n) => {
                                    const d = n.data as PipelineNodeData;
                                    return NODE_CATALOG.find(c => c.type === d.type)?.color || '#8b949e';
                                }}
                                maskColor="rgba(0,0,0,0.5)"
                            />
                            <Panel position="top-right">
                                <div className="pipeline-top-actions">
                                    <button className="btn" onClick={() => { setNodes([]); setEdges([]); }} title="Clear canvas" disabled={isExecuting}>
                                        <Trash2 size={14} /> Clear
                                    </button>
                                    <button className="btn btn-primary" onClick={handleGenerateYaml} disabled={isExecuting}>
                                        <Code2 size={14} /> Generate YAML
                                    </button>
                                    <button className="btn btn-primary" onClick={handleRunPipeline} disabled={isExecuting} style={{ background: '#3fb950', borderColor: '#3fb950' }}>
                                        <Play size={14} /> Run Pipeline
                                    </button>
                                </div>
                            </Panel>
                        </ReactFlow>
                    </div>

                    {/* Right palette (Tasks Assistant Catalog) */}
                    <div className="pipeline-palette-azure">
                        <div className="pipeline-palette-title-azure">
                            Node Catalog
                        </div>
                        <div className="pipeline-palette-search-azure">
                            <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        <div className="pipeline-palette-list-azure">
                            {Object.entries(groupedCatalog).map(([category, items]) => {
                                if (items.length === 0) return null;
                                return (
                                    <div key={category}>
                                        <div className="pipeline-category-title">{category}</div>
                                        {items.map(item => (
                                            <button
                                                key={item.type}
                                                className="pipeline-palette-item-azure"
                                                onClick={() => addNode(item.type, item.label)}
                                                title={item.description}
                                            >
                                                <div className="palette-item-icon-azure" style={{ color: item.color }}>{item.icon}</div>
                                                <div className="palette-item-text-azure">
                                                    <span className="palette-item-label">{item.label}</span>
                                                    <span className="palette-item-desc">{item.description}</span>
                                                </div>
                                                <Plus size={14} className="pipeline-palette-plus" />
                                            </button>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Side Drawer for Properties */}
                    <div className={`pipeline-properties-drawer ${selectedNode ? 'open' : ''}`}>
                        {selectedNode && (() => {
                            const nodeData = selectedNode.data as PipelineNodeData;
                            const config = NODE_CATALOG.find(c => c.type === nodeData.type);
                            
                            return (
                                <>
                                    <div className="pipeline-properties-header">
                                        <div className="pipeline-properties-icon" style={{ color: config?.color }}>
                                            {config?.icon}
                                        </div>
                                        <div className="pipeline-properties-title">
                                            {nodeData.label} Config
                                        </div>
                                        <button className="close-drawer-btn" onClick={() => setNodes(nds => nds.map(n => ({...n, selected: false})))}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div className="pipeline-properties-body">
                                        {config?.fields.map((field) => (
                                            <div key={field.name} className="pipeline-property-field">
                                                <label className="pipeline-property-label">{field.label}</label>
                                                {field.type === 'select' ? (
                                                    <select 
                                                        className="pipeline-property-input"
                                                        value={(nodeData.config[field.name] as string) || field.default}
                                                        onChange={(e) => updateNodeConfig(selectedNode.id, field.name, e.target.value)}
                                                    >
                                                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                ) : field.type === 'boolean' ? (
                                                    <select 
                                                        className="pipeline-property-input"
                                                        value={(nodeData.config[field.name] as string) || field.default}
                                                        onChange={(e) => updateNodeConfig(selectedNode.id, field.name, e.target.value)}
                                                    >
                                                        <option value="true">True</option>
                                                        <option value="false">False</option>
                                                    </select>
                                                ) : (
                                                    <input 
                                                        type="text" 
                                                        className="pipeline-property-input" 
                                                        value={(nodeData.config[field.name] as string) || field.default} 
                                                        onChange={(e) => updateNodeConfig(selectedNode.id, field.name, e.target.value)} 
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pipeline-properties-footer">
                                        <button className="btn pipeline-prop-done-btn" onClick={() => setNodes(nds => nds.map(n => ({...n, selected: false})))}>
                                            Save & Close
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    {/* YAML Panel */}
                    {showYaml && (
                        <div className="pipeline-yaml-panel">
                            <div className="pipeline-yaml-header">
                                <span className="pipeline-yaml-title">
                                    <Code2 size={14} /> pipeline.yml
                                </span>
                                <div className="pipeline-yaml-actions">
                                    <button className="repo-action-btn" onClick={() => setShowSaveModal(true)} title="Save to Project">
                                        <Save size={13} /> Save to Project
                                    </button>
                                    <button className="repo-action-btn" onClick={handleCopy} title="Copy">
                                        {copied ? <Check size={13} className="repo-save-ok" /> : <Copy size={13} />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                    <button className="repo-action-btn" onClick={handleDownload} title="Download">
                                        <Download size={13} /> Download
                                    </button>
                                    <button className="repo-action-btn" onClick={() => setShowYaml(false)} title="Close">
                                        <X size={13} />
                                    </button>
                                </div>
                            </div>
                            <pre className="pipeline-yaml-content"><code>{yaml}</code></pre>
                        </div>
                    )}

                    {showSaveModal && (
                        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
                            <div className="card modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                                <div className="modal-header">
                                    <h3 className="modal-title">Save Pipeline</h3>
                                    <button className="modal-close btn" onClick={() => setShowSaveModal(false)}><X size={18} /></button>
                                </div>
                                <form onSubmit={handleSaveSubmit} className="modal-form">
                                    <label className="form-label">Pipeline Name</label>
                                    <input 
                                        required 
                                        className="modal-input" 
                                        value={pipelineName} 
                                        onChange={e => setPipelineName(e.target.value)} 
                                        placeholder="e.g. Production CI"
                                    />
                                    
                                    <label className="form-label" style={{ marginTop: '10px' }}>Target Project</label>
                                    <select 
                                        required 
                                        className="modal-input modal-select" 
                                        value={selectedProjectId} 
                                        onChange={e => setSelectedProjectId(e.target.value)}
                                    >
                                        <option value="" disabled>Select a project...</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    
                                    <div className="modal-actions" style={{ marginTop: '20px' }}>
                                        <button type="button" className="btn" onClick={() => setShowSaveModal(false)}>Cancel</button>
                                        <button type="submit" className="btn btn-primary" disabled={isSaving || !selectedProjectId}>
                                            {isSaving ? 'Saving...' : 'Save Pipeline'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Terminal Drawer */}
                    {showTerminal && (
                        <div className="pipeline-terminal-drawer">
                            <div className="pipeline-terminal-header">
                                <span>Pipeline Execution Logs</span>
                                <button onClick={() => setShowTerminal(false)} className="btn" style={{ padding: '4px' }}>
                                    <X size={14}/>
                                </button>
                            </div>
                            <div className="pipeline-terminal-body" ref={terminalBodyRef}>
                                {executionLogs}
                                {isExecuting && <div className="blinking-cursor"></div>}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
