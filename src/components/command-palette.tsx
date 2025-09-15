"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command as CommandRoot,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

// Simple context to control palette from anywhere
type CommandPaletteContextValue = {
  open: boolean;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
};

const CommandPaletteContext = React.createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette() {
  const ctx = React.useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  return ctx;
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const value = React.useMemo(
    () => ({
      open,
      openPalette: () => setOpen(true),
      closePalette: () => setOpen(false),
      togglePalette: () => setOpen((v) => !v),
    }),
    [open],
  );

  return (
    <CommandPaletteContext.Provider value={value}>{children}</CommandPaletteContext.Provider>
  );
}

export function CommandPalette() {
  const router = useRouter();
  const { open, closePalette } = useCommandPalette();

  const go = (href: string) => {
    closePalette();
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? undefined : closePalette())}>
      <DialogContent className="p-0 sm:max-w-[640px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Command Palette</DialogTitle>
        </DialogHeader>
        <CommandRoot label="Global command palette">
          <CommandInput placeholder="Type a command or search…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup heading="Navigation">
              <CommandItem value="dashboard overview" onSelect={() => go("/dashboard/overview")}>Overview</CommandItem>
              <CommandItem value="leads" onSelect={() => go("/dashboard/leads")}>Leads</CommandItem>
              <CommandItem value="customers" onSelect={() => go("/dashboard/customers")}>Customers</CommandItem>
              <CommandItem value="orders" onSelect={() => go("/dashboard/orders")}>Orders</CommandItem>
              <CommandItem value="invoices" onSelect={() => go("/dashboard/invoices")}>Invoices</CommandItem>
              <CommandItem value="sessions" onSelect={() => go("/dashboard/sessions")}>Sessions</CommandItem>
              <CommandItem value="reports" onSelect={() => go("/dashboard/reports/sales")}>Reports</CommandItem>
              <CommandItem value="settings" onSelect={() => go("/dashboard/settings/general")}>Settings</CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Create">
              <CommandItem value="new customer" onSelect={() => go("/dashboard/customers/new")}>New Customer</CommandItem>
              <CommandItem value="new lead" onSelect={() => go("/dashboard/leads/new")}>New Lead</CommandItem>
              <CommandItem value="new order" onSelect={() => go("/dashboard/orders/new")}>New Order</CommandItem>
              <CommandItem value="new invoice" onSelect={() => go("/dashboard/invoices/new")}>New Invoice</CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Help">
              <CommandItem value="shortcuts" onSelect={() => go("/dashboard/activity-logs")}>Activity Logs</CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandRoot>
      </DialogContent>
    </Dialog>
  );
}
