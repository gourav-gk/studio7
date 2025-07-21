"use client";

import React, { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, where, orderBy, doc, getDoc, updateDoc, doc as firestoreDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

function getYMD(date) {
  return format(date, "yyyyMMdd");
}

const EmployeeTaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(getYMD(subDays(new Date(), 2)));
  const [endDate, setEndDate] = useState(getYMD(new Date()));
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', task: null });
  const [pendingReason, setPendingReason] = useState("");
  const [pendingDate, setPendingDate] = useState("");
  const [completeRemarks, setCompleteRemarks] = useState("");
  const [completeDate, setCompleteDate] = useState("");
  const [employees, setEmployees] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [projects, setProjects] = useState([]);

  // Fetch tasks for date range
  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      let docsToFetch = [];
      let cur = new Date(startDate.slice(0,4), Number(startDate.slice(4,6))-1, Number(startDate.slice(6,8)));
      let end = new Date(endDate.slice(0,4), Number(endDate.slice(4,6))-1, Number(endDate.slice(6,8)));
      while (cur <= end) {
        docsToFetch.push(getYMD(cur));
        cur.setDate(cur.getDate() + 1);
      }
      const allTasks = [];
      for (const docId of docsToFetch) {
        const docRef = doc(firestore, "task", docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.tasks)) {
            allTasks.push(...data.tasks.map(task => ({ ...task, _docId: docId })));
          }
        }
      }
      setTasks(allTasks);
      setLoading(false);
    }
    fetchTasks();
  }, [startDate, endDate]);

  // Fetch employees from the 'users' collection
  useEffect(() => {
    async function fetchEmployees() {
      const snapshot = await getDocs(collection(firestore, "users"));
      setEmployees(snapshot.docs.map(doc => ({ uId: doc.id, ...doc.data() })));
    }
    fetchEmployees();
  }, []);

  // Fetch deliverables from the 'deliverables' collection
  useEffect(() => {
    async function fetchDeliverables() {
      const snapshot = await getDocs(collection(firestore, "deliverables"));
      setDeliverables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    fetchDeliverables();
  }, []);

  // Fetch projects from the 'projects' collection
  useEffect(() => {
    async function fetchProjects() {
      const snapshot = await getDocs(collection(firestore, "projects"));
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    fetchProjects();
  }, []);

  const employeeMap = useMemo(() => {
    const map = {};
    employees.forEach(emp => {
      map[emp.uId] = emp.name;
    });
    return map;
  }, [employees]);

  const deliverableMap = useMemo(() => {
    const map = {};
    deliverables.forEach(d => {
      map[d.id] = d.name;
    });
    return map;
  }, [deliverables]);

  const projectMap = useMemo(() => {
    const map = {};
    projects.forEach(p => {
      map[p.id] = p.projectName || p.name;
    });
    return map;
  }, [projects]);

  // Pagination
  const pagedTasks = useMemo(() => {
    const start = (page - 1) * pageSize;
    return tasks.slice(start, start + pageSize);
  }, [tasks, page]);

  // Unique employees/deliverables for display (could be fetched for names)

  // Update task in Firestore (update the correct map in the correct doc)
  async function updateTaskInFirestore(task, updates) {
    const docRef = doc(firestore, "task", task._docId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;
    const data = docSnap.data();
    const updatedTasks = (data.tasks || []).map(t => {
      if (
        t.deliverableId === task.deliverableId &&
        t.employeeId === task.employeeId &&
        t.assignedDate === task.assignedDate
      ) {
        return { ...t, ...updates };
      }
      return t;
    });
    await updateDoc(docRef, { tasks: updatedTasks });
  }

  // Handle Pending
  async function handlePendingSave() {
    if (!actionDialog.task) return;
    await updateTaskInFirestore(actionDialog.task, {
      status: "Pending",
      pendingReason,
      pendingCompletionDate: pendingDate,
    });
    setActionDialog({ open: false, type: '', task: null });
    setPendingReason("");
    setPendingDate("");
    // Refresh tasks
    setStartDate(startDate);
  }

  // Handle Complete
  async function handleCompleteSave() {
    if (!actionDialog.task) return;
    const newCompleteDate = completeDate || actionDialog.task.deliveryDate || new Date().toISOString();
    await updateTaskInFirestore(actionDialog.task, {
      status: "Complete",
      completeRemarks,
      completeDate: newCompleteDate,
    });
    // Also update the deliverable in the related project document
    if (actionDialog.task.projectId && actionDialog.task.deliverableId) {
      const projectDocRef = firestoreDoc(firestore, "projects", actionDialog.task.projectId);
      const projectSnap = await getDoc(projectDocRef);
      if (projectSnap.exists()) {
        const projectData = projectSnap.data();
        const updatedDeliverables = (projectData.deliverables || []).map(d =>
          d.id === actionDialog.task.deliverableId ? { ...d, completeDate: newCompleteDate } : d
        );
        await updateDoc(projectDocRef, { deliverables: updatedDeliverables });
      }
    }
    setActionDialog({ open: false, type: '', task: null });
    setCompleteRemarks("");
    setCompleteDate("");
    setStartDate(startDate);
  }

  return (
    <div className="w-full p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Employee Tasks</h1>
        <div className="flex gap-2">
          <input type="date" value={startDate.slice(0,4)+"-"+startDate.slice(4,6)+"-"+startDate.slice(6,8)} onChange={e => setStartDate(e.target.value.replace(/-/g, ""))} />
          <input type="date" value={endDate.slice(0,4)+"-"+endDate.slice(4,6)+"-"+endDate.slice(6,8)} onChange={e => setEndDate(e.target.value.replace(/-/g, ""))} />
        </div>
      </div>
      <table className="min-w-full border text-sm mb-4">
        <thead>
          <tr>
            <th className="border px-2 py-1">Deliverable</th>
            <th className="border px-2 py-1">Employee</th>
            <th className="border px-2 py-1">Assigned Date</th>
            <th className="border px-2 py-1">Delivery Date</th>
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} className="text-center">Loading...</td></tr>
          ) : pagedTasks.length === 0 ? (
            <tr><td colSpan={6} className="text-center">No tasks found</td></tr>
          ) : pagedTasks.map((task, idx) => (
            <tr key={idx}>
              <td className="border px-2 py-1">{task.deliverableName || task.deliverableId}</td>
              <td className="border px-2 py-1">{employeeMap[task.employeeId] || task.employeeId}</td>
              <td className="border px-2 py-1">{task.assignedDate}</td>
              <td className="border px-2 py-1">{task.completeDate || task.deliveryDate}</td>
              <td className="border px-2 py-1">{task.status || "-"}</td>
              <td className="border px-2 py-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setActionDialog({ open: true, type: 'pending', task })}>
                      Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActionDialog({ open: true, type: 'complete', task })}>
                      Complete
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActionDialog({ open: true, type: 'view', task })}>
                      View
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Pagination */}
      <div className="flex justify-end gap-2">
        <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
        <span>Page {page}</span>
        <Button onClick={() => setPage(p => (page * pageSize < tasks.length ? p + 1 : p))} disabled={page * pageSize >= tasks.length}>Next</Button>
      </div>

      {/* Pending Dialog */}
      <Dialog open={actionDialog.open && actionDialog.type === 'pending'} onOpenChange={v => !v && setActionDialog({ open: false, type: '', task: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Pending</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block font-medium">Reason</label>
            <Input value={pendingReason} onChange={e => setPendingReason(e.target.value)} placeholder="Enter reason..." />
            <label className="block font-medium">Expected Completion Date</label>
            <Input type="date" value={pendingDate} onChange={e => setPendingDate(e.target.value)} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handlePendingSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={actionDialog.open && actionDialog.type === 'complete'} onOpenChange={v => !v && setActionDialog({ open: false, type: '', task: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Complete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block font-medium">Remarks</label>
            <Input value={completeRemarks} onChange={e => setCompleteRemarks(e.target.value)} placeholder="Enter remarks..." />
            <label className="block font-medium">Completion Date (optional)</label>
            <Input type="date" value={completeDate} onChange={e => setCompleteDate(e.target.value)} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCompleteSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={actionDialog.open && actionDialog.type === 'view'} onOpenChange={v => !v && setActionDialog({ open: false, type: '', task: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          {actionDialog.task && (
            <table className="min-w-full border text-sm mb-4">
              <tbody>
                {Object.entries(actionDialog.task).map(([key, value]) => {
                  let displayValue = value;
                  if (key === 'employeeId') displayValue = employeeMap[value] || value;
                  if (key === 'deliverableId') displayValue = deliverableMap[value] || value;
                  if (key === 'projectId') displayValue = projectMap[value] || value;
                  return (
                    <tr key={key}>
                      <td className="border px-2 py-1 font-semibold text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</td>
                      <td className="border px-2 py-1">{String(displayValue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeTaskPage; 