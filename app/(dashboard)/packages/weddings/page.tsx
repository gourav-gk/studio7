"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { getWeddingColumns } from "./columns";
import { WeddingPackage } from "./types";
import AddWeddingPackageModal from "./AddWeddingPackageModal";
import { GenericTable } from "@/components/shared/GenericTable";
import TableActions from "@/components/shared/TableActions";
import TableSkeleton from "@/components/shared/skeletons/TableSkeleton";
import Pagination from "@/components/shared/Pagination";
import { v4 as uuidv4 } from "uuid";
import { menuContent } from "@/components/shared/TableMenuContent";
import { toast } from "sonner";

function WeddingPackagesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [packages, setPackages] = useState<WeddingPackage[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<WeddingPackage | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, "wedding-packages"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || "",
        price: doc.data().price || 0,
        features: doc.data().features || [],
        ...doc.data(),
      })) as WeddingPackage[];
      setPackages(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async (pkg: WeddingPackage) => {
    try {
      const id = pkg.id || `WED-${uuidv4().slice(0, 4).toUpperCase()}`;
      await setDoc(doc(firestore, "wedding-packages", id), { ...pkg, id }, { merge: true });
      toast.success(pkg.id ? "Package updated successfully" : "Package created successfully");
      setOpen(false);
      setSelected(null);
    } catch (error) {
      console.error("Error saving package:", error);
      toast.error("Failed to save package");
    }
  };

  const handleEdit = useCallback((pkg: WeddingPackage) => {
    setSelected(pkg);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelected(null);
  }, []);

  const handleBulkDelete = async (selectedPackages: WeddingPackage[]) => {
    try {
      const deletePromises = selectedPackages.map((pkg) => {
        if (!pkg.id) throw new Error("Package ID is required for deletion");
        return deleteDoc(doc(firestore, "wedding-packages", pkg.id));
      });
      await Promise.all(deletePromises);
      setRowSelection({});
      toast.success("Selected packages deleted successfully");
    } catch (error) {
      console.error("Bulk delete failed:", error);
      toast.error("Failed to delete selected packages");
    }
  };

  const columns = useMemo(() => getWeddingColumns(handleEdit), [handleEdit]);

  const table = useReactTable({
    data: packages,
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
            data={packages}
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
      <AddWeddingPackageModal
        initialData={selected}
        open={open}
        onClose={handleClose}
        onSave={handleSave}
      />
    </div>
  );
}

export default WeddingPackagesPage;
