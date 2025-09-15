"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command as CommandRoot,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export type ComboboxOption = {
  label: string;
  value: string;
};

type ComboboxProps = {
  value?: string;
  onChange: (value: string | undefined) => void;
  options: ComboboxOption[];
  placeholder?: string;
  emptyLabel?: string;
  allowClear?: boolean;
  className?: string;
};

export function Combobox({ value, onChange, options, placeholder = "Select option", emptyLabel = "No results found.", allowClear = true, className }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[180px] justify-between", className)}
        >
          <span className={cn(!selected && "text-muted-foreground")}>{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <CommandRoot>
          <div className="flex items-center gap-1 p-2">
            <CommandInput placeholder="Search…" aria-label="Search options" />
            {allowClear && value && (
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Clear selection" onClick={() => { onChange(undefined); setOpen(false); }}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  onSelect={() => { onChange(option.value); setOpen(false); }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} aria-hidden="true" />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandRoot>
      </PopoverContent>
    </Popover>
  );
}
