# Loro Templates - VS Code Extension

A powerful VS Code extension for working with Scriban templates through the Loro Templates service.

## Features

- **Authentication**: Login with your Loro Templates API key
- **Template Management**: Browse, create, edit, and delete templates directly from VS Code
- **Scriban Language Support**: Syntax highlighting, auto-completion, and validation for Scriban templates
- **Integrated Testing**: Test templates with sample data without leaving VS Code
- **Usage Tracking**: Monitor your API usage and billing information
- **CodeLens Integration**: Inline template testing and validation buttons

## Getting Started

1. Install the extension from the VS Code Marketplace
2. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
3. Run "Loro: Login to Loro Templates"
4. Enter your API key from [lorotemplates.com](https://lorotemplates.com)
5. Your templates will appear in the Loro Templates view in the Explorer sidebar

## Features Overview

### Template Sidebar
- Browse templates organized by category
- Quick access to template actions (open, test, delete)
- Refresh templates with a single click

### Scriban Language Support
- Syntax highlighting for `.scriban` and `.sbn` files
- Auto-completion for Scriban functions and objects
- Code folding for template blocks
- Error detection and validation

### Template Testing
- Test templates with custom JSON data
- CodeLens integration for quick testing
- Visual test results with timing information
- Sample data generation based on template variables

### Usage Dashboard
- Real-time API usage monitoring
- Billing information and usage alerts
- Plan upgrade suggestions
- Template statistics

## Commands

- `Loro: Login to Loro Templates` - Authenticate with your API key
- `Loro: Logout from Loro Templates` - Sign out
- `Loro: Create New Template` - Create a new template
- `Loro: Refresh Templates` - Reload template list
- `Loro: Show Usage Dashboard` - Open usage and billing information

## Configuration

The extension can be configured through VS Code settings:

- `loro.apiEndpoint` - API endpoint (default: https://api.lorotemplates.com)
- `loro.autoSync` - Automatically sync templates (default: true)
- `loro.testOnSave` - Run tests when saving templates (default: false)
- `loro.showUsageInStatusBar` - Show usage in status bar (default: true)

## Requirements

- VS Code 1.74.0 or newer
- Active Loro Templates account with API key
- Internet connection for template synchronization

## File Associations

The extension automatically recognizes:
- `.scriban` files - Scriban templates
- `.sbn` files - Scriban templates (short extension)

## Extension Development

This extension is built with TypeScript and uses the VS Code Extension API.

### Building from Source

```bash
npm install
npm run compile
```

### Running in Development

1. Open this folder in VS Code
2. Press F5 to run the extension in a new Extension Development Host window
3. Test the extension functionality

## Support

- Visit [lorotemplates.com](https://lorotemplates.com) for account management
- Check the [documentation](https://lorotemplates.com/docs) for Scriban template syntax
- Report issues on the [GitHub repository](https://github.com/lorotemplates/vscode-extension)

## License

This extension is licensed under the MIT License.