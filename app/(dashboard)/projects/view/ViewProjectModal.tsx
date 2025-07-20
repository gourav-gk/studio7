"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Project, Deliverable } from "./types";

interface ViewProjectModalProps {
  project?: Project | null;
  open: boolean;
  onOpenChange?: () => void;
  deliverables: Deliverable[];
}

function ViewProjectModal({ project, open, onOpenChange, deliverables }: ViewProjectModalProps) {
  if (!project) return null;

  const getDeliverableNames = (deliverableIds: string[]) => {
    return deliverableIds.map(id => {
      const deliverable = deliverables.find(d => d.deliverableId === id);
      return deliverable ? deliverable.name : id;
    }).join(", ");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Client Name</Label>
                <p className="text-gray-900">{project.clientName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Project Name</Label>
                <p className="text-gray-900">{project.projectName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Dates</Label>
                <p className="text-gray-900">{project.dates}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Venues</Label>
                <p className="text-gray-900">{project.venues}</p>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Project Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Event</Label>
                <p className="text-gray-900">{project.event}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Package</Label>
                <p className="text-gray-900">{project.package}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Shoot</Label>
                <p className="text-gray-900">{project.shoot}</p>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Financial Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Price</Label>
                <p className="text-gray-900">${project.price}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Extra Expenses</Label>
                <p className="text-gray-900">${project.extraExpenses}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Discount</Label>
                <p className="text-gray-900">${project.discount}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Final Amount</Label>
                <p className="text-gray-900 font-semibold">${project.finalAmount}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Advance</Label>
                <p className="text-gray-900">${project.advance}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Due</Label>
                <p className="text-gray-900 font-semibold">${project.due}</p>
              </div>
            </div>
          </div>

          {/* Deliverables */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Deliverables</h2>
            <p className="text-gray-900">{getDeliverableNames(project.deliverables)}</p>
          </div>

          {/* Note */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Additional Notes</h2>
            <p className="text-gray-900 whitespace-pre-wrap">{project.note}</p>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ViewProjectModal; 