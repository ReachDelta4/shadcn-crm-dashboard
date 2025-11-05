"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InvoiceForm } from "./InvoiceForm";

interface NewInvoiceDialogV2Props {
  onCreated?: () => void;
}

export function NewInvoiceDialogV2({ onCreated }: NewInvoiceDialogV2Props) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  function handleClose() {
    setOpen(false);
    setFormKey((k) => k + 1);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setFormKey((k) => k + 1); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>Fill in the details below to generate an invoice.</DialogDescription>
        </DialogHeader>
        <InvoiceForm
          key={formKey}
          showLeadSelector
          allowLeadCreation
          submitLabel="Create Invoice"
          onCancel={handleClose}
          onCreated={(invoice) => {
            onCreated?.();
            handleClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

