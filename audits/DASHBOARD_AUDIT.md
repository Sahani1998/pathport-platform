# DASHBOARD_AUDIT.md — PathPort Platform
*Audit date: 2026-06-12 · 63 routes compiled in last build; all page files verified on disk*

## 1. Student Portal — 10 pages

| Page | Status |
|---|---|
| /dashboard/student | ✅ FULLY BUILT (real apps/docs/notifications, journey progress) |
| /applications | ✅ FULLY BUILT (timeline, progress %, offer cards, IPA status, realtime refresh) |
| /courses, /courses/[slug] | ✅ FULLY BUILT (filters, media, apply) |
| /documents | ✅ FULLY BUILT (upload, reviews, requests, downloadables) |
| /notifications | ✅ FULLY BUILT |
| /profile, /profile/edit | ✅ FULLY BUILT (completion %, education history) |
| /arrival | 🟠 **PLACEHOLDER** — hardcoded static checklist, no data model |
| /internships | 🟠 **PLACEHOLDER** — "Coming Soon" |

## 2. Institution Portal — 9 pages

| Page | Status |
|---|---|
| /dashboard/institution | ✅ FULLY BUILT (9 metric cards, pipeline, processing time) |
| /applications, /applications/[id] | ✅ FULLY BUILT (search, pagination, doc requests, notes, IPA panels) |
| /students | ✅ FULLY BUILT (roster with filters) |
| /documents | ✅ FULLY BUILT (review queue) |
| /courses, /courses/new, /courses/[id]/edit | ✅ FULLY BUILT |
| /notifications | ✅ FULLY BUILT (sprint15) |
| /reports | 🟠 **PLACEHOLDER** — "Coming Soon" |

## 3. Admin Portal — 16 pages
All ✅ FULLY BUILT: console home (inquiry pipeline + activity feed), inquiries, students, applications, colleges, courses, documents, offer-letters, partner-applications (+detail), partners, analytics (sprint15 command center), notifications (sprint15), diagnostic (RLS self-test), settings (email config + log stats).

## 4. Partner Portal — 1 of 4 pages
| Page | Status |
|---|---|
| /dashboard/partner | 🔴 **MOCK DATA** — hardcoded `MY_CANDIDATES` array + fake commission log |
| /candidates | ❌ **MISSING** — Sidebar links to it (broken link) |
| /placements | ❌ **MISSING** — Sidebar links to it (broken link) |
| /reports | ❌ **MISSING** — Sidebar links to it (broken link) |

## 5. Employer Portal — 1 of 4 pages
| Page | Status |
|---|---|
| /dashboard/employer | 🔴 **MOCK DATA** — hardcoded `ACTIVE_INTERNS` + fake requests/history |
| /requests | ❌ **MISSING** — Sidebar links to it (broken link) |
| /interns | ❌ **MISSING** — Sidebar links to it (broken link) |
| /reports | ❌ **MISSING** — Sidebar links to it (broken link) |

## 6. Public + Auth — all built
Homepage with real section components; partner-with-us application form (DO NOT MODIFY constraint); login/signup/forgot/reset/activate/verify all functional.

## 7. Resilience coverage
- error.tsx + loading.tsx exist for admin/institution/student sections ✅
- ❌ No error.tsx/loading.tsx for `/dashboard/partner` and `/dashboard/employer`

## 8. Summary of issues (ranked)
1. 🔴 **6 broken sidebar links** — partner (3) + employer (3) nav items point to non-existent pages → 404s for activated partner/employer accounts.
2. 🔴 **2 dashboards render fabricated data** — partner + employer homes show fake candidates/interns/commissions to real logged-in users. Either gate with "portal under construction" or build real modules. (Note: building these portals was explicitly out of scope in Sprints 14–15 — decision needed.)
3. 🟠 3 "Coming Soon" placeholders: student/arrival, student/internships, institution/reports.
4. 🟢 Zero fake data anywhere in student/institution/admin portals.
