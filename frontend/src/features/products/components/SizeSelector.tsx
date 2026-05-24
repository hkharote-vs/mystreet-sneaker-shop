import { cn } from '@/lib/utils'

interface Props {
  sizesCsv: string
  selectedSize: string
  onSelect: (size: string) => void
}

export function SizeSelector({ sizesCsv, selectedSize, onSelect }: Props) {
  const sizes = sizesCsv ? sizesCsv.split(',').map((s) => s.trim()).filter(Boolean) : []

  if (sizes.length === 0) {
    return <p className="text-sm text-zinc-400">No sizes listed</p>
  }

  return (
    <div className="flex flex-wrap gap-2.5">
      {sizes.map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => onSelect(size)}
          className={cn(
            'h-12 min-w-[3.5rem] px-4 rounded-xl border-2 text-sm font-bold transition-all duration-150 select-none',
            selectedSize === size
              ? 'border-zinc-950 bg-zinc-950 text-white shadow-lg'
              : 'border-zinc-200 bg-white text-zinc-800 hover:border-orange-500 hover:text-orange-600',
          )}
        >
          UK {size}
        </button>
      ))}
    </div>
  )
}
