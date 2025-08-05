"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useProjectsView } from "../../../../hooks/useProjectsView";
import { getShootColumns, ShootRow } from "./columns";
import { GenericTable } from "@/components/shared/GenericTable";
import TableSkeleton from "@/components/shared/skeletons/TableSkeleton";
import Pagination from "@/components/shared/Pagination";
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, ColumnFiltersState, VisibilityState } from "@tanstack/react-table";
import { collection, doc, onSnapshot, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { Employee } from "@/app/(dashboard)/employee/view/types";
import { MultiSelect, Option } from "@/components/shared/MultiSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Task = {
  shootId?: string;
  shootName?: string;
  projectId?: string;
  employeeId?: string;
  assignedDate?: string;
  deliveryDate?: string;
  completeDate?: string;
  createdAt?: string;
  type?: string;
};

export default function ProjectShootsPage() {
  const { isLoading, data } = useProjectsView();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedShoot, setSelectedShoot] = useState<ShootRow | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  // const [employeeTasks, setEmployeeTasks] = useState<Record<string, Task[]>>({});

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

  // Prepare shoots data for table
  const allShoots: ShootRow[] = useMemo(() =>
    data.flatMap(project =>
      (Array.isArray(project.shoots) ? project.shoots : []).map((shoot: Record<string, unknown>) => ({
        ...shoot,
        projectName: project.projectName,
        projectId: project.projectId,
        assignedEmployees: (shoot as Record<string, unknown>).assignedEmployees || [],
      }) as ShootRow)
    ),
    [data]
  );

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // Assign Employee handler
  const handleAssignEmployee = useCallback((shoot: ShootRow) => {
    setSelectedShoot(shoot);
    setSelectedEmployeeIds(shoot.assignedEmployees || []);
    setAssignModalOpen(true);
  }, []);

  // Save assigned employees
  const handleSaveAssign = async () => {
    if (!selectedShoot) return;
    try {
      const projectDocRef = doc(firestore, "projects", selectedShoot.projectId);
      const project = data.find(p => p.projectId === selectedShoot.projectId);
      if (!project) throw new Error("Project not found");

      // --- Use single 'employee' document in 'task' collection, robust date handling ---
      if (selectedEmployeeIds.length > 0 && selectedShoot.date) {
        const ymd = new Date(selectedShoot.date).toISOString().slice(0, 10); // yyyy-MM-dd
        const employeeTaskDocRef = doc(firestore, "task", "employee");
        const docSnap = await getDoc(employeeTaskDocRef);
        let employeeTasks: Record<string, Task[]> = {};
        if (docSnap.exists()) {
          const data = docSnap.data() || {};
          // If the data is not in the expected format, coerce it
          employeeTasks = Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v as Task[] : []])
          );
        }
        for (const empId of selectedEmployeeIds) {
          const empTasks: Task[] = Array.isArray(employeeTasks[empId]) ? employeeTasks[empId] : [];
          let conflict = false;
          if (empTasks.some((task: Task) => task.assignedDate === ymd)) {
            conflict = true;
          }
          if (conflict) {
            toast.error('choose another date or another employee');
            return;
          }
        }
        // No conflict, assign
        const now = new Date().toISOString();
        for (const empId of selectedEmployeeIds) {
          const empTasks: Task[] = Array.isArray(employeeTasks[empId]) ? employeeTasks[empId] : [];
          const newTask = {
            type: 'shoot',
            shootId: selectedShoot.id,
            shootName: selectedShoot.day || selectedShoot.ritual || '',
            projectId: selectedShoot.projectId,
            employeeId: empId,
            assignedDate: ymd,
            createdAt: now,
          };
          empTasks.push(newTask);
          employeeTasks[empId] = empTasks;
        }
        await setDoc(employeeTaskDocRef, employeeTasks, { merge: true });
      }
      // Update shoots in project
      const updatedShoots = (project.shoots || []).map(shoot =>
        shoot.id === selectedShoot.id ? { ...shoot, assignedEmployees: selectedEmployeeIds } : shoot
      );
      await updateDoc(projectDocRef, { shoots: updatedShoots });
      toast.success("Assigned employees updated");
      setAssignModalOpen(false);
    } catch (err) {
      toast.error("Failed to assign employees");
      console.error(err);
    }
  };

  // Table columns
  const columns = useMemo(() => getShootColumns(handleAssignEmployee), [handleAssignEmployee]);

  const table = useReactTable({
    data: allShoots,
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
      <h1 className="text-3xl font-bold mb-6">All Project Shoots</h1>
      {isLoading ? (
        <TableSkeleton columnCount={12} rowCount={5} />
      ) : (
        <>
          <GenericTable table={table} />
          <Pagination table={table} />
        </>
      )}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Employee(s) to Shoot</DialogTitle>
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
