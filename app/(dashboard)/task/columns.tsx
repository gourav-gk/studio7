import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

export type RawTask = Record<string, string>;

export interface Task {
  id: string;
  raw: RawTask;
  name: string; // deliverableName or shootName or type
  employeeId: string; // should equal userId usually
  employeeName: string;
  date: Date; // chosen from assignedDate or createdAt
  status: string;
  projectId?: string;
  shootId?: string;
  role?: string;
}

export function getTaskColumns(): ColumnDef<Task>[] {
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
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const d = row.original.date;
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
  ];
}
