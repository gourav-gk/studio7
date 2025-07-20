import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp, onSnapshot, getDoc, doc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { toast } from "sonner";
import { Client, Event, Package, Shoot, Deliverable } from "../view/types";

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
  const [packages, setPackages] = useState<Package[]>([]);
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [shootTableData, setShootTableData] = useState<ShootRow[]>([]);
  const [deliverablesTableData, setDeliverablesTableData] = useState<DeliverableRow[]>([]);

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

    // Remove the old packages fetch here

    const unsubscribeShoots = onSnapshot(collection(firestore, "shoots"), (snapshot) => {
      const shootsData: Shoot[] = snapshot.docs.map((doc) => ({
        shootId: doc.id,
        name: doc.data().name,
      }));
      setShoots(shootsData);
    });

    const unsubscribeDeliverables = onSnapshot(collection(firestore, "deliverables"), (snapshot) => {
      const deliverablesData: Deliverable[] = snapshot.docs.map((doc) => ({
        deliverableId: doc.id,
        name: doc.data().name,
      }));
      setDeliverables(deliverablesData);
    });

    return () => {
      unsubscribeClients();
      unsubscribeEvents();
      // No unsubscribePackages here
      unsubscribeShoots();
      unsubscribeDeliverables();
    };
  }, []);

  // Fetch packages when event changes
  useEffect(() => {
    if (!formData.event) {
      setPackages([]);
      setFormData(prev => ({ ...prev, package: "" }));
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
        }))
        .filter(pkg => pkg.eventId === formData.event);
      setPackages(filteredPackages);
      // If the current selected package is not in the filtered list, clear it
      if (!filteredPackages.some(pkg => pkg.packageId === formData.package)) {
        setFormData(prev => ({ ...prev, package: "" }));
      }
    });
    return () => unsubscribe();
  }, [formData.event]);

  // Fetch all shoots for the table on mount
  useEffect(() => {
    const unsubscribeShootsTable = onSnapshot(collection(firestore, "shoots"), (snapshot) => {
      const shoots = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          day: "day1",
          ritual: data.name || "",
          date: "",
          traditionalPhotographer: data.traditionalPhotographer || "",
          traditionalVideographer: data.traditionalVideographer || "",
          candid: data.candid || "",
          cinemetographer: data.cinemetographer || "",
          assistant: data.assistant || "",
          drone: data.drone || "",
          other: data.other || "",
        };
      });
      setShootTableData(shoots);
    });
    return () => unsubscribeShootsTable();
  }, []);

  // Fetch deliverables for selected package
  useEffect(() => {
    async function fetchDeliverablesForPackage() {
      console.log('Selected packageId:', formData.package);
      const pkg = packages.find(p => p.packageId === formData.package);
      console.log('Found package:', pkg);
      if (formData.package) {
        // Fetch the entire package document from Firestore by document name (packageId)
        const packageDoc = await getDoc(doc(firestore, "packages", formData.package));
        if (packageDoc.exists()) {
          console.log('Entire package document:', packageDoc.data());
        } else {
          console.log('No package document found for packageId:', formData.package);
        }
      }
      if (!formData.package) {
        setDeliverablesTableData([]);
        return;
      }
      if (!pkg || !pkg.deliverables || !Array.isArray(pkg.deliverables)) {
        setDeliverablesTableData([]);
        return;
      }
      console.log('Package deliverables array:', pkg.deliverables);
      // For each deliverable, fetch its name from deliverables collection
      const deliverablePromises = pkg.deliverables.map(async (d) => {
        const deliverableDoc = await getDoc(doc(firestore, "deliverables", d.deliverableId));
        const data = deliverableDoc.exists() ? deliverableDoc.data() : {};
        return {
          id: d.deliverableId,
          name: data.name || "",
          qty: d.quantity || "",
        };
      });
      const deliverablesRows = await Promise.all(deliverablePromises);
      setDeliverablesTableData(deliverablesRows);
    }
    fetchDeliverablesForPackage();
  }, [formData.package, packages]);

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

  // Handler to update a cell in the shoot table
  const handleShootTableChange = (index: number, field: keyof ShootRow, value: string) => {
    setShootTableData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Handler to add a new row
  const handleAddShootRow = () => {
    setShootTableData(prev => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        day: "day1",
        ritual: "",
        date: "",
        traditionalPhotographer: "",
        traditionalVideographer: "",
        candid: "",
        cinemetographer: "",
        assistant: "",
        drone: "",
        other: "",
      },
    ]);
  };

  // Handler to update qty in the deliverables table
  const handleDeliverablesTableChange = (index: number, value: string) => {
    setDeliverablesTableData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], qty: value };
      return updated;
    });
  };

  // Handler to add a new row
  const handleAddDeliverableRow = () => {
    setDeliverablesTableData(prev => [
      ...prev,
      { id: `new-${Date.now()}`, name: "", qty: "" },
    ]);
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
      if (!formData.clientName || !formData.projectName || !formData.dates || 
          !formData.venues || !formData.event || !formData.package || 
          !formData.shoot || formData.deliverables.length === 0) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Convert date to string for Firestore
      const projectData = {
        ...formData,
        dates: formData.dates ? formData.dates.toISOString() : "",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(firestore, "projects"), projectData);

      toast.success("Project created successfully!");
      resetForm();
      router.push("/projects/view");
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
    handleInputChange,
    handleDeliverableChange,
    handleDeliverablesTableChange,
    handleAddDeliverableRow,
    handleSubmit,
    resetForm,
  };
} 