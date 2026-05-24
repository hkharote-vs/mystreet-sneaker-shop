import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

const BRANDS = ['Nike', 'Adidas', 'Converse', 'Vans', 'Puma', 'ASICS', 'New Balance']
const SIZES = ['6', '7', '8', '9', '10', '11', '12']

interface Props {
  brand: string
  size: string
  onBrandChange: (value: string) => void
  onSizeChange: (value: string) => void
  onClear: () => void
}

export function ProductFilters({ brand, size, onBrandChange, onSizeChange, onClear }: Props) {
  const hasFilters = brand || size

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Select value={brand || 'all'} onValueChange={(v) => onBrandChange(v === 'all' ? '' : v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Brands" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Brands</SelectItem>
          {BRANDS.map((b) => (
            <SelectItem key={b} value={b}>{b}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={size || 'all'} onValueChange={(v) => onSizeChange(v === 'all' ? '' : v)}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="All Sizes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sizes</SelectItem>
          {SIZES.map((s) => (
            <SelectItem key={s} value={s}>UK {s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="gap-1 text-muted-foreground hover:text-foreground">
          <X className="h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  )
}
