"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { addDays, format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type DateRangePreset = 
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "custom"

interface DateRangePickerProps {
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
  className?: string
  align?: "start" | "center" | "end"
}

const presetRanges: Record<DateRangePreset, () => DateRange | undefined> = {
  today: () => {
    const today = new Date()
    return { from: today, to: today }
  },
  yesterday: () => {
    const yesterday = addDays(new Date(), -1)
    return { from: yesterday, to: yesterday }
  },
  last7days: () => ({
    from: addDays(new Date(), -6),
    to: new Date(),
  }),
  last30days: () => ({
    from: addDays(new Date(), -29),
    to: new Date(),
  }),
  thisMonth: () => ({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  }),
  lastMonth: () => {
    const lastMonth = addDays(startOfMonth(new Date()), -1)
    return {
      from: startOfMonth(lastMonth),
      to: endOfMonth(lastMonth),
    }
  },
  thisYear: () => ({
    from: startOfYear(new Date()),
    to: endOfYear(new Date()),
  }),
  custom: () => undefined,
}

const presetLabels: Record<DateRangePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7days: "Last 7 days",
  last30days: "Last 30 days",
  thisMonth: "This month",
  lastMonth: "Last month",
  thisYear: "This year",
  custom: "Custom range",
}

export function DateRangePicker({
  value,
  onChange,
  className,
  align = "start",
}: DateRangePickerProps) {
  const [selectedPreset, setSelectedPreset] = React.useState<DateRangePreset>("last30days")
  const [open, setOpen] = React.useState(false)

  // Initialize with default preset
  React.useEffect(() => {
    if (!value) {
      const defaultRange = presetRanges.last30days()
      onChange(defaultRange)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePresetChange = (preset: DateRangePreset) => {
    setSelectedPreset(preset)
    const range = presetRanges[preset]()
    onChange(range)
    if (preset !== "custom") {
      setOpen(false)
    }
  }

  const formatDateRange = (range?: DateRange) => {
    if (!range?.from) return "Select date range"
    
    if (!range.to) {
      return format(range.from, "MMM d, yyyy")
    }
    
    if (range.from.getTime() === range.to.getTime()) {
      return format(range.from, "MMM d, yyyy")
    }
    
    return `${format(range.from, "MMM d")} - ${format(range.to, "MMM d, yyyy")}`
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={selectedPreset} onValueChange={(v) => handlePresetChange(v as DateRangePreset)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">{presetLabels.today}</SelectItem>
          <SelectItem value="yesterday">{presetLabels.yesterday}</SelectItem>
          <SelectItem value="last7days">{presetLabels.last7days}</SelectItem>
          <SelectItem value="last30days">{presetLabels.last30days}</SelectItem>
          <SelectItem value="thisMonth">{presetLabels.thisMonth}</SelectItem>
          <SelectItem value="lastMonth">{presetLabels.lastMonth}</SelectItem>
          <SelectItem value="thisYear">{presetLabels.thisYear}</SelectItem>
          <SelectItem value="custom">{presetLabels.custom}</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !value?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(value)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={(range) => {
              onChange(range)
              if (range?.from && range?.to) {
                setSelectedPreset("custom")
                setOpen(false)
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
