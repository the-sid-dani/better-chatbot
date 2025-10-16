# Samba AI Branding System

## Overview

Samba AI uses a clean, typography-focused branding approach that prioritizes content and user experience over visual embellishments. The branding system was updated in October 2025 to remove logo images from the primary UI and adopt a minimalist, elegant aesthetic.

## Design Philosophy

### Core Principles

1. **Typography-First**: Brand identity communicated through elegant typography rather than logos
2. **Minimalist Aesthetic**: Clean, uncluttered interface with focus on functionality
3. **Content Priority**: Visual elements never distract from core content and user tasks
4. **Accessibility**: Clear, readable text with appropriate contrast and sizing

### Visual Identity

- **Brand Name**: "Samba AI" (title case, two words)
- **Logo Usage**: No logo images displayed in primary UI components (sidebar, auth pages)
- **Color Palette**: Defined by theme system (light/dark modes with multiple style presets)
- **Spacing**: Generous whitespace for breathable, modern design

## Typography System

### Font Families

The application uses three Google Fonts, each serving specific purposes:

#### 1. Geist (Sans-Serif)
- **Purpose**: Primary content font for body text, headings, UI elements
- **Variable**: `--font-geist-sans`
- **Usage**: Default font for most interface elements
- **Example**:
  ```tsx
  <div className="font-sans">Content here</div>
  ```

#### 2. Geist Mono (Monospace)
- **Purpose**: Code blocks, technical content, terminal output
- **Variable**: `--font-geist-mono`
- **Usage**: Code snippets, JSON output, file paths
- **Example**:
  ```tsx
  <code className="font-mono">npm install</code>
  ```

#### 3. Montserrat (Branding)
- **Purpose**: Brand identity elements (sidebar, auth pages)
- **Variable**: `--font-montserrat`
- **Weights Available**: 300 (light), 400 (regular), 500 (medium), 600 (semi-bold)
- **Usage**: Limited to branding touchpoints for consistency
- **Example**:
  ```tsx
  <h1 style={{ fontFamily: "var(--font-montserrat)", fontWeight: 300 }}>
    Samba AI
  </h1>
  ```

### Font Configuration

Fonts are configured in `src/app/layout.tsx`:

```typescript
import { Geist, Geist_Mono, Montserrat } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

// Applied to body tag
<body className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} antialiased`}>
```

## Branding Implementation

### Authentication Pages

**File**: `src/app/(auth)/layout.tsx`

```tsx
<h1
  className="text-3xl font-light tracking-wide animate-in fade-in duration-1000"
  style={{ fontFamily: "var(--font-montserrat)", fontWeight: 300 }}
>
  Samba AI
</h1>
```

**Key Characteristics**:
- **Font Weight**: 300 (light) - Creates elegant, refined appearance
- **Text Size**: `text-3xl` (30px) - Prominent but not overwhelming
- **Tracking**: `tracking-wide` - Adds sophistication
- **Animation**: Fade-in effect on page load
- **No Logo**: Pure text branding

### Sidebar Navigation

**File**: `src/components/layouts/app-sidebar.tsx`

```tsx
<h4
  className="text-xl font-light tracking-wide"
  style={{
    fontFamily: "var(--font-montserrat)",
    fontWeight: 400,
  }}
>
  Samba AI
</h4>
```

**Key Characteristics**:
- **Font Weight**: 400 (regular) - Slightly bolder than auth pages
- **Text Size**: `text-xl` (20px) - Compact for navigation
- **Tracking**: `tracking-wide` - Maintains elegance
- **Visibility**: Present on every authenticated page
- **No Logo**: Text-only approach

### User Dropdown Menu

**File**: `src/components/layouts/app-sidebar-user.tsx`

**Menu Items** (Streamlined for focus):
1. Chat Preferences (Settings2 icon)
2. Admin Dashboard (Crown icon)
3. Theme Selection (Palette icon)
4. Language Selection (Languages icon)
5. Keyboard Shortcuts (Command icon)
6. Sign Out (LogOut icon)

**Removed Items**:
- Report an Issue (GitHub link)
- Join Community (Discord link)

**Rationale**: Reduces visual clutter and focuses on core functionality

## Brand Application Guidelines

### When to Use Montserrat

**✅ DO Use Montserrat For**:
- Main "Samba AI" branding text (sidebar, auth pages)
- Hero headings on landing or marketing pages
- Brand-related announcements or modals
- Special feature launches or highlights

**❌ DON'T Use Montserrat For**:
- Body text or paragraphs
- Form labels or input fields
- Table content or data displays
- Chat messages or AI responses
- Documentation or help text
- Button text (unless brand-specific CTA)

### Font Weight Selection

| Weight | Use Case | Example |
|--------|----------|---------|
| 300 (Light) | Primary brand statement, hero text | Auth page "Samba AI" |
| 400 (Regular) | Navigation brand, secondary headers | Sidebar "Samba AI" |
| 500 (Medium) | Emphasized brand elements | Feature announcements |
| 600 (Semi-bold) | Call-to-action brand elements | "Try Samba AI" buttons |

### Typography Hierarchy

```
Brand Identity (Montserrat)
  └── Primary: 300 weight, 30px (auth pages)
  └── Navigation: 400 weight, 20px (sidebar)

Content (Geist Sans)
  └── Headings: Bold, 24-16px
  └── Body: Regular, 16-14px
  └── Captions: Regular, 12px

Code (Geist Mono)
  └── Inline code: Regular, 14px
  └── Code blocks: Regular, 13px
```

## Color System

### Brand Colors

The application uses a theme-based color system defined in Tailwind CSS configuration. Colors adapt to:
- **Light/Dark Mode**: Automatic theme switching
- **Style Presets**: Multiple color schemes (default, violet, blue, green, orange, red, rose, yellow)

### Color Usage

- **Text**: Uses semantic tokens (`text-foreground`, `text-muted-foreground`)
- **Backgrounds**: Theme-aware (`bg-background`, `bg-muted`)
- **Accents**: Dynamic based on theme preset (`bg-accent`, `text-accent-foreground`)

### Branding Color Strategy

**No Fixed Brand Color**: The "Samba AI" text inherits theme colors, allowing users to personalize their experience while maintaining brand consistency through typography.

## Spacing & Layout

### Branding Elements

```tsx
// Auth Layout
<div className="flex-col p-18 relative">
  <h1 className="text-3xl font-light tracking-wide">Samba AI</h1>
  <div className="flex-1" /> {/* Spacer */}
  <FlipWords words={[t("description")]} className="mb-4 text-muted-foreground" />
</div>

// Sidebar
<SidebarMenuItem className="flex items-center gap-0.5">
  <SidebarMenuButton asChild className="hover:bg-transparent">
    <h4 className="text-xl font-light tracking-wide">Samba AI</h4>
  </SidebarMenuButton>
</SidebarMenuItem>
```

### Spacing Guidelines

- **Auth Pages**: Generous padding (p-18) for spacious, premium feel
- **Sidebar**: Compact spacing (gap-0.5) for efficient navigation
- **Tracking**: `tracking-wide` adds horizontal spacing for elegance

## Accessibility Considerations

### Font Choices

1. **Readability**: All three fonts tested for legibility across sizes
2. **Contrast**: Theme system ensures WCAG AA compliance
3. **Font Weights**: Light weights (300) used only for large text (30px+)
4. **Antialiasing**: Applied via `antialiased` class for smooth rendering

### Brand Text Accessibility

```tsx
// Good: Large text with light weight
<h1 className="text-3xl font-light" style={{ fontWeight: 300 }}>
  Samba AI
</h1>

// Avoid: Small text with very light weight
// <span className="text-sm font-light" style={{ fontWeight: 300 }}>
//   Samba AI
// </span>
```

### Contrast Ratios

- **Light Mode**: Dark text on light background (high contrast)
- **Dark Mode**: Light text on dark background (high contrast)
- **Montserrat Light (300)**: Only used at 30px+ for adequate readability

## Implementation Examples

### Creating a Branded Component

```tsx
// Brand-aware heading component
export function BrandHeading({ level = "h1", children }: BrandHeadingProps) {
  const sizes = {
    h1: "text-3xl",
    h2: "text-2xl",
    h3: "text-xl",
  };

  const weights = {
    h1: 300,
    h2: 400,
    h3: 400,
  };

  const Component = level;

  return (
    <Component
      className={`${sizes[level]} font-light tracking-wide`}
      style={{
        fontFamily: "var(--font-montserrat)",
        fontWeight: weights[level],
      }}
    >
      {children}
    </Component>
  );
}

// Usage
<BrandHeading level="h1">Samba AI</BrandHeading>
```

### Applying Brand Font in Inline Styles

```tsx
// Method 1: CSS Variable (Recommended)
<h1 style={{ fontFamily: "var(--font-montserrat)" }}>
  Samba AI
</h1>

// Method 2: Inline with weight
<h1
  className="text-3xl tracking-wide"
  style={{ fontFamily: "var(--font-montserrat)", fontWeight: 300 }}
>
  Samba AI
</h1>
```

### Responsive Branding

```tsx
// Responsive font sizes
<h1
  className="text-2xl md:text-3xl lg:text-4xl font-light tracking-wide"
  style={{ fontFamily: "var(--font-montserrat)", fontWeight: 300 }}
>
  Samba AI
</h1>

// Hide/show branding on mobile
<h1 className="hidden md:block" style={{ fontFamily: "var(--font-montserrat)" }}>
  Samba AI
</h1>
```

## Migration Notes

### From Logo-Based to Typography-Based

**Previous Approach** (Deprecated):
```tsx
<Image
  src="/samba-resources/logos/samba-logo.png"
  alt="Samba AI Logo"
  width={24}
  height={24}
/>
<h4 className="font-bold">Samba AI</h4>
```

**Current Approach**:
```tsx
<h4
  className="text-xl font-light tracking-wide"
  style={{ fontFamily: "var(--font-montserrat)", fontWeight: 400 }}
>
  Samba AI
</h4>
```

### Benefits of Typography-First Approach

1. **Performance**: No image loading, faster page loads
2. **Scalability**: Text scales perfectly at any resolution
3. **Accessibility**: Screen readers handle text better than images
4. **Theming**: Text adapts to theme colors automatically
5. **Simplicity**: Fewer assets to manage and maintain
6. **Elegance**: Modern, minimalist aesthetic

## Logo Asset Management

### Available Logo Files

Located in `/public/samba-resources/logos/`:
- `Samba_AI_01.svg` - Primary logo variant (not used in UI)
- `Samba_AI_01.png` - PNG version (not used in UI)
- `Samba_AI_02.svg` - Alternative logo variant (not used in UI)
- `Samba_AI_02.png` - PNG version (not used in UI)

### Logo Usage Policy

**Current Status**: Logo files are available but **not displayed** in the primary application UI.

**Potential Use Cases**:
- External marketing materials
- Email signatures
- Social media profiles
- Documentation covers
- Print materials
- Presentation decks
- Investor materials

**Not Used In**:
- Application sidebar
- Authentication pages
- Navigation headers
- User interface components

## File Reference

### Primary Files Modified for Branding

| File | Purpose | Key Changes |
|------|---------|-------------|
| `src/app/layout.tsx` | Root layout | Added Montserrat font (300-600) |
| `src/app/(auth)/layout.tsx` | Auth pages | Text-only branding, Montserrat 300 |
| `src/components/layouts/app-sidebar.tsx` | Main navigation | Text-only branding, Montserrat 400 |
| `src/components/layouts/app-sidebar-user.tsx` | User menu | Removed community links |

### Documentation Updates

| File | Section Updated |
|------|----------------|
| `/CLAUDE.md` | Tech stack, key components, key files |
| `/README.md` | Tech stack, design philosophy |
| `/src/app/CLAUDE.md` | Structure, notes on branding |
| `/src/components/CLAUDE.md` | Development patterns, typography guidelines |
| `/docs/BRANDING-SYSTEM.md` | Complete branding documentation (this file) |

## Best Practices

### DO ✅

- Use Montserrat for brand identity elements
- Apply light weights (300-400) for elegant feel
- Use `tracking-wide` for sophisticated spacing
- Keep branding text prominent but not overwhelming
- Maintain consistency across all brand touchpoints
- Test readability in both light and dark modes

### DON'T ❌

- Use logo images in primary UI
- Apply Montserrat to body text or long-form content
- Use font weights lighter than 300
- Use light weights (300) on small text (<20px)
- Mix multiple brand fonts in the same view
- Override theme colors with hardcoded brand colors

## Future Considerations

### Potential Enhancements

1. **Brand Animation**: Subtle animations for "Samba AI" text on load
2. **Custom Font Loading**: Optimize font loading with `font-display: swap`
3. **Variable Font**: Explore Montserrat variable font for smoother weight transitions
4. **Brand Gradients**: Subtle text gradients for premium feel (theme-aware)

### Maintaining Brand Consistency

As the application grows:
- Audit new components for brand font usage
- Ensure new pages follow text-only branding approach
- Update this documentation when branding standards evolve
- Review accessibility regularly as font usage expands

## Questions & Support

For questions about the branding system:
1. Review this documentation
2. Check implementation examples in the codebase
3. Consult the design team for brand guidelines
4. Test changes in both light/dark themes

---

**Last Updated**: October 2025
**Version**: 1.0
**Maintained By**: Samba AI Team
