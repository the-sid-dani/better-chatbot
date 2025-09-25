# AI Model Cleanup Plan

## 📋 Context Discovery Summary

### Current Model Configuration Analysis

**File:** `src/lib/ai/models.ts`

**Current Static Models:**
```typescript
const staticModels = {
  openai: {
    "gpt-4.1": openai("gpt-4.1"),
    "gpt-4.1-mini": openai("gpt-4.1-mini"),
    "o4-mini": openai("o4-mini"),
    o3: openai("o3"),
    // Commented: "gpt-5": openai("gpt-5")
  },
  google: {
    "gemini-2.5-flash-lite": google("gemini-2.5-flash-lite"),
    "gemini-2.5-flash": google("gemini-2.5-flash"),
    "gemini-2.5-pro": google("gemini-2.5-pro"),
  },
  anthropic: {
    "claude-4-sonnet": anthropic("claude-4-sonnet-20250514"),
    "claude-4-opus": anthropic("claude-4-opus-20250514"),
    "claude-3-7-sonnet": anthropic("claude-3-7-sonnet-20250219"),
  },
  xai: {
    "grok-4": xai("grok-4"),
    "grok-3": xai("grok-3"),
    "grok-3-mini": xai("grok-3-mini"),
  },
  ollama: {
    "gemma3:1b": ollama("gemma3:1b"),
    "gemma3:4b": ollama("gemma3:4b"),
    "gemma3:12b": ollama("gemma3:12b"),
  },
  openRouter: {
    "gpt-oss-20b:free": openrouter("openai/gpt-oss-20b:free"),
    "qwen3-8b:free": openrouter("qwen/qwen3-8b:free"),
    "qwen3-14b:free": openrouter("qwen/qwen3-14b:free"),
    "qwen3-coder:free": openrouter("qwen/qwen3-coder:free"),
    "deepseek-r1:free": openrouter("deepseek/deepseek-r1-0528:free"),
    "deepseek-v3:free": openrouter("deepseek/deepseek-chat-v3-0324:free"),
    "gemini-2.0-flash-exp:free": openrouter("google/gemini-2.0-flash-exp:free"),
  },
};
```

**Additional Dynamic Models:**
- OpenAI-compatible models loaded from `process.env.OPENAI_COMPATIBLE_DATA`
- Combined in `allModels = { ...openaiCompatibleModels, ...staticModels }`

## 🎯 User Requirements

**Keep Only:**
- ✅ GPT-5 (currently commented out)
- ✅ Gemini 2.5 Flash
- ✅ Gemini 2.5 Pro
- ✅ Grok 4
- ✅ Claude 4 Sonnet
- ✅ **ALL OpenRouter models** (preserve entire openRouter section)

**Remove:**
- ❌ GPT-4.1, GPT-4.1-mini, O4-mini, O3
- ❌ Gemini 2.5 Flash Lite
- ❌ Claude 4 Opus, Claude 3.7 Sonnet
- ❌ Grok 3, Grok 3 Mini
- ❌ All Ollama models

## 🛠️ Implementation Plan

### Phase 1: Static Models Cleanup

**File to Modify:** `src/lib/ai/models.ts`

**Updated staticModels Configuration:**
```typescript
const staticModels = {
  openai: {
    "gpt-5": openai("gpt-5"), // Uncomment when available
  },
  google: {
    "gemini-2.5-flash": google("gemini-2.5-flash"),
    "gemini-2.5-pro": google("gemini-2.5-pro"),
  },
  anthropic: {
    "claude-4-sonnet": anthropic("claude-4-sonnet-20250514"),
  },
  xai: {
    "grok-4": xai("grok-4"),
  },
  openRouter: {
    // PRESERVE ALL - User explicitly wants all OpenRouter models
    "gpt-oss-20b:free": openrouter("openai/gpt-oss-20b:free"),
    "qwen3-8b:free": openrouter("qwen/qwen3-8b:free"),
    "qwen3-14b:free": openrouter("qwen/qwen3-14b:free"),
    "qwen3-coder:free": openrouter("qwen/qwen3-coder:free"),
    "deepseek-r1:free": openrouter("deepseek/deepseek-r1-0528:free"),
    "deepseek-v3:free": openrouter("deepseek/deepseek-chat-v3-0324:free"),
    "gemini-2.0-flash-exp:free": openrouter("google/gemini-2.0-flash-exp:free"),
  },
  // REMOVE: ollama section entirely
};
```

### Phase 2: Unsupported Models Cleanup

**Update staticUnsupportedModels Set:**
- Remove references to deleted models
- Preserve OpenRouter model references that remain unsupported

**Current Unsupported Models to Update:**
```typescript
const staticUnsupportedModels = new Set([
  // REMOVE: staticModels.openai["o4-mini"], (deleted)
  // REMOVE: staticModels.ollama references (section deleted)
  staticModels.openRouter["gpt-oss-20b:free"],
  staticModels.openRouter["qwen3-8b:free"],
  staticModels.openRouter["qwen3-14b:free"],
  staticModels.openRouter["deepseek-r1:free"],
  staticModels.openRouter["gemini-2.0-flash-exp:free"],
]);
```

### Phase 3: Fallback Model Verification

**Current Fallback:** `staticModels.anthropic["claude-4-sonnet"]`
- ✅ **No Change Needed** - Claude 4 Sonnet is preserved

### Phase 4: Impact Assessment

**Components Affected:**
1. **Model Selection UI** (`src/components/select-model.tsx`)
   - Will automatically reflect reduced model list
   - No code changes needed (uses `customModelProvider.modelsInfo`)

2. **Chat Interface** (`src/components/chat-bot.tsx`)
   - Uses `customModelProvider.getModel()` - no changes needed
   - Fallback behavior preserved

3. **API Routes** (`src/app/api/chat/route.ts`)
   - Uses model provider abstraction - no changes needed

**Testing Requirements:**
1. Verify model dropdown shows only desired models
2. Test fallback behavior for removed models
3. Confirm OpenRouter models remain functional
4. Validate OpenAI-compatible models still load correctly

### Phase 5: Documentation Updates

**Files to Update:**
- `CLAUDE.md` - Update model list in documentation
- `README.md` - Update supported providers if mentioned

## 🔍 Risk Factors

### High Risk
- **GPT-5 Availability:** Currently commented out - may not be released yet
- **Breaking Existing Chats:** Users with active conversations using removed models

### Medium Risk
- **OpenRouter Dependencies:** Ensure all preserved OpenRouter models are still valid
- **Environment Variables:** No impact on OpenAI-compatible dynamic models

### Low Risk
- **UI Updates:** Model selection UI will automatically adapt
- **Fallback Behavior:** Claude 4 Sonnet fallback remains intact

## 🧪 Validation Steps

### Pre-Implementation Testing
1. Run development server to baseline current models
2. Test model selection dropdown functionality
3. Verify OpenRouter models are accessible

### Post-Implementation Testing
1. **Model Count Verification:**
   - OpenAI: 1 model (GPT-5)
   - Google: 2 models (Gemini 2.5 Flash, Pro)
   - Anthropic: 1 model (Claude 4 Sonnet)
   - xAI: 1 model (Grok 4)
   - OpenRouter: 7 models (all preserved)

2. **Functionality Testing:**
   - Create new chat with each remaining model
   - Test model switching mid-conversation
   - Verify fallback for invalid model requests

3. **Integration Testing:**
   - OpenAI-compatible models still load correctly
   - Model dropdown renders expected options
   - No console errors for removed model references

## 📋 Implementation Checklist

- [ ] Backup current `src/lib/ai/models.ts`
- [ ] Update `staticModels` configuration
- [ ] Update `staticUnsupportedModels` set
- [ ] Uncomment GPT-5 (if available) or leave commented with note
- [ ] Remove ollama import if no longer used
- [ ] Test model dropdown functionality
- [ ] Test chat creation with remaining models
- [ ] Verify OpenRouter models work correctly
- [ ] Update documentation if needed
- [ ] Run linting and type checking
- [ ] Deploy and monitor for issues

## 🎯 Expected Outcomes

**Model Count Reduction:**
- **Before:** ~16 static models + dynamic OpenAI-compatible models
- **After:** ~12 models (5 core + 7 OpenRouter) + dynamic OpenAI-compatible models
- **Reduction:** 4 static models removed (gpt-4.1 variants, gemini-flash-lite, claude variants, grok variants, all ollama)

**Benefits:**
- Simplified model selection interface
- Reduced maintenance overhead
- Focus on most relevant/powerful models
- Preserved all OpenRouter options per user request