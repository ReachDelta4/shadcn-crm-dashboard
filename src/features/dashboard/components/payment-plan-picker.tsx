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

export interface PaymentPlan {
  id: string
  name: string
  num_installments: number
  interval_type: string
  interval_days: number | null
  down_payment_minor: number | null
}

interface PaymentPlanPickerProps {
  productId: string | null
  value?: string
  onValueChange: (planId: string | null, plan: PaymentPlan | null) => void
  disabled?: boolean
}

export function PaymentPlanPicker({ 
  productId, 
  value, 
  onValueChange, 
  disabled 
}: PaymentPlanPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [plans, setPlans] = React.useState<PaymentPlan[]>([])
  const [loading, setLoading] = React.useState(false)

  // Fetch payment plans when product changes
  React.useEffect(() => {
    if (!productId) {
      setPlans([])
      return
    }

    const fetchPlans = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/products/${productId}/plans`)
        if (response.ok) {
          const data = await response.json()
          setPlans(data.plans || [])
        } else {
          setPlans([])
        }
      } catch (error) {
        console.error('Failed to fetch payment plans:', error)
        setPlans([])
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [productId])

  const selectedPlan = plans.find(p => p.id === value)

  const formatInterval = (plan: PaymentPlan) => {
    if (plan.interval_type === 'custom_days' && plan.interval_days) {
      return `${plan.interval_days} days`
    }
    return plan.interval_type
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || !productId || plans.length === 0}
        >
          {selectedPlan ? (
            <span className="truncate">
              {selectedPlan.name} ({selectedPlan.num_installments}x {formatInterval(selectedPlan)})
            </span>
          ) : plans.length === 0 ? (
            "No payment plans available"
          ) : (
            "Select payment plan (optional)"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search payment plans..." />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm">Loading...</div>
            ) : (
              <>
                <CommandEmpty>No payment plan found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="none"
                    onSelect={() => {
                      onValueChange(null, null)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        !value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="text-muted-foreground">No payment plan</span>
                  </CommandItem>
                  {plans.map((plan) => (
                    <CommandItem
                      key={plan.id}
                      value={plan.id}
                      onSelect={() => {
                        onValueChange(plan.id, plan)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === plan.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {plan.num_installments} installments • {formatInterval(plan)}
                          {plan.down_payment_minor && plan.down_payment_minor > 0 && 
                            ` • Down payment: ${(plan.down_payment_minor / 100).toLocaleString()}`
                          }
                        </div>
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
