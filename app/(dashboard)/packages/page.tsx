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
import { getPackageColumns } from "./columns";
import { Package } from "./types";
import { Event } from "../events/types";
import AddPackageModal from "./AddPackageModal";
import ViewPackageModal from "./ViewPackageModal";
import { GenericTable } from "@/components/shared/GenericTable";
import TableActions from "@/components/shared/TableActions";
import TableSkeleton from "@/components/shared/skeletons/TableSkeleton";
import Pagination from "@/components/shared/Pagination";
import { v4 as uuidv4 } from "uuid";
import { menuContent } from "@/components/shared/TableMenuContent";
import { toast } from "sonner";

function PackagesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [packages, setPackages] = useState<Package[]>([]);
  const [events, setEvents] = useState<Record<string, Event>>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<Package | null>(null);
  const [viewPackage, setViewPackage] = useState<Package | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "events"), (snapshot) => {
      const eventsData = snapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = { ...doc.data(), eventId: doc.id } as Event;
        return acc;
      }, {} as Record<string, Event>);
      setEvents(eventsData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, "packages"), (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          name: docData.name || "",
          price: docData.price || 0,
          eventId: docData.eventId || "",
          shoots: docData.shoots || [],
          deliverables: docData.deliverables || [],
          createdAt: docData.createdAt,
        } as Package;
      });
      setPackages(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const packagesWithEventNames = useMemo(() => {
    return packages.map(pkg => ({
      ...pkg,
      eventName: events[pkg.eventId]?.name || "Loading..."
    }));
  }, [packages, events]);

  const handleSave = async (pkg: Package) => {
    try {
      const id = pkg.id || `PKG-${uuidv4().slice(0, 4).toUpperCase()}`;
      await setDoc(doc(firestore, "packages", id), { ...pkg, id }, { merge: true });
      toast.success(pkg.id ? "Package updated successfully" : "Package created successfully");
      setOpen(false);
      setSelected(null);
    } catch (error) {
      console.error("Error saving package:", error);
      toast.error("Failed to save package");
    }
  };

  const handleEdit = useCallback((pkg: Package) => {
    setSelected(pkg);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelected(null);
  }, []);

  const handleView = useCallback((pkg: Package) => {
    setViewPackage(pkg);
    setViewOpen(true);
  }, []);

  const handleViewClose = useCallback(() => {
    setViewOpen(false);
    setViewPackage(null);
  }, []);

  const handleBulkDelete = async (selectedPackages: Package[]) => {
    try {
      const deletePromises = selectedPackages.map((pkg) => {
        if (!pkg.id) throw new Error("Package ID is required for deletion");
        return deleteDoc(doc(firestore, "packages", pkg.id));
      });
      await Promise.all(deletePromises);
      setRowSelection({});
      toast.success("Selected packages deleted successfully");
    } catch (error) {
      console.error("Bulk delete failed:", error);
      toast.error("Failed to delete selected packages");
    }
  };

  const columns = useMemo(
    () => getPackageColumns(handleEdit, handleView),
    [handleEdit, handleView]
  );

  const table = useReactTable({
    data: packagesWithEventNames,
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
      <AddPackageModal
        initialData={selected}
        open={open}
        onClose={handleClose}
        onSave={handleSave}
      />
      <ViewPackageModal data={viewPackage} open={viewOpen} onClose={handleViewClose} />
    </div>
  );
}
export default PackagesPage;
