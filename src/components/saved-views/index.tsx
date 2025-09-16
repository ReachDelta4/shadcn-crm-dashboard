"use client";

import * as React from "react";
import { BookmarkIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export type SavedView<TParams = unknown> = {
  id: string;
  name: string;
  params: TParams;
  createdAt: string;
};

function loadViews<T>(key: string): SavedView<T>[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`saved-views:${key}`);
    return raw ? (JSON.parse(raw) as SavedView<T>[]) : [];
  } catch {
    return [];
  }
}

function saveViews<T>(key: string, views: SavedView<T>[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`saved-views:${key}`, JSON.stringify(views));
}

type SavedViewsProps<T> = {
  entityKey: string;
  getParams: () => T;
  onApply: (params: T) => void;
};

export function SavedViews<T>({ entityKey, getParams, onApply }: SavedViewsProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [views, setViews] = React.useState<SavedView<T>[]>([]);

  React.useEffect(() => {
    setViews(loadViews<T>(entityKey));
  }, [entityKey]);

  const createView = () => {
    setName("");
    setOpen(true);
  };

  const confirmCreate = () => {
    const params = getParams();
    const next: SavedView<T> = {
      id: crypto.randomUUID(),
      name: name.trim() || "Untitled",
      params,
      createdAt: new Date().toISOString(),
    };
    const updated = [...views, next];
    setViews(updated);
    saveViews(entityKey, updated);
    setOpen(false);
  };

  const applyView = (v: SavedView<T>) => onApply(v.params);

  const removeView = (id: string) => {
    const updated = views.filter((v) => v.id !== id);
    setViews(updated);
    saveViews(entityKey, updated);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" aria-label="Saved views">
            <BookmarkIcon className="mr-2 h-4 w-4" /> Saved views
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Views</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {views.length === 0 && (
            <DropdownMenuItem disabled>No saved views</DropdownMenuItem>
          )}
          {views.map((v) => (
            <div key={v.id} className="flex items-center justify-between">
              <DropdownMenuItem onClick={() => applyView(v)} className="flex-1">
                {v.name}
              </DropdownMenuItem>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeView(v.id)} aria-label="Delete view">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={createView}>
            <Plus className="mr-2 h-4 w-4" /> Save current
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save current view</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm" htmlFor="view-name">Name</label>
            <Input id="view-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Pending this week" />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={confirmCreate}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}





