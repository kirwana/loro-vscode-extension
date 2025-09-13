import * as vscode from 'vscode';
import { Template } from '../types';
import { TemplateService } from './templateService';

export class TemplateTreeProvider implements vscode.TreeDataProvider<TemplateTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TemplateTreeItem | undefined | null | void> = 
        new vscode.EventEmitter<TemplateTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TemplateTreeItem | undefined | null | void> = 
        this._onDidChangeTreeData.event;

    private templates: Template[] = [];
    private groupByCategory = true;

    constructor(private templateService: TemplateService) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TemplateTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: TemplateTreeItem): Promise<TemplateTreeItem[]> {
        if (!element) {
            // Root level - show categories or templates
            await this.loadTemplates();
            
            if (this.templates.length === 0) {
                return [new TemplateTreeItem('No templates found', '', vscode.TreeItemCollapsibleState.None, 'info')];
            }

            if (this.groupByCategory) {
                return this.getCategoryItems();
            } else {
                return this.templates.map(template => 
                    new TemplateTreeItem(
                        template.name, 
                        template.id, 
                        vscode.TreeItemCollapsibleState.None, 
                        'template',
                        template
                    )
                );
            }
        } else if (element.contextValue === 'category') {
            // Category level - show templates in this category
            const categoryTemplates = this.templates.filter(t => t.category === element.id);
            return categoryTemplates.map(template => 
                new TemplateTreeItem(
                    template.name, 
                    template.id, 
                    vscode.TreeItemCollapsibleState.None, 
                    'template',
                    template
                )
            );
        }

        return [];
    }

    private async loadTemplates(): Promise<void> {
        try {
            console.log('Tree provider loading templates...');
            this.templates = await this.templateService.getTemplates();
            console.log('Tree provider loaded templates:', this.templates);
        } catch (error) {
            console.error('Error loading templates:', error);
            this.templates = [];
        }
    }

    private getCategoryItems(): TemplateTreeItem[] {
        const categories = new Map<string, Template[]>();
        
        // Group templates by category
        for (const template of this.templates) {
            const category = template.category || 'Uncategorized';
            if (!categories.has(category)) {
                categories.set(category, []);
            }
            categories.get(category)!.push(template);
        }

        // Create category tree items
        const categoryItems: TemplateTreeItem[] = [];
        for (const [categoryName, templates] of categories.entries()) {
            const categoryItem = new TemplateTreeItem(
                `${categoryName} (${templates.length})`,
                categoryName,
                vscode.TreeItemCollapsibleState.Collapsed,
                'category'
            );
            categoryItem.iconPath = new vscode.ThemeIcon('folder');
            categoryItems.push(categoryItem);
        }

        return categoryItems.sort((a, b) => a.label!.toString().localeCompare(b.label!.toString()));
    }

    // Method to toggle between category view and flat view
    toggleGroupByCategory(): void {
        this.groupByCategory = !this.groupByCategory;
        this.refresh();
    }

    // Method to filter templates
    async filterTemplates(searchTerm: string): Promise<void> {
        if (!searchTerm) {
            this.refresh();
            return;
        }

        try {
            this.templates = await this.templateService.searchTemplates(searchTerm);
            this.refresh();
        } catch (error) {
            console.error('Error filtering templates:', error);
        }
    }
}

class TemplateTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly id: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        public readonly template?: Template
    ) {
        super(label, collapsibleState);

        this.id = id;
        this.contextValue = contextValue;

        if (template) {
            this.tooltip = this.createTooltip(template);
            this.description = this.createDescription(template);
            this.iconPath = this.getTemplateIcon(template);
            
            // Add command to open template on click
            this.command = {
                command: 'loro.openTemplate',
                title: 'Open Template',
                arguments: [template]
            };
        }
    }

    private createTooltip(template: Template): string {
        return [
            `Name: ${template.name}`,
            `Category: ${template.category}`,
            `Description: ${template.description}`,
            `Status: ${template.isActive ? 'Active' : 'Inactive'}`,
            `Created: ${new Date(template.createdAt).toLocaleDateString()}`,
            `Updated: ${new Date(template.updatedAt).toLocaleDateString()}`
        ].join('\n');
    }

    private createDescription(template: Template): string {
        const parts: string[] = [];
        
        if (!template.isActive) {
            parts.push('(inactive)');
        }
        
        if (template.description && template.description.length > 0) {
            const shortDesc = template.description.length > 50 
                ? template.description.substring(0, 47) + '...'
                : template.description;
            parts.push(shortDesc);
        }

        return parts.join(' ');
    }

    private getTemplateIcon(template: Template): vscode.ThemeIcon {
        if (!template.isActive) {
            return new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('problemsWarningIcon.foreground'));
        }

        // Different icons based on category or content type
        const category = template.category.toLowerCase();
        if (category.includes('email')) {
            return new vscode.ThemeIcon('mail');
        } else if (category.includes('report')) {
            return new vscode.ThemeIcon('graph');
        } else if (category.includes('invoice') || category.includes('billing')) {
            return new vscode.ThemeIcon('credit-card');
        } else if (category.includes('notification')) {
            return new vscode.ThemeIcon('bell');
        } else {
            return new vscode.ThemeIcon('file-text');
        }
    }
}