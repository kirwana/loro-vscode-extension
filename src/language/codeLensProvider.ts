import * as vscode from 'vscode';
import { getTemplateInfo, getTestRunner } from '../extension';

export class ScribanCodeLensProvider implements vscode.CodeLensProvider {
    
    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        const codeLenses: vscode.CodeLens[] = [];
        
        // Only provide CodeLens for Scriban files
        if (document.languageId !== 'scriban') {
            return codeLenses;
        }

        // Add CodeLens at the top of the document for testing
        const range = new vscode.Range(0, 0, 0, 0);
        
        // Test Template CodeLens - larger with icon
        const testLens = new vscode.CodeLens(range, {
            title: "▶️ RUN TEST",
            command: "loro.testCurrentTemplate",
            arguments: [document.uri],
            tooltip: "Test this template with sample data"
        });
        
        // Validate Template CodeLens - larger with icon
        const validateLens = new vscode.CodeLens(range, {
            title: "✅ VALIDATE",
            command: "loro.validateTemplate",
            arguments: [document.uri],
            tooltip: "Check template syntax for errors"
        });
        
        // Generate Sample Data CodeLens - larger with icon
        const sampleDataLens = new vscode.CodeLens(range, {
            title: "📝 GENERATE DATA",
            command: "loro.generateSampleData",
            arguments: [document.uri],
            tooltip: "Auto-generate sample JSON data for this template"
        });
        
        // Save to Server CodeLens (only show for template documents) - larger with icon
        const templateInfo = getTemplateInfo(document.uri.toString());
        const saveLenses = [];
        if (templateInfo) {
            const saveLens = new vscode.CodeLens(range, {
                title: "💾 SAVE TO SERVER",
                command: "loro.saveTemplateToServer",
                arguments: [document.uri],
                tooltip: "Save changes to Azure SQL database"
            });
            saveLenses.push(saveLens);
        }

        codeLenses.push(testLens, validateLens, sampleDataLens, ...saveLenses);

        // Add CodeLens for specific Scriban blocks
        const blockLenses = this.findScribanBlocks(document);
        codeLenses.push(...blockLenses);

        return codeLenses;
    }

    private findScribanBlocks(document: vscode.TextDocument): vscode.CodeLens[] {
        const codeLenses: vscode.CodeLens[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();

            // Look for specific Scriban constructs
            if (trimmedLine.includes('{% for ') || trimmedLine.includes('{{for ')) {
                const range = new vscode.Range(i, 0, i, line.length);
                codeLenses.push(new vscode.CodeLens(range, {
                    title: "$(sync) FOR LOOP",
                    command: "loro.explainScribanConstruct",
                    arguments: ["for", range],
                    tooltip: "Click to learn about Scriban for loops"
                }));
            }

            if (trimmedLine.includes('{% if ') || trimmedLine.includes('{{if ')) {
                const range = new vscode.Range(i, 0, i, line.length);
                codeLenses.push(new vscode.CodeLens(range, {
                    title: "$(question) CONDITIONAL",
                    command: "loro.explainScribanConstruct", 
                    arguments: ["if", range],
                    tooltip: "Click to learn about Scriban conditionals"
                }));
            }

            if (trimmedLine.includes('{% function ')) {
                const range = new vscode.Range(i, 0, i, line.length);
                codeLenses.push(new vscode.CodeLens(range, {
                    title: "$(symbol-method) FUNCTION",
                    command: "loro.explainScribanConstruct",
                    arguments: ["function", range],
                    tooltip: "Click to learn about Scriban functions"
                }));
            }

            // Look for complex expressions that might need explanation
            if (this.isComplexExpression(line)) {
                const range = new vscode.Range(i, 0, i, line.length);
                codeLenses.push(new vscode.CodeLens(range, {
                    title: "$(lightbulb) COMPLEX EXPRESSION",
                    command: "loro.explainExpression",
                    arguments: [line.trim(), range],
                    tooltip: "Click to understand this complex expression"
                }));
            }
        }

        return codeLenses;
    }

    private isComplexExpression(line: string): boolean {
        // Detect complex Scriban expressions
        const complexPatterns = [
            /\|\s*\w+/g, // Filters like | date.format 
            /\w+\.\w+\.\w+/g, // Deep property access
            /\?\s*\w+\s*:/g, // Ternary operators
            /@\w+/g // Scriban functions
        ];

        return complexPatterns.some(pattern => pattern.test(line));
    }

    // Method to refresh CodeLens
    public refresh(): void {
        this._onDidChangeCodeLenses.fire();
    }

    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;
}

// Register additional commands for CodeLens functionality
export function registerCodeLensCommands(context: vscode.ExtensionContext) {
    
    // Command to test current template from editor
    const testCurrentTemplateCommand = vscode.commands.registerCommand(
        'loro.testCurrentTemplate',
        async (uri: vscode.Uri) => {
            const document = await vscode.workspace.openTextDocument(uri);
            await testTemplateFromEditor(document);
        }
    );

    // Command to validate template syntax
    const validateTemplateCommand = vscode.commands.registerCommand(
        'loro.validateTemplate',
        async (uri: vscode.Uri) => {
            const document = await vscode.workspace.openTextDocument(uri);
            await validateTemplateFromEditor(document);
        }
    );

    // Command to generate sample data
    const generateSampleDataCommand = vscode.commands.registerCommand(
        'loro.generateSampleData', 
        async (uri: vscode.Uri) => {
            const document = await vscode.workspace.openTextDocument(uri);
            await generateSampleDataForTemplate(document);
        }
    );

    // Command to explain Scriban constructs
    const explainConstructCommand = vscode.commands.registerCommand(
        'loro.explainScribanConstruct',
        async (constructType: string, range: vscode.Range) => {
            await showScribanConstructExplanation(constructType, range);
        }
    );

    // Command to explain complex expressions
    const explainExpressionCommand = vscode.commands.registerCommand(
        'loro.explainExpression',
        async (expression: string, range: vscode.Range) => {
            await showExpressionExplanation(expression, range);
        }
    );
    
    // Command to save template to server
    const saveTemplateToServerCommand = vscode.commands.registerCommand(
        'loro.saveTemplateToServer',
        async (uri: vscode.Uri) => {
            const document = await vscode.workspace.openTextDocument(uri);
            await saveTemplateFromEditor(document);
        }
    );

    context.subscriptions.push(
        testCurrentTemplateCommand,
        validateTemplateCommand, 
        generateSampleDataCommand,
        explainConstructCommand,
        explainExpressionCommand,
        saveTemplateToServerCommand
    );
}

async function testTemplateFromEditor(document: vscode.TextDocument) {
    // Check if this is a template document
    const templateInfo = getTemplateInfo(document.uri.toString());
    
    if (!templateInfo) {
        vscode.window.showWarningMessage('This document is not associated with a saved template. Please save it first.');
        return;
    }
    
    // templateInfo is the full template object stored in openTemplate
    // It should have all fields including id, name, sampleData
    const template = templateInfo;
    const templateId = template.id || template.templateId;
    const templateName = template.name || template.templateName;
    
    if (!templateId) {
        vscode.window.showErrorMessage('Template ID is missing. Please reopen the template from the tree view.');
        return;
    }

    // Use the sampleData from the stored template
    let defaultSampleData = template.sampleData;

    // If no sample data in stored template, try to fetch fresh from server
    if ((!defaultSampleData || defaultSampleData === '{}' || defaultSampleData === '') && templateId) {
        try {
            console.log('Sample data is empty/missing, fetching fresh from server for template:', templateId);
            const { getTemplateService } = require('../extension');
            const templateService = getTemplateService();
            const fullTemplate = await templateService.getTemplate(templateId);
            console.log('Fetched template from server:', fullTemplate);
            if (fullTemplate?.sampleData && fullTemplate.sampleData !== '') {
                defaultSampleData = fullTemplate.sampleData;
                console.log('Got sample data from server:', defaultSampleData);
            } else {
                console.log('No sample data found on server either');
            }
        } catch (error) {
            console.log('Could not load sample data from server:', error);
        }
    }

    // Final fallback to empty JSON object if still no data
    if (!defaultSampleData || defaultSampleData === '') {
        defaultSampleData = '{}';
    }

    // Create a larger input window for sample data
    const sampleDataInput = await showSampleDataInput(templateName, defaultSampleData);
    if (!sampleDataInput) return;

    try {
        const sampleData = JSON.parse(sampleDataInput);
        
        // Create a template object for testing with current document content
        const testTemplate = {
            id: templateId,
            name: templateName,
            content: document.getText(),
            category: template.category || 'Test',
            description: template.description || `Testing template ${templateName}`,
            isActive: template.isActive !== undefined ? template.isActive : true,
            createdAt: template.createdAt || new Date().toISOString(),
            updatedAt: template.updatedAt || new Date().toISOString(),
            userId: template.userId,
            schema: template.schema,
            sampleData: template.sampleData
        };

        // Show progress and test
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Testing template "${templateName}"...`,
            cancellable: false
        }, async () => {
            try {
                console.log('Starting template test...');
                const { getTestRunner } = require('../extension');
                const testRunner = getTestRunner();
                
                if (!testRunner) {
                    throw new Error('Test runner is not initialized');
                }
                
                console.log('Got test runner, testing template:', testTemplate);
                console.log('Sample data:', sampleData);
                
                const result = await testRunner.testTemplate(testTemplate, sampleData);
                console.log('Test completed, result:', result);
                
                if (!result) {
                    throw new Error('No result returned from test');
                }
                
                await showTestResult(testTemplate, result);
                console.log('Test result window should be visible');
            } catch (error) {
                console.error('Test failed with error:', error);
                vscode.window.showErrorMessage(`Test failed: ${error}`);
                
                // Show a basic error result window
                const errorResult = {
                    success: false,
                    output: 'Test failed to execute',
                    duration: 0,
                    errors: [error?.toString() || 'Unknown error']
                };
                await showTestResult(testTemplate, errorResult);
            }
        });
        
    } catch (error) {
        vscode.window.showErrorMessage('Invalid JSON in sample data');
    }
}

async function validateTemplateFromEditor(document: vscode.TextDocument) {
    const content = document.getText();
    
    // Basic validation logic (you can expand this)
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for unmatched braces
        const openBraces = (line.match(/{{/g) || []).length;
        const closeBraces = (line.match(/}}/g) || []).length;
        
        if (openBraces !== closeBraces) {
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(i, 0, i, line.length),
                'Unmatched braces {{ }}',
                vscode.DiagnosticSeverity.Error
            );
            diagnostics.push(diagnostic);
        }
    }

    // Show diagnostics
    const collection = vscode.languages.createDiagnosticCollection('scriban');
    collection.set(document.uri, diagnostics);

    if (diagnostics.length === 0) {
        vscode.window.showInformationMessage('✅ Template syntax is valid');
    } else {
        vscode.window.showWarningMessage(`⚠️ Found ${diagnostics.length} syntax issue(s)`);
    }
}

async function generateSampleDataForTemplate(document: vscode.TextDocument) {
    const content = document.getText();
    
    // Extract variables from template
    const variables = new Set<string>();
    const variableMatches = content.match(/\{\{\s*([^}|]+)(\|[^}]*)?\s*\}\}/g);
    
    if (variableMatches) {
        for (const match of variableMatches) {
            const variable = match.replace(/\{\{|\}\}/g, '').split('|')[0].trim();
            variables.add(variable);
        }
    }

    // Generate sample data structure
    const sampleData: any = {};
    
    for (const variable of variables) {
        const parts = variable.split('.');
        let current = sampleData;
        
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
                current[parts[i]] = {};
            }
            current = current[parts[i]];
        }
        
        const lastPart = parts[parts.length - 1];
        current[lastPart] = getSampleValueForProperty(lastPart);
    }

    // Show generated sample data
    const jsonString = JSON.stringify(sampleData, null, 2);
    
    const document2 = await vscode.workspace.openTextDocument({
        content: jsonString,
        language: 'json'
    });
    
    await vscode.window.showTextDocument(document2, vscode.ViewColumn.Beside);
    vscode.window.showInformationMessage('Generated sample data based on template variables');
}

function getSampleValueForProperty(propertyName: string): any {
    const lowerName = propertyName.toLowerCase();
    
    if (lowerName.includes('name')) return 'John Doe';
    if (lowerName.includes('email')) return 'john@example.com';
    if (lowerName.includes('date')) return new Date().toISOString();
    if (lowerName.includes('price') || lowerName.includes('amount')) return 99.99;
    if (lowerName.includes('id')) return '12345';
    if (lowerName.includes('count') || lowerName.includes('number')) return 42;
    
    return 'Sample Value';
}

async function showScribanConstructExplanation(constructType: string, range: vscode.Range) {
    const explanations: { [key: string]: string } = {
        'for': 'Scriban for loop: Iterates over collections. Syntax: {% for item in collection %} ... {% endfor %}',
        'if': 'Scriban conditional: Controls template flow. Syntax: {% if condition %} ... {% else %} ... {% endif %}',
        'function': 'Scriban function: Defines reusable template functions. Syntax: {% function name(params) %} ... {% endfunction %}'
    };

    const explanation = explanations[constructType] || 'Scriban language construct';
    vscode.window.showInformationMessage(explanation);
}

async function showExpressionExplanation(expression: string, range: vscode.Range) {
    vscode.window.showInformationMessage(
        `Complex Scriban expression: ${expression}\n\nThis expression uses advanced Scriban features like filters or deep property access.`
    );
}

async function showTestResult(template: any, result: any) {
    console.log('Showing test result for template:', template.name);
    console.log('Result object:', result);
    
    // Create the panel in column 2 or 3 to avoid conflicts
    const targetColumn = vscode.ViewColumn.Two;
    
    const panel = vscode.window.createWebviewPanel(
        'loroTestResult',
        `Test Result: ${template.name}`,
        targetColumn,
        { 
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    const html = getTestResultHtml(template, result);
    console.log('HTML length:', html.length);
    panel.webview.html = html;
    
    // Force the panel to be visible and focused
    panel.reveal(targetColumn, false);
}

function getTestResultHtml(template: any, result: any): string {
    // Ensure we have a result object with default values
    const safeResult = {
        success: result?.success ?? false,
        output: result?.output ?? 'No output received',
        duration: result?.duration ?? 0,
        errors: result?.errors ?? [],
        usageConsumed: result?.usageConsumed ?? 0
    };
    
    const statusColor = safeResult.success ? '#4CAF50' : '#f44336';
    
    console.log('Rendering test result HTML with:', { template, safeResult });
    
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
            .error {
                color: var(--vscode-errorForeground);
                background: var(--vscode-inputValidation-errorBackground);
                padding: 8px;
                border-radius: 4px;
                margin: 5px 0;
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
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body>
        <h1>Test Result: ${template?.name || 'Unknown Template'}</h1>
        
        <div class="status">
            ${safeResult.success ? '✅ Test Passed' : '❌ Test Failed'}
        </div>
        
        <div class="meta">
            Duration: ${safeResult.duration}ms
            ${safeResult.usageConsumed ? ` | API Usage: ${safeResult.usageConsumed} call(s)` : ''}
        </div>

        <div class="section">
            <div class="section-header">📄 Output</div>
            <div class="section-content">
                <pre>${safeResult.output}</pre>
            </div>
        </div>

        ${safeResult.errors && safeResult.errors.length > 0 ? `
        <div class="section">
            <div class="section-header">⚠️ Errors</div>
            <div class="section-content">
                ${safeResult.errors.map((error: any) => `<div class="error">${error}</div>`).join('<br>')}
            </div>
        </div>
        ` : ''}
    </body>
    </html>`;
}

async function saveTemplateFromEditor(document: vscode.TextDocument) {
    const templateInfo = getTemplateInfo(document.uri.toString());
    
    if (!templateInfo) {
        vscode.window.showWarningMessage('This document is not associated with a saved template.');
        return;
    }
    
    // templateInfo is now the full template object, not just {templateId, templateName}
    const template = templateInfo;
    const templateId = template.id || template.templateId;
    const templateName = template.name || template.templateName;
    
    if (!templateId) {
        vscode.window.showErrorMessage('Template ID is missing. Please reopen the template from the tree view.');
        return;
    }
    
    try {
        const { getTemplateService } = require('../extension');
        const templateService = getTemplateService();
        
        // Show progress while saving
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Saving template "${templateName}"...`,
            cancellable: false
        }, async () => {
            // Call the backend API to update the template in Azure SQL with ALL required fields
            const updatedTemplate = await templateService.updateTemplate(templateId, {
                name: template.name,
                category: template.category,
                description: template.description,
                content: document.getText(),
                isActive: template.isActive,
                sampleData: template.sampleData,
                schema: template.schema
            });

            if (updatedTemplate) {
                vscode.window.showInformationMessage(`Template "${templateName}" saved to server successfully`);
            }
        });
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to save template to server: ${error}`);
    }
}

async function showSampleDataInput(templateName: string, defaultData: string): Promise<string | undefined> {
    // Create a webview panel for larger JSON input
    const panel = vscode.window.createWebviewPanel(
        'sampleDataInput',
        `Sample Data for ${templateName}`,
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    // Format the default data nicely
    let formattedDefaultData;
    try {
        const parsed = JSON.parse(defaultData);
        formattedDefaultData = JSON.stringify(parsed, null, 2);
    } catch {
        formattedDefaultData = defaultData;
    }

    panel.webview.html = getSampleDataInputHtml(templateName, formattedDefaultData);

    return new Promise((resolve) => {
        panel.webview.onDidReceiveMessage((message) => {
            if (message.command === 'submit') {
                // Don't dispose immediately - let the test result window appear first
                setTimeout(() => panel.dispose(), 100);
                resolve(message.data);
            } else if (message.command === 'cancel') {
                panel.dispose();
                resolve(undefined);
            }
        });

        panel.onDidDispose(() => {
            // Only resolve undefined if not already resolved
            resolve(undefined);
        });
    });
}

function getSampleDataInputHtml(templateName: string, defaultData: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sample Data Input</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
                background: var(--vscode-editor-background);
                padding: 20px;
            }
            .header {
                margin-bottom: 20px;
                border-bottom: 1px solid var(--vscode-panel-border);
                padding-bottom: 15px;
            }
            .header h2 {
                margin: 0;
                color: var(--vscode-foreground);
            }
            .header p {
                margin: 5px 0 0 0;
                color: var(--vscode-descriptionForeground);
                font-size: 0.9em;
            }
            .input-section {
                margin-bottom: 20px;
            }
            .input-section label {
                display: block;
                margin-bottom: 8px;
                font-weight: bold;
                color: var(--vscode-foreground);
            }
            textarea {
                width: 100%;
                height: 300px;
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 3px;
                padding: 10px;
                font-family: var(--vscode-editor-font-family);
                font-size: var(--vscode-editor-font-size);
                resize: vertical;
                box-sizing: border-box;
            }
            textarea:focus {
                outline: 1px solid var(--vscode-focusBorder);
                border-color: var(--vscode-focusBorder);
            }
            .button-container {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
            }
            button {
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: 3px;
                padding: 8px 16px;
                cursor: pointer;
                font-size: 13px;
                font-family: var(--vscode-font-family);
            }
            button:hover {
                background: var(--vscode-button-hoverBackground);
            }
            button.secondary {
                background: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
            }
            button.secondary:hover {
                background: var(--vscode-button-secondaryHoverBackground);
            }
            .example {
                background: var(--vscode-textCodeBlock-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 3px;
                padding: 10px;
                margin-top: 10px;
                font-family: var(--vscode-editor-font-family);
                font-size: 0.9em;
            }
            .validation-error {
                color: var(--vscode-errorForeground);
                background: var(--vscode-inputValidation-errorBackground);
                border: 1px solid var(--vscode-inputValidation-errorBorder);
                padding: 8px;
                border-radius: 3px;
                margin-top: 10px;
                display: none;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h2>Test Data for Template: ${templateName}</h2>
            <p>Enter JSON data to test your template. The data will be available as variables in your template.</p>
        </div>

        <div class="input-section">
            <label for="sampleData">Sample JSON Data:</label>
            <textarea id="sampleData" placeholder="Enter JSON data...">${defaultData}</textarea>
            <div class="validation-error" id="validationError"></div>
        </div>

        <div class="example">
            <strong>Example:</strong><br>
            <code>
            {<br>
            &nbsp;&nbsp;"user": {<br>
            &nbsp;&nbsp;&nbsp;&nbsp;"name": "John Doe",<br>
            &nbsp;&nbsp;&nbsp;&nbsp;"email": "john@example.com"<br>
            &nbsp;&nbsp;},<br>
            &nbsp;&nbsp;"order": {<br>
            &nbsp;&nbsp;&nbsp;&nbsp;"id": "12345",<br>
            &nbsp;&nbsp;&nbsp;&nbsp;"total": 99.99<br>
            &nbsp;&nbsp;}<br>
            }
            </code>
        </div>

        <div class="button-container">
            <button class="secondary" onclick="cancel()">Cancel</button>
            <button onclick="formatJson()">Format JSON</button>
            <button onclick="runTest()">▶️ Run Test</button>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            
            function cancel() {
                vscode.postMessage({ command: 'cancel' });
            }
            
            function formatJson() {
                const textarea = document.getElementById('sampleData');
                const errorDiv = document.getElementById('validationError');
                
                try {
                    const parsed = JSON.parse(textarea.value);
                    textarea.value = JSON.stringify(parsed, null, 2);
                    errorDiv.style.display = 'none';
                } catch (error) {
                    errorDiv.textContent = 'Invalid JSON: ' + error.message;
                    errorDiv.style.display = 'block';
                }
            }
            
            function runTest() {
                const textarea = document.getElementById('sampleData');
                const errorDiv = document.getElementById('validationError');
                
                try {
                    // Validate JSON
                    JSON.parse(textarea.value);
                    vscode.postMessage({ 
                        command: 'submit', 
                        data: textarea.value 
                    });
                } catch (error) {
                    errorDiv.textContent = 'Invalid JSON: ' + error.message;
                    errorDiv.style.display = 'block';
                }
            }
            
            // Auto-format on load if possible
            window.addEventListener('load', () => {
                const textarea = document.getElementById('sampleData');
                if (textarea.value.trim()) {
                    formatJson();
                }
            });
        </script>
    </body>
    </html>`;
}