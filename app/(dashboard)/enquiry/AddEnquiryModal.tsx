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
import { Enquiry } from "./types";

interface AddEnquiryModalProps {
  enquiry?: Enquiry | null;
  open: boolean;
  onOpenChange?: () => void;
}

function AddEnquiryModal({ enquiry, open, onOpenChange }: AddEnquiryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phoneNo: "",
    address: "",
  });
  useEffect(() => {
    if (enquiry) {
      setFormData({
        name: enquiry.name,
        phoneNo: enquiry.phoneNo,
        address: enquiry.address,
      });
    } else {
      setFormData({ name: "", phoneNo: "", address: "" });
    }
  }, [enquiry, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Enquiry</DialogTitle>
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
          <Button>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default React.memo(AddEnquiryModal);
