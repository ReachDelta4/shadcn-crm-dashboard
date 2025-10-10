"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Search, Trash2, Settings } from "lucide-react";
import { toast } from "sonner";
import { ManagePlansModal } from "@/features/dashboard/components/manage-plans-modal";

type Product = {
  id: string;
  org_id: string | null;
  owner_id: string;
  name: string;
  sku: string | null;
  currency: string;
  price_minor: number;
  tax_rate_bp: number;
  cogs_type: "percent" | "amount" | null;
  cogs_value: number | null;
  discount_type: "percent" | "amount" | null;
  discount_value: number | null;
  recurring_interval: "weekly" | "monthly" | "quarterly" | "semiannual" | "annual" | "custom_days" | null;
  recurring_interval_days: number | null;
  active: boolean;
};

const DEFAULT_FORM: Partial<Product> & { price_major?: string; tax_rate_percent?: string; cogs_value_display?: string; discount_value_display?: string } = {
  name: "",
  sku: "",
  currency: "INR",
  price_major: "",
  tax_rate_percent: "0",
  cogs_type: null,
  cogs_value_display: "",
  discount_type: null,
  discount_value_display: "",
  recurring_interval: null,
  recurring_interval_days: null,
  active: true,
};

function toMinor(major?: string): number {
  const n = Number(major);
  if (!isFinite(n) || isNaN(n)) return 0;
  return Math.round(n * 100);
}

function percentToBp(p?: string): number {
  const n = Number(p);
  if (!isFinite(n) || isNaN(n)) return 0;
  return Math.round(n * 100);
}

function bpToPercent(bp?: number): string {
  if (bp == null) return "0";
  return String((bp / 100).toFixed(2));
}

export function ProductsSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeFilter, setActiveFilter] = useState<"true" | "false" | "all">("true");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  const canSubmit = useMemo(() => {
    return (form.name || "").trim().length > 0 && (form.price_major || "").trim().length > 0;
  }, [form.name, form.price_major]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        search,
        page: String(page),
        pageSize: String(pageSize),
        active: activeFilter,
      }).toString();
      const res = await fetch(`/api/products?${qs}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setProducts(data.data || data.products || data.items || []);
      setTotalPages(data.totalPages || 0);
    } catch (e) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page, activeFilter]);

  function openCreate() {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      ...DEFAULT_FORM,
      ...p,
      price_major: (p.price_minor / 100).toFixed(2),
      tax_rate_percent: bpToPercent(p.tax_rate_bp),
      cogs_value_display:
        p.cogs_type === "percent"
          ? bpToPercent(p.cogs_value || 0)
          : p.cogs_value != null
            ? (p.cogs_value / 100).toFixed(2)
            : "",
      discount_value_display:
        p.discount_type === "percent"
          ? bpToPercent(p.discount_value || 0)
          : p.discount_value != null
            ? (p.discount_value / 100).toFixed(2)
            : "",
    });
    setModalOpen(true);
  }

  async function saveProduct() {
    try {
      const payload: any = {
        name: form.name,
        sku: (form.sku || "").trim() || undefined,
        currency: form.currency || "INR",
        price_minor: toMinor(form.price_major),
        tax_rate_bp: percentToBp(form.tax_rate_percent),
        cogs_type: form.cogs_type ?? null,
        cogs_value: form.cogs_value_display
          ? (form.cogs_type === "percent"
              ? percentToBp(form.cogs_value_display)
              : toMinor(form.cogs_value_display))
          : null,
        discount_type: form.discount_type ?? null,
        discount_value: form.discount_value_display
          ? (form.discount_type === "percent"
              ? percentToBp(form.discount_value_display)
              : toMinor(form.discount_value_display))
          : null,
        recurring_interval: form.recurring_interval ?? null,
        recurring_interval_days: form.recurring_interval === "custom_days" ? (form.recurring_interval_days || 1) : null,
        active: !!form.active,
      };

      let res: Response;
      if (editing) {
        res = await fetch(`/api/products/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error(await res.text());
      toast.success(editing ? "Product updated" : "Product created");
      setModalOpen(false);
      setEditing(null);
      await fetchProducts();
    } catch (e) {
      toast.error("Failed to save product");
    }
  }

  async function deleteProduct(p: Product) {
    if (!confirm(`Delete product "${p.name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Product deleted");
      await fetchProducts();
    } catch (e) {
      toast.error("Failed to delete product");
    }
  }

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const pricingPreview = useMemo(() => {
    const currency = form.currency || "INR";
    const priceMinor = toMinor(form.price_major);
    const taxBp = percentToBp(form.tax_rate_percent);

    let discountMinor = 0;
    if (form.discount_type && form.discount_value_display) {
      if (form.discount_type === "percent") {
        const bp = percentToBp(form.discount_value_display);
        discountMinor = Math.floor((priceMinor * bp) / 10000);
      } else {
        discountMinor = toMinor(form.discount_value_display);
      }
    }

    const afterDiscountMinor = Math.max(0, priceMinor - discountMinor);
    const taxMinor = Math.floor((afterDiscountMinor * taxBp) / 10000);
    const totalMinor = afterDiscountMinor + taxMinor;

    let cogsMinor = 0;
    if (form.cogs_type && form.cogs_value_display) {
      if (form.cogs_type === "percent") {
        const bp = percentToBp(form.cogs_value_display);
        cogsMinor = Math.floor((priceMinor * bp) / 10000);
      } else {
        cogsMinor = toMinor(form.cogs_value_display);
      }
    }

    const profitMinor = totalMinor - cogsMinor;
    const marginPct = totalMinor > 0 ? (profitMinor * 100) / totalMinor : 0;

    const fmt = (minor: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format((minor || 0) / 100);

    return {
      productPrice: fmt(priceMinor),
      cogs: fmt(cogsMinor),
      tax: fmt(taxMinor),
      discount: fmt(discountMinor),
      total: fmt(totalMinor),
      profit: fmt(profitMinor),
      marginPct: `${marginPct.toFixed(2)}%`,
    };
  }, [form.currency, form.price_major, form.tax_rate_percent, form.discount_type, form.discount_value_display, form.cogs_type, form.cogs_value_display]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Product Settings</h1>
        <div className="flex items-center gap-2">
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            New Product
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-8 w-64"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Active</Label>
            <Select value={activeFilter} onValueChange={(v: any) => setActiveFilter(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="min-h-[320px]">
          {loading ? (
            <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">Loading...</div>
          ) : products.length === 0 ? (
            <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">No products found</div>
          ) : (
            <div className="divide-y">
              {products.map((p) => {
                const price = new Intl.NumberFormat('en-IN', { style: 'currency', currency: p.currency || 'INR' }).format((p.price_minor || 0) / 100);
                const taxPct = (p.tax_rate_bp / 100).toFixed(2) + "%";
                const cogs = p.cogs_type ? `${p.cogs_value}${p.cogs_type === "percent" ? "%" : ""}` : "—";
                const discount = p.discount_type ? `${p.discount_value}${p.discount_type === "percent" ? "%" : ""}` : "—";
                const recurring = p.recurring_interval ? (p.recurring_interval === "custom_days" ? `${p.recurring_interval_days} days` : p.recurring_interval) : "One-time";
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium truncate max-w-[400px]">{p.name}</div>
                        {!p.active && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">inactive</span>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[500px]">
                        SKU {p.sku || "—"} · {price} · Tax {taxPct} · COGS {cogs} · Discount {discount} · Recurring {recurring}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!p.recurring_interval && (
                        <ManagePlansModal productId={p.id} productName={p.name} />
                      )}
                      <Button size="icon" variant="outline" onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => deleteProduct(p)} aria-label={`Delete ${p.name}`}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 p-2 text-xs text-muted-foreground">
            <span>
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                Prev
              </Button>
              <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "New Product"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name || ""} onChange={(e) => update("name", e.target.value)} placeholder="Product name" />
            </div>
            <div>
              <Label>SKU</Label>
              <Input value={form.sku || ""} onChange={(e) => update("sku", e.target.value)} placeholder="SKU" />
            </div>
            <div>
              <Label>Currency</Label>
              <Input value={form.currency || "INR"} onChange={(e) => update("currency", e.target.value)} placeholder="INR" disabled />
            </div>
            <div>
              <Label>Price</Label>
              <Input value={form.price_major || ""} onChange={(e) => update("price_major", e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>Tax (%)</Label>
              <Input value={form.tax_rate_percent || "0"} onChange={(e) => update("tax_rate_percent", e.target.value)} placeholder="0" />
            </div>
            <div className="sm:col-span-2">
              <div className="grid grid-cols-2 gap-2 items-end">
                <div className="grid gap-2">
                  <Label>COGS Type</Label>
                  <Select
                    value={form.cogs_type ?? "none"}
                    onValueChange={(v: any) => update("cogs_type", v === "none" ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percent</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>COGS Value</Label>
                  <Input value={form.cogs_value_display || ""} onChange={(e) => update("cogs_value_display", e.target.value)} placeholder="0" />
                </div>
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="grid grid-cols-2 gap-2 items-end">
                <div className="grid gap-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={form.discount_type ?? "none"}
                    onValueChange={(v: any) => update("discount_type", v === "none" ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percent</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Discount Value</Label>
                  <Input value={form.discount_value_display || ""} onChange={(e) => update("discount_value_display", e.target.value)} placeholder="0" />
                </div>
              </div>
            </div>
            <div>
              <Label>Recurring Interval</Label>
              <Select
                value={form.recurring_interval ?? "one_time"}
                onValueChange={(v: any) => update("recurring_interval", v === "one_time" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="One-time Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">One-time Payment</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semiannual">Semiannual</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="custom_days">Custom X days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.recurring_interval === "custom_days" && (
              <div>
                <Label>Custom Interval (days)</Label>
                <Input
                  value={String(form.recurring_interval_days || "")}
                  onChange={(e) => update("recurring_interval_days", Number(e.target.value) || 1)}
                  placeholder="30"
                />
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Switch checked={!!form.active} onCheckedChange={(v) => update("active", v)} />
              <Label className="text-sm">Active</Label>
            </div>
          </div>

          <div className="mt-4 rounded-md border p-4 bg-muted/30">
            <div className="text-sm font-medium mb-2">Pricing Preview (per 1 unit)</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Product Price</div>
              <div className="text-right">{pricingPreview.productPrice}</div>
              <div className="text-muted-foreground">COGS</div>
              <div className="text-right">{pricingPreview.cogs}</div>
              <div className="text-muted-foreground">Tax</div>
              <div className="text-right">{pricingPreview.tax}</div>
              <div className="text-muted-foreground">Discount</div>
              <div className="text-right">-{pricingPreview.discount}</div>
              <div className="text-muted-foreground font-medium">Total Price</div>
              <div className="text-right font-medium">{pricingPreview.total}</div>
              <div className="text-muted-foreground font-medium">Profit Margin</div>
              <div className="text-right font-medium">{pricingPreview.marginPct} ({pricingPreview.profit})</div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveProduct} disabled={!canSubmit}>{editing ? "Save Changes" : "Create Product"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
