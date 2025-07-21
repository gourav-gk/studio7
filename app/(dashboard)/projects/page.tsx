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
import ViewProjectModal from "./ViewProjectModal";
import { GenericTable } from "@/components/shared/GenericTable";
import { useProjectsView } from "../../../hooks/useProjectsView";
import { ProjectsTable } from "./components/ProjectsTable";
import { useRouter } from "next/navigation";
import { Project } from "./types";

export default function ProjectsView() {
  const router = useRouter();
  const {
    isLoading,
    data,
    viewOpen,
    selectedProject,
    handleView,
    handleViewClose,
    handleBulkDelete,
  } = useProjectsView();

  // Edit handler: redirect to add page with ?edit=projectId
  const handleEdit = (project: Project) => {
    router.push(`/projects/add?edit=${project.projectId}`);
  };

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    select: true,
    price: false,
    extraExpenses: false,
    discount: false,
    finalAmount: false,
    advance: false,
    due: false,
    createdAt: false,
  });
  const [rowSelection, setRowSelection] = useState({});

  const columns = useMemo(() => getProjectColumns(handleEdit, handleView), [handleView]);

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

      <ViewProjectModal project={selectedProject} open={viewOpen} onOpenChange={handleViewClose} />
    </div>
  );
}
