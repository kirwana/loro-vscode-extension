import * as vscode from 'vscode';
import { Template, TestResult } from '../types';
import { TemplateService } from '../templates/templateService';

export class TestRunner {
    constructor(private templateService: TemplateService) {}

    async testTemplate(template: Template, sampleData: any): Promise<TestResult> {
        const startTime = Date.now();
        
        try {
            // First validate the template content
            const validation = this.templateService.validateTemplateContent(template.content);
            if (!validation.isValid) {
                return {
                    success: false,
                    output: '',
                    duration: Date.now() - startTime,
                    errors: validation.errors
                };
            }

            // Call the template service to test the template
            const result = await this.templateService.testTemplate(template.id, sampleData);
            console.log('Raw API result:', JSON.stringify(result, null, 2));
            
            // Helper function to get property case-insensitively
            const getProp = (obj: any, ...props: string[]): any => {
                for (const prop of props) {
                    // Try exact match
                    if (obj[prop] !== undefined) return obj[prop];
                    // Try lowercase first letter
                    const lowerProp = prop.charAt(0).toLowerCase() + prop.slice(1);
                    if (obj[lowerProp] !== undefined) return obj[lowerProp];
                    // Try uppercase first letter
                    const upperProp = prop.charAt(0).toUpperCase() + prop.slice(1);
                    if (obj[upperProp] !== undefined) return obj[upperProp];
                }
                return undefined;
            };
            
            // Get values from result object
            const output = getProp(result, 'output', 'Output', 'result', 'Result') || '';
            const error = getProp(result, 'error', 'Error');
            const renderTime = getProp(result, 'renderTime', 'RenderTime');
            
            // If we have output and no error, consider it successful
            const success = error ? false : (output && output.length > 0);
            
            console.log('Parsed values - success:', success, 'output:', output, 'error:', error);
            
            return {
                success: success,
                output: output || 'No output received',
                duration: renderTime ? Math.round(parseFloat(renderTime) * 1000) : (Date.now() - startTime),
                errors: error ? [error] : [],
                usageConsumed: 1 // Each test consumes 1 API call
            };
            
        } catch (error) {
            return {
                success: false,
                output: '',
                duration: Date.now() - startTime,
                errors: [error instanceof Error ? error.message : String(error)]
            };
        }
    }

    async testTemplateFromEditor(document: vscode.TextDocument, sampleData: any): Promise<TestResult> {
        const startTime = Date.now();
        
        try {
            // Get template content from the active editor
            const content = document.getText();
            
            // Basic validation
            const validation = this.templateService.validateTemplateContent(content);
            if (!validation.isValid) {
                return {
                    success: false,
                    output: '',
                    duration: Date.now() - startTime,
                    errors: validation.errors
                };
            }

            // Create a temporary template for testing
            const tempTemplate: Template = {
                id: 'temp-' + Date.now(),
                name: 'Temporary Test Template',
                category: 'Test',
                description: 'Temporary template for testing from editor',
                content: content,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // For now, we'll need to save this as a temporary template or implement direct testing
            // This is a placeholder for direct content testing functionality
            throw new Error('Direct editor testing not yet implemented. Please save the template first.');
            
        } catch (error) {
            return {
                success: false,
                output: '',
                duration: Date.now() - startTime,
                errors: [error instanceof Error ? error.message : String(error)]
            };
        }
    }

    async runBulkTests(templates: Template[], sampleData: any): Promise<Map<string, TestResult>> {
        const results = new Map<string, TestResult>();
        
        // Show progress for bulk testing
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Running bulk template tests...',
            cancellable: true
        }, async (progress, token) => {
            const increment = 100 / templates.length;
            
            for (let i = 0; i < templates.length; i++) {
                if (token.isCancellationRequested) {
                    break;
                }

                const template = templates[i];
                progress.report({ 
                    increment, 
                    message: `Testing ${template.name} (${i + 1}/${templates.length})` 
                });

                try {
                    const result = await this.testTemplate(template, sampleData);
                    results.set(template.id, result);
                } catch (error) {
                    results.set(template.id, {
                        success: false,
                        output: '',
                        duration: 0,
                        errors: [error instanceof Error ? error.message : String(error)]
                    });
                }

                // Small delay to prevent overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        });

        return results;
    }

    // Helper method to create sample data from template analysis
    generateSampleDataFromTemplate(template: Template): any {
        const content = template.content;
        const sampleData: any = {};

        // Extract variable references like {{ user.name }}, {{ product.price }}
        const variableMatches = content.match(/\{\{\s*([^}]+)\s*\}\}/g);
        if (variableMatches) {
            for (const match of variableMatches) {
                const variable = match.replace(/[{}]/g, '').trim();
                const parts = variable.split('.');
                
                if (parts.length >= 2) {
                    const objectName = parts[0];
                    const propertyName = parts[1];
                    
                    if (!sampleData[objectName]) {
                        sampleData[objectName] = {};
                    }
                    
                    // Generate sample values based on property names
                    sampleData[objectName][propertyName] = this.generateSampleValue(propertyName);
                }
            }
        }

        return Object.keys(sampleData).length > 0 ? sampleData : {
            user: {
                name: 'John Doe',
                email: 'john@example.com'
            },
            company: {
                name: 'Example Corp'
            }
        };
    }

    private generateSampleValue(propertyName: string): any {
        const lowerName = propertyName.toLowerCase();
        
        if (lowerName.includes('name')) {
            return 'John Doe';
        } else if (lowerName.includes('email')) {
            return 'john@example.com';
        } else if (lowerName.includes('price') || lowerName.includes('cost') || lowerName.includes('amount')) {
            return 99.99;
        } else if (lowerName.includes('date')) {
            return new Date().toISOString();
        } else if (lowerName.includes('phone')) {
            return '+1-555-123-4567';
        } else if (lowerName.includes('address')) {
            return '123 Main St, Anytown, ST 12345';
        } else if (lowerName.includes('url') || lowerName.includes('link')) {
            return 'https://example.com';
        } else if (lowerName.includes('id')) {
            return '12345';
        } else if (lowerName.includes('count') || lowerName.includes('number') || lowerName.includes('quantity')) {
            return 42;
        } else if (lowerName.includes('description') || lowerName.includes('notes')) {
            return 'Sample description text';
        } else if (lowerName.includes('title')) {
            return 'Sample Title';
        } else {
            return 'Sample Value';
        }
    }

    // Method to get common sample data templates
    getCommonSampleDataTemplates(): { [key: string]: any } {
        return {
            'User Profile': {
                user: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    phone: '+1-555-123-4567',
                    address: '123 Main St, Anytown, ST 12345'
                }
            },
            'E-commerce Order': {
                user: {
                    name: 'Jane Smith',
                    email: 'jane@example.com'
                },
                order: {
                    id: 'ORD-12345',
                    date: new Date().toISOString(),
                    total: 149.99,
                    items: [
                        { name: 'Product A', price: 99.99, quantity: 1 },
                        { name: 'Product B', price: 50.00, quantity: 1 }
                    ]
                }
            },
            'Company Information': {
                company: {
                    name: 'Example Corporation',
                    address: '456 Business Ave, Corporate City, CC 67890',
                    phone: '+1-555-987-6543',
                    email: 'info@example.com',
                    website: 'https://example.com'
                }
            },
            'Invoice Data': {
                invoice: {
                    id: 'INV-2024-001',
                    date: new Date().toISOString(),
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    subtotal: 100.00,
                    tax: 8.50,
                    total: 108.50
                },
                client: {
                    name: 'Client Company',
                    address: '789 Client St, Client Town, CT 13579'
                }
            }
        };
    }
}