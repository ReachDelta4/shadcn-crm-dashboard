"use client";

import * as React from "react";
import { BellIcon, Check, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  createdAt: string;
  readAt?: string | null;
  type?: "info" | "warning" | "success" | "error";
};

type NotificationsPanelProps = {
  notifications: NotificationItem[];
  onMarkAllRead?: () => void;
  onMarkRead?: (id: string) => void;
};

export function NotificationsPanel({ notifications, onMarkAllRead, onMarkRead }: NotificationsPanelProps) {
  const isMobile = useIsMobile();

  const content = (
    <div className="w-[340px] max-w-[90vw]">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <BellIcon className="h-4 w-4" aria-hidden="true" />
          <h3 className="text-sm font-semibold">Notifications</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onMarkAllRead} aria-label="Mark all as read">
          <Check className="h-4 w-4" />
        </Button>
      </div>
      <Separator />
      <div className="max-h-[60vh] overflow-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">You&apos;re all caught up.</div>
        ) : (
          <ul className="divide-y">
            {notifications.map((n) => (
              <li key={n.id} className="flex items-start gap-2 p-3">
                <div className="mt-1">
                  <span
                    className={
                      n.readAt
                        ? "block h-2 w-2 rounded-full bg-muted"
                        : "block h-2 w-2 rounded-full bg-primary"
                    }
                    aria-label={n.readAt ? "Read" : "Unread"}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium leading-tight">{n.title}</div>
                  {n.body ? (
                    <div className="text-[13px] text-muted-foreground line-clamp-3" aria-live="polite">{n.body}</div>
                  ) : null}
                  <div className="mt-1 text-[11px] text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                {!n.readAt && (
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onMarkRead?.(n.id)} aria-label="Mark read">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  // The panel itself is just content; the trigger is provided by NotificationsButton.
  return content;
}

export function NotificationsButton() {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<NotificationItem[]>([]);

  // TODO: replace with API fetch
  React.useEffect(() => {
    // Example bootstrap
    setItems((prev) => prev.length ? prev : [
      { id: "1", title: "Welcome to Salesy", body: "Explore the new dashboard.", createdAt: new Date().toISOString(), readAt: null, type: "info" },
    ]);
  }, []);

  const onMarkAllRead = () => setItems((arr) => arr.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  const onMarkRead = (id: string) => setItems((arr) => arr.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));

  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          size="icon"
          className="relative h-9 w-9 rounded-full"
          aria-label="Notifications"
          onClick={() => setOpen(true)}
        >
          <BellIcon className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Notifications</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <NotificationsPanel notifications={items} onMarkAllRead={onMarkAllRead} onMarkRead={onMarkRead} />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-9 w-9 rounded-full"
          aria-label="Notifications"
        >
          <BellIcon className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-0">
        <NotificationsPanel notifications={items} onMarkAllRead={onMarkAllRead} onMarkRead={onMarkRead} />
      </PopoverContent>
    </Popover>
  );
}
