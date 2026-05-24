import { cn } from '@/lib/utils'

interface Props {
  sizesCsv: string
  selectedSize: string
  onSelect: (size: string) => void
}

export function SizeSelector({ sizesCsv, selectedSize, onSelect }: Props) {
  const sizes = sizesCsv ? sizesCsv.split(',').map((s) => s.trim()).filter(Boolean) : []

  if (sizes.length === 0) {
    return <p className="text-sm text-muted-foreground">No sizes available</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => onSelect(size)}
          className={cn(
            'h-10 min-w-[3rem] px-3 rounded-lg border text-sm font-medium transition-all duration-200',
            selectedSize === size
              ? 'border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-500/30'
              : 'border-white/15 bg-white/5 text-slate-300 hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-white',
          )}
        >
          UK {size}
        </button>
      ))}
    </div>
  )
}
