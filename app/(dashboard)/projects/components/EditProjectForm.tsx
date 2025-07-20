import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormField } from "./FormField";
import { DatePicker } from "./DatePicker";
import { Project, Client, Event, Package, Shoot, Deliverable } from "../view/types";
import { firestore } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";

interface EditProjectFormProps {
  project: Project | null;
  onSubmit: (formData: any) => Promise<void>;
  isLoading: boolean;
}

export function EditProjectForm({ project, onSubmit, isLoading }: EditProjectFormProps) {
  const [formData, setFormData] = useState({
    clientName: "",
    projectName: "",
    dates: undefined as Date | undefined,
    venues: "",
    event: "",
    package: "",
    shoot: "",
    deliverables: [] as string[],
    price: 0,
    extraExpenses: 0,
    discount: 0,
    finalAmount: 0,
    advance: 0,
    due: 0,
    note: "",
  });

  // Data for dropdowns
  const [clients, setClients] = useState<Client[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [dropdownsLoaded, setDropdownsLoaded] = useState(false);

  // Fetch dropdown data
  useEffect(() => {
    let clientsLoaded = false;
    let eventsLoaded = false;
    let packagesLoaded = false;
    let shootsLoaded = false;
    let deliverablesLoaded = false;

    const checkAllLoaded = () => {
      if (clientsLoaded && eventsLoaded && packagesLoaded && shootsLoaded && deliverablesLoaded) {
        setDropdownsLoaded(true);
      }
    };

    const unsubscribeClients = onSnapshot(collection(firestore, "clients"), (snapshot) => {
      const clientsData: Client[] = snapshot.docs.map((doc) => ({
        clientId: doc.id,
        name: doc.data().name,
      }));
      setClients(clientsData);
      clientsLoaded = true;
      checkAllLoaded();
    });

    const unsubscribeEvents = onSnapshot(collection(firestore, "events"), (snapshot) => {
      const eventsData: Event[] = snapshot.docs.map((doc) => ({
        eventId: doc.id,
        name: doc.data().name,
      }));
      setEvents(eventsData);
      eventsLoaded = true;
      checkAllLoaded();
    });

    const unsubscribePackages = onSnapshot(collection(firestore, "packages"), (snapshot) => {
      const packagesData: Package[] = snapshot.docs.map((doc) => ({
        packageId: doc.id,
        name: doc.data().name,
      }));
      setPackages(packagesData);
      packagesLoaded = true;
      checkAllLoaded();
    });

    const unsubscribeShoots = onSnapshot(collection(firestore, "shoots"), (snapshot) => {
      const shootsData: Shoot[] = snapshot.docs.map((doc) => ({
        shootId: doc.id,
        name: doc.data().name,
      }));
      setShoots(shootsData);
      shootsLoaded = true;
      checkAllLoaded();
    });

    const unsubscribeDeliverables = onSnapshot(collection(firestore, "deliverables"), (snapshot) => {
      const deliverablesData: Deliverable[] = snapshot.docs.map((doc) => ({
        deliverableId: doc.id,
        name: doc.data().name,
      }));
      setDeliverables(deliverablesData);
      deliverablesLoaded = true;
      checkAllLoaded();
    });

    return () => {
      unsubscribeClients();
      unsubscribeEvents();
      unsubscribePackages();
      unsubscribeShoots();
      unsubscribeDeliverables();
    };
  }, []);

  // Populate form when project changes and dropdowns are loaded
  useEffect(() => {
    if (project && dropdownsLoaded) {
      // Convert string date to Date object if it exists
      let projectDate: Date | undefined;
      if (project.dates) {
        try {
          projectDate = new Date(project.dates);
        } catch (error) {
          console.error("Error parsing date:", error);
          projectDate = undefined;
        }
      }

      const newFormData = {
        clientName: project.clientName || "",
        projectName: project.projectName || "",
        dates: projectDate,
        venues: project.venues || "",
        event: project.event || "",
        package: project.package || "",
        shoot: project.shoot || "",
        deliverables: project.deliverables || [],
        price: project.price || 0,
        extraExpenses: project.extraExpenses || 0,
        discount: project.discount || 0,
        finalAmount: project.finalAmount || 0,
        advance: project.advance || 0,
        due: project.due || 0,
        note: project.note || "",
      };
      
      setFormData(newFormData);
    } else if (!project) {
      // Reset form when no project is selected
      setFormData({
        clientName: "",
        projectName: "",
        dates: undefined,
        venues: "",
        event: "",
        package: "",
        shoot: "",
        deliverables: [],
        price: 0,
        extraExpenses: 0,
        discount: 0,
        finalAmount: 0,
        advance: 0,
        due: 0,
        note: "",
      });
    }
  }, [project, dropdownsLoaded, clients, events, packages, shoots]);

  // Calculate final amount and due
  useEffect(() => {
    const finalAmount = formData.price + formData.extraExpenses - formData.discount;
    const due = finalAmount - formData.advance;
    
    setFormData(prev => ({
      ...prev,
      finalAmount,
      due,
    }));
  }, [formData.price, formData.extraExpenses, formData.discount, formData.advance]);

  const handleInputChange = (field: string, value: string | number | Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDeliverableChange = (deliverableId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      deliverables: checked
        ? [...prev.deliverables, deliverableId]
        : prev.deliverables.filter(id => id !== deliverableId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dropdownsLoaded) {
      toast.error("Please wait for form data to load");
      return;
    }
    
    // Convert date to string for submission
    const submitData = {
      ...formData,
      dates: formData.dates ? formData.dates.toISOString() : "",
    };
    
    await onSubmit(submitData);
  };

  const clientOptions = clients.map(client => ({
    id: client.clientId,
    name: client.name,
  }));

  const eventOptions = events.map(event => ({
    id: event.eventId,
    name: event.name,
  }));

  const packageOptions = packages.map(pkg => ({
    id: pkg.packageId,
    name: pkg.name,
  }));

  const shootOptions = shoots.map(shoot => ({
    id: shoot.shootId,
    name: shoot.name,
  }));

  return (
    <form key={`project-form-${project?.projectId || 'new'}`} onSubmit={handleSubmit} className="space-y-6">
      {!dropdownsLoaded && (
        <div className="text-center py-4">
          <div className="text-gray-500">Loading form data...</div>
        </div>
      )}
      
      {dropdownsLoaded && (
        <>
          {/* Basic Information */}
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Client Name"
                type="select"
                value={formData.clientName}
                onChange={(value) => handleInputChange("clientName", value)}
                placeholder="Select client"
                options={clientOptions}
                required
              />

              <FormField
                label="Project Name"
                value={formData.projectName}
                onChange={(value) => handleInputChange("projectName", value)}
                placeholder="Enter project name"
                required
              />

              <DatePicker
                label="Date/Dates"
                value={formData.dates}
                onChange={(date) => handleInputChange("dates", date)}
                placeholder="Select date"
                required
              />

              <FormField
                label="Venue/Venues"
                value={formData.venues}
                onChange={(value) => handleInputChange("venues", value)}
                placeholder="Enter venue(s)"
                required
              />
            </div>
          </div>

          {/* Project Details */}
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Project Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Event"
                type="select"
                value={formData.event}
                onChange={(value) => handleInputChange("event", value)}
                placeholder="Select event"
                options={eventOptions}
                required
              />

              <FormField
                label="Package"
                type="select"
                value={formData.package}
                onChange={(value) => handleInputChange("package", value)}
                placeholder="Select package"
                options={packageOptions}
                required
              />

              <FormField
                label="Shoot"
                type="select"
                value={formData.shoot}
                onChange={(value) => handleInputChange("shoot", value)}
                placeholder="Select shoot"
                options={shootOptions}
                required
              />
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Financial Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Price"
                type="number"
                value={formData.price}
                onChange={(value) => handleInputChange("price", value)}
                placeholder="Enter price"
                min={0}
                required
              />

              <FormField
                label="Extra Expenses"
                type="number"
                value={formData.extraExpenses}
                onChange={(value) => handleInputChange("extraExpenses", value)}
                placeholder="Enter extra expenses"
                min={0}
                required
              />

              <FormField
                label="Discount"
                type="number"
                value={formData.discount}
                onChange={(value) => handleInputChange("discount", value)}
                placeholder="Enter discount"
                min={0}
                required
              />

              <FormField
                label="Final Amount"
                type="number"
                value={formData.finalAmount}
                onChange={() => {}} // Read-only
                readOnly
                className="bg-gray-50"
              />

              <FormField
                label="Advance"
                type="number"
                value={formData.advance}
                onChange={(value) => handleInputChange("advance", value)}
                placeholder="Enter advance amount"
                min={0}
                required
              />

              <FormField
                label="Due"
                type="number"
                value={formData.due}
                onChange={() => {}} // Read-only
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* Deliverables */}
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Deliverables *</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-3 border rounded-md bg-gray-50">
              {deliverables.map((deliverable) => (
                <div key={deliverable.deliverableId} className="flex items-center space-x-2">
                  <Checkbox
                    id={deliverable.deliverableId}
                    checked={formData.deliverables.includes(deliverable.deliverableId)}
                    onCheckedChange={(checked) => 
                      handleDeliverableChange(deliverable.deliverableId, checked as boolean)
                    }
                  />
                  <Label htmlFor={deliverable.deliverableId} className="text-sm">
                    {deliverable.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Additional Notes</h2>
            <div className="space-y-2">
              <Label>Note *</Label>
              <Textarea
                className="w-full"
                value={formData.note}
                onChange={(e) => handleInputChange("note", e.target.value)}
                placeholder="Enter project notes"
                rows={4}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading} className="min-w-[120px]">
              {isLoading ? "Updating..." : "Update Project"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
} 