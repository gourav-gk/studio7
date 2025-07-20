"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useProjectForm } from "../hooks/useProjectForm";
import { BasicInformationSection } from "../components/BasicInformationSection";
import { ProjectDetailsSection } from "../components/ProjectDetailsSection";
import { FinancialSection } from "../components/FinancialSection";
import { DeliverablesSection } from "../components/DeliverablesSection";
import { NotesSection } from "../components/NotesSection";

export default function AddProject() {
  const {
    formData,
    isLoading,
    clients,
    events,
    packages,
    shoots,
    deliverables,
    handleInputChange,
    handleDeliverableChange,
    handleSubmit,
  } = useProjectForm();

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-5xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
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
              shoot: formData.shoot,
            }}
            events={events}
            packages={packages}
            shoots={shoots}
            onInputChange={handleInputChange}
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

          <DeliverablesSection
            deliverables={deliverables}
            selectedDeliverables={formData.deliverables}
            onDeliverableChange={handleDeliverableChange}
          />

          <NotesSection
            note={formData.note}
            onInputChange={handleInputChange}
          />

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[120px]">
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 