import React from "react";
import { Button } from "../ui/button";
import { Table } from "@tanstack/react-table";

interface PaginationProps<T> {
  table: Table<T>;
}

function Pagination<T>({ table }: PaginationProps<T>) {
  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <div className="text-sm text-muted-foreground flex-1">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default Pagination;
