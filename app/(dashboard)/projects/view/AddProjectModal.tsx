"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setDoc, doc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { toast } from "sonner";
import { Project } from "./types";
import { EditProjectForm } from "../components/EditProjectForm";

interface AddProjectModalProps {
  project: Project | null;
  open: boolean;
  onOpenChange: () => void;
}

export default function AddProjectModal({
  project,
  open,
  onOpenChange,
}: AddProjectModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: any) => {
    if (!project) return;
    
    setIsLoading(true);
    try {
      const ref = doc(firestore, "projects", project.projectId);
      
      // Only update the fields that are provided in formData
      // This preserves existing data and only updates changed fields
      await setDoc(ref, formData, { merge: true });
      
      toast.success("Project updated successfully");
      onOpenChange();
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <EditProjectForm
          key={project?.projectId || 'new'}
          project={project}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
} 