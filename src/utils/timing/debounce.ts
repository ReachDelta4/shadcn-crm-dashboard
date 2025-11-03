export function debounce<T extends any[]>(fn: (...args: T) => void, waitMs: number) {
  let id: any
  return (...args: T) => {
    if (id) clearTimeout(id)
    id = setTimeout(() => fn(...args), Math.max(0, waitMs || 0))
  }
}

