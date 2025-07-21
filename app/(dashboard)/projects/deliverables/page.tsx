"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useProjectsView } from "../../../../hooks/useProjectsView";
import { getDeliverableColumns, DeliverableRow } from "./columns";
import { GenericTable } from "@/components/shared/GenericTable";
import TableSkeleton from "@/components/shared/skeletons/TableSkeleton";
import Pagination from "@/components/shared/Pagination";
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, ColumnFiltersState, VisibilityState } from "@tanstack/react-table";
import { collection, doc, onSnapshot, updateDoc, setDoc, getDocs, getDoc, doc as firestoreDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { Employee } from "@/app/(dashboard)/employee/view/types";
import { MultiSelect, Option } from "@/components/shared/MultiSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

function ProjectDeliverables() {
  const { isLoading, data } = useProjectsView();
  const [selectedDeliverable, setSelectedDeliverable] = useState<DeliverableRow | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDeliverableProjectId, setSelectedDeliverableProjectId] = useState<string | null>(null);
  const [assignedDate, setAssignedDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");

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

  // Employee map for quick lookup
  const employeeMap = useMemo(() => {
    const map = {};
    employees.forEach(emp => {
      map[emp.uId] = emp.name;
    });
    return map;
  }, [employees]);

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
            createdAt: d.createdAt || "",
            completeDate: d.completeDate || "",
            deliveryDate: d.deliveryDate || "",
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
    setAssignedDate("");
    setDeliveryDate("");
    setAssignModalOpen(true);
  }, []);

  // Save assigned employees and create task in Firestore
  const handleSaveAssign = async () => {
    if (!selectedDeliverable || !selectedDeliverableProjectId) return;
    try {
      // Find the project and update the deliverable's assignedEmployees and task info
      const projectDocRef = doc(firestore, "projects", selectedDeliverableProjectId);
      // Find the project in data
      const project = data.find(p => p.projectId === selectedDeliverableProjectId);
      if (!project) throw new Error("Project not found");
      const now = new Date().toISOString();
      const updatedDeliverables = (project.deliverables as any[]).map(d =>
        d.id === selectedDeliverable.id
          ? {
              ...d,
              assignedEmployees: selectedEmployeeIds,
              createdAt: d.createdAt || now,
              deliveryDate: deliveryDate || d.deliveryDate || "",
              assignedDate: assignedDate || d.assignedDate || "",
            }
          : d
      );
      await updateDoc(projectDocRef, { deliverables: updatedDeliverables });
      // --- New: Create task in Firestore ---
      if (selectedEmployeeIds.length > 0 && assignedDate && deliveryDate) {
        const today = format(new Date(), "yyyyMMdd");
        const taskDocRef = firestoreDoc(firestore, "task", today);
        // Fetch existing tasks
        let existingTasks = [];
        const docSnap = await getDoc(taskDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.tasks)) {
            existingTasks = data.tasks;
          }
        }
        // Prepare array of maps (one per selected employee)
        const taskArray = selectedEmployeeIds.map(empId => ({
          deliverableId: selectedDeliverable.id,
          deliverableName: selectedDeliverable.name,
          projectId: selectedDeliverableProjectId,
          employeeId: empId,
          assignedDate,
          deliveryDate,
          createdAt: now,
        }));
        // Write back the combined array
        await setDoc(taskDocRef, { tasks: [...existingTasks, ...taskArray] }, { merge: true });
      }
      toast.success("Assigned employees updated and task created");
      setAssignModalOpen(false);
    } catch (err) {
      toast.error("Failed to assign employees or create task");
      console.error(err);
    }
  };

  // Update columns to include new fields
  const columns = useMemo(() => {
    const baseCols = getDeliverableColumns(handleEdit, handleAssignEmployee);
    // Insert new columns after projectName
    baseCols.splice(2, 0,
      {
        accessorKey: "createdAt",
        header: "Task Creation Date",
        cell: ({ row }) => <div>{row.getValue("createdAt") ? new Date(row.getValue("createdAt")).toLocaleString() : "-"}</div>,
      },
      {
        accessorKey: "completeDate",
        header: "Task Completion Date",
        cell: ({ row }) => {
          const completeDate = row.getValue("completeDate");
          const deliveryDate = row.original.deliveryDate;
          const dateToShow = completeDate || deliveryDate;
          return <div>{dateToShow ? new Date(dateToShow).toLocaleString() : "-"}</div>;
        },
      },
      {
        accessorKey: "assignedEmployees",
        header: "Assigned Persons",
        cell: ({ row }) => {
          const ids = row.getValue("assignedEmployees") || [];
          if (!Array.isArray(ids) || ids.length === 0) return "-";
          return ids.map(id => employeeMap[id] || id).join(", ");
        },
      }
    );
    return baseCols.filter(col => col.accessorKey !== "deliveryDate"); // Remove deliveryDate column if present
  }, [handleEdit, handleAssignEmployee, employeeMap]);

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
          <div className="py-4 space-y-4">
            <MultiSelect
              options={employeeOptions}
              selected={selectedEmployeeIds}
              onChange={setSelectedEmployeeIds}
              placeholder="Select employees..."
            />
            <div>
              <label className="block mb-1 font-medium">Assigned Date</label>
              <input
                type="date"
                className="border rounded px-2 py-1 w-full"
                value={assignedDate}
                onChange={e => setAssignedDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Delivery Task Date</label>
              <input
                type="date"
                className="border rounded px-2 py-1 w-full"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
              />
            </div>
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