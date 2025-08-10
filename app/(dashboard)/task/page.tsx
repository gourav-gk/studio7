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
import { toast } from "sonner";
import { getTaskColumns, RawTask, Task } from "./columns";

export default function TasksTable() {
  const [isLoading, setIsLoading] = useState(true);
  const [flatTasks, setFlatTasks] = useState<Task[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // columns (inline for clarity)
  const columns = useMemo(() => getTaskColumns(), []);

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
          let date: Date;
          if (t.deliveryDate) {
            date = new Date(t.assignedDate);
          } else {
            date = new Date();
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
            date,
            status,
            projectId: t.projectId,
            shootId: t.shootId,
            role: t.role,
          });
        });
      });

      // sort by date descending
      all.sort((a, b) => b.date.getTime() - a.date.getTime());

      setFlatTasks(all);
      setIsLoading(false);
    });

    return () => unsub();
  }, [usersMap]); // re-run if usersMap changes (to update names)

  // Bulk delete: remove selected tasks from the corresponding user docs (task/{userId})
  const handleBulkDelete = useCallback(async (selected: Task[]) => {
    if (selected.length === 0) return;
    try {
      // Group tasks by userId so we only fetch/update each user doc once
      const byUser = selected.reduce<Record<string, Task[]>>((acc, t) => {
        (acc[t.employeeId] = acc[t.employeeId] || []).push(t);
        return acc;
      }, {});

      const updates: Promise<void>[] = Object.entries(byUser).map(
        async ([userId, tasksToRemove]) => {
          const taskDocRef = doc(firestore, "task", userId);
          const snap = await getDoc(taskDocRef);
          if (!snap.exists()) return;

          const existing: RawTask[] = Array.isArray(snap.data().tasks) ? snap.data().tasks : [];

          // Build a filter that removes any task that matches characteristics of the selected tasks
          const filtered = existing.filter((et) => {
            // If any selected task matches this existing task by key properties, we should remove it
            const shouldRemove = tasksToRemove.some((st) => {
              const r = st.raw;
              // compare by many fields to ensure match: createdAt, assignedDate, shootId, projectId, role, employeeId, type
              return (
                (String(et.createdAt || "") === String(r.createdAt || "") &&
                  String(et.assignedDate || "") === String(r.assignedDate || "") &&
                  String(et.shootId || "") === String(r.shootId || "") &&
                  String(et.projectId || "") === String(r.projectId || "") &&
                  String(et.employeeId || "") === String(r.employeeId || "") &&
                  String(et.role || "") === String(r.role || "") &&
                  String(et.type || "") === String(r.type || "")) ||
                // fallback: also compare deliverableName + deliveryDate + employeeId
                (String(et.deliverableName || "") === String(r.deliverableName || "") &&
                  String(et.deliveryDate || "") === String(r.deliveryDate || "") &&
                  String(et.employeeId || "") === String(r.employeeId || ""))
              );
            });
            return !shouldRemove;
          });

          await updateDoc(taskDocRef, { tasks: filtered });
        }
      );

      await Promise.all(updates);

      toast.success("Selected tasks removed.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete selected tasks.");
    }
  }, []);

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
                  label: "Delete Selected",
                  onClick: handleBulkDelete,
                  className: "text-red-600",
                },
              ],
            })}
          />
          <GenericTable table={table} />
          <Pagination table={table} />
        </>
      )}
    </div>
  );
}
