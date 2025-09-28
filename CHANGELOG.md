# Change Log

All notable changes to the "loro-templates" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.9] - 2025-09-28

### Fixed
- Fixed sample data not loading correctly when using the "RUN TEST" CodeLens command
- Improved handling of null/undefined sample data values from API
- Added better logging for debugging template data retrieval

## [1.0.0] - 2025-09-13

### Added
- 🎯 **Template Management**
  - Create, edit, and delete Scriban templates
  - Organize templates by categories
  - Search functionality across all templates
  - Template validation with error detection

- 🧪 **Testing & Preview**
  - Live template testing with sample data
  - Visual preview of rendered output
  - Performance metrics and rendering time tracking
  - CodeLens integration for inline testing

- ☁️ **Azure SQL Integration**
  - Secure template storage in Azure SQL
  - Team collaboration and template sharing
  - Version control and audit trails
  - REST API access for external integrations

- 📝 **Smart Editor Features**
  - Syntax highlighting for Scriban templates
  - IntelliSense with auto-completion
  - Real-time syntax validation
  - Code lens for quick actions

- 📊 **Usage Analytics**
  - API usage dashboard
  - Quota monitoring and tier management
  - Status bar usage indicators
  - Cost optimization features

- 🔧 **VS Code Integration**
  - Dedicated template explorer panel
  - Command palette integration
  - Keyboard shortcuts for common actions
  - Auto-save to server functionality

- 🔒 **Security & Authentication**
  - Secure API key management
  - HTTPS-only communications
  - Encrypted template storage
  - Access control and permissions

### Security
- All API communications encrypted with HTTPS
- Secure credential storage using VS Code secrets API
- API key authentication for all operations

### Technical
- Built with TypeScript for type safety
- Modular architecture for maintainability
- Error handling and user feedback
- Background sync and auto-refresh
- Comprehensive testing framework

---

## Supported Features

### Template Operations
- ✅ Create new templates with categories
- ✅ Edit templates with live syntax highlighting
- ✅ Delete templates with confirmation
- ✅ Search and filter templates
- ✅ Auto-save changes to server

### Testing & Validation
- ✅ Test templates with custom sample data
- ✅ Real-time syntax validation
- ✅ Performance monitoring
- ✅ Error reporting with line numbers

### Collaboration
- ✅ Share templates across teams
- ✅ Centralized template storage
- ✅ Version control and history
- ✅ Access management

### Integration
- ✅ REST API for external applications
- ✅ Command line interface
- ✅ VS Code command palette
- ✅ Status bar integration

---

**Built with ❤️ by the Loro Templates Team**

For support and documentation, visit [www.lorotemplates.com](https://www.lorotemplates.com)