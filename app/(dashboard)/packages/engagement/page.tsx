"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import ProtectedRoute from "@/components/ProtectedRoute";
import TableActions from "@/components/shared/TableActions";
import Pagination from "@/components/shared/Pagination";
import { EngagementPackage } from "./types";
import { getEngagementColumns } from "./columns";
import AddEngagementPackageModal from "./AddEngagementPackageModal";
import { collection, onSnapshot, setDoc, doc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";
import { GenericTable } from "@/components/shared/GenericTable";

export default function EngagementPackagePage() {
  const [data, setData] = useState<EngagementPackage[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<EngagementPackage | null>(null);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // Fetch real-time data from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "engagementPackages"), (snapshot) => {
      const result: EngagementPackage[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<EngagementPackage, "id">),
      }));
      setData(result);
    });

    return () => unsubscribe();
  }, []);

  const handleEdit = useCallback((pkg: EngagementPackage) => {
    setSelected(pkg);
    setOpen(true);
  }, []);

  const handleSave = async (pkg: EngagementPackage) => {
    const id = pkg.id || `ENG-${uuidv4().slice(0, 4).toUpperCase()}`;
    await setDoc(doc(firestore, "engagementPackages", id), { ...pkg, id }, { merge: true });
    setOpen(false);
    setSelected(null);
  };

  const columns = useMemo(() => getEngagementColumns(handleEdit), [handleEdit]);

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
          menuContent={null}
          onOpenChange={() => setOpen(true)}
        />
        <GenericTable table={table} />
        <Pagination table={table} />
      </div>
      <AddEngagementPackageModal
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
