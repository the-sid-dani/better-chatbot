# src/components/canvas/ - Canvas Workspace System

Modular Canvas architecture providing advanced multi-grid dashboard layouts for real-time data visualization during AI conversations.

## Structure

**Foundation:** `base/` directory with core Canvas components (BaseCanvas, CanvasGrid, CanvasChart, CanvasHeader, CanvasSection)

**Advanced Layouts:** `dashboard-canvas.tsx` for complex multi-chart dashboard layouts with grid positioning

**Chart Coordination:** `charts/dashboard-charts.tsx` for orchestrated multi-chart rendering systems

## Key Features

**Responsive Grid Layout:** CSS Grid adapts from 1x1 to 2x2+ based on chart count with automatic positioning algorithms

**Progressive Building:** Charts appear sequentially with smooth transitions as AI creates them

**Chart Coordination:** Multi-chart rendering orchestration for complex dashboards

**Performance Optimizations:** 60fps animations, lazy loading, and memory management for large datasets

## Development Patterns

**Base Components:** Use composition pattern with BaseCanvas → CanvasGrid → CanvasChart hierarchy

**Grid System:** CSS Grid exclusively for layout management with responsive breakpoints

**Animation:** Framer Motion for smooth transitions and progressive chart building

**State Management:** Canvas state coordinated through useCanvas hook integration