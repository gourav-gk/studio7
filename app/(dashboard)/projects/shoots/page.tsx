"use client";
import { v4 as uuidv4 } from "uuid";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useProjectsView } from "../../../../hooks/useProjectsView";
import { getShootColumns, ShootRow } from "./columns";
import { GenericTable } from "@/components/shared/GenericTable";
import TableSkeleton from "@/components/shared/skeletons/TableSkeleton";
import Pagination from "@/components/shared/Pagination";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { MultiSelect, Option } from "@/components/shared/MultiSelect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type RoleAssignments = {
  [role: string]: string[];
};

export default function ProjectShootsPage() {
  const { isLoading, data } = useProjectsView();
  const [employees, setEmployees] = useState<{ uId: string; name: string }[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedShoot, setSelectedShoot] = useState<ShootRow | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignments>({
    traditionalPhotographer: [],
    traditionalVideographer: [],
    candid: [],
    cinematographer: [],
    assistant: [],
    drone: [],
    others: [],
  });

  // Fetch employees
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "users"), (snapshot) => {
      const result: { uId: string; name: string }[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uId: data.uId ?? doc.id,
          name: data.name ?? "",
        };
      });
      setEmployees(result);
    });
    return () => unsubscribe();
  }, []);

  // Prepare shoots data for table
  const allShoots: ShootRow[] = useMemo(
    () =>
      data.flatMap((project) =>
        (Array.isArray(project.shoots) ? project.shoots : []).map(
          (shoot: Record<string, unknown>) =>
            ({
              ...shoot,
              projectName: project.projectName,
              projectId: project.projectId,
              assignedEmployees: (shoot as Record<string, unknown>).assignedEmployees || [],
            } as ShootRow)
        )
      ),
    [data]
  );

  // Assign Employee handler
  const handleAssignEmployee = useCallback((shoot: ShootRow) => {
    setSelectedShoot(shoot);

    // Pre-fill with existing assignments or default to empty arrays
    setRoleAssignments({
      traditionalPhotographer: shoot.assignedEmployees?.traditionalPhotographer || [],
      traditionalVideographer: shoot.assignedEmployees?.traditionalVideographer || [],
      candid: shoot.assignedEmployees?.candid || [],
      cinematographer: shoot.assignedEmployees?.cinematographer || [],
      assistant: shoot.assignedEmployees?.assistant || [],
      drone: shoot.assignedEmployees?.drone || [],
      others: shoot.assignedEmployees?.others || [],
    });

    setAssignModalOpen(true);
  }, []);

  // Save assigned employees
  const handleSaveAssign = async () => {
    if (!selectedShoot) return;

    try {
      const now = new Date().toISOString();
      const assignedDate = selectedShoot.date
        ? new Date(selectedShoot.date).toISOString().slice(0, 10)
        : now.slice(0, 10);

      // 1) update project document (only update the target shoot)
      const projectDocRef = doc(firestore, "projects", selectedShoot.projectId);
      const project = data.find((p) => p.projectId === selectedShoot.projectId);
      if (!project) throw new Error("Project not found");

      const updatedShoots = (project.shoots || []).map((s) =>
        s.id === selectedShoot.id ? { ...s, assignedEmployees: roleAssignments } : s
      );

      await updateDoc(projectDocRef, { shoots: updatedShoots });

      // 2) compute differences between previous assignments and new assignments
      const prevAssignments: RoleAssignments =
        (selectedShoot.assignedEmployees as RoleAssignments) || {};
      const allRoles = Array.from(
        new Set([...Object.keys(prevAssignments), ...Object.keys(roleAssignments)])
      );

      // For each role, compute added and removed employee ids
      for (const role of allRoles) {
        const prev = new Set(prevAssignments[role] || []);
        const curr = new Set(roleAssignments[role] || []);

        // ADDED: in curr but not in prev -> create task entry under task/{userId}
        for (const empUid of [...curr].filter((x) => !prev.has(x))) {
          const taskDocRef = doc(firestore, "task", empUid);
          const newTask = {
            taskId: uuidv4(),
            type: "shoot",
            shootId: selectedShoot.id,
            name: selectedShoot.day || selectedShoot.ritual || "",
            role,
            projectId: selectedShoot.projectId,
            employeeId: empUid,
            assignedDate,
            deliveryDate: assignedDate,
            createdAt: now,
            status: "Pending",
          };

          const snap = await getDoc(taskDocRef);
          if (snap.exists()) {
            // avoid duplicates: check if similar task exists
            const existingTasks = snap.data().tasks || [];
            const exists = existingTasks.some(
              (t: { type: string; shootId: string; projectId: string; role: string }) =>
                t.type === "shoot" &&
                t.shootId === newTask.shootId &&
                t.projectId === newTask.projectId &&
                t.role === newTask.role
            );
            if (!exists) {
              // append using arrayUnion (safe)
              await updateDoc(taskDocRef, { tasks: arrayUnion(newTask) });
            }
          } else {
            // create new doc with tasks array
            await setDoc(taskDocRef, { tasks: [newTask] });
          }
        }

        // REMOVED: in prev but not in curr -> remove any shoot tasks for that user
        for (const empUid of [...prev].filter((x) => !curr.has(x))) {
          const taskDocRef = doc(firestore, "task", empUid);
          const snap = await getDoc(taskDocRef);
          if (!snap.exists()) continue;
          const existingTasks = snap.data().tasks || [];

          // remove tasks that match this shoot (type 'shoot' and same shootId and projectId)
          const filtered = existingTasks.filter(
            (t: { type: string; shootId: string; projectId: string }) =>
              !(
                t.type === "shoot" &&
                t.shootId === selectedShoot.id &&
                t.projectId === selectedShoot.projectId
              )
          );

          // write back filtered array (replace tasks)
          await updateDoc(taskDocRef, { tasks: filtered });
        }
      }

      toast.success("Assigned employees & tasks synced");
      setAssignModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign employees");
    }
  };

  // Table columns
  const columns = useMemo(
    () => getShootColumns(handleAssignEmployee, employees),
    [handleAssignEmployee, employees]
  );

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
  const employeeOptions: Option[] = employees.map((emp) => ({ value: emp.uId, label: emp.name }));

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
          <div className="grid grid-cols-1 gap-4">
            {Object.keys(roleAssignments).map((role) => (
              <div key={role}>
                <label className="block mb-1 font-semibold capitalize">
                  {role.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                </label>
                <MultiSelect
                  options={employeeOptions}
                  selected={roleAssignments[role]}
                  onChange={(newSelection) => {
                    setRoleAssignments((prev) => ({ ...prev, [role]: newSelection }));
                  }}
                  placeholder={`Select ${role}...`}
                />
              </div>
            ))}
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
