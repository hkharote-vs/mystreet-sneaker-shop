# MyStreeT — Spec-Driven Development Index

All feature specs live here. Work through them **in order**. Each spec must be fully implemented, locally verified, and all acceptance criteria checked before moving to the next.

---

## Development Workflow (per spec)

```
1. Read the spec completely before writing any code
2. Implement exactly what the spec defines — no more, no less
3. Run the verification steps listed at the bottom of the spec
4. Check off every acceptance criterion
5. Run tests: backend → ./gradlew test | frontend → pnpm run type-check && pnpm run lint
6. Mark spec status as [x] Done
7. Move to next spec
```

---

## Spec Order & Status

| # | Spec | Layer | Status | Depends On |
|---|---|---|---|---|
| 00 | [Project Setup & Infrastructure](./00-project-setup.md) | Both | `[x] Complete` | — |
| 01 | [Database Schema & Migrations](./01-database-schema.md) | DB | `[x] Complete` | SPEC-00 |
| 02 | [Authentication — Backend](./02-auth-backend.md) | BE | `[x] Complete` | SPEC-01 |
| 03 | [Product Catalog — Backend](./03-product-backend.md) | BE | `[x] Complete` | SPEC-01, SPEC-02 |
| 04 | [Orders — Backend](./04-order-backend.md) | BE | `[x] Complete` | SPEC-01, SPEC-02, SPEC-03 |
| 05 | [Frontend Setup & Shell](./05-frontend-setup.md) | FE | `[x] Complete` | SPEC-00 |
| 06 | [Authentication — Frontend](./06-auth-frontend.md) | FE | `[x] Complete` | SPEC-05, SPEC-02 |
| 07 | [Product Catalog — Frontend](./07-product-frontend.md) | FE | `[x] Complete` | SPEC-05, SPEC-03 |
| 08 | [Shopping Cart — Frontend](./08-cart-frontend.md) | FE | `[x] Complete` | SPEC-05, SPEC-07 |
| 09 | [Checkout & Orders — Frontend](./09-checkout-frontend.md) | FE | `[x] Complete` | SPEC-05, SPEC-06, SPEC-08, SPEC-04 |
| 10 | [Admin — Product Management](./10-admin-frontend.md) | FE | `[x] Complete` | SPEC-05, SPEC-06, SPEC-03 |
| 11 | [Testing Strategy & Execution](./11-testing.md) | BE | `[ ] Not Started` | SPEC-02, SPEC-03, SPEC-04 |
| 12 | [Deployment — Vercel + Render + Neon](./12-deployment.md) | Infra | `[ ] Not Started` | All |
| 13 | [Realistic Product Data — CSV Import](./13-realistic-product-data.md) | Both | `[x] Complete` | SPEC-03, SPEC-10 |

---

## Sprint Mapping

| Sprint | Specs | Goal |
|---|---|---|
| **Sprint 1** (Wk 1–2) | SPEC-00 → SPEC-01 → SPEC-03 → SPEC-05 → SPEC-07 | Live product catalog (read-only) |
| **Sprint 2** (Wk 3–4) | SPEC-02 → SPEC-06 → SPEC-08 | Auth + Cart working |
| **Sprint 3** (Wk 5–6) | SPEC-04 → SPEC-09 → SPEC-10 → SPEC-11 → SPEC-12 | Checkout + Admin + Tests + Live Deploy |

---

## Quick Reference — Local Dev

```bash
# DB
docker compose up -d postgres

# Backend (from backend/)
SPRING_PROFILES_ACTIVE=dev ./gradlew bootRun

# Frontend (from frontend/)
pnpm run dev

# Backend tests
./gradlew test

# Frontend checks
pnpm run type-check && pnpm run lint
```

## Quick Reference — Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@mystreet.com | Admin@1234 |
| User | user@mystreet.com | User@1234 |

---

## What Each Spec Contains

Every spec file has:
- **Overview** — what this feature does and why
- **Files to create** — exact package/directory structure
- **Implementation** — complete class/component code (not pseudo-code)
- **API contracts** — request/response JSON shapes
- **Behavior specification** — exact UX flows in prose
- **Manual verification steps** — step-by-step to confirm it works
- **Acceptance criteria** — checkbox list, all must pass before moving on
