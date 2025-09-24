# Geographic Chart Tooltip Validation Plan

## Overview
Comprehensive validation plan for troubleshooting the geographic chart tooltip issue. The tooltip is not appearing despite implementing custom tooltip logic using the same styling patterns as working charts.

## Problem Statement
- **Issue**: Custom tooltip not displaying on geographic chart hover
- **Implementation**: Custom tooltip using React.useState + mouse events (onMouseEnter/onMouseMove/onMouseLeave)
- **Reference**: Working Recharts-based tooltips in treemap-chart.tsx and bar-chart.tsx
- **Technology Gap**: Geographic chart uses react-simple-maps, not Recharts

## Current Implementation Analysis

### Geographic Chart Tooltip (Custom Implementation)
```typescript
// State management
const [tooltip, setTooltip] = React.useState<{
  name: string;
  value: number | undefined;
  x: number;
  y: number;
} | null>(null);

// Event handlers on Geography components
onMouseEnter={(event) => {
  const stateName = geo.properties?.name || geo.properties?.NAME || regionCode;
  setTooltip({
    name: stateName,
    value: value,
    x: event.clientX,
    y: event.clientY
  });
}}

// Rendered tooltip
{tooltip && (
  <div
    className="absolute z-50 rounded-lg border bg-background p-2 shadow-sm pointer-events-none"
    style={{
      left: tooltip.x + 10,
      top: tooltip.y - 10,
      transform: 'translate(-50%, -100%)'
    }}
  >
    {/* Tooltip content */}
  </div>
)}
```

### Working Reference (Recharts Tooltip)
```typescript
// Treemap chart - automatic tooltip
<Tooltip
  content={({ active, payload }) => {
    if (active && payload && payload.length && payload[0]?.payload) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          {/* Same styling as custom tooltip */}
        </div>
      );
    }
    return null;
  }}
/>

// Bar chart - ChartTooltip component
<ChartTooltip
  cursor={false}
  content={<ChartTooltipContent indicator="dashed" />}
/>
```

## Validation Plan: 10-Step Systematic Debugging

### 1. Event Handling Validation

#### Test Cases:
- **A1**: Verify mouse events fire correctly
- **A2**: Check event object properties
- **A3**: Validate Geography component event propagation
- **A4**: Test event timing and sequence

#### Debugging Commands:
```typescript
// Add temporary debugging to Geography components
onMouseEnter={(event) => {
  console.log('🔍 MouseEnter Event:', {
    type: event.type,
    clientX: event.clientX,
    clientY: event.clientY,
    target: event.target,
    currentTarget: event.currentTarget,
    regionCode,
    value,
    stateName: geo.properties?.name || geo.properties?.NAME || regionCode
  });
  // ... existing tooltip logic
}}

onMouseMove={(event) => {
  console.log('🔍 MouseMove Event:', {
    clientX: event.clientX,
    clientY: event.clientY,
    tooltipExists: !!tooltip
  });
  // ... existing tooltip logic
}}

onMouseLeave={() => {
  console.log('🔍 MouseLeave Event');
  setTooltip(null);
}}
```

#### Expected Results:
- Events should fire in sequence: Enter → Move → Leave
- clientX/clientY should be valid numbers
- Event targets should be Geography elements

### 2. State Management Verification

#### Test Cases:
- **B1**: Verify tooltip state updates correctly
- **B2**: Check state persistence during mouse movement
- **B3**: Validate state cleanup on mouse leave
- **B4**: Test state race conditions

#### Debugging Commands:
```typescript
// Add state debugging
React.useEffect(() => {
  console.log('🔍 Tooltip State Change:', tooltip);
}, [tooltip]);

// Add logging to all tooltip state updates
const setTooltipWithLogging = React.useCallback((newTooltip) => {
  console.log('🔍 Setting Tooltip State:', newTooltip);
  setTooltip(newTooltip);
}, []);
```

#### Expected Results:
- State should update immediately on mouse enter
- State should persist during mouse movement
- State should clear on mouse leave

### 3. CSS/Styling Issues

#### Test Cases:
- **C1**: Verify tooltip container rendering
- **C2**: Check CSS class application
- **C3**: Validate positioning calculations
- **C4**: Test responsive design impact

#### Debugging Commands:
```typescript
// Add styling debugging
{tooltip && (
  <div
    className="absolute z-50 rounded-lg border bg-background p-2 shadow-sm pointer-events-none"
    style={{
      left: tooltip.x + 10,
      top: tooltip.y - 10,
      transform: 'translate(-50%, -100%)',
      border: '2px solid red', // Debug border
      backgroundColor: 'yellow', // Debug background
    }}
    data-testid="geographic-tooltip" // For testing
  >
    <div>DEBUG: Tooltip Visible</div>
    {/* ... existing content */}
  </div>
)}
```

#### Browser DevTools Steps:
1. Open Chrome DevTools → Elements
2. Hover over geographic regions while DevTools open
3. Search for `data-testid="geographic-tooltip"` in DOM
4. Check computed styles if element exists
5. Verify positioning values

### 4. Positioning Problems

#### Test Cases:
- **D1**: Verify coordinate calculation accuracy
- **D2**: Check viewport boundary handling
- **D3**: Test transform property application
- **D4**: Validate parent container positioning

#### Debugging Commands:
```typescript
// Test different positioning strategies
const positioningTests = {
  // Strategy 1: Fixed positioning (current)
  fixed: {
    left: tooltip.x + 10,
    top: tooltip.y - 10,
    transform: 'translate(-50%, -100%)'
  },

  // Strategy 2: Simple offset
  simple: {
    left: tooltip.x + 15,
    top: tooltip.y - 40,
  },

  // Strategy 3: No transform
  noTransform: {
    left: tooltip.x - 50,
    top: tooltip.y - 60,
  }
};

// Test each positioning strategy
style={positioningTests.simple}
```

#### Manual Testing:
- Hover in different areas of map
- Check tooltip appears in expected location
- Test near viewport edges
- Verify with different zoom levels

### 5. Z-Index Conflicts

#### Test Cases:
- **E1**: Verify tooltip z-index value
- **E2**: Check parent container stacking contexts
- **E3**: Test SVG stacking order
- **E4**: Validate Chart container z-index

#### Debugging Commands:
```typescript
// Test extreme z-index values
style={{
  ...positioningStyle,
  zIndex: 9999, // Very high z-index
  position: 'fixed', // Force new stacking context
}}

// Add stacking context debugging
<div className="relative z-10"> {/* ChartContainer */}
  <div className="relative z-20"> {/* ComposableMap */}
    {/* Geography components */}
  </div>
  {tooltip && (
    <div className="fixed z-50" {/* Tooltip */}>
  )}
</div>
```

#### Browser DevTools Inspection:
1. Inspect parent elements for stacking contexts
2. Check `z-index` computed values
3. Look for `transform`, `opacity`, `position` properties creating stacking contexts
4. Test changing tooltip position to `fixed` vs `absolute`

### 6. Component Rendering Issues

#### Test Cases:
- **F1**: Verify tooltip renders in DOM
- **F2**: Check conditional rendering logic
- **F3**: Test component lifecycle timing
- **F4**: Validate React re-render behavior

#### Debugging Commands:
```typescript
// Force tooltip visibility for testing
const [debugTooltipVisible, setDebugTooltipVisible] = React.useState(false);

// Add debug toggle
<button
  onClick={() => setDebugTooltipVisible(!debugTooltipVisible)}
  className="absolute top-0 left-0 z-50 bg-red-500 text-white p-2"
>
  Toggle Debug Tooltip
</button>

// Always show tooltip when debug enabled
{(tooltip || debugTooltipVisible) && (
  <div /* tooltip styles */>
    <div>State: {tooltip ? 'From Mouse' : 'Debug Mode'}</div>
    <div>X: {tooltip?.x || 100}</div>
    <div>Y: {tooltip?.y || 100}</div>
    {/* ... rest of tooltip */}
  </div>
)}
```

### 7. Browser Dev Tools Debugging Steps

#### Step-by-Step Process:
1. **Open DevTools** → Elements tab
2. **Enable paint flashing** → Settings → More tools → Rendering → Paint flashing
3. **Hover over map regions** → Look for paint flashes
4. **Search DOM** → Search for tooltip content or `data-testid`
5. **Check console** → Look for event logs and errors
6. **Network tab** → Verify GeoJSON files load correctly
7. **Performance tab** → Check for JavaScript blocking
8. **Sources tab** → Set breakpoints in event handlers

#### Specific DevTools Commands:
```javascript
// Console debugging
$('[data-testid="geographic-tooltip"]') // Find tooltip element
$('.geographic-chart') // Find chart container

// Check computed styles
getComputedStyle($('[data-testid="geographic-tooltip"]'))

// Monitor events
monitorEvents(document, 'mouseover')
monitorEvents(document, 'mousemove')
```

### 8. Comparison with Working Charts

#### Key Differences Analysis:

| Aspect | Geographic Chart | Treemap Chart | Bar Chart |
|--------|------------------|---------------|-----------|
| Library | react-simple-maps | Recharts | Recharts |
| Tooltip Type | Custom React state | Recharts Tooltip | ChartTooltip |
| Event Handling | Manual mouse events | Automatic | Automatic |
| Positioning | clientX/clientY | Automatic | Automatic |
| Styling | Manual CSS classes | Same classes | Same classes |
| Z-index | Manual (z-50) | Automatic | Automatic |

#### Test Cases:
- **H1**: Compare DOM structure when hovering
- **H2**: Verify styling differences
- **H3**: Test event propagation differences
- **H4**: Check library-specific behaviors

#### Debugging Commands:
```typescript
// Add comparison logging
const logTooltipComparison = () => {
  console.log('🔍 Geographic Chart Tooltip State:', {
    library: 'react-simple-maps',
    tooltipState: tooltip,
    eventHandling: 'manual',
    positioning: 'clientX/clientY',
  });
};

// Compare with Recharts tooltip data structure
console.log('🔍 Expected Recharts Tooltip Structure:', {
  active: true,
  payload: [{
    payload: { name: 'Region', value: 123 }
  }]
});
```

### 9. Testing Methodology

#### Systematic Test Sequence:
1. **Unit Tests** → Event handlers in isolation
2. **Component Tests** → Tooltip rendering
3. **Integration Tests** → Mouse interaction flows
4. **Visual Tests** → Screenshot comparisons
5. **Cross-browser Tests** → Chrome, Firefox, Safari
6. **Responsive Tests** → Different screen sizes

#### Test Implementation:
```typescript
// Jest/Testing Library test cases
describe('Geographic Chart Tooltip', () => {
  test('should show tooltip on hover', async () => {
    render(<GeographicChart data={mockData} title="Test" geoType="usa-states" />);

    const geography = await screen.findByTestId('geography-element');

    fireEvent.mouseEnter(geography, {
      clientX: 100,
      clientY: 100
    });

    expect(screen.getByTestId('geographic-tooltip')).toBeInTheDocument();
  });

  test('should hide tooltip on mouse leave', async () => {
    // Similar test structure
  });
});
```

### 10. Potential Fixes to Implement

#### Fix Strategy 1: Debug Current Implementation
```typescript
// Enhanced error handling and logging
const handleMouseEnter = React.useCallback((event) => {
  try {
    const rect = event.currentTarget.getBoundingClientRect();
    const stateName = geo.properties?.name || geo.properties?.NAME || regionCode;

    console.log('🔍 Mouse Enter Debug:', {
      event: event.type,
      clientX: event.clientX,
      clientY: event.clientY,
      boundingRect: rect,
      stateName,
      value
    });

    setTooltip({
      name: stateName,
      value: value,
      x: event.clientX,
      y: event.clientY
    });
  } catch (error) {
    console.error('🚨 Tooltip Error:', error);
  }
}, [geo.properties, regionCode, value]);
```

#### Fix Strategy 2: Portal-Based Tooltip
```typescript
import { createPortal } from 'react-dom';

// Render tooltip in document body to avoid stacking issues
{tooltip && createPortal(
  <div
    className="fixed z-50 rounded-lg border bg-background p-2 shadow-sm pointer-events-none"
    style={{
      left: tooltip.x + 10,
      top: tooltip.y - 10,
      transform: 'translate(-50%, -100%)'
    }}
  >
    {/* Tooltip content */}
  </div>,
  document.body
)}
```

#### Fix Strategy 3: Recharts-Style Tooltip Component
```typescript
// Create a reusable tooltip component matching Recharts pattern
const CustomTooltip = ({ active, payload, coordinates }) => {
  if (!active || !payload) return null;

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-muted-foreground">
            Region
          </span>
          <span className="font-bold text-muted-foreground">
            {payload.name}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-muted-foreground">
            Value
          </span>
          <span className="font-bold">
            {payload.value !== undefined ? payload.value.toLocaleString() : 'No data'}
          </span>
        </div>
      </div>
    </div>
  );
};
```

#### Fix Strategy 4: Event Delegation
```typescript
// Use event delegation on parent container
React.useEffect(() => {
  const mapContainer = mapRef.current;

  const handleMouseOver = (event) => {
    const target = event.target.closest('[data-geography]');
    if (target) {
      const regionData = target.getAttribute('data-region-info');
      // Show tooltip
    }
  };

  mapContainer?.addEventListener('mouseover', handleMouseOver);
  mapContainer?.addEventListener('mouseout', handleMouseOut);

  return () => {
    mapContainer?.removeEventListener('mouseover', handleMouseOver);
    mapContainer?.removeEventListener('mouseout', handleMouseOut);
  };
}, []);
```

## Validation Execution Order

### Phase 1: Immediate Debugging (15 minutes)
1. Add console logging to event handlers
2. Add debug border/background to tooltip
3. Force tooltip visibility with debug toggle
4. Check browser DevTools Elements tab

### Phase 2: Systematic Testing (30 minutes)
5. Test event handling validation (Step 1)
6. Verify state management (Step 2)
7. Check CSS/styling issues (Step 3)
8. Investigate positioning problems (Step 4)

### Phase 3: Deep Investigation (45 minutes)
9. Test z-index conflicts (Step 5)
10. Verify component rendering (Step 6)
11. Browser DevTools deep dive (Step 7)
12. Compare with working charts (Step 8)

### Phase 4: Fix Implementation (30 minutes)
13. Implement most promising fix strategy
14. Test fix across different scenarios
15. Validate with systematic testing methodology

## Success Criteria

### Tooltip Must:
- ✅ Appear on mouse hover over geographic regions
- ✅ Show correct region name and value
- ✅ Follow mouse movement smoothly
- ✅ Disappear on mouse leave
- ✅ Handle edge cases (no data regions)
- ✅ Work across different geography types
- ✅ Match visual styling of other charts
- ✅ Have proper accessibility attributes

### Performance Requirements:
- ✅ No memory leaks from event handlers
- ✅ Smooth animations without jank
- ✅ Fast response to mouse events (<16ms)
- ✅ No impact on map rendering performance

## Risk Assessment

### High Risk Areas:
- **Event Propagation**: SVG elements may block events
- **Dynamic Loading**: Geographic data loaded asynchronously
- **Coordinate Systems**: clientX/clientY may not account for transforms
- **Library Differences**: react-simple-maps vs Recharts event models

### Mitigation Strategies:
- Test with multiple geography types
- Implement fallback positioning strategies
- Add comprehensive error handling
- Use portal rendering to avoid stacking issues

## Execution Commands

### Start Development Server
```bash
cd /Users/sid/Desktop/4.\ Coding\ Projects/better-chatbot
pnpm dev
```

### Test Geographic Chart
1. Navigate to chat interface
2. Create a geographic chart using chart tool
3. Hover over regions to test tooltip
4. Open browser DevTools for debugging

### Run Tests
```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Lint check
pnpm lint

# Type check
pnpm check-types
```

---

**Next Steps**: Execute Phase 1 debugging to identify the root cause, then proceed through systematic validation phases until tooltip functionality is fully working.
