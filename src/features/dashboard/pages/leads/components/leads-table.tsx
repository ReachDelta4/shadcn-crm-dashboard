"use client";

import React from "react";
import { TableVirtuoso } from "react-virtuoso";
import { Lead } from "@/features/dashboard/pages/leads/types/lead";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table";
import { LeadsTablePagination } from "./leads-table-pagination";
import { useLeadColumns } from "./leads-table-columns";
import { LeadsTableHeaderCell } from "./leads-table-header-cell";
import { Separator } from "@/components/ui/separator";

interface LeadsTableProps {
  leads: Lead[];
  totalRows: number;
  sorting: SortingState;
  onSort: OnChangeFn<SortingState>;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  pageCount: number;
}

export function LeadsTable({
  leads,
  totalRows,
  sorting,
  onSort,
  pagination,
  onPaginationChange,
  pageCount,
}: LeadsTableProps) {
  const columns = useLeadColumns();

  const table = useReactTable({
    data: leads,
    columns,
    state: {
      sorting,
      pagination,
    },
    pageCount,
    onSortingChange: onSort,
    onPaginationChange: onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  const rows = table.getRowModel().rows;

  const Scroller = React.useMemo(() => {
    const Comp = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
      (props, ref) => <div {...props} ref={ref} className="max-h-[70vh] min-h-[240px]" />,
    );
    Comp.displayName = "LeadsTableScroller";
    return Comp;
  }, []);

  if (rows.length === 0) {
    return (
      <div className="space-y-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <LeadsTableHeaderCell key={header.id} header={header} />
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Separator />
        <LeadsTablePagination table={table} totalRows={totalRows} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TableVirtuoso
        data={rows}
        totalCount={rows.length}
        computeItemKey={(_, row) => row.original.id}
        style={{
          height: Math.min(560, Math.max(240, rows.length * 56 + 72)),
        }}
        fixedHeaderContent={() => (
          <TableRow>
            {table.getHeaderGroups().flatMap((headerGroup) =>
              headerGroup.headers.map((header) => (
                <LeadsTableHeaderCell key={header.id} header={header} />
              )),
            )}
          </TableRow>
        )}
        components={{
          Scroller,
          Table: (props) => <Table {...props} />,
          TableHead: TableHeader as any,
          TableRow,
          TableBody,
        }}
        itemContent={(index, row) => (
          <>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </>
        )}
        className="rounded-md border"
        overscan={8}
      />
      <Separator />
      <LeadsTablePagination table={table} totalRows={totalRows} />
    </div>
  );
}
