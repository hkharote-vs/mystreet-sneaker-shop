# SPEC-12: Deployment — Live on Vercel + Render + Neon

**Status:** `[ ] Not Started`  
**Depends on:** SPEC-11 (all tests pass), all features complete  
**Blocks:** Nothing (final milestone)  

---

## Overview

Deploy the full stack live. Frontend to Vercel, backend to Render, database to Neon PostgreSQL. Configure GitHub Actions for automated CI/CD. After this spec, the app is publicly accessible and all changes to `main` trigger automatic deploys.

---

## 1. Neon PostgreSQL Setup

### Steps

1. Go to https://neon.tech → Sign up (free)
2. Create a new project: `mystreet-sneaker-shop`
3. Neon creates a `main` branch with a PostgreSQL database
4. Go to **Dashboard → Connection Details**
5. Select **Pooled connection** (PgBouncer) for production
6. Copy the connection string format:

```
postgresql://mystreet_user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/mystreet?sslmode=require
```

7. For Spring Boot JDBC format (add `?sslmode=require`):
```
jdbc:postgresql://ep-xxx-xxx.us-east-2.aws.neon.tech/mystreet?sslmode=require
```

### Create Dev Branch (Optional but recommended)

```
Neon Dashboard → Branches → New Branch
Name: dev
Branch from: main
```

Use the `dev` branch connection string for local development against cloud DB (alternative to Docker Compose).

### Environment variables to collect

```env
DATABASE_URL=jdbc:postgresql://ep-xxx.neon.tech/mystreet?sslmode=require
DATABASE_USERNAME=mystreet_user
DATABASE_PASSWORD=<from neon dashboard>
```

---

## 2. RSA Key Pair for Production

Generate once, store securely:

```bash
# From backend/ directory
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Copy the full contents — they'll be set as env vars on Render
cat private.pem   # copy all lines including -----BEGIN RSA PRIVATE KEY-----
cat public.pem    # copy all lines including -----BEGIN PUBLIC KEY-----
```

In production, the private key value is set as an environment variable:
```env
JWT_PRIVATE_KEY_VALUE=-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...
```

Update `SecurityConfig` to read from env var string when not running locally:

```java
// Alternative: load from string env var
@Value("${app.jwt.private-key-value:#{null}}")
private String privateKeyValue;

// In jwtEncoder bean: if privateKeyValue != null, parse from string
// otherwise fall back to classpath resource
```

Or simpler: use `SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_PUBLIC_KEY_LOCATION` Spring property overrides.

---

## 3. Render.com Backend Setup

### Steps

1. Go to https://render.com → Sign up (free)
2. New → **Web Service**
3. Connect your GitHub repository
4. Configure:

| Setting | Value |
|---|---|
| Name | `mystreet-api` |
| Region | Oregon (US West) or Singapore |
| Branch | `main` |
| Root Directory | `backend` |
| Runtime | **Docker** |
| Dockerfile Path | `./Dockerfile` |
| Instance Type | Free |
| Health Check Path | `/actuator/health` |
| Auto-Deploy | Yes (on push to main) |

5. Environment Variables (set in Render dashboard → Environment):

```env
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=jdbc:postgresql://ep-xxx.neon.tech/mystreet?sslmode=require
DATABASE_USERNAME=mystreet_user
DATABASE_PASSWORD=<from neon>
JWT_PRIVATE_KEY=<see note above — multiline env var>
JWT_PUBLIC_KEY=<public key multiline>
JWT_EXPIRY_HOURS=24
CORS_ALLOWED_ORIGINS=https://mystreet.vercel.app
```

6. After first deploy, note the service URL: `https://mystreet-api.onrender.com`

### Render Free Tier Notes

- Service sleeps after 15 minutes of inactivity
- Cold start takes ~30–45 seconds
- 750 hours/month free (enough for one service running continuously)
- Build time counts against the free limit

### `backend/Dockerfile` (final production version)

```dockerfile
# Stage 1: Build
FROM eclipse-temurin:25-jdk-alpine AS build
WORKDIR /app

# Copy gradle wrapper and build files first (layer caching)
COPY gradlew .
COPY gradle gradle/
COPY build.gradle.kts settings.gradle.kts ./
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon --quiet

# Copy source and build
COPY src src/
RUN ./gradlew bootJar --no-daemon -x test

# Stage 2: Minimal runtime image
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Non-root user for security
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -s /bin/sh -D appuser
USER appuser

COPY --from=build --chown=appuser:appgroup /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", \
    "-XX:+UseZGC", \
    "-XX:MaxRAMPercentage=75.0", \
    "-jar", "app.jar"]
```

---

## 4. Vercel Frontend Setup

### Steps

1. Go to https://vercel.com → Sign up with GitHub
2. **New Project** → Import your repository
3. Configure:

| Setting | Value |
|---|---|
| Project Name | `mystreet` |
| Framework | Vite |
| Root Directory | `frontend` |
| Build Command | `pnpm run build` |
| Output Directory | `dist` |
| Install Command | `pnpm install` |

4. Environment Variables (in Vercel dashboard → Settings → Environment Variables):

```env
VITE_API_BASE_URL=https://mystreet-api.onrender.com/api
```

Set this for **Production**, **Preview**, and **Development** environments.

5. Click **Deploy**

6. Note the production URL: `https://mystreet.vercel.app` (or custom domain)

7. Go back to Render and update:
```env
CORS_ALLOWED_ORIGINS=https://mystreet.vercel.app
```

### `frontend/vercel.json`

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## 5. GitHub Actions CI/CD

### `.github/workflows/backend-ci.yml` (full production version)

```yaml
name: Backend CI/CD

on:
  push:
    branches: [main]
    paths: ['backend/**', '.github/workflows/backend-ci.yml']
  pull_request:
    branches: [main]
    paths: ['backend/**']

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          java-version: '25'
          distribution: 'temurin'
          cache: gradle

      - name: Run tests
        working-directory: backend
        run: ./gradlew test jacocoTestReport --no-daemon

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: backend/build/reports/jacoco/test/html/

  deploy:
    name: Deploy to Render
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - name: Trigger Render Deploy
        run: |
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}" \
            --fail \
            --silent \
            --show-error
```

**Setup**: In Render dashboard → your service → Settings → Deploy Hooks → Create a deploy hook URL. Add it as `RENDER_DEPLOY_HOOK_URL` secret in GitHub repository secrets.

### `.github/workflows/frontend-ci.yml` (full production version)

```yaml
name: Frontend CI/CD

on:
  push:
    branches: [main]
    paths: ['frontend/**', '.github/workflows/frontend-ci.yml']
  pull_request:
    branches: [main]
    paths: ['frontend/**']

jobs:
  quality:
    name: Lint, Type Check & Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
          cache-dependency-path: frontend/pnpm-lock.yaml

      - name: Install dependencies
        working-directory: frontend
        run: pnpm install --frozen-lockfile

      - name: Type check
        working-directory: frontend
        run: pnpm run type-check

      - name: Lint
        working-directory: frontend
        run: pnpm run lint

      - name: Build
        working-directory: frontend
        env:
          VITE_API_BASE_URL: https://mystreet-api.onrender.com/api
        run: pnpm run build

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: frontend-dist
          path: frontend/dist/
```

**Note:** Vercel automatically deploys on push via its own GitHub integration (configured during Vercel setup). The GitHub Action above validates quality before Vercel sees the push.

---

## 6. Deployment Smoke Tests

Run these after deployment to verify the live stack:

```bash
export BE=https://mystreet-api.onrender.com/api
export FE=https://mystreet.vercel.app

# Backend health
curl $BE/../actuator/health
# Expected: {"status":"UP"}

# Swagger UI accessible
curl -I $BE/../swagger-ui.html
# Expected: HTTP 302 or 200

# Public product list
curl $BE/products | jq 'length'
# Expected: 10

# Admin login works
TOKEN=$(curl -s -X POST $BE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mystreet.com","password":"Admin@1234"}' | jq -r .token)
echo $TOKEN
# Expected: non-empty JWT string

# Frontend loads
curl -I $FE
# Expected: HTTP 200

# SPA routing works (not 404)
curl -I $FE/login
# Expected: HTTP 200 (Vercel rewrites to index.html)

curl -I $FE/products/some-id
# Expected: HTTP 200
```

---

## 7. Environment Summary

| Environment | Frontend URL | Backend URL | Database |
|---|---|---|---|
| Local Dev | `http://localhost:5173` | `http://localhost:8080` | Docker Postgres |
| Production | `https://mystreet.vercel.app` | `https://mystreet-api.onrender.com` | Neon (main branch) |
| PR Preview | `https://mystreet-git-{branch}.vercel.app` | `https://mystreet-api.onrender.com` | Neon (main) |

---

## 8. README.md Update

The root `README.md` must include:

```markdown
# MyStreeT Sneaker Shop

Full-stack sneaker e-commerce app built with React 19 + Spring Boot 4 + Java 25.

## Live Demo
- **Frontend:** https://mystreet.vercel.app
- **API:** https://mystreet-api.onrender.com/swagger-ui.html
- **Demo admin:** admin@mystreet.com / Admin@1234

## Tech Stack
- Frontend: React 19, Vite 6, TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query, Zustand
- Backend: Java 25, Spring Boot 4, Spring Security 7 (JWT RS256), Hibernate 7, Flyway
- Database: Neon PostgreSQL
- Hosting: Vercel (FE), Render.com (BE)

## Local Development

### Prerequisites
- Java 25 (Eclipse Temurin)
- Node 22 + pnpm
- Docker Desktop

### Setup

# 1. Clone
git clone https://github.com/hitesh.kharote/mystreet-sneaker-shop.git
cd mystreet-sneaker-shop

# 2. Start local database
docker compose up -d postgres

# 3. Run backend
cd backend
cp .env.example .env
# Fill in DATABASE_URL, JWT keys (see README for key generation)
./gradlew bootRun

# 4. Run frontend
cd frontend
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:8080/api
pnpm install
pnpm run dev

# 5. Access
open http://localhost:5173
open http://localhost:8080/swagger-ui.html

## Test Credentials
- Admin: admin@mystreet.com / Admin@1234
- User: user@mystreet.com / User@1234

## Running Tests
cd backend && ./gradlew test
```

---

## Acceptance Criteria

- [ ] Neon database created, connection string obtained
- [ ] Flyway migrations run successfully on Neon on first backend deploy
- [ ] Render service deploys successfully (green in Render dashboard)
- [ ] `GET https://mystreet-api.onrender.com/actuator/health` returns `{"status":"UP"}`
- [ ] `GET https://mystreet-api.onrender.com/api/products` returns 10 products
- [ ] Admin login works via the live API
- [ ] Vercel deployment succeeds (green in Vercel dashboard)
- [ ] `https://mystreet.vercel.app` loads the product catalog
- [ ] SPA routing works on Vercel (navigating to `/login` directly returns 200)
- [ ] Full end-to-end flow works on live URLs: browse → register → add to cart → checkout → confirm
- [ ] Admin can manage products on the live site
- [ ] GitHub Actions runs and passes on push to `main`
- [ ] `RENDER_DEPLOY_HOOK_URL` configured as GitHub secret
- [ ] README.md updated with live URLs, setup instructions, test credentials
