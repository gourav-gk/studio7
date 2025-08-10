import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp, onSnapshot, getDoc, doc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { toast } from "sonner";
import { Client, Event, Package, Shoot, Deliverable } from "../app/(dashboard)/projects/types";

interface ProjectFormData {
  clientName: string;
  projectName: string;
  dates: Date | undefined;
  venues: string;
  event: string;
  package: string;
  shoot: string;
  deliverables: string[];
  price: number;
  extraExpenses: number;
  discount: number;
  finalAmount: number;
  advance: number;
  due: number;
  note: string;
}

// Add ShootRow type for the table
interface ShootRow {
  id: string;
  day: string;
  ritual: string;
  date: string;
  traditionalPhotographer: string;
  traditionalVideographer: string;
  candid: string;
  cinemetographer: string;
  assistant: string;
  drone: string;
  other: string;
}

interface DeliverableRow {
  id: string;
  name: string;
  qty: string;
  isNew?: boolean;
}

interface PackageData extends Package {
  packageId: string;
  deliverables?: Array<{ deliverableId: string; quantity: string }>;
}

export function useProjectForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
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

  // Data for dropdowns
  const [clients, setClients] = useState<Client[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [shootTableData, setShootTableData] = useState<ShootRow[]>([]);
  const [deliverablesTableData, setDeliverablesTableData] = useState<DeliverableRow[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch dropdown data
  useEffect(() => {
    const unsubscribeClients = onSnapshot(collection(firestore, "clients"), (snapshot) => {
      const clientsData: Client[] = snapshot.docs.map((doc) => ({
        clientId: doc.id,
        name: doc.data().name,
      }));
      setClients(clientsData);
    });

    const unsubscribeEvents = onSnapshot(collection(firestore, "events"), (snapshot) => {
      const eventsData: Event[] = snapshot.docs.map((doc) => ({
        eventId: doc.id,
        name: doc.data().name,
      }));
      setEvents(eventsData);
    });

    const unsubscribeShoots = onSnapshot(collection(firestore, "shoots"), (snapshot) => {
      const shootsData: Shoot[] = snapshot.docs.map((doc) => ({
        shootId: doc.id,
        name: doc.data().name,
      }));
      setShoots(shootsData);
    });

    const unsubscribeDeliverables = onSnapshot(
      collection(firestore, "deliverables"),
      (snapshot) => {
        const deliverablesData: Deliverable[] = snapshot.docs.map((doc) => ({
          deliverableId: doc.id,
          name: doc.data().name,
        }));
        setDeliverables(deliverablesData);
      }
    );

    return () => {
      unsubscribeClients();
      unsubscribeEvents();
      unsubscribeShoots();
      unsubscribeDeliverables();
    };
  }, []);

  // Fetch packages when event changes
  useEffect(() => {
    if (!formData.event) {
      setPackages([]);
      setFormData((prev) => ({ ...prev, package: "" }));
      setShootTableData([]); // Clear shoot table when event changes
      return;
    }
    // Query packages where eventId == formData.event
    const q = collection(firestore, "packages");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const filteredPackages = snapshot.docs
        .map((doc) => ({
          packageId: doc.id,
          name: doc.data().name,
          eventId: doc.data().eventId,
          shoots: doc.data().shoots || [],
          deliverables: doc.data().deliverables || [],
        }))
        .filter((pkg) => pkg.eventId === formData.event);
      setPackages(filteredPackages);
      // If the current selected package is not in the filtered list, clear it
      if (!filteredPackages.some((pkg) => pkg.packageId === formData.package)) {
        setFormData((prev) => ({ ...prev, package: "" }));
        setShootTableData([]); // Clear shoot table when package is cleared
      }
    });
    return () => unsubscribe();
  }, [formData.event]);

  // Update shoot table when package changes
  useEffect(() => {
    if (isEditMode) return;
    async function fetchShootsForPackage() {
      if (!formData.package) {
        setShootTableData([]);
        setFormData((prev) => ({
          ...prev,
          price: 0,
        }));
        return;
      }

      const packageDoc = await getDoc(doc(firestore, "packages", formData.package));
      if (!packageDoc.exists()) {
        console.log("No package document found for packageId:", formData.package);
        return;
      }

      const packageData = packageDoc.data();
      const shootIds = packageData.shoots || [];

      // Set the price from package
      setFormData((prev) => ({
        ...prev,
        price: packageData.price || 0,
      }));

      // Fetch all shoot documents for the selected package
      const shootPromises = shootIds.map(async (shootId: string) => {
        const shootDoc = await getDoc(doc(firestore, "shoots", shootId));
        if (!shootDoc.exists()) return null;
        const data = shootDoc.data();
        return {
          id: shootDoc.id,
          day: data.name || "",
          ritual: "",
          date: "",
          traditionalPhotographer: data.traditionalPhotographer || "0",
          traditionalVideographer: data.traditionalVideographer || "0",
          candid: data.candid || "0",
          cinemetographer: data.cinemetographer || "0",
          assistant: data.assistant || "0",
          drone: data.drone || "0",
          other: data.other || "0",
        };
      });

      const shootRows = (await Promise.all(shootPromises)).filter(
        (row): row is ShootRow => row !== null
      );
      setShootTableData(shootRows);
    }

    fetchShootsForPackage();
  }, [formData.package, isEditMode]);

  // Fetch deliverables for selected package
  useEffect(() => {
    if (isEditMode) return;
    async function fetchDeliverablesForPackage() {
      if (!formData.package) {
        setDeliverablesTableData([]);
        return;
      }
      const pkg = packages.find((p) => p.packageId === formData.package);
      if (!pkg || !pkg.deliverables || !Array.isArray(pkg.deliverables)) {
        setDeliverablesTableData([]);
        return;
      }
      // For each deliverable, fetch its name from deliverables collection
      const deliverablePromises = pkg.deliverables.map(async (d) => {
        const deliverableDoc = await getDoc(doc(firestore, "deliverables", d.deliverableId));
        const data = deliverableDoc.exists() ? deliverableDoc.data() : {};
        return {
          id: d.deliverableId,
          name: data.name || "",
          qty: d.quantity || "",
          isNew: false, // Package-loaded deliverables are not new
        };
      });
      const deliverablesRows = await Promise.all(deliverablePromises);
      setDeliverablesTableData(deliverablesRows);
    }
    fetchDeliverablesForPackage();
  }, [formData.package, packages, isEditMode]);

  // Calculate final amount and due
  useEffect(() => {
    const finalAmount = formData.price + formData.extraExpenses - formData.discount;
    const due = finalAmount - formData.advance;

    setFormData((prev) => ({
      ...prev,
      finalAmount,
      due,
    }));
  }, [formData.price, formData.extraExpenses, formData.discount, formData.advance]);

  const handleInputChange = (field: string, value: string | number | Date | undefined) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDeliverableChange = (deliverableId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      deliverables: checked
        ? [...prev.deliverables, deliverableId]
        : prev.deliverables.filter((id) => id !== deliverableId),
    }));
  };

  // Handler to update a cell in the shoot table
  const handleShootTableChange = (index: number, field: keyof ShootRow, value: string) => {
    setShootTableData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Handler to add a new row
  const handleAddShootRow = () => {
    const newRow: ShootRow = {
      id: crypto.randomUUID(),
      day: "",
      ritual: "",
      date: "",
      traditionalPhotographer: "0",
      traditionalVideographer: "0",
      candid: "0",
      cinemetographer: "0",
      assistant: "0",
      drone: "0",
      other: "0",
    };
    setShootTableData((prev) => [...prev, newRow]);
  };

  // Handler to remove a row
  const handleRemoveShootRow = (index: number) => {
    setShootTableData((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Handler to update qty in the deliverables table
  const handleDeliverablesTableChange = (index: number, field: "name" | "qty", value: string) => {
    setDeliverablesTableData((prev) => {
      const updated = [...prev];
      if (field === "name") {
        // Find the deliverable name from the deliverables array
        const deliverable = deliverables.find((d) => d.deliverableId === value);
        updated[index] = {
          ...updated[index],
          id: value,
          name: deliverable?.name || "",
          isNew: false, // Once a deliverable is selected, it's no longer new
        };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };
  // Function to generate a unique ID for new rows
  function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Handler to add a new row
  const handleAddDeliverableRow = () => {
    setDeliverablesTableData((prev) => [
      ...prev,
      { id: generateUUID(), name: "", qty: "", isNew: true },
    ]);
  };

  // Handler to remove a deliverable row
  const handleRemoveDeliverableRow = (index: number) => {
    setDeliverablesTableData((prev) => prev.filter((_, idx) => idx !== index));
  };

  const resetForm = () => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (
        !formData.clientName ||
        !formData.projectName ||
        !formData.dates ||
        !formData.venues ||
        !formData.event
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Prepare project data
      const projectData = {
        clientName: formData.clientName,
        projectName: formData.projectName,
        dates: formData.dates ? formData.dates.toISOString() : "",
        venues: formData.venues,
        event: formData.event,
        package: formData.package || null,
        price: formData.price,
        extraExpenses: formData.extraExpenses,
        discount: formData.discount,
        finalAmount: formData.finalAmount,
        advance: formData.advance,
        due: formData.due,
        note: formData.note,
        createdAt: serverTimestamp(),
        // Add shoot and deliverable data
        shoots: shootTableData.map((shoot) => ({
          id: shoot.id,
          day: shoot.day,
          ritual: shoot.ritual,
          date: shoot.date,
          traditionalPhotographer: shoot.traditionalPhotographer,
          traditionalVideographer: shoot.traditionalVideographer,
          candid: shoot.candid,
          cinemetographer: shoot.cinemetographer,
          assistant: shoot.assistant,
          drone: shoot.drone,
          other: shoot.other,
        })),
        deliverables: deliverablesTableData.map((deliverable) => ({
          id: deliverable.id,
          name: deliverable.name,
          qty: deliverable.qty,
        })),
      };

      await addDoc(collection(firestore, "projects"), projectData);

      toast.success("Project created successfully!");
      resetForm();
      router.push("/projects");
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    clients,
    events,
    packages,
    shoots,
    deliverables,
    shootTableData,
    deliverablesTableData,
    handleShootTableChange,
    handleAddShootRow,
    handleRemoveShootRow,
    handleInputChange,
    handleDeliverableChange,
    handleDeliverablesTableChange,
    handleAddDeliverableRow,
    handleRemoveDeliverableRow,
    handleSubmit,
    resetForm,
    setFormData,
    setShootTableData,
    setDeliverablesTableData,
    setIsEditMode,
  };
}
