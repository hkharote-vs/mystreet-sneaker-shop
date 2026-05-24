import { SlidersHorizontal } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const BRANDS = ['Nike', 'Adidas', 'Converse', 'Vans', 'Puma', 'ASICS', 'New Balance']
const SIZES  = ['6', '7', '8', '9', '10', '11', '12']

interface Props {
  brand: string
  size: string
  onBrandChange: (value: string) => void
  onSizeChange: (value: string) => void
  onClear: () => void
}

export function ProductFilters({ brand, size, onBrandChange, onSizeChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Brand pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onBrandChange('')}
          className={`pill ${brand === '' ? 'pill-active' : ''}`}
        >
          All
        </button>
        {BRANDS.map((b) => (
          <button
            key={b}
            onClick={() => onBrandChange(brand === b ? '' : b)}
            className={`pill ${brand === b ? 'pill-active' : ''}`}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Size select */}
      <div className="flex items-center gap-3">
        <SlidersHorizontal className="h-4 w-4 text-zinc-400 shrink-0" />
        <Select value={size || 'all'} onValueChange={(v) => onSizeChange(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-36 h-9 rounded-full text-xs font-semibold border-zinc-200">
            <SelectValue placeholder="All Sizes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sizes</SelectItem>
            {SIZES.map((s) => (
              <SelectItem key={s} value={s}>UK {s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
