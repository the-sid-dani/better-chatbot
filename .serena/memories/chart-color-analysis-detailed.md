# Detailed Chart Color Analysis - Critical Bug Investigation

## 🎨 CORRECT Color System (From Existing Charts)

### CSS Variables (globals.css)
```css
:root {
  --chart-1: hsl(221.2 83.2% 53.3%);  /* Primary blue */
  --chart-2: hsl(212 95% 68%);         /* Light blue */
  --chart-3: hsl(216 92% 60%);         /* Medium blue */
  --chart-4: hsl(210 98% 78%);         /* Lighter blue */
  --chart-5: hsl(212 97% 87%);         /* Very light blue */
}
```

### CORRECT Implementation Pattern (Working Charts)
```typescript
// From bar-chart.tsx - WORKING CORRECTLY
const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)", 
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// Chart configuration (CRITICAL)
config[sanitizeCssVariableName(seriesName)] = {
  label: seriesName,
  color: chartColors[colorIndex],
};

// Rendering (CORRECT)
fill={`var(--color-${sanitizeCssVariableName(seriesName)})`}
```

## 🚨 TREEMAP SPECIFIC ISSUES

### Input Data Analysis
```json
{
  "title": "Budget Allocation (Tree Map)",
  "data": [
    {"name": "Marketing", "value": 400},
    {"name": "R&D", "value": 300}, 
    {"name": "Sales", "value": 200},
    {"name": "HR", "value": 100}
  ]
}
```

**Expected Output**: 4 rectangles of different sizes:
- Marketing: Largest rectangle (400)
- R&D: Second largest (300)  
- Sales: Medium (200)
- HR: Smallest (100)

**Each rectangle should use different blue shades from --chart-1 to --chart-4**

### CURRENT PROBLEM
- Showing ONE BIG PURPLE BLOCK instead of 4 segmented rectangles
- Not using CSS variable color system
- Data structure transformation is incorrect

## 🔧 REQUIRED FIXES

### 1. Data Structure for Flat Data
```typescript
// For flat data (no children), Recharts Treemap needs:
const data = [
  { name: "Marketing", size: 400, fill: "hsl(var(--chart-1))" },
  { name: "R&D", size: 300, fill: "hsl(var(--chart-2))" },
  { name: "Sales", size: 200, fill: "hsl(var(--chart-3))" },
  { name: "HR", size: 100, fill: "hsl(var(--chart-4))" }
];
```

### 2. Proper Color Assignment
- Each rectangle needs individual color from CSS variables
- Must use blue color scheme: --chart-1 through --chart-5
- NO hardcoded colors or purple/other colors

### 3. Component Configuration
```typescript
<Treemap
  data={chartData}
  dataKey="size"
  stroke="hsl(var(--border))"
  // No fill prop - colors come from data
/>
```

## 🎯 CRITICAL REQUIREMENTS

1. **4 SEPARATE RECTANGLES** - Not one big block
2. **BLUE COLOR SCHEME** - Must match existing charts
3. **PROPORTIONAL SIZING** - Rectangle size matches data values
4. **READABLE LABELS** - Each rectangle shows department name and value
5. **CSS VARIABLE INTEGRATION** - Use design system colors

This is a critical visual bug that makes the treemap unusable. Must be fixed to show proper hierarchical visualization.