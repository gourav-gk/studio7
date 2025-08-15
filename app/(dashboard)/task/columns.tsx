import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ban } from "lucide-react";

export type RawTask = Record<string, string>;

export interface Task {
  id: string;
  raw: RawTask;
  name: string;
  employeeId: string;
  employeeName: string;
  deliveryDate: Date;
  assignedDate: Date;
  status: string;
  projectId?: string;
  shootId?: string;
  role?: string;
}

export function getTaskColumns(
  onEdit: (task: Task) => void,
  onDelete: (task: Task) => void
): ColumnDef<Task>[] {
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
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Task Name",
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "employeeName",
      header: "Employee",
      cell: ({ row }) => <div>{row.getValue("employeeName")}</div>,
    },
    {
      accessorKey: "assignedDate",
      header: "Assigned Date",
      cell: ({ row }) => {
        const d = row.original.assignedDate;
        return <div>{d ? format(d, "yyyy-MM-dd") : "-"}</div>;
      },
    },
    {
      accessorKey: "date",
      header: "Delivery Date",
      cell: ({ row }) => {
        const d = row.original.deliveryDate;
        return <div>{d ? format(d, "yyyy-MM-dd") : "-"}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const classes: Record<string, string> = {
          Pending: "text-yellow-600",
          Ongoing: "text-blue-600",
          Completed: "text-green-600",
        };
        return <span className={classes[status] || ""}>{status}</span>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const type = row.original.raw.type;
        if (type.toLowerCase() !== "other")
          return (
            <div className="px-2.5">
              <Ban size={"12px"} color="red" />
            </div>
          );

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(row.original)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={()=>onDelete(row.original)}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
