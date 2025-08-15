"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import { firestore } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Task } from "./columns";

interface AddTaskModalProps {
  open: boolean;
  onOpenChange?: () => void;
  employees?: Record<string, string>;
  task?: Task;
}

function AddTaskModal({ open, onOpenChange, employees, task }: AddTaskModalProps) {
  const [assignedName, setAssignedName] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [assignedDate, setAssignedDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");

  const isEdit = Boolean(task);

  // Prefill fields if editing
  useEffect(() => {
    if (isEdit && task) {
      setAssignedName(task.name);
      setAssignedTo(task.employeeId);
      setAssignedDate(
        task.assignedDate instanceof Date
          ? task.assignedDate.toISOString().split("T")[0]
          : task.assignedDate
      );

      setDeliveryDate(
        task.deliveryDate instanceof Date
          ? task.deliveryDate.toISOString().split("T")[0]
          : task.deliveryDate
      );
    } else {
      setAssignedName("");
      setAssignedTo("");
      setAssignedDate("");
      setDeliveryDate("");
    }
  }, [task, open]);

  const handleSubmit = async () => {
    if (!assignedName.trim() || !assignedTo.trim() || !assignedDate || !deliveryDate) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const taskDocRef = doc(firestore, "task", assignedTo);
      const snap = await getDoc(taskDocRef);

      if (isEdit && task) {
        // Edit mode: update the specific task inside tasks array
        if (!snap.exists()) {
          toast.error("Task not found");
          return;
        }
        const tasks = snap.data()?.tasks || [];
        const updatedTasks = tasks.map((t: { taskId: string }) =>
          t.taskId === task.id
            ? { ...t, name: assignedName, employeeId: assignedTo, assignedDate, deliveryDate }
            : t
        );
        await updateDoc(taskDocRef, { tasks: updatedTasks });
        toast.success("Task updated successfully");
      } else {
        // Add mode: append new task
        const newTask = {
          taskId: uuidv4(),
          name: assignedName,
          employeeId: assignedTo,
          assignedDate,
          deliveryDate,
          createdAt: new Date().toISOString(),
          status: "Pending",
          type: "Other",
        };

        if (snap.exists()) {
          await updateDoc(taskDocRef, { tasks: [...(snap.data()?.tasks || []), newTask] });
        } else {
          await setDoc(taskDocRef, { tasks: [newTask] });
        }
        toast.success("Task added successfully");
      }

      onOpenChange?.();
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "Add Task from Deliverable"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            placeholder="Assigned Name"
            value={assignedName}
            onChange={(e) => setAssignedName(e.target.value)}
          />
          <Select value={assignedTo} onValueChange={(value) => setAssignedTo(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Employee" />
            </SelectTrigger>
            <SelectContent className="w-full">
              {Object.entries(employees ?? {}).map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            placeholder="Assigned Date"
            value={assignedDate}
            onChange={(e) => setAssignedDate(e.target.value)}
          />
          <Input
            type="date"
            placeholder="Delivery Date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>{isEdit ? "Update Task" : "Save Task"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddTaskModal;
