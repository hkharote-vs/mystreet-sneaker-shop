import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate } from 'react-router-dom'
import type { AxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { registerSchema, type RegisterFormData } from '../auth.schemas'
import { useRegister } from '../hooks/useAuth'
import { useAuthStore } from '../auth.store'
import type { ApiError } from '@/types'

export default function RegisterPage() {
  const { isAuthenticated } = useAuthStore()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })
  const { mutate: registerUser, isPending, error } = useRegister()

  if (isAuthenticated) return <Navigate to="/" replace />

  const apiErrorMessage = (error as AxiosError<ApiError>)?.response?.data?.message ?? null

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 overflow-hidden">
      {/* Decorative glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-1/3 top-1/3 h-72 w-72 -translate-y-1/2 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute left-1/3 bottom-1/3 h-48 w-48 rounded-full bg-violet-500/15 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md gradient-border">
        <CardHeader className="pb-2 text-center">
          <div className="mx-auto mb-3 text-3xl font-black gradient-text">MyStreeT</div>
          <CardTitle className="text-xl">Create an account</CardTitle>
          <CardDescription>Join MyStreeT to start shopping</CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit((data) => registerUser(data))}
            className="space-y-4"
            noValidate
          >
            {apiErrorMessage && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {apiErrorMessage}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-slate-300">Full Name <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                {...register('fullName')}
              />
            </div>

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
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-violet-400 hover:text-violet-300 transition-colors">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
