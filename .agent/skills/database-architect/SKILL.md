---
name: database-architect
description: Supabase schema, RLS, hooks, and data access patterns. Read this before any database or hook changes.
---

# Database Architect

> Read this skill before modifying database schemas, creating hooks, or changing data access patterns.
> All database access is through Supabase. All queries live in custom hooks.

---

## Connection Setup

### Client
**File:** `lib/supabase/client.ts`
```ts
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);
```

### Types
**File:** `lib/supabase/database.types.ts`
- Auto-generated from `npx supabase gen types typescript`
- Contains all table types, insert/update types, enums
- Custom types exported: `Lead`, `LeadActivity`, `MarketSnapshot`, `LeadTemperature`, etc.

---

## Database Tables

### Core Tables (Migration 001)
| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `profiles` | id (FK auth.users), role, full_name, phone, avatar_url | User profiles (agent + clients) |
| `leads` | id, full_name, email, phone, source, status, score, stage, assigned_to | Lead pipeline |
| `lead_activity` | id, lead_id, action, points, metadata | Behavioral scoring log |
| `properties` | id, mls_id, address, city, zip, price, beds, baths, sqft, photos, status | Property listings |
| `showings` | id, lead_id, property_id, date, time, status, notes | Showing schedule |
| `messages` | id, lead_id, sender, channel, body, direction | Message history |
| `deals` | id, lead_id, property_id, status, price, stage, checklist | Transaction pipeline |
| `notifications` | id, user_id, type, title, body, read, metadata | Agent notifications |

### Automation Tables (Migration 002)
| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `drip_sequences` | id, name, type, steps (JSONB), trigger_on | Drip sequence definitions |
| `drip_enrollments` | id, lead_id, sequence_id, current_step, status, next_send_at | Active enrollments |
| `calendar_campaigns` | id, name, send_date, template, status | Holiday/date campaigns |
| `checklists` | id, name, type, items (JSONB) | Transaction checklists |
| `checklist_assignments` | id, checklist_id, deal_id, completed_items | Assigned checklists |
| `email_templates` | id, name, subject, body_en, body_es, category | Email templates |
| `saved_searches` | id, lead_id, criteria (JSONB), notify | Saved property searches |
| `market_snapshots` | id, area, area_type, snapshot_date, median_price, active_count, dom_avg | Market data |

### Additional Tables (Migrations 003-009)
| Table | Migration | Purpose |
|-------|-----------|---------|
| `cma_reports` | 005 | CMA report data + PDF URLs |
| `comparable_sales` | 005 | Comparable property data for CMAs |
| `listing_interactions` | 006 | Property view/favorite/share tracking |
| `mls_sync_log` | 008 | MLS sync status tracking |

### Chat Tables (Migration 011)
| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `chat_sessions` | id, visitor_id, status, lead_id, metadata | Chat session tracking |
| `chat_messages` | id, session_id, role, content, metadata | Chat message history |
| `chat_lead_captures` | id, session_id, lead_id, capture_type, captured_data | Lead info captured via chat |

---

## Row Level Security (RLS)

### Policy Pattern
| Role | Access |
|------|--------|
| Agent (role = 'agent') | SELECT, INSERT, UPDATE, DELETE on all tables |
| Client (role = 'client') | SELECT own data only (WHERE user_id = auth.uid() or lead_id matches) |

### Key RLS Rules
- `profiles`: users can read/update own profile
- `leads`: agent sees all, clients see own (matched by email)
- `messages`: agent sees all, clients see own conversations
- `showings`: agent sees all, clients see own showings
- `notifications`: users see own notifications only
- `properties`: public read for all, write for agent only

---

## Realtime Subscriptions

Enabled on these tables for live updates:
| Table | Events | Used By |
|-------|--------|---------|
| `leads` | INSERT, UPDATE | `hooks/useRealtime.ts` |
| `lead_activity` | INSERT | `hooks/useRealtime.ts` |
| `messages` | INSERT | `hooks/useMessages.ts` |
| `notifications` | INSERT | `hooks/useNotifications.ts` |

### Realtime Hook
**File:** `hooks/useRealtime.ts`
- Subscribes to Supabase channels
- Invalidates TanStack Query cache on changes
- Auto-cleans up subscriptions on unmount

---

## Custom Hooks

### Lead Management
| Hook | File | Tables Queried |
|------|------|----------------|
| `useLeads` | `hooks/useLeads.ts` | leads, lead_activity |
| `useDashboardStats` | `hooks/useDashboardStats.ts` | leads, showings, deals, messages |

### Communication
| Hook | File | Tables Queried |
|------|------|----------------|
| `useMessages` | `hooks/useMessages.ts` | messages |
| `useChat` | `hooks/useChat.ts` | chat_sessions, chat_messages |
| `useNotifications` | `hooks/useNotifications.ts` | notifications |

### Properties & MLS
| Hook | File | Tables Queried |
|------|------|----------------|
| `useListings` | `hooks/useListings.ts` | properties |
| `useListingInteractions` | `hooks/useListingInteractions.ts` | listing_interactions |
| `useMarketData` | `hooks/useMarketData.ts` | market_snapshots |
| `useMarketSnapshots` | `hooks/useMarketSnapshots.ts` | market_snapshots |
| `useComparableSales` | `hooks/useComparableSales.ts` | comparable_sales |
| `useSavedSearches` | `hooks/useSavedSearches.ts` | saved_searches |

### Deals & Showings
| Hook | File | Tables Queried |
|------|------|----------------|
| `useDeals` | `hooks/useDeals.ts` | deals |
| `useShowings` | `hooks/useShowings.ts` | showings |

### Automation
| Hook | File | Tables Queried |
|------|------|----------------|
| `useAutoTracks` | `hooks/useAutoTracks.ts` | drip_sequences, drip_enrollments, calendar_campaigns, checklists |
| `useEmailTemplates` | `hooks/useEmailTemplates.ts` | email_templates |
| `useCMAReports` | `hooks/useCMAReports.ts` | cma_reports |

### Analytics & Profile
| Hook | File | Tables Queried |
|------|------|----------------|
| `useAnalytics` | `hooks/useAnalytics.ts` | leads, lead_activity, deals |
| `useProfile` | `hooks/useProfile.ts` | profiles |
| `useAuth` | `hooks/useAuth.ts` | auth.users (Supabase Auth) |

### Utility Hooks
| Hook | File | Purpose |
|------|------|---------|
| `useRealtime` | `hooks/useRealtime.ts` | Supabase realtime subscriptions |
| `useTheme` | `hooks/useTheme.ts` | Dark/light mode toggle |
| `usePageTitle` | `hooks/usePageTitle.ts` | Document title management |
| `usePageMeta` | `hooks/usePageMeta.ts` | SEO meta tags |
| `useLenis` | `hooks/useLenis.ts` | Smooth scroll (desktop) |
| `useScrollAnimation` | `hooks/useScrollAnimation.ts` | GSAP scroll animations |

---

## Data Access Rules

1. **All Supabase queries live in hooks** — never call `supabase.from()` directly in components
2. **All hooks use TanStack Query** — `useQuery` for reads, `useMutation` for writes
3. **Query keys follow convention:** `['table-name', ...params]`
4. **Stale times:** 2 min default (`QueryClient` in App.tsx), 5-10 min for market data
5. **Optimistic updates** for mutations where immediate UI feedback matters (messages, notifications)
6. **Error handling:** hooks catch and return errors, never throw to components

### Hook Pattern
```ts
export function useLeads(filters?: LeadFilters) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('score', { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });
}
```

---

## Database Conventions

- All tables use UUID primary keys (`gen_random_uuid()`)
- All tables have `created_at TIMESTAMPTZ DEFAULT NOW()`
- JSONB for flexible data (preferences, metadata, steps, items)
- TEXT arrays for lists (tags, photos, features)
- Index hot paths: `lead_activity(lead_id)`, `drip_enrollments(next_send_at) WHERE status = 'active'`

---

## Migration Files

Located in `supabase/migrations/`:
| File | Content |
|------|---------|
| `001_initial_schema.sql` | Core tables (profiles, leads, properties, messages, etc.) |
| `002_automation_ready.sql` | Automation tables (drip sequences, campaigns, checklists) |
| `003_add_cinc_source.sql` | CINC source field additions |
| `004_lead_gen_channels.sql` | Lead generation channel tracking |
| `005_email_intelligence.sql` | CMA reports, comparable sales, email templates |
| `006_mls_integration.sql` | Listing interactions, MLS tracking |
| `007_referral_partner_prospecting.sql` | Referral partner tables |
| `008_mls_integration.sql` | MLS sync log |
| `009_spark_mls_alignment.sql` | Spark API field alignment |
| `010_combined_mls_safe.sql` | Combined MLS safety migration |
| `011_chat_system.sql` | Chat sessions, messages, lead captures |

**RULE:** Never edit migration files directly. Create new migrations for schema changes.
