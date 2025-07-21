"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useProjectsView } from "../../../../hooks/useProjectsView";
import { getDeliverableColumns, DeliverableRow } from "./columns";
import { GenericTable } from "@/components/shared/GenericTable";
import TableSkeleton from "@/components/shared/skeletons/TableSkeleton";
import Pagination from "@/components/shared/Pagination";
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, ColumnFiltersState, VisibilityState } from "@tanstack/react-table";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { Employee } from "@/app/(dashboard)/employee/view/types";
import { MultiSelect, Option } from "@/components/shared/MultiSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function ProjectDeliverables() {
  const { isLoading, data } = useProjectsView();
  const [selectedDeliverable, setSelectedDeliverable] = useState<DeliverableRow | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDeliverableProjectId, setSelectedDeliverableProjectId] = useState<string | null>(null);

  // Fetch employees
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "users"), (snapshot) => {
      const result: Employee[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
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
      setEmployees(result);
    });
    return () => unsubscribe();
  }, []);

  // Flatten all deliverables from all projects, including projectName and assignedEmployees
  const allDeliverables: DeliverableRow[] = useMemo(() =>
    data.flatMap(project =>
      Array.isArray(project.deliverables)
        ? (project.deliverables as any[]).map((d, idx) => ({
            id: d.id || `${project.projectId}-${idx}`,
            name: d.name || String(d),
            qty: d.qty || "",
            projectName: project.projectName,
            assignedEmployees: d.assignedEmployees || [],
            _projectId: project.projectId, // for update reference
          }))
        : []
    ),
    [data]
  );

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // Edit handler (placeholder)
  const handleEdit = useCallback((deliverable: DeliverableRow) => {
    setSelectedDeliverable(deliverable);
  }, []);

  // Assign Employee handler
  const handleAssignEmployee = useCallback((deliverable: DeliverableRow) => {
    setSelectedDeliverable(deliverable);
    setSelectedEmployeeIds(deliverable.assignedEmployees || []);
    setSelectedDeliverableProjectId((deliverable as any)._projectId || null);
    setAssignModalOpen(true);
  }, []);

  // Save assigned employees
  const handleSaveAssign = async () => {
    if (!selectedDeliverable || !selectedDeliverableProjectId) return;
    try {
      // Find the project and update the deliverable's assignedEmployees
      const projectDocRef = doc(firestore, "projects", selectedDeliverableProjectId);
      // Find the project in data
      const project = data.find(p => p.projectId === selectedDeliverableProjectId);
      if (!project) throw new Error("Project not found");
      const updatedDeliverables = (project.deliverables as any[]).map(d =>
        d.id === selectedDeliverable.id ? { ...d, assignedEmployees: selectedEmployeeIds } : d
      );
      await updateDoc(projectDocRef, { deliverables: updatedDeliverables });
      toast.success("Assigned employees updated");
      setAssignModalOpen(false);
    } catch (err) {
      toast.error("Failed to assign employees");
      console.error(err);
    }
  };

  const columns = useMemo(() => getDeliverableColumns(handleEdit, handleAssignEmployee), [handleEdit, handleAssignEmployee]);

  const table = useReactTable({
    data: allDeliverables,
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

  // Employee options for MultiSelect
  const employeeOptions: Option[] = employees.map(emp => ({ value: emp.uId, label: emp.name }));

  return (
    <div className="w-full p-4">
      <h1 className="text-3xl font-bold mb-6">All Project Deliverables</h1>
      {isLoading ? (
        <TableSkeleton columnCount={4} rowCount={5} />
      ) : (
        <>
          <GenericTable table={table} />
          <Pagination table={table} />
        </>
      )}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Employee(s) to Deliverable</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <MultiSelect
              options={employeeOptions}
              selected={selectedEmployeeIds}
              onChange={setSelectedEmployeeIds}
              placeholder="Select employees..."
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveAssign}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProjectDeliverables;