import { useState, useEffect, useCallback, useMemo } from "react";
import { collection, deleteDoc, doc, onSnapshot, Timestamp } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { toast } from "sonner";
import { Project, Deliverable } from "../view/types";

export function useProjectsView() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<Project[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Fetch deliverables for mapping
  useEffect(() => {
    const unsubscribeDeliverables = onSnapshot(collection(firestore, "deliverables"), (snapshot) => {
      const deliverablesData: Deliverable[] = snapshot.docs.map((doc) => ({
        deliverableId: doc.id,
        name: doc.data().name,
      }));
      setDeliverables(deliverablesData);
    });
    return () => unsubscribeDeliverables();
  }, []);

  // Fetch projects
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "projects"), (snapshot) => {
      const result: Project[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        let createdAt: Date;
        if (data.createdAt instanceof Timestamp) {
          createdAt = data.createdAt.toDate();
        } else if (
          typeof data.createdAt === "object" &&
          data.createdAt !== null &&
          "seconds" in data.createdAt
        ) {
          createdAt = new Date(data.createdAt.seconds * 1000);
        } else if (typeof data.createdAt === "string") {
          createdAt = new Date(data.createdAt);
        } else {
          createdAt = new Date();
        }

        return {
          projectId: doc.id,
          clientName: data.clientName,
          projectName: data.projectName,
          dates: data.dates,
          venues: data.venues,
          event: data.event,
          package: data.package,
          shoot: data.shoot,
          deliverables: data.deliverables || [],
          price: data.price || 0,
          extraExpenses: data.extraExpenses || 0,
          discount: data.discount || 0,
          finalAmount: data.finalAmount || 0,
          advance: data.advance || 0,
          due: data.due || 0,
          note: data.note,
          createdAt,
        };
      });
      setData(result);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEdit = useCallback((project: Project) => {
    setSelectedProject(project);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedProject(null);
    setOpen(false);
  }, []);

  const handleView = useCallback((project: Project) => {
    setSelectedProject(project);
    setViewOpen(true);
  }, []);

  const handleViewClose = useCallback(() => {
    setSelectedProject(null);
    setViewOpen(false);
  }, []);

  const handleBulkDelete = useCallback(async (projects: Project[]) => {
    if (!confirm(`Are you sure you want to delete ${projects.length} selected project(s)?`)) {
      return;
    }
    
    try {
      const deletePromises = projects.map((project) =>
        deleteDoc(doc(firestore, "projects", project.projectId))
      );
      await Promise.all(deletePromises);
      toast.success("Selected projects deleted successfully.");
    } catch (error) {
      console.error("Bulk delete failed:", error);
      toast.error("Failed to delete selected projects.");
    }
  }, []);

  return {
    isLoading,
    data,
    deliverables,
    open,
    viewOpen,
    selectedProject,
    handleEdit,
    handleClose,
    handleView,
    handleViewClose,
    handleBulkDelete,
  };
} 