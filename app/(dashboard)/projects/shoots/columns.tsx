import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import SortButton from "@/components/shared/sortButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { getEmployeeNames } from "@/lib/utils";

export interface ShootRow {
  id: string;
  projectId: string;
  projectName: string;
  day: string;
  ritual: string;
  date: string;
  traditionalPhotographer: string;
  traditionalVideographer: string;
  candid: string;
  cinemetographer: string;
  assistant: string;
  drone: string;
  other: string;
  assignedEmployees?: { [role: string]: string[] };
}

export function getShootColumns(
  onAssignEmployee: (shoot: ShootRow) => void,
  employees: { uId: string; name: string }[]
): ColumnDef<ShootRow>[] {
  return [
    {
      accessorKey: "projectName",
      header: ({ column }) => (
        <SortButton
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          isAsc={column.getIsSorted() === "asc"}
          label="Project Name"
        />
      ),
      cell: ({ row }) => <div>{row.getValue("projectName")}</div>,
    },
    {
      accessorKey: "day",
      header: "Day",
      cell: ({ row }) => <div>{row.getValue("day")}</div>,
    },
    {
      accessorKey: "ritual",
      header: "Ritual",
      cell: ({ row }) => <div>{row.getValue("ritual")}</div>,
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <div>{row.getValue("date")}</div>,
    },
    {
      accessorKey: "traditionalPhotographer",
      header: "Traditional Photographer",
      cell: ({ row }) => {
        const assigned = row.original.assignedEmployees?.traditionalPhotographer || [];
        const names = getEmployeeNames(assigned, employees);
        return (
          <div>
            {assigned.length === 0 ? row.getValue("traditionalPhotographer") : assigned.length}
            {assigned.length > 0 && (
              <span className="ml-2 text-gray-500">({names.join(", ")})</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "traditionalVideographer",
      header: "Traditional Videographer",
      cell: ({ row }) => {
        const assigned = row.original.assignedEmployees?.traditionalVideographer || [];
        const names = getEmployeeNames(assigned, employees);
        return (
          <div>
            {assigned.length === 0 ? row.getValue("traditionalVideographer") : assigned.length}
            {assigned.length > 0 && (
              <span className="ml-2 text-gray-500">({names.join(", ")})</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "candid",
      header: "Candid",
      cell: ({ row }) => {
        const assigned = row.original.assignedEmployees?.candid || [];
        const names = getEmployeeNames(assigned, employees);
        return (
          <div>
            {assigned.length === 0 ? row.getValue("candid") : assigned.length}
            {assigned.length > 0 && (
              <span className="ml-2 text-gray-500">({names.join(", ")})</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "cinemetographer",
      header: "Cinematographer",
      cell: ({ row }) => {
        const assigned = row.original.assignedEmployees?.cinematographer || [];
        const names = getEmployeeNames(assigned, employees);
        return (
          <div>
            {assigned.length === 0 ? row.getValue("cinemetographer") : assigned.length}
            {assigned.length > 0 && (
              <span className="ml-2 text-gray-500">({names.join(", ")})</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "assistant",
      header: "Assistant",
      cell: ({ row }) => {
        const assigned = row.original.assignedEmployees?.assistant || [];
        const names = getEmployeeNames(assigned, employees);
        return (
          <div>
            {assigned.length === 0 ? row.getValue("assistant") : assigned.length}
            {assigned.length > 0 && (
              <span className="ml-2 text-gray-500">({names.join(", ")})</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "drone",
      header: "Drone",
      cell: ({ row }) => {
        const assigned = row.original.assignedEmployees?.drone || [];
        const names = getEmployeeNames(assigned, employees);
        return (
          <div>
            {assigned.length === 0 ? row.getValue("drone") : assigned.length}
            {assigned.length > 0 && (
              <span className="ml-2 text-gray-500">({names.join(", ")})</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "other",
      header: "Others",
      cell: ({ row }) => {
        const assigned = row.original.assignedEmployees?.others || [];
        const names = getEmployeeNames(assigned, employees);
        return (
          <div>
            {assigned.length === 0 ? row.getValue("other") : assigned.length}
            {assigned.length > 0 && (
              <span className="ml-2 text-gray-500">({names.join(", ")})</span>
            )}
          </div>
        );
      },
    },

    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const shoot = row.original;
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
              <DropdownMenuItem onClick={() => onAssignEmployee(shoot)}>
                Assign Employee
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
