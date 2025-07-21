import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, MoreHorizontal, Plus } from "lucide-react";
import { CSVLink } from "react-csv";
import { Table } from "@tanstack/react-table";
import { Project } from "../types";

interface ProjectsTableProps {
  table: Table<Project>;
  data: Project[];
  onEdit: (project: Project) => void;
  onView: (project: Project) => void;
  onBulkDelete: (projects: Project[]) => void;
}

export function ProjectsTable({
  table,
  data,
  onBulkDelete,
}: ProjectsTableProps) {
  const router = useRouter();
  const selectedRows = table.getFilteredSelectedRowModel().rows;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
      <div className="flex justify-between sm:justify-start items-center gap-4">
        <Button onClick={() => router.push("/projects/add")}>
          Add New Project
          <Plus className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
        <Input
          placeholder="Filter by Project Name..."
          value={(table.getColumn("projectName")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("projectName")?.setFilterValue(e.target.value)}
          className="max-w-sm w-full sm:w-[200px]"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(val) => col.toggleVisibility(!!val)}
                >
                  {col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden sm:flex gap-2">
          <CSVLink data={data} filename="projects.csv">
            <Button variant="outline">Export CSV</Button>
          </CSVLink>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={selectedRows.length === 0}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => onBulkDelete(selectedRows.map((row) => row.original))}
                className="text-red-600"
              >
                Delete Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
} 