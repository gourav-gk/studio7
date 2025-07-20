import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
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

    const unsubscribePackages = onSnapshot(collection(firestore, "packages"), (snapshot) => {
      const packagesData: Package[] = snapshot.docs.map((doc) => ({
        packageId: doc.id,
        name: doc.data().name,
      }));
      setPackages(packagesData);
    });

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
      unsubscribePackages();
      unsubscribeShoots();
      unsubscribeDeliverables();
    };
  }, []);

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
    handleInputChange,
    handleDeliverableChange,
    handleSubmit,
    resetForm,
  };
} 