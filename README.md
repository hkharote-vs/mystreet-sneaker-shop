# MyStreeT Sneaker Shop

Full-stack sneaker e-commerce app. React 19 + Spring Boot 3.5 + Java 21.

## Live Demo

| | URL |
|---|---|
| **Frontend** | https://mystreet-sneaker-shop.vercel.app |
| **API Docs (Swagger)** | https://mystreet-api.onrender.com/swagger-ui.html |
| **Demo Admin** | admin@mystreet.com / Admin@1234 |
| **Demo User** | user@mystreet.com / User@1234 |

> The backend runs on Render's free tier — first request after inactivity may take ~30s to warm up.

## Tech Stack
- **Frontend:** React 19, Vite 8, TypeScript 6, Tailwind CSS v4, TanStack Query v5, Zustand v5, React Router v7
- **Backend:** Java 21, Spring Boot 3.5, Spring Security 6 (JWT RS256), Hibernate 6, Flyway
- **DB (dev):** H2 in-memory | **DB (prod):** Neon PostgreSQL
- **Package manager:** pnpm 11

## Local Development

### Prerequisites
- Java 21 (Temurin)
- Node 22+ with pnpm (`npm install -g pnpm`)

### Backend
```bash
cd backend
# Dev profile uses H2 — no DB install needed
SPRING_PROFILES_ACTIVE=dev ./gradlew bootRun
# API: http://localhost:8080
# Swagger: http://localhost:8080/swagger-ui.html
# H2 Console: http://localhost:8080/h2-console
```

### Frontend
```bash
cd frontend
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:8080/api
pnpm install
pnpm run dev           # http://localhost:5173
```

## Test Credentials (seeded)
| Role  | Email                 | Password   |
|-------|-----------------------|------------|
| Admin | admin@mystreet.com    | Admin@1234 |
| User  | user@mystreet.com     | User@1234  |

## Development Specs
See [`specs/README.md`](specs/README.md) for the full spec-driven development plan.

## Running Tests
```bash
# Backend unit + controller tests (no Docker needed)
cd backend && ./gradlew test

# Backend integration tests (requires Docker)
cd backend && ./gradlew integrationTest

# Frontend type check
cd frontend && pnpm run type-check
```
