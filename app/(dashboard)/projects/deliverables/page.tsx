"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useProjectsView } from "../../../../hooks/useProjectsView";
import { getDeliverableColumns, DeliverableRow } from "./columns";
import { GenericTable } from "@/components/shared/GenericTable";
import TableSkeleton from "@/components/shared/skeletons/TableSkeleton";
import Pagination from "@/components/shared/Pagination";
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, ColumnFiltersState, VisibilityState } from "@tanstack/react-table";
import { collection, doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { Employee } from "@/app/(dashboard)/employee/view/types";
import { MultiSelect, Option } from "@/components/shared/MultiSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Task = {
  deliverableId?: string;
  deliverableName?: string;
  projectId?: string;
  employeeId?: string;
  assignedDate?: string;
  deliveryDate?: string;
  completeDate?: string;
  createdAt?: string;
  type?: string;
};

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
    const map: Record<string, string> = {};
    employees.forEach(emp => {
      map[emp.uId] = emp.name;
    });
    return map;
  }, [employees]);

  // Flatten all deliverables from all projects, including projectName and assignedEmployees
  const allDeliverables: DeliverableRow[] = useMemo(() =>
    data.flatMap(project =>
      Array.isArray(project.deliverables)
        ? (project.deliverables as DeliverableRow[]).map((d: DeliverableRow, idx: number) => ({
            id: d.id || `${project.projectId}-${idx}`,
            name: d.name || String(d),
            qty: d.qty || "",
            projectName: project.projectName,
            assignedEmployees: Array.isArray(d.assignedEmployees) ? d.assignedEmployees : [],
            _projectId: project.projectId, // for update reference
            createdAt: (d as Partial<DeliverableRow> & { createdAt?: string }).createdAt || "",
            completeDate: (d as Partial<DeliverableRow> & { completeDate?: string }).completeDate || "",
            deliveryDate: (d as Partial<DeliverableRow> & { deliveryDate?: string }).deliveryDate || "",
          }))
        : []
    ),
    [data]
  );

  // Map to store fetched task dates for each deliverable-employee pair
  const [taskDatesMap, setTaskDatesMap] = useState<Record<string, { assignedDate?: string; completeDate?: string; deliveryDate?: string }>>({});

  // Fetch assignedDate and completeDate for each deliverable-employee pair from task collection
  useEffect(() => {
    // Use onSnapshot for real-time updates
    const unsubscribes: (() => void)[] = [];
    let isMounted = true;
    const deliverableRows = allDeliverables;
    const newMap: Record<string, { assignedDate?: string; completeDate?: string; deliveryDate?: string }> = {};
    const employeeIds = new Set<string>();
    for (const deliverable of deliverableRows) {
      if (!Array.isArray(deliverable.assignedEmployees)) continue;
      for (const empId of deliverable.assignedEmployees) {
        employeeIds.add(empId);
      }
    }
    employeeIds.forEach(empId => {
      const employeeTaskDocRef = doc(firestore, "task", empId);
      const unsubscribe = onSnapshot(employeeTaskDocRef, (docSnap) => {
        if (!isMounted) return;
        const data = docSnap.exists() ? docSnap.data() : {};
        const tasks: Task[] = Array.isArray(data.tasks) ? data.tasks : [];
        for (const deliverable of deliverableRows) {
          if (!Array.isArray(deliverable.assignedEmployees) || !deliverable.assignedEmployees.includes(empId)) continue;
          const task = tasks.find((t: Task) => t.deliverableId === deliverable.id);
          if (task) {
            newMap[`${deliverable.id}_${empId}`] = {
              assignedDate: task.assignedDate,
              completeDate: task.completeDate,
              deliveryDate: task.deliveryDate,
            };
          }
        }
        setTaskDatesMap(current => ({ ...current, ...newMap }));
      });
      unsubscribes.push(unsubscribe);
    });
    return () => {
      isMounted = false;
      unsubscribes.forEach(unsub => unsub());
    };
  }, [allDeliverables]);

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
    setSelectedDeliverableProjectId((deliverable as Partial<DeliverableRow> & { _projectId?: string })._projectId || null);
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
      const project = data.find(p => p.projectId === selectedDeliverableProjectId);
      if (!project) throw new Error("Project not found");
      const now = new Date().toISOString();
      // Find previous assigned employees for this deliverable
      const prevDeliverable = (project.deliverables as DeliverableRow[]).find((d: DeliverableRow) => d.id === selectedDeliverable.id);
      const prevAssignedEmployees: string[] = Array.isArray(prevDeliverable?.assignedEmployees) ? prevDeliverable.assignedEmployees : [];
      // Detect removed employees (all previous if assignedEmployees is empty)
      const removedEmployees: string[] = prevAssignedEmployees.filter(empId => !selectedEmployeeIds.includes(empId));
      // Remove ONLY the task for this deliverable from each removed employee's task document
      for (const empId of removedEmployees) {
        const employeeTaskDocRef = doc(firestore, "task", empId);
        const docSnap = await getDoc(employeeTaskDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const tasks: Task[] = Array.isArray(data.tasks) ? data.tasks : [];
          // Only remove the task for this deliverable, leave other tasks untouched
          const newTasks = tasks.filter((task: Task) => task.deliverableId !== selectedDeliverable.id);
          await setDoc(employeeTaskDocRef, { tasks: newTasks }, { merge: true });
        }
      }
      // If assignedEmployees is empty, skip assignment logic
      if (selectedEmployeeIds.length === 0) {
        setAssignModalOpen(false);
        return;
      }
      const updatedDeliverables = (project.deliverables as DeliverableRow[]).map(d =>
        d.id === selectedDeliverable.id
          ? {
              ...d,
              assignedEmployees: selectedEmployeeIds,
              createdAt: (d as Partial<DeliverableRow> & { createdAt?: string }).createdAt || now,
              deliveryDate: deliveryDate || (d as Partial<DeliverableRow> & { deliveryDate?: string }).deliveryDate || "",
              assignedDate: assignedDate || (d as Partial<DeliverableRow> & { assignedDate?: string }).assignedDate || "",
            }
          : d
      );
      await updateDoc(projectDocRef, { deliverables: updatedDeliverables });

      // --- New: Per-employee document in 'task' collection with date range overlap check ---
      if (selectedEmployeeIds.length > 0 && assignedDate && deliveryDate) {
        const start = new Date(assignedDate);
        const end = new Date(deliveryDate);
        function rangesOverlap(start1: Date, end1: Date, start2: Date, end2: Date) {
          return start1 <= end2 && start2 <= end1;
        }
        // First, check all selected employees for conflicts
        let conflictFound = false;
        const conflictedEmployees: string[] = [];
        for (const empId of selectedEmployeeIds) {
          const employeeTaskDocRef = doc(firestore, "task", empId);
          const docSnap = await getDoc(employeeTaskDocRef);
          const existingTasks: Task[] = docSnap.exists() ? (Array.isArray(docSnap.data().tasks) ? docSnap.data().tasks : []) : [];
          for (const task of existingTasks) {
            if (!task.assignedDate) continue;
            const taskStart = new Date(task.assignedDate);
            const taskEnd = task.completeDate ? new Date(task.completeDate)
                              : task.deliveryDate ? new Date(task.deliveryDate)
                              : new Date(task.assignedDate);
            if (rangesOverlap(start, end, taskStart, taskEnd)) {
              conflictFound = true;
              conflictedEmployees.push(empId);
              break;
            }
          }
          if (conflictFound) break;
        }
        if (conflictFound) {
          // Remove conflicted employees from the dropdown (UI) but do NOT delete their data
          setSelectedEmployeeIds(prev => prev.filter(id => !conflictedEmployees.includes(id)));
          toast.error('already assigned task, choose another employee');
          return;
        }
        // If no conflicts, assign to all selected employees
        let assignedAny = false;
        for (const empId of selectedEmployeeIds) {
          const employeeTaskDocRef = doc(firestore, "task", empId);
          const docSnap = await getDoc(employeeTaskDocRef);
          const existingTasks: Task[] = docSnap.exists() ? (Array.isArray(docSnap.data().tasks) ? docSnap.data().tasks : []) : [];
          const now = new Date().toISOString();
          const newTask: Task = {
            type: 'deliverable',
            deliverableId: selectedDeliverable.id,
            deliverableName: selectedDeliverable.name,
            projectId: selectedDeliverableProjectId,
            employeeId: empId,
            assignedDate: new Date(assignedDate).toISOString().slice(0, 10),
            deliveryDate: new Date(deliveryDate).toISOString().slice(0, 10),
            createdAt: now,
          };
          await setDoc(employeeTaskDocRef, { tasks: [...existingTasks, newTask] }, { merge: true });
          assignedAny = true;
        }
        if (assignedAny) {
          toast.success("Assigned employees updated and task created");
        }
      }
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
          const deliveryDate = (row.original as Partial<DeliverableRow> & { deliveryDate?: string }).deliveryDate;
          const dateToShow = completeDate || deliveryDate;
          return (
            <div>
              {typeof dateToShow === 'string' || typeof dateToShow === 'number' || dateToShow instanceof Date
                ? new Date(dateToShow).toLocaleString()
                : "-"}
            </div>
          );
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
      },
      {
        id: "assignedDateFetched",
        header: "Assigned Date",
        cell: ({ row }) => {
          const deliverable = row.original;
          if (!Array.isArray(deliverable.assignedEmployees) || deliverable.assignedEmployees.length === 0) return "-";
          const empId = deliverable.assignedEmployees[0];
          const key = `${deliverable.id}_${empId}`;
          const date = taskDatesMap[key]?.assignedDate;
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        id: "completeDateFetched",
        header: "Task Completion Date",
        cell: ({ row }) => {
          const deliverable = row.original;
          if (!Array.isArray(deliverable.assignedEmployees) || deliverable.assignedEmployees.length === 0) return "-";
          const empId = deliverable.assignedEmployees[0];
          const key = `${deliverable.id}_${empId}`;
          const date = taskDatesMap[key]?.completeDate || taskDatesMap[key]?.deliveryDate;
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      }
    );
    return baseCols.filter(col => 'accessorKey' in col ? (col as Partial<{ accessorKey?: string }>).accessorKey !== "deliveryDate" : true); // Remove deliveryDate column if present
  }, [handleEdit, handleAssignEmployee, employeeMap, taskDatesMap]);

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