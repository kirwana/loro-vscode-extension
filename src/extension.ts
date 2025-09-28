import * as vscode from 'vscode';
import { AuthProvider } from './auth/authProvider';
import { TemplateTreeProvider } from './templates/treeProvider';
import { TemplateService } from './templates/templateService';
import { TestRunner } from './testing/testRunner';
import { ScribanCodeLensProvider, registerCodeLensCommands } from './language/codeLensProvider';
import { UsageDashboard } from './webviews/usageDashboard';

let authProvider: AuthProvider;
let templateService: TemplateService;
let templateTreeProvider: TemplateTreeProvider;
let testRunner: TestRunner;
let usageDashboard: UsageDashboard;

// Track template documents - store the entire template object
const templateDocuments = new Map<string, any>();

// Export for other modules to use
export function getTemplateInfo(documentUri: string): any {
    return templateDocuments.get(documentUri);
}

export function getTestRunner(): TestRunner {
    return testRunner;
}

export function getTemplateService(): TemplateService {
    return templateService;
}

export async function activate(context: vscode.ExtensionContext) {
    console.log('Loro Templates extension is now active!');

    try {
        // Initialize services
        authProvider = new AuthProvider(context);
        templateService = new TemplateService(context);
        templateTreeProvider = new TemplateTreeProvider(templateService);
        testRunner = new TestRunner(templateService);
        usageDashboard = new UsageDashboard(context, templateService);

        // Register tree data provider for Activity Bar
        vscode.window.registerTreeDataProvider('loroTemplates', templateTreeProvider);

        // Register CodeLens provider
        const codeLensProvider = new ScribanCodeLensProvider();
        vscode.languages.registerCodeLensProvider({ language: 'scriban' }, codeLensProvider);

        // Register commands
        registerCommands(context);
        
        // Register CodeLens commands
        registerCodeLensCommands(context);

        // Initialize authentication state
        await authProvider.initialize();

        // Setup status bar
        setupStatusBar(context);
        
        // Register save handler for template documents
        vscode.workspace.onDidSaveTextDocument(async (document) => {
            if (templateDocuments.has(document.uri.toString())) {
                await saveTemplateToServer(document);
            }
        });
        
        // Clean up when documents are closed
        vscode.workspace.onDidCloseTextDocument((document) => {
            templateDocuments.delete(document.uri.toString());
        });

        // Auto-refresh templates periodically
        const refreshInterval = setInterval(() => {
            if (authProvider.isAuthenticated()) {
                templateTreeProvider.refresh();
            }
        }, 60000); // Refresh every minute

        context.subscriptions.push({
            dispose: () => clearInterval(refreshInterval)
        });

        console.log('Loro Templates extension activated successfully!');
    } catch (error) {
        console.error('Error activating Loro Templates extension:', error);
        vscode.window.showErrorMessage(`Failed to activate Loro Templates extension: ${error}`);
    }
}

function registerCommands(context: vscode.ExtensionContext) {
    // Authentication commands
    const loginCommand = vscode.commands.registerCommand('loro.login', async () => {
        const success = await authProvider.login();
        if (success) {
            // Force refresh the tree view
            templateTreeProvider.refresh();
            
            // Make sure the explorer view is visible
            await vscode.commands.executeCommand('workbench.view.explorer');
            
            // Set context to show authenticated views
            await vscode.commands.executeCommand('setContext', 'loro.authenticated', true);
            
            vscode.window.showInformationMessage('Successfully logged in to Loro Templates');
        }
    });

    const logoutCommand = vscode.commands.registerCommand('loro.logout', async () => {
        await authProvider.logout();
        templateTreeProvider.refresh();
        vscode.window.showInformationMessage('Logged out from Loro Templates');
    });

    // Template management commands
    const createTemplateCommand = vscode.commands.registerCommand('loro.createTemplate', async () => {
        console.log('Create template command triggered');
        await createNewTemplate();
    });

    const refreshTemplatesCommand = vscode.commands.registerCommand('loro.refreshTemplates', () => {
        templateTreeProvider.refresh();
    });

    const openTemplateCommand = vscode.commands.registerCommand('loro.openTemplate', async (template) => {
        await openTemplate(template);
    });

    const testTemplateCommand = vscode.commands.registerCommand('loro.testTemplate', async (template) => {
        await testTemplate(template);
    });

    const deleteTemplateCommand = vscode.commands.registerCommand('loro.deleteTemplate', async (template) => {
        await deleteTemplate(template);
    });

    const showUsageCommand = vscode.commands.registerCommand('loro.showUsage', () => {
        usageDashboard.show();
    });

    // Register all commands
    context.subscriptions.push(
        loginCommand,
        logoutCommand,
        createTemplateCommand,
        refreshTemplatesCommand,
        openTemplateCommand,
        testTemplateCommand,
        deleteTemplateCommand,
        showUsageCommand
    );
}

async function createNewTemplate() {
    const name = await vscode.window.showInputBox({
        prompt: 'Enter template name',
        placeHolder: 'My Template'
    });

    if (!name) return;

    const category = await vscode.window.showInputBox({
        prompt: 'Enter template category',
        placeHolder: 'Email Templates'
    });

    if (!category) return;

    const description = await vscode.window.showInputBox({
        prompt: 'Enter template description',
        placeHolder: 'Description of what this template does'
    });

    if (!description) return;

    try {
        const template = await templateService.createTemplate({
            name,
            category,
            description,
            content: '<!-- Start writing your Scriban template here -->\nHello {{ user.name }}!',
            isActive: true
        });

        if (template) {
            templateTreeProvider.refresh();
            await openTemplate(template);
            vscode.window.showInformationMessage(`Template "${name}" created successfully`);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create template: ${error}`);
    }
}

async function openTemplate(template: any) {
    try {
        console.log('Opening template with id:', template.id);
        const fullTemplate = await templateService.getTemplate(template.id);
        if (!fullTemplate) {
            vscode.window.showErrorMessage('Could not load template details');
            return;
        }

        console.log('Full template fetched:', fullTemplate);
        console.log('Sample data in template:', fullTemplate.sampleData);

        // Create a new untitled document with the template content
        const doc = await vscode.workspace.openTextDocument({
            content: fullTemplate.content,
            language: 'scriban'
        });

        const editor = await vscode.window.showTextDocument(doc);

        // Store the ENTIRE template object so we have all fields when saving
        templateDocuments.set(doc.uri.toString(), fullTemplate);
        console.log('Stored template in templateDocuments with URI:', doc.uri.toString());
        
        // Show save instructions
        vscode.window.showInformationMessage(
            `Editing template: ${fullTemplate.name}. Use Ctrl+S to save changes back to server.`
        );
        
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open template: ${error}`);
    }
}

async function testTemplate(template: any) {
    try {
        // We need an id to fetch the full template
        if (!template || !template.id) {
            vscode.window.showErrorMessage('Cannot test template - no template ID found');
            return;
        }
        
        // ALWAYS fetch the full template to ensure we have all fields including sampleData
        const fullTemplate = await templateService.getTemplate(template.id);
        if (!fullTemplate) {
            vscode.window.showErrorMessage('Could not load template details');
            return;
        }
        
        // Get sample data (default or user-provided)
        const sampleDataInput = await vscode.window.showInputBox({
            prompt: 'Enter sample data (JSON)',
            placeHolder: '{"user": {"name": "John Doe", "email": "john@example.com"}}',
            value: fullTemplate.sampleData || '{}'
        });

        if (!sampleDataInput) return;

        let sampleData: any;
        try {
            sampleData = JSON.parse(sampleDataInput);
        } catch (e) {
            vscode.window.showErrorMessage('Invalid JSON in sample data');
            return;
        }

        // Show progress
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Testing template "${fullTemplate.name}"...`,
            cancellable: false
        }, async () => {
            const result = await testRunner.testTemplate(fullTemplate, sampleData);
            await showTestResult(fullTemplate, result);
        });

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to test template: ${error}`);
    }
}

async function showTestResult(template: any, result: any) {
    const panel = vscode.window.createWebviewPanel(
        'loroTestResult',
        `Test Result: ${template.name}`,
        vscode.ViewColumn.Beside,
        { enableScripts: true }
    );

    panel.webview.html = getTestResultHtml(template, result);
}

function getTestResultHtml(template: any, result: any): string {
    const statusColor = result.success ? '#4CAF50' : '#f44336';
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Result</title>
        <style>
            body { 
                font-family: var(--vscode-font-family); 
                color: var(--vscode-foreground);
                background: var(--vscode-editor-background);
                padding: 20px;
            }
            .status { 
                padding: 10px; 
                border-radius: 4px; 
                margin-bottom: 20px;
                background: ${statusColor};
                color: white;
                font-weight: bold;
            }
            .section { 
                margin-bottom: 20px; 
                border: 1px solid var(--vscode-panel-border);
                border-radius: 4px;
            }
            .section-header {
                background: var(--vscode-panel-background);
                padding: 10px;
                font-weight: bold;
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            .section-content { 
                padding: 15px; 
            }
            pre { 
                background: var(--vscode-textCodeBlock-background); 
                padding: 10px; 
                border-radius: 4px; 
                overflow-x: auto;
                white-space: pre-wrap;
            }
            .meta { 
                color: var(--vscode-descriptionForeground); 
                font-size: 0.9em; 
            }
            .error { color: var(--vscode-errorForeground); }
        </style>
    </head>
    <body>
        <h2>Test Result for "${template.name}"</h2>
        
        <div class="status">
            ${result.success ? '✅ Test Passed' : '❌ Test Failed'}
        </div>
        
        <div class="meta">
            Duration: ${result.duration}ms
            ${result.usageConsumed ? ` | API Usage: ${result.usageConsumed} call(s)` : ''}
        </div>

        <div class="section">
            <div class="section-header">📄 Output</div>
            <div class="section-content">
                <pre>${result.output || '(no output)'}</pre>
            </div>
        </div>

        ${result.errors && result.errors.length > 0 ? `
        <div class="section">
            <div class="section-header">⚠️ Errors</div>
            <div class="section-content">
                ${result.errors.map((error: any) => `<div class="error">${error}</div>`).join('<br>')}
            </div>
        </div>
        ` : ''}

        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid var(--vscode-panel-border); text-align: center; color: var(--vscode-descriptionForeground); font-size: 12px;">
            🚀 Powered by <a href="https://github.com/scriban/scriban/blob/master/license.txt" target="_blank" style="color: var(--vscode-textLink-foreground); text-decoration: none;">Scriban</a> - The fast, powerful, safe and lightweight scripting language and engine for .NET
        </div>
    </body>
    </html>`;
}

async function saveTemplateToServer(document: vscode.TextDocument) {
    const storedTemplate = templateDocuments.get(document.uri.toString());
    
    if (!storedTemplate) {
        return; // Not a template document
    }

    try {
        const templateId = storedTemplate.id;
        const templateName = storedTemplate.name;
        
        // Show progress while saving
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Saving template "${templateName}"...`,
            cancellable: false
        }, async () => {
            // Verify we have the name before sending
            if (!storedTemplate.name) {
                throw new Error('Template name is missing from stored template');
            }
            
            // Use the stored template with updated content
            const updatedTemplate = await templateService.updateTemplate(templateId, {
                name: storedTemplate.name,
                category: storedTemplate.category,
                description: storedTemplate.description,
                content: document.getText(),
                isActive: storedTemplate.isActive,
                sampleData: storedTemplate.sampleData,
                schema: storedTemplate.schema
            });

            if (updatedTemplate) {
                vscode.window.showInformationMessage(`Template "${templateName}" saved to server successfully`);
                // Update the stored template with the new content
                storedTemplate.content = document.getText();
                // Refresh the tree view to show any changes
                templateTreeProvider.refresh();
            }
        });
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to save template to server: ${error}`);
    }
}

async function deleteTemplate(template: any) {
    const confirm = await vscode.window.showWarningMessage(
        `Are you sure you want to delete template "${template.name}"?`,
        { modal: true },
        'Delete'
    );

    if (confirm === 'Delete') {
        try {
            await templateService.deleteTemplate(template.id);
            templateTreeProvider.refresh();
            vscode.window.showInformationMessage(`Template "${template.name}" deleted successfully`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to delete template: ${error}`);
        }
    }
}

function setupStatusBar(context: vscode.ExtensionContext) {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'loro.showUsage';
    
    // Update status bar periodically
    const updateStatusBar = async () => {
        if (authProvider.isAuthenticated()) {
            try {
                const usage = await templateService.getUsage();
                if (usage) {
                    statusBarItem.text = `🔥 ${usage.usageCount}/${usage.usageLimit} calls`;
                    statusBarItem.tooltip = `Loro Templates: ${usage.usageCount} of ${usage.usageLimit} API calls used (${usage.tier})`;
                    statusBarItem.show();
                } else {
                    statusBarItem.hide();
                }
            } catch (error) {
                statusBarItem.hide();
            }
        } else {
            statusBarItem.hide();
        }
    };

    // Initial update
    updateStatusBar();

    // Update every 30 seconds
    const statusBarInterval = setInterval(updateStatusBar, 30000);

    context.subscriptions.push(statusBarItem);
    context.subscriptions.push({
        dispose: () => clearInterval(statusBarInterval)
    });
}

export function deactivate() {
    console.log('Loro Templates extension deactivated');
}