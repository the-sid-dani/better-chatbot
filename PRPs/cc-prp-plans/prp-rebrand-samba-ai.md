# PRP: Rebrand "Samba Orion" to "Samba AI"

**Project ID:** `a94b62b4-a1ea-4f11-8170-dd85e3748bc8`

---

## Goal

Complete rebranding from "Samba Orion" to "Samba AI" across all user-facing interfaces, documentation, configuration files, and metadata. This is a **text-only change** with zero functional code modifications, ensuring consistent branding throughout the entire application while maintaining all existing functionality.

**Target State:** All instances of "Samba Orion" and "samba-orion" replaced with "Samba AI" and "samba-ai" respectively across 14 files covering UI components, translations, documentation, and configuration.

---

## Why

### Business Value
- **Brand Consistency**: Aligns product naming with company's strategic direction
- **User Recognition**: Establishes clear brand identity from first impression (auth pages) through daily use
- **Market Positioning**: "Samba AI" communicates core product value more directly than "Orion"

### User Impact
- **High Visibility**: Changes appear on every authenticated page (sidebar), all auth pages, browser tabs, and workflow interfaces
- **First Impressions**: New users see updated branding immediately on sign-in/sign-up pages
- **Workflow Context**: Updated language in workflow builder reinforces brand identity during tool creation

### Technical Benefits
- **Zero Risk**: Text-only changes mean no functional breakage
- **SEO Update**: Improved metadata for search engines with "samba-ai" naming
- **Clean Codebase**: Consistent naming across code, docs, and user interfaces

---

## What

### Success Criteria
- [ ] All user-visible UI displays "Samba AI" (sidebar, auth pages, workflows)
- [ ] Browser tab title shows "samba-ai"
- [ ] All English translations updated in `messages/en.json`
- [ ] README and documentation reflect new branding
- [ ] Application constants and package.json use "samba-ai"
- [ ] Build completes successfully with no errors
- [ ] Type checking passes with no TypeScript errors
- [ ] E2E tests pass for authentication flows
- [ ] Visual verification confirms proper display on all affected pages
- [ ] No remaining "Orion" references in active codebase (excluding git history)

---

## All Needed Context

### Documentation & References

```yaml
# Official Next.js Documentation
- url: https://nextjs.org/docs/app/getting-started/metadata-and-og-images
  why: Understanding metadata API for SEO updates in src/app/layout.tsx
  critical: Next.js 15 uses Metadata objects for title and description

- url: https://next-intl.dev/docs/usage/translations
  why: Understanding internationalization structure for messages/en.json updates
  critical: JSON format must remain valid; only update English translations

- url: https://nextjs.org/docs/pages/guides/internationalization
  why: Context on how Next.js handles i18n routing and locale files
  critical: Other language files (es, fr, ja, ko, zh) exist but NOT being updated

# Project Documentation (MUST READ)
- file: /Users/sid/Desktop/4. Coding Projects/better-chatbot/CLAUDE.md
  why: Project architecture, essential commands, critical constraints
  critical: ONLY works on localhost:3000 - auth/observability constraint

- file: /Users/sid/Desktop/4. Coding Projects/better-chatbot/README.md
  why: External-facing documentation that needs rebranding
  critical: Contains multiple "Samba Orion" references that are user-visible

- file: /Users/sid/Desktop/4. Coding Projects/better-chatbot/PRPs/cc-prp-initials/initial-rebrand-samba-ai.md
  why: Complete analysis of all locations requiring changes
  critical: Line-by-line breakdown of every file and change needed

# Rebranding Best Practices (from web research)
- insight: Visual Studio case-preserving find/replace
  why: Maintain proper casing for different contexts
  critical: "Samba Orion" vs "samba-orion" vs "SAMBA ORION" - use exact matching

- insight: Next.js Metadata API best practices
  why: Ensure SEO optimization during rebrand
  critical: Keep titles concise (<60 chars), compelling descriptions

# Archon Project
- project_id: a94b62b4-a1ea-4f11-8170-dd85e3748bc8
  why: All 18 tasks created and tracked in proper order
  critical: Tasks ordered by priority (Tier 1-4, then testing)
```

### Current Codebase Structure

```bash
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx              # TIER 1: Auth page branding (Line 20)
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (chat)/
│   │   ├── swr-config.tsx          # TIER 3: Console branding (Line 12)
│   │   └── ...
│   ├── layout.tsx                  # TIER 1: Metadata & SEO (Lines 22, 24)
│   └── api/
│       └── chat/route.ts           # Contains "samba-orion" in session names
├── components/
│   └── layouts/
│       └── app-sidebar.tsx         # TIER 1: Sidebar branding (Lines 80, 86)
├── lib/
│   ├── const.ts                    # TIER 3: APP_NAME constant (Line 59)
│   └── ai/
│       └── prompts.ts              # TIER 4: AI identity (Line 98)

messages/
└── en.json                         # TIER 2: Workflow translations (Lines 122-130)

# Documentation Files (TIER 2 & 4)
├── README.md                       # TIER 2: Main docs (7 references)
├── CLAUDE.md                       # TIER 4: Project docs (Line 3)
├── package.json                    # TIER 3: Package name (Line 2)
└── docs/
    ├── ARCHITECTURE-VERCEL-AI-SDK.md  # TIER 4 (Lines 1, 5)
    └── tips-guides/
        ├── e2e-testing-guide.md       # TIER 4 (Line 3)
        ├── oauth.md                   # TIER 4 (Line 110)
        └── system-prompts-and-customization.md  # TIER 4 (Lines 3, 83)
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: This is a Next.js 15 project with specific constraints

// 1. Port Constraint (from CLAUDE.md)
// CRITICAL: Project ONLY works on localhost:3000
// NO OTHER PORTS supported due to Better-Auth and Langfuse observability
// Don't attempt to change ports in validation steps

// 2. Metadata API (Next.js 15)
// Uses new Metadata object in src/app/layout.tsx
export const metadata: Metadata = {
  title: "samba-orion",  // Change this
  description: "..."     // Change this too
};
// NOT using <Head> tags or _document.tsx

// 3. JSON Syntax in messages/en.json
// CRITICAL: Must maintain valid JSON
// Lines like: "chatbotToolTitle": "Use as Samba Orion Tools",
// Watch for: escaped quotes, trailing commas, proper nesting

// 4. Case Sensitivity Matters
// Three distinct patterns:
// - "Samba Orion" (UI display, title case)
// - "samba-orion" (configs, URLs, kebab-case)
// - "SAMBA ORION" (if in ASCII art)

// 5. Logo Files
// CRITICAL: NO logo file changes needed
// Logo is just the Samba heart - text appears NEXT to it in code
// Only change Line 86 in app-sidebar.tsx (the <h4> text)

// 6. Build Process
// Use: pnpm build:local (NOT pnpm build)
// This sets NO_HTTPS='1' required for local builds
// Clear .next cache before rebuilding: rm -rf .next

// 7. Git History Files
// DO NOT modify files in .git/ directory
// Git logs should remain unchanged (historical records)

// 8. i18n Files
// Only updating messages/en.json
// Other language files exist (es, fr, ja, ko, zh) but NOT changing them
// If multilingual support needed later, update those separately
```

---

## Implementation Blueprint

### Phase 1: Tier 1 Changes (Critical User-Facing UI)

**Priority: HIGHEST - These changes are immediately visible to all users**

#### Task 1: Update Application Metadata (src/app/layout.tsx)

**Location:** `src/app/layout.tsx` (Lines 22, 24)

```typescript
// BEFORE:
export const metadata: Metadata = {
  title: "samba-orion",
  description:
    "Samba-Orion is an AI chatbot platform that uses advanced tools to answer questions.",
};

// AFTER:
export const metadata: Metadata = {
  title: "samba-ai",
  description:
    "Samba-AI is an AI chatbot platform that uses advanced tools to answer questions.",
};
```

**Why First:** Controls browser tab title and meta description - affects SEO and first impression
**Impact:** Every page load, search engine indexing
**Validation:** Check browser tab after starting app

---

#### Task 2: Update Authentication Layout (src/app/(auth)/layout.tsx)

**Location:** `src/app/(auth)/layout.tsx` (Line 20)

```typescript
// BEFORE:
<h1 className="text-xl font-semibold flex items-center gap-2 animate-in fade-in duration-1000">
  <Think />
  <span>Samba Orion</span>
</h1>

// AFTER:
<h1 className="text-xl font-semibold flex items-center gap-2 animate-in fade-in duration-1000">
  <Think />
  <span>Samba AI</span>
</h1>
```

**Why Second:** First impression for new users on sign-in/sign-up pages
**Impact:** Authentication pages visited by every user
**Validation:** Navigate to /sign-in and /sign-up, verify left panel branding

---

#### Task 3: Update Main Sidebar Branding (src/components/layouts/app-sidebar.tsx)

**Location:** `src/components/layouts/app-sidebar.tsx` (Lines 80, 86)

```typescript
// BEFORE (Line 80):
<Image
  src="/samba-resources/logos/samba-logo-2024.png"
  alt="Samba Orion Logo"
  width={24}
  height={24}
  className="object-contain"
/>

// AFTER (Line 80):
<Image
  src="/samba-resources/logos/samba-logo-2024.png"
  alt="Samba AI Logo"
  width={24}
  height={24}
  className="object-contain"
/>

// BEFORE (Line 86):
<h4 className="font-bold">Samba Orion</h4>

// AFTER (Line 86):
<h4 className="font-bold">Samba AI</h4>
```

**Why Third:** Visible on EVERY authenticated page - highest visibility after login
**Impact:** Main navigation header seen constantly
**Validation:** Log in and check sidebar header alignment and text

**CRITICAL NOTE:** Logo file (`samba-logo-2024.png`) does NOT change - only alt text and adjacent text

---

### Phase 2: Tier 2 Changes (User-Facing Content)

**Priority: HIGH - External documentation and in-app content**

#### Task 4: Update English Translations (messages/en.json)

**Location:** `messages/en.json` (Lines 122, 123, 125, 127, 130)

```json
// BEFORE:
"greeting": {
  "chatbotToolTitle": "Use as Samba Orion Tools",
  "chatbotToolDescription": "The main purpose of workflows is to use them as tools in Samba Orion conversations. Turn repetitive tasks into workflows for easy execution during chats.",
  "parameterBasedDescription": "Input nodes define parameter structures, not triggers. They specify the data format needed when Samba Orion calls this workflow as a tool.",
  "exampleDescription": "Create an \"Email Writing → Translation → Send\" workflow, then easily execute it in Samba Orion conversations with \"@email_workflow\".",
  "ctaMessage": "Start creating workflows now to expand your Samba Orion's capabilities!"
}

// AFTER:
"greeting": {
  "chatbotToolTitle": "Use as Samba AI Tools",
  "chatbotToolDescription": "The main purpose of workflows is to use them as tools in Samba AI conversations. Turn repetitive tasks into workflows for easy execution during chats.",
  "parameterBasedDescription": "Input nodes define parameter structures, not triggers. They specify the data format needed when Samba AI calls this workflow as a tool.",
  "exampleDescription": "Create an \"Email Writing → Translation → Send\" workflow, then easily execute it in Samba AI conversations with \"@email_workflow\".",
  "ctaMessage": "Start creating workflows now to expand your Samba AI's capabilities!"
}
```

**CRITICAL:** Maintain valid JSON syntax - watch for escaped quotes and commas
**Impact:** Workflow page greeting and informational text
**Validation:** Navigate to /workflow page, verify text displays correctly

---

#### Task 5: Update README Documentation (README.md)

**Location:** `README.md` (Lines 3, 13, 109, 334, 429, 484, 523)

```markdown
<!-- BEFORE (Line 3): -->
# Samba Orion

<!-- AFTER (Line 3): -->
# Samba AI

<!-- BEFORE (Line 13): -->
**Samba Orion** is a comprehensive AI platform where teams...

<!-- AFTER (Line 13): -->
**Samba AI** is a comprehensive AI platform where teams...

<!-- Continue for all 7 references... -->
```

**Impact:** External-facing documentation, GitHub repository display
**Validation:** Review README in GitHub/local editor for consistency

---

### Phase 3: Tier 3 Changes (Configuration & Internal Systems)

**Priority: MEDIUM - Internal configuration and constants**

#### Task 6: Update Application Constants (src/lib/const.ts)

**Location:** `src/lib/const.ts` (Line 59)

```typescript
// BEFORE:
export const APP_NAME = "samba-orion";

// AFTER:
export const APP_NAME = "samba-ai";
```

**Impact:** MCP client identification, internal system naming
**Validation:** Search codebase for APP_NAME usage, verify no hardcoded dependencies

---

#### Task 7: Update Package Name (package.json)

**Location:** `package.json` (Line 2)

```json
// BEFORE:
{
  "name": "samba-orion",
  "version": "1.21.0",
  ...
}

// AFTER:
{
  "name": "samba-ai",
  "version": "1.21.0",
  ...
}
```

**Impact:** NPM package identifier, build artifacts
**Validation:** Run `pnpm install` to verify package.json is valid

---

#### Task 8: Update Console Branding (src/app/(chat)/swr-config.tsx)

**Location:** `src/app/(chat)/swr-config.tsx` (Line 12)

```typescript
// BEFORE:
console.log(
  "%c█▄▄ █▀▀ ▀█▀ ▀█▀ █▀▀ █▀█\n█▄█ █▄▄  █   █  █▄▄ █▀▄\n\n%c🧡 Samba Orion - The Future of Agentic Advertising\nhttps://github.com/samba-tv/samba-orion",
  "color: #00d4ff; font-weight: bold; font-family: monospace; font-size: 16px; text-shadow: 0 0 10px #00d4ff;",
  "color: #888; font-size: 12px;",
);

// AFTER:
console.log(
  "%c█▄▄ █▀▀ ▀█▀ ▀█▀ █▀▀ █▀█\n█▄█ █▄▄  █   █  █▄▄ █▀▄\n\n%c🧡 Samba AI - The Future of Agentic Advertising\nhttps://github.com/samba-tv/samba-ai",
  "color: #00d4ff; font-weight: bold; font-family: monospace; font-size: 16px; text-shadow: 0 0 10px #00d4ff;",
  "color: #888; font-size: 12px;",
);
```

**Impact:** Developer console branding (low visibility)
**Validation:** Open browser console, verify ASCII art and message

---

### Phase 4: Tier 4 Changes (Documentation & AI Config)

**Priority: LOW - Internal documentation and AI behavior**

#### Task 9: Update Project Documentation (CLAUDE.md)

**Location:** `CLAUDE.md` (Line 3)

```markdown
<!-- BEFORE: -->
**Samba-Orion** is an AI chatbot platform built on **Vercel AI SDK** with Next.js 15.

<!-- AFTER: -->
**Samba-AI** is an AI chatbot platform built on **Vercel AI SDK** with Next.js 15.
```

---

#### Task 10: Update AI System Prompts (src/lib/ai/prompts.ts)

**Location:** `src/lib/ai/prompts.ts` (Line 98)

```typescript
// BEFORE:
<general_capabilities>
As Samba Orion, you can assist with:
- Building and analyzing audiences...

// AFTER:
<general_capabilities>
As Samba AI, you can assist with:
- Building and analyzing audiences...
```

**Impact:** AI assistant identity in system prompts
**Validation:** Test chat functionality to ensure AI responds normally

---

#### Task 11: Update Architecture Documentation (docs/ARCHITECTURE-VERCEL-AI-SDK.md)

**Location:** `docs/ARCHITECTURE-VERCEL-AI-SDK.md` (Lines 1, 5)

```markdown
<!-- BEFORE (Line 1): -->
# 🏗️ **Samba Orion: Vercel AI SDK-Centric Architecture**

<!-- AFTER (Line 1): -->
# 🏗️ **Samba AI: Vercel AI SDK-Centric Architecture**

<!-- BEFORE (Line 5): -->
Samba Orion is built **entirely on Vercel AI SDK**...

<!-- AFTER (Line 5): -->
Samba AI is built **entirely on Vercel AI SDK**...
```

---

#### Task 12: Update Remaining Documentation Files

**Locations:** `docs/tips-guides/` (3 files with 4 references total)

```markdown
<!-- docs/tips-guides/e2e-testing-guide.md (Line 3) -->
<!-- BEFORE: -->
Comprehensive guide for running and developing end-to-end tests for Samba Orion using Playwright.
<!-- AFTER: -->
Comprehensive guide for running and developing end-to-end tests for Samba AI using Playwright.

<!-- docs/tips-guides/oauth.md (Line 110) -->
<!-- BEFORE: -->
You can now sign in to Samba Orion using your Google, GitHub or Microsoft account.
<!-- AFTER: -->
You can now sign in to Samba AI using your Google, GitHub or Microsoft account.

<!-- docs/tips-guides/system-prompts-and-customization.md (Lines 3, 83) -->
<!-- BEFORE (Line 3): -->
> Transform your chatbot experience with powerful system prompt customization. Samba Orion uses a sophisticated multi-layered prompt system...
<!-- AFTER (Line 3): -->
> Transform your chatbot experience with powerful system prompt customization. Samba AI uses a sophisticated multi-layered prompt system...

<!-- BEFORE (Line 83): -->
1. **Base System Prompt** - Core Samba Orion behavior
<!-- AFTER (Line 83): -->
1. **Base System Prompt** - Core Samba AI behavior
```

---

### Phase 5: Testing & Validation

**Priority: CRITICAL - Ensure all changes work correctly**

#### Task 13: Clear Build Cache and Rebuild

```bash
# Step 1: Clear Next.js cache
rm -rf .next

# Step 2: Run production build
pnpm build:local

# Step 3: Verify no TypeScript errors
# Expected: Build completes successfully
# If errors: Review error messages, fix any accidental syntax issues

# Step 4: Check build output
# Should see: "Compiled successfully" message
```

**CRITICAL:** Use `pnpm build:local` NOT `pnpm build` (sets NO_HTTPS flag)

---

#### Task 14: Visual Verification of UI Changes

```bash
# Step 1: Start the application
pnpm start

# Step 2: Open browser to http://localhost:3000
# CRITICAL: MUST use port 3000 (auth constraint)

# Step 3: Visual Checks:
# [ ] Browser tab shows "samba-ai"
# [ ] Sign-in page (/sign-in) left panel displays "Samba AI"
# [ ] Sign-up page (/sign-up) left panel displays "Samba AI"
# [ ] After login: sidebar header shows "Samba AI" with logo
# [ ] Logo is properly aligned and visible
# [ ] Navigate to /workflow - check greeting text shows "Samba AI"
# [ ] Open browser console (F12) - verify ASCII art shows "Samba AI"

# Step 4: Test responsiveness
# [ ] Check mobile view (sidebar collapse/expand)
# [ ] Verify no text overflow or alignment issues
```

**Screenshot Checklist:**
1. Main app sidebar (logged in)
2. Sign-in page left panel
3. Browser tab title
4. Workflow greeting page
5. Browser console ASCII art

---

#### Task 15: Run Type Checking and Linting

```bash
# Step 1: Type checking
pnpm check-types
# Expected: No errors
# If errors: Review for accidental syntax issues in edited files

# Step 2: Linting
pnpm lint
# Expected: No errors
# Auto-fix if needed: pnpm lint:fix

# Step 3: Format check (optional)
pnpm format
# Expected: All files properly formatted
```

**CRITICAL:** These should pass since changes are text-only, but catches any accidental issues

---

#### Task 16: Run E2E Tests for Authentication Flows

```bash
# Step 1: Ensure app is running on localhost:3000
# In terminal 1:
pnpm start

# Step 2: Run unauthenticated tests (covers sign-in/sign-up)
# In terminal 2:
pnpm test:e2e -- tests/core/unauthenticated.spec.ts

# Expected: All tests pass
# Tests verify: Sign-in page, sign-up page, unauthorized access

# Step 3: Run agent tests (optional - covers authenticated flows)
pnpm test:e2e -- tests/agents/agents.spec.ts

# If failures:
# 1. Check error messages for text matching issues
# 2. Verify UI elements still have correct selectors
# 3. Ensure auth flows still work properly
```

**Note:** E2E tests may need updating if they assert on specific text like "Samba Orion"

---

#### Task 17: Search for Remaining Orion References

```bash
# Step 1: Search for "Samba Orion"
grep -r "Samba Orion" \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=.next \
  --exclude-dir=test-results

# Expected: Only git history files (if any)

# Step 2: Search for "samba-orion"
grep -r "samba-orion" \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=.next \
  --exclude-dir=test-results

# Expected: Minimal results
# Acceptable: Git logs, old PRPs (historical documents)
# NOT acceptable: Active code files, current docs

# Step 3: Review results
# For each result:
# - Is it historical (git log, old PRP)? → OK to leave
# - Is it active code/docs? → Update it
# - Is it a comment referencing old name? → Update or add note

# Step 4: Case-insensitive search (optional)
grep -ri "orion" \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=.next \
  --exclude-dir=test-results \
  | grep -i samba

# Review any unexpected results
```

**Action Items:** Create a list of any remaining references that need addressing

---

#### Task 18: Final Validation and Documentation

```bash
# Final Validation Checklist:
# [ ] All Tier 1 UI changes verified visually
# [ ] All Tier 2 content changes confirmed
# [ ] All Tier 3 configuration changes in place
# [ ] All Tier 4 documentation changes complete
# [ ] Build successful (pnpm build:local)
# [ ] Type checking passes (pnpm check-types)
# [ ] Linting passes (pnpm lint)
# [ ] E2E tests pass (pnpm test:e2e -- tests/core/unauthenticated.spec.ts)
# [ ] No remaining "Orion" references in active code
# [ ] Visual verification complete with screenshots
# [ ] Full user flow tested (sign up → login → workflows)

# Summary for PR:
# - Files changed: 14
# - Lines changed: ~30
# - Components affected: UI (3), Translations (5), Config (3), Docs (7)
# - Testing: Visual verification, type check, lint, E2E tests
# - Risk: Minimal (text-only changes)
```

**Create Summary Document:**
1. List all changed files with line numbers
2. Attach screenshots of UI changes
3. Note any issues encountered and resolutions
4. Confirm all success criteria met

**Mark Complete in Archon:**
- Update all tasks to "completed" status
- Add final notes to project
- Close project if all requirements met

---

## Validation Loop

### Level 1: Syntax & Build Validation

```bash
# Run FIRST - fix any errors before proceeding

# 1. Type checking
pnpm check-types
# Expected: No errors
# If errors: Check for syntax issues in JSON files or TypeScript files

# 2. Linting
pnpm lint
# Expected: No errors
# If errors: Run `pnpm lint:fix` to auto-fix

# 3. Build validation
rm -rf .next && pnpm build:local
# Expected: "Compiled successfully"
# If errors: Review build logs, fix any import or syntax issues
```

---

### Level 2: Visual & Functional Validation

```bash
# Start the application
pnpm start

# Manual checks (http://localhost:3000):
# 1. Browser tab title shows "samba-ai" ✓
# 2. /sign-in page shows "Samba AI" in left panel ✓
# 3. /sign-up page shows "Samba AI" in left panel ✓
# 4. After login, sidebar shows "Samba AI" with logo ✓
# 5. /workflow page shows updated "Samba AI" text ✓
# 6. Console (F12) shows "Samba AI" ASCII art ✓

# If failures: Review specific file, ensure text was replaced correctly
```

---

### Level 3: Automated Testing

```bash
# E2E tests for authentication flows
pnpm test:e2e -- tests/core/unauthenticated.spec.ts

# Expected: All tests pass
# If failures:
# - Check test assertions for hardcoded "Samba Orion" text
# - Verify UI selectors still work
# - Ensure auth flow still functions properly

# Unit tests (if applicable)
pnpm test

# Expected: All tests pass
# If failures: Check for any tests asserting on "Samba Orion" strings
```

---

### Level 4: Completeness Check

```bash
# Search for remaining references
grep -r "Samba Orion" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next
grep -r "samba-orion" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next

# Expected: Minimal/no results (git history OK)
# Action: Update any active files found
```

---

## Final Validation Checklist

- [ ] **Build:** `pnpm build:local` completes successfully
- [ ] **Types:** `pnpm check-types` passes with no errors
- [ ] **Linting:** `pnpm lint` passes with no errors
- [ ] **E2E Tests:** Authentication flow tests pass
- [ ] **Visual:** All UI components display "Samba AI" correctly
- [ ] **Browser:** Tab title shows "samba-ai"
- [ ] **Sidebar:** Main navigation displays "Samba AI" with proper logo alignment
- [ ] **Auth Pages:** Sign-in and sign-up show "Samba AI" in left panel
- [ ] **Workflows:** Workflow page displays updated translations
- [ ] **Console:** Browser console shows "Samba AI" ASCII art
- [ ] **Docs:** README and all documentation updated
- [ ] **Search:** No remaining "Orion" references in active code
- [ ] **Screenshots:** Captured for all major UI changes
- [ ] **Archon:** All 18 tasks marked complete in Archon project

---

## Anti-Patterns to Avoid

- ❌ **Don't modify logo files** - Logo is just the Samba heart, text is separate
- ❌ **Don't change git history files** - Leave .git/ directory untouched
- ❌ **Don't update other language files** - Only en.json unless specifically requested
- ❌ **Don't use regex for replacement** - Use exact string matching for safety
- ❌ **Don't skip visual verification** - Text changes MUST be visually confirmed
- ❌ **Don't forget JSON syntax** - One syntax error breaks entire messages/en.json
- ❌ **Don't use wrong port** - MUST use localhost:3000 for auth to work
- ❌ **Don't skip build cache clear** - Always rm -rf .next before testing
- ❌ **Don't batch all changes** - Do tier by tier for easier debugging
- ❌ **Don't forget case sensitivity** - "Samba Orion" ≠ "samba-orion" ≠ "SAMBA ORION"

---

## Integration Points

### NO Integration Changes Required

This rebrand is **entirely text-based** with zero integration impacts:

- ✅ **Database:** No schema changes, no migrations needed
- ✅ **API Endpoints:** No endpoint changes, no URL modifications
- ✅ **Authentication:** No auth flow changes, no Better-Auth config updates
- ✅ **Observability:** Langfuse continues working, no instrumentation changes
- ✅ **MCP Protocol:** No tool changes, APP_NAME constant updated only
- ✅ **Canvas System:** No chart tool modifications
- ✅ **Vercel AI SDK:** No model or provider changes
- ✅ **Environment Variables:** No .env changes required

**The ONLY changes are display text and metadata**

---

## Risk Assessment

### Minimal Risk Factors

**Complexity:** LOW - Text-only replacements
**Functional Impact:** NONE - Zero code logic changes
**Database Impact:** NONE - No schema or data changes
**API Impact:** NONE - No endpoint modifications

### Potential Issues (All Minor)

1. **JSON Syntax Error in messages/en.json**
   - **Risk:** Low
   - **Impact:** Breaks translations
   - **Mitigation:** Validate JSON after editing
   - **Fix:** Use JSON validator, restore from backup

2. **Browser Cache Shows Old Title**
   - **Risk:** Low
   - **Impact:** User sees old "samba-orion" temporarily
   - **Mitigation:** Hard refresh (Cmd/Ctrl + Shift + R)
   - **Fix:** Clear browser cache

3. **E2E Tests Fail Due to Text Assertions**
   - **Risk:** Low
   - **Impact:** Tests need updating
   - **Mitigation:** Review test files for "Samba Orion" assertions
   - **Fix:** Update test expectations

4. **Missed Reference in Obscure File**
   - **Risk:** Low
   - **Impact:** Inconsistent branding in one location
   - **Mitigation:** Thorough grep search in Task 17
   - **Fix:** Add to list and update

### Rollback Strategy

**Complexity:** TRIVIAL - Simple git revert

```bash
# If issues found after deployment:
git revert <commit-hash>
rm -rf .next
pnpm build:local
pnpm start

# Recovery time: 5 minutes
# No data loss risk
# No migration rollback needed
```

---

## Success Metrics

### Immediate (Post-Implementation)
- All 14 files updated successfully
- Build completes without errors
- All tests pass
- Visual verification confirms correct display

### Short-Term (First Week)
- No user confusion reported
- No bug reports related to branding
- SEO metrics stable with new "samba-ai" metadata

### Long-Term (First Month)
- Brand recognition improves
- Documentation consistently uses "Samba AI"
- External references updated (if applicable)

---

## Project Context

### Archon Project Details

**Project ID:** `a94b62b4-a1ea-4f11-8170-dd85e3748bc8`
**Total Tasks:** 18 (12 implementation + 6 validation)
**Task Ordering:** Tier 1 (Critical) → Tier 2 (High) → Tier 3 (Medium) → Tier 4 (Low) → Testing

**Task Breakdown:**
- **Tier 1 (Critical UI):** 3 tasks - Metadata, Auth Layout, Sidebar
- **Tier 2 (User Content):** 2 tasks - Translations, README
- **Tier 3 (Configuration):** 3 tasks - Constants, Package, Console
- **Tier 4 (Documentation):** 4 tasks - CLAUDE.md, Prompts, Arch Docs, Tips
- **Testing & Validation:** 6 tasks - Build, Visual, Types, E2E, Search, Final

All tasks tracked in Archon with proper descriptions and priority ordering.

---

## Confidence Score

**9/10** - One-Pass Implementation Success Likelihood

### Reasoning for High Confidence:

**Strengths (+):**
- Text-only changes (no logic modifications)
- Clear file locations with exact line numbers
- Comprehensive validation strategy
- Zero integration complexity
- Straightforward testing approach
- All 18 tasks pre-defined in Archon
- Complete initial analysis document available

**Minor Risks (-):**
- JSON syntax error possible in messages/en.json (easily caught)
- Visual verification requires manual checking (time-consuming but simple)

### Why Not 10/10?
Manual visual verification adds small risk of missing a UI element, but overall risk remains minimal with the comprehensive grep search and testing strategy provided.

---

## Additional Notes

### Future Considerations

1. **Other Language Files:** If multilingual support becomes critical, update:
   - `messages/es.json` (Spanish)
   - `messages/fr.json` (French)
   - `messages/ja.json` (Japanese)
   - `messages/ko.json` (Korean)
   - `messages/zh.json` (Chinese)

2. **External Systems:** If "samba-orion" is hardcoded in external systems:
   - Vercel project settings
   - OAuth redirect URIs
   - Langfuse project name
   - GitHub repository name (requires repo rename)

3. **Deployment URLs:** Consider updating:
   - Production domain (if branded)
   - Staging environments
   - Documentation links

### Related PRPs

- Initial Analysis: `PRPs/cc-prp-initials/initial-rebrand-samba-ai.md`
- This PRP: `PRPs/cc-prp-plans/prp-rebrand-samba-ai.md`

### Completion Criteria

This PRP is complete when:
1. All 18 Archon tasks marked "completed"
2. All validation checklists passed
3. Visual verification screenshots captured
4. PR created with summary of changes
5. Archon project marked complete

---

## Quick Reference

### Essential Commands

```bash
# Development
pnpm dev                  # Start dev server (localhost:3000)
pnpm build:local         # Production build with NO_HTTPS flag
pnpm start               # Start production server

# Validation
pnpm check-types         # TypeScript validation
pnpm lint                # Biome linting
pnpm lint:fix            # Auto-fix lint issues
pnpm test                # Unit tests
pnpm test:e2e           # E2E tests (all)
pnpm test:e2e -- tests/core/unauthenticated.spec.ts  # Auth tests only

# Cache management
rm -rf .next             # Clear build cache
```

### File Change Summary

| File | Lines | Priority | Impact |
|------|-------|----------|--------|
| src/app/layout.tsx | 2 | Tier 1 | Metadata & SEO |
| src/app/(auth)/layout.tsx | 1 | Tier 1 | Auth pages |
| src/components/layouts/app-sidebar.tsx | 2 | Tier 1 | Sidebar header |
| messages/en.json | 5 | Tier 2 | Workflow UI |
| README.md | 7 | Tier 2 | Documentation |
| src/lib/const.ts | 1 | Tier 3 | APP_NAME |
| package.json | 1 | Tier 3 | Package name |
| src/app/(chat)/swr-config.tsx | 1 | Tier 3 | Console |
| CLAUDE.md | 1 | Tier 4 | Project docs |
| src/lib/ai/prompts.ts | 1 | Tier 4 | AI identity |
| docs/ARCHITECTURE-VERCEL-AI-SDK.md | 2 | Tier 4 | Tech docs |
| docs/tips-guides/*.md | 4 | Tier 4 | Guide docs |

**Total:** 14 files, ~28-30 lines changed

---

**PRP Version:** 1.0
**Created:** 2025-10-09
**Last Updated:** 2025-10-09
**Status:** Ready for Implementation

**AI Agent Note:** Follow tasks in priority order (Tier 1→2→3→4→Testing). Validate after each tier. Use exact string matching for replacements. Clear .next cache before final build. MUST use localhost:3000 for testing.
