# SECURITY_AUDIT.md — PathPort Platform
*Audit date: 2026-06-12*

## 1. Headers (next.config.js — sprint14) ✅
HSTS (2y, preload), X-Frame-Options DENY, nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy locked down, CSP present.

### 🟡 CSP findings
| Issue | Impact |
|---|---|
| `script-src 'unsafe-inline' 'unsafe-eval'` | Weakens XSS protection — required by Next.js dev but `unsafe-eval` can usually be dropped in production; consider nonce-based CSP later |
| **No `frame-src` directive** → falls back to `default-src 'self'` | **YouTube/Vimeo course video embeds are blocked by CSP** — course detail pages with video will show empty frames. Add `frame-src https://www.youtube.com https://player.vimeo.com` |
| `img-src` missing `https://*.supabase.co` | Any image rendered from Supabase storage public URL (college logos, course thumbnails/galleries) is blocked. Add the Supabase host to img-src |

## 2. Service-role key handling ✅
- Exactly **1** reference to `SUPABASE_SERVICE_ROLE_KEY` — inside `src/lib/supabase/admin-client.ts` (server-only). Throws if missing; never imported by client components. Constraint honoured.

## 3. Access control by role ✅
- RLS: 19/19 tables covered (see DATABASE_AUDIT matrix). Admin via SECURITY DEFINER helper, institution via college-ownership helpers, students via auth.uid().
- API: role + ownership checks on every mutating route.
- Storage: private buckets; downloads only via RLS-checked table read + short-lived signed URL.
- Middleware: dashboard route protection + session refresh.

### Privilege-escalation review
- ❌ No path found for student → institution/admin escalation (role column only writable via service role / admin policies).
- ❌ No IDOR found: every [id] route re-verifies ownership/scope against RLS or explicit checks before acting.
- ⚠️ `applications: institution update` RLS policy allows updating ANY column of applications for their college — combined with no column-level grants, an institution could theoretically write `student_id`. Low risk (authenticated partner), but consider a column allow-list via trigger or splitting the policy.

## 4. Identified risks (ranked)
| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | In-memory rate limiting ineffective on serverless (resets per cold start, per instance) | HIGH | Upstash Redis |
| 2 | CSP blocks legitimate embeds/images (frame-src, img-src) — availability, not confidentiality | MEDIUM | Extend CSP |
| 3 | No MFA on admin accounts | MEDIUM | Supabase TOTP MFA |
| 4 | No audit log for profile/college/course mutations | MEDIUM | Extend logAudit usage |
| 5 | `unsafe-eval`/`unsafe-inline` in CSP | LOW-MED | Nonce-based CSP |
| 6 | Offer decision side effects skipped silently if admin client env missing | LOW | Fail fast or queue |
| 7 | No CSRF token — acceptable: Supabase auth cookies are SameSite=Lax and all mutations require the auth cookie + JSON body | INFO | — |

## 5. Sensitive-data exposure check
- Passport numbers / DOB stored in profiles — protected by RLS (own + institution-applicants read + admin). ✅
- No tokens/keys logged anywhere (verified PASSWORD_RESET logs exclude tokens). ✅
- email_log stores recipient + template, not message bodies. ✅
- Diagnostic page is admin-gated. ✅

## Security score: 78/100
Strong access-control architecture (RLS + role checks + signed URLs) and full header suite; loses points for serverless-ineffective rate limiting, missing admin MFA, CSP gaps, and audit-log coverage holes.
