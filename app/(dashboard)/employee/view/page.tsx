"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { GenericTable } from "@/components/shared/GenericTable";
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
import { getEmployeeColumns } from "./columns";
import AddEmployeeModal from "./AddEmployeeModal";
import { Employee } from "./types";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { menuContent } from "@/components/shared/TableMenuContent";

export default function Employees() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<Employee[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [open, setOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const handleEdit = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedEmployee(null);
  }, []);

  const columns = useMemo(() => getEmployeeColumns(handleEdit), [handleEdit]);

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

  const handleBulkDelete = async (employees: Employee[]) => {
    try {
      const deletePromises = employees.map((employee) =>
        deleteDoc(doc(firestore, "users", employee.uId))
      );
      await Promise.all(deletePromises);
      alert("Selected employees deleted successfully.");
    } catch (error) {
      console.error("Bulk delete failed:", error);
      alert("Failed to delete selected employees.");
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "users"), (snapshot) => {
      const result: Employee[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          employeeId: doc.id,
          uId: data.uId ?? doc.id,
          empId: data.empId ?? "",
          name: data.name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          gender: data.gender ?? "",
          address: data.address ?? "",
          salary: data.salary ?? "",
          paidSalary: data.paidSalary ?? 0,
          profileStatus: data.profileStatus ?? "Inactive",
          userType: data.userType ?? "employee",
          createdAt: data.createdAt ?? "",
          assignedCompany: data.assignedCompany ?? {},
          salaryHistory: data.salaryHistory ?? {},
          accessLevelMap: data.accessLevelMap ?? {},
          salaryStatus: data.salaryStatus ?? "Unpaid",
        };
      });

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
                  className: "text-red-600"
                }
              ]
            })}
            onOpenChange={setOpen} 
          />
          <GenericTable table={table} />
          <Pagination table={table} />
        </>
      )}
      <AddEmployeeModal employee={selectedEmployee} open={open} onOpenChange={handleClose} />
    </div>
  );
}
