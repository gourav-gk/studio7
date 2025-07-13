"use client";

import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { EngagementPackage } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (pkg: EngagementPackage) => void;
  initialData?: EngagementPackage | null;
}

export default function AddEngagementPackageModal({
  open,
  onClose,
  onSave,
  initialData,
}: Props) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    features: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        price: String(initialData.price),
        features: initialData.features,
      });
    } else {
      setForm({ name: "", price: "", features: "" });
    }
  }, [initialData, open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit" : "Add"} Engagement Package</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Package Name"
          />
          <Input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="Price"
          />
          <Textarea
            value={form.features}
            onChange={(e) => setForm({ ...form, features: e.target.value })}
            placeholder="Features"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={() =>
              onSave({
                id: initialData?.id ?? "",
                name: form.name,
                price: Number(form.price),
                features: form.features,
              })
            }
          >
            {initialData ? "Update" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
