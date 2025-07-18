import { ColumnDef } from "@tanstack/react-table";
import SortButton from "@/components/shared/sortButton";
import { PreweddingPackage } from "./types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export function getPreweddingColumns(onEdit: (pkg: PreweddingPackage) => void): ColumnDef<PreweddingPackage>[] {
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
      accessorKey: "id",
      header: "Package ID",
      cell: ({ row }) => row.getValue("id"),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortButton
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          isAsc={column.getIsSorted() === "asc"}
        />
      ),
      cell: ({ row }) => row.getValue("name"),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => `₹${row.getValue("price")}`,
    },
    {
      accessorKey: "features",
      header: "Features",
      cell: ({ row }) => {
        const features = row.getValue("features");
        if (Array.isArray(features)) {
          return <div>{features.join(", ")}</div>;
        }
        if (typeof features === "string") {
          return <div>{features}</div>;
        }
        return <div>-</div>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const pkg = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(pkg)}>Edit</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
