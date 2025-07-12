import React, { Dispatch, ReactNode, SetStateAction } from "react";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { ChevronDown, MoreHorizontal, Plus } from "lucide-react";
import { CSVLink } from "react-csv";
import { Table } from "@tanstack/react-table";

interface TableActionProps<T> {
  table: Table<T>;
  data: T[];
  menuContent?: ReactNode;
  searchPlaceholder?: string;
  //   AddPopover?: ReactNode;
  onOpenChange?: Dispatch<SetStateAction<boolean>>;
}

function TableActions<T extends object>({
  table,
  data,
  menuContent,
  searchPlaceholder = "Filter by Name...",
  onOpenChange,
}: //   AddPopover,
TableActionProps<T>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
      <div className="flex justify-between sm:justify-start items-center gap-4">
        {onOpenChange && (
          <Button onClick={() => onOpenChange(true)}>
            Add New
            <Plus className="ml-2 h-4 w-4" />
          </Button>
        )}
        <div className="flex sm:hidden gap-2">
          <CSVLink data={data} filename="enquiries.csv">
            <Button variant="outline" size="icon">
              CSV
            </Button>
          </CSVLink>
          {menuContent && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" disabled={selectedRows.length === 0}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              {menuContent}
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
        <Input
          placeholder={searchPlaceholder}
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
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
          <CSVLink data={data} filename="enquiries.csv">
            <Button variant="outline">Export CSV</Button>
          </CSVLink>
          {menuContent && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={selectedRows.length === 0}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              {menuContent}
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}

export default TableActions;
