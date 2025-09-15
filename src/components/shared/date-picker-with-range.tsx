"use client";

// External dependencies
import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, startOfDay, endOfDay, subDays, startOfQuarter, startOfYear } from "date-fns";

// Internal UI components
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Props interface for DatePickerWithRange component
 * @interface DatePickerWithRangeProps
 * @property {DateRange | undefined} value - Currently selected date range
 * @property {(date: DateRange | undefined) => void} onChange - Callback function to update selected date range
 * @property {string} [className] - Optional CSS class name for additional styling
 */
interface DatePickerWithRangeProps {
  value: DateRange | undefined;
  onChange: (date: DateRange | undefined) => void;
  className?: string;
}

/**
 * DatePickerWithRange Component
 * A date range picker component with popover calendar allowing selection of start and end dates
 *
 * @component
 * @example
 * ```tsx
 * <DatePickerWithRange
 *   value={dateRange}
 *   onChange={handleDateRangeChange}
 *   className="my-date-picker"
 * />
 * ```
 */
export function DatePickerWithRange({
  value,
  onChange,
  className,
}: DatePickerWithRangeProps) {
  const selectPreset = (preset: "7" | "30" | "q" | "ytd") => {
    const now = new Date();
    if (preset === "7") {
      const from = startOfDay(subDays(now, 6));
      const to = endOfDay(now);
      onChange({ from, to });
    } else if (preset === "30") {
      const from = startOfDay(subDays(now, 29));
      const to = endOfDay(now);
      onChange({ from, to });
    } else if (preset === "q") {
      const from = startOfDay(startOfQuarter(now));
      const to = endOfDay(now);
      onChange({ from, to });
    } else if (preset === "ytd") {
      const from = startOfDay(startOfYear(now));
      const to = endOfDay(now);
      onChange({ from, to });
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date-range-picker"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal md:w-[300px]",
              !value && "text-muted-foreground",
            )}
            aria-label="Choose date range"
            aria-haspopup="dialog"
          >
            <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y")} -{" "}
                  {format(value.to, "LLL dd, y")}
                </>
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
          role="dialog"
          aria-label="Calendar date range picker"
        >
          <div className="flex flex-col gap-2 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => selectPreset("7")}>Last 7 days</Button>
              <Button variant="secondary" size="sm" onClick={() => selectPreset("30")}>Last 30 days</Button>
              <Button variant="secondary" size="sm" onClick={() => selectPreset("q")}>This quarter</Button>
              <Button variant="secondary" size="sm" onClick={() => selectPreset("ytd")}>YTD</Button>
              {value?.from || value?.to ? (
                <Button variant="ghost" size="sm" onClick={() => onChange({ from: undefined, to: undefined })}>Clear</Button>
              ) : null}
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={value?.from}
              selected={value}
              onSelect={onChange}
              numberOfMonths={2}
              aria-label="Select date range"
              className="rounded-md border"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
