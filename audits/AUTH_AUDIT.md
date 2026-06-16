# AUTH_AUDIT.md — PathPort Platform
*Audit date: 2026-06-12*

## 1. Flow Inventory

| Flow | Status | Implementation |
|---|---|---|
| Student registration | ✅ WORKS | `/signup` → `supabase.auth.signUp()` → `handle_new_user()` trigger creates profile → `/verify-email` |
| Email verification | ✅ WORKS | `/verify-email` page with resend via `supabase.auth.resend()` |
| Partner/Institution activation | ✅ WORKS | Admin approves → `generateLink()` via admin client → `partner_activation` email → `/activate-account` sets password, role-routes |
| Resend activation | ✅ WORKS | `/api/auth/resend-activation` (3/10min rate limit, no email enumeration) |
| Password reset | ✅ FIXED (PR #25, #26) | `window.location.origin/reset-password` direct redirect; hash-token + PKCE handling; 5s session polling; sign-out + `/login?message=password-updated` |
| Login | ✅ WORKS | Rate-limit guard (`/api/auth/check`, 5/min), stale-session clear, role-based redirect, hard navigation |
| Admin login | ✅ WORKS | Separate `/admin/login` with hard role rejection for non-admins |
| Logout | ✅ ROBUST | Server signout (`/api/auth/signout`, global scope, SSR cookie nuke) + client signout + storage purge + hard redirect |
| Role routing | ✅ WORKS | `/dashboard` resolves role server-side → ROLE_META.dashboardPath |
| Session handling | ✅ WORKS | @supabase/ssr cookie adapter; middleware refreshes session on every request |
| Protected routes | ✅ WORKS | Middleware redirects unauthenticated `/dashboard/*` → `/login`, `/dashboard/admin/*` → `/admin/login` |

## 2. Registration coverage by role
- **Student**: self-service signup ✅
- **Institution / Recruitment partner / Employer**: via partner application → admin approval → activation email ✅ (no self-service, by design)
- **Admin**: manual creation only (no UI) — acceptable, but document the runbook.

## 3. Findings

### ⚠️ Open items (require manual config, not code)
1. **Supabase Redirect URL allowlist** must contain `/reset-password` on every domain users browse (`pathport-platform.vercel.app`, `pathport-platform-ad80097-8180s-projects.vercel.app`). Missing entries cause silent fallback to Site URL (homepage) — the root cause of the recurring reset bug.
2. **Supabase Site URL** should be the canonical production domain, not the team domain.

### 🟡 Risks / gaps
3. **No MFA for admin accounts** — single password protects the highest-privilege role. Supabase supports TOTP MFA; recommended for admin.
4. **No account-deletion or email-change flow** — GDPR/PDPA consideration for later.
5. **AuthContext client-side role inference** — Sidebar infers role from pathname before profile loads. Server already enforces; cosmetic only. OK.
6. **In-memory login rate limit** resets on serverless cold start (see SECURITY_AUDIT).
7. **Profile insert discipline** — `handle_new_user()` and activation flow only insert allowed columns `{id, email, full_name, role, college_id}` ✅ (constraint honoured).

## 4. Middleware
- `src/middleware.ts` + `src/lib/supabase/middleware.ts`: session refresh on all matched routes, dashboard redirects, authenticated users bounced off auth pages.
- **API routes are NOT gated by middleware** — each route self-enforces with `getUser()`. Verified: all 31 route files check auth except the 3 intentionally public ones (`/api/inquiries`, `/api/auth/check`, `/api/auth/resend-activation`).

## Verdict: Authentication is complete and robust. Remaining work is Supabase dashboard configuration (redirect allowlist, Site URL) and optional MFA for admins.
