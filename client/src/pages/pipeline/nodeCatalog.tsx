import React from 'react';
import {
    Github, Clock, Webhook, PlayCircle,
    Package, Terminal, Code2, TestTube2, TestTube,
    Shield, ShieldAlert, ShieldCheck, Lock, Database, Container, Cloud, Server,
    Layers, Cpu, Bell, MessageSquare, Mail, CheckSquare, Tag, Archive, HardDrive
} from 'lucide-react';

export type PipelineNodeCategory = 'Triggers' | 'Build' | 'Test' | 'Security' | 'Docker & Cloud' | 'Database' | 'Deploy' | 'Notify & Utils';

export interface NodeField {
    name: string;
    label: string;
    type: 'string' | 'select' | 'boolean';
    options?: string[];
    default: string;
}

export interface NodeConfigDef {
    type: string;
    category: PipelineNodeCategory;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    fields: NodeField[];
}

export const NODE_CATALOG: NodeConfigDef[] = [
    // ── Triggers ───────────────────────────────────────
    {
        type: 'github_push', category: 'Triggers', label: 'GitHub Push', description: 'Trigger on branch push',
        icon: <Github size={14} />, color: '#f0c040', bgColor: 'rgba(240,192,64,0.12)',
        fields: [{ name: 'branches', label: 'Branches (comma-separated)', type: 'string', default: 'main, master' }]
    },
    {
        type: 'github_pr', category: 'Triggers', label: 'Pull Request', description: 'Trigger on PR open/update',
        icon: <Github size={14} />, color: '#f0c040', bgColor: 'rgba(240,192,64,0.12)',
        fields: [{ name: 'branches', label: 'Target Branches', type: 'string', default: 'main, master' }]
    },
    {
        type: 'cron_schedule', category: 'Triggers', label: 'Cron Schedule', description: 'Trigger on a timer',
        icon: <Clock size={14} />, color: '#f0c040', bgColor: 'rgba(240,192,64,0.12)',
        fields: [{ name: 'cron', label: 'Cron Expression', type: 'string', default: '0 0 * * *' }]
    },
    {
        type: 'webhook', category: 'Triggers', label: 'Webhook', description: 'Trigger via HTTP POST',
        icon: <Webhook size={14} />, color: '#f0c040', bgColor: 'rgba(240,192,64,0.12)',
        fields: [{ name: 'event_type', label: 'Event Type', type: 'string', default: 'custom_event' }]
    },
    {
        type: 'manual_dispatch', category: 'Triggers', label: 'Manual Dispatch', description: 'Trigger manually from UI',
        icon: <PlayCircle size={14} />, color: '#f0c040', bgColor: 'rgba(240,192,64,0.12)',
        fields: [{ name: 'inputs', label: 'Workflow Inputs (JSON)', type: 'string', default: '{}' }]
    },

    // ── Build ──────────────────────────────────────────
    {
        type: 'npm_build', category: 'Build', label: 'NPM Build', description: 'Install & Build Node app',
        icon: <Package size={14} />, color: '#bc8cff', bgColor: 'rgba(188,140,255,0.12)',
        fields: [
            { name: 'node_version', label: 'Node Version', type: 'string', default: '20' },
            { name: 'command', label: 'Build Command', type: 'string', default: 'npm run build' },
            { name: 'artifact', label: 'Artifact Path', type: 'string', default: 'dist/' }
        ]
    },
    {
        type: 'yarn_build', category: 'Build', label: 'Yarn Build', description: 'Install & Build with Yarn',
        icon: <Package size={14} />, color: '#bc8cff', bgColor: 'rgba(188,140,255,0.12)',
        fields: [
            { name: 'node_version', label: 'Node Version', type: 'string', default: '20' },
            { name: 'command', label: 'Build Command', type: 'string', default: 'yarn build' }
        ]
    },
    {
        type: 'maven_build', category: 'Build', label: 'Maven Build', description: 'Build Java app with Maven',
        icon: <Terminal size={14} />, color: '#bc8cff', bgColor: 'rgba(188,140,255,0.12)',
        fields: [
            { name: 'java_version', label: 'Java Version', type: 'string', default: '17' },
            { name: 'command', label: 'Maven Command', type: 'string', default: 'mvn clean package -DskipTests' }
        ]
    },
    {
        type: 'gradle_build', category: 'Build', label: 'Gradle Build', description: 'Build Java app with Gradle',
        icon: <Terminal size={14} />, color: '#bc8cff', bgColor: 'rgba(188,140,255,0.12)',
        fields: [
            { name: 'java_version', label: 'Java Version', type: 'string', default: '17' },
            { name: 'command', label: 'Gradle Command', type: 'string', default: './gradlew build -x test' }
        ]
    },
    {
        type: 'go_build', category: 'Build', label: 'Go Build', description: 'Build Go binary',
        icon: <Code2 size={14} />, color: '#bc8cff', bgColor: 'rgba(188,140,255,0.12)',
        fields: [
            { name: 'go_version', label: 'Go Version', type: 'string', default: '1.21' },
            { name: 'command', label: 'Build Command', type: 'string', default: 'go build -o app .' }
        ]
    },
    {
        type: 'rust_cargo_build', category: 'Build', label: 'Rust Build', description: 'Cargo build release',
        icon: <Code2 size={14} />, color: '#bc8cff', bgColor: 'rgba(188,140,255,0.12)',
        fields: [{ name: 'command', label: 'Cargo Command', type: 'string', default: 'cargo build --release' }]
    },
    {
        type: 'python_pip', category: 'Build', label: 'Python PIP', description: 'Install dependencies',
        icon: <Terminal size={14} />, color: '#bc8cff', bgColor: 'rgba(188,140,255,0.12)',
        fields: [
            { name: 'python_version', label: 'Python Version', type: 'string', default: '3.11' },
            { name: 'req_file', label: 'Requirements File', type: 'string', default: 'requirements.txt' }
        ]
    },

    // ── Test ───────────────────────────────────────────
    {
        type: 'jest_test', category: 'Test', label: 'Jest Tests', description: 'Run JS/TS tests with Jest',
        icon: <TestTube2 size={14} />, color: '#3fb950', bgColor: 'rgba(63,185,80,0.12)',
        fields: [{ name: 'command', label: 'Test Command', type: 'string', default: 'npm run test' }]
    },
    {
        type: 'pytest', category: 'Test', label: 'PyTest', description: 'Run Python tests',
        icon: <TestTube2 size={14} />, color: '#3fb950', bgColor: 'rgba(63,185,80,0.12)',
        fields: [{ name: 'command', label: 'PyTest Command', type: 'string', default: 'pytest' }]
    },
    {
        type: 'junit_test', category: 'Test', label: 'JUnit Tests', description: 'Run Maven/Gradle tests',
        icon: <TestTube2 size={14} />, color: '#3fb950', bgColor: 'rgba(63,185,80,0.12)',
        fields: [{ name: 'command', label: 'Command', type: 'string', default: 'mvn test' }]
    },
    {
        type: 'cypress_e2e', category: 'Test', label: 'Cypress E2E', description: 'Run Cypress tests',
        icon: <TestTube size={14} />, color: '#3fb950', bgColor: 'rgba(63,185,80,0.12)',
        fields: [{ name: 'browser', label: 'Browser', type: 'select', options: ['chrome', 'firefox', 'electron'], default: 'chrome' }]
    },
    {
        type: 'playwright_e2e', category: 'Test', label: 'Playwright', description: 'Run Playwright E2E tests',
        icon: <TestTube size={14} />, color: '#3fb950', bgColor: 'rgba(63,185,80,0.12)',
        fields: [{ name: 'command', label: 'Command', type: 'string', default: 'npx playwright test' }]
    },
    {
        type: 'go_test', category: 'Test', label: 'Go Test', description: 'Run go test suite',
        icon: <TestTube2 size={14} />, color: '#3fb950', bgColor: 'rgba(63,185,80,0.12)',
        fields: [{ name: 'command', label: 'Command', type: 'string', default: 'go test -v ./...' }]
    },

    // ── Security ───────────────────────────────────────
    {
        type: 'snyk_scan', category: 'Security', label: 'Snyk Scan', description: 'SAST & dependency scan',
        icon: <Shield size={14} />, color: '#f97316', bgColor: 'rgba(249,115,22,0.12)',
        fields: [{ name: 'fail_on', label: 'Fail on severity', type: 'select', options: ['low', 'medium', 'high', 'critical'], default: 'high' }]
    },
    {
        type: 'sonarqube', category: 'Security', label: 'SonarQube', description: 'Code quality and security',
        icon: <ShieldCheck size={14} />, color: '#f97316', bgColor: 'rgba(249,115,22,0.12)',
        fields: [{ name: 'project_key', label: 'Project Key', type: 'string', default: 'my-project' }]
    },
    {
        type: 'trivy_scan', category: 'Security', label: 'Trivy Scan', description: 'Container vulnerability scan',
        icon: <ShieldAlert size={14} />, color: '#f97316', bgColor: 'rgba(249,115,22,0.12)',
        fields: [{ name: 'image', label: 'Image to Scan', type: 'string', default: 'my-app:latest' }]
    },
    {
        type: 'owasp_zap', category: 'Security', label: 'OWASP ZAP', description: 'DAST baseline scan',
        icon: <Lock size={14} />, color: '#f97316', bgColor: 'rgba(249,115,22,0.12)',
        fields: [{ name: 'target_url', label: 'Target URL', type: 'string', default: 'http://localhost:8080' }]
    },

    // ── Docker & Cloud ─────────────────────────────────
    {
        type: 'docker_build_push', category: 'Docker & Cloud', label: 'Docker Build & Push', description: 'Build and push to registry',
        icon: <Container size={14} />, color: '#29b6f6', bgColor: 'rgba(41,182,246,0.12)',
        fields: [
            { name: 'image', label: 'Image Name', type: 'string', default: 'my-app' },
            { name: 'tag', label: 'Tag', type: 'string', default: '${{ github.sha }}' },
            { name: 'registry', label: 'Registry URL', type: 'string', default: 'docker.io' }
        ]
    },
    {
        type: 'aws_ecr_login', category: 'Docker & Cloud', label: 'AWS ECR Login', description: 'Authenticate with ECR',
        icon: <Cloud size={14} />, color: '#29b6f6', bgColor: 'rgba(41,182,246,0.12)',
        fields: [{ name: 'region', label: 'AWS Region', type: 'string', default: 'us-east-1' }]
    },
    {
        type: 'terraform_plan', category: 'Docker & Cloud', label: 'Terraform Plan', description: 'Generate TF execution plan',
        icon: <Layers size={14} />, color: '#29b6f6', bgColor: 'rgba(41,182,246,0.12)',
        fields: [{ name: 'dir', label: 'Working Directory', type: 'string', default: './infra' }]
    },
    {
        type: 'terraform_apply', category: 'Docker & Cloud', label: 'Terraform Apply', description: 'Apply TF execution plan',
        icon: <Layers size={14} />, color: '#29b6f6', bgColor: 'rgba(41,182,246,0.12)',
        fields: [
            { name: 'dir', label: 'Working Directory', type: 'string', default: './infra' },
            { name: 'auto_approve', label: 'Auto Approve', type: 'boolean', default: 'true' }
        ]
    },

    // ── Database ───────────────────────────────────────
    {
        type: 'prisma_migrate', category: 'Database', label: 'Prisma Migrate', description: 'Apply DB migrations',
        icon: <Database size={14} />, color: '#e38c00', bgColor: 'rgba(227,140,0,0.12)',
        fields: [{ name: 'command', label: 'Command', type: 'string', default: 'npx prisma migrate deploy' }]
    },
    {
        type: 'flyway_migrate', category: 'Database', label: 'Flyway Migrate', description: 'Run Flyway migrations',
        icon: <Database size={14} />, color: '#e38c00', bgColor: 'rgba(227,140,0,0.12)',
        fields: [{ name: 'command', label: 'Command', type: 'string', default: 'flyway migrate' }]
    },

    // ── Deploy ─────────────────────────────────────────
    {
        type: 'aws_ecs_deploy', category: 'Deploy', label: 'AWS ECS Deploy', description: 'Update ECS service',
        icon: <Server size={14} />, color: '#f48fb1', bgColor: 'rgba(244,143,177,0.12)',
        fields: [
            { name: 'cluster', label: 'Cluster Name', type: 'string', default: 'production-cluster' },
            { name: 'service', label: 'Service Name', type: 'string', default: 'api-service' },
            { name: 'region', label: 'AWS Region', type: 'string', default: 'us-east-1' }
        ]
    },
    {
        type: 'aws_s3_sync', category: 'Deploy', label: 'AWS S3 Sync', description: 'Sync static files to S3',
        icon: <HardDrive size={14} />, color: '#f48fb1', bgColor: 'rgba(244,143,177,0.12)',
        fields: [
            { name: 'source', label: 'Source Directory', type: 'string', default: 'dist/' },
            { name: 'bucket', label: 'S3 Bucket Name', type: 'string', default: 'my-bucket-name' }
        ]
    },
    {
        type: 'vercel_deploy', category: 'Deploy', label: 'Vercel Deploy', description: 'Deploy app to Vercel',
        icon: <Cloud size={14} />, color: '#f48fb1', bgColor: 'rgba(244,143,177,0.12)',
        fields: [{ name: 'production', label: 'Deploy to Production', type: 'boolean', default: 'true' }]
    },
    {
        type: 'kubectl_apply', category: 'Deploy', label: 'Kubectl Apply', description: 'Apply K8s manifests',
        icon: <Cpu size={14} />, color: '#f48fb1', bgColor: 'rgba(244,143,177,0.12)',
        fields: [{ name: 'manifests', label: 'Manifest Path', type: 'string', default: 'k8s/' }]
    },
    {
        type: 'azure_web_apps', category: 'Deploy', label: 'Azure Web Apps', description: 'Deploy to Azure',
        icon: <Cloud size={14} />, color: '#f48fb1', bgColor: 'rgba(244,143,177,0.12)',
        fields: [{ name: 'app_name', label: 'App Name', type: 'string', default: 'my-azure-app' }]
    },

    // ── Notify & Utils ─────────────────────────────────
    {
        type: 'slack_notify', category: 'Notify & Utils', label: 'Slack Notify', description: 'Send Slack message',
        icon: <Bell size={14} />, color: '#78909c', bgColor: 'rgba(120,144,156,0.12)',
        fields: [
            { name: 'channel', label: 'Channel', type: 'string', default: '#deployments' },
            { name: 'on_status', label: 'Trigger On', type: 'select', options: ['success', 'failure', 'always'], default: 'always' }
        ]
    },
    {
        type: 'discord_notify', category: 'Notify & Utils', label: 'Discord Notify', description: 'Send Discord webhook',
        icon: <MessageSquare size={14} />, color: '#78909c', bgColor: 'rgba(120,144,156,0.12)',
        fields: [{ name: 'webhook_url', label: 'Webhook Secret Var', type: 'string', default: 'DISCORD_WEBHOOK' }]
    },
    {
        type: 'sendgrid_email', category: 'Notify & Utils', label: 'SendGrid Email', description: 'Send email notification',
        icon: <Mail size={14} />, color: '#78909c', bgColor: 'rgba(120,144,156,0.12)',
        fields: [
            { name: 'to', label: 'To Email', type: 'string', default: 'devops@company.com' },
            { name: 'subject', label: 'Subject', type: 'string', default: 'Deployment Status' }
        ]
    },
    {
        type: 'jira_transition', category: 'Notify & Utils', label: 'Jira Transition', description: 'Move Jira ticket',
        icon: <CheckSquare size={14} />, color: '#78909c', bgColor: 'rgba(120,144,156,0.12)',
        fields: [{ name: 'transition', label: 'Transition Name', type: 'string', default: 'Done' }]
    },
    {
        type: 'github_release', category: 'Notify & Utils', label: 'GitHub Release', description: 'Create GH release',
        icon: <Tag size={14} />, color: '#78909c', bgColor: 'rgba(120,144,156,0.12)',
        fields: [{ name: 'tag_name', label: 'Tag Name', type: 'string', default: '${{ github.ref }}' }]
    },
    {
        type: 'cache_dependencies', category: 'Notify & Utils', label: 'Cache Deps', description: 'Cache actions/cache',
        icon: <Archive size={14} />, color: '#78909c', bgColor: 'rgba(120,144,156,0.12)',
        fields: [{ name: 'path', label: 'Path to Cache', type: 'string', default: '~/.npm' }]
    }
];

// Helper to extract default config for a node type
export function getDefaultConfig(type: string): Record<string, string> {
    const node = NODE_CATALOG.find(n => n.type === type);
    if (!node) return {};
    return node.fields.reduce((acc, field) => {
        acc[field.name] = field.default;
        return acc;
    }, {} as Record<string, string>);
}
