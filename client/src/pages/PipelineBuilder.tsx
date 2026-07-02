import { useState, useCallback, useRef } from 'react';
import {
    ReactFlow, Background, Controls, MiniMap,
    addEdge, useNodesState, useEdgesState, Handle, Position,
    type Node, type Edge, type Connection, type NodeProps,
    BackgroundVariant, Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    Play, TestTube2, Package, Cloud, Shield, Database,
    Bell, Code2, Download, Copy, Check, Plus, Trash2, Zap, X
} from 'lucide-react';

// ── Node type definitions ────────────────────────────
export type PipelineNodeType =
    | 'trigger' | 'test' | 'build' | 'deploy' | 'security'
    | 'database' | 'notify' | 'lint' | 'docker';

interface PipelineNodeData {
    label: string;
    type: PipelineNodeType;
    config: Record<string, string>;
    [key: string]: unknown;
}

const NODE_CONFIGS: Record<PipelineNodeType, {
    icon: React.ReactNode; color: string; bgColor: string;
    defaultConfig: Record<string, string>; description: string;
}> = {
    trigger: { icon: <Zap size={14} />, color: '#f0c040', bgColor: 'rgba(240,192,64,0.12)', defaultConfig: { on: 'push', branches: 'main' }, description: 'Trigger workflow on events' },
    lint: { icon: <Code2 size={14} />, color: '#58a6ff', bgColor: 'rgba(88,166,255,0.12)', defaultConfig: { command: 'npm run lint', runs_on: 'ubuntu-latest' }, description: 'Run linting checks' },
    test: { icon: <TestTube2 size={14} />, color: '#3fb950', bgColor: 'rgba(63,185,80,0.12)', defaultConfig: { command: 'npm test', runs_on: 'ubuntu-latest', coverage: 'true' }, description: 'Run test suite' },
    security: { icon: <Shield size={14} />, color: '#f97316', bgColor: 'rgba(249,115,22,0.12)', defaultConfig: { scanner: 'snyk', fail_on: 'high' }, description: 'Security vulnerability scan' },
    build: { icon: <Package size={14} />, color: '#bc8cff', bgColor: 'rgba(188,140,255,0.12)', defaultConfig: { command: 'npm run build', artifact: 'dist/' }, description: 'Build production bundle' },
    docker: { icon: <Database size={14} />, color: '#29b6f6', bgColor: 'rgba(41,182,246,0.12)', defaultConfig: { image: 'node:20-alpine', tag: '${{ github.sha }}' }, description: 'Build & push Docker image' },
    database: { icon: <Database size={14} />, color: '#e38c00', bgColor: 'rgba(227,140,0,0.12)', defaultConfig: { command: 'prisma migrate deploy', env: 'production' }, description: 'Run DB migrations' },
    deploy: { icon: <Cloud size={14} />, color: '#f48fb1', bgColor: 'rgba(244,143,177,0.12)', defaultConfig: { target: 'AWS ECS', region: 'us-east-1', environment: 'production' }, description: 'Deploy to cloud provider' },
    notify: { icon: <Bell size={14} />, color: '#78909c', bgColor: 'rgba(120,144,156,0.12)', defaultConfig: { channel: '#deployments', on: 'success,failure' }, description: 'Send Slack/Discord notification' },
};

// ── Custom Node Component ────────────────────────────
function PipelineNode({ data, selected }: NodeProps) {
    const nodeData = data as PipelineNodeData;
    const config = NODE_CONFIGS[nodeData.type];
    if (!config) return null;

    return (
        <div className={`pipeline-node ${selected ? 'pipeline-node-selected' : ''}`}
            style={{ borderColor: config.color, background: config.bgColor }}>
            <Handle type="target" position={Position.Top} className="pipeline-handle" />
            <div className="pipeline-node-header" style={{ color: config.color }}>
                {config.icon}
                <span className="pipeline-node-label">{nodeData.label}</span>
            </div>
            <div className="pipeline-node-desc">{config.description}</div>
            <div className="pipeline-node-config">
                {Object.entries(nodeData.config).slice(0, 2).map(([k, v]) => (
                    <div key={k} className="pipeline-config-row">
                        <span className="pipeline-config-key">{k}:</span>
                        <span className="pipeline-config-val" title={v}>{v}</span>
                    </div>
                ))}
            </div>
            <Handle type="source" position={Position.Bottom} className="pipeline-handle" />
        </div>
    );
}

const nodeTypes = { pipelineNode: PipelineNode };

// ── YAML Generation ──────────────────────────────────
function generateYAML(nodes: Node[], edges: Edge[]): string {
    const nodeMap = new Map<string, Node>(nodes.map(n => [n.id, n]));

    // Find trigger node
    const triggerNode = nodes.find(n => (n.data as PipelineNodeData).type === 'trigger');
    const triggerData = (triggerNode?.data as PipelineNodeData)?.config;

    const jobs: string[] = [];

    // Build adjacency for ordering
    for (const node of nodes) {
        const d = node.data as PipelineNodeData;
        if (d.type === 'trigger') continue;
        const cfg = d.config;

        const dependsOn = edges
            .filter(e => e.target === node.id)
            .map(e => {
                const srcNode = nodeMap.get(e.source);
                if (!srcNode) return null;
                const srcData = srcNode.data as PipelineNodeData;
                if (srcData.type === 'trigger') return null;
                return srcData.label.toLowerCase().replace(/\s+/g, '_');
            })
            .filter(Boolean);

        const jobName = d.label.toLowerCase().replace(/\s+/g, '_');
        const runsOn = cfg.runs_on || 'ubuntu-latest';

        let steps = '';
        if (d.type === 'test') {
            steps = `      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: ${cfg.command || 'npm test'}`;
        } else if (d.type === 'build') {
            steps = `      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: ${cfg.command || 'npm run build'}
      - uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: ${cfg.artifact || 'dist/'}`;
        } else if (d.type === 'lint') {
            steps = `      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: ${cfg.command || 'npm run lint'}`;
        } else if (d.type === 'security') {
            steps = `      - uses: actions/checkout@v4
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=${cfg.fail_on || 'high'}`;
        } else if (d.type === 'docker') {
            steps = `      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          username: \${{ secrets.DOCKER_USERNAME }}
          password: \${{ secrets.DOCKER_PASSWORD }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ${cfg.image || 'app'}:${cfg.tag || 'latest'}`;
        } else if (d.type === 'deploy') {
            steps = `      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-region: ${cfg.region || 'us-east-1'}
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
      - run: |
          aws ecs update-service \\
            --cluster production \\
            --service ${cfg.target?.toLowerCase().replace(/\s+/g, '-') || 'app'} \\
            --force-new-deployment`;
        } else if (d.type === 'database') {
            steps = `      - uses: actions/checkout@v4
      - run: npm ci
      - run: ${cfg.command || 'npx prisma migrate deploy'}
        env:
          DATABASE_URL: \${{ secrets.DATABASE_URL }}`;
        } else if (d.type === 'notify') {
            steps = `      - uses: 8398a7/action-slack@v3
        with:
          status: \${{ job.status }}
          channel: '${cfg.channel || '#deployments'}'
          webhook_url: \${{ secrets.SLACK_WEBHOOK_URL }}
        if: always()`;
        } else {
            steps = `      - uses: actions/checkout@v4
      - run: echo "Running ${d.label}"`;
        }

        jobs.push(`
  ${jobName}:
    runs-on: ${runsOn}${dependsOn.length > 0 ? `\n    needs: [${dependsOn.join(', ')}]` : ''}
    steps:
${steps}`);
    }

    const onEvents = (triggerData?.on || 'push').split(',').map((e: string) => e.trim());
    const branches = (triggerData?.branches || 'main').split(',').map((b: string) => b.trim());

    const eventsYaml = onEvents.length === 1 && onEvents[0] === 'push'
        ? `on:\n  push:\n    branches: [${branches.join(', ')}]`
        : `on:\n  ${onEvents.map((e: string) => `${e}:\n    branches: [${branches.join(', ')}]`).join('\n  ')}`;

    return `name: CI/CD Pipeline

${eventsYaml}

jobs:${jobs.join('\n')}
`;
}

// ── Toolbar ──────────────────────────────────────────
const PALETTE_ITEMS: { type: PipelineNodeType; label: string }[] = [
    { type: 'trigger', label: 'Trigger' },
    { type: 'lint', label: 'Lint' },
    { type: 'test', label: 'Test' },
    { type: 'security', label: 'Security Scan' },
    { type: 'build', label: 'Build' },
    { type: 'docker', label: 'Docker Build' },
    { type: 'database', label: 'DB Migrate' },
    { type: 'deploy', label: 'Deploy' },
    { type: 'notify', label: 'Notify' },
];

// ── Initial sample pipeline ──────────────────────────
const INIT_NODES: Node[] = [
    { id: '1', type: 'pipelineNode', position: { x: 300, y: 30 }, data: { label: 'Trigger', type: 'trigger', config: { on: 'push', branches: 'main, develop' } } },
    { id: '2', type: 'pipelineNode', position: { x: 80, y: 180 }, data: { label: 'Lint', type: 'lint', config: { command: 'npm run lint', runs_on: 'ubuntu-latest' } } },
    { id: '3', type: 'pipelineNode', position: { x: 320, y: 180 }, data: { label: 'Unit Tests', type: 'test', config: { command: 'npm test -- --coverage', runs_on: 'ubuntu-latest' } } },
    { id: '4', type: 'pipelineNode', position: { x: 560, y: 180 }, data: { label: 'Security Scan', type: 'security', config: { scanner: 'snyk', fail_on: 'high' } } },
    { id: '5', type: 'pipelineNode', position: { x: 300, y: 340 }, data: { label: 'Build', type: 'build', config: { command: 'npm run build', artifact: 'dist/' } } },
    { id: '6', type: 'pipelineNode', position: { x: 120, y: 490 }, data: { label: 'Docker Build', type: 'docker', config: { image: 'nexus-app', tag: '${{ github.sha }}' } } },
    { id: '7', type: 'pipelineNode', position: { x: 380, y: 490 }, data: { label: 'DB Migrate', type: 'database', config: { command: 'npx prisma migrate deploy', env: 'production' } } },
    { id: '8', type: 'pipelineNode', position: { x: 250, y: 640 }, data: { label: 'Deploy to AWS', type: 'deploy', config: { target: 'AWS ECS', region: 'us-east-1', environment: 'production' } } },
    { id: '9', type: 'pipelineNode', position: { x: 250, y: 790 }, data: { label: 'Notify Team', type: 'notify', config: { channel: '#deployments', on: 'success,failure' } } },
];

const INIT_EDGES: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: true },
    { id: 'e1-3', source: '1', target: '3', type: 'smoothstep', animated: true },
    { id: 'e1-4', source: '1', target: '4', type: 'smoothstep', animated: true },
    { id: 'e2-5', source: '2', target: '5', type: 'smoothstep', animated: true },
    { id: 'e3-5', source: '3', target: '5', type: 'smoothstep', animated: true },
    { id: 'e4-5', source: '4', target: '5', type: 'smoothstep', animated: true },
    { id: 'e5-6', source: '5', target: '6', type: 'smoothstep', animated: true },
    { id: 'e5-7', source: '5', target: '7', type: 'smoothstep', animated: true },
    { id: 'e6-8', source: '6', target: '8', type: 'smoothstep', animated: true },
    { id: 'e7-8', source: '7', target: '8', type: 'smoothstep', animated: true },
    { id: 'e8-9', source: '8', target: '9', type: 'smoothstep', animated: true },
];

// ── Main Component ───────────────────────────────────
export default function PipelineBuilder() {
    const [nodes, setNodes, onNodesChange] = useNodesState(INIT_NODES);
    const [edges, setEdges, onEdgesChange] = useEdgesState(INIT_EDGES);
    const [showYaml, setShowYaml] = useState(false);
    const [yaml, setYaml] = useState('');
    const [copied, setCopied] = useState(false);
    const [nodeCounter, setNodeCounter] = useState(INIT_NODES.length + 1);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    const onConnect = useCallback((params: Connection) => {
        setEdges(eds => addEdge({ ...params, type: 'smoothstep', animated: true }, eds));
    }, [setEdges]);

    const addNode = (type: PipelineNodeType, label: string) => {
        const id = String(nodeCounter + 1);
        const config = NODE_CONFIGS[type].defaultConfig;
        const newNode: Node = {
            id,
            type: 'pipelineNode',
            position: { x: 100 + Math.random() * 400, y: 100 + Math.random() * 300 },
            data: { label, type, config },
        };
        setNodes(nds => [...nds, newNode]);
        setNodeCounter(c => c + 1);
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

    return (
        <div className="pipeline-layout">
            {/* Left palette */}
            <div className="pipeline-palette">
                <div className="pipeline-palette-title">
                    <Zap size={14} /> Pipeline Nodes
                </div>
                <div className="pipeline-palette-list">
                    {PALETTE_ITEMS.map(item => {
                        const cfg = NODE_CONFIGS[item.type];
                        return (
                            <button
                                key={item.type}
                                className="pipeline-palette-item"
                                style={{ borderColor: cfg.color, background: cfg.bgColor, color: cfg.color }}
                                onClick={() => addNode(item.type, item.label)}
                                title={cfg.description}
                            >
                                {cfg.icon}
                                <span>{item.label}</span>
                                <Plus size={11} className="pipeline-palette-plus" />
                            </button>
                        );
                    })}
                </div>
                <div className="pipeline-palette-hint">
                    Drag nodes to rearrange. Connect by dragging from node handles.
                </div>
            </div>

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
                    defaultEdgeOptions={{ type: 'smoothstep', animated: true }}
                    style={{ background: 'var(--bg-primary)' }}
                >
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border-subtle)" />
                    <Controls className="pipeline-flow-controls" />
                    <MiniMap
                        className="pipeline-minimap"
                        nodeColor={(n) => {
                            const d = n.data as PipelineNodeData;
                            return NODE_CONFIGS[d.type]?.color || '#8b949e';
                        }}
                        maskColor="rgba(13,17,23,0.7)"
                    />
                    <Panel position="top-right">
                        <div className="pipeline-top-actions">
                            <button className="btn" onClick={() => { setNodes([]); setEdges([]); }} title="Clear canvas">
                                <Trash2 size={14} /> Clear
                            </button>
                            <button className="btn btn-primary" onClick={handleGenerateYaml}>
                                <Play size={14} /> Generate YAML
                            </button>
                        </div>
                    </Panel>
                </ReactFlow>
            </div>

            {/* YAML Panel */}
            {showYaml && (
                <div className="pipeline-yaml-panel">
                    <div className="pipeline-yaml-header">
                        <span className="pipeline-yaml-title">
                            <Code2 size={14} /> pipeline.yml
                        </span>
                        <div className="pipeline-yaml-actions">
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
        </div>
    );
}
