"use client";

import { Order } from "@/features/dashboard/pages/orders/types/order";
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash, 
  Download, 
  FileText, 
  Ban
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ProductPicker } from "@/features/dashboard/components/product-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OrderActionsProps {
  order: Order;
}

export function OrderActionsDropdown({ order }: OrderActionsProps) {
  const router = useRouter();
  const [openInvoice, setOpenInvoice] = useState(false);
  const [lines, setLines] = useState<Array<{ product_id: string; quantity: number }>>([{ product_id: "", quantity: 1 }]);

  const handleViewDetails = () => {
    console.log("View order details", order.orderNumber);
  };

  const handleEditOrder = () => {
    console.log("Edit order", order.orderNumber);
  };

  function updateLine(idx: number, patch: Partial<{ product_id: string; quantity: number }>) {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));
  }

  function addLine() { setLines(prev => [...prev, { product_id: "", quantity: 1 }]); }

  async function handleGenerateInvoice() {
    setOpenInvoice(true);
  }

  async function submitInvoice() {
    try {
      const valid = lines.filter(l => l.product_id && l.quantity > 0);
      if (valid.length === 0) { toast.error("Add at least one product"); return; }
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: order.customerName,
          email: order.email,
          status: 'draft',
          line_items: valid,
          // If the order carries a lead_id, include it so lifecycle advances to invoice_sent
          lead_id: (order as any).lead_id || undefined,
        })
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Invoice created');
      setOpenInvoice(false);
      setLines([{ product_id: "", quantity: 1 }]);
      router.refresh();
    } catch (e) {
      toast.error('Failed to create invoice');
    }
  }

  const handleDownload = () => {
    console.log("Download order", order.orderNumber);
  };

  const handleCancelOrder = async () => {
    if (!confirm(`Cancel order ${order.orderNumber}?`)) return;
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Order cancelled')
      router.refresh()
    } catch (e) {
      toast.error('Failed to cancel order')
    }
  };

  const handleDeleteOrder = async () => {
    if (!confirm(`Delete order ${order.orderNumber}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Order deleted')
      router.refresh()
    } catch (e) {
      toast.error('Failed to delete order')
    }
  };

  return (
    <div className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            <span>View Details</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEditOrder}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit Order</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleGenerateInvoice}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Generate Invoice</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            <span>Download</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {order.status !== "cancelled" ? (
            <DropdownMenuItem 
              onClick={handleCancelOrder}
              className="text-red-600"
            >
              <Ban className="mr-2 h-4 w-4" />
              <span>Cancel Order</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem 
              onClick={handleDeleteOrder}
              className="text-red-600"
            >
              <Trash className="mr-2 h-4 w-4" />
              <span>Delete Order</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={openInvoice} onOpenChange={setOpenInvoice}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Invoice from Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {lines.map((li, idx) => (
              <div key={idx} className="grid gap-2 sm:grid-cols-5">
                <div className="sm:col-span-3">
                  <Label>Product</Label>
                  <ProductPicker
                    value={li.product_id}
                    onValueChange={(id) => updateLine(idx, { product_id: id })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Qty</Label>
                  <Input type="number" min={1} value={li.quantity} onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) || 1 })} />
                </div>
              </div>
            ))}
            <div>
              <Button variant="outline" onClick={addLine}>Add Product</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenInvoice(false)}>Cancel</Button>
            <Button onClick={submitInvoice}>Create Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 