# src/components/agent/ - Agent Management System

6-component system for creating and managing custom AI agents with tool permissions and behavioral patterns.

## Components

**Core Files:**
- `agents-list.tsx` - Agent gallery and management interface
- `edit-agent.tsx` - Agent creation/editing with form validation
- `agent-dropdown.tsx` - Agent selection for chat interface
- `agent-tool-selector.tsx` - Tool permission configuration
- `agent-icon-picker.tsx` - Visual icon selection system
- `generate-agent-dialog.tsx` - AI-powered agent generation

## Key Features

**Agent Lifecycle:** Create → Configure → Activate → Use → Manage

**AI-Powered Generation:** Natural language agent creation with automatic tool permission suggestions

**Permission System:** Granular tool access control aligned with MCP server configurations

**Critical:** Agent mentions are ADDITIVE - they specify allowed tools, not restrictions