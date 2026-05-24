import * as React from 'react'

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

type ToastAction =
  | { type: 'ADD'; toast: ToastProps }
  | { type: 'REMOVE'; id: string }

interface ToastState {
  toasts: ToastProps[]
}

const TOAST_LIMIT = 3
const TOAST_DURATION = 4000

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const listeners: Array<(state: ToastState) => void> = []
let memoryState: ToastState = { toasts: [] }

function dispatch(action: ToastAction) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((l) => l(memoryState))
}

function reducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD':
      return { toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) }
    case 'REMOVE':
      return { toasts: state.toasts.filter((t) => t.id !== action.id) }
  }
}

export function toast(props: Omit<ToastProps, 'id'>) {
  const id = genId()
  dispatch({ type: 'ADD', toast: { ...props, id } })
  setTimeout(() => dispatch({ type: 'REMOVE', id }), props.duration ?? TOAST_DURATION)
  return id
}

export function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const idx = listeners.indexOf(setState)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  return {
    toasts: state.toasts,
    toast,
    dismiss: (id: string) => dispatch({ type: 'REMOVE', id }),
  }
}
