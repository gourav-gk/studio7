import { ColumnDef } from "@tanstack/react-table";
import SortButton from "@/components/shared/sortButton";
import { Enquiry } from "./types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export function getEnquiryColumns(onEdit: (enquiry: Enquiry) => void): ColumnDef<Enquiry>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "enquiryId",
      header: () => <Button variant="ghost">Enquiry ID</Button>,
      cell: ({ row }) => <div>{row.getValue("enquiryId")}</div>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortButton
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          isAsc={column.getIsSorted() === "asc"}
        />
      ),
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "phoneNo",
      header: "Phone No",
      cell: ({ row }) => <div>{row.getValue("phoneNo")}</div>,
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => <div>{row.getValue("address")}</div>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const enquiry = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(enquiry)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => alert(`Convert ${enquiry.enquiryId} to client`)}>
                Convert to Client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

export const menuContent = (
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
    <DropdownMenuItem onClick={() => alert("Bulk Delete")}>Delete</DropdownMenuItem>
    <DropdownMenuItem onClick={() => alert("Bulk Convert to Client")}>
      Convert to Client
    </DropdownMenuItem>
  </DropdownMenuContent>
);

export const data: Enquiry[] = [
  {
    enquiryId: "ENQ-001",
    name: "John Doe",
    phoneNo: "9876543210",
    address: "123 Main Street, Pune",
  },
  {
    enquiryId: "ENQ-002",
    name: "Jane Smith",
    phoneNo: "9123456780",
    address: "456 Elm Street, Mumbai",
  },
  {
    enquiryId: "ENQ-003",
    name: "Arjun Kapoor",
    phoneNo: "9988776655",
    address: "Plot 12, Sector 7, Delhi",
  },
];
