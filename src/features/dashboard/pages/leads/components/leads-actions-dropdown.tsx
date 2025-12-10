"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lead } from "@/features/dashboard/pages/leads/types/lead";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash,
  PhoneCall,
  Mail,
  UserCheck,
  UserX,
  UserPlus,
  UserCog,
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
import {
  buildLeadTransitionIdempotencyKey,
  isForwardTransition,
} from "@/features/leads/status-utils";
import { EditLeadDialog } from "./modals/edit-lead-dialog";
import { ConvertLeadDialog } from "./convert-lead-dialog";

interface LeadActionsProps {
  lead: Lead;
}

export function LeadActionsDropdown({ lead }: LeadActionsProps) {
  const router = useRouter();
  const [openEdit, setOpenEdit] = useState(false);
  const [openConvert, setOpenConvert] = useState(false);

  const handleViewDetails = () => {
    router.push(`/dashboard/leads/${lead.id}`);
  };

  const handleEditLead = () => {
    setOpenEdit(true);
  };

  const handleCallLead = () => {
    // Implement call functionality
    console.log("Call lead", lead.phone);
  };

  const handleEmailLead = () => {
    // Implement email functionality
    console.log("Email lead", lead.email);
  };

  const handleMarkAsQualified = async () => {
    const current = lead.status as any;
    const target = "qualified";

    if (!isForwardTransition(current, target as any)) {
      toast.error("Only forward lifecycle moves are allowed for leads.");
      return;
    }

    try {
      const idempotencyKey = buildLeadTransitionIdempotencyKey(
        lead.id,
        current,
        target as any,
      );
      const res = await fetch(`/api/leads/${lead.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_status: target,
          idempotency_key: idempotencyKey,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Lead marked as qualified");
      try {
        window.dispatchEvent(new Event("leads:changed"));
      } catch {
        // ignore
      }
      router.refresh();
    } catch {
      toast.error("Failed to mark as qualified");
    }
  };

  const handleMarkAsDisqualified = async () => {
    const current = lead.status as any;
    const target = "disqualified";

    if (!isForwardTransition(current, target as any)) {
      toast.error("Only forward lifecycle moves are allowed for leads.");
      return;
    }

    try {
      const idempotencyKey = buildLeadTransitionIdempotencyKey(
        lead.id,
        current,
        target as any,
      );
      const res = await fetch(`/api/leads/${lead.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_status: target,
          idempotency_key: idempotencyKey,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Lead marked as disqualified");
      try {
        window.dispatchEvent(
          new CustomEvent("leads:optimistic", {
            detail: {
              op: "update",
              id: lead.id,
              patch: { status: "disqualified" },
            },
          }),
        );
        window.dispatchEvent(new Event("leads:changed"));
      } catch {
        // ignore
      }
      router.refresh();
    } catch {
      toast.error("Failed to mark as disqualified");
    }
  };

  const handleDeleteLead = async () => {
    if (!confirm(`Delete lead ${lead.fullName}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Lead deleted");
      try {
        window.dispatchEvent(new Event("leads:changed"));
      } catch {
        // ignore
      }
      router.refresh();
    } catch {
      toast.error("Failed to delete lead");
    }
  };

  // Canonicalized checks for visibility
  const isQualified = lead.status === "qualified";
  const isDisqualified = lead.status === "disqualified";
  const isConverted = lead.status === "converted";

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
          <DropdownMenuItem onClick={handleEditLead}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit Lead</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCallLead}>
            <PhoneCall className="mr-2 h-4 w-4" />
            <span>Call</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEmailLead}>
            <Mail className="mr-2 h-4 w-4" />
            <span>Send Email</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {!isQualified && (
            <DropdownMenuItem onClick={handleMarkAsQualified}>
              <UserCheck className="mr-2 h-4 w-4" />
              <span>Mark as Qualified</span>
            </DropdownMenuItem>
          )}
          {!isDisqualified && (
            <DropdownMenuItem onClick={handleMarkAsDisqualified}>
              <UserX className="mr-2 h-4 w-4" />
              <span>Mark as Disqualified</span>
            </DropdownMenuItem>
          )}
          {!isConverted && (
            <DropdownMenuItem onClick={() => setOpenConvert(true)}>
              <UserCog className="mr-2 h-4 w-4" />
              <span>Convert to Customer</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDeleteLead}
            className="text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete Lead</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditLeadDialog open={openEdit} onOpenChange={setOpenEdit} lead={lead} />
      <ConvertLeadDialog
        open={openConvert}
        onOpenChange={setOpenConvert}
        leadId={lead.id}
        leadName={lead.fullName}
        leadEmail={lead.email}
        onCompleted={() => {
          router.refresh();
        }}
      />
    </div>
  );
} 
