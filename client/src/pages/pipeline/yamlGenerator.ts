import { type Node, type Edge } from '@xyflow/react';

export function generateYAML(nodes: Node[], edges: Edge[]): string {
    const nodeMap = new Map<string, Node>(nodes.map(n => [n.id, n]));

    // Find trigger node (assume first node with category Triggers or type that matches trigger)
    const triggerNode = nodes.find(n => {
        const type = (n.data as any).type as string;
        return ['github_push', 'github_pr', 'cron_schedule', 'webhook', 'manual_dispatch', 'trigger'].includes(type);
    });
    const triggerData = (triggerNode?.data as any)?.config || {};
    const triggerType = (triggerNode?.data as any)?.type;

    const jobs: string[] = [];

    // Build adjacency for ordering
    for (const node of nodes) {
        const d = node.data as any;
        // Skip trigger nodes for job generation
        if (['github_push', 'github_pr', 'cron_schedule', 'webhook', 'manual_dispatch', 'trigger'].includes(d.type)) {
            continue;
        }

        const cfg = d.config || {};

        const dependsOn = edges
            .filter(e => e.target === node.id)
            .map(e => {
                const srcNode = nodeMap.get(e.source);
                if (!srcNode) return null;
                const srcData = srcNode.data as any;
                if (['github_push', 'github_pr', 'cron_schedule', 'webhook', 'manual_dispatch', 'trigger'].includes(srcData.type)) return null;
                return srcData.label.toLowerCase().replace(/[^a-z0-9_]/g, '_');
            })
            .filter(Boolean);

        const jobName = d.label.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const runsOn = cfg.runs_on || 'ubuntu-latest';

        let steps = '';
        
        switch (d.type) {
            // Build
            case 'npm_build':
            case 'yarn_build':
            case 'build':
                steps = `      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '${cfg.node_version || '20'}'
          cache: '${d.type === 'yarn_build' ? 'yarn' : 'npm'}'
      - run: ${d.type === 'yarn_build' ? 'yarn install' : 'npm ci'}
      - run: ${cfg.command || 'npm run build'}
${cfg.artifact ? `      - uses: actions/upload-artifact@v4\n        with:\n          name: build-artifacts\n          path: ${cfg.artifact}` : ''}`;
                break;
            case 'maven_build':
                steps = `      - uses: actions/checkout@v4
      - uses: actions/setup-java@v3
        with:
          java-version: '${cfg.java_version || '17'}'
          distribution: 'temurin'
          cache: maven
      - run: ${cfg.command || 'mvn clean package -DskipTests'}`;
                break;
            case 'gradle_build':
                steps = `      - uses: actions/checkout@v4
      - uses: actions/setup-java@v3
        with:
          java-version: '${cfg.java_version || '17'}'
          distribution: 'temurin'
      - uses: gradle/gradle-build-action@v2
      - run: ${cfg.command || './gradlew build -x test'}`;
                break;
            case 'go_build':
                steps = `      - uses: actions/checkout@v4
      - uses: actions/setup-go@v4
        with:
          go-version: '${cfg.go_version || '1.21'}'
      - run: ${cfg.command || 'go build -o app .'}`;
                break;
            case 'rust_cargo_build':
                steps = `      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: ${cfg.command || 'cargo build --release'}`;
                break;
            case 'python_pip':
                steps = `      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '${cfg.python_version || '3.11'}'
          cache: 'pip'
      - run: pip install -r ${cfg.req_file || 'requirements.txt'}`;
                break;

            // Test
            case 'jest_test':
            case 'test':
                steps = `      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: ${cfg.command || 'npm run test'}`;
                break;
            case 'pytest':
                steps = `      - uses: actions/checkout@v4
      - run: pip install -r requirements.txt pytest
      - run: ${cfg.command || 'pytest'}`;
                break;
            case 'junit_test':
                steps = `      - uses: actions/checkout@v4
      - run: ${cfg.command || 'mvn test'}`;
                break;
            case 'cypress_e2e':
                steps = `      - uses: actions/checkout@v4
      - uses: cypress-io/github-action@v6
        with:
          browser: ${cfg.browser || 'chrome'}`;
                break;
            case 'playwright_e2e':
                steps = `      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: ${cfg.command || 'npx playwright test'}`;
                break;
            case 'go_test':
                steps = `      - uses: actions/checkout@v4
      - run: ${cfg.command || 'go test -v ./...'}`;
                break;

            // Security
            case 'snyk_scan':
            case 'security':
                steps = `      - uses: actions/checkout@v4
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=${cfg.fail_on || 'high'}`;
                break;
            case 'sonarqube':
                steps = `      - uses: actions/checkout@v4
      - uses: sonarsource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: \${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: \${{ secrets.SONAR_HOST_URL }}
        with:
          args: -Dsonar.projectKey=${cfg.project_key || 'my-project'}`;
                break;
            case 'trivy_scan':
                steps = `      - uses: actions/checkout@v4
      - uses: aquasecurity/trivy-action@master
        with:
          image-ref: '${cfg.image || 'my-app:latest'}'
          format: 'table'
          exit-code: '1'
          ignore-unfixed: true
          vuln-type: 'os,library'
          severity: 'CRITICAL,HIGH'`;
                break;
            case 'owasp_zap':
                steps = `      - uses: actions/checkout@v4
      - name: ZAP Scan
        uses: zaproxy/action-baseline@v0.10.0
        with:
          target: '${cfg.target_url || 'http://localhost:8080'}'`;
                break;

            // Docker & Cloud
            case 'docker_build_push':
            case 'docker':
                steps = `      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          username: \${{ secrets.DOCKER_USERNAME }}
          password: \${{ secrets.DOCKER_PASSWORD }}
          registry: ${cfg.registry || 'docker.io'}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ${cfg.image || 'app'}:${cfg.tag || 'latest'}`;
                break;
            case 'aws_ecr_login':
                steps = `      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-region: ${cfg.region || 'us-east-1'}
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
      - uses: aws-actions/amazon-ecr-login@v2`;
                break;
            case 'terraform_plan':
                steps = `      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform init
        working-directory: ${cfg.dir || './infra'}
      - run: terraform plan
        working-directory: ${cfg.dir || './infra'}`;
                break;
            case 'terraform_apply':
                steps = `      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform init
        working-directory: ${cfg.dir || './infra'}
      - run: terraform apply ${cfg.auto_approve === 'true' ? '-auto-approve' : ''}
        working-directory: ${cfg.dir || './infra'}`;
                break;

            // Database
            case 'prisma_migrate':
            case 'database':
                steps = `      - uses: actions/checkout@v4
      - run: npm ci
      - run: ${cfg.command || 'npx prisma migrate deploy'}
        env:
          DATABASE_URL: \${{ secrets.DATABASE_URL }}`;
                break;
            case 'flyway_migrate':
                steps = `      - uses: actions/checkout@v4
      - run: ${cfg.command || 'flyway migrate'}
        env:
          FLYWAY_URL: \${{ secrets.FLYWAY_URL }}
          FLYWAY_USER: \${{ secrets.FLYWAY_USER }}
          FLYWAY_PASSWORD: \${{ secrets.FLYWAY_PASSWORD }}`;
                break;

            // Deploy
            case 'aws_ecs_deploy':
            case 'deploy':
                steps = `      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-region: ${cfg.region || 'us-east-1'}
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
      - run: |
          aws ecs update-service \\
            --cluster ${cfg.cluster || 'production-cluster'} \\
            --service ${cfg.service || 'api-service'} \\
            --force-new-deployment`;
                break;
            case 'aws_s3_sync':
                steps = `      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-region: \${{ secrets.AWS_REGION }}
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
      - run: aws s3 sync ${cfg.source || 'dist/'} s3://${cfg.bucket || 'my-bucket-name'} --delete`;
                break;
            case 'vercel_deploy':
                steps = `      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          ${cfg.production === 'true' ? 'vercel-args: "--prod"' : ''}`;
                break;
            case 'kubectl_apply':
                steps = `      - uses: actions/checkout@v4
      - uses: azure/setup-kubectl@v3
      - run: kubectl apply -f ${cfg.manifests || 'k8s/'}`;
                break;
            case 'azure_web_apps':
                steps = `      - uses: actions/checkout@v4
      - uses: azure/webapps-deploy@v2
        with:
          app-name: ${cfg.app_name || 'my-azure-app'}
          publish-profile: \${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}`;
                break;

            // Notify & Utils
            case 'slack_notify':
            case 'notify':
                steps = `      - uses: 8398a7/action-slack@v3
        with:
          status: \${{ job.status }}
          channel: '${cfg.channel || '#deployments'}'
          webhook_url: \${{ secrets.SLACK_WEBHOOK_URL }}
        if: ${cfg.on_status === 'always' ? 'always()' : cfg.on_status === 'failure' ? 'failure()' : 'success()'}`;
                break;
            case 'discord_notify':
                steps = `      - uses: tsickert/discord-webhook@v5.3.0
        with:
          webhook-url: \${{ secrets.${cfg.webhook_url || 'DISCORD_WEBHOOK'} }}
          content: "Deployment status: \${{ job.status }}"`;
                break;
            case 'sendgrid_email':
                steps = `      - uses: dawidd6/action-send-mail@v3
        with:
          server_address: smtp.sendgrid.net
          server_port: 465
          username: apikey
          password: \${{ secrets.SENDGRID_API_KEY }}
          subject: ${cfg.subject || 'Deployment Status'}
          to: ${cfg.to || 'devops@company.com'}
          from: GitHub Actions <noreply@github.com>
          body: "Job completed with status: \${{ job.status }}"`;
                break;
            case 'jira_transition':
                steps = `      - uses: atlassian/gajira-login@v3
        env:
          JIRA_BASE_URL: \${{ secrets.JIRA_BASE_URL }}
          JIRA_USER_EMAIL: \${{ secrets.JIRA_USER_EMAIL }}
          JIRA_API_TOKEN: \${{ secrets.JIRA_API_TOKEN }}
      - uses: atlassian/gajira-transition@v2
        with:
          issue: \${{ env.JIRA_ISSUE }}
          transition: "${cfg.transition || 'Done'}"`;
                break;
            case 'github_release':
                steps = `      - uses: actions/checkout@v4
      - uses: softprops/action-gh-release@v1
        with:
          tag_name: ${cfg.tag_name || '${{ github.ref }}'}`;
                break;
            case 'cache_dependencies':
                steps = `      - uses: actions/cache@v3
        with:
          path: ${cfg.path || '~/.npm'}
          key: \${{ runner.os }}-deps-\${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            \${{ runner.os }}-deps-`;
                break;
                
            // Fallback
            default:
                steps = `      - uses: actions/checkout@v4
      - run: echo "Running ${d.label}"`;
        }

        jobs.push(`
  ${jobName}:
    runs-on: ${runsOn}${dependsOn.length > 0 ? `\n    needs: [${dependsOn.join(', ')}]` : ''}
    steps:
${steps}`);
    }

    let eventsYaml = 'on:\n  push:\n    branches: [main]';
    
    if (triggerType === 'github_push') {
        const branches = (triggerData.branches || 'main').split(',').map((b: string) => b.trim());
        eventsYaml = `on:\n  push:\n    branches: [${branches.join(', ')}]`;
    } else if (triggerType === 'github_pr') {
        const branches = (triggerData.branches || 'main').split(',').map((b: string) => b.trim());
        eventsYaml = `on:\n  pull_request:\n    branches: [${branches.join(', ')}]`;
    } else if (triggerType === 'cron_schedule') {
        eventsYaml = `on:\n  schedule:\n    - cron: '${triggerData.cron || '0 0 * * *'}'`;
    } else if (triggerType === 'webhook') {
        eventsYaml = `on:\n  repository_dispatch:\n    types: [${triggerData.event_type || 'custom_event'}]`;
    } else if (triggerType === 'manual_dispatch') {
        eventsYaml = `on:\n  workflow_dispatch:`;
        // In a real app we could parse the JSON inputs here
    }

    return `name: CI/CD Pipeline

${eventsYaml}

jobs:${jobs.join('\n')}
`;
}
