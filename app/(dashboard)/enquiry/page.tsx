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
import { getEnquiryColumns, menuContent } from "./columns";
import AddEnquiryModal from "./AddEnquiryModal";
import { Enquiry as EnquiryType } from "./types";
import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { GenericTable } from "@/components/shared/GenericTable";

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

  const columns = useMemo(() => getEnquiryColumns(handleEdit), [handleEdit]);

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
      alert("Selected enquiries deleted successfully.");
    } catch (error) {
      console.error("Bulk delete failed:", error);
      alert("Failed to delete selected enquiries.");
    }
  };

  const handleBulkConvertToClient = async (enquiries: EnquiryType[]) => {
    try {
      const clientsRef = collection(firestore, "clients");
      const convertPromises = enquiries.map((enquiry) => {
        const modifiedId = enquiry.enquiryId.replace(/^enquiry/, "client");
        return setDoc(doc(clientsRef, modifiedId), {
          name: enquiry.name,
          phoneNo: enquiry.phoneNo,
          address: enquiry.address,
          source: "enquiry",
          originalEnquiryId: modifiedId,
          createdAt: new Date().toISOString(),
        });
      });

      await Promise.all(convertPromises);
      alert("Selected enquiries converted to clients.");
    } catch (error) {
      console.error("Bulk convert failed:", error);
      alert("Failed to convert selected enquiries.");
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "enquiry"), (snapshot) => {
      const result: EnquiryType[] = snapshot.docs.map((doc) => ({
        enquiryId: doc.id,
        ...doc.data(),
      })) as EnquiryType[];
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
            menuContent={menuContent(selectedRows, handleBulkDelete, handleBulkConvertToClient)}
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
