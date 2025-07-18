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
import { getEnquiryColumns } from "./columns";
import AddEnquiryModal from "./AddEnquiryModal";
import { Enquiry as EnquiryType } from "./types";
import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { GenericTable } from "@/components/shared/GenericTable";
import { menuContent } from "@/components/shared/TableMenuContent";
import { toast } from "sonner";

export default function Enquiry() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<EnquiryType[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [open, setOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryType | null>(null);

  const handleEdit = useCallback((enquiry: EnquiryType) => {
    setSelectedEnquiry(enquiry);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedEnquiry(null);
    setOpen(false);
  }, []);

  const columns = useMemo(
    () => getEnquiryColumns(handleEdit, setRowSelection),
    [handleEdit]
  );

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

  const handleBulkDelete = async (enquiries: EnquiryType[]) => {
    try {
      const deletePromises = enquiries.map((enquiry) =>
        deleteDoc(doc(firestore, "enquiry", enquiry.enquiryId))
      );
      await Promise.all(deletePromises);
      setRowSelection({});
      toast.success("Selected enquiries deleted successfully");
    } catch (error) {
      console.error("Bulk delete failed:", error);
      toast.error("Failed to delete selected enquiries");
    }
  };

  const handleBulkConvert = async (enquiries: EnquiryType[]) => {
    try {
      const convertPromises = enquiries.map(async (enquiry) => {
        const clientsRef = collection(firestore, "clients");
        const modifiedId = enquiry.enquiryId.replace(/^enquiry/, "client");

        await setDoc(doc(clientsRef, modifiedId), {
          name: enquiry.name,
          phoneNo: enquiry.phoneNo,
          address: enquiry.address,
          source: "enquiry",
          originalEnquiryId: modifiedId,
          createdAt: new Date().toISOString(),
        });

        await deleteDoc(doc(firestore, "enquiry", enquiry.enquiryId));
      });

      await Promise.all(convertPromises);
      setRowSelection({});
      toast.success("Selected enquiries converted to clients successfully");
    } catch (error) {
      console.error("Bulk convert failed:", error);
      toast.error("Failed to convert selected enquiries to clients");
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "enquiry"), (snapshot) => {
      const result: EnquiryType[] = snapshot.docs.map((doc) => ({
        enquiryId: doc.id,
        name: doc.data().name || "",
        phoneNo: doc.data().phoneNo || "",
        address: doc.data().address || "",
      }));
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
                {
                  label: "Convert to Client",
                  onClick: handleBulkConvert,
                },
              ],
            })}
            onOpenChange={setOpen}
          />
          <GenericTable table={table} />
          <Pagination table={table} />
        </>
      )}
      <AddEnquiryModal enquiry={selectedEnquiry} open={open} onOpenChange={handleClose} />
    </div>
  );
}
