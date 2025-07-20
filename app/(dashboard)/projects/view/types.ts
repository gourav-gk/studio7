export interface Project {
  projectId: string;
  clientName: string;
  projectName: string;
  dates: string;
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
  createdAt: Date;
}

export interface Client {
  clientId: string;
  name: string;
}

export interface Event {
  eventId: string;
  name: string;
}

export interface Package {
  packageId: string;
  name: string;
}

export interface Shoot {
  shootId: string;
  name: string;
}

export interface Deliverable {
  deliverableId: string;
  name: string;
} 