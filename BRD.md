# Business Requirements Document (BRD)
## MyStreeT Sneaker Shop — Full-Stack Capstone

**Version:** 1.0  
**Date:** 2026-05-24  
**Author:** Hitesh Kharote  
**Status:** Approved for Development  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [About the Business](#2-about-the-business)
3. [Problem Statement & Goals](#3-problem-statement--goals)
4. [Stakeholder & Roles](#4-stakeholder--roles)
5. [In-Scope Features](#5-in-scope-features)
6. [Out of Scope](#6-out-of-scope)
7. [User Flows (Happy Path)](#7-user-flows-happy-path)
8. [System Architecture](#8-system-architecture)
9. [Tech Stack (Production-Grade)](#9-tech-stack-production-grade)
10. [Monorepo Structure](#10-monorepo-structure)
11. [Data Model](#11-data-model)
12. [API Contract (OpenAPI-first)](#12-api-contract-openapi-first)
13. [Frontend Architecture](#13-frontend-architecture)
14. [Backend Architecture](#14-backend-architecture)
15. [Authentication & Security](#15-authentication--security)
16. [Hosting & Deployment](#16-hosting--deployment)
17. [CI/CD Pipeline](#17-cicd-pipeline)
18. [Non-Functional Requirements (NFRs)](#18-non-functional-requirements-nfrs)
19. [Testing Strategy](#19-testing-strategy)
20. [Database Migrations](#20-database-migrations)
21. [Seed Data](#21-seed-data)
22. [Acceptance Criteria](#22-acceptance-criteria)
23. [User Stories](#23-user-stories)
24. [Definition of Ready (DoR) & Done (DoD)](#24-definition-of-ready-dor--done-dod)
25. [Delivery Plan (Sprints)](#25-delivery-plan-sprints)
26. [Evaluation Rubric](#26-evaluation-rubric)
27. [Stretch Goals](#27-stretch-goals)
28. [Environment Variables Reference](#28-environment-variables-reference)

---

## 1. Executive Summary

MyStreeT is a sneaker e-commerce platform built as a full-stack capstone project. This BRD defines the requirements, architecture, and delivery plan for a **production-quality** implementation of the application — going beyond the foundational spec by adopting **Java 25**, **Spring Boot 4**, **React 19**, and deploying the entire stack live using **free-tier cloud infrastructure** (Vercel + Render + Neon PostgreSQL).

The codebase lives in a single **monorepo** (`mystreet-sneaker-shop`) with clearly separated `frontend/` and `backend/` apps, managed via Git and deployed via GitHub Actions.

---

## 2. About the Business

> "At MyStreeT, we love sneakers and want to make it easy for users to explore and buy the shoes they love."

This is a foundational MVP: minimal, complete, and correct. The focus is demonstrating full-stack engineering discipline — clean API design, well-structured components, solid testing, and a live deployment.

---

## 3. Problem Statement & Goals

**Problem:** Sneaker buyers need a clean, fast way to discover products, view details, manage a cart, and place orders — without noise from complex payment flows or unnecessary account features.

**Goal:** Deliver a minimal yet complete and **live** shopping flow that demonstrates production-grade full-stack fundamentals.

| Goal | Metric |
|---|---|
| Users can browse & buy sneakers | End-to-end order placement works live |
| Admin can manage product catalog | CRUD operations functional in production |
| App is live and publicly accessible | Vercel URL + Render API URL functional |
| Codebase is clean and testable | ≥ 70% backend coverage, lint-clean FE |

---

## 4. Stakeholder & Roles

### Application Roles

| Role | Description |
|---|---|
| **Guest** | Can browse products and view details. Cannot add to cart or checkout without logging in. |
| **User (Authenticated)** | Can browse, add to cart, manage cart, and place orders. |
| **Admin** | All User permissions + product CRUD (create, edit, delete). |

### Admin Flag Approach (Simple)

The `User` entity has a `boolean isAdmin` field. No RBAC table — just a flag check in service layer.

- New registrations default to `isAdmin = false`
- Seed the first admin via a Flyway migration SQL script
- Backend enforces the check; frontend shows/hides admin UI based on the JWT claim

---

## 5. In-Scope Features

### A) Authentication
- Register with email + password (BCrypt hashed)
- Login returns a signed **JWT** (access token, 24h expiry)
- Logout (client-side token removal; optional server-side token blocklist as stretch)
- `isAdmin` embedded in JWT claims

### B) Product Catalog
- Grid listing: name, price, thumbnail image, brand
- Filter by brand and size (query params)
- Product detail page: large image, description, price, size selector, add to cart

### C) Shopping Cart
- Add/remove items, update quantity
- Cart persisted in **Zustand** with `localStorage` hydration (no backend cart)
- Cart badge in header showing item count
- Subtotal calculated client-side

### D) Checkout
- Shipping address form (name, address line, city, pincode, phone)
- Payment selection: "Cash on Delivery" or "Mock UPI" (always succeeds)
- On submit: POST `/api/orders` → status = `PLACED`
- Order confirmation page showing Order ID + item summary

### E) Admin — Product Management
- Protected route (`/admin/products`) — redirects non-admins
- Table view of all products with Edit and Delete actions
- "Add Product" modal/drawer form
- Stock quantity tracked; decrements on order placement

---

## 6. Out of Scope

- Real payment gateway integration
- Email/SMS notifications
- Advanced RBAC / permissions system
- Product reviews or ratings
- Wishlists or saved items
- User profile editing
- Order cancellation or returns
- Inventory rules beyond decrement on order

---

## 7. User Flows (Happy Path)

```
1. Browse     → Guest opens "/" → sees product grid (≥8 seeded products)
2. Detail     → Clicks product → Detail page → Selects size → Clicks "Add to Cart"
3. Cart       → Opens cart drawer → Adjusts quantity → Clicks "Checkout"
4. Auth Gate  → If not logged in → Redirected to /login → Logs in / Registers
5. Checkout   → Fills shipping form → Selects payment mode → Places order
6. Confirm    → Sees Order Confirmation page with Order ID + summary
7. Admin Flow → Admin logs in → Navigates to /admin/products → Manages products
```

---

## 8. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│                                                                 │
│   React 19 + Vite 6 + TypeScript 5 + Tailwind CSS v4           │
│   TanStack Query v5 · React Router v7 · Zustand v5             │
│                                                                 │
│   Hosted on: Vercel (Edge Network, CDN, SSG/CSR)               │
└─────────────────────────┬───────────────────────────────────────┘
                          │  HTTPS (REST/JSON)
                          │  Authorization: Bearer <JWT>
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API SERVER                           │
│                                                                 │
│   Spring Boot 4 · Java 25 · Spring Security 7                  │
│   Spring Data JPA · Hibernate 7 · Flyway                       │
│   Virtual Threads (Project Loom, enabled by default in Java 25) │
│   Structured Concurrency · Springdoc OpenAPI 3                 │
│                                                                 │
│   Hosted on: Render.com (Free Web Service)                     │
└─────────────────────────┬───────────────────────────────────────┘
                          │  JDBC over SSL
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE                                   │
│                                                                 │
│   Neon PostgreSQL (Serverless, Branching, Auto-suspend)        │
│   Managed via Flyway migrations                                │
└─────────────────────────────────────────────────────────────────┘

MONOREPO LAYOUT (single Git repository)
mystreet-sneaker-shop/
├── frontend/   → deployed to Vercel
└── backend/    → deployed to Render
```

### Architecture Decisions (ADRs)

| Decision | Choice | Rationale |
|---|---|---|
| Auth mechanism | Stateless JWT | No session affinity needed; scales across Render free tier restarts |
| Cart storage | Zustand + localStorage | Avoids backend cart complexity; sufficient for MVP |
| Payment | Mock (always succeeds) | Out of scope; keeps checkout flow demonstrable |
| Java version | Java 25 | Latest LTS; virtual threads, records, pattern matching stable |
| Spring Boot | 4.x | Spring Framework 7, Jakarta EE 11 baseline |
| DB hosting | Neon | Serverless PostgreSQL; generous free tier; branching for dev/prod |
| FE hosting | Vercel | Best-in-class DX for React; zero-config CI/CD from GitHub |
| BE hosting | Render.com | Free web service; Docker-based Spring Boot deploy |

---

## 9. Tech Stack (Production-Grade)

### Backend

| Layer | Technology | Version |
|---|---|---|
| Language | Java | 25 (LTS) |
| Framework | Spring Boot | 4.x |
| Web | Spring Web MVC | via Spring Boot 4 |
| Security | Spring Security | 7.x |
| Persistence | Spring Data JPA + Hibernate | 7.x |
| DB Driver | PostgreSQL JDBC | Latest |
| Migrations | Flyway | 11.x |
| JWT | `spring-security-oauth2-resource-server` + `nimbus-jose-jwt` | Latest |
| Validation | Hibernate Validator (Bean Validation 3.1) | Latest |
| API Docs | Springdoc OpenAPI 3 | Latest compatible with Boot 4 |
| Build | Gradle (Kotlin DSL) | 8.x |
| Testing | JUnit 5, Mockito, Spring Boot Test, Testcontainers | Latest |
| Code Quality | Checkstyle, SpotBugs | Latest |

**Java 25 Features to Leverage:**
- **Records** — for DTOs (request/response bodies), no boilerplate
- **Sealed Classes + Pattern Matching** — for domain result types and error handling
- **Virtual Threads** — enabled by default in Spring Boot 4; every HTTP request runs on a virtual thread
- **Text Blocks** — for SQL in `@Query` annotations, test fixtures
- **Structured Concurrency** — for parallel external calls in service layer (if needed)
- **`SequencedCollection`** — for ordered result sets

### Frontend

| Layer | Technology | Version |
|---|---|---|
| Language | TypeScript | 5.x |
| Framework | React | 19 |
| Build Tool | Vite | 6.x |
| Routing | React Router | v7 |
| Server State | TanStack Query | v5 |
| Client State | Zustand | v5 |
| Styling | Tailwind CSS | v4 |
| UI Components | shadcn/ui | Latest |
| Forms | React Hook Form + Zod | Latest |
| HTTP Client | Axios | 1.x |
| Icons | Lucide React | Latest |
| Linting | ESLint v9 + TypeScript ESLint | Latest |
| Formatting | Prettier | 3.x |
| Package Manager | pnpm | 9.x |

### Infrastructure & DevOps

| Tool | Purpose |
|---|---|
| GitHub | Source control, PR reviews |
| GitHub Actions | CI/CD pipelines |
| Vercel | Frontend hosting + CDN + preview deployments |
| Render.com | Backend hosting (free web service) |
| Neon | Serverless PostgreSQL (free tier) |
| Docker | Local dev parity for backend |
| Docker Compose | Run full stack locally (FE + BE + DB) |

---

## 10. Monorepo Structure

```
mystreet-sneaker-shop/
│
├── .github/
│   └── workflows/
│       ├── backend-ci.yml       # Build, test, deploy BE to Render
│       └── frontend-ci.yml      # Build, lint, deploy FE to Vercel
│
├── backend/                     # Spring Boot 4 application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/mystreet/
│   │   │   │   ├── auth/        # JWT config, SecurityConfig, AuthController
│   │   │   │   ├── product/     # Product entity, repo, service, controller, DTOs
│   │   │   │   ├── order/       # Order entity, repo, service, controller, DTOs
│   │   │   │   ├── user/        # User entity, repo, service
│   │   │   │   ├── common/      # GlobalExceptionHandler, ErrorResponse record, etc.
│   │   │   │   └── MyStreetApplication.java
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       ├── application-dev.yml
│   │   │       ├── application-prod.yml
│   │   │       └── db/migration/
│   │   │           ├── V1__create_users.sql
│   │   │           ├── V2__create_products.sql
│   │   │           ├── V3__create_orders.sql
│   │   │           └── V4__seed_data.sql
│   │   └── test/
│   │       └── java/com/mystreet/
│   │           ├── product/     # ProductServiceTest, ProductControllerTest
│   │           ├── order/       # OrderServiceTest
│   │           └── auth/        # AuthServiceTest
│   ├── build.gradle.kts
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                    # React 19 + Vite 6 application
│   ├── src/
│   │   ├── api/                 # Axios instance + API functions
│   │   ├── components/          # Reusable UI components (shadcn + custom)
│   │   │   ├── ui/              # shadcn/ui primitives
│   │   │   ├── layout/          # Header, Footer, AdminLayout
│   │   │   └── shared/          # ProductCard, CartDrawer, etc.
│   │   ├── features/            # Feature-sliced directories
│   │   │   ├── auth/            # LoginPage, RegisterPage, AuthContext
│   │   │   ├── products/        # ProductListPage, ProductDetailPage, hooks
│   │   │   ├── cart/            # cart.store.ts (Zustand), CartPage
│   │   │   ├── checkout/        # CheckoutPage, OrderConfirmPage
│   │   │   └── admin/           # AdminProductsPage, ProductFormModal
│   │   ├── hooks/               # useAuth, useCart (Zustand selector wrappers)
│   │   ├── lib/                 # axios config, zod schemas, utils
│   │   ├── types/               # Shared TypeScript types/interfaces
│   │   ├── router.tsx           # React Router v7 route definitions
│   │   ├── main.tsx
│   │   └── App.tsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── .eslintrc.cjs
│   ├── package.json
│   └── .env.example
│
├── docker-compose.yml           # Local dev: postgres + backend + frontend
├── .gitignore
├── .editorconfig
└── README.md
```

---

## 11. Data Model

### Entities

```
User
  id            UUID (PK, gen_random_uuid())
  email         VARCHAR(255) UNIQUE NOT NULL
  passwordHash  VARCHAR(255) NOT NULL
  isAdmin       BOOLEAN DEFAULT false
  createdAt     TIMESTAMPTZ DEFAULT now()

Product
  id            UUID (PK)
  name          VARCHAR(255) NOT NULL
  brand         VARCHAR(100) NOT NULL
  description   TEXT
  price         NUMERIC(10,2) NOT NULL
  imageUrl      VARCHAR(500)
  sizesCsv      VARCHAR(100)         -- e.g. "7,8,9,10,11"
  stockQty      INTEGER DEFAULT 0
  createdAt     TIMESTAMPTZ DEFAULT now()
  updatedAt     TIMESTAMPTZ DEFAULT now()

Order
  id            UUID (PK)
  userId        UUID (FK → User)
  status        VARCHAR(50) DEFAULT 'PLACED'   -- PLACED | CONFIRMED | SHIPPED
  paymentMode   VARCHAR(50)                    -- MOCK_COD | MOCK_UPI
  totalAmount   NUMERIC(10,2)
  shippingName  VARCHAR(255)
  shippingAddr  TEXT
  shippingCity  VARCHAR(100)
  shippingPin   VARCHAR(20)
  shippingPhone VARCHAR(20)
  createdAt     TIMESTAMPTZ DEFAULT now()

OrderItem
  id            UUID (PK)
  orderId       UUID (FK → Order)
  productId     UUID (FK → Product)
  productName   VARCHAR(255)          -- snapshot at order time
  productPrice  NUMERIC(10,2)         -- snapshot at order time
  size          VARCHAR(10)
  quantity      INTEGER
```

### Relationships

```
User (1) ──── (M) Order
Order (1) ──── (M) OrderItem
Product (1) ──── (M) OrderItem
```

### Design Notes

- **UUID PKs** throughout — avoids sequential ID enumeration attacks
- **Price snapshot** in `OrderItem` — protects historical order values if product price changes
- **`sizesCsv`** — simple string field; avoids a separate sizes table for MVP
- **`updatedAt`** on Product — auto-updated via Flyway trigger or JPA `@PreUpdate`
- **Neon** — connection pooling via Neon's built-in PgBouncer endpoint

---

## 12. API Contract (OpenAPI-first)

Full spec defined in `backend/src/main/resources/openapi.yaml` and served via Springdoc at `/swagger-ui.html`.

### Base URL
- Local: `http://localhost:8080/api`
- Production: `https://mystreet-api.onrender.com/api`

### Auth Endpoints

```
POST   /api/auth/register
       Body: { email, password, name? }
       Response 201: { token, user: { id, email, isAdmin } }

POST   /api/auth/login
       Body: { email, password }
       Response 200: { token, user: { id, email, isAdmin } }
```

### Product Endpoints

```
GET    /api/products             ?brand=Nike&size=9&page=0&size=12
       Response 200: Page<ProductSummaryResponse>

GET    /api/products/{id}
       Response 200: ProductDetailResponse
       Response 404: ErrorResponse

POST   /api/products             [Admin only] Authorization: Bearer <token>
       Body: CreateProductRequest
       Response 201: ProductDetailResponse

PUT    /api/products/{id}        [Admin only]
       Body: UpdateProductRequest
       Response 200: ProductDetailResponse

DELETE /api/products/{id}        [Admin only]
       Response 204
```

### Order Endpoints

```
POST   /api/orders               [Authenticated]
       Body: PlaceOrderRequest { items[], shippingAddress, paymentMode }
       Response 201: OrderResponse

GET    /api/orders/mine          [Authenticated]
       Response 200: List<OrderSummaryResponse>

GET    /api/orders/{id}          [Authenticated — own orders only]
       Response 200: OrderDetailResponse
       Response 403: ErrorResponse
       Response 404: ErrorResponse
```

### Standard Error Response (Record)

```json
{
  "timestamp": "2026-05-24T10:00:00Z",
  "path": "/api/orders",
  "error": "VALIDATION_ERROR",
  "message": "Shipping address is required",
  "details": ["shippingAddr: must not be blank"]
}
```

---

## 13. Frontend Architecture

### Routing Strategy (React Router v7)

```
/                     → ProductListPage       (public)
/products/:id         → ProductDetailPage     (public)
/login                → LoginPage             (redirect if authed)
/register             → RegisterPage          (redirect if authed)
/cart                 → CartPage              (public, empty state if no items)
/checkout             → CheckoutPage          [protected — redirect to /login]
/orders/confirm/:id   → OrderConfirmPage      [protected]
/admin/products       → AdminProductsPage     [protected + admin only]
*                     → NotFoundPage
```

### State Management

| State Type | Tool | Location |
|---|---|---|
| Auth (user, token) | React Context + localStorage | `features/auth/AuthContext.tsx` |
| Server data (products, orders) | TanStack Query | `features/*/hooks/*.ts` |
| Cart | Zustand + localStorage persist | `features/cart/cart.store.ts` |
| Form state | React Hook Form | Per-form component |
| UI state (modals, drawers) | Local `useState` | Per-component |

### Key Component Guidelines

- **No prop drilling** — use TanStack Query hooks or Zustand selectors at the feature level
- **shadcn/ui** for all base components (Button, Input, Dialog, Select, Table, Badge, Toast)
- **Custom ProductCard** on top of shadcn Card primitive
- **CartDrawer** — slide-in overlay from right using shadcn Sheet
- **Optimistic updates** via TanStack Query for cart-adjacent operations
- **Error Boundary** wrapping each route for graceful degradation
- **Zod schemas** define both TypeScript types (via `z.infer`) and runtime validation

### Performance Targets (Vercel CDN)

| Metric | Target |
|---|---|
| Largest Contentful Paint (LCP) | < 2.5s |
| First Contentful Paint (FCP) | < 1.5s |
| Time to Interactive (TTI) | < 3.5s |
| Bundle size (initial JS) | < 200KB gzipped |

Achieved via: Vite code splitting per route, lazy loading heavy pages (`React.lazy`), image lazy loading, Tailwind CSS purging.

---

## 14. Backend Architecture

### Package Structure (Feature-Sliced)

Each feature module (`auth`, `product`, `order`, `user`) owns:

```
product/
  ├── Product.java             (JPA @Entity — use @Column explicitly)
  ├── ProductRepository.java   (Spring Data JPA interface)
  ├── ProductService.java      (Business logic, @Transactional)
  ├── ProductController.java   (@RestController, thin layer — delegates to service)
  ├── dto/
  │   ├── CreateProductRequest.java   (Record with Bean Validation annotations)
  │   ├── UpdateProductRequest.java   (Record)
  │   ├── ProductSummaryResponse.java (Record)
  │   └── ProductDetailResponse.java  (Record)
  └── ProductMapper.java              (Static methods or MapStruct)
```

### Java 25 Patterns to Use

```java
// DTOs as Records (immutable, auto-equals/hashCode/toString)
public record CreateProductRequest(
    @NotBlank String name,
    @NotBlank String brand,
    @NotNull @DecimalMin("0.01") BigDecimal price,
    @NotNull @Min(0) Integer stockQty,
    String imageUrl,
    String sizesCsv
) {}

// Sealed result type for service errors
public sealed interface OrderResult permits
    OrderResult.Success,
    OrderResult.InsufficientStock,
    OrderResult.UserNotFound {

    record Success(Order order) implements OrderResult {}
    record InsufficientStock(String productName) implements OrderResult {}
    record UserNotFound() implements OrderResult {}
}

// Pattern matching switch in controller
return switch (result) {
    case OrderResult.Success(var order) -> ResponseEntity.status(201).body(toResponse(order));
    case OrderResult.InsufficientStock(var name) ->
        ResponseEntity.badRequest().body(new ErrorResponse("STOCK_ERROR", name + " is out of stock"));
    case OrderResult.UserNotFound() -> ResponseEntity.status(404).build();
};
```

### Virtual Threads (Spring Boot 4 / Java 25)

Spring Boot 4 enables virtual threads for Tomcat by default when running on Java 21+. With Java 25, this is the standard. No configuration needed — every request is a virtual thread. This means blocking JDBC calls don't block OS threads, enabling high concurrency on the free Render tier.

### Exception Handling

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    // Handles ConstraintViolationException → 400 with field errors
    // Handles MethodArgumentNotValidException → 400
    // Handles EntityNotFoundException → 404
    // Handles AccessDeniedException → 403
    // Handles generic Exception → 500 (no stack trace in prod)
}
```

---

## 15. Authentication & Security

### JWT Strategy

- **Library:** `spring-security-oauth2-resource-server` + Nimbus JOSE + JWT
- **Algorithm:** RS256 (RSA key pair) — more secure than HMAC in production
- **Token payload:**
  ```json
  {
    "sub": "user-uuid",
    "email": "user@example.com",
    "isAdmin": false,
    "iat": 1748000000,
    "exp": 1748086400
  }
  ```
- **Expiry:** 24 hours (access token only; no refresh token for MVP)
- **Storage (FE):** `localStorage` (pragmatic for MVP — note: vulnerable to XSS; acceptable at this level)

### Security Rules

| Endpoint Pattern | Access |
|---|---|
| `GET /api/products/**` | Public |
| `POST/PUT/DELETE /api/products/**` | Admin only (`isAdmin = true` in JWT) |
| `POST /api/auth/**` | Public |
| `POST /api/orders` | Authenticated |
| `GET /api/orders/mine` | Authenticated |
| `GET /api/orders/{id}` | Authenticated (own orders only — service-layer check) |

### Password Security

- BCrypt with strength 12
- Minimum 8 characters enforced at API level via Bean Validation

### CORS Configuration

- Dev: `http://localhost:5173`
- Prod: Vercel deployment URL (`https://mystreet.vercel.app`)

---

## 16. Hosting & Deployment

### Frontend — Vercel

| Setting | Value |
|---|---|
| Root directory | `frontend/` |
| Build command | `pnpm run build` |
| Output directory | `dist` |
| Node version | 22.x |
| Environment variable | `VITE_API_BASE_URL=https://mystreet-api.onrender.com/api` |

- Every push to `main` triggers a production deploy
- Every PR gets a preview URL (Vercel preview deployments)
- SPA routing: `vercel.json` rewrites all routes to `index.html`

```json
// frontend/vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Backend — Render.com (Free Web Service)

| Setting | Value |
|---|---|
| Environment | Docker |
| Dockerfile path | `backend/Dockerfile` |
| Port | 8080 |
| Plan | Free (spins down after 15min inactivity; cold start ~30s) |

**Dockerfile (multi-stage build):**

```dockerfile
# Stage 1: Build
FROM eclipse-temurin:25-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN ./gradlew bootJar --no-daemon

# Stage 2: Runtime (minimal JRE image)
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Database — Neon PostgreSQL

| Setting | Value |
|---|---|
| Plan | Free (0.5 GB storage, compute auto-suspends) |
| Branches | `main` (production), `dev` (development) |
| Connection | Pooled endpoint (PgBouncer) for production; direct for local |
| SSL | Required (`sslmode=require`) |

**application-prod.yml snippet:**
```yaml
spring:
  datasource:
    url: ${DATABASE_URL}   # Neon pooled connection string from env var
    hikari:
      maximum-pool-size: 5   # Neon free tier limit
      connection-timeout: 30000
  jpa:
    hibernate:
      ddl-auto: validate    # Flyway owns schema; JPA only validates
    show-sql: false
  flyway:
    enabled: true
    locations: classpath:db/migration
```

---

## 17. CI/CD Pipeline

### Backend CI (`.github/workflows/backend-ci.yml`)

```
Trigger: push/PR to main (changes in backend/**)

Steps:
1. Setup Java 25
2. Cache Gradle dependencies
3. Run ./gradlew test (JUnit 5 + Testcontainers against real Postgres)
4. Run ./gradlew check (Checkstyle, SpotBugs)
5. Build Docker image
6. Deploy to Render via Render Deploy Hook (HTTP POST)
```

### Frontend CI (`.github/workflows/frontend-ci.yml`)

```
Trigger: push/PR to main (changes in frontend/**)

Steps:
1. Setup Node 22 + pnpm
2. Cache pnpm store
3. pnpm install --frozen-lockfile
4. pnpm run lint (ESLint v9)
5. pnpm run type-check (tsc --noEmit)
6. pnpm run build
7. Vercel CLI deploy (production on main, preview on PR)
```

### Branch Strategy

```
main           → stable; protected; triggers production deploy
feature/*      → PR branch; triggers preview deploy (Vercel) + CI (GitHub Actions)
fix/*          → Bug fix branches
```

---

## 18. Non-Functional Requirements (NFRs)

### Performance

| Metric | Target | Environment |
|---|---|---|
| API response time (p95) | < 500ms (excluding cold start) | Render production |
| Page load (LCP) | < 2.5s | Vercel CDN |
| Cold start (Render free) | < 45s | Expected; acceptable |

### Security

- Passwords hashed with BCrypt (strength 12)
- No secrets in source code — all via environment variables
- HTTPS enforced on both Vercel and Render
- Input validation at API boundary (Bean Validation + Zod on FE)
- SQL injection prevention via JPA parameterized queries
- XSS prevention via React's JSX escaping
- CORS restricted to known origins

### Scalability

- Virtual threads handle blocking I/O efficiently on single Render instance
- Neon auto-suspends to minimize DB compute usage on free tier
- Stateless JWT means no sticky sessions needed

### Observability

- Structured JSON logging via Logback (Spring Boot default) with profile-specific config
- Actuator endpoints: `/actuator/health`, `/actuator/info` (public)
- Vercel Analytics for frontend (free tier)

---

## 19. Testing Strategy

### Backend

| Layer | Tool | Scope | Coverage Target |
|---|---|---|---|
| Unit (Service) | JUnit 5 + Mockito | Business logic, edge cases | ≥ 70% |
| Integration (Controller) | `@SpringBootTest` + MockMvc | REST contract, auth, validation | Key flows |
| Integration (DB) | Testcontainers (PostgreSQL) | Repository queries, Flyway migrations | Critical queries |
| API | Postman collection | Manual + Newman in CI | All endpoints |

**Key test cases:**
- Register + Login → JWT returned
- Unauthenticated access to protected endpoint → 401
- Non-admin accessing admin endpoint → 403
- Place order → stock decremented + order created
- Filter products by brand/size → correct results
- Invalid checkout data → structured 400 error

### Frontend

| Layer | Tool | Scope |
|---|---|---|
| Component | Vitest + React Testing Library | CartStore logic, form validation |
| Type checking | TypeScript strict mode | All files |
| Lint | ESLint v9 + TypeScript ESLint | Zero errors required |

---

## 20. Database Migrations

Managed by **Flyway**. Versioned SQL scripts in `backend/src/main/resources/db/migration/`.

```
V1__create_users.sql         → users table
V2__create_products.sql      → products table
V3__create_orders.sql        → orders + order_items tables
V4__seed_data.sql            → admin user + 10 sample products
V5__add_updated_at_trigger.sql → auto-update updatedAt on products
```

All migrations run automatically on startup. Production uses `spring.jpa.hibernate.ddl-auto=validate` — Flyway owns the schema, Hibernate never modifies it.

---

## 21. Seed Data

```sql
-- V4__seed_data.sql

-- Admin user (password: Admin@1234)
INSERT INTO users (id, email, password_hash, is_admin, created_at)
VALUES (gen_random_uuid(), 'admin@mystreet.com',
        '$2a$12$PH4zXtG7VGV.CbNV2vFnO.Yp3K9mW4xL1gH8sQ2jA6fT0nR5dEuKi',
        true, now());

-- Sample Products
INSERT INTO products (id, name, brand, description, price, image_url, sizes_csv, stock_qty, created_at)
VALUES
  (gen_random_uuid(), 'Air Max 90',     'Nike',    'Classic retro cushioning',        119.99, 'https://picsum.photos/seed/airmax90/400/400',  '7,8,9,10',       50, now()),
  (gen_random_uuid(), 'Air Force 1',    'Nike',    'Timeless street style',            89.99, 'https://picsum.photos/seed/airforce1/400/400', '7,8,9,10,11',    40, now()),
  (gen_random_uuid(), 'Ultraboost 23',  'Adidas',  'Responsive Boost cushioning',     139.99, 'https://picsum.photos/seed/ultra23/400/400',   '7,8,9,10,11',    35, now()),
  (gen_random_uuid(), 'Stan Smith',     'Adidas',  'Minimalist tennis classic',        79.99, 'https://picsum.photos/seed/stansmith/400/400', '6,7,8,9,10',     60, now()),
  (gen_random_uuid(), 'Chuck Taylor',   'Converse', 'Iconic canvas high-top',          59.99, 'https://picsum.photos/seed/chuck/400/400',     '6,7,8,9,10,11',  80, now()),
  (gen_random_uuid(), 'Old Skool',      'Vans',    'Skate-inspired side stripe',       69.99, 'https://picsum.photos/seed/oldskool/400/400',  '7,8,9,10',       45, now()),
  (gen_random_uuid(), 'Speedcat OG',    'Puma',    'Racing-inspired street shoe',      89.99, 'https://picsum.photos/seed/speedcat/400/400',  '7,8,9,10,11',    30, now()),
  (gen_random_uuid(), 'Gel-Kayano 31',  'ASICS',   'Premium stability running',       159.99, 'https://picsum.photos/seed/kayano/400/400',    '7,8,9,10',       25, now()),
  (gen_random_uuid(), 'Dunk Low',       'Nike',    'Court silhouette reimagined',      99.99, 'https://picsum.photos/seed/dunklow/400/400',   '7,8,9,10,11',    55, now()),
  (gen_random_uuid(), 'Samba OG',       'Adidas',  'Vintage court vibes',              89.99, 'https://picsum.photos/seed/samba/400/400',     '7,8,9,10',       40, now());
```

---

## 22. Acceptance Criteria

### Product Listing
- [ ] Guest visits `/` and sees ≥ 8 products with name, price, image, brand
- [ ] Filter by brand returns only matching products
- [ ] Filter by size returns only products offering that size
- [ ] Clicking a product navigates to detail page

### Authentication
- [ ] Register with new email → 201 → JWT stored → user redirected to home
- [ ] Register with existing email → 400 with clear error message
- [ ] Login with correct credentials → 200 → JWT stored
- [ ] Login with wrong password → 401 with clear message
- [ ] After page refresh, authenticated session is restored from localStorage
- [ ] Logout clears token and redirects to home

### Cart
- [ ] Adding a product + size updates cart badge in header
- [ ] Cart persists across page refreshes (localStorage)
- [ ] Removing last item shows empty cart state
- [ ] Quantity change updates subtotal immediately

### Checkout
- [ ] Unauthenticated user clicking Checkout → redirected to `/login`
- [ ] All shipping fields are required — shows inline validation errors
- [ ] Successful checkout → `POST /api/orders` → 201
- [ ] Order confirmation page shows Order ID and item summary
- [ ] Product stock decrements after order is placed

### Admin
- [ ] Non-admin user visiting `/admin/products` → redirected to home
- [ ] Admin can create a product → appears in catalog immediately
- [ ] Admin can edit a product → changes reflected immediately
- [ ] Admin can delete a product → removed from catalog

---

## 23. User Stories

**As a guest...**
- I want to browse sneaker listings so I can discover products without logging in
- I want to filter by brand and size so I can find sneakers that fit me
- I want to view a product detail page so I can see full information before deciding

**As a user...**
- I want to register with my email so I can place orders
- I want to add items to my cart so I can buy multiple products at once
- I want my cart to persist after page refresh so I don't lose my selection
- I want to complete checkout with a shipping address so I can receive my order
- I want to see an order confirmation with an order ID so I know my order was placed
- I want to view my past orders so I can track what I bought

**As an admin...**
- I want to add new products so the catalog stays up to date
- I want to edit existing products so I can fix pricing or description errors
- I want to delete products so I can remove discontinued items

---

## 24. Definition of Ready (DoR) & Done (DoD)

### Definition of Ready (before starting a story)
- [ ] User story has clear acceptance criteria
- [ ] API changes identified (endpoint, request/response shape)
- [ ] UI reference exists (wireframe or description)
- [ ] Story is estimated and fits within a sprint

### Definition of Done (before marking complete)
- [ ] Code compiles with zero errors and zero lint warnings
- [ ] Backend unit tests written and passing for new service logic
- [ ] All acceptance criteria manually verified (Postman for API, browser for UI)
- [ ] Flyway migration written (if schema changed)
- [ ] No hardcoded secrets or localhost URLs in committed code
- [ ] PR reviewed and merged to `main`
- [ ] Feature works on live Vercel + Render deployment (not just localhost)

---

## 25. Delivery Plan (Sprints)

### Sprint 1 — Foundations & Product Catalog (Week 1–2)
**Backend:**
- [ ] Monorepo initialized, Gradle + Vite configured
- [ ] Neon DB provisioned; Render service created
- [ ] Flyway migrations V1–V3 (schema) + V4 (seed)
- [ ] `Product` entity, repository, service, controller
- [ ] `GET /api/products` with brand/size filtering
- [ ] `GET /api/products/{id}`
- [ ] Swagger UI working at `/swagger-ui.html`
- [ ] Backend deployed to Render

**Frontend:**
- [ ] React + Vite project scaffolded with shadcn/ui + Tailwind v4
- [ ] Axios client configured with base URL from env
- [ ] Router configured (all routes defined, pages as stubs)
- [ ] `ProductListPage` — grid with TanStack Query fetch
- [ ] `ProductDetailPage` — detail view
- [ ] Header component with nav and cart badge
- [ ] Frontend deployed to Vercel

### Sprint 2 — Auth & Cart (Week 3–4)
**Backend:**
- [ ] Spring Security 7 + JWT (RS256) configured
- [ ] `POST /api/auth/register` and `POST /api/auth/login`
- [ ] Admin-only guard on product write endpoints
- [ ] AuthService unit tests

**Frontend:**
- [ ] AuthContext + useAuth hook
- [ ] LoginPage + RegisterPage (React Hook Form + Zod)
- [ ] Token stored in localStorage; Axios interceptor adds `Authorization` header
- [ ] Protected route wrapper (redirects to login)
- [ ] Admin route guard (redirects non-admins to home)
- [ ] Zustand cart store with localStorage persistence
- [ ] CartDrawer (shadcn Sheet) with add/remove/quantity controls
- [ ] CartPage full view

### Sprint 3 — Checkout, Orders & Admin (Week 5–6)
**Backend:**
- [ ] `Order` + `OrderItem` entities
- [ ] `POST /api/orders` — validates stock, decrements, creates order
- [ ] `GET /api/orders/mine`
- [ ] `GET /api/orders/{id}` (own order only)
- [ ] Product CRUD (POST/PUT/DELETE) — admin only
- [ ] OrderService + ProductService integration tests (Testcontainers)
- [ ] ≥ 70% backend coverage achieved

**Frontend:**
- [ ] CheckoutPage — shipping form + payment selection
- [ ] Place order → navigate to `/orders/confirm/:id`
- [ ] OrderConfirmPage
- [ ] AdminProductsPage — table + add/edit/delete
- [ ] ProductFormModal (shadcn Dialog)
- [ ] Postman collection exported and committed
- [ ] README.md finalized with setup steps, env vars, seed instructions

---

## 26. Evaluation Rubric

| Area | What We Check | Weight |
|---|---|---|
| **Frontend** | Routing, hooks, TanStack Query, Zustand, Zod, TypeScript strict, component structure | 25% |
| **Backend** | Clean REST controllers, sealed types, records as DTOs, virtual threads, JPA, validation, global error handler | 25% |
| **Common Skills** | Java 25 idioms, SQL/JPA correctness, SOLID basics, Git hygiene, structured commits | 20% |
| **Testing** | JUnit 5 + Mockito for services; Testcontainers for DB; Postman collection; ≥ 70% BE coverage | 15% |
| **Live Deployment** | App accessible on Vercel URL; API reachable on Render; DB on Neon; Swagger live | 10% |
| **Documentation** | README with setup, env vars, seed instructions; OpenAPI spec; code comments where non-obvious | 5% |

---

## 27. Stretch Goals

Priority-ordered — attempt if core delivery is ahead of schedule:

1. **Pagination** — `GET /api/products?page=0&pageSize=12` with `Page<>` response; `Pagination` component on FE
2. **Search** — `?q=ultraboost` filter on product list
3. **Order Status** — Admin can update order status (`PLACED → SHIPPED`)
4. **Image Upload** — Product images via Cloudinary free tier instead of picsum URLs
5. **Rate Limiting** — Spring `bucket4j` or Resilience4j on auth endpoints
6. **Refresh Token** — Issue short-lived access token + long-lived refresh token (HTTP-only cookie)
7. **Dark Mode** — Tailwind `dark:` classes + system preference detection

---

## 28. Environment Variables Reference

### Backend (`backend/.env.example`)

```env
# Database (Neon)
DATABASE_URL=jdbc:postgresql://ep-xxx.neon.tech/mystreet?sslmode=require
DATABASE_USERNAME=mystreet_user
DATABASE_PASSWORD=secret

# JWT (generate RSA key pair with: openssl genrsa -out private.pem 2048)
JWT_PRIVATE_KEY=classpath:certs/private.pem
JWT_PUBLIC_KEY=classpath:certs/public.pem
JWT_EXPIRY_HOURS=24

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://mystreet.vercel.app

# App
SPRING_PROFILES_ACTIVE=prod
```

### Frontend (`frontend/.env.example`)

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

**Production (set in Vercel dashboard):**
```env
VITE_API_BASE_URL=https://mystreet-api.onrender.com/api
```

---

## Appendix — Local Development Quickstart

```bash
# 1. Clone the repo
git clone https://github.com/hitesh.kharote/mystreet-sneaker-shop.git
cd mystreet-sneaker-shop

# 2. Start local Postgres (or point to Neon dev branch)
docker compose up -d postgres

# 3. Run backend (applies Flyway migrations + seeds on startup)
cd backend
cp .env.example .env    # fill in values
./gradlew bootRun --args='--spring.profiles.active=dev'

# 4. Run frontend (separate terminal)
cd frontend
pnpm install
cp .env.example .env    # VITE_API_BASE_URL=http://localhost:8080/api
pnpm run dev            # → http://localhost:5173

# 5. API Docs
open http://localhost:8080/swagger-ui.html

# 6. Default admin login
Email:    admin@mystreet.com
Password: Admin@1234
```

---

*This document is the single source of truth for the MyStreeT capstone. All architectural decisions, API contracts, and delivery milestones are defined here. Update this document when decisions change — do not let it drift from implementation.*
