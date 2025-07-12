"use client";
import React, { useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { EnquiryDataTable } from "./table";
import TableActions from "@/components/shared/TableActions";
import Pagination from "@/components/shared/Pagination";
import {
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { getEnquiryColumns, data, menuContent } from "./columns";
import AddEnquiryModal from "./AddEnquiryModal";
import { Enquiry as EnquiryType } from "./types";

function Enquiry() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [open, onOpenChange] = React.useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = React.useState<EnquiryType | null>(null);

  const handleEdit = useCallback((enquiry: EnquiryType) => {
    setSelectedEnquiry(enquiry);
    onOpenChange(true);
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setSelectedEnquiry(null);
  }, []);

  const columns = React.useMemo(() => getEnquiryColumns(handleEdit), [handleEdit]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <ProtectedRoute>
      <div className="w-full">
        <TableActions
          table={table}
          data={data}
          menuContent={menuContent}
          onOpenChange={onOpenChange}
        />
        <EnquiryDataTable table={table} />
        <Pagination table={table} />
      </div>
      <AddEnquiryModal enquiry={selectedEnquiry} open={open} onOpenChange={handleClose} />
    </ProtectedRoute>
  );
}

export default Enquiry;
