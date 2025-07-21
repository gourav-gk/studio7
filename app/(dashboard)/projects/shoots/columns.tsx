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
  assignedEmployees?: string[]; // for future use
}

export function getShootColumns(onAssignEmployee: (shoot: ShootRow) => void): ColumnDef<ShootRow>[] {
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
      cell: ({ row }) => <div>{row.getValue("traditionalPhotographer")}</div>,
    },
    {
      accessorKey: "traditionalVideographer",
      header: "Traditional Videographer",
      cell: ({ row }) => <div>{row.getValue("traditionalVideographer")}</div>,
    },
    {
      accessorKey: "candid",
      header: "Candid",
      cell: ({ row }) => <div>{row.getValue("candid")}</div>,
    },
    {
      accessorKey: "cinemetographer",
      header: "Cinematographer",
      cell: ({ row }) => <div>{row.getValue("cinemetographer")}</div>,
    },
    {
      accessorKey: "assistant",
      header: "Assistant",
      cell: ({ row }) => <div>{row.getValue("assistant")}</div>,
    },
    {
      accessorKey: "drone",
      header: "Drone",
      cell: ({ row }) => <div>{row.getValue("drone")}</div>,
    },
    {
      accessorKey: "other",
      header: "Others",
      cell: ({ row }) => <div>{row.getValue("other")}</div>,
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