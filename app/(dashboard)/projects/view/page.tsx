"use client";

import React, { useMemo, useState } from "react";
import Pagination from "@/components/shared/Pagination";
import TableSkeleton from "@/components/shared/skeletons/TableSkeleton";
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
import { getProjectColumns } from "./columns";
import AddProjectModal from "./AddProjectModal";
import ViewProjectModal from "./ViewProjectModal";
import { GenericTable } from "@/components/shared/GenericTable";
import { useProjectsView } from "../hooks/useProjectsView";
import { ProjectsTable } from "../components/ProjectsTable";

export default function ProjectsView() {
  const {
    isLoading,
    data,
    deliverables,
    open,
    viewOpen,
    selectedProject,
    handleEdit,
    handleClose,
    handleView,
    handleViewClose,
    handleBulkDelete,
  } = useProjectsView();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    select: true, // Always show the select column
    price: false,
    extraExpenses: false,
    discount: false,
    finalAmount: false,
    advance: false,
    due: false,
    createdAt: false,
  });
  const [rowSelection, setRowSelection] = useState({});

  const columns = useMemo(() => getProjectColumns(handleEdit, handleView, deliverables), [handleEdit, handleView, deliverables]);

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
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
      </div>

      {isLoading ? (
        <TableSkeleton columnCount={16} rowCount={5} />
      ) : (
        <>
          <ProjectsTable
            table={table}
            data={data}
            onEdit={handleEdit}
            onView={handleView}
            onBulkDelete={handleBulkDelete}
          />
          <GenericTable table={table} />
          <Pagination table={table} />
        </>
      )}
      
      <AddProjectModal project={selectedProject} open={open} onOpenChange={handleClose} />
      <ViewProjectModal project={selectedProject} open={viewOpen} onOpenChange={handleViewClose} deliverables={deliverables} />
    </div>
  );
} 