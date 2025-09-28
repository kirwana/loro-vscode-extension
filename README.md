# 🚀 Loro Templates - Professional Scriban Template Manager

<div align="center">

[![Version](https://img.shields.io/visual-studio-marketplace/v/lorotemplates.loro-templates)](https://marketplace.visualstudio.com/items?itemName=lorotemplates.loro-templates)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/lorotemplates.loro-templates)](https://marketplace.visualstudio.com/items?itemName=lorotemplates.loro-templates)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/lorotemplates.loro-templates)](https://marketplace.visualstudio.com/items?itemName=lorotemplates.loro-templates)
[![License](https://img.shields.io/badge/license-GPL--2.0-blue.svg)](LICENSE)

**Enterprise-grade template management for modern development teams**

[🎯 Install Now](https://marketplace.visualstudio.com/items?itemName=lorotemplates.loro-templates) | [📖 Documentation](https://www.lorotemplates.com/docs) | [🔑 Get API Key](https://www.lorotemplates.com/login)

</div>

---

## ✨ Why Loro Templates?

Stop wrestling with template management! Loro Templates brings **enterprise-grade template management** directly into VS Code, powered by Azure SQL and designed for teams that demand reliability, security, and speed.

### 🎯 Perfect For:
- **📧 Email Marketing Teams** - Manage and test email templates with live preview
- **📄 Document Generation** - Create invoices, reports, and contracts programmatically  
- **🔧 DevOps Teams** - Generate configuration files and deployment scripts
- **💼 Enterprise Applications** - Centralized template management with version control

## 🌟 Key Features

### 📝 **Smart Template Editor**
- ✅ **Syntax Highlighting** - Beautiful Scriban syntax highlighting
- ✅ **IntelliSense** - Auto-completion for variables and functions
- ✅ **Error Detection** - Real-time syntax validation
- ✅ **Code Lens** - Inline actions for testing and validation

### 🧪 **Live Testing & Preview**
- ✅ **Instant Testing** - Test templates with sample data in one click
- ✅ **Visual Preview** - See rendered output side-by-side
- ✅ **Sample Data Generator** - Auto-generate test data from template variables
- ✅ **Performance Metrics** - Track rendering time and API usage

### ☁️ **Azure SQL Integration**
- ✅ **Centralized Storage** - All templates stored securely in Azure SQL
- ✅ **Team Collaboration** - Share templates across your organization
- ✅ **Version Control** - Track changes and rollback when needed
- ✅ **API Access** - Use templates in any application via REST API

### 📊 **Usage Analytics**
- ✅ **Usage Dashboard** - Monitor API calls and quotas
- ✅ **Tier Management** - Track your subscription status
- ✅ **Cost Optimization** - Prevent overage charges

## 🚀 Quick Start

### 1️⃣ **Get Your API Key**

[Sign up for free at lorotemplates.com](https://www.lorotemplates.com/login) to get your API key.

### 2️⃣ **Install the Extension**

Click the install button above or search for "Loro Templates" in VS Code Extensions.

### 3️⃣ **Login to Your Account**

```
1. Open Command Palette (Cmd/Ctrl + Shift + P)
2. Run "Loro: Login"
3. Enter your API key
```

### 4️⃣ **Start Creating!**

```
1. Click the Loro Templates icon in the sidebar
2. Click "+" to create a new template
3. Start coding with full IntelliSense support!
```

## 💡 Use Cases

### Email Templates
```scriban
<!DOCTYPE html>
<html>
<body>
    <h1>Welcome {{ user.name }}!</h1>
    <p>Your order #{{ order.id }} has been confirmed.</p>
    {{ for item in order.items }}
        <li>{{ item.name }} - ${{ item.price }}</li>
    {{ end }}
    <p>Total: ${{ order.total }}</p>
</body>
</html>
```

### Invoice Generation
```scriban
INVOICE #{{ invoice.number }}
Date: {{ invoice.date | date.format 'MM/dd/yyyy' }}

Bill To:
{{ customer.name }}
{{ customer.address }}

{{ for line in invoice.lines }}
{{ line.description }} - ${{ line.amount | math.format '0.00' }}
{{ end }}

Total: ${{ invoice.total | math.format '0.00' }}
```

### Configuration Files
```scriban
{
  "server": "{{ config.server }}",
  "port": {{ config.port }},
  "features": [
    {{ for feature in config.features }}
    "{{ feature }}"{{ if !for.last }},{{ end }}
    {{ end }}
  ]
}
```

## 🛠️ Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| `Loro: Login` | Connect to your Loro account | - |
| `Loro: Create Template` | Create a new template | - |
| `Loro: Test Template` | Test with sample data | - |
| `Loro: Save to Server` | Save changes to Azure | `Ctrl+S` |
| `Loro: Show Usage` | View usage dashboard | - |
| `Loro: Refresh Templates` | Refresh template list | - |

## 🔧 Configuration

Configure the extension in your VS Code settings:

```json
{
  "loro.apiEndpoint": "https://api.lorotemplates.com",
  "loro.autoSave": true,
  "loro.validateOnSave": true,
  "loro.showCodeLens": true
}
```

## 📋 Features in Detail

### Template Organization
- **Categories** - Organize templates by category
- **Search** - Quick search across all templates
- **Metadata** - Add descriptions and tags to templates

### Intelligent Code Assistance
- **Variable Detection** - Automatically detect template variables
- **Function Hints** - IntelliSense for Scriban functions
- **Syntax Validation** - Real-time error checking

### Testing & Debugging
- **Sample Data Management** - Save and reuse test data
- **Error Highlighting** - Clear error messages with line numbers
- **Performance Metrics** - Track rendering time

### Team Collaboration
- **Shared Templates** - Share templates across your team
- **Access Control** - Manage who can edit templates
- **Audit Trail** - Track all template changes

## 🔒 Security & Compliance

- **Encrypted Storage** - All templates stored encrypted in Azure SQL
- **API Key Authentication** - Secure API key management
- **HTTPS Only** - All communications over secure channels
- **GPL-2.0 Licensed** - Open source with copyleft protection

## 📈 API Pricing Tiers

| Tier | API Calls/Month | Price | Best For |
|------|----------------|-------|----------|
| **Free** | 100 | $0 | Individual developers |
| **Starter** | 3,000 | $9 | Small teams |
| **Growth** | 15,000 | $29 | Growing teams |
| **Professional** | 50,000 | $79 | Growing businesses |
| **Scale** | 150,000 | $199 | Large teams |
| **Enterprise** | Unlimited | Custom | Large organizations |

[View Full Pricing →](https://www.lorotemplates.com/pricing)

## 🎯 Why Choose Loro Templates?

### For Developers
- Save hours with intelligent code completion
- Test templates without leaving VS Code
- Integrate with any application via REST API

### For Teams
- Centralized template management
- Consistent branding across all communications
- Reduce errors with validated templates

### For Enterprises
- Scalable Azure infrastructure
- Compliance-ready with audit trails
- Custom integrations available

## 🤝 Getting Help

- 📖 [Documentation](https://www.lorotemplates.com/docs)
- 📧 [Email Support](mailto:support@lorotemplates.com)

## 📄 License

This extension is licensed under the [GPL-2.0 License](LICENSE).

## 🚀 Powered by Scriban

This extension is built on top of [Scriban](https://github.com/scriban/scriban) - the fast, powerful, safe and lightweight scripting language and engine for .NET. Scriban is licensed under the [BSD 2-Clause License](https://github.com/scriban/scriban/blob/master/license.txt).

## 🎉 What Users Are Saying

> "Loro Templates transformed how we manage email templates. The Azure integration is seamless!" - **Sarah M., Marketing Director**

> "Finally, a template manager that understands enterprise needs. The testing feature alone saves us hours weekly." - **John D., DevOps Lead**

> "The IntelliSense for Scriban is incredible. It's like having a template expert built into VS Code." - **Mike R., Full Stack Developer**

---

<div align="center">

**Built with ❤️ by the Loro Templates Team**

[Website](https://www.lorotemplates.com) • [Get Started](https://www.lorotemplates.com/login) • [Documentation](https://www.lorotemplates.com/docs)

</div>