"use client";

import React, { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { useProjectForm } from "../../../../hooks/useProjectForm";
import { BasicInformationSection } from "../components/BasicInformationSection";
import { ProjectDetailsSection } from "../components/ProjectDetailsSection";
import { FinancialSection } from "../components/FinancialSection";
import { NotesSection } from "../components/NotesSection";
import { ShootTableSection } from "../components/ShootTableSection";
import { DeliverablesTableSection } from "../components/DeliverablesTableSection";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { toast } from "sonner";
import { Project } from "../types";

function AddProject() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [isEdit, setIsEdit] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const {
    formData,
    isLoading,
    clients,
    events,
    packages,
    handleInputChange,
    handleSubmit,
    shootTableData,
    handleShootTableChange,
    handleAddShootRow,
    handleRemoveShootRow,
    deliverablesTableData,
    handleDeliverablesTableChange,
    handleAddDeliverableRow,
    handleRemoveDeliverableRow,
    deliverables,
    setFormData,
    setShootTableData,
    setDeliverablesTableData,
    setIsEditMode,
  } = useProjectForm();

  useEffect(() => {
    if (editId) {
      setIsEdit(true);
      setIsEditMode(true);
      setLoadingEdit(true);
      // Fetch project data and prefill
      getDoc(doc(firestore, "projects", editId)).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Project;
          setFormData({
            clientName: data.clientName || "",
            projectName: data.projectName || "",
            dates: data.dates ? new Date(data.dates) : undefined,
            venues: data.venues || "",
            event: data.event || "",
            package: data.package || "",
            shoot: data.shoot || "",
            deliverables:
              Array.isArray(data.deliverables) && typeof data.deliverables[0] === "string"
                ? (data.deliverables as string[])
                : [],
            price: data.price || 0,
            extraExpenses: data.extraExpenses || 0,
            discount: data.discount || 0,
            finalAmount: data.finalAmount || 0,
            advance: data.advance || 0,
            due: data.due || 0,
            note: data.note || "",
          });
          setShootTableData(
            (data.shoots || []).map(shoot => ({
              id: shoot.id || "",
              day: shoot.day || "",
              ritual: shoot.ritual || "",
              date: shoot.date || "",
              traditionalPhotographer: shoot.traditionalPhotographer || "",
              traditionalVideographer: shoot.traditionalVideographer || "",
              candid: shoot.candid || "",
              cinemetographer: shoot.cinemetographer || "",
              assistant: shoot.assistant || "",
              drone: shoot.drone || "",
              other: shoot.other || "",
            }))
          );
          setDeliverablesTableData(
            Array.isArray(data.deliverables) && typeof data.deliverables[0] === "object"
              ? (data.deliverables as { id: string; name: string; qty: string }[])
              : []
          );
        }
        setLoadingEdit(false);
      });
    } else {
      setIsEditMode(false);
    }
  }, [editId, setFormData, setShootTableData, setDeliverablesTableData, setIsEditMode]);

  // Custom submit handler for edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    try {
      setLoadingEdit(true);
      await updateDoc(doc(firestore, "projects", editId), {
        ...formData,
        dates: formData.dates ? formData.dates.toISOString() : "",
        shoots: shootTableData,
        deliverables: deliverablesTableData,
      });
      toast.success("Project updated successfully!");
      window.history.back();
    } catch (error) {
      if (error) toast.error("Failed to update project");
    } finally {
      setLoadingEdit(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-2">
      <div className="max-w-7xl mx-auto">
        <form onSubmit={isEdit ? handleEditSubmit : handleSubmit} className="space-y-6">
          <BasicInformationSection
            formData={{
              clientName: formData.clientName,
              projectName: formData.projectName,
              dates: formData.dates,
              venues: formData.venues,
            }}
            clients={clients}
            onInputChange={handleInputChange}
          />

          <ProjectDetailsSection
            formData={{
              event: formData.event,
              package: formData.package,
            }}
            events={events}
            packages={packages}
            onInputChange={handleInputChange}
          />

          {/* Shoots Table Section */}
          <ShootTableSection
            shootsData={shootTableData}
            onChange={handleShootTableChange}
            onAddRow={handleAddShootRow}
            onRemoveRow={handleRemoveShootRow}
          />

          {/* Deliverables Table Section */}
          <DeliverablesTableSection
            deliverablesData={deliverablesTableData}
            deliverableOptions={deliverables.map((d) => ({
              deliverableId: d.deliverableId,
              name: d.name,
            }))}
            onChange={handleDeliverablesTableChange}
            onAddRow={handleAddDeliverableRow}
            onRemoveRow={handleRemoveDeliverableRow}
          />

          <FinancialSection
            formData={{
              price: formData.price,
              extraExpenses: formData.extraExpenses,
              discount: formData.discount,
              finalAmount: formData.finalAmount,
              advance: formData.advance,
              due: formData.due,
            }}
            onInputChange={handleInputChange}
          />

          <NotesSection note={formData.note} onInputChange={handleInputChange} />

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || loadingEdit} className="min-w-[120px]">
              {loadingEdit
                ? "Saving..."
                : isEdit
                ? "Update Project"
                : isLoading
                ? "Creating..."
                : "Create Project"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AddProjectWithSuspense() {
  return (
    <Suspense>
      <AddProject />
    </Suspense>
  );
}
