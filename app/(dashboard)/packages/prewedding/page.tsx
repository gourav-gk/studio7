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
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { GenericTable } from "@/components/shared/GenericTable";
import { v4 as uuidv4 } from "uuid";

export default function PreweddingPackages() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<PreweddingPackage[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [open, setOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PreweddingPackage | null>(null);

  const handleEdit = useCallback((pkg: PreweddingPackage) => {
    setSelectedPackage(pkg);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedPackage(null);
    setOpen(false);
  }, []);

  const handleSave = async (pkg: PreweddingPackage) => {
    const id = pkg.id || `PRE-${uuidv4().slice(0, 4).toUpperCase()}`;
    await setDoc(doc(firestore, "preweddingPackages", id), { ...pkg, id }, { merge: true });
    setOpen(false);
    setSelectedPackage(null);
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

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "preweddingPackages"), (snapshot) => {
      const result = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || "",
        price: doc.data().price || 0,
        features: doc.data().features || [],
        ...doc.data(),
      })) as PreweddingPackage[];
      setData(result);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full">
      {isLoading ? (
        <TableSkeleton columnCount={4} rowCount={5} />
      ) : (
        <>
          <TableActions table={table} data={data} onOpenChange={setOpen} />
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
