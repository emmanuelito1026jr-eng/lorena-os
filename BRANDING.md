# Casas En El Paso TX — Visual Identity System

**Brand Owner:** Lorena Ontiveros-Ortega
**Business Name:** Casas En El Paso TX
**Brokerage:** Realty ONE Group / The Right Move Real Estate Group
**Market:** El Paso, Texas — Residential Real Estate
**Website (current CINC):** casasenelpasotx.com
**New System:** Lorena Realtor Operating System (by Manorev)

---

## Brand Positioning

**Tagline (EN):** "Your Trusted El Paso Real Estate Expert"
**Tagline (ES):** "Su Experta de Confianza en Bienes Raíces en El Paso"
**Brand Promise:** Personal, trustworthy guidance through the biggest financial decision of your life — with the power of AI working behind the scenes to serve you better.

**Brand Personality:**
- Warm and approachable (not cold or corporate)
- Expert and confident (not arrogant)
- Bilingual and culturally fluent (not tokenizing)
- Modern and tech-forward (not flashy or AI-looking)
- Personal and hands-on (not automated-feeling)

**The Feel:** A luxury boutique experience at a local family price. When clients see the dashboard, portal, or emails — they should think "this is a serious, professional operation" but still feel like they're working with someone who genuinely cares about them.

---

## Color System

### Primary Palette
```
Gold (Primary Accent)    #C9A84C    RGB(201, 168, 76)    — CTAs, highlights, borders, active states, logo accents
Black (Headlines/Nav)    #0A0A0A    RGB(10, 10, 10)      — Headlines, primary text, navigation backgrounds
Off-White (Backgrounds)  #FAFAF5    RGB(250, 250, 245)   — Page backgrounds, card backgrounds, content areas
```

### Text Colors
```
Dark Gray (Body Text)    #333333    RGB(51, 51, 51)      — All body copy, paragraphs, descriptions
Medium Gray (Secondary)  #888888    RGB(136, 136, 136)   — Labels, placeholders, secondary info, timestamps
```

### Surface Colors
```
Light Gray (Cards)       #F5F5F0    RGB(245, 245, 240)   — Card backgrounds, section dividers, alternating rows
Border Gray              #E5E5E0    RGB(229, 229, 224)   — All borders, separators, input outlines, dividers
```

### Score Temperature Colors
```
Hot (80-100)             #DC2626    RGB(220, 38, 38)     — Hot lead badges, urgent alerts
Warm (50-79)             #EA580C    RGB(234, 88, 12)     — Warm lead badges
Cool (20-49)             #2563EB    RGB(37, 99, 235)     — Cool lead badges
Cold (0-19)              #9CA3AF    RGB(156, 163, 175)   — Cold lead badges
```

### Status Colors
```
Success                  #16A34A    RGB(22, 163, 74)     — Confirmations, delivered, completed, positive changes
Error                    #DC2626    RGB(220, 38, 38)     — Errors, validation failures, critical warnings
Warning                  #F59E0B    RGB(245, 158, 11)    — Warnings, pending states, attention needed
Info                     #2563EB    RGB(37, 99, 235)     — Informational badges, links, secondary actions
```

### Dark Mode Overrides
```css
[data-theme="dark"] {
  --gold: #C9A84C;           /* Gold stays EXACTLY the same — it's stunning on dark */
  --black: #FAFAF5;          /* Text becomes light */
  --white: #0A0A0A;          /* Background becomes dark */
  --dark-gray: #E5E5E0;      /* Body text lightens */
  --medium-gray: #888888;    /* Secondary text stays */
  --light-gray: #1A1A1A;     /* Card backgrounds darken */
  --border: #333333;         /* Borders darken */
}
```

### Color Rules
- Gold (#C9A84C) is NEVER used for body text — only accents, CTAs, active states, borders
- Black (#0A0A0A) is used for headlines with Playfair Display ONLY
- Score colors are ONLY used for score-related UI elements — never for decorative purposes
- All colors must meet WCAG AA contrast ratio (4.5:1 for text, 3:1 for large text)
- Off-white (#FAFAF5) is preferred over pure white (#FFFFFF) for backgrounds

---

## Typography

### Headline Font: Playfair Display
```
Font Family: 'Playfair Display', serif
Google Fonts: https://fonts.google.com/specimen/Playfair+Display
Weights Used: 400 (Regular), 600 (SemiBold), 700 (Bold)
Usage: ALL h1, h2, h3, page titles, section headers, card titles, logo text, empty state titles
```

### Body Font: Lato
```
Font Family: 'Lato', sans-serif
Google Fonts: https://fonts.google.com/specimen/Lato
Weights Used: 300 (Light), 400 (Regular), 500 (Medium), 700 (Bold)
Usage: ALL body text, buttons, inputs, labels, navigation items, table content, paragraphs, secondary text
```

### Font Scale
```
Page titles:     text-2xl md:text-3xl   (24px → 30px)    Playfair Display Bold
Section headers: text-xl md:text-2xl    (20px → 24px)    Playfair Display SemiBold
Card titles:     text-lg               (18px)            Playfair Display SemiBold
Body text:       text-sm md:text-base   (14px → 16px)    Lato Regular
Labels:          text-xs md:text-sm     (12px → 14px)    Lato Regular, color #888888
Button text:     text-sm               (14px)            Lato Medium
```

### Typography Rules
- NEVER use Lato for headings
- NEVER use Playfair Display for body text, buttons, or inputs
- NEVER use decorative, script, or handwritten fonts anywhere
- Line height: 1.5 for body text, 1.2 for headlines
- Letter spacing: Normal (no manual adjustments)

---

## Logo & Brand Mark

### Logo Specifications
The logo for "Casas En El Paso TX" should be:
- **Primary Logo:** "Casas En El Paso" in Playfair Display Bold, with "TX" as a smaller accent
- **Icon Mark:** Simplified house icon or key icon with gold (#C9A84C) accent
- **Agent Photo:** Lorena's professional headshot included in email signatures, CMA headers, and portal footer

### Logo Placement
```
Dashboard Sidebar:   Logo at top of sidebar (desktop), 180px max width
Mobile Bottom Nav:   No logo (screen real estate too precious)
Email Templates:     Logo centered at top, 200px max width
CMA Reports:         Logo + agent photo top-right corner
Client Portal:       Logo in header, agent photo in about section
Landing Pages:       Logo in header, agent photo hero section
```

### Logo Asset Paths (create during Phase 1)
```
/public/brand/
├── logo-full.svg              ← Full logo (Casas En El Paso TX)
├── logo-full-dark.svg         ← For dark backgrounds
├── logo-icon.svg              ← Icon mark only
├── logo-icon-dark.svg         ← Icon mark for dark backgrounds
├── agent-photo.jpg            ← Lorena's professional headshot (400x400 min)
├── agent-photo-small.jpg      ← Thumbnail version (100x100)
├── favicon.ico                ← Browser tab icon
├── favicon-32.png             ← 32x32 favicon
├── apple-touch-icon.png       ← 180x180 iOS icon
├── og-image.jpg               ← 1200x630 Open Graph image
├── email-header.png           ← Email header with logo (600px wide)
└── cma-header.png             ← CMA report header with logo + photo
```

### Favicon
- Use gold (#C9A84C) house icon on black (#0A0A0A) background
- Generate sizes: 16x16, 32x32, 180x180 (apple-touch), 192x192 (Android)

---

## Photography & Imagery

### Style Guidelines
- **El Paso Specific:** Use imagery of El Paso neighborhoods, Franklin Mountains, desert landscapes, local homes
- **Warm and Aspirational:** Happy families, move-in moments, keys in hand, dream home arrivals
- **Diversity:** Reflect El Paso's demographics — predominantly Hispanic/Latino families
- **Quality:** Only high-resolution professional photography. No stock photos that look generic.
- **Warmth:** Golden hour lighting preferred. Warm tones. Welcoming feel.

### What NOT to Use
- Cold, corporate stock photos
- AI-generated images (they look artificial)
- Images that don't represent El Paso or the border region
- Luxury mansion imagery (Lorena's market is $150K-$500K)
- Any imagery that feels excluding or unwelcoming

### Placeholder Strategy (Phase 1)
Until real property photos come from MLS Spark API (Phase 6):
- Use El Paso neighborhood photos from Unsplash/Pexels
- Generate placeholder property photos with consistent styling
- Use Lorena's actual professional headshot everywhere an agent photo is needed

---

## Email Branding

### Email Template Structure
```
┌─────────────────────────────────────────────┐
│               [LOGO - centered]              │
│            ═══════════════════               │
│                                              │
│  [Content in Lato font, dark gray text]     │
│                                              │
│  [Gold CTA Button: #C9A84C bg, white text] │
│                                              │
│  ─────────────────────────────────          │
│  Lorena Ontiveros-Ortega                    │
│  Casas En El Paso TX                        │
│  📱 (915) 487-5581                          │
│  📧 lorena.realtor@icloud.com               │
│  🌐 casasenelpasotx.com                    │
│                                              │
│  [Unsubscribe link - required by CAN-SPAM] │
└─────────────────────────────────────────────┘
```

### Email Design Rules
- Max width: 600px
- Background: #FAFAF5
- Content area: white
- CTA buttons: gold (#C9A84C) with white text, rounded corners
- Footer: includes contact info, brokerage disclosure, unsubscribe
- All emails must have EN and ES versions

---

## Social Media Assets

### Profile Photo
- Lorena's professional headshot
- Square crop, minimum 400x400px
- Use across: dashboard about page, email signatures, CMA headers

### Open Graph Image (for link sharing)
- Size: 1200x630px
- Content: Logo + "El Paso Real Estate" + Agent Photo
- Background: Gold gradient or El Paso landscape
- Used when links to the portal or landing pages are shared on social media

---

## Brokerage Compliance

### Required Disclosures
Every client-facing page, email, and document MUST include:
- Lorena's full name: Lorena Ontiveros-Ortega
- Brokerage: Realty ONE Group (or current brokerage)
- TREC License number (verify with Lorena)
- Equal Housing Opportunity logo (where applicable)

### Fair Housing Statement
Include in portal footer and email footer:
"We are committed to the Fair Housing Act and provide equal service regardless of race, color, national origin, religion, sex, familial status, or disability."

---

## Bilingual Requirements

### Language Toggle
- Every client-facing screen has an EN/ES toggle
- Default language: detect from browser, fallback to English
- Lorena's preferred language for dashboard: English
- All automated messages (drips, emails, SMS) have both versions
- AI SMS engine auto-detects and switches to Spanish if client responds in Spanish

### Translation Rules
- Professional translation, not Google Translate
- Maintain same tone (warm, professional) in both languages
- El Paso-specific Spanish (not formal Castilian, not slang — natural border bilingual)
- Currency always in USD format ($X,XXX)
- Dates in US format (MM/DD/YYYY) for both languages

---

## Design System Quick Reference

| Element | Value |
|---------|-------|
| Primary Gold | #C9A84C |
| Black | #0A0A0A |
| Background | #FAFAF5 |
| Body Text | #333333 |
| Secondary Text | #888888 |
| Border | #E5E5E0 |
| Headline Font | Playfair Display |
| Body Font | Lato |
| Border Radius (buttons) | 8px (rounded-lg) |
| Border Radius (cards) | 12px (rounded-xl) |
| Min Touch Target | 44px |
| Mobile Min Width | 375px |
| Loading Pattern | Skeleton shimmer (NEVER spinners) |
| Empty State | Gold-accented branded card |

---

## Brand Don'ts

- Never use neon colors or bright gradients
- Never use glassmorphism (backdrop-blur, translucent cards)
- Never use "AI-looking" aesthetics (blue/purple glows, matrix effects)
- Never show framework branding (Next.js, Supabase, Vercel logos)
- Never use Comic Sans, Papyrus, or decorative fonts
- Never use emojis in professional communications (limited to internal dashboard labels)
- Never use pure white (#FFFFFF) for backgrounds — always off-white (#FAFAF5)
- Never use pure black (#000000) for text — always #0A0A0A or #333333
- Never crop or distort Lorena's professional photo
- Never omit brokerage disclosure on client-facing materials
