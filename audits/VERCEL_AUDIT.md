# VERCEL_AUDIT.md — PathPort Platform
*Audit date: 2026-06-12 · Audited from code + session history; no direct Vercel API access*

## 1. Environment variables required (6)
| Variable | Scope | Status |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | client+server | ✅ set (user corrected earlier) |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | client+server | ✅ set |
| NEXT_PUBLIC_SITE_URL | client+server | ✅ set — now only used for email links/fallbacks (reset flow uses window.location.origin) |
| SUPABASE_SERVICE_ROLE_KEY | **server only** | ✅ set — verify it is NOT exposed with NEXT_PUBLIC prefix anywhere |
| RESEND_API_KEY | server only | ✅ set (emails delivering) |
| RESEND_FROM_EMAIL | server only | ✅ set |

⚠️ Ensure all 6 are set for **Production AND Preview** environments — preview deployments with missing vars produce placeholder Supabase clients (silent failures).

## 2. Build settings
- Standard Next.js 14 build, no vercel.json, no cron jobs, no edge config. Build passes clean (63 routes). ✅

## 3. Domains — ⚠️ MAIN FINDING
Two domains serve the app:
1. `pathport-platform.vercel.app` (project domain)
2. `pathport-platform-ad80097-8180s-projects.vercel.app` (team domain)

This dual-domain setup caused the password-reset redirect failures (Supabase allowlist mismatch). **Recommendation:**
- Pick ONE canonical production domain (ideally a custom domain like `pathport.sg`)
- Set Supabase Site URL + NEXT_PUBLIC_SITE_URL to it
- Add redirect-URL allowlist entries for both Vercel domains until then

## 4. Deployment hygiene
- Production tracks `main` ✅ (auto-deploy on merge confirmed working)
- Preview per PR ✅
- ⚠️ Deployment protection for previews not verified — preview URLs may be publicly accessible; consider Vercel Deployment Protection (auth required for previews) since previews run against the production Supabase project.

## 5. Risks
| # | Risk | Severity |
|---|---|---|
| 1 | Previews share the production Supabase database — a bug in a preview can mutate prod data | MEDIUM (acceptable for current scale; consider Supabase branching later) |
| 2 | Dual-domain auth mismatches (recurring source of bugs) | MEDIUM — consolidate |
| 3 | In-memory rate limiting per serverless instance | covered in SECURITY_AUDIT |
| 4 | No error monitoring (Sentry etc.) — console.error only visible in Vercel logs | MEDIUM |
