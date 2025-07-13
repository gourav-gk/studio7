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
import { doc, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

function generateClientId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `client-${suffix}`;
}

interface AddClientModalProps {
  client?: Client | null;
  open: boolean;
  onOpenChange?: () => void;
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
      await setDoc(doc(firestore, "clients", clientId), {
        name: formData.name,
        phoneNo: formData.phoneNo,
        address: formData.address,
      }, { merge: true });
      alert(client ? "Client updated!" : "Client added!");
      onOpenChange?.();
    } catch (error) {
      console.error("Error saving client:", error);
      alert("Failed to save client");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{client ? "Edit Client" : "Add Client"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Phone Number</label>
            <Input
              value={formData.phoneNo}
              onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Address</label>
            <Textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter address"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>
            {client ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default React.memo(AddClientModal);
