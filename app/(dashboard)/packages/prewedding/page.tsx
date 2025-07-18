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
import { getPreweddingColumns } from "./columns";
import AddPreweddingPackageModal from "./AddPreweddingPackageModal";
import { PreweddingPackage } from "./types";
import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { GenericTable } from "@/components/shared/GenericTable";
import { v4 as uuidv4 } from "uuid";
import { menuContent } from "@/components/shared/TableMenuContent";
import { toast } from "sonner";

export default function PreweddingPackages() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<PreweddingPackage[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [open, setOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PreweddingPackage | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "prewedding-packages"), (snapshot) => {
      const result: PreweddingPackage[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || "",
        price: doc.data().price || 0,
        features: doc.data().features || [],
        ...doc.data(),
      }));
      setData(result);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleEdit = useCallback((pkg: PreweddingPackage) => {
    setSelectedPackage(pkg);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedPackage(null);
  }, []);

  const handleSave = async (pkg: PreweddingPackage) => {
    try {
      const id = pkg.id || `PRE-${uuidv4().slice(0, 4).toUpperCase()}`;
      await setDoc(doc(firestore, "prewedding-packages", id), { ...pkg, id }, { merge: true });
      toast.success(pkg.id ? "Package updated successfully" : "Package created successfully");
      setOpen(false);
      setSelectedPackage(null);
    } catch (error) {
      console.error("Error saving package:", error);
      toast.error("Failed to save package");
    }
  };

  const handleBulkDelete = async (selectedPackages: PreweddingPackage[]) => {
    try {
      const deletePromises = selectedPackages.map((pkg) => {
        if (!pkg.id) throw new Error("Package ID is required for deletion");
        return deleteDoc(doc(firestore, "prewedding-packages", pkg.id));
      });
      await Promise.all(deletePromises);
      setRowSelection({});
      toast.success("Selected packages deleted successfully");
    } catch (error) {
      console.error("Bulk delete failed:", error);
      toast.error("Failed to delete selected packages");
    }
  };

  const columns = useMemo(() => getPreweddingColumns(handleEdit), [handleEdit]);

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

  const selectedRows = useMemo(() => {
    return table.getSelectedRowModel().rows.map((row) => row.original);
  }, [table, rowSelection]);

  return (
    <div className="w-full">
      {isLoading ? (
        <TableSkeleton columnCount={4} rowCount={5} />
      ) : (
        <>
          <TableActions
            table={table}
            data={data}
            menuContent={menuContent({
              selectedRows,
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
      <AddPreweddingPackageModal
        initialData={selectedPackage}
        open={open}
        onClose={handleClose}
        onSave={handleSave}
      />
    </div>
  );
}
