# Better-Chatbot UI Feature Development Template

## PROJECT TECHNOLOGY STACK:

**Base Framework:** Next.js 15.3.2 with App Router + TypeScript 5.9.2
**AI Foundation:** Vercel AI SDK v5.0.26 (foundational - all AI operations built on this)
**UI Framework:** React 19.1.1 with Tailwind CSS 4.1.12, Radix UI, Framer Motion 12.23.12
**Authentication:** Better-Auth 1.3.7
**Database:** PostgreSQL with Drizzle ORM 0.41.0
**Observability:** Langfuse SDK v4.1.0 with OpenTelemetry 2.1.0

**Your UI Feature:** [Specify the exact UI component, feature, or enhancement you want to develop for better-chatbot]

---

## FEATURE PURPOSE:

**What specific UI functionality should this feature provide to users?**

**Example for Canvas Enhancement:** "Enhance the multi-grid Canvas system with advanced chart editing capabilities, drag-and-drop reorganization, and export functionality"

**Example for Agent UI:** "Create an intuitive agent management interface with visual workflow builder, permission management, and real-time agent status monitoring"

**Example for Chat Interface:** "Implement advanced conversation features like message threading, tool invocation history, and conversational bookmarks"

**Your purpose:** [Be very specific about what users should be able to accomplish with this UI feature]

---

## CORE UI COMPONENTS & FEATURES:

**What are the essential UI elements and interactions this feature should implement?**

**Example for Canvas System:**
- Interactive multi-grid layout with drag-and-drop chart reorganization
- Chart editing panel with real-time preview
- Export controls for PDF/PNG/SVG formats
- Responsive grid system that scales from 1x1 to 2x2+
- Canvas naming and save/load functionality
- Integration with 15 specialized chart artifact tools

**Example for Agent Management:**
- Agent creation wizard with step-by-step configuration
- Visual tool permission matrix
- Real-time agent status indicators
- Agent conversation history browser
- MCP server connection health dashboard

**Your core features:** [List the specific UI components and interactions needed]

---

## EXISTING COMPONENTS TO LEVERAGE:

**What current UI components and patterns should be referenced and extended?**

**Canvas System Components:**
- `src/components/canvas-panel.tsx` - Main Canvas workspace with multi-grid layout
- `src/components/tool-invocation/` - Chart renderers optimized for Canvas
- `src/hooks/use-canvas.ts` - Canvas state management with debounced processing
- `src/lib/ai/tools/artifacts/` - 15 specialized chart tools for Canvas integration

**Chat Interface Components:**
- `src/components/chat-bot.tsx` - Main chat interface with streaming support
- `src/components/message-parts.tsx` - Message rendering with Canvas integration
- `src/components/chat-mention-input.tsx` - Advanced input with tool mentions

**Agent & Workflow Components:**
- `src/components/agent/` - Agent management UI components
- `src/components/workflow/` - Visual workflow builder components
- `src/app/(chat)/admin/` - Admin interface for user and agent management

**UI Foundation Components:**
- `src/components/ui/` - Radix UI primitives and custom design system
- `src/components/layouts/` - App layout components and sidebar menus

**Your components to leverage:** [Specify which existing components to build upon]

---

## TECHNICAL INTEGRATION POINTS:

**What backend systems and APIs need UI integration?**

**Vercel AI SDK Integration:**
- `src/app/api/chat/route.ts` - Main chat API with streaming support
- `src/app/api/chat/shared.chat.ts` - Tool loading pipeline for UI features
- `experimental_telemetry` integration for UI performance monitoring

**Database Integration:**
- `src/lib/db/pg/schema.pg.ts` - Core schema (ChatThread, ChatMessage, Agent, User, etc.)
- `src/lib/db/pg/repositories/` - Repository pattern for data access
- Real-time updates for UI state synchronization

**MCP Protocol Integration:**
- `src/lib/ai/mcp/mcp-manager.ts` - MCP server management for UI configuration
- `/mcp` page for testing and configuration
- Dynamic tool loading for UI tool selection

**Authentication Integration:**
- `src/lib/auth/` - Better-Auth integration for UI access control
- Role-based UI visibility and permissions
- Session management for UI state persistence

**Your integration points:** [List the specific backend systems your UI needs to connect with]

---

## DEVELOPMENT PATTERNS TO FOLLOW:

**What specific coding patterns and structures should be implemented?**

**Component Architecture:**
- Server Components for data fetching (default)
- Client Components with `"use client"` for interactivity
- Repository pattern for database operations
- Custom hooks for complex UI state management

**Styling Patterns:**
- Tailwind CSS with custom design system variables
- CSS Grid for responsive layouts (Canvas system pattern)
- Consistent color system using CSS variables (`var(--chart-1)`, etc.)
- Framer Motion for smooth animations and transitions

**State Management Patterns:**
- `useCanvas` hook pattern with debounced processing (150ms debounce)
- Memory leak prevention with `isMountedRef` patterns
- Race condition protection in async UI operations
- Zustand or React Context for complex shared state

**Performance Patterns:**
- React.memo for expensive components
- useMemo/useCallback for optimization
- Lazy loading for heavy UI components
- Progressive loading states for better UX

**Your development patterns:** [Specify the architectural patterns your feature should follow]

---

## SECURITY & ACCESS PATTERNS:

**What security considerations and access controls are critical for this UI feature?**

**Authentication Patterns:**
- Session-based access control using Better-Auth
- Role-based UI element visibility (admin vs user features)
- API route protection with `getSession()` validation
- Secure handling of sensitive UI data

**Canvas Security (if applicable):**
- Safe artifact rendering with content validation
- XSS prevention in dynamic chart content
- File upload security for chart data imports
- Rate limiting for chart generation API calls

**Agent Management Security:**
- Admin-only access to agent creation/modification
- MCP server connection security validation
- Tool permission matrix with proper authorization checks
- Audit logging for sensitive UI operations

**Your security considerations:** [List UI-specific security patterns needed]

---

## COMMON UI/UX GOTCHAS:

**What are typical pitfalls and edge cases for UI development in this project?**

**Canvas System Gotchas:**
- Race conditions in chart artifact processing (use 150ms debounce)
- Memory leaks with large datasets (implement cleanup patterns)
- Responsive sizing issues (use `height="100%"` not fixed pixels)
- State synchronization between Canvas and chat interface

**Agent UI Gotchas:**
- Never disable tools based on mentions (`allowedMcpServers: mentions?.length ? {} : servers` BREAKS AGENTS)
- Agent mentions are ADDITIVE, not restrictive
- MCP server connection status can be flaky (implement retry patterns)
- Tool loading pipeline must be preserved in UI changes

**Performance Gotchas:**
- Infinite re-renders with improper dependency arrays
- Expensive operations blocking UI (use async patterns)
- Large dataset rendering performance (implement virtualization)
- Mobile responsive issues with complex layouts

**Authentication Gotchas:**
- Session expiration handling in long-running UI interactions
- Protected route access control during development
- OAuth flow interruption with UI state loss

**Your gotchas:** [Identify specific challenges for your UI feature]

---

## TESTING & VALIDATION REQUIREMENTS:

**What specific testing patterns should be implemented for this UI feature?**

**Unit Testing (Vitest):**
- Component rendering tests with React Testing Library
- Custom hook testing for complex UI state
- Mock API responses for UI integration tests
- Accessibility testing with jest-axe

**E2E Testing (Playwright):**
- Complete user workflows through the UI
- Cross-browser compatibility testing
- Mobile responsive behavior validation
- Performance testing for complex UI interactions

**Visual Testing:**
- Screenshot comparison tests for UI consistency
- Canvas rendering validation across browsers
- Chart artifact visual regression testing
- Responsive layout testing at multiple breakpoints

**Integration Testing:**
- API route integration with UI components
- Database state synchronization with UI
- MCP server integration with UI controls
- Authentication flow testing with UI states

**Your validation requirements:** [Specify testing patterns for your feature]

---

## DESIGN SYSTEM INTEGRATION:

**How should this feature integrate with the existing design system?**

**Color System:**
- Use established CSS variable system (`var(--chart-1)`, etc.)
- Consistent color palette across all UI elements
- Dark/light mode support if applicable
- Accessibility-compliant color contrasts

**Typography System:**
- Consistent font sizes and weights
- Proper heading hierarchy
- Responsive typography scaling
- Code font usage for technical elements

**Spacing System:**
- Consistent padding/margin using Tailwind classes
- Grid system alignment with existing layouts
- Proper visual hierarchy with spacing
- Mobile-first responsive spacing

**Component Consistency:**
- Use Radix UI primitives from `src/components/ui/`
- Consistent button styles and interactions
- Form element styling and validation patterns
- Loading states and error handling UI

**Your design integration:** [Specify how your feature fits the design system]

---

## FILE STRUCTURE & ORGANIZATION:

**Where should new files be created and how should they be organized?**

**Component Organization:**
```
src/components/
├── [feature-name]/           # Main feature components
├── ui/                      # Reusable UI primitives
├── layouts/                 # Layout components if needed
└── tool-invocation/         # If tool-related UI needed
```

**API Organization:**
```
src/app/api/
├── [feature-name]/          # Feature-specific API routes
└── chat/                    # Extend existing chat API if needed
```

**Database Organization:**
```
src/lib/db/pg/
├── schema.pg.ts            # Add new tables/fields
├── repositories/           # Add feature repositories
└── migrations/pg/          # Generated migrations
```

**Hook Organization:**
```
src/hooks/
├── use-[feature-name].ts   # Feature-specific hooks
└── [existing-hooks].ts     # Extend existing hooks if needed
```

**Your file organization:** [Specify the file structure for your feature]

---

## CLAUDE CONFIGURATION FILES TO REVIEW:

**What Claude Code configuration should be examined and potentially updated?**

**Core Configuration:**
- `/CLAUDE.md` - Main project instructions and architecture overview
- `/.claude/commands/` - Custom commands that might be relevant
- `/.claude/agents/` - Agent configurations that could affect UI

**Development Workflow:**
- `/PRPs/` - Project Requirements and Plans for context
- `/docs/` - Technical documentation for implementation patterns
- `/.gitignore` - Ensure new files are properly tracked

**Build & Deploy:**
- `/next.config.ts` - Build configuration for new UI assets
- `/package.json` - Dependencies and scripts for UI development
- `/tailwind.config.ts` - Styling configuration for new components

**Your Claude files to review:** [Specify which configuration files need attention]

---

## INTEGRATION FOCUS:

**What external integrations or third-party services need UI representation?**

**MCP Integration UI:**
- MCP server status indicators
- Tool availability visualization
- Dynamic tool configuration interfaces
- Connection health monitoring dashboards

**AI Provider Integration:**
- Model selection UI for different providers
- Token usage visualization
- Provider-specific feature toggles
- Cost monitoring dashboards

**Observability Integration:**
- Langfuse dashboard integration
- Performance metrics visualization
- Error tracking and reporting UI
- User analytics dashboard components

**Database Integration:**
- Real-time data synchronization UI
- Migration status indicators
- Database health monitoring
- Data export/import interfaces

**Your integration focus:** [List the external systems needing UI integration]

---

## ACCESSIBILITY REQUIREMENTS:

**What accessibility standards must this UI feature meet?**

**WCAG 2.1 Compliance:**
- Keyboard navigation support for all interactive elements
- Screen reader compatibility with proper ARIA labels
- Color contrast ratios meeting AA standards
- Focus management for complex UI interactions

**Canvas Accessibility (if applicable):**
- Alt text for chart visualizations
- Keyboard navigation through chart data
- Screen reader announcements for chart updates
- High contrast mode support

**Form Accessibility:**
- Proper form labeling and validation
- Error message association
- Logical tab order
- Input type optimization for mobile

**Your accessibility requirements:** [Specify accessibility needs for your feature]

---

## PERFORMANCE OPTIMIZATION:

**What specific performance considerations should be implemented?**

**Rendering Optimization:**
- React.memo for expensive UI components
- Code splitting for feature-specific bundles
- Image optimization for UI assets
- Lazy loading for non-critical UI elements

**Data Loading:**
- Progressive data fetching for large datasets
- Optimistic UI updates for better perceived performance
- Efficient pagination for list components
- Caching strategies for frequently accessed data

**Canvas Performance (if applicable):**
- Chart rendering optimization for large datasets
- Memory usage monitoring for Canvas operations
- Debounced processing (150ms) for rapid interactions
- Efficient artifact state management

**Your performance considerations:** [List performance requirements for your feature]

---

## ADDITIONAL NOTES:

**Any other specific requirements, constraints, or considerations for this UI feature?**

**Development Environment:**
- Must work with `pnpm dev` local development server
- Compatible with Turbopack for fast refresh
- Proper TypeScript integration with strict mode

**Browser Support:**
- Modern browser compatibility (Chrome, Firefox, Safari, Edge)
- Mobile responsive design requirements
- Progressive enhancement for older browsers

**Deployment Considerations:**
- Vercel deployment compatibility
- Docker container support if needed
- Environment-specific configuration handling

**Your additional notes:** [Any other important considerations]

---

## FEATURE COMPLEXITY LEVEL:

**What level of complexity should this UI feature target?**

- [ ] **Simple Enhancement** - Minor UI improvements or single component additions
- [ ] **Standard Feature** - New UI section with multiple components and basic interactions
- [ ] **Advanced Feature** - Complex UI workflows with advanced state management
- [ ] **System Integration** - Major UI overhaul requiring backend changes and extensive testing

**Your choice:** [Select the appropriate complexity level and explain why]

---

## CLAUDE CODE DEVELOPMENT WORKFLOW:

**Recommended development approach using Claude Code:**

1. **Planning Phase:**
   - Use TodoWrite tool to break down UI feature into tasks
   - Research existing components and patterns in codebase
   - Review database schema for data requirements

2. **Implementation Phase:**
   - Create components following established patterns
   - Implement responsive design with Tailwind CSS
   - Add proper TypeScript types and interfaces
   - Integrate with existing state management patterns

3. **Integration Phase:**
   - Connect UI to backend APIs and databases
   - Implement authentication and authorization
   - Add observability and performance monitoring

4. **Testing Phase:**
   - Write unit tests with Vitest
   - Add E2E tests with Playwright
   - Validate accessibility compliance
   - Performance testing and optimization

5. **Documentation Phase:**
   - Update component documentation
   - Add usage examples and patterns
   - Update CLAUDE.md if architectural changes made

**Your workflow notes:** [Any specific development approach preferences]

---

**REMINDER: This template is specifically designed for UI feature development in the better-chatbot project. Be as specific as possible in each section to ensure the UI feature integrates seamlessly with the existing Vercel AI SDK foundation, Canvas system, MCP integration, and overall architecture.**