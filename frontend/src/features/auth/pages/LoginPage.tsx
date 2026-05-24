import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate } from 'react-router-dom'
import type { AxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { loginSchema, type LoginFormData } from '../auth.schemas'
import { useLogin } from '../hooks/useAuth'
import { useAuthStore } from '../auth.store'
import type { ApiError } from '@/types'

export default function LoginPage() {
  const { isAuthenticated } = useAuthStore()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })
  const { mutate: login, isPending, error } = useLogin()

  if (isAuthenticated) return <Navigate to="/" replace />

  const apiErrorMessage = (error as AxiosError<ApiError>)?.response?.data?.message ?? null

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 overflow-hidden">
      {/* Decorative glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-48 w-48 translate-x-1/2 translate-y-1/2 rounded-full bg-blue-500/15 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md gradient-border">
        <CardHeader className="pb-2 text-center">
          <div className="mx-auto mb-3 text-3xl font-black gradient-text">MyStreeT</div>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit((data) => login(data))} className="space-y-4" noValidate>
            {apiErrorMessage && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {apiErrorMessage}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-violet-400 hover:text-violet-300 transition-colors">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
