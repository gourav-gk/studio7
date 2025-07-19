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
import { Event } from "./types";
import { firestore } from "@/lib/firebase";
import {
  doc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "sonner";

interface AddEventModalProps {
  event?: Event | null;
  open: boolean;
  onOpenChange?: () => void;
}

function AddEventModal({
  event,
  open,
  onOpenChange,
}: AddEventModalProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (event) {
      setName(event.name);
    } else {
      setName("");
    }
  }, [event, open]);

  const handleSubmit = async () => {
    const isEdit = Boolean(event);
    const docId = event?.eventId;

    try {
      if (isEdit && docId) {
        const ref = doc(firestore, "events", docId);
        await setDoc(ref, { name }, { merge: true });
      } else {
        await addDoc(collection(firestore, "events"), {
          name,
          createdAt: serverTimestamp(),
        });
      }

      toast.success(isEdit ? "Event updated" : "Event added");
      onOpenChange?.();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Failed to save event");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {event ? "Edit Event" : "Add Event"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            placeholder="Event Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddEventModal; 