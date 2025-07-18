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
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { GenericTable } from "@/components/shared/GenericTable";
import { menuContent } from "@/components/shared/TableMenuContent";
import { toast } from "sonner";

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

  const handleBulkDelete = async (clients: Client[]) => {
    try {
      const deletePromises = clients.map((client) =>
        deleteDoc(doc(firestore, "clients", client.clientId))
      );
      await Promise.all(deletePromises);
      setRowSelection({});
      toast.success("Selected clients deleted successfully.");
    } catch (error) {
      console.error("Bulk delete failed:", error);
      toast.error("Failed to delete selected clients.");
    }
  };

  return (
    <div className="w-full">
      {isLoading ? (
        <TableSkeleton columnCount={6} rowCount={5} />
      ) : (
        <>
          <TableActions
            table={table}
            data={data}
            menuContent={menuContent({
              selectedRows: table.getSelectedRowModel().rows.map((row) => row.original),
              actions: [
                {
                  label: "Delete Selected",
                  onClick: handleBulkDelete,
                  className: "text-red-600",
                },
              ],
            })}
            onOpenChange={setOpen}
          />
          <GenericTable table={table} />
          <Pagination table={table} />
        </>
      )}
      <AddClientModal client={selectedClient} open={open} onOpenChange={handleClose} />
    </div>
  );
}
