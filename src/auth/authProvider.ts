import * as vscode from 'vscode';
import { AuthCredentials } from '../types';
import { httpRequest } from '../utils/httpClient';

export class AuthProvider {
    private static readonly API_KEY_SECRET = 'loro.apiKey';
    private static readonly USER_EMAIL_KEY = 'loro.userEmail';
    
    private _isAuthenticated = false;

    constructor(private context: vscode.ExtensionContext) {}

    async initialize(): Promise<void> {
        const apiKey = await this.context.secrets.get(AuthProvider.API_KEY_SECRET);
        if (apiKey) {
            const isValid = await this.validateApiKey(apiKey);
            if (isValid) {
                this._isAuthenticated = true;
                await vscode.commands.executeCommand('setContext', 'loro.authenticated', true);
            } else {
                // Invalid stored key, remove it
                await this.context.secrets.delete(AuthProvider.API_KEY_SECRET);
                await this.context.globalState.update(AuthProvider.USER_EMAIL_KEY, undefined);
            }
        }
    }

    async login(): Promise<boolean> {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your Loro Templates API Key',
            password: true,
            placeHolder: 'Get your API key from lorotemplates.com dashboard',
            ignoreFocusOut: true
        });

        if (!apiKey) {
            return false;
        }

        // Show progress while validating
        return await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Validating API key...',
            cancellable: false
        }, async () => {
            const isValid = await this.validateApiKey(apiKey);
            
            if (isValid) {
                // Store credentials
                await this.context.secrets.store(AuthProvider.API_KEY_SECRET, apiKey);
                
                // Try to get user info
                const userEmail = await this.fetchUserEmail(apiKey);
                if (userEmail) {
                    await this.context.globalState.update(AuthProvider.USER_EMAIL_KEY, userEmail);
                }

                this._isAuthenticated = true;
                await vscode.commands.executeCommand('setContext', 'loro.authenticated', true);
                return true;
            } else {
                vscode.window.showErrorMessage('Invalid API key. Please check your API key and try again.');
                return false;
            }
        });
    }

    async logout(): Promise<void> {
        await this.context.secrets.delete(AuthProvider.API_KEY_SECRET);
        await this.context.globalState.update(AuthProvider.USER_EMAIL_KEY, undefined);
        this._isAuthenticated = false;
        await vscode.commands.executeCommand('setContext', 'loro.authenticated', false);
    }

    async getCredentials(): Promise<AuthCredentials | null> {
        const apiKey = await this.context.secrets.get(AuthProvider.API_KEY_SECRET);
        if (!apiKey) {
            return null;
        }

        const userEmail = this.context.globalState.get<string>(AuthProvider.USER_EMAIL_KEY);
        
        return {
            apiKey,
            userEmail
        };
    }

    isAuthenticated(): boolean {
        return this._isAuthenticated;
    }

    private async validateApiKey(apiKey: string): Promise<boolean> {
        try {
            const config = vscode.workspace.getConfiguration('loro');
            const apiEndpoint = config.get<string>('apiEndpoint', 'https://api.lorotemplates.com');
            
            console.log(`Validating API key against: ${apiEndpoint}/api/usage/dashboard`);
            console.log(`API Key: ${apiKey.substring(0, 8)}...`);
            
            const response = await httpRequest(`${apiEndpoint}/api/usage/dashboard`, {
                method: 'GET',
                headers: {
                    'X-API-Key': apiKey,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`Response status: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API validation error:', errorText);
                
                // Show detailed error to user
                vscode.window.showErrorMessage(
                    `API Key validation failed: ${response.status} ${response.statusText}. ` +
                    `Make sure your local development server is running on port 5000.`
                );
            }

            return response.ok;
        } catch (error) {
            console.error('Error validating API key:', error);
            
            vscode.window.showErrorMessage(
                `Failed to connect to API: ${error}. ` +
                `Make sure your local development server is running.`
            );
            
            return false;
        }
    }

    private async fetchUserEmail(apiKey: string): Promise<string | null> {
        try {
            const config = vscode.workspace.getConfiguration('loro');
            const apiEndpoint = config.get<string>('apiEndpoint', 'https://api.lorotemplates.com');
            
            const response = await httpRequest(`${apiEndpoint}/api/usage/dashboard`, {
                method: 'GET',
                headers: {
                    'X-API-Key': apiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                // The usage dashboard doesn't return email, but we can store it from localStorage concept
                // For now, return null and we'll enhance this later
                return null;
            }
        } catch (error) {
            console.error('Error fetching user email:', error);
        }
        
        return null;
    }
}