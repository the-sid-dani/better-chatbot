# Treemap Color Cycling Fix - Critical Implementation

## 🎨 CORRECT Color Cycling for Any Number of Items

### Color System (5 Available Colors)
```css
--chart-1: hsl(221.2 83.2% 53.3%);  /* Primary blue */
--chart-2: hsl(212 95% 68%);         /* Light blue */
--chart-3: hsl(216 92% 60%);         /* Medium blue */
--chart-4: hsl(210 98% 78%);         /* Lighter blue */
--chart-5: hsl(212 97% 87%);         /* Very light blue */
```

### PROBLEM WITH CURRENT IMPLEMENTATION
- For 4 items: Marketing, R&D, Sales, HR
- Should show 4 different colored rectangles cycling through --chart-1 to --chart-4
- For 20-30 items: Should cycle through --chart-1 to --chart-5 repeatedly
- Current: Shows one big purple block (completely broken)

### CORRECT Implementation Pattern
```typescript
// For ANY number of items (4, 20, 30, etc.)
deduplicateData.map((item, index) => ({
  name: item.name,
  size: item.value,
  fill: `hsl(var(--chart-${(index % 5) + 1}))`, // Cycles 1,2,3,4,5,1,2,3,4,5...
}))
```

### Expected Results for Sample Data
- Marketing (400): --chart-1 (primary blue) - Largest rectangle
- R&D (300): --chart-2 (light blue) - Second largest  
- Sales (200): --chart-3 (medium blue) - Medium rectangle
- HR (100): --chart-4 (lighter blue) - Smallest rectangle

### For Large Datasets (20-30 items)
- Items 1-5: --chart-1 through --chart-5
- Items 6-10: --chart-1 through --chart-5 (cycle repeats)
- Items 11-15: --chart-1 through --chart-5 (cycle repeats)
- etc.

This ensures visual variety while maintaining design consistency.

## 🚨 Current Treemap Bug
The treemap is showing as ONE BIG PURPLE BLOCK instead of segmented rectangles. This indicates:
1. Data structure is wrong for Recharts Treemap
2. Color assignment is failing
3. Treemap is not recognizing individual items

MUST FIX: Proper flat data structure with individual rectangles and proper color cycling.