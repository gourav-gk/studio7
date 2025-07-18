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
import { firestore } from "@/lib/firebase";
import { collection, deleteDoc, doc, setDoc } from "firebase/firestore";
import { toast } from "sonner";

export function getEnquiryColumns(
  onEdit: (enquiry: Enquiry) => void,
  onRowSelectionChange?: (value: Record<string, boolean>) => void
): ColumnDef<Enquiry>[] {
  const handleConvertToClient = async (enquiry: Enquiry) => {
    try {
      const clientsRef = collection(firestore, "clients");
      const modifiedId = enquiry.enquiryId.replace(/^enquiry/, "client");

      await setDoc(doc(clientsRef, modifiedId), {
        name: enquiry.name,
        phoneNo: enquiry.phoneNo,
        address: enquiry.address,
        source: "enquiry",
        originalEnquiryId: modifiedId,
        createdAt: new Date().toISOString(),
      });

      await deleteDoc(doc(firestore, "enquiry", enquiry.enquiryId));
      
      // Reset row selection
      if (onRowSelectionChange) {
        onRowSelectionChange({});
      }
      
      toast.success(`Converted to client with ID: ${modifiedId}`);
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Failed to convert enquiry to client");
    }
  };

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
              <DropdownMenuItem onClick={() => handleConvertToClient(enquiry)}>
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
