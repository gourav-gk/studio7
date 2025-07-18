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
import React, { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Employee } from "./types";
import { firestore } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "sonner";

interface Props {
  employee?: Employee | null;
  open: boolean;
  onOpenChange?: () => void;
}

function AddEmployeeModal({ employee, open, onOpenChange }: Props) {
  const [formData, setFormData] = useState({
    uId: "",
    empId: "",
    name: "",
    email: "",
    phone: "",
    gender: "",
    address: "",
    salary: "",
    paidSalary: 0,
    profileStatus: "Inactive",
    userType: "employee",
    createdAt: "",
    assignedCompany: {},
    salaryHistory: {},
    accessLevelMap: {},
    salaryStatus: "Unpaid",
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        uId: employee.uId,
        empId: employee.empId,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        gender: employee.gender,
        address: employee.address,
        salary: employee.salary,
        paidSalary: employee.paidSalary,
        profileStatus: employee.profileStatus,
        userType: employee.userType,
        createdAt: employee.createdAt,
        assignedCompany: employee.assignedCompany,
        salaryHistory: employee.salaryHistory,
        accessLevelMap: employee.accessLevelMap,
        salaryStatus: employee.salaryStatus,
      });
    } else {
      setFormData({
        uId: "",
        empId: "",
        name: "",
        email: "",
        phone: "",
        gender: "",
        address: "",
        salary: "",
        paidSalary: 0,
        profileStatus: "Inactive",
        userType: "employee",
        createdAt: new Date().toISOString(),
        assignedCompany: {},
        salaryHistory: {},
        accessLevelMap: {},
        salaryStatus: "Unpaid",
      });
    }
  }, [employee, open]);

  const handleSubmit = async () => {
    if (!formData.uId && !employee?.uId) {
      toast.error("User ID is required");
      return;
    }

    try {
      await setDoc(
        doc(firestore, "users", formData.uId || employee!.uId),
        formData,
        { merge: true }
      );
      toast.success(employee ? "Employee updated successfully" : "Employee added successfully");
      onOpenChange?.();
    } catch (error) {
      console.error("Error saving employee:", error);
      toast.error("Failed to save employee");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {employee ? "Edit Employee" : "Add Employee"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              placeholder="User ID"
              value={formData.uId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, uId: e.target.value }))
              }
              disabled={!!employee}
            />
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Employee ID"
              value={formData.empId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, empId: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Gender"
              value={formData.gender}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, gender: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Textarea
              placeholder="Address"
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Salary"
              type="number"
              value={formData.salary}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, salary: e.target.value }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddEmployeeModal;
