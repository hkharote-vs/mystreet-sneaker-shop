import { useToast } from './use-toast'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'glass-strong rounded-xl px-4 py-3 shadow-xl border flex items-start gap-3 animate-in slide-in-from-bottom-4 fade-in',
            toast.variant === 'destructive'
              ? 'border-red-500/30 bg-red-500/10'
              : 'border-white/15',
          )}
        >
          <div className="flex-1 min-w-0">
            {toast.title && (
              <p className={cn('text-sm font-semibold', toast.variant === 'destructive' ? 'text-red-400' : 'text-foreground')}>
                {toast.title}
              </p>
            )}
            {toast.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
