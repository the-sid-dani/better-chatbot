# Canvas Production Architecture - Proper Implementation

## Current Issues with Emergency Fix
- Keyword-based Canvas opening (fragile, language-dependent)
- Polling mechanism for charts (inefficient, resource-intensive)
- Multiple setTimeout hacks (race conditions, unpredictable)
- Not following Vercel AI SDK streaming patterns properly

## Proper Production Architecture

### 1. Tool-First Canvas Opening
Canvas should open when chart tools are INVOKED, not based on text keywords:

```typescript
// In shared.chat.ts - Tool invocation detection
const toolInvocations = await streamText({
  tools: { create_chart: chartTool },
  onToolCall: async (toolCall) => {
    if (toolCall.toolName === 'create_chart') {
      // Emit Canvas open event BEFORE tool execution
      stream.writeValue({
        type: 'canvas-open',
        toolName: toolCall.toolName,
        immediate: true
      });
    }
  }
});
```

### 2. Native Streaming Integration
Use Vercel AI SDK's built-in streaming, not polling:

```typescript
// In useChat onData handler
onData: (data) => {
  if (data.type === 'canvas-open') {
    showCanvas();
  }
  
  if (data.type === 'tool-result' && data.tool === 'create_chart') {
    addCanvasArtifact(data.result);
  }
}
```

### 3. Proper State Management
Use React state properly without hacks:

```typescript
const useCanvas = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  const showCanvas = useCallback(() => {
    setIsVisible(true);
  }, []); // No complex dependencies
  
  return { isVisible, showCanvas };
};
```

### 4. Clean Tool Integration
Chart tools should handle their own Canvas integration:

```typescript
export const createChartTool = createTool({
  execute: async function* ({ title, data }) {
    // Signal Canvas to open
    yield { type: 'canvas-signal', action: 'open' };
    
    // Create chart
    const chart = await createChart(title, data);
    
    // Stream result
    yield { 
      type: 'chart-complete',
      chartData: chart,
      shouldCreateArtifact: true 
    };
  }
});
```

## Why Current Fix is Wrong
1. **Not event-driven**: Uses text parsing instead of tool events
2. **Resource intensive**: Polling instead of streaming
3. **Fragile**: Multiple timing hacks instead of proper state management
4. **Not scalable**: Will break with multiple tools, languages, edge cases

## Recommended Next Steps
1. Remove all emergency fixes and polling
2. Implement proper tool-first Canvas opening
3. Use native Vercel AI SDK streaming patterns
4. Add proper error handling and fallbacks
5. Test with production-realistic scenarios