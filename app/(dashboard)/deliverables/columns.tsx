import { ColumnDef } from "@tanstack/react-table";
import { Deliverable } from "./types";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export function getDeliverableColumns(onEdit: (deliverable: Deliverable) => void): ColumnDef<Deliverable>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: info => info.getValue(),
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: info => format(new Date(info.getValue() as Date), "yyyy-MM-dd HH:mm"),
    },
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
