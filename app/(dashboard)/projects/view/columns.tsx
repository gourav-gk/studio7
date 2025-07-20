import { ColumnDef } from "@tanstack/react-table";
import { Project, Deliverable } from "./types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { format } from "date-fns";

export function getProjectColumns(
  onEdit: (project: Project) => void,
  onView: (project: Project) => void,
  deliverables: Deliverable[]
): ColumnDef<Project>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="h-4 w-4 rounded border-gray-300"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="h-4 w-4 rounded border-gray-300"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "projectName",
      header: "Project Name",
      cell: info => info.getValue(),
      enableColumnFilter: true,
    },
    {
      accessorKey: "clientName",
      header: "Client Name",
      cell: info => info.getValue(),
    },
    {
      accessorKey: "dates",
      header: "Dates",
      cell: info => info.getValue(),
    },
    {
      accessorKey: "venues",
      header: "Venues",
      cell: info => info.getValue(),
    },
    {
      accessorKey: "event",
      header: "Event",
      cell: info => info.getValue(),
    },
    {
      accessorKey: "package",
      header: "Package",
      cell: info => info.getValue(),
    },
    {
      accessorKey: "shoot",
      header: "Shoot",
      cell: info => info.getValue(),
    },
    {
      accessorKey: "deliverables",
      header: "Deliverables",
      cell: info => {
        const deliverableIds = info.getValue() as string[];
        const deliverableNames = deliverableIds.map(id => {
          const deliverable = deliverables.find(d => d.deliverableId === id);
          return deliverable ? deliverable.name : id;
        });
        return deliverableNames.join(", ");
      },
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: info => `$${info.getValue()}`,
      enableHiding: true,
    },
    {
      accessorKey: "extraExpenses",
      header: "Extra Expenses",
      cell: info => `$${info.getValue()}`,
      enableHiding: true,
    },
    {
      accessorKey: "discount",
      header: "Discount",
      cell: info => `$${info.getValue()}`,
      enableHiding: true,
    },
    {
      accessorKey: "finalAmount",
      header: "Final Amount",
      cell: info => `$${info.getValue()}`,
      enableHiding: true,
    },
    {
      accessorKey: "advance",
      header: "Advance",
      cell: info => `$${info.getValue()}`,
      enableHiding: true,
    },
    {
      accessorKey: "due",
      header: "Due",
      cell: info => `$${info.getValue()}`,
      enableHiding: true,
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: info => format(new Date(info.getValue() as Date), "yyyy-MM-dd HH:mm"),
      enableHiding: true,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(row.original)}>
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
} 