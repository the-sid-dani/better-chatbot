# Samba Orion

[![MCP Supported](https://img.shields.io/badge/MCP-Supported-00c853)](https://modelcontextprotocol.io/introduction)
[![Local First](https://img.shields.io/badge/Local-First-blue)](https://localfirstweb.dev/)
[![Built on Better-Chatbot](https://img.shields.io/badge/Built_on-Better--Chatbot-blue)](https://github.com/cgoinglove/better-chatbot)

[![Deploy with Vercel](https://vercel.com/button)](<https://vercel.com/new/clone?repository-url=https://github.com/cgoinglove/better-chatbot&env=BETTER_AUTH_SECRET&env=OPENAI_API_KEY&env=GOOGLE_GENERATIVE_AI_API_KEY&env=ANTHROPIC_API_KEY&envDescription=BETTER_AUTH_SECRET+is+required+(enter+any+secret+value).+At+least+one+LLM+provider+API+key+(OpenAI,+Claude,+or+Google)+is+required,+but+you+can+add+all+of+them.+See+the+link+below+for+details.&envLink=https://github.com/cgoinglove/better-chatbot/blob/main/.env.example&demo-title=samba-orion&demo-description=A+comprehensive+AI+platform+built+with+Next.js+and+the+AI+SDK+by+Vercel.&products=[{"type":"integration","protocol":"storage","productSlug":"neon","integrationSlug":"neon"},{"type":"integration","protocol":"storage","productSlug":"upstash-kv","integrationSlug":"upstash"}]>)

🚀 **[Live Demo](https://samba-orion.vercel.app/)** | Experience the future of AI assistance

**Samba Orion** is a comprehensive AI platform where teams and individuals can harness the full power of artificial intelligence through advanced conversations, data visualization, workflow automation, and intelligent tooling. Built on cutting-edge technology to rival ChatGPT, Claude, and other leading AI assistants.

## ✨ Key Features

• **🤖 Multi-AI Support** - Unified access to OpenAI, Anthropic, Google, xAI, Ollama, and OpenRouter models
• **🛠️ Advanced Tooling** - MCP protocol integration, web search, code execution, and comprehensive data visualization
• **📊 Canvas Workspace** - Multi-grid dashboard system with 16+ chart types and real-time visualization
• **🎯 Smart Agents** - Create custom AI agents with specific instructions, tool access, and granular permissions
• **⚡ Visual Workflows** - Build complex automation sequences with drag-and-drop workflow designer
• **🎙️ Voice Assistant** - Real-time voice chat with full tool integration using OpenAI's Realtime API
• **👥 Admin Dashboard** - Comprehensive user management, agent permissions, and system administration
• **🔍 Observability** - Full conversation tracing, cost monitoring, and performance analytics via Langfuse
• **📱 Intuitive UX** - Context-aware `@mentions`, tool presets, and seamless multi-modal interactions

Built entirely on **Vercel AI SDK v5.0.26** as the foundational AI framework, with Next.js 15, TypeScript, and enterprise-grade observability.


## 🚀 Quick Start

> **⚠️ Important**: This application must run on `localhost:3000` and will not work on other ports due to authentication and observability system requirements.

```bash
# 1. Clone the repository
git clone https://github.com/cgoinglove/better-chatbot.git
cd better-chatbot

# 2. Install pnpm (if you don't have it)
npm install -g pnpm

# 3. Install dependencies and auto-generate .env file
pnpm i

# 4. Start PostgreSQL database (choose one option)
# Option A: Use Docker (recommended)
pnpm docker:pg

# Option B: Use your own PostgreSQL
# Update POSTGRES_URL in .env with your database connection string

# 5. Configure environment variables in .env
# Required: At least one LLM provider API key
# - OPENAI_API_KEY (recommended)
# - ANTHROPIC_API_KEY
# - GOOGLE_GENERATIVE_AI_API_KEY
# Required: BETTER_AUTH_SECRET (auto-generated)
# Optional: EXA_API_KEY for web search capabilities

# 6. Start the application
pnpm build:local && pnpm start

# Alternative: Development mode with hot-reload
# pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to get started.

**First-time setup**: The application will automatically create database tables and you can start chatting immediately.

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Preview](#preview)
  - [📊 Canvas Workspace & Multi-Chart Dashboards](#-canvas-workspace--multi-chart-dashboards)
  - [👥 Admin Dashboard & User Management](#-admin-dashboard--user-management)
  - [🧩 Browser Automation with Playwright MCP](#-browser-automation-with-playwright-mcp)
  - [🔗 Visual Workflows as Custom Tools](#-visual-workflows-as-custom-tools)
  - [🤖 Custom Agents with Granular Permissions](#-custom-agents-with-granular-permissions)
  - [🎙️ Realtime Voice Assistant + MCP Tools](#️-realtime-voice-assistant--mcp-tools)
  - [⚡️ Quick Tool Mentions (`@`) \& Presets](#️-quick-tool-mentions---presets)
  - [🛠️ Advanced Built-in Tools](#️-advanced-built-in-tools)
    - [🌐 Web Search with Semantic AI](#-web-search-with-semantic-ai)
    - [⚡️ JavaScript & Python Code Execution](#️-javascript--python-code-execution)
    - [📊 Comprehensive Data Visualization](#-comprehensive-data-visualization)
- [Architecture & Technology](#architecture--technology)
- [Getting Started](#getting-started)
  - [Docker Compose Deployment 🐳](#docker-compose-deployment-)
  - [Local Development Setup 🚀](#local-development-setup-)
  - [Environment Configuration](#environment-configuration)
- [📘 Setup Guides](#-setup-guides)
    - [🔌 MCP Server Setup \& Tool Testing](#-mcp-server-setup--tool-testing)
    - [🐳 Docker Hosting Guide](#-docker-hosting-guide)
    - [▲ Vercel Hosting Guide](#-vercel-hosting-guide)
    - [🎯 System Prompts \& Chat Customization](#-system-prompts--chat-customization)
    - [🔐 OAuth Sign-In Setup](#-oauth-sign-in-setup)
    - [🕵🏿 Adding OpenAI-Compatible Providers](#-adding-openai-compatible-providers)
    - [🧪 E2E Testing Guide](#-e2e-testing-guide)
- [💡 Tips \& Tricks](#-tips--tricks)
    - [💬 Temporary Chat Windows](#-temporary-chat-windows)
- [🗺️ Roadmap](#️-roadmap)
- [🙌 Contributing](#-contributing)
- [💬 Join Our Discord](#-join-our-discord)

> This project is evolving at lightning speed! ⚡️ We're constantly shipping new features and smashing bugs. **Star this repo** to join the ride and stay in the loop with the latest updates!

## Preview

Get a feel for the comprehensive capabilities — here's what makes Samba Orion unique.

### 📊 Canvas Workspace & Multi-Chart Dashboards

<img width="1912" height="953" alt="canvas-workspace" loading="lazy" src="https://github.com/user-attachments/assets/canvas-visualization-demo" />

**Example:** Real-time data visualization with progressive chart building as AI creates insights.

- **16+ Chart Types**: Bar, line, pie, area, funnel, radar, scatter, treemap, sankey, radial bar, composed charts, geographic maps (world/US), gauge, and calendar heatmaps
- **Progressive Building**: Charts stream to Canvas workspace as AI processes data and creates visualizations
- **Smart Dashboard Layout**: Multi-grid system that scales from single charts to complex dashboards
- **Interactive Canvas**: Resize, reorganize, and manage multiple visualizations in a unified workspace
- **Geographic Intelligence**: World maps and US state/county visualizations with TopoJSON support

Canvas integrates seamlessly with chat using ResizablePanelGroup for optimal screen real estate management.

### 👥 Admin Dashboard & User Management

<img width="1567" alt="admin-dashboard" loading="lazy" src="https://github.com/user-attachments/assets/admin-management-ui" />

**Example:** Comprehensive administrative control for team deployments and agent management.

- **User Management**: Role-based access control, user analytics, and account administration
- **Agent Permissions**: Granular control over who can use, edit, or access custom agents
- **System Analytics**: Track usage patterns, model performance, and cost analytics
- **Tabbed Interface**: Clean organization of agents, users, and system settings
- **Permission Levels**: Use vs Edit permissions with selective sharing capabilities

Perfect for organizations deploying AI platforms for team collaboration and productivity.

### 🧩 Browser Automation with Playwright MCP

![preview](https://github.com/user-attachments/assets/e4febb04-26d5-45da-a7bb-f7d452d333c2)


**Example:** Control a web browser using Microsoft's [playwright-mcp](https://github.com/microsoft/playwright-mcp) tool.

- The LLM autonomously decides how to use tools from the MCP server, calling them multiple times to complete a multi-step task and return a final message.

Sample prompt:

```prompt
1. Use the @tool('web-search') to look up information about “modelcontetprotocol.”

2. Then, using : @mcp("playwright")
   - navigate Google (https://www.google.com)
   - Click the “Login” button
   - Enter my email address (neo.cgoing@gmail.com)
   - Clock the "Next"  button
   - Close the browser
```

<br/>

### 🔗 Visual Workflows as Custom Tools

<img width="1912" height="953" alt="workflow" loading="lazy" src="https://github.com/user-attachments/assets/e69e72e8-595c-480e-b519-4531f4c6331f" />

<img width="1567" alt="workflow-mention" loading="lazy" src="https://github.com/user-attachments/assets/cf3e1339-ee44-4615-a71d-f6b46833e41f" />

**Example:** Create custom workflows that become callable tools in your chat conversations.

- Build visual workflows by connecting LLM nodes (for AI reasoning) and Tool nodes (for MCP tool execution)
- Publish workflows to make them available as `@workflow_name` tools in chat
- Chain complex multi-step processes into reusable, automated sequences

<br/>

### 🤖 Custom Agents with Granular Permissions

<img width="1567" alt="agent-example" loading="lazy" src="https://github.com/user-attachments/assets/d0a325c0-ff1e-4038-b6bf-fcf57659a5c1" />

**Example:** Create specialized AI agents with sophisticated permission controls and tool access management.

- **Custom Instructions**: Define specific system prompts, personalities, and behavioral guidelines
- **Tool Access Control**: Configure which MCP servers, workflows, and built-in tools each agent can use
- **Granular Permissions**: Set "use" or "edit" permissions for different users and teams
- **Visibility Levels**: Private, public, readonly, admin-shared, admin-selective, and admin-all access levels
- **Smart Invocation**: Easily invoke agents in chat using `@agent_name` with context awareness

**Advanced Use Cases:**
- **GitHub Manager Agent**: With GitHub MCP tools, repository context, and selective team access
- **Data Analysis Agent**: With Canvas visualization tools, Python execution, and read-only sharing
- **Customer Support Agent**: With knowledge base access, limited tool permissions, and public availability
- **Admin Utility Agent**: With system tools, administrative permissions, and admin-only access

The permission system supports complex organizational structures with fine-grained access control.

<br/>

### 🎙️ Realtime Voice Assistant + MCP Tools

<p align="center">
  <video src="https://github.com/user-attachments/assets/e2657b8c-ce0b-40dd-80b6-755324024973" width="100%" />
</p>

This demo showcases a **realtime voice-based chatbot assistant** built with OpenAI's new Realtime API — now extended with full **MCP tool integration**.
Talk to the assistant naturally, and watch it execute tools in real time.

### ⚡️ Quick Tool Mentions (`@`) & Presets

<img width="1225" alt="image" src="https://github.com/user-attachments/assets/dfe76b3b-c3d8-436e-8a7c-7b23292e234c" loading="lazy"/>

Quickly call tool during chat by typing `@toolname`.
No need to memorize — just type `@` and pick from the list!

**Tool Selection vs. Mentions (`@`) — When to Use What:**

- **Tool Selection**: Make frequently used tools always available to the LLM across all chats. Great for convenience and maintaining consistent context over time.
- **Mentions (`@`)**: Temporarily bind only the mentioned tools for that specific response. Since only the mentioned tools are sent to the LLM, this saves tokens and can improve speed and accuracy.

Each method has its own strengths — use them together to balance efficiency and performance.

You can also create **tool presets** by selecting only the MCP servers or tools you need.
Switch between presets instantly with a click — perfect for organizing tools by task or workflow.

### 🧭 Tool Choice Mode

<img width="1225" alt="image" src="https://github.com/user-attachments/assets/8fc64c6a-30c9-41a4-a5e5-4e8804f73473" loading="lazy"/>

Control how tools are used in each chat with **Tool Choice Mode** — switch anytime with `⌘P`.

- **Auto:** The model automatically calls tools when needed.
- **Manual:** The model will ask for your permission before calling a tool.
- **None:** Tool usage is disabled completely.

This lets you flexibly choose between autonomous, guided, or tool-free interaction depending on the situation.

### 🛠️ Advanced Built-in Tools

#### 🌐 Web Search with Semantic AI

<img width="1034" height="940" alt="web-search" src="https://github.com/user-attachments/assets/261037d9-e1a7-44ad-b45e-43780390a94e" />

Intelligent web search powered by [Exa AI](https://exa.ai) with semantic understanding and content extraction.

- **Semantic Search**: AI-powered search that understands context and intent
- **Content Extraction**: Direct URL content analysis and summarization
- **Free Tier**: 1,000 requests/month with no credit card required
- **Setup**: Add `EXA_API_KEY` to `.env` - get your key at [dashboard.exa.ai](https://dashboard.exa.ai)

#### ⚡️ JavaScript & Python Code Execution

<img width="1225" alt="js-executor-preview" src="https://github.com/user-attachments/assets/7deed824-e70b-46d4-a294-de20ed4dc869" loading="lazy"/>

Secure, sandboxed code execution environment with syntax highlighting and error handling.

- **JavaScript**: Full ES6+ support with npm package imports
- **Python**: Complete Python 3.x environment with popular data science libraries
- **Safety**: Sandboxed execution prevents system access
- **Rich Output**: Supports text, HTML, and data structure visualization

#### 📊 Comprehensive Data Visualization

**Interactive Tables**: Enterprise-grade data table component with advanced features:
- **Sorting & Filtering**: Multi-column sorting, real-time filtering, and search highlighting
- **Export Capabilities**: CSV and Excel export with lazy-loaded libraries
- **Column Management**: Show/hide columns, resize, and reorder functionality
- **Performance**: Efficient pagination and virtualization for large datasets
- **Type Support**: Smart formatting for strings, numbers, dates, booleans, and custom types

**Canvas Workspace**: Revolutionary multi-grid dashboard system revolutionizing AI-powered visualization:
- **16+ Chart Types**:
  - **Core Charts**: Bar, line, pie, area with responsive scaling
  - **Advanced**: Funnel, radar, scatter, treemap, sankey, radial bar, composed charts
  - **Geographic**: World maps, US states/counties with TopoJSON support
  - **Specialized**: Gauge charts, calendar heatmaps for temporal data
- **Progressive Building**: Charts stream to Canvas as AI creates insights with loading states
- **Smart Layout**: CSS Grid system automatically scales from 1x1 to 2x2+ based on chart count
- **Workspace Integration**: ResizablePanelGroup provides seamless Canvas/chat proportions
- **Intelligent Naming**: Auto-generated Canvas names based on chart content analysis

**Additional Tools**: HTTP client for API requests, file processing, workflow automation, and extensive MCP protocol integrations.

<br/>

…and there's even more waiting for you.
Try it out and see what else it can do!

<br/>

## Architecture & Technology

**Foundational Framework**: Built entirely on **Vercel AI SDK v5.0.26** as the core AI abstraction layer, providing unified access to all AI providers through consistent streaming patterns.

### Core Technology Stack
- **AI Framework**: Vercel AI SDK with `streamText`, `generateText`, and native tool integration
- **Framework**: Next.js 15.3.2 with App Router and React 19.1.1
- **Database**: PostgreSQL with Drizzle ORM 0.41.0 and 16 comprehensive migrations
- **Authentication**: Better-Auth 1.3.7 with OAuth support (Google, GitHub, Microsoft)
- **Observability**: Langfuse SDK v4.1.0 with OpenTelemetry for complete tracing and cost monitoring
- **UI**: Tailwind CSS 4.1.12, Radix UI primitives, Framer Motion animations
- **Testing**: Vitest 3.2.4 (unit), Playwright 1.55.0 (E2E) with multi-user scenarios

### Key Integrations
- **AI Providers**: OpenAI, Anthropic, Google AI, xAI, Ollama, OpenRouter via Vercel AI SDK
- **MCP Protocol**: Model Context Protocol for dynamic tool loading and external integrations
- **Canvas System**: 16+ chart types with progressive building and multi-grid dashboard layout
- **Voice Integration**: OpenAI Realtime API with full MCP tool support
- **Geographic Data**: TopoJSON support for world and US map visualizations

### Performance & Scalability
- **Streaming-First**: Real-time responses with `experimental_telemetry` for comprehensive observability
- **Database Optimization**: Indexed queries, repository patterns, and efficient migrations
- **Bundle Optimization**: Dynamic imports, code splitting, and tree-shaking
- **Memory Management**: Proper cleanup, debounced processing, and race condition prevention

## Getting Started

> **Prerequisites**: Node.js 18+ and [pnpm](https://pnpm.io/) package manager
> **Port Requirement**: Must run on `localhost:3000` - other ports not supported

### Docker Compose Deployment 🐳

The fastest way to get everything running with zero configuration:

```bash
# 1. Clone and install
git clone https://github.com/cgoinglove/better-chatbot.git
cd better-chatbot
pnpm i

# 2. Configure .env (auto-generated)
# Add at least one LLM provider API key (OPENAI_API_KEY recommended)

# 3. Deploy with Docker Compose (includes PostgreSQL, Redis, and Samba Orion)
pnpm docker-compose:up

# View logs
pnpm docker-compose:logs

# Stop services
pnpm docker-compose:down
```

### Local Development Setup 🚀

For development with hot-reload and debugging:

```bash
# 1. Install dependencies (auto-generates .env)
pnpm i

# 2. Start PostgreSQL database
pnpm docker:pg

# 3. Configure environment variables in .env
# Required: At least one AI provider API key
# Required: POSTGRES_URL and BETTER_AUTH_SECRET (auto-set)

# 4. Start development server
pnpm build:local && pnpm start

# Alternative: Hot-reload development
pnpm dev
```

### Environment Configuration

The `pnpm i` command auto-generates a `.env` file with all necessary variables. Here are the key configurations:

```dotenv
# === REQUIRED SETTINGS ===

# At least one AI provider API key is required
OPENAI_API_KEY=your_openai_key_here                    # Recommended first choice
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key_here
XAI_API_KEY=your_xai_key_here
OPENROUTER_API_KEY=your_openrouter_key_here

# Database connection (auto-set if using pnpm docker:pg)
POSTGRES_URL=postgres://postgres:password@localhost:5433/better_chatbot

# Authentication secret (auto-generated)
BETTER_AUTH_SECRET=your_generated_secret_here

# === OPTIONAL FEATURES ===

# Web search capabilities (highly recommended)
EXA_API_KEY=your_exa_key_here                         # Free tier: 1,000 requests/month

# Ollama local models
OLLAMA_BASE_URL=http://localhost:11434/api

# Redis for multi-instance deployments
REDIS_URL=redis://localhost:6379

# MCP server configuration storage method
FILE_BASED_MCP_CONFIG=false                           # Use database storage (default)

# Admin controls
DISABLE_SIGN_UP=0                                     # Set to 1 to disable new registrations
NOT_ALLOW_ADD_MCP_SERVERS=0                           # Set to 1 to restrict MCP server additions
DISABLE_EMAIL_SIGN_IN=0                               # Set to 1 to disable email authentication

# OAuth providers (optional - enables social login)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# Advanced settings
MCP_MAX_TOTAL_TIMEOUT=600000                          # MCP tool timeout in ms (10 minutes)
BETTER_AUTH_URL=https://localhost:3000                # Set for HTTPS deployments
```

**Quick Setup Priority:**
1. **OPENAI_API_KEY** - Start here for best model compatibility
2. **EXA_API_KEY** - Essential for web search features
3. **OAuth Keys** - Add these for team collaboration features

<br/>

## 📘 Setup Guides

Comprehensive guides for deploying and configuring Samba Orion in various environments.

### [🔌 MCP Server Setup & Tool Testing](./docs/tips-guides/mcp-server-setup-and-tool-testing.md)
Complete guide to adding, configuring, and testing MCP servers for external tool integration.

### [🐳 Docker Hosting Guide](./docs/tips-guides/docker.md)
Self-hosting instructions using Docker Compose with PostgreSQL, Redis, and application containers.

### [▲ Vercel Hosting Guide](./docs/tips-guides/vercel.md)
One-click deployment to Vercel with automatic database provisioning and environment configuration.

### [🎯 System Prompts & Chat Customization](./docs/tips-guides/system-prompts-and-customization.md)
Advanced customization including system prompts, user preferences, agent instructions, and MCP tool configurations.

### [🔐 OAuth Sign-In Setup](./docs/tips-guides/oauth.md)
Configure social authentication with Google, GitHub, and Microsoft OAuth providers.

### [🕵🏿 Adding OpenAI-Compatible Providers](docs/tips-guides/adding-openAI-like-providers.md)
Integrate custom AI providers that follow OpenAI API compatibility standards.

### [🧪 E2E Testing Guide](./docs/tips-guides/e2e-testing-guide.md)
Complete testing framework setup including multi-user scenarios, agent permissions, and CI/CD integration.

## 💡 Tips & Tricks

### [💬 Temporary Chat Windows](./docs/tips-guides/temporary_chat.md)
Use lightweight popup chats for quick questions and testing without affecting your main conversation threads.

## 🗺️ Roadmap

**Current Status** (v1.21.0): Production-ready with comprehensive feature set

### Recently Completed ✅
- **Canvas Workspace**: 16+ chart types with multi-grid dashboard layout
- **Admin Dashboard**: Complete user management and agent permissions system
- **Granular Agent Permissions**: Use/edit permissions with selective sharing
- **Geographic Visualizations**: World and US maps with TopoJSON support
- **Enhanced Observability**: Langfuse SDK v4 integration with cost tracking
- **Voice Assistant**: OpenAI Realtime API with full MCP tool support

### Upcoming Features 🚧
- [ ] **File Upload & Processing** - Document analysis, image generation, and file-based workflows
- [ ] **Collaborative Document Editing** - Real-time co-editing with AI assistance (Canvas-style)
- [ ] **RAG (Retrieval-Augmented Generation)** - Knowledge base integration with vector search
- [ ] **Advanced Workflow Nodes** - Conditional logic, loops, and data transformations
- [ ] **Multi-language Support** - Extended i18n beyond current English/localization
- [ ] **Mobile Companion App** - Native iOS/Android app with sync capabilities
- [ ] **Enterprise SSO** - SAML, OIDC, and Active Directory integration
- [ ] **Langfuse Plugin System** - Custom observability metrics and dashboards

### Community Requests 📋
Vote on features or suggest new ones in [GitHub Issues](https://github.com/cgoinglove/better-chatbot/issues)!

## 🙌 Contributing

We welcome all contributions! From bug reports to feature improvements, everything helps make Samba Orion even better.

> **⚠️ Please read our [Contributing Guide](./CONTRIBUTING.md) before submitting Pull Requests.** This ensures smooth collaboration and saves everyone time.

### Development Guidelines
- **Feature Requests**: Create an issue first for major changes to discuss approach and design
- **Code Quality**: All PRs must pass TypeScript checks, tests, and formatting (`pnpm check`)
- **Pull Request Format**: Use conventional commit format (e.g., `feat: add canvas export`, `fix: agent permissions`)
- **Testing**: Add tests for new features, ensure existing tests pass

### Ways to Contribute
- **🐛 Bug Fixes**: Identify and fix issues, improve error handling
- **✨ New Features**: Canvas enhancements, new chart types, MCP integrations
- **📚 Documentation**: Improve guides, add examples, update screenshots
- **🌍 Translations**: Help expand language support - see [language.md](./messages/language.md)
- **🧪 Testing**: Add test coverage, improve E2E scenarios

### Development Stack Knowledge Helpful
- **Vercel AI SDK**: Streaming patterns, tool integrations
- **Next.js 15**: App Router, server components, API routes
- **TypeScript**: Strict typing, complex type definitions
- **Drizzle ORM**: Database queries, migrations
- **Radix UI**: Accessibility-first components

Let's build the future of AI assistance together! 🚀

## 💬 Community & Support

[![Discord](https://img.shields.io/discord/1374047276074537103?label=Discord&logo=discord&color=5865F2)](https://discord.gg/gCRu69Upnp)

Join our Discord community for:
- **Technical Support**: Get help with setup, deployment, and troubleshooting
- **Feature Discussions**: Influence roadmap and share ideas
- **MCP Integrations**: Share custom MCP servers and configurations
- **Workflow Gallery**: Exchange automation workflows and agent setups
- **Development Chat**: Contribute to the project and collaborate with maintainers

---

**Samba Orion** - Empowering individuals and teams with production-ready AI conversations, advanced tooling, and comprehensive observability. Built with ❤️ on the foundation of the open-source [better-chatbot](https://github.com/cgoinglove/better-chatbot) project.

**[⭐ Star on GitHub](https://github.com/cgoinglove/better-chatbot)** | **[🚀 Deploy on Vercel](https://vercel.com/new/clone?repository-url=https://github.com/cgoinglove/better-chatbot)** | **[💬 Join Discord](https://discord.gg/gCRu69Upnp)**
