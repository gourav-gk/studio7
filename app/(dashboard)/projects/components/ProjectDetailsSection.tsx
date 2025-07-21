import React from "react";
import { FormField } from "./FormField";
import { Event, Package} from "../types";

interface ProjectDetailsSectionProps {
  formData: {
    event: string;
    package: string;
    // shoot: string; // Remove shoot
  };
  events: Event[];
  packages: Package[];
  // shoots: Shoot[]; // Remove shoots
  onInputChange: (field: string, value: string | number) => void;
}

export function ProjectDetailsSection({
  formData,
  events,
  packages,
  onInputChange,
}: ProjectDetailsSectionProps) {
  const eventOptions = [
    ...events.map(event => ({
      id: event.eventId,
      name: event.name,
    })),
    { id: "other", name: "Other" }
  ];

  const packageOptions = packages.map(pkg => ({
    id: pkg.packageId,
    name: pkg.name,
  }));

  return (
    <div className="bg-white rounded-lg border p-4">
      <h2 className="text-lg font-semibold mb-3 text-gray-800">Project Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          label="Event"
          type="select"
          value={formData.event}
          onChange={(value) => onInputChange("event", value)}
          placeholder="Select event"
          options={eventOptions}
          required
        />

        <FormField
          label="Package"
          type="select"
          value={formData.package}
          onChange={(value) => onInputChange("package", value)}
          placeholder="Select package"
          options={packageOptions}
        />
      </div>
    </div>
  );
} 