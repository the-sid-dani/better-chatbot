# src/components/ - React Component Library

Complete UI component library with design system primitives, AI-focused components, and Canvas workspace system.

## Structure

**Core Components:**
- `chat-bot.tsx` - Main chat interface with Canvas integration
- `canvas-panel.tsx` - Multi-grid Canvas workspace for data visualization
- `message-parts.tsx` - Message rendering with "Open Canvas" buttons

**Key Directories:**
- `agent/` - 6-component agent management system
- `canvas/` - Modular Canvas architecture with base components
- `tool-invocation/` - 23 chart visualization components
- `ui/` - 67 Radix UI-based design system primitives
- `workflow/` - Visual workflow builder components

## Canvas System

**Core Canvas Components:**
- `canvas-panel.tsx` - Main Canvas workspace with ResizablePanelGroup
- `canvas/base/` - Foundational components (BaseCanvas, CanvasGrid, CanvasChart)
- `canvas/dashboard-canvas.tsx` - Advanced multi-chart dashboard layout

**Canvas Integration:**
- Charts automatically stream to Canvas when AI executes chart tools
- Progressive building with loading → processing → success states
- Responsive grid layout adapts from 1x1 to 2x2+ based on chart count
- Smart Canvas naming based on chart content analysis

## Development Patterns

**Component Structure:**
- Use `"use client"` for interactive components
- Import from `ui/` for design system primitives (never relative paths)
- Use Radix UI patterns for accessibility compliance

**Canvas Development:**
- Chart tools use `async function*` with `yield` statements for progressive building
- Charts must use `height="100%"` for responsive scaling
- Use CSS variables for colors: `var(--chart-1)`, `var(--chart-2)`, etc.
- Return `shouldCreateArtifact: true` for Canvas processing

**BAN Chart Standards** (Updated October 2025):
- **Padding**: CardHeader `pb-1`, CardContent `pb-0 pt-2` (matches all charts)
- **Centering**: Both horizontal (`items-center`) and vertical (`justify-center`) required
- **Typography**: Main value `text-3xl` (30px), unit `text-lg` (18px), title `text-sm`
- **Spacing**: Value/unit gap `gap-1.5`, trend row `gap-2`, bottom margin `mb-4`
- **Canvas Sizing**: `minHeight: 180px`, `maxHeight: 280px` (compact for single metrics)
- **Use Case**: Glanceable KPIs, compact dashboard cards, 4-6 charts in 2x3 grids

**Performance:**
- Large components use `React.memo` and `useMemo`
- Dynamic imports for heavy features (charts, workflow editor)
- Debounced inputs for real-time features

