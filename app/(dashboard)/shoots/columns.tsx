import { ColumnDef } from "@tanstack/react-table";
import { Shoot } from "./types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import SortButton from "@/components/shared/sortButton";

export function getShootColumns(onEdit: (shoot: Shoot) => void): ColumnDef<Shoot>[] {
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
      accessorKey: "name",
      header: ({ column }) => (
        <SortButton
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          isAsc={column.getIsSorted() === "asc"}
        />
      ),
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "traditionalPhotographer",
      header: "Traditional Photographer",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "traditionalVideographer",
      header: "Traditional Videographer",
      cell: (info) => info.getValue(),
    },
    { accessorKey: "camId", header: "Cam ID", cell: (info) => info.getValue() },
    { accessorKey: "cinemetographer", header: "Cinemetographer", cell: (info) => info.getValue() },
    { accessorKey: "assistant", header: "Assistant", cell: (info) => info.getValue() },
    { accessorKey: "other", header: "Other", cell: (info) => info.getValue() },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => onEdit(row.original)}>
          Edit
        </Button>
      ),
    },
  ];
}
