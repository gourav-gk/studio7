import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { WeddingPackage } from "./types";

export function getWeddingColumns(onEdit: (pkg: WeddingPackage) => void): ColumnDef<WeddingPackage>[] {
  return [
    {
      accessorKey: "name",
      header: "Package Name",
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => <div>₹ {row.getValue("price")}</div>,
    },
/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Renders a button for editing a wedding package.
 * The button triggers the `onEdit` function with the original wedding package data
 * when clicked.
 *
 * @param {Object} param - The parameter object.
 * @param {Object} param.row - The row object containing the wedding package data.
 * @returns {JSX.Element} A button element for editing the wedding package.
 */

/*******  2cce8a44-a699-4bb4-a0fc-922487b24078  *******/    {
      accessorKey: "features",
      header: "Features",
      cell: ({ row }) => <div>{row.getValue("features")}</div>,
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
