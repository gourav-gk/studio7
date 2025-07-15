// import { Table } from "@tanstack/react-table";
import React from "react";
import { DataTable } from "@/components/ui/data-table";
import { Employee } from "./types";

import {  ColumnDef } from "@tanstack/react-table";
export function EmployeeDataTable({
  columns,
  data,
}: {
  columns: ColumnDef<Employee, unknown>[]; // changed `any` → `unknown`
  data: Employee[];
}) {
  return <DataTable columns={columns} data={data} />;
}


// ✅ AddEmployeeModal.tsx (basic skeleton)
import { Dialog, DialogContent } from "@/components/ui/dialog";


export default function AddEmployeeModal({
  client,
  open,
  onOpenChange,
}: {
  client: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Form implementation goes here */}
        <div>Edit Employee: {client?.name}</div>
      </DialogContent>
    </Dialog>
  );
}
