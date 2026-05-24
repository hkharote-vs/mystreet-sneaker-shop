# SPEC-06: Authentication — Frontend

**Status:** `[ ] Not Started`  
**Depends on:** SPEC-05 (frontend setup), SPEC-02 (auth backend running)  
**Blocks:** SPEC-09 (checkout — needs auth), SPEC-10 (admin — needs auth)  

---

## Overview

Implement the Login and Register pages with form validation using React Hook Form + Zod. On success, store the JWT and user in the Zustand auth store. Handle error states from the API. The `ProtectedRoute` (already built in SPEC-05) uses this auth state.

---

## Files to Implement

```
features/auth/
  ├── auth.store.ts          (already done in SPEC-05)
  ├── hooks/
  │   └── useAuth.ts         (mutation hooks wrapping authApi)
  └── pages/
      ├── LoginPage.tsx
      └── RegisterPage.tsx
```

---

## Implementation

### 1. `src/features/auth/hooks/useAuth.ts`

```typescript
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '../auth.store'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types'

export function useLogin() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.token, data.user)
      // Redirect admin to admin panel, regular users to home
      navigate(data.user.isAdmin ? '/admin/products' : '/')
    },
  })
}

export function useRegister() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(data.token, data.user)
      navigate('/')
    },
  })
}
```

### 2. Zod Schemas (`src/features/auth/auth.schemas.ts`)

```typescript
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  fullName: z.string().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
```

### 3. `src/features/auth/pages/LoginPage.tsx`

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { loginSchema, type LoginFormData } from '../auth.schemas'
import { useLogin } from '../hooks/useAuth'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types'

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const { mutate: login, isPending, error } = useLogin()

  const apiErrorMessage =
    (error as AxiosError<ApiError>)?.response?.data?.message ?? null

  const onSubmit = (data: LoginFormData) => login(data)

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your MyStreeT account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {apiErrorMessage && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {apiErrorMessage}
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email')}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password')}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 4. `src/features/auth/pages/RegisterPage.tsx`

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { registerSchema, type RegisterFormData } from '../auth.schemas'
import { useRegister } from '../hooks/useAuth'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types'

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const { mutate: registerUser, isPending, error } = useRegister()

  const apiErrorMessage =
    (error as AxiosError<ApiError>)?.response?.data?.message ?? null

  const onSubmit = (data: RegisterFormData) => registerUser(data)

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Join MyStreeT to start shopping</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {apiErrorMessage && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {apiErrorMessage}
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="fullName">Full Name (optional)</Label>
              <Input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                {...register('fullName')}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email')}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                {...register('password')}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## Behavior Specification

### Login Flow

```
User opens /login
  → Fills email + password
  → Submits form
    → Zod validates client-side
      → If invalid: shows inline errors immediately, no API call
    → API call to POST /api/auth/login
      → Success (200):
        → Store token in localStorage + Zustand
        → Redirect to /admin/products if admin, else /
      → 401 error:
        → Show "Invalid email or password" error banner above form
        → Form remains filled (user can correct and retry)
      → 400 error:
        → Show validation error message from API
      → Network error:
        → Show "Unable to connect. Please try again." message
```

### Register Flow

```
User opens /register
  → Fills name (optional), email, password
  → Submits form
    → Zod validates client-side
    → API call to POST /api/auth/register
      → Success (201):
        → Store token + user in Zustand
        → Redirect to /
      → 409 CONFLICT:
        → Show "This email is already registered. Try logging in."
      → 400 error:
        → Show validation errors from API
```

### Already Authenticated

- If user navigates to `/login` or `/register` while already authenticated, redirect to `/`
- Add to both pages:

```typescript
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../auth.store'

// At top of component, before JSX:
const { isAuthenticated } = useAuthStore()
if (isAuthenticated) return <Navigate to="/" replace />
```

---

## Manual Verification Steps

```
1. Open http://localhost:5173/login
   - Try submitting blank form → inline errors on both fields
   - Enter invalid email "notanemail" → email error
   - Enter short password "abc" → no client error (only server validates for login)
   - Submit with wrong credentials → error banner appears
   - Submit with admin@mystreet.com / Admin@1234 → redirected to /admin/products
   
2. Open http://localhost:5173/register
   - Submit blank form → inline errors
   - Enter password "short" → "at least 8 characters" error
   - Register with valid new email → redirected to /
   - Register same email again → error banner "Email already registered"

3. After login, header should show LogOut icon (not Login button)
4. After login, cart badge visible
5. Click LogOut → token cleared, redirected to /, Login button visible again
6. After logout, navigate to /checkout → redirected to /login
```

---

## Acceptance Criteria

- [ ] Blank form submission shows inline validation errors (client-side, no API call)
- [ ] Login with valid admin credentials → JWT stored, redirected to `/admin/products`
- [ ] Login with valid user credentials → JWT stored, redirected to `/`
- [ ] Login with wrong password → 401 error displayed in banner
- [ ] Register with new email → JWT stored, redirected to `/`
- [ ] Register with existing email → 409 error shown
- [ ] Register with password < 8 chars → inline error shown
- [ ] After login, header shows logout button (not login)
- [ ] After logout, token is removed from localStorage
- [ ] Visiting `/login` when already authenticated redirects to `/`
- [ ] `pnpm run type-check` passes
- [ ] `pnpm run lint` passes
