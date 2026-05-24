import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types'

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string, size: string) => void
  updateQuantity: (productId: string, size: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === newItem.productId && i.size === newItem.size,
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === newItem.productId && i.size === newItem.size
                  ? { ...i, quantity: i.quantity + newItem.quantity }
                  : i,
              ),
            }
          }
          return { items: [...state.items, newItem] }
        }),

      removeItem: (productId, size) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.size === size),
          ),
        })),

      updateQuantity: (productId, size, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter(
                  (i) => !(i.productId === productId && i.size === size),
                )
              : state.items.map((i) =>
                  i.productId === productId && i.size === size
                    ? { ...i, quantity }
                    : i,
                ),
        })),

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: 'mystreet-cart' },
  ),
)
