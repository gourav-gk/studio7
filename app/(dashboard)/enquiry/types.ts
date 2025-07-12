import { Table } from "@tanstack/react-table";

export type Enquiry = {
  enquiryId: string;
  name: string;
  phoneNo: string;
  address: string;
};

export interface EnquiryDataTableProps<T> {
  table: Table<T>;
}
