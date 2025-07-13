"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { EnquiryDataTable } from "./table";
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
import { getEnquiryColumns, menuContent } from "./columns";
import AddEnquiryModal from "./AddEnquiryModal";
import { Enquiry as EnquiryType } from "./types";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";

function Enquiry() {
  const [data, setData] = useState<EnquiryType[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [open, onOpenChange] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryType | null>(null);

  const table = useReactTable({
    data,
    columns: [], // temp placeholder until defined below
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

  const handleEdit = useCallback((enquiry: EnquiryType) => {
    setSelectedEnquiry(enquiry);
    onOpenChange(true);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedEnquiry(null);
    onOpenChange(false);
  }, []);

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

 const columns = useMemo(
  () => getEnquiryColumns(handleEdit),
  [handleEdit]
);


  table.setOptions((prev) => ({ ...prev, columns }));

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "enquiry"), (snapshot) => {
      const result: EnquiryType[] = snapshot.docs.map((doc) => ({
        enquiryId: doc.id,
        ...doc.data(),
      })) as EnquiryType[];
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
          menuContent={menuContent(selectedRows, handleBulkDelete, handleBulkConvertToClient)}
          onOpenChange={onOpenChange}
        />
        <EnquiryDataTable table={table} />
        <Pagination table={table} />
      </div>
      <AddEnquiryModal
        enquiry={selectedEnquiry}
        open={open}
        onOpenChange={handleClose}
      />
    </ProtectedRoute>
  );
}

export default Enquiry;
