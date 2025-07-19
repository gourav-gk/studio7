import { ColumnDef } from "@tanstack/react-table";
import { Shoot } from "./types";
import { Button } from "@/components/ui/button";

export function getShootColumns(onEdit: (shoot: Shoot) => void): ColumnDef<Shoot>[] {
  return [
    { accessorKey: "name", header: "Name", cell: info => info.getValue() },
    { accessorKey: "traditionalPhotographer", header: "Traditional Photographer", cell: info => info.getValue() },
    { accessorKey: "traditionalVideographer", header: "Traditional Videographer", cell: info => info.getValue() },
    { accessorKey: "camId", header: "Cam ID", cell: info => info.getValue() },
    { accessorKey: "cinemetographer", header: "Cinemetographer", cell: info => info.getValue() },
    { accessorKey: "assistant", header: "Assistant", cell: info => info.getValue() },
    { accessorKey: "other", header: "Other", cell: info => info.getValue() },
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
