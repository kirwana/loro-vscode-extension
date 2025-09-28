import * as vscode from 'vscode';
import { Template, UsageInfo, TemplateCreateRequest, ApiResponse } from '../types';
import { httpRequest, HttpOptions } from '../utils/httpClient';

export class TemplateService {
    private apiEndpoint: string;

    constructor(private context: vscode.ExtensionContext) {
        const config = vscode.workspace.getConfiguration('loro');
        this.apiEndpoint = config.get<string>('apiEndpoint', 'https://api.lorotemplates.com');
    }

    private async getApiKey(): Promise<string | null> {
        return await this.context.secrets.get('loro.apiKey') || null;
    }

    private async makeApiCall<T>(endpoint: string, options: HttpOptions = {}): Promise<T> {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
            throw new Error('Not authenticated. Please login first.');
        }

        const response = await httpRequest(`${this.apiEndpoint}${endpoint}`, {
            ...options,
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return await response.json() as T;
    }

    async getTemplates(): Promise<Template[]> {
        try {
            console.log('Fetching templates from API...');
            const response = await this.makeApiCall<Template[]>('/api/templates');
            console.log('Templates response:', response);
            const templates = Array.isArray(response) ? response : [];
            console.log(`Found ${templates.length} templates`);
            return templates;
        } catch (error) {
            console.error('Error fetching templates:', error);
            vscode.window.showErrorMessage(`Failed to fetch templates: ${error}`);
            return [];
        }
    }

    async getTemplate(id: string): Promise<Template | null> {
        try {
            console.log(`Fetching template with id: ${id}`);
            const response = await this.makeApiCall<any>(`/api/templates/${id}`);
            console.log('Raw API response:', response);

            // Normalize the template to ensure camelCase field names
            const template: Template = {
                id: response.id || response.Id,
                name: response.name || response.Name,
                category: response.category || response.Category,
                description: response.description || response.Description,
                content: response.content || response.Content,
                sampleData: response.sampleData || response.SampleData || null,
                isActive: response.isActive !== undefined ? response.isActive : response.IsActive,
                createdAt: response.createdAt || response.CreatedAt,
                updatedAt: response.updatedAt || response.UpdatedAt,
                userId: response.userId || response.UserId,
                schema: response.schema || response.Schema
            };

            console.log('Normalized template:', template);
            console.log('SampleData value:', template.sampleData);
            return template;
        } catch (error) {
            console.error('Error fetching template:', error);
            vscode.window.showErrorMessage(`Failed to fetch template: ${error}`);
            return null;
        }
    }

    async createTemplate(templateData: TemplateCreateRequest): Promise<Template | null> {
        try {
            // Convert to PascalCase for API (API expects C# naming conventions)
            const requestBody = {
                Name: templateData.name,
                Category: templateData.category,
                Description: templateData.description,
                Content: templateData.content,
                IsActive: templateData.isActive,
                SampleData: templateData.sampleData
            };
            
            // Remove undefined fields
            Object.keys(requestBody).forEach(key => {
                if (requestBody[key as keyof typeof requestBody] === undefined) {
                    delete requestBody[key as keyof typeof requestBody];
                }
            });
            
            const template = await this.makeApiCall<Template>('/api/templates', {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });
            return template;
        } catch (error) {
            console.error('Error creating template:', error);
            vscode.window.showErrorMessage(`Failed to create template: ${error}`);
            return null;
        }
    }

    async updateTemplate(id: string, templateData: Partial<Template>): Promise<Template | null> {
        try {
            // Validate that we have the required fields
            if (!templateData.name) {
                throw new Error('Name field is required');
            }
            if (!templateData.content) {
                throw new Error('Content field is required');
            }
            
            // Convert to PascalCase for API (API expects C# naming conventions)
            const requestBody: any = {
                Id: id,
                Name: templateData.name,
                Description: templateData.description || '',
                Content: templateData.content,
                Category: templateData.category || 'General',
                IsActive: templateData.isActive !== undefined ? templateData.isActive : true,
                Schema: templateData.schema || null,
                SampleData: templateData.sampleData || null,
                UpdatedAt: new Date().toISOString()
            };
            
            // Remove undefined fields but keep null and empty string values
            Object.keys(requestBody).forEach(key => {
                if (requestBody[key] === undefined) {
                    delete requestBody[key];
                }
            });
            
            const template = await this.makeApiCall<Template | null>(`/api/templates/${id}`, {
                method: 'PUT',
                body: JSON.stringify(requestBody)
            });
            // If API returns 204 No Content, consider it successful
            if (template === null) {
                // Return the data we sent as confirmation
                return {
                    id: id,
                    name: templateData.name!,
                    category: templateData.category!,
                    description: templateData.description!,
                    content: templateData.content!,
                    isActive: templateData.isActive!,
                    sampleData: templateData.sampleData || null,
                    schema: templateData.schema || null,
                    createdAt: '',
                    updatedAt: new Date().toISOString()
                } as Template;
            }
            return template;
        } catch (error) {
            console.error('Error updating template:', error);
            vscode.window.showErrorMessage(`Failed to update template: ${error}`);
            return null;
        }
    }

    async deleteTemplate(id: string): Promise<boolean> {
        try {
            await this.makeApiCall(`/api/templates/${id}`, {
                method: 'DELETE'
            });
            return true;
        } catch (error) {
            console.error('Error deleting template:', error);
            vscode.window.showErrorMessage(`Failed to delete template: ${error}`);
            return false;
        }
    }

    async testTemplate(id: string, sampleData: any): Promise<any> {
        try {
            console.log(`Testing template ${id} with data:`, sampleData);
            const result = await this.makeApiCall(`/api/templates/${id}/render?inputFormat=json&outputFormat=json`, {
                method: 'POST',
                body: JSON.stringify(sampleData)
            });
            console.log('Template test API response:', result);
            return result;
        } catch (error) {
            console.error('Error testing template:', error);
            throw error;
        }
    }

    async getUsage(): Promise<UsageInfo | null> {
        try {
            const usage = await this.makeApiCall<UsageInfo>('/api/usage/dashboard');
            return usage;
        } catch (error) {
            console.error('Error fetching usage:', error);
            return null;
        }
    }

    async searchTemplates(query: string): Promise<Template[]> {
        try {
            const allTemplates = await this.getTemplates();
            const searchQuery = query.toLowerCase();
            
            return allTemplates.filter(template => 
                template.name.toLowerCase().includes(searchQuery) ||
                template.description.toLowerCase().includes(searchQuery) ||
                template.category.toLowerCase().includes(searchQuery)
            );
        } catch (error) {
            console.error('Error searching templates:', error);
            return [];
        }
    }

    // Helper method to categorize templates
    async getTemplatesByCategory(): Promise<{ [category: string]: Template[] }> {
        const templates = await this.getTemplates();
        const categorized: { [category: string]: Template[] } = {};

        for (const template of templates) {
            const category = template.category || 'Uncategorized';
            if (!categorized[category]) {
                categorized[category] = [];
            }
            categorized[category].push(template);
        }

        return categorized;
    }

    // Method to validate template content (basic validation)
    validateTemplateContent(content: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        
        // Basic Scriban syntax validation
        const openBraces = (content.match(/{{/g) || []).length;
        const closeBraces = (content.match(/}}/g) || []).length;
        
        if (openBraces !== closeBraces) {
            errors.push('Mismatched {{ }} braces');
        }

        const openStatements = (content.match(/{%/g) || []).length;
        const closeStatements = (content.match(/%}/g) || []).length;
        
        if (openStatements !== closeStatements) {
            errors.push('Mismatched {% %} statement braces');
        }

        // Check for common Scriban block endings
        const ifBlocks = (content.match(/{%\s*if/g) || []).length;
        const endifBlocks = (content.match(/{%\s*endif/g) || []).length;
        
        if (ifBlocks !== endifBlocks) {
            errors.push('Mismatched if/endif blocks');
        }

        const forBlocks = (content.match(/{%\s*for/g) || []).length;
        const endforBlocks = (content.match(/{%\s*endfor/g) || []).length;
        
        if (forBlocks !== endforBlocks) {
            errors.push('Mismatched for/endfor blocks');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}