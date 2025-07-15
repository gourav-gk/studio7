"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { EmployeeDataTable } from "./table";
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
import { getEmployeeColumns } from "./columns";
import AddEmployeeModal from "./AddEmployeeModal";
import { Employee } from "./types";
import { collection, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

function Employees() {
  const [data, setData] = useState<Employee[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [open, onOpenChange] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const handleEdit = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    onOpenChange(true);
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
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

 useEffect(() => {
  const unsubscribe = onSnapshot(collection(firestore, "users"), (snapshot) => {
    const result: Employee[] = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        employeeId: doc.id,
        uId: data.uId ?? doc.id, // fallback to doc.id if uId is missing
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
        createdAt: data.createdAt ?? new Date().toISOString(),
        assignedCompany: data.assignedCompany ?? {},
        salaryHistory: data.salaryHistory ?? {},
        accessLevelMap: data.accessLevelMap ?? {},
      };
    });

    setData(result);
  });

  return () => unsubscribe();
}, []);



  



  return (
    <ProtectedRoute>
      <div className="w-full">
        <TableActions table={table} data={data} onOpenChange={onOpenChange} />
        <EmployeeDataTable columns={columns} data={data} />

        <Pagination table={table} />
      </div>
      <AddEmployeeModal employee={selectedEmployee} open={open} onOpenChange={handleClose} />
    </ProtectedRoute>
  );
}

export default Employees;
