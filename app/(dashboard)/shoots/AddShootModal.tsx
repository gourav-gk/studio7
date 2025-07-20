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
import { Shoot, shootInitialState } from "./types";
import { firestore } from "@/lib/firebase";
import { doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

interface AddShootModalProps {
  shoot?: Shoot | null;
  open: boolean;
  onOpenChange?: () => void;
}

function AddShootModal({ shoot, open, onOpenChange }: AddShootModalProps) {
  const [form, setForm] = useState(shootInitialState);

  useEffect(() => {
    if (shoot) {
      setForm({
        name: shoot.name,
        traditionalPhotographer: shoot.traditionalPhotographer,
        traditionalVideographer: shoot.traditionalVideographer,
        candid: shoot.candid,
        cinemetographer: shoot.cinemetographer,
        assistant: shoot.assistant,
        drone: shoot.drone,
        other: shoot.other,
      });
    } else {
      setForm(shootInitialState);
    }
  }, [shoot, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    const isEdit = Boolean(shoot);
    const docId = shoot?.shootId;
    try {
      if (isEdit && docId) {
        const ref = doc(firestore, "shoots", docId);
        await setDoc(ref, { ...form }, { merge: true });
      } else {
        await addDoc(collection(firestore, "shoots"), {
          ...form,
          createdAt: serverTimestamp(),
        });
      }
      toast.success(isEdit ? "Shoot updated" : "Shoot added");
      onOpenChange?.();
    } catch (error) {
      console.error("Error saving shoot:", error);
      toast.error("Failed to save shoot");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{shoot ? "Edit Shoot" : "Add Shoot"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              name="name"
              placeholder="Enter shoot name"
              value={form.name}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="traditionalPhotographer" className="text-sm font-medium">
              Traditional Photographer
            </label>
            <Input
              id="traditionalPhotographer"
              name="traditionalPhotographer"
              placeholder="Enter number"
              type="number"
              value={form.traditionalPhotographer}
              onChange={handleChange}
              min={0}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="traditionalVideographer" className="text-sm font-medium">
              Traditional Videographer
            </label>
            <Input
              id="traditionalVideographer"
              name="traditionalVideographer"
              placeholder="Enter number"
              type="number"
              value={form.traditionalVideographer}
              onChange={handleChange}
              min={0}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="candid" className="text-sm font-medium">
              Candid
            </label>
            <Input
              id="candid"
              name="candid"
              placeholder="Enter number"
              type="number"
              value={form.candid}
              onChange={handleChange}
              min={0}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="cinemetographer" className="text-sm font-medium">
              Cinemetographer
            </label>
            <Input
              id="cinemetographer"
              name="cinemetographer"
              placeholder="Enter number"
              type="number"
              value={form.cinemetographer}
              onChange={handleChange}
              min={0}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="assistant" className="text-sm font-medium">
              Assistant
            </label>
            <Input
              id="assistant"
              name="assistant"
              placeholder="Enter number"
              type="number"
              value={form.assistant}
              onChange={handleChange}
              min={0}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="drone" className="text-sm font-medium">
              Drone
            </label>
            <Input
              id="drone"
              name="drone"
              placeholder="Enter number"
              type="number"
              value={form.drone}
              onChange={handleChange}
              min={0}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="other" className="text-sm font-medium">
              Other
            </label>
            <Input
              id="other"
              name="other"
              placeholder="Enter number"
              type="number"
              value={form.other}
              onChange={handleChange}
              min={0}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={!form.name.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddShootModal;
