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
import { Project } from "./types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ViewProjectModalProps {
  project?: Project | null;
  open: boolean;
  onOpenChange?: () => void;
}

function ViewProjectModal({ project, open, onOpenChange }: ViewProjectModalProps) {
  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-none max-h-[90vh] overflow-y-auto"
        style={{ width: "60%", maxWidth: "none" }}
      >
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Event</Label>
                <p className="text-gray-900">{project.event}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Package</Label>
                <p className="text-gray-900">{project.package}</p>
              </div>
            </div>
          </div>

          {/* Shoots Table */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Shoots</h2>
            {project.shoots && project.shoots.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Ritual</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Traditional Photographer</TableHead>
                      <TableHead>Traditional Videographer</TableHead>
                      <TableHead>Candid</TableHead>
                      <TableHead>Cinematographer</TableHead>
                      <TableHead>Assistant</TableHead>
                      <TableHead>Drone</TableHead>
                      <TableHead>Others</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.shoots.map((shoot) => (
                      <TableRow key={shoot.id}>
                        <TableCell>{shoot.day}</TableCell>
                        <TableCell>{shoot.ritual}</TableCell>
                        <TableCell>{shoot.date}</TableCell>
                        <TableCell>{shoot.traditionalPhotographer}</TableCell>
                        <TableCell>{shoot.traditionalVideographer}</TableCell>
                        <TableCell>{shoot.candid}</TableCell>
                        <TableCell>{shoot.cinemetographer}</TableCell>
                        <TableCell>{shoot.assistant}</TableCell>
                        <TableCell>{shoot.drone}</TableCell>
                        <TableCell>{shoot.other}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-gray-900">{project.shoot || "No shoot data"}</p>
            )}
          </div>

          {/* Deliverables Table */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Deliverables</h2>
            {project.deliverables &&
            project.deliverables.length > 0 &&
            typeof project.deliverables[0] === "object" ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deliverable Name</TableHead>
                      <TableHead>Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(project.deliverables as Array<{ id: string; name: string; qty: string }>).map(
                      (deliverable) => (
                        <TableRow key={deliverable.id}>
                          <TableCell>{deliverable.name}</TableCell>
                          <TableCell>{deliverable.qty}</TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-gray-900">
                {Array.isArray(project.deliverables)
                  ? project.deliverables.join(", ")
                  : "No deliverables data"}
              </p>
            )}
          </div>

          {/* Financial Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Financial Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Price</Label>
                <p className="text-gray-900">₹{project.price}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Extra Expenses</Label>
                <p className="text-gray-900">₹{project.extraExpenses}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Discount</Label>
                <p className="text-gray-900">₹{project.discount}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Final Amount</Label>
                <p className="text-gray-900 font-semibold">₹{project.finalAmount}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Advance</Label>
                <p className="text-gray-900">₹{project.advance}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Due</Label>
                <p className="text-gray-900 font-semibold">₹{project.due}</p>
              </div>
            </div>
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
