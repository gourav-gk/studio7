import { Table } from "@tanstack/react-table";

export interface Client {
  clientId: string;
  name: string;
  phoneNo: string;
  address: string;
}

export interface ClientDataTableProps<T> {
  table: Table<T>; // Strongly typed table
}
