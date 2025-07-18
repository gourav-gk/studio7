"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import TableActions from "@/components/shared/TableActions";
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
import { getClientColumns } from "./columns";
import AddClientModal from "./AddClientModal";
import { Client } from "./types";
import { collection, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { GenericTable } from "@/components/shared/GenericTable";

export default function Clients() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<Client[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleEdit = useCallback((client: Client) => {
    setSelectedClient(client);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedClient(null);
    setOpen(false);
  }, []);

  const columns = useMemo(() => getClientColumns(handleEdit), [handleEdit]);

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

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "clients"), (snapshot) => {
      const result: Client[] = snapshot.docs.map((doc) => ({
        clientId: doc.id,
        ...doc.data(),
      })) as Client[];
      setData(result);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full">
      {isLoading ? (
        <TableSkeleton columnCount={6} rowCount={5} />
      ) : (
        <>
          <TableActions table={table} data={data} onOpenChange={setOpen} />
          <GenericTable table={table} />
          <Pagination table={table} />
        </>
      )}
      <AddClientModal client={selectedClient} open={open} onOpenChange={handleClose} />
    </div>
  );
}
