# Initial Discovery: Rebrand "Samba Orion" to "Samba AI"

## 🎯 Objective
Change all instances of "Samba Orion" branding to "Samba AI" throughout the application, including:
- Visual UI components (home page, authentication pages)
- Text content and translations
- Documentation files
- Metadata and configuration

## 📊 Impact Assessment

### **Scope: MEDIUM**
- **Complexity:** Low - Primarily text replacements
- **Risk Level:** Low - No functional code changes, only branding
- **Files Affected:** ~15-20 files
- **Testing Required:** Visual verification of UI, E2E tests for auth pages

---

## 🔍 Complete Analysis of Changes Required

### **1. PRIMARY UI COMPONENTS** (User-Facing - CRITICAL)

#### **Main Sidebar Branding**
**File:** `src/components/layouts/app-sidebar.tsx`
- **Line 80:** `alt="Samba Orion Logo"` → `alt="Samba AI Logo"`
- **Line 86:** `<h4 className="font-bold">Samba Orion</h4>` → `<h4 className="font-bold">Samba AI</h4>`
- **Context:** This is the main sidebar header visible on ALL authenticated pages
- **User Impact:** HIGH - Visible on every page after login

#### **Authentication Layout (Sign-in/Sign-up Pages)**
**File:** `src/app/(auth)/layout.tsx`
- **Line 20:** `<span>Samba Orion</span>` → `<span>Samba AI</span>`
- **Context:** Left panel of authentication pages with logo
- **User Impact:** HIGH - First impression for new users

---

### **2. INTERNATIONALIZATION & TRANSLATIONS** (User-Facing)

#### **English Translation File**
**File:** `messages/en.json`

**Workflow Section:**
- **Line 122:** `"chatbotToolTitle": "Use as Samba Orion Tools"` → `"Use as Samba AI Tools"`
- **Line 123:** `"chatbotToolDescription": "...use them as tools in Samba Orion conversations..."` → `"...in Samba AI conversations..."`
- **Line 125:** `"parameterBasedDescription": "...when Samba Orion calls this workflow..."` → `"...when Samba AI calls this workflow..."`
- **Line 127:** `"exampleDescription": "...execute it in Samba Orion conversations..."` → `"...in Samba AI conversations..."`
- **Line 130:** `"ctaMessage": "...expand your Samba Orion's capabilities!"` → `"...expand your Samba AI's capabilities!"`
- **User Impact:** MEDIUM - Affects workflow page descriptions

**Auth Section:**
- **Line 181:** `"description": "Welcome to the future of agentic advertising, powered by samba"` (no change needed - generic)

---

### **3. SYSTEM PROMPTS & AI CONFIGURATION** (AI Behavior)

#### **AI System Prompts**
**File:** `src/lib/ai/prompts.ts`
- **Line 98:** `As Samba Orion, you can assist with:` → `As Samba AI, you can assist with:`
- **Context:** AI assistant identity in system prompts
- **User Impact:** LOW - Internal AI behavior, not directly visible

#### **Console Branding**
**File:** `src/app/(chat)/swr-config.tsx`
- **Line 12:** Console log ASCII art + message referencing "Samba Orion"
  ```javascript
  // Current
  "🧡 Samba Orion - The Future of Agentic Advertising\nhttps://github.com/samba-tv/samba-orion"

  // Change to
  "🧡 Samba AI - The Future of Agentic Advertising\nhttps://github.com/samba-tv/samba-ai"
  ```
- **User Impact:** LOW - Developer console only

---

### **4. DOCUMENTATION FILES** (Reference Material)

#### **Main README**
**File:** `README.md`
- **Line 3:** `# Samba Orion` → `# Samba AI`
- **Line 13:** `**Samba Orion** is a comprehensive AI platform...` → `**Samba AI** is a comprehensive AI platform...`
- **Line 109:** `Get a feel for...what makes Samba Orion unique.` → `...what makes Samba AI unique.`
- **Line 334:** `# includes PostgreSQL, Redis, and Samba Orion` → `...and Samba AI`
- **Line 429:** `Comprehensive guides for deploying...Samba Orion...` → `...Samba AI...`
- **Line 484:** `...make Samba Orion even better.` → `...make Samba AI even better.`
- **Line 523:** `**Samba Orion** - Empowering individuals...` → `**Samba AI** - Empowering individuals...`
- **User Impact:** MEDIUM - External documentation

#### **Project Documentation**
**File:** `CLAUDE.md`
- **Line 3:** `**Samba-Orion** is an AI chatbot platform...` → `**Samba-AI** is an AI chatbot platform...`
- **User Impact:** LOW - Internal documentation

#### **Architecture Documentation**
**File:** `docs/ARCHITECTURE-VERCEL-AI-SDK.md`
- **Line 1:** `# 🏗️ **Samba Orion: Vercel AI SDK-Centric Architecture**` → `# 🏗️ **Samba AI: Vercel AI SDK-Centric Architecture**`
- **Line 5:** `Samba Orion is built **entirely on Vercel AI SDK**...` → `Samba AI is built...`

#### **Other Documentation Files**
**File:** `docs/tips-guides/e2e-testing-guide.md`
- **Line 3:** `...for Samba Orion using Playwright.` → `...for Samba AI using Playwright.`

**File:** `docs/tips-guides/oauth.md`
- **Line 110:** `...sign in to Samba Orion using your...` → `...sign in to Samba AI...`

**File:** `docs/tips-guides/system-prompts-and-customization.md`
- **Line 3:** `...Samba Orion uses a sophisticated...` → `...Samba AI uses a sophisticated...`
- **Line 83:** `1. **Base System Prompt** - Core Samba Orion behavior` → `...Core Samba AI behavior`

---

### **5. METADATA & CONFIGURATION** (SEO & Build)

#### **Application Metadata**
**File:** `src/app/layout.tsx`
- **Line 22:** `title: "samba-orion"` → `title: "samba-ai"`
- **Line 24:** `"Samba-Orion is an AI chatbot platform..."` → `"Samba-AI is an AI chatbot platform..."`
- **Context:** Browser tab title and meta description
- **User Impact:** HIGH - SEO and browser display

#### **Package Configuration**
**File:** `package.json`
- **Line 2:** `"name": "samba-orion"` → `"name": "samba-ai"`
- **Context:** NPM package name
- **User Impact:** LOW - Internal build configuration

#### **Constants File**
**File:** `src/lib/const.ts`
- **Line 59:** `export const APP_NAME = "samba-orion";` → `export const APP_NAME = "samba-ai";`
- **Context:** Used for MCP client identification
- **User Impact:** LOW - Internal constant

---

### **6. GIT HISTORY & LOGS** (Historical - NO ACTION NEEDED)

The following files contain "Samba Orion" in git commit history but should **NOT** be modified:
- `.git/logs/refs/heads/main` (Line 29, 91)
- `.git/logs/HEAD` (Line 91)
- `.git/FETCH_HEAD`

**Reason:** These are historical records and should remain unchanged.

---

## 🎨 Logo Considerations

**Current Logo Location:** `/public/samba-resources/logos/`
- `samba-logo-2024.png` (currently used in sidebar)
- `samba_logo_heart_White-2018.png`

**Analysis:**
- The logo file itself (`samba-logo-2024.png`) is just the Samba heart logo
- No text in the logo that says "Orion"
- The text "Samba Orion" appears **next to** the logo in code (line 86 of app-sidebar.tsx)
- **NO LOGO FILE CHANGES NEEDED** - only text changes

---

## 📋 Additional Files to Verify

**PRP Documents (Reference Only - Update if desired):**
- Multiple files in `PRPs/cc-prp-plans/` and `PRPs/cc-prp-initials/`
- These contain "samba-orion" references but are historical planning documents
- **Decision Required:** Update these for consistency or leave as historical records?

**Untracked Documentation:**
- Various files in `docs/langfuse-*.md` contain "samba-orion" URLs
- These appear to be configuration/setup examples
- **Recommendation:** Update for consistency

---

## 🎯 Prioritized Change List

### **TIER 1: CRITICAL (User-Visible UI)**
1. ✅ `src/components/layouts/app-sidebar.tsx` (Lines 80, 86)
2. ✅ `src/app/(auth)/layout.tsx` (Line 20)
3. ✅ `src/app/layout.tsx` (Lines 22, 24)

### **TIER 2: HIGH (User-Facing Content)**
4. ✅ `messages/en.json` (Lines 122, 123, 125, 127, 130)
5. ✅ `README.md` (Lines 3, 13, 109, 334, 429, 484, 523)

### **TIER 3: MEDIUM (Configuration & Constants)**
6. ✅ `src/lib/const.ts` (Line 59)
7. ✅ `package.json` (Line 2)
8. ✅ `src/app/(chat)/swr-config.tsx` (Line 12)

### **TIER 4: LOW (Documentation & AI Config)**
9. ✅ `CLAUDE.md` (Line 3)
10. ✅ `src/lib/ai/prompts.ts` (Line 98)
11. ✅ `docs/ARCHITECTURE-VERCEL-AI-SDK.md` (Lines 1, 5)
12. ✅ `docs/tips-guides/e2e-testing-guide.md` (Line 3)
13. ✅ `docs/tips-guides/oauth.md` (Line 110)
14. ✅ `docs/tips-guides/system-prompts-and-customization.md` (Lines 3, 83)

---

## 🧪 Testing Strategy

### **Visual Verification Required:**
1. **Home Page / Main Chat:**
   - Check sidebar header displays "Samba AI"
   - Verify logo is still visible and properly aligned

2. **Authentication Pages:**
   - Sign-in page left panel shows "Samba AI"
   - Sign-up page left panel shows "Samba AI"

3. **Browser Tab:**
   - Page title shows "samba-ai" in browser tab

4. **Workflow Page:**
   - Check workflow greeting/info text displays updated branding

### **E2E Tests to Run:**
```bash
pnpm test:e2e -- tests/core/unauthenticated.spec.ts
pnpm test:e2e -- tests/agents/agents.spec.ts
```

### **Manual Verification:**
- Console log displays "Samba AI" ASCII art (open browser console)
- Search codebase for any remaining "Orion" references:
  ```bash
  grep -r "Samba Orion" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next
  grep -r "samba-orion" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next
  ```

---

## 🚨 Risk Assessment

### **Minimal Risks:**
- **No functional code changes** - only text/branding
- **No database schema changes**
- **No API endpoint changes**
- **No authentication flow changes**

### **Potential Issues:**
1. **Cache/Build Artifacts:** May need to clear `.next` cache
2. **Browser Cache:** Users may need hard refresh to see new metadata
3. **Internationalization:** Only English translations provided - other language files unchanged
4. **External References:** If "samba-orion" is hardcoded in external systems (unlikely)

### **Rollback Strategy:**
- Simple git revert - all changes are text-based
- No migrations or data transformations involved

---

## 📝 Implementation Notes

### **Case Sensitivity:**
- "Samba Orion" → "Samba AI" (title case, UI display)
- "samba-orion" → "samba-ai" (kebab-case, configs/URLs)
- "SAMBA ORION" → "SAMBA AI" (if found in ASCII art)

### **Recommended Approach:**
1. Create feature branch: `git checkout -b feat/rebrand-samba-ai`
2. Use find-and-replace with **exact case matching**
3. Verify each change manually (avoid over-replacement)
4. Run build: `pnpm build:local`
5. Test locally on `localhost:3000`
6. Run E2E tests
7. Create PR with screenshots of UI changes

### **Build Verification:**
```bash
# Clear cache
rm -rf .next

# Rebuild
pnpm build:local

# Start and verify
pnpm start
```

---

## ✅ Success Criteria

- [ ] All Tier 1 UI changes completed and verified visually
- [ ] All Tier 2 content changes completed
- [ ] All Tier 3 configuration changes completed
- [ ] All Tier 4 documentation changes completed
- [ ] No remaining "Samba Orion" references in active code
- [ ] Build completes successfully
- [ ] E2E tests pass
- [ ] Visual verification of auth pages and main app completed
- [ ] Browser tab title displays "samba-ai"
- [ ] Sidebar displays "Samba AI" with logo

---

## 📚 Additional Considerations

### **Future Branding:**
- Consider updating GitHub repository name (if applicable)
- Update any deployment URLs (Vercel project settings)
- Update OAuth redirect URIs if domain changes
- Update Langfuse project name if using branded naming

### **Internationalization:**
If multilingual support is important, update these files:
- `messages/es.json` (Spanish)
- `messages/fr.json` (French)
- `messages/ja.json` (Japanese)
- `messages/ko.json` (Korean)
- `messages/zh.json` (Chinese)

**Current Status:** These files exist but weren't analyzed for "Samba Orion" references.

---

## 🎉 Summary

**Total Files to Modify:** 14 files
**Total Lines to Change:** ~25-30 lines
**Estimated Time:** 30-45 minutes
**Complexity:** LOW
**Risk:** MINIMAL

This is a straightforward branding change with no functional impact. The changes are isolated to display text, documentation, and configuration values. No database migrations, API changes, or complex refactoring required.

**Ready for PRP Generation** ✅
