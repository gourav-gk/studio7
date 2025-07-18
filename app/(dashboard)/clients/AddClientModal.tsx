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
import { Client } from "./types";
import { firestore } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "sonner";

interface AddClientModalProps {
  client?: Client | null;
  open: boolean;
  onOpenChange?: () => void;
}

function generateClientId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `client-${result}`;
}

function AddClientModal({ client, open, onOpenChange }: AddClientModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phoneNo: "",
    address: "",
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        phoneNo: client.phoneNo,
        address: client.address,
      });
    } else {
      setFormData({ name: "", phoneNo: "", address: "" });
    }
  }, [client, open]);

  const handleSubmit = async () => {
    const clientId = client?.clientId || generateClientId();
    try {
      await setDoc(
        doc(firestore, "clients", clientId),
        {
          name: formData.name,
          phoneNo: formData.phoneNo,
          address: formData.address,
        },
        { merge: true }
      );
      toast.success(client ? "Client updated successfully" : "Client added successfully");
      onOpenChange?.();
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error("Failed to save client");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{client ? "Edit Client" : "Add Client"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Phone Number"
              value={formData.phoneNo}
              type="text"
              maxLength={10}
              pattern="\d*"
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                if (value.length <= 10) {
                  setFormData((prev) => ({ ...prev, phoneNo: value }));
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Textarea
              placeholder="Address"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
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

export default AddClientModal;
