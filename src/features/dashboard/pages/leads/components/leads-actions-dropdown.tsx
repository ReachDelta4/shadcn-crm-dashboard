"use client";

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
  UserPlus
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface LeadActionsProps {
  lead: Lead;
}

export function LeadActionsDropdown({ lead }: LeadActionsProps) {
  const router = useRouter();

  const handleViewDetails = () => {
    // Implement view details functionality
    console.log("View lead details", lead.leadNumber);
  };

  const handleEditLead = () => {
    // Implement edit lead functionality
    console.log("Edit lead", lead.leadNumber);
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
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "qualified" })
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Lead marked as qualified");
      router.refresh();
    } catch (e) {
      toast.error("Failed to mark as qualified");
    }
  };

  const handleMarkAsUnqualified = async () => {
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "unqualified" })
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Lead marked as unqualified");
      router.refresh();
    } catch (e) {
      toast.error("Failed to mark as unqualified");
    }
  };

  const handleDeleteLead = async () => {
    if (!confirm(`Delete lead ${lead.fullName}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Lead deleted");
      router.refresh();
    } catch (e) {
      toast.error("Failed to delete lead");
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
          {lead.status !== "qualified" && (
            <DropdownMenuItem onClick={handleMarkAsQualified}>
              <UserCheck className="mr-2 h-4 w-4" />
              <span>Mark as Qualified</span>
            </DropdownMenuItem>
          )}
          {lead.status !== "unqualified" && (
            <DropdownMenuItem onClick={handleMarkAsUnqualified}>
              <UserX className="mr-2 h-4 w-4" />
              <span>Mark as Unqualified</span>
            </DropdownMenuItem>
          )}
          {lead.status !== "converted" && (
            <DropdownMenuItem onClick={async () => {
              try {
                const res = await fetch(`/api/leads/${lead.id}/convert`, { method: "POST" });
                if (!res.ok) throw new Error(await res.text());
                toast.success("Lead converted to customer");
                router.refresh();
              } catch (e) {
                toast.error("Failed to convert lead");
              }
            }}>
              <UserPlus className="mr-2 h-4 w-4" />
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
    </div>
  );
} 