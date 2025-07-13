"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ClientDataTable } from "./table";
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
import { getClientColumns, menuContent } from "./columns";
import AddClientModal from "./AddClientModal";
import { Client } from "./types";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

function Clients() {
  const [data, setData] = useState<Client[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [open, onOpenChange] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleEdit = useCallback((client: Client) => {
    setSelectedClient(client);
    onOpenChange(true);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedClient(null);
    onOpenChange(false);
  }, []);

  const table = useReactTable({
    data,
    columns: [],
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

  const selectedRows = useMemo(() => {
    return table.getSelectedRowModel().rows.map((row) => row.original);
  }, [rowSelection]);

  const handleBulkDelete = async (clients: Client[]) => {
    try {
      const deletePromises = clients.map((client) =>
        deleteDoc(doc(firestore, "clients", client.clientId))
      );
      await Promise.all(deletePromises);
      alert("Selected clients deleted.");
    } catch (err) {
      console.error("Bulk delete error:", err);
      alert("Failed to delete selected clients.");
    }
  };

  const columns = useMemo(() => getClientColumns(handleEdit), [handleEdit]);
  table.setOptions((prev) => ({ ...prev, columns }));

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "clients"), (snapshot) => {
      const result: Client[] = snapshot.docs.map((doc) => ({
        clientId: doc.id,
        ...doc.data(),
      })) as Client[];
      setData(result);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ProtectedRoute>
      <div className="w-full">
        <TableActions
          table={table}
          data={data}
          menuContent={menuContent(selectedRows, handleBulkDelete)}
          onOpenChange={onOpenChange}
        />
        <ClientDataTable table={table} />
        <Pagination table={table} />
      </div>
      <AddClientModal client={selectedClient} open={open} onOpenChange={handleClose} />
    </ProtectedRoute>
  );
}

export default Clients;
