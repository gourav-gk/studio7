"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { WeddingPackage } from "./types";

interface Props {
  initialData?: WeddingPackage | null;
  open: boolean;
  onClose: () => void;
  onSave: (pkg: WeddingPackage) => Promise<void>;
}

function AddWeddingPackageModal({ initialData, open, onClose, onSave }: Props) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    features: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        price: initialData.price.toString(),
        features: Array.isArray(initialData.features) 
          ? initialData.features.join("\n") 
          : typeof initialData.features === 'string' 
            ? initialData.features 
            : "",
      });
    } else {
      setFormData({ name: "", price: "", features: "" });
    }
  }, [initialData, open]);

  const handleSubmit = async () => {
    const features = formData.features
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    await onSave({
      ...initialData,
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      features,
    } as WeddingPackage);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Wedding Package" : "Add Wedding Package"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              placeholder="Package Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="Price"
              value={formData.price}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, price: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Textarea
              placeholder="Features (one per line)"
              value={formData.features}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, features: e.target.value }))
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

export default AddWeddingPackageModal;
