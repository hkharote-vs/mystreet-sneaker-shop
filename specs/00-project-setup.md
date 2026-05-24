# SPEC-00: Project Setup & Infrastructure

**Status:** `[ ] Not Started`  
**Depends on:** Nothing  
**Blocks:** All other specs  

---

## Overview

Initialize the monorepo with both the Spring Boot 4 (Java 25) backend and React 19 (Vite 6) frontend. Configure all tooling, Docker Compose for local development, and validate that both apps boot and can talk to each other before any feature code is written.

This is the foundation — every subsequent spec assumes this is done and passing.

---

## Deliverables

- [ ] `backend/` — Spring Boot 4 project scaffolded and boots clean
- [ ] `frontend/` — React 19 + Vite 6 project scaffolded and boots clean
- [ ] `docker-compose.yml` — starts local Postgres + backend + frontend
- [ ] `backend/Dockerfile` — multi-stage Java 25 build
- [ ] `.github/workflows/backend-ci.yml` — CI skeleton (build + test)
- [ ] `.github/workflows/frontend-ci.yml` — CI skeleton (lint + build)
- [ ] Both `.env.example` files in place
- [ ] Root `README.md` with local setup instructions
- [ ] `.editorconfig` and `.gitignore` in place

---

## 1. Root Monorepo Files

### `.gitignore`
```
# Java / Gradle
backend/.gradle/
backend/build/
backend/out/
*.class
*.jar
!gradle-wrapper.jar

# Node / pnpm
frontend/node_modules/
frontend/dist/
frontend/.pnpm-store/
.pnpm-debug.log

# Environment
.env
.env.local
.env.*.local
!.env.example

# IDE
.idea/
.vscode/
*.iml

# OS
.DS_Store
Thumbs.db

# Docker
docker-compose.override.yml
```

### `.editorconfig`
```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 4
trim_trailing_whitespace = true
insert_final_newline = true

[*.{yml,yaml,json,ts,tsx,js,jsx,css,html}]
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

### `docker-compose.yml`
```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    container_name: mystreet-postgres
    environment:
      POSTGRES_DB: mystreet
      POSTGRES_USER: mystreet
      POSTGRES_PASSWORD: mystreet_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mystreet"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

---

## 2. Backend Setup (`backend/`)

### Technology
- Java 25 (Eclipse Temurin distribution)
- Spring Boot 4.x
- Gradle 8.x with Kotlin DSL (`build.gradle.kts`)
- Package: `com.mystreet`

### `backend/build.gradle.kts`
```kotlin
plugins {
    java
    id("org.springframework.boot") version "4.0.0"
    id("io.spring.dependency-management") version "1.1.7"
    id("checkstyle")
}

group = "com.mystreet"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // Web
    implementation("org.springframework.boot:spring-boot-starter-web")

    // Security + JWT
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")

    // Data
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")
    runtimeOnly("org.postgresql:postgresql")

    // API Docs
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.9")

    // Utils
    implementation("org.springframework.boot:spring-boot-starter-actuator")

    // Testing
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("org.testcontainers:junit-jupiter")
    testImplementation("org.testcontainers:postgresql")
}

tasks.withType<Test> {
    useJUnitPlatform()
}

checkstyle {
    toolVersion = "10.21.0"
    configFile = file("config/checkstyle/checkstyle.xml")
}
```

### `backend/src/main/resources/application.yml`
```yaml
spring:
  application:
    name: mystreet-api

  jpa:
    open-in-view: false
    properties:
      hibernate:
        format_sql: false

  flyway:
    enabled: true
    locations: classpath:db/migration

springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html

management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      show-details: never
```

### `backend/src/main/resources/application-dev.yml`
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mystreet
    username: mystreet
    password: mystreet_dev

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: true
    properties:
      hibernate:
        format_sql: true

logging:
  level:
    com.mystreet: DEBUG
    org.springframework.security: DEBUG
```

### `backend/src/main/resources/application-prod.yml`
```yaml
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
    hikari:
      maximum-pool-size: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false

logging:
  level:
    root: WARN
    com.mystreet: INFO
```

### `backend/src/main/java/com/mystreet/MyStreetApplication.java`
```java
package com.mystreet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MyStreetApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyStreetApplication.class, args);
    }
}
```

### `backend/Dockerfile`
```dockerfile
# Stage 1: Build
FROM eclipse-temurin:25-jdk-alpine AS build
WORKDIR /app
COPY gradlew gradlew
COPY gradle gradle
COPY build.gradle.kts settings.gradle.kts ./
RUN ./gradlew dependencies --no-daemon
COPY src src
RUN ./gradlew bootJar --no-daemon -x test

# Stage 2: Runtime
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### `backend/.env.example`
```env
# Database
DATABASE_URL=jdbc:postgresql://localhost:5432/mystreet
DATABASE_USERNAME=mystreet
DATABASE_PASSWORD=mystreet_dev

# JWT (RS256 key pair — see README for generation)
JWT_PRIVATE_KEY=classpath:certs/private.pem
JWT_PUBLIC_KEY=classpath:certs/public.pem
JWT_EXPIRY_HOURS=24

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173

# Spring
SPRING_PROFILES_ACTIVE=dev
```

---

## 3. Frontend Setup (`frontend/`)

### Scaffold Command
```bash
cd mystreet-sneaker-shop
pnpm create vite@latest frontend -- --template react-ts
cd frontend
pnpm install
```

### Additional Dependencies to Install
```bash
# Routing
pnpm add react-router-dom@7

# Server state
pnpm add @tanstack/react-query

# Client state
pnpm add zustand

# HTTP
pnpm add axios

# Forms + Validation
pnpm add react-hook-form zod @hookform/resolvers

# UI
pnpm add -D tailwindcss @tailwindcss/vite
pnpm dlx shadcn@latest init

# Icons
pnpm add lucide-react

# Dev tools
pnpm add -D @tanstack/react-query-devtools
pnpm add -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
pnpm add -D prettier eslint-config-prettier
```

### `frontend/vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

### `frontend/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

### `frontend/.env.example`
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### `frontend/vercel.json`
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### `frontend/src/lib/axios.ts` (initial stub)
```typescript
import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

### `frontend/src/main.tsx`
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
```

### `frontend/src/router.tsx` (stub — fully defined in SPEC-06)
```typescript
import { createBrowserRouter } from 'react-router-dom'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <div>MyStreeT - Coming Soon</div>,
  },
])
```

---

## 4. CI/CD Skeleton

### `.github/workflows/backend-ci.yml`
```yaml
name: Backend CI

on:
  push:
    paths: ['backend/**']
  pull_request:
    paths: ['backend/**']

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '25'
          distribution: 'temurin'
          cache: gradle
      - name: Build and Test
        working-directory: backend
        run: ./gradlew build --no-daemon
```

### `.github/workflows/frontend-ci.yml`
```yaml
name: Frontend CI

on:
  push:
    paths: ['frontend/**']
  pull_request:
    paths: ['frontend/**']

jobs:
  build:
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
      - name: Install
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
        run: pnpm run build
```

---

## 5. Verification Steps

Run these to confirm setup is complete:

```bash
# Start local DB
docker compose up -d postgres

# Backend: should print "Started MyStreetApplication" and Flyway migration logs
cd backend
SPRING_PROFILES_ACTIVE=dev ./gradlew bootRun

# Frontend: should open http://localhost:5173 with the stub page
cd frontend
pnpm run dev

# Verify actuator
curl http://localhost:8080/actuator/health
# Expected: {"status":"UP"}

# Verify Swagger is reachable
curl -I http://localhost:8080/swagger-ui.html
# Expected: HTTP 302 (redirect to swagger UI)
```

---

## Acceptance Criteria

- [ ] `docker compose up -d postgres` starts without errors
- [ ] `./gradlew bootRun` (with `SPRING_PROFILES_ACTIVE=dev`) starts without errors
- [ ] `GET /actuator/health` returns `{"status":"UP"}`
- [ ] `GET /swagger-ui.html` returns 200/302 (Swagger accessible)
- [ ] `pnpm run dev` starts without errors at `http://localhost:5173`
- [ ] `pnpm run build` completes without errors
- [ ] `pnpm run type-check` passes with zero errors
- [ ] `pnpm run lint` passes with zero errors
- [ ] Both `.env.example` files committed; no `.env` files committed
- [ ] `.gitignore` prevents `build/`, `node_modules/`, `.env` from being tracked
