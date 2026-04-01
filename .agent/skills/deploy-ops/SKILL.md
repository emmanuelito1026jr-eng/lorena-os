# Skill: Deploy Ops

> Deployment, hosting, operations, environment management, and infrastructure for the Casas En El Paso platform.
> **Read before:** deploying to production, modifying environment variables, running database migrations, managing n8n workflows, or troubleshooting production issues.

---

## Overview

The Casas En El Paso platform runs on a Vercel + Supabase + n8n stack. The frontend is a Vite SPA deployed to Vercel with automatic preview deployments for PRs. The database and auth live on Supabase (hosted PostgreSQL with Row Level Security). Automation workflows run on a self-hosted n8n instance. MLS data syncs every 15 minutes via n8n calling the Spark API.

The deployment philosophy is: production is sacred, preview before merging, and never push secrets to git. Rollbacks should be fast (one command or one revert commit). Every deployment should be verifiable within 60 seconds of going live.

---

## Key Files

| File | Purpose |
|------|---------|
| `package.json` | Build scripts (`dev`, `build`, `preview`, `test`) |
| `vite.config.ts` | Vite config: port 3000, manual chunks, aliases |
| `.env` | Local environment variables (NEVER committed) |
| `.env.example` | Template showing required variables (committed) |
| `.gitignore` | Excludes `.env`, `node_modules`, `dist`, `.vite` |
| `supabase/migrations/*.sql` | Database migration files (001-011) |
| `supabase/functions/` | Supabase Edge Functions |
| `.agent/workflows/deploy_v2.py` | n8n workflow deployment script |
| `.agent/workflows/n8n_json/` | 22 n8n workflow JSON files (LOS-01 through LOS-22) |
| `scripts/pull-mls.mjs` | Manual MLS data pull |
| `scripts/gen-snapshots.mjs` | Generate market snapshot data |
| `lib/seed/seed.ts` | Database seed script |

---

## Hosting: Vercel

### Configuration

| Setting | Value |
|---------|-------|
| Provider | Vercel |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Node Version | 18.x or 20.x |
| Production Branch | `main` |
| Preview Deployments | Auto-created for every PR |

### Deployment Flow
```
git push to main
  |
  v
Vercel detects push → runs npm install → npm run build
  |
  v
Build output (dist/) deployed to production URL
  |
  v
Live at borderflow.app (or configured domain)
```

### Preview Deployments
- Every PR automatically gets a unique preview URL
- Preview URLs follow pattern: `casas-en-el-paso-tx-<hash>.vercel.app`
- Use previews to test changes before merging to main
- Preview deployments share the same environment variables as production (unless overridden)

### Rollback
```bash
# Roll back to previous deployment
vercel rollback

# Or revert the commit and push
git revert HEAD
git push origin main
```

### Environment Variables in Vercel
Set via Vercel Dashboard > Project > Settings > Environment Variables:

| Variable | Scope | Description |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | All | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | All | Supabase anonymous/public key |

**CRITICAL:** Only `VITE_`-prefixed variables are available in the frontend bundle. Server-side secrets (Twilio, SendGrid, Spark API) go in n8n or Supabase Edge Functions, NOT in Vercel.

---

## Dev Server

### Start Development
```bash
npm run dev
# Server starts at http://localhost:3000
# Hot module replacement enabled
# Vite resolves @ alias to project root
```

### Prerequisites
1. Node.js 18+ installed
2. `npm install` completed
3. `.env` file exists with required variables:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
```

### Common Dev Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| White screen | Missing `.env` file | Create `.env` with Supabase vars |
| White screen | Supabase client crash | Check `VITE_SUPABASE_URL` is correct |
| Stale cache | Vite HMR cache | `rm -rf node_modules/.vite` |
| Port conflict | Something else on :3000 | Kill process or change port in `vite.config.ts` |
| Module not found | Missing dependency | `npm install` |
| Type errors | Outdated types | `npx supabase gen types typescript` |

---

## Supabase

### Database Migrations
```bash
# Push all pending migrations to Supabase
npx supabase db push

# Reset database (DESTRUCTIVE — dev only)
npx supabase db reset
```

Migration files are in `supabase/migrations/` numbered sequentially:
- `001_initial_schema.sql` — Core tables (profiles, leads, lead_activity, messages, etc.)
- `002_automation_ready.sql` — Drip sequences, enrollments, checklist templates
- `003_add_cinc_source.sql` — CINC migration source fields
- `004_lead_gen_channels.sql` — Multi-source lead tracking
- `005_email_intelligence.sql` — Email templates, campaigns, send logs
- `006_mls_integration.sql` — Listings table, price/status history
- `007_referral_partner_prospecting.sql` — Referral partner tables
- `008_mls_integration.sql` — Additional MLS fields
- `009_spark_mls_alignment.sql` — Spark API field alignment
- `010_combined_mls_safe.sql` — Combined MLS cleanup
- `011_chat_system.sql` — Chat/chatbot tables

### Generate TypeScript Types
```bash
npx supabase gen types typescript --project-id <project-id> > lib/supabase/database.types.ts
```
Run this after any schema change to keep TypeScript types in sync.

### Edge Functions
```bash
# Deploy a single Edge Function
npx supabase functions deploy <function-name>

# Deploy all Edge Functions
npx supabase functions deploy

# Test locally
npx supabase functions serve
```

Current Edge Functions:
- `create-profile` — Auto-creates profile row on user signup

### Supabase Environment Variables
These are set in the Supabase Dashboard under Project Settings > Edge Functions:

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API for briefings/CMA/AI SMS |
| `OPENAI_API_KEY` | GPT-4o for chatbot |
| `TWILIO_ACCOUNT_SID` | Twilio SMS |
| `TWILIO_AUTH_TOKEN` | Twilio SMS |
| `TWILIO_PHONE_NUMBER` | Twilio phone (915 area code) |
| `SENDGRID_API_KEY` | SendGrid email |

---

## n8n (Workflow Automation)

### Instance Details

| Setting | Value |
|---------|-------|
| Host | `https://n8n.srv957236.hstgr.cloud` |
| API Base | `https://n8n.srv957236.hstgr.cloud/api/v1` |
| Auth | API key via `X-N8N-API-KEY` header |
| Env Var | `N8N_API_KEY` |

### Deployment Script
```bash
# Deploy all workflows (delete old LOS-*, deploy fresh, activate)
python3 .agent/workflows/deploy_v2.py
```

The deploy script:
1. Lists existing workflows via n8n API
2. Deletes any workflows with `[LOS-` in the name
3. Deploys fresh from JSON files in `.agent/workflows/n8n_json/`
4. Activates each deployed workflow
5. Reports success/failure for each

### Workflow Inventory (22 Workflows)

| ID | Name | Trigger |
|----|------|---------|
| LOS-01 | Contact Form | Webhook |
| LOS-02 | Home Estimate | Webhook |
| LOS-03 | CINC Import | Manual |
| LOS-04 | Open House | Schedule |
| LOS-05 | Behavioral Scoring | Webhook |
| LOS-06 | Daily Briefing | Cron (7 AM CST) |
| LOS-07 | ROI Tracker | Schedule |
| LOS-08 | CMA Generator | Webhook |
| LOS-09 | Checklist Automator | Webhook |
| LOS-10 | System Monitor | Schedule |
| LOS-11 | Speed to Lead | Webhook |
| LOS-12 | AI SMS Engine | Webhook |
| LOS-13 | Zillow Parser | Schedule |
| LOS-14 | Meta Lead Sync | Webhook |
| LOS-15 | Drip Orchestrator | Cron |
| LOS-16 | Lead Reactivation | Schedule |
| LOS-17 | Behavioral Triggers | Webhook |
| LOS-18 | Showing Coordinator | Webhook |
| LOS-19 | Pre-Showing Brief | Schedule |
| LOS-20 | Post Showing | Webhook |
| LOS-21 | Post-Close Nurture | Schedule |
| LOS-22 | Social Content | Schedule |

### n8n Credentials
Workflows reference n8n credential IDs (not raw secrets). Set credentials in the n8n UI:
- Supabase (service role key)
- Twilio
- SendGrid
- OpenAI
- Anthropic
- Spark API

---

## MLS Scripts

### Manual MLS Pull
```bash
node scripts/pull-mls.mjs
```
Fetches all active listings from Spark API and upserts to Supabase. Useful for:
- Initial data population
- Recovery after sync failure
- Testing Spark API connectivity

### Generate Market Snapshots
```bash
node scripts/gen-snapshots.mjs
```
Runs the market snapshot SQL queries against Supabase to generate city-wide and per-zip statistics.

---

## Seed Data

### Run Seeder
```bash
npx tsx lib/seed/seed.ts
```
Populates the database with:
- 20 leads with realistic El Paso Hispanic names
- 15-20 properties across El Paso neighborhoods
- Lead activity history for scoring
- Sample messages, showings, and deals

### When to Seed
- After database reset (`npx supabase db reset`)
- On fresh development environment setup
- When testing with clean data

---

## Complete Environment Variables Reference

### Frontend (Vercel + `.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Server-Side (n8n + Supabase Edge Functions)
```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SPARK_API_TOKEN=...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1915...
SENDGRID_API_KEY=SG...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
N8N_API_KEY=...
APOLLO_API_KEY=...
META_APP_SECRET=...
```

### Rules
- `VITE_` prefix = exposed to frontend bundle (public keys only)
- No `VITE_` prefix = server-side only (n8n, Edge Functions)
- NEVER commit `.env` to git
- `.env.example` shows required vars without values (committed)

---

## Production Checklist (Pre-Deploy)

Before deploying to production:

- [ ] `npm run type-check` — 0 errors
- [ ] `npm run build` — exit code 0
- [ ] `npm run lint` — 0 warnings
- [ ] All environment variables set in Vercel dashboard
- [ ] Supabase migrations applied (`npx supabase db push`)
- [ ] Edge Functions deployed (`npx supabase functions deploy`)
- [ ] n8n workflows deployed and activated (`.agent/workflows/deploy_v2.py`)
- [ ] MLS sync running (check `mls_sync_metadata` for recent successful sync)
- [ ] No hardcoded secrets in codebase (`git grep -i "sk-" "SG\." "AC[0-9]"`)
- [ ] Preview deployment tested (click through main flows)

## Post-Deploy Verification

After deploying to production:

- [ ] Home page loads (no white screen)
- [ ] Property listings display (MLS data present)
- [ ] Login works (Supabase Auth)
- [ ] Dashboard loads for agent role
- [ ] Portal loads for client role
- [ ] IDX compliance footer visible on listing pages
- [ ] n8n System Monitor (LOS-10) shows green

---

## Verification Checklist

Before marking any deployment task complete:

- [ ] Build passes locally (`npm run build`)
- [ ] Preview deployment accessible and functional
- [ ] Environment variables correctly set for target environment
- [ ] No secrets committed to git
- [ ] Database migrations applied if schema changed
- [ ] TypeScript types regenerated if schema changed
- [ ] n8n workflows deployed if automation changed
- [ ] Rollback plan known (revert commit or `vercel rollback`)

---

## Common Mistakes

1. **Pushing secrets to git** — `.env` must be in `.gitignore`. If you accidentally commit secrets, rotate them immediately (they are compromised forever in git history).
2. **Prefixing server secrets with `VITE_`** — `VITE_TWILIO_AUTH_TOKEN` would expose Twilio credentials to every browser. Only Supabase anon key and URL get the `VITE_` prefix.
3. **Deploying without building first** — Always run `npm run build` locally before pushing. Vercel builds can fail silently or with cryptic errors.
4. **Forgetting to push migrations** — Schema changes in migration files do not apply automatically. Run `npx supabase db push` after adding or modifying migration files.
5. **Not regenerating types after schema changes** — If you add a column to `listings`, the TypeScript types in `database.types.ts` will be stale. Run `npx supabase gen types typescript`.
6. **Deploying n8n workflows with stale credentials** — The deploy script (`deploy_v2.py`) deploys from JSON files. If credential IDs changed in n8n, update the JSON files first.
7. **Not checking n8n after deploy** — Workflows can deploy successfully but fail on first execution (wrong credential reference, missing env var). Check the n8n execution log after deploying.
8. **Running `npx supabase db reset` in production** — This DELETES ALL DATA. Only use in development. Production schema changes go through migrations only.
9. **Ignoring Vite cache issues** — If dev server shows stale content, clear the cache: `rm -rf node_modules/.vite`. This resolves most "it works in build but not in dev" issues.
10. **Not testing the preview deployment** — Vercel preview URLs are free verification. Always click through the main flows (home, properties, login, dashboard) before merging to main.
