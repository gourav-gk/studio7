export interface Project {
  projectId: string;
  clientName: string;
  projectName: string;
  dates: string;
  venues: string;
  event: string;
  package: string;
  shoot?: string;
  shoots?: {
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
  }[];
  deliverables:
    | string[]
    | {
        id: string;
        name: string;
        qty: string;
      }[];
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
  eventId: string; // Added to link package to event
}

export interface Shoot {
  shootId: string;
  name: string;
}

export interface Deliverable {
  deliverableId: string;
  name: string;
}
