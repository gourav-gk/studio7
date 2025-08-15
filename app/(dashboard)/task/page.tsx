"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import { collection, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { GenericTable } from "@/components/shared/GenericTable";
import Pagination from "@/components/shared/Pagination";
import TableSkeleton from "@/components/shared/skeletons/TableSkeleton";
import TableActions from "@/components/shared/TableActions";
import { menuContent } from "@/components/shared/TableMenuContent";
import { getTaskColumns, RawTask, Task } from "./columns";
import AddTaskModal from "./AddTaskModal";
import { toast } from "sonner";

export default function TasksTable() {
  const [isLoading, setIsLoading] = useState(true);
  const [flatTasks, setFlatTasks] = useState<Task[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [open, setOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState({});
  const [selectedTask, setSelectedTask] = useState<Task>();

  const handleEdit = useCallback((task: Task) => {
    setSelectedTask(task);
    setOpen(true);
  }, []);

  const handleDelete = useCallback(async (task: Task) => {
    try {
      const taskDocRef = doc(firestore, "task", task.employeeId);
      const snap = await getDoc(taskDocRef);

      if (!snap.exists()) {
        toast.error("Task not found");
        return;
      }

      const tasks = snap.data()?.tasks || [];
      const updatedTasks = tasks.filter((t: { taskId: string }) => t.taskId !== task.id);

      await updateDoc(taskDocRef, { tasks: updatedTasks });
      toast.success("Task deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete task");
    }
  }, []);

  // columns (inline for clarity)
  const columns = useMemo(
    () => getTaskColumns(handleEdit, handleDelete),
    [handleEdit, handleDelete]
  );

  const table = useReactTable({
    data: flatTasks,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  // Subscribe to users collection to build map userId -> name
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(firestore, "users"), (snap) => {
      const map: Record<string, string> = {};
      snap.forEach((d) => {
        const dt = d.data();
        map[d.id] = dt.name || dt.email || "Unknown";
      });
      setUsersMap(map);
    });
    return () => unsubUsers();
  }, []);

  // Subscribe to task collection (one doc per user, each has tasks array)
  useEffect(() => {
    setIsLoading(true);
    const unsub = onSnapshot(collection(firestore, "task"), (snapshot) => {
      const all: Task[] = [];

      snapshot.forEach((docSnap) => {
        const userId = docSnap.id;
        const docData = docSnap.data() || {};
        const tasks: RawTask[] = Array.isArray(docData.tasks) ? docData.tasks : [];
        tasks.forEach((t) => {
          const name = t.name;
          let deliveryDate: Date;
          let assignedDate: Date;
          if (t.deliveryDate) {
            deliveryDate = new Date(t.deliveryDate);
          } else {
            deliveryDate = new Date();
          }
          if (t.assignedDate) {
            assignedDate = new Date(t.assignedDate);
          } else {
            assignedDate = new Date();
          }
          const status = (t.status as string) || "Pending";
          const employeeName = usersMap[userId];
          const id = t.taskId;
          all.push({
            id,
            raw: t,
            name,
            employeeId: t.employeeId || userId,
            employeeName,
            deliveryDate,
            assignedDate,
            status,
            projectId: t.projectId,
            shootId: t.shootId,
            role: t.role,
          });
        });
      });

      // sort by date descending
      all.sort((a, b) => b.deliveryDate.getTime() - a.deliveryDate.getTime());

      setFlatTasks(all);
      setIsLoading(false);
    });

    return () => unsub();
  }, [usersMap]); // re-run if usersMap changes (to update names)

  async function updateTaskStatus(tasks: Task[], newStatus: string) {
    try {
      // Group tasks by employeeId so we update each Firestore doc once
      const groupedByUser: Record<string, Task[]> = {};
      tasks.forEach((task) => {
        if (!groupedByUser[task.employeeId]) {
          groupedByUser[task.employeeId] = [];
        }
        groupedByUser[task.employeeId].push(task);
      });

      for (const [employeeId, userTasks] of Object.entries(groupedByUser)) {
        const taskDocRef = doc(firestore, "task", employeeId);
        const snap = await getDoc(taskDocRef);

        if (!snap.exists()) continue;

        const existingTasks = snap.data()?.tasks || [];
        const updatedTasks = existingTasks.map((t: {taskId:string}) =>
          userTasks.some((ut) => ut.id === t.taskId) ? { ...t, status: newStatus } : t
        );

        await updateDoc(taskDocRef, { tasks: updatedTasks });
      }

      toast.success(`Tasks marked as ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update tasks");
    }
  }

  function handleMarkOngoing() {
    const selectedTasks = table.getSelectedRowModel().rows.map((r) => r.original);
    const pendingTasks = selectedTasks.filter((t) => t.status === "Pending");

    if (pendingTasks.length === 0) {
      toast.error("No pending tasks selected");
      return;
    }

    updateTaskStatus(pendingTasks, "Ongoing");
  }

  function handleMarkedCompleted() {
    const selectedTasks = table.getSelectedRowModel().rows.map((r) => r.original);
    const nonCompletedTasks = selectedTasks.filter((t) => t.status !== "Completed");

    if (nonCompletedTasks.length === 0) {
      toast.error("No tasks to mark as completed");
      return;
    }

    updateTaskStatus(nonCompletedTasks, "Completed");
  }

  return (
    <div className="w-full">
      {isLoading ? (
        <TableSkeleton columnCount={6} rowCount={6} />
      ) : (
        <>
          <TableActions
            table={table}
            data={flatTasks}
            menuContent={menuContent({
              selectedRows: table.getSelectedRowModel().rows.map((r) => r.original),
              actions: [
                {
                  label: "Mark Ongoing",
                  onClick: handleMarkOngoing,
                  className: "text-blue-600",
                },
                {
                  label: "Mark Completed",
                  onClick: handleMarkedCompleted,
                  className: "text-green-600",
                },
              ],
            })}
            onOpenChange={setOpen}
            statusFilter={true}
          />
          <GenericTable table={table} />
          <Pagination table={table} />
          <AddTaskModal
            open={open}
            onOpenChange={handleClose}
            employees={usersMap}
            task={selectedTask}
          />
        </>
      )}
    </div>
  );
}
