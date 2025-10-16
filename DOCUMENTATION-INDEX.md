# Documentation Index

## Overview

This document provides a comprehensive index of all documentation in the Samba AI project, organized by category and purpose.

---

## Core Documentation

### Project Essentials

| Document | Purpose | Audience |
|----------|---------|----------|
| `/README.md` | Project overview, quick start, features | All users, developers |
| `/CLAUDE.md` | Technical architecture, essential commands | Developers, AI assistants |
| `/CONTRIBUTING.md` | Contribution guidelines | Contributors |
| `/CHANGELOG.md` | Version history and changes | All users |

### Recently Added

| Document | Purpose | Date Added |
|----------|---------|------------|
| `/BRANDING-UPDATE-SUMMARY.md` | Comprehensive branding changes summary | Oct 2025 |
| `/docs/BRANDING-SYSTEM.md` | Complete branding system guide | Oct 2025 |
| `/DOCUMENTATION-INDEX.md` | This index document | Oct 2025 |

---

## Deployment & Operations

### Deployment Guides

| Document | Purpose |
|----------|---------|
| `/DEPLOYMENT.md` | Deployment safety guide, checklist, rollback strategies |
| `/docs/tips-guides/docker.md` | Docker hosting guide |
| `/docs/tips-guides/vercel.md` | Vercel hosting guide |

### Operational Documentation

| Document | Purpose |
|----------|---------|
| `/AGENTS.md` | Agent system guidelines |
| `/docs/tips-guides/oauth.md` | OAuth sign-in setup |
| `/docs/tips-guides/mcp-server-setup-and-tool-testing.md` | MCP server configuration |
| `/docs/tips-guides/e2e-testing-guide.md` | End-to-end testing guide |

---

## Architecture & Design

### Core Architecture

| Document | Purpose |
|----------|---------|
| `/docs/ARCHITECTURE-VERCEL-AI-SDK.md` | Complete Vercel AI SDK-centric architecture |
| `/docs/BRANDING-SYSTEM.md` | Typography and branding system |
| `/src/app/CLAUDE.md` | App Router structure and patterns |
| `/src/app/api/CLAUDE.md` | API layer documentation |
| `/src/components/CLAUDE.md` | Component library guidelines |
| `/src/lib/auth/CLAUDE.md` | Authentication system |
| `/src/components/agent/CLAUDE.md` | Agent system components |
| `/src/components/canvas/CLAUDE.md` | Canvas workspace system |
| `/src/lib/ai/tools/artifacts/CLAUDE.md` | Chart tools documentation |

---

## Observability & Monitoring

### Langfuse Integration

| Document | Purpose |
|----------|---------|
| `/docs/langfuse-vercel-ai-sdk.md` | Langfuse + Vercel AI SDK integration |
| `/docs/langfuse-production-ready.md` | Production observability setup |
| `/docs/langfuse-agent-observability-guide.md` | Agent-specific observability |
| `/docs/langfuse-implementation.md` | Implementation details |
| `/docs/langfuse-production-environment-setup.md` | Production environment setup |
| `/docs/langfuse-production-fix-implementation-summary.md` | Production fix summary |
| `/docs/langfuse-telemetry.md` | Telemetry configuration |
| `/docs/langfuse-vercel-ai-sdk-integration.md` | Integration guide |
| `/docs/langfuse-js-ts.md` | JavaScript/TypeScript SDK |
| `/docs/langfuse-python.md` | Python SDK |
| `/docs/langfuse-ts-sdk-v4-trasncript.md` | SDK v4 transcript |

---

## Features & Components

### Canvas & Visualization

| Document | Purpose |
|----------|---------|
| `/docs/charts-artifacts.md` | Chart artifacts documentation |
| `/docs/midday-canvas.md` | Canvas inspiration (Midday) |
| `/docs/midday-artifacts.md` | Artifacts inspiration (Midday) |
| `/docs/vercel-artifacts.md` | Artifacts inspiration (Vercel) |
| `/docs/ban-chart-insights-research.md` | BAN chart research |
| `/docs/MIGRATION-remove-create-chart.md` | Chart tool migration |

### Voice & Agents

| Document | Purpose |
|----------|---------|
| `/docs/openai-voice-agents.md` | Voice agent documentation |
| `/docs/openai-reatime-api.md` | Realtime API documentation |
| `/docs/openai-building-agents.md` | Agent building guide |

---

## Tips & Guides

### User Guides

| Document | Purpose |
|----------|---------|
| `/docs/tips-guides/temporary_chat.md` | Temporary chat windows |
| `/docs/tips-guides/system-prompts-and-customization.md` | System prompts customization |
| `/docs/tips-guides/adding-openAI-like-providers.md` | Adding OpenAI-compatible providers |
| `/docs/tips-guides/mcp-oauth-flow.md` | MCP OAuth flow |

---

## Development & Tools

### Development Guides

| Document | Purpose |
|----------|---------|
| `/docs/claude-code-in-action.md` | Claude Code examples |

---

## Historical Documentation

### Project Records

These documents provide historical context but are not actively maintained:

| Document | Purpose | Date |
|----------|---------|------|
| `/snapshot-tool-registry-before-removal.md` | Tool registry snapshot | Sept 2025 |
| `/phase-3-testing-checklist.md` | Chart tool testing checklist | Sept 2025 |
| `/production-readiness-checklist.md` | Chart tool production readiness | Sept 2025 |

---

## PRP (Project Resolution Plans) Documentation

Located in `/PRPs/` directory:

### Initial Plans
- `/PRPs/cc-prp-initials/` - Initial project assessments and discovery

### Implementation Plans
- `/PRPs/cc-prp-plans/` - Detailed implementation PRPs

### Templates
- `/PRPs/templates/` - PRP templates for future use

**Note**: PRPs are internal planning documents. See individual files for specific project documentation.

---

## QA & Testing

### Quality Assurance Documents

| Document | Purpose |
|----------|---------|
| `/docs/qa/gates/session-validation-2025-10-12.md` | Session validation report |

---

## Directory Structure

### Documentation Organization

```
/
├── README.md                           # Main project documentation
├── CLAUDE.md                           # Technical architecture
├── CONTRIBUTING.md                     # Contribution guidelines
├── DEPLOYMENT.md                       # Deployment guide
├── AGENTS.md                           # Agent guidelines
├── BRANDING-UPDATE-SUMMARY.md          # Branding changes summary
├── DOCUMENTATION-INDEX.md              # This file
│
├── docs/                               # Comprehensive documentation
│   ├── ARCHITECTURE-VERCEL-AI-SDK.md   # Core architecture
│   ├── BRANDING-SYSTEM.md              # Branding system guide
│   ├── tips-guides/                    # User and setup guides
│   │   ├── docker.md
│   │   ├── vercel.md
│   │   ├── oauth.md
│   │   ├── e2e-testing-guide.md
│   │   └── ...
│   ├── langfuse-*.md                   # Observability docs
│   ├── charts-artifacts.md             # Chart documentation
│   └── qa/                             # QA reports
│
├── src/
│   ├── app/CLAUDE.md                   # App Router docs
│   ├── app/api/CLAUDE.md               # API docs
│   ├── components/CLAUDE.md            # Component docs
│   ├── components/agent/CLAUDE.md      # Agent system docs
│   ├── components/canvas/CLAUDE.md     # Canvas system docs
│   ├── lib/auth/CLAUDE.md              # Auth docs
│   └── lib/ai/tools/artifacts/CLAUDE.md # Chart tools docs
│
└── PRPs/                               # Project Resolution Plans
    ├── cc-prp-initials/                # Initial assessments
    ├── cc-prp-plans/                   # Implementation plans
    └── templates/                      # PRP templates
```

---

## Finding Documentation

### By Topic

**Getting Started**:
- Start with `/README.md`
- Review `/CLAUDE.md` for technical setup
- Check `/docs/tips-guides/` for specific features

**Branding & Design**:
- `/docs/BRANDING-SYSTEM.md` - Complete guide
- `/BRANDING-UPDATE-SUMMARY.md` - Recent changes
- `/src/components/CLAUDE.md` - Component guidelines

**Architecture & Code**:
- `/docs/ARCHITECTURE-VERCEL-AI-SDK.md` - System design
- `/src/app/CLAUDE.md` - App structure
- `/src/components/CLAUDE.md` - Component patterns

**Deployment**:
- `/DEPLOYMENT.md` - Safety guide
- `/docs/tips-guides/docker.md` - Docker setup
- `/docs/tips-guides/vercel.md` - Vercel deployment

**Observability**:
- All `/docs/langfuse-*.md` files
- Focus on `langfuse-vercel-ai-sdk.md` for integration

**Features**:
- Canvas: `/docs/charts-artifacts.md`, `/src/components/canvas/CLAUDE.md`
- Agents: `/AGENTS.md`, `/src/components/agent/CLAUDE.md`
- Voice: `/docs/openai-voice-agents.md`

---

## Documentation Standards

### File Naming Conventions

- **Main docs**: `UPPER-CASE.md` (README.md, CLAUDE.md, DEPLOYMENT.md)
- **Feature docs**: `kebab-case.md` (branding-system.md, chart-tools.md)
- **Subdirectory CLAUDE.md**: Consistent naming across all modules

### Document Structure

All major documentation should include:
1. **Title and Overview**
2. **Table of Contents** (for long documents)
3. **Main Content** (organized by sections)
4. **Examples** (where applicable)
5. **Related Documentation Links**
6. **Last Updated Date**

### Maintenance Guidelines

1. **Update Related Docs**: When code changes, update relevant documentation
2. **Cross-Link**: Link related documents for easy navigation
3. **Keep Current**: Review and update documentation quarterly
4. **Archive Old**: Move outdated docs to `/docs/archive/` or note as historical

---

## Contributing to Documentation

### When to Update Documentation

- **Code Changes**: Update relevant CLAUDE.md files
- **New Features**: Create feature documentation in `/docs/`
- **Architecture Changes**: Update `/docs/ARCHITECTURE-*.md`
- **Breaking Changes**: Update `/DEPLOYMENT.md` and relevant guides

### Documentation Workflow

1. **Read First**: Review existing documentation structure
2. **Update Inline**: Modify existing docs rather than creating duplicates
3. **Cross-Reference**: Link related documents
4. **Request Review**: Have documentation reviewed with code changes

---

## Quick Links

### Most Important Documents

1. [Main README](/README.md) - Start here
2. [Technical Architecture](/CLAUDE.md) - Developer reference
3. [Branding System](/docs/BRANDING-SYSTEM.md) - Design guidelines
4. [Deployment Guide](/DEPLOYMENT.md) - Production deployment
5. [Architecture Overview](/docs/ARCHITECTURE-VERCEL-AI-SDK.md) - System design

### Recently Updated

1. [Branding Update Summary](/BRANDING-UPDATE-SUMMARY.md) - Oct 2025
2. [Branding System Guide](/docs/BRANDING-SYSTEM.md) - Oct 2025
3. [Main CLAUDE.md](/CLAUDE.md) - Oct 2025 (typography section)
4. [README.md](/README.md) - Oct 2025 (design philosophy)

---

## Support & Questions

For documentation questions:
1. Search this index for relevant documents
2. Check CLAUDE.md files in specific directories
3. Review related documents in `/docs/`
4. Consult the development team

For documentation improvements:
1. Follow contribution guidelines in `/CONTRIBUTING.md`
2. Ensure updates are consistent with existing style
3. Update this index when adding new major documents

---

**Last Updated**: October 2025
**Maintained By**: Samba AI Team
**Version**: 1.0
