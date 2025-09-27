---
description: "Generate comprehensive initial plan document for feature development with autonomous research"
argument-hint: "[feature-description]"
---

# Create Initial Plan

## Feature: $ARGUMENTS

Generate a comprehensive initial plan document through autonomous research and codebase analysis. This command creates the foundational document that defines feature goals, scope, and integration requirements - serving as the essential blueprint for subsequent PRP generation.

**CRITICAL: This command is self-contained and performs its own research. No prior primer context required.**

**IMPORTANT: Do NOT get stuck in analysis loops. Complete research efficiently and generate the initial document.**

The AI agent executing the eventual PRP will only get the context you provide in this initial document. Make this initial plan comprehensive and project-aware through extensive research and codebase analysis.

## Research & Analysis Process

### 1. **Deep Codebase Analysis Using Serena MCP Server (CRITICAL)**
- Use `mcp__serena__get_symbols_overview` to understand project structure and patterns
- Use `mcp__serena__find_symbol` to locate similar features and implementations
- Use `mcp__serena__search_for_pattern` to discover existing architectural patterns
- Use `mcp__serena__find_referencing_symbols` to understand component relationships
- Use `mcp__serena__list_dir` recursively to map project organization
- Identify existing components, hooks, and patterns to leverage
- Analyze current test patterns and validation approaches
- Review database schema and repository patterns

### 2. **Technology Context Research (EXTENSIVE)**
- **Web search for feature-relevant technologies** extensively
- Study existing implementations and best practices online
- Research UI/UX patterns for similar features
- Identify common architectural approaches and gotchas
- Find established design patterns and component libraries
- Look for performance optimization strategies
- Research accessibility requirements and compliance patterns

### 3. **Project-Specific Integration Analysis**
- **Vercel AI SDK Integration**: Analyze `streamText`, `generateText`, tool patterns
- **Canvas System Analysis**: Review chart tools, artifacts, and visualization patterns
- **MCP Protocol Integration**: Understand tool loading and server management
- **Authentication Patterns**: Review Better-Auth integration and session management
- **Database Integration**: Analyze Drizzle ORM patterns and schema organization
- **Observability**: Review Langfuse tracing and performance monitoring

### 4. **Feature Scope & Goals Definition**
- Translate user description into specific functionality requirements
- Define core UI components and user interactions needed
- Identify integration points with existing systems
- Determine technical complexity level and development approach
- Plan user experience flows and interface requirements

## Initial Document Generation

Using `PRPs/templates/initial-template.md` as **DIRECTIONAL REFERENCE** (not rigid template):

### Critical Sections to Research & Define

**Feature Purpose & Core Components:**
- Clear statement of what users should accomplish with this feature
- Essential UI elements and interactions required
- Core functionality scope and user experience goals
- Integration requirements with existing components found via Serena analysis

**Architecture Integration Strategy:**
- Specific integration points with Vercel AI SDK patterns discovered
- Canvas system integration needs (if data visualization involved)
- MCP protocol requirements (if external tools needed)
- Database schema changes using established Drizzle ORM patterns
- Authentication and authorization requirements using Better-Auth patterns

**Development Patterns & Implementation Approach:**
- Component architecture following discovered project conventions
- Styling approach using established Tailwind CSS + Radix UI patterns
- State management strategy based on existing hook patterns
- API design matching current route organization
- Performance optimization following project best practices

**File Organization & Project Structure:**
- Specific file placement following discovered directory conventions
- Component organization matching existing patterns
- API route structure based on current organization
- Database migration approach using established patterns
- Test file organization following project test patterns

**Security & Access Control:**
- Authentication integration using discovered Better-Auth patterns
- Role-based access control following existing authorization patterns
- Data validation and sanitization approaches
- Security considerations specific to feature type

### Implementation Blueprint & Task Breakdown
- Reference specific files and patterns discovered via Serena research
- Create prioritized task list for development phases
- Include error handling strategy based on existing patterns
- Plan testing approach using discovered test infrastructure
- Define validation gates using project-specific commands

### Technology Context & Best Practices
- Include relevant documentation URLs and resources from web research
- Reference successful implementation examples found online
- Document common gotchas and edge cases discovered
- Include performance considerations and optimization strategies
- Note accessibility requirements and compliance approaches

## Quality Research Checklist

**Before Writing the Initial Document:**
- [ ] Extensive Serena MCP exploration of codebase completed
- [ ] Project structure and patterns thoroughly analyzed
- [ ] Similar features and implementations identified in codebase
- [ ] Web research on relevant technologies and best practices completed
- [ ] Integration points with AI SDK/Canvas/MCP/Auth systems analyzed
- [ ] Existing component patterns and conventions documented
- [ ] Database schema and repository patterns reviewed
- [ ] Test patterns and validation approaches identified
- [ ] File organization and naming conventions discovered
- [ ] Security and performance patterns analyzed

**Critical Context to Include:**
- Specific component files and patterns to reference (from Serena analysis)
- Integration requirements with discovered project systems
- Development workflow based on existing project conventions
- Testing approach using established project infrastructure
- Deployment and validation commands specific to better-chatbot

## Validation Requirements (Better-Chatbot Specific)

```bash
# Project Health Checks
pnpm check-types           # TypeScript validation
pnpm lint                  # Biome linting
pnpm test                  # Vitest unit tests

# Feature-Specific Validation (adapt based on feature analysis)
pnpm build:local           # Build validation
curl -f http://localhost:3000/api/health/langfuse  # Observability check
pnpm test:e2e             # E2E tests (if UI feature)

# System Integration Validation (if relevant)
# Add based on discovered integration requirements
```

## Output Location

Save as: `PRPs/cc-prp-initials/initial-{feature-name}.md`

**Naming Convention:**
- Use kebab-case for feature name derived from user description
- Keep name descriptive but concise
- Example: `initial-multi-canvas-system.md`, `initial-agent-workflow-builder.md`

## Ultra-Think Before Writing

**After completing all research, before writing the initial document:**

1. **Feature Goals Clarity**: Is the intended functionality crystal clear and well-defined?
2. **Integration Strategy**: How does this feature align with discovered project architecture?
3. **Implementation Feasibility**: Is the scope realistic given existing patterns and infrastructure?
4. **Context Completeness**: Have I included all necessary project context for future PRP generation?
5. **Template Adaptation**: Which template sections are relevant vs. which should be customized for this specific feature?

### Critical Success Factors
- **Autonomous Research**: All necessary context gathered through independent analysis
- **Project Awareness**: Feature design aligns with discovered architectural patterns
- **Implementation Ready**: Clear path forward based on existing project conventions
- **Context Rich**: Future PRP generation has all necessary background information
- **Goal Focused**: User intentions and feature purpose clearly articulated

**Remember**: This initial document serves as the foundation for all subsequent development. It must be comprehensive, project-aware, and implementation-focused based on thorough research rather than assumptions.

*** CRITICAL: Complete focused research (maximum 10 tool calls) then IMMEDIATELY write the initial document ***
*** Do NOT get stuck in endless analysis - research efficiently then create the document ***
*** The quality of this initial document directly impacts PRP generation and implementation success ***

## Quality Validation Checklist

- [ ] Deep codebase analysis completed using Serena MCP tools extensively
- [ ] Web research on relevant technologies and patterns completed
- [ ] Feature goals clearly defined and user-focused
- [ ] Integration strategy aligns with discovered project architecture
- [ ] Implementation approach based on existing project conventions
- [ ] File organization follows discovered directory patterns
- [ ] Security considerations address project-specific requirements
- [ ] Testing strategy uses established project infrastructure
- [ ] Template used as directional guidance, not rigid structure
- [ ] All necessary context included for future PRP generation

Score the Initial Plan on a scale of 1-10 (confidence level that this document provides a solid foundation for successful PRP generation and eventual feature implementation).