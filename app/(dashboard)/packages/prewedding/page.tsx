"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
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
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";

import ProtectedRoute from "@/components/ProtectedRoute";
import TableActions from "@/components/shared/TableActions";
import Pagination from "@/components/shared/Pagination";
import { firestore } from "@/lib/firebase";

import { PreweddingPackage } from "./types";
import { getPreweddingColumns } from "./columns";
import AddPreweddingPackageModal from "./AddPreweddingPackageModal";
import { GenericTable } from "@/components/shared/GenericTable";

export default function PreweddingPackagesPage() {
  const [data, setData] = useState<PreweddingPackage[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PreweddingPackage | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "prewedding-packages"), (snapshot) => {
      const packages: PreweddingPackage[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PreweddingPackage[];
      setData(packages);
    });

    return () => unsubscribe();
  }, []);

  const handleEdit = useCallback((pkg: PreweddingPackage) => {
    setSelected(pkg);
    setOpen(true);
  }, []);

  const handleSave = async (pkg: PreweddingPackage) => {
    const id = pkg.id || `pre-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const docRef = doc(firestore, "prewedding-packages", id);
    await setDoc(docRef, {
      name: pkg.name,
      price: pkg.price,
      features: pkg.features,
    });
    setOpen(false);
    setSelected(null);
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

  return (
    <ProtectedRoute>
      <div className="w-full">
        <TableActions
          table={table}
          data={data}
          onOpenChange={() => {
            setSelected(null);
            setOpen(true);
          }}
        />
        <GenericTable table={table} />
        <Pagination table={table} />
      </div>

      <AddPreweddingPackageModal
        open={open}
        onClose={() => {
          setOpen(false);
          setSelected(null);
        }}
        onSave={handleSave}
        initialData={selected}
      />
    </ProtectedRoute>
  );
}
