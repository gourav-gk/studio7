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
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Package, DeliverableWithQuantity } from "./types";
import { collection, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { Shoot, shootInitialState } from "../shoots/types";
import { Deliverable } from "../deliverables/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Event } from "../events/types";

interface Props {
  initialData?: Package | null;
  open: boolean;
  onClose: () => void;
  onSave: (pkg: Package) => Promise<void>;
}

function AddPackageModal({ initialData, open, onClose, onSave }: Props) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    eventId: "",
    shoots: [] as string[],
    deliverables: [] as DeliverableWithQuantity[],
  });

  const [events, setEvents] = useState<Event[]>([]);
  const [shootOptions, setShootOptions] = useState<
    Array<{ value: string; label: string; data?: Shoot }>
  >([]);
  const [deliverableOptions, setDeliverableOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "events"), (snapshot) => {
      const eventsData = snapshot.docs.map((doc) => ({
        eventId: doc.id,
        ...doc.data(),
      })) as Event[];
      setEvents(eventsData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "shoots"), (snapshot) => {
      const shoots = snapshot.docs.map((doc) => {
        const data = doc.data() as Shoot;
        return {
          value: doc.id,
          label: data.name,
          data: { ...data, shootId: doc.id },
        };
      });
      setShootOptions(shoots);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "deliverables"), (snapshot) => {
      const deliverables = snapshot.docs.map((doc) => {
        const data = doc.data() as Deliverable;
        return {
          value: doc.id,
          label: data.name,
        };
      });
      setDeliverableOptions(deliverables);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        price: initialData.price.toString(),
        eventId: initialData.eventId || "",
        shoots: initialData.shoots || [],
        deliverables: initialData.deliverables || [],
      });
    } else {
      setFormData({ name: "", price: "", eventId: "", shoots: [], deliverables: [] });
    }
  }, [initialData, open]);

  const handleSubmit = async () => {
    if (!formData.eventId) {
      alert("Please select an event");
      return;
    }
    await onSave({
      ...initialData,
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      eventId: formData.eventId,
      shoots: formData.shoots,
      deliverables: formData.deliverables,
      createdAt: initialData?.createdAt || new Date(),
    } as Package);
  };

  const handleDeliverableChange = (selectedIds: string[]) => {
    const existingDeliverables = formData.deliverables.filter((d) =>
      selectedIds.includes(d.deliverableId)
    );

    const newDeliverables = selectedIds
      .filter((id) => !formData.deliverables.find((d) => d.deliverableId === id))
      .map((id) => ({ deliverableId: id, quantity: "1" }));

    setFormData((prev) => ({
      ...prev,
      deliverables: [...existingDeliverables, ...newDeliverables],
    }));
  };

  const handleQuantityChange = (deliverableId: string, quantity: string) => {
    setFormData((prev) => ({
      ...prev,
      deliverables: prev.deliverables.map((d) =>
        d.deliverableId === deliverableId ? { ...d, quantity } : d
      ),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px] md:max-w-[1000px] lg:max-w-[1200px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Package" : "Add Package"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Event</label>
              <Select
                value={formData.eventId}
                onValueChange={(value: string) =>
                  setFormData((prev) => ({ ...prev, eventId: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.eventId} value={event.eventId}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Package Name</label>
              <Input
                placeholder="Package Name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Price</label>
            <Input
              type="number"
              placeholder="Price"
              value={formData.price}
              onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Shoots</label>
            <MultiSelect
              options={shootOptions}
              selected={formData.shoots}
              onChange={(shoots) => setFormData((prev) => ({ ...prev, shoots }))}
              placeholder="Select shoots included in package..."
              searchPlaceholder="Search available shoots..."
            />
            {formData.shoots.length > 0 && (
              <div className="mt-2 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Shoot Name</TableHead>
                      {Object.keys(shootInitialState)
                        .filter((key) => key !== "name")
                        .map((key) => (
                          <TableHead key={key} className="w-[100px] text-center">
                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
                          </TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.shoots.map((shootId) => {
                      const shoot = shootOptions.find((opt) => opt.value === shootId)?.data;
                      if (!shoot) return null;
                      return (
                        <TableRow key={shootId}>
                          <TableCell className="font-medium">{shoot.name}</TableCell>
                          {Object.keys(shootInitialState)
                            .filter((key) => key !== "name")
                            .map((key) => (
                              <TableCell key={key} className="text-center">
                                {shoot[key as keyof Shoot] ?? "0"}
                              </TableCell>
                            ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Deliverables</label>
            <MultiSelect
              options={deliverableOptions}
              selected={formData.deliverables.map((d) => d.deliverableId)}
              onChange={handleDeliverableChange}
              placeholder="Select deliverables included in package..."
              searchPlaceholder="Search available deliverables..."
            />
            {formData.deliverables.length > 0 && (
              <div className="mt-2 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Deliverable</TableHead>
                      <TableHead className="w-[100px] text-right">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.deliverables.map((deliverable) => {
                      const option = deliverableOptions.find(
                        (opt) => opt.value === deliverable.deliverableId
                      );
                      return (
                        <TableRow key={deliverable.deliverableId}>
                          <TableCell>{option?.label}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="text"
                              value={deliverable.quantity}
                              onChange={(e) =>
                                handleQuantityChange(deliverable.deliverableId, e.target.value)
                              }
                              className="w-20 ml-auto"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
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

export default AddPackageModal;
