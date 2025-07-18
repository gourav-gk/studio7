import { ColumnDef } from "@tanstack/react-table";
import { Employee } from "./types";
import { Checkbox } from "@/components/ui/checkbox";
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

export function getEmployeeColumns(onEdit: (emp: Employee) => void): ColumnDef<Employee>[] {
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
      accessorKey: "empId",
      header: ({ column }) => (
        <SortButton
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          isAsc={column.getIsSorted() === "asc"}
          label="Emp ID"
        />
      ),
      cell: ({ row }) => <div>{row.getValue("empId")}</div>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortButton
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          isAsc={column.getIsSorted() === "asc"}
          label="Name"
        />
      ),
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <SortButton
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          isAsc={column.getIsSorted() === "asc"}
          label="Email"
        />
      ),
      cell: ({ row }) => <div>{row.getValue("email")}</div>,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <div>{row.getValue("phone")}</div>,
      enableSorting: false,
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => <div>{row.getValue("gender")}</div>,
      enableSorting: false,
    },
    {
      accessorKey: "profileStatus",
      header: "Status",
      cell: ({ row }) => <div>{row.getValue("profileStatus")}</div>,
      enableSorting: false,
    },
    {
      accessorKey: "salary",
      header: "Salary",
      cell: ({ row }) => <div>{row.getValue("salary")}</div>,
      enableSorting: false,
    },
    {
      accessorKey: "salaryStatus",
      header: "Salary Status",
      cell: ({ row }) => <div>{row.getValue("salaryStatus")}</div>,
      enableSorting: false,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const emp = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(emp)}>Edit</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    },
  ];
}
