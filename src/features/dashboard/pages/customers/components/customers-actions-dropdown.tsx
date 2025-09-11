"use client";

import { useState } from "react";
import { MoreHorizontal, Edit, Trash, UserCheck, Ban, Eye } from "lucide-react";
import { Customer } from "@/features/dashboard/pages/customers/types/customer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CustomerActionsDropdownProps {
  customer: Customer;
}

export function CustomerActionsDropdown({
  customer,
}: CustomerActionsDropdownProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const handleView = () => {
    console.log("View customer:", customer.id);
    // TODO: Navigate to customer detail page
  };

  const handleEdit = () => {
    console.log("Edit customer:", customer.id);
    // TODO: Navigate to customer edit page or open edit modal
  };

  const handleDelete = () => {
    console.log("Delete customer:", customer.id);
    // TODO: Implement delete functionality
    setShowDeleteAlert(false);
  };

  const handleActivateCustomer = () => {
    console.log("Activate customer:", customer.id);
    // TODO: Implement activate functionality
  };

  const handleDeactivateCustomer = () => {
    console.log("Deactivate customer:", customer.id);
    // TODO: Implement deactivate functionality
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleView}>
            <Eye className="mr-2 h-4 w-4" />
            <span>View Details</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit Customer</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {customer.status === "inactive" && (
            <DropdownMenuItem onClick={handleActivateCustomer}>
              <UserCheck className="mr-2 h-4 w-4" />
              <span>Activate Customer</span>
            </DropdownMenuItem>
          )}
          {customer.status === "active" && (
            <DropdownMenuItem onClick={handleDeactivateCustomer} className="text-amber-600">
              <Ban className="mr-2 h-4 w-4" />
              <span>Deactivate Customer</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteAlert(true)}
            className="text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete Customer</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <strong>{customer.fullName}</strong> and remove all associated
              data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 