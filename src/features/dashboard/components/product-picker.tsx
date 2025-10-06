"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface Product {
  id: string
  name: string
  sku: string | null
  currency: string
  price_minor: number
  recurring_interval: string | null
}

interface ProductPickerProps {
  value?: string
  onValueChange: (productId: string, product: Product) => void
  disabled?: boolean
}

// Client-side cache for products (5 minute TTL)
const productCache = new Map<string, { data: Product[]; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function ProductPicker({ value, onValueChange, disabled }: ProductPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [products, setProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Product | null>(null)

  // Fetch products with debounce and caching
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      const cacheKey = `products:${search}:active`
      const cached = productCache.get(cacheKey)
      const now = Date.now()

      // Return cached data if fresh
      if (cached && (now - cached.timestamp) < CACHE_TTL) {
        setProducts(cached.data)
        return
      }

      setLoading(true)
      try {
        const params = new URLSearchParams({
          search: search,
          active: 'true',
          pageSize: '50',
        })
        const response = await fetch(`/api/products?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          const productsData = data.data || []
          setProducts(productsData)
          
          // Cache the results
          productCache.set(cacheKey, { data: productsData, timestamp: now })
          
          // Clean up old cache entries (keep last 20)
          if (productCache.size > 20) {
            const entries = Array.from(productCache.entries())
            const oldestKey = entries[0][0]
            productCache.delete(oldestKey)
          }
        }
      } catch (error) {
        console.warn('Failed to fetch products')
      } finally {
        setLoading(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [search])

  // Persist selection when parent value changes and product exists in current list
  React.useEffect(() => {
    if (!value) {
      setSelected(null)
      return
    }
    if (selected && selected.id === value) return
    const match = products.find(p => p.id === value)
    if (match) {
      setSelected(match)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/products/${value}`)
        if (!cancelled && res.ok) {
          const data = await res.json()
          if (data?.product && data.product.id === value) setSelected(data.product)
        }
      } catch {
        // noop
      }
    })()
    return () => { cancelled = true }
  }, [value, products, selected])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selected ? (
            <span className="truncate">
              {selected.name} - {(selected.price_minor / 100).toLocaleString(undefined, {
                style: 'currency',
                currency: selected.currency
              })}
            </span>
          ) : (
            "Select product..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search products..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm">Loading...</div>
            ) : (
              <>
                <CommandEmpty>No product found.</CommandEmpty>
                <CommandGroup>
                  {products.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.id}
                      onSelect={() => {
                        onValueChange(product.id, product)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selected?.id === product.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-medium">{product.name}</span>
                          <span className="text-sm text-muted-foreground shrink-0">
                            {(product.price_minor / 100).toLocaleString(undefined, {
                              style: 'currency',
                              currency: product.currency
                            })}
                          </span>
                        </div>
                        {product.sku && (
                          <div className="text-xs text-muted-foreground">
                            SKU: {product.sku}
                            {product.recurring_interval && ` • ${product.recurring_interval}`}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
