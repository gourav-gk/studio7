"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Employee } from "./types";
import { firestore } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

interface AddEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

const AddEmployeeModal = ({ open, onOpenChange, employee }: AddEmployeeModalProps) => {
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: "",
    email: "",
    phone: "",
    gender: "",
    address: "",
    salary: "",
    profileStatus: "Active",
    empId: "",
  });

  useEffect(() => {
    if (employee) {
      setFormData(employee);
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        gender: "",
        address: "",
        salary: "",
        profileStatus: "Active",
        empId: "",
      });
    }
  }, [employee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.uId && !employee?.uId) return alert("User ID is required");

    const docRef = doc(firestore, "users", employee?.uId || formData.uId!);
    await setDoc(docRef, {
      ...employee,
      ...formData,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{employee ? "Edit Employee" : "Add Employee"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input name="name" placeholder="Name" value={formData.name} onChange={handleChange} />
          <Input name="email" placeholder="Email" value={formData.email} onChange={handleChange} />
          <Input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} />
          <Input name="gender" placeholder="Gender" value={formData.gender} onChange={handleChange} />
          <Input name="address" placeholder="Address" value={formData.address} onChange={handleChange} />
          <Input name="salary" placeholder="Salary" value={formData.salary} onChange={handleChange} />
          <Input name="empId" placeholder="Employee ID" value={formData.empId} onChange={handleChange} />
          <Button onClick={handleSubmit}>{employee ? "Update" : "Save"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeModal;
