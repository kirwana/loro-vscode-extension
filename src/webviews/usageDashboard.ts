import * as vscode from 'vscode';
import { TemplateService } from '../templates/templateService';
import { UsageInfo } from '../types';

export class UsageDashboard {
    private panel: vscode.WebviewPanel | undefined;

    constructor(
        private context: vscode.ExtensionContext,
        private templateService: TemplateService
    ) {}

    public async show(): Promise<void> {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            await this.updateContent();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'loroUsageDashboard',
            'Loro Templates - Usage Dashboard',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.context.extensionUri, 'resources')
                ]
            }
        );

        // Handle panel disposal
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        }, null, this.context.subscriptions);

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'refresh':
                        await this.updateContent();
                        break;
                    case 'upgrade':
                        await this.handleUpgrade();
                        break;
                    case 'openBilling':
                        await this.openBillingDashboard();
                        break;
                }
            },
            null,
            this.context.subscriptions
        );

        await this.updateContent();
    }

    private async updateContent(): Promise<void> {
        if (!this.panel) return;

        try {
            const usage = await this.templateService.getUsage();
            const templates = await this.templateService.getTemplates();
            
            this.panel.webview.html = this.getWebviewContent(usage, templates);
        } catch (error) {
            this.panel.webview.html = this.getErrorContent(error);
        }
    }

    private getWebviewContent(usage: UsageInfo | null, templates: any[]): string {
        if (!usage) {
            return this.getErrorContent(new Error('Unable to load usage data'));
        }

        const usagePercentage = usage.usageLimit > 0 
            ? Math.round((usage.usageCount / usage.usageLimit) * 100) 
            : 0;

        const remainingDays = this.calculateRemainingDays(usage.billingCycleStart);
        const dailyAverage = remainingDays > 0 ? Math.round(usage.usageCount / (30 - remainingDays)) : 0;
        const projectedUsage = dailyAverage * 30;

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Usage Dashboard</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    background: var(--vscode-editor-background);
                    padding: 20px;
                    line-height: 1.6;
                }

                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }

                .header h1 {
                    color: var(--vscode-foreground);
                    font-size: 24px;
                }

                .refresh-btn {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                }

                .refresh-btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }

                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .metric-card {
                    background: var(--vscode-panel-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    padding: 20px;
                }

                .metric-title {
                    color: var(--vscode-descriptionForeground);
                    font-size: 14px;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .metric-value {
                    font-size: 32px;
                    font-weight: bold;
                    color: var(--vscode-foreground);
                    margin-bottom: 4px;
                }

                .metric-subtitle {
                    color: var(--vscode-descriptionForeground);
                    font-size: 12px;
                }

                .usage-progress {
                    background: var(--vscode-progressBar-background);
                    height: 8px;
                    border-radius: 4px;
                    overflow: hidden;
                    margin-top: 8px;
                }

                .usage-fill {
                    background: ${this.getUsageColor(usagePercentage)};
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.3s ease;
                    width: ${Math.min(usagePercentage, 100)}%;
                }

                .plan-section {
                    background: var(--vscode-panel-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                }

                .plan-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .plan-name {
                    font-size: 18px;
                    font-weight: bold;
                    color: var(--vscode-foreground);
                }

                .plan-price {
                    color: var(--vscode-descriptionForeground);
                    font-size: 16px;
                }

                .upgrade-btn {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    margin-left: 10px;
                }

                .upgrade-btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }

                .billing-info {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 12px;
                    font-size: 14px;
                    color: var(--vscode-descriptionForeground);
                }

                .templates-summary {
                    background: var(--vscode-panel-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    padding: 20px;
                }

                .warning {
                    background: var(--vscode-inputValidation-warningBackground);
                    color: var(--vscode-inputValidation-warningForeground);
                    border: 1px solid var(--vscode-inputValidation-warningBorder);
                    padding: 12px;
                    border-radius: 4px;
                    margin-bottom: 20px;
                }

                .error {
                    background: var(--vscode-inputValidation-errorBackground);
                    color: var(--vscode-inputValidation-errorForeground);
                    border: 1px solid var(--vscode-inputValidation-errorBorder);
                    padding: 12px;
                    border-radius: 4px;
                    margin-bottom: 20px;
                }

                .success {
                    background: var(--vscode-inputValidation-infoBackground);
                    color: var(--vscode-inputValidation-infoForeground);
                    border: 1px solid var(--vscode-inputValidation-infoBorder);
                    padding: 12px;
                    border-radius: 4px;
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📊 Usage Dashboard</h1>
                <button class="refresh-btn" onclick="refreshData()">🔄 Refresh</button>
            </div>

            ${this.getUsageAlerts(usage, projectedUsage)}

            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-title">API Calls Used</div>
                    <div class="metric-value">${usage.usageCount.toLocaleString()}</div>
                    <div class="metric-subtitle">of ${usage.usageLimit.toLocaleString()} limit</div>
                    <div class="usage-progress">
                        <div class="usage-fill"></div>
                    </div>
                </div>

                <div class="metric-card">
                    <div class="metric-title">Remaining Calls</div>
                    <div class="metric-value">${usage.remainingUsage.toLocaleString()}</div>
                    <div class="metric-subtitle">${remainingDays} days remaining</div>
                </div>

                <div class="metric-card">
                    <div class="metric-title">Daily Average</div>
                    <div class="metric-value">${dailyAverage}</div>
                    <div class="metric-subtitle">calls per day</div>
                </div>

                <div class="metric-card">
                    <div class="metric-title">Projected Monthly</div>
                    <div class="metric-value">${projectedUsage.toLocaleString()}</div>
                    <div class="metric-subtitle">at current rate</div>
                </div>

                ${usage.overageCount > 0 ? `
                <div class="metric-card">
                    <div class="metric-title">Overage Charges</div>
                    <div class="metric-value">$${(usage.overageCount * usage.overageRate).toFixed(2)}</div>
                    <div class="metric-subtitle">${usage.overageCount} calls @ $${usage.overageRate}</div>
                </div>
                ` : ''}
            </div>

            <div class="plan-section">
                <div class="plan-header">
                    <div>
                        <div class="plan-name">${usage.tierDisplayName} Plan</div>
                        <div class="plan-price">$${usage.monthlyPrice}/month</div>
                    </div>
                    <div>
                        <button class="upgrade-btn" onclick="openBilling()">💳 Manage Billing</button>
                        ${usage.tier !== 'Enterprise' ? '<button class="upgrade-btn" onclick="upgrade()">⬆️ Upgrade</button>' : ''}
                    </div>
                </div>
                
                <div class="billing-info">
                    <span>Billing cycle: ${new Date(usage.billingCycleStart).toLocaleDateString()}</span>
                    <span>Next billing: ${new Date(new Date(usage.billingCycleStart).setMonth(new Date(usage.billingCycleStart).getMonth() + 1)).toLocaleDateString()}</span>
                </div>
            </div>

            <div class="templates-summary">
                <h3>📝 Templates Summary</h3>
                <p>Total Templates: <strong>${templates.length}</strong></p>
                <p>Active Templates: <strong>${templates.filter(t => t.isActive).length}</strong></p>
                <p>Categories: <strong>${new Set(templates.map(t => t.category)).size}</strong></p>
            </div>

            <script>
                const vscode = acquireVsCodeApi();

                function refreshData() {
                    vscode.postMessage({ type: 'refresh' });
                }

                function upgrade() {
                    vscode.postMessage({ type: 'upgrade' });
                }

                function openBilling() {
                    vscode.postMessage({ type: 'openBilling' });
                }
            </script>
        </body>
        </html>`;
    }

    private getUsageAlerts(usage: UsageInfo, projectedUsage: number): string {
        const alerts: string[] = [];

        if (usage.usageCount >= usage.usageLimit) {
            alerts.push(`
                <div class="error">
                    ⚠️ <strong>Usage Limit Exceeded!</strong> You've used ${usage.usageCount} of ${usage.usageLimit} API calls. 
                    Additional calls will incur overage charges of $${usage.overageRate} each.
                </div>
            `);
        } else if (usage.percentageUsed >= 90) {
            alerts.push(`
                <div class="warning">
                    ⚠️ <strong>High Usage Warning!</strong> You've used ${Math.round(usage.percentageUsed)}% of your monthly limit.
                    Consider upgrading your plan to avoid overage charges.
                </div>
            `);
        } else if (projectedUsage > usage.usageLimit) {
            alerts.push(`
                <div class="warning">
                    📈 <strong>Projected Overage!</strong> At your current rate, you'll use approximately ${projectedUsage.toLocaleString()} calls this month, 
                    which exceeds your limit of ${usage.usageLimit.toLocaleString()}.
                </div>
            `);
        }

        if (usage.overageCount > 0) {
            alerts.push(`
                <div class="warning">
                    💰 <strong>Overage Charges:</strong> You have ${usage.overageCount} overage calls costing $${(usage.overageCount * usage.overageRate).toFixed(2)}.
                </div>
            `);
        }

        return alerts.join('');
    }

    private getUsageColor(percentage: number): string {
        if (percentage >= 100) return '#f44336'; // Red
        if (percentage >= 90) return '#ff9800';  // Orange
        if (percentage >= 75) return '#ffeb3b';  // Yellow
        return '#4caf50'; // Green
    }

    private calculateRemainingDays(billingCycleStart: string): number {
        const start = new Date(billingCycleStart);
        const end = new Date(start);
        end.setMonth(start.getMonth() + 1);
        const now = new Date();
        
        const remainingMs = end.getTime() - now.getTime();
        return Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
    }

    private getErrorContent(error: any): string {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Usage Dashboard - Error</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background: var(--vscode-editor-background);
                    padding: 20px;
                    text-align: center;
                }
                .error-container {
                    max-width: 500px;
                    margin: 0 auto;
                    padding: 40px;
                }
                .error-icon {
                    font-size: 48px;
                    margin-bottom: 20px;
                }
                .error-message {
                    color: var(--vscode-errorForeground);
                    margin-bottom: 20px;
                }
                .retry-btn {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <div class="error-container">
                <div class="error-icon">❌</div>
                <h2>Unable to Load Usage Data</h2>
                <div class="error-message">${error.message || 'Unknown error occurred'}</div>
                <button class="retry-btn" onclick="refreshData()">Try Again</button>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                function refreshData() {
                    vscode.postMessage({ type: 'refresh' });
                }
            </script>
        </body>
        </html>`;
    }

    private async handleUpgrade(): Promise<void> {
        const upgradeUrl = 'https://lorotemplates.com/pricing';
        await vscode.env.openExternal(vscode.Uri.parse(upgradeUrl));
    }

    private async openBillingDashboard(): Promise<void> {
        const billingUrl = 'https://lorotemplates.com/billing';
        await vscode.env.openExternal(vscode.Uri.parse(billingUrl));
    }
}