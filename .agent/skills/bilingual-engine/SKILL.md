# Skill: Bilingual Engine

> Internationalization (i18n) and bilingual EN/ES support for all client-facing text.
> **Read before:** adding any user-visible text to portal pages, public site, lead capture widgets, SMS/email templates, error messages, or empty states.

---

## Overview

El Paso is approximately 82% Hispanic. Bilingual support is not a feature — it is a fundamental requirement. Every piece of text that a client can see must be available in both English and Spanish. This includes the public website, client portal, lead capture widgets, SMS messages, email templates, error messages, and empty states.

The i18n system uses a React Context provider with a simple `t(key)` function that looks up translations from JSON message files. The locale is persisted in localStorage and applied to `document.documentElement.lang` for accessibility. The system falls back to English if a Spanish translation is missing, and falls back to the raw key if neither language has a translation (this should never happen in production).

The agent dashboard (Lorena's interface) does NOT need bilingual support — Lorena speaks English. Only client-facing surfaces require it.

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/i18n/LanguageContext.tsx` | Provider + `useTranslation()` hook |
| `lib/i18n/index.ts` | Re-exports for convenience |
| `lib/i18n/messages/en.json` | English translations (350+ keys) |
| `lib/i18n/messages/es.json` | Spanish translations (350+ keys) |

---

## System Architecture

### LanguageContext Provider
```tsx
// Wraps the entire app in App.tsx
<LanguageProvider>
  <RouterProvider router={router} />
</LanguageProvider>
```

### useTranslation Hook
```tsx
const { t, locale, setLocale } = useTranslation();
// t('key') → returns translated string
// locale → 'en' | 'es'
// setLocale('es') → switches language, persists to localStorage
```

### Fallback Chain
```
1. messages[currentLocale][key]  →  Spanish translation
2. messages['en'][key]           →  English fallback
3. key itself                    →  Raw key (should never happen)
```

### Locale Persistence
- Stored in `localStorage.getItem('locale')`
- Applied to `document.documentElement.lang` on change
- Default: `'en'` if nothing stored

---

## Key Naming Convention

Keys follow the pattern: `section.page.element`

| Pattern | Example | Value |
|---------|---------|-------|
| `nav.*` | `nav.searchHomes` | "Search Homes" |
| `hero.*` | `hero.headline` | "Your Home in the Sun City..." |
| `featured.*` | `featured.title` | "Featured Homes" |
| `portal.nav.*` | `portal.nav.home` | "Home" |
| `portal.home.*` | `portal.home.goodMorning` | "Good Morning" |
| `portal.search.*` | `portal.search.title` | "Search Homes" |
| `portal.messages.*` | `portal.messages.title` | "Messages" |
| `portal.showings.*` | `portal.showings.title` | "My Showings" |
| `portal.profile.*` | `portal.profile.title` | "My Profile" |
| `contact.*` | `contact.title` | "Contact Us" |
| `about.*` | `about.title` | "About Lorena" |
| `shared.*` | `shared.loading` | "Loading..." |
| `error.*` | `error.generic` | "Something went wrong" |
| `empty.*` | `empty.noLeads` | "No leads yet" |

### Rules
- Use dot notation (never slashes or brackets)
- Keep keys descriptive but concise
- Group by feature/page, not by component
- Avoid generic keys like `text1` or `label` — use meaningful names

---

## Translation Quality Guidelines

### Spanish Dialect: El Paso Border Spanish
- Use **natural, conversational Mexican Spanish** — NOT formal Castilian
- El Paso Spanish is a blend of Mexican Spanish with some English loanwords
- Use "tu" (informal) for client-facing text, not "usted" (formal) — Lorena's brand is warm and approachable
- Common local terms are acceptable (e.g., "lonche" for lunch, "troca" for truck) but keep it professional

### Common Translation Pairs

| English | Spanish | Notes |
|---------|---------|-------|
| Search homes | Buscar casas | Not "Buscar hogares" (too formal) |
| Schedule showing | Agendar una cita | Not "Programar una muestra" |
| Save home | Guardar casa | |
| Contact Lorena | Contactar a Lorena | |
| My favorites | Mis favoritos | |
| Good morning | Buenos dias | |
| Good afternoon | Buenas tardes | |
| Good evening | Buenas noches | |
| View details | Ver detalles | |
| Your transaction | Tu transaccion | "Tu" not "Su" |
| Messages | Mensajes | |
| Showings | Citas | Not "Exhibiciones" |
| Home value | Valor de tu casa | "Tu" for warmth |
| Sign out | Cerrar sesion | |
| No results | Sin resultados | |
| Browse homes | Explorar casas | |
| Sign up | Registrate | Informal imperative |
| Log in | Iniciar sesion | |
| Beds | Recamaras | El Paso prefers "recamaras" over "dormitorios" |
| Baths | Banos | |
| Square feet | Pies cuadrados | Or "sq ft" in informal context |
| Price | Precio | |
| Neighborhood | Colonia | Or "vecindario" — "colonia" is more natural in border Spanish |

### Variable Placeholders
Keep `{{variable}}` placeholders UNCHANGED in both languages:
```json
// en.json
"portal.home.greeting": "Good morning, {{name}}"

// es.json
"portal.home.greeting": "Buenos dias, {{name}}"
```

**Note:** The current `t()` function does simple key lookup without variable interpolation. If you need variables, concatenate in the component:
```tsx
`${t('portal.home.goodMorning')}, ${firstName}`
```

---

## What MUST Be Bilingual

| Surface | Bilingual Required | Notes |
|---------|--------------------|-------|
| Public website (all pages) | YES | Every heading, CTA, description |
| Client portal (all pages) | YES | Every label, button, message |
| Lead capture widgets | YES | FloatingChatButton, ExitIntentPopup, StickyMobileCTA |
| SMS templates | YES | Pre-built in both languages |
| Email templates | YES | Subject + body in both languages |
| Error messages | YES | "Something went wrong" in both |
| Empty states | YES | Every empty state title + description |
| Form validation messages | YES | "This field is required" etc. |
| Property descriptions | NO | Come from MLS (English only from Spark API) |
| Dashboard (agent) | NO | Lorena speaks English |
| Admin modals | NO | Agent-only interface |
| Dev documentation | NO | Internal only |
| n8n workflow names | NO | Backend only |

---

## Adding New Translations

### Step-by-Step Process

1. **Choose a key** following the `section.page.element` convention
2. **Add to `en.json`** with the English text
3. **Add to `es.json`** with the Spanish translation — SAME KEY
4. **Use in component** via `t('your.new.key')`
5. **Run parity check** to verify both files have the same keys

### Parity Check
Both `en.json` and `es.json` must have exactly the same keys. Run this verification:
```bash
# Quick parity check (run from project root)
node -e "
const en = require('./lib/i18n/messages/en.json');
const es = require('./lib/i18n/messages/es.json');
const enKeys = Object.keys(en).sort();
const esKeys = Object.keys(es).sort();
const missingInEs = enKeys.filter(k => !es[k]);
const missingInEn = esKeys.filter(k => !en[k]);
if (missingInEs.length) console.log('Missing in es.json:', missingInEs);
if (missingInEn.length) console.log('Missing in en.json:', missingInEn);
if (!missingInEs.length && !missingInEn.length) console.log('Parity OK: all keys match');
"
```

### Template for Adding a New Screen
When adding a new portal or public page, add ALL required keys to both files at once:
```json
// Add to BOTH en.json and es.json:
"newPage.title": "...",
"newPage.subtitle": "...",
"newPage.emptyTitle": "...",
"newPage.emptyDesc": "...",
"newPage.ctaButton": "...",
"newPage.loadingText": "..."
```

---

## Language Switcher

The language toggle appears in:
1. **Public site navbar** — globe icon or EN/ES toggle
2. **Portal profile page** — preferred language setting
3. **Portal layout sidebar** (desktop) — language selector

### Implementation Pattern
```tsx
const { locale, setLocale } = useTranslation();

<button onClick={() => setLocale(locale === 'en' ? 'es' : 'en')}>
  {locale === 'en' ? 'ES' : 'EN'}
</button>
```

---

## SMS/Email Bilingual Templates

For automated messages (drip sequences, alerts, confirmations):
- Store templates with both `body_en` and `body_es` fields
- Check `leads.preferred_language` to select the correct version
- If no preference set, default to English
- Subject lines must also be bilingual for emails

---

## Verification Checklist

Before marking any client-facing task complete:

- [ ] All visible text uses `t()` from `useTranslation()` — no hardcoded strings
- [ ] New keys added to BOTH `en.json` AND `es.json`
- [ ] Key names follow `section.page.element` convention
- [ ] Spanish translations use El Paso border Spanish (informal, warm, conversational)
- [ ] Variable placeholders `{{name}}` unchanged between languages
- [ ] Run parity check: every key in `en.json` exists in `es.json` and vice versa
- [ ] Language switcher works (toggle between EN/ES and verify all text updates)
- [ ] Empty states have bilingual text
- [ ] Error messages have bilingual text
- [ ] No hardcoded English in portal or public site components

---

## Common Mistakes

1. **Adding keys to `en.json` but forgetting `es.json`** — Always add to BOTH files. Every time. No exceptions.
2. **Using formal Spanish ("usted")** — Lorena's brand is warm and personal. Use "tu" forms.
3. **Google Translate quality** — Machine-translated Spanish reads wrong to native speakers. If unsure, use simple, direct phrasing over complex sentences.
4. **Hardcoding English in JSX** — Every string literal in a portal or public component should be `t('some.key')`, not a bare string. This includes button labels, tooltips, alt text, and aria-labels.
5. **Using Castilian Spanish terms** — "Dormitorios" (Castilian) vs "Recamaras" (Mexican/El Paso). "Piso" (Castilian) vs "Departamento" (Mexican). Always prefer the local dialect.
6. **Forgetting empty state text** — Empty states are client-visible. They need bilingual titles and descriptions.
7. **Not testing the toggle** — After adding translations, actually switch to Spanish and visually verify. Missing translations show the raw key (e.g., "portal.home.newFeature") which looks broken.
8. **Translating property data** — MLS listing descriptions come from Spark API in English. Do NOT attempt to auto-translate property descriptions — accuracy matters too much for real estate.
9. **Breaking key naming convention** — `portal_home_title` (underscores) or `PortalHomeTitle` (camelCase) are wrong. Use `portal.home.title` (dots).
10. **Forgetting bilingual SMS/email** — Automated messages must check `leads.preferred_language` and use the correct template variant. Sending Spanish emails to English-preference clients (or vice versa) is a bad experience.
