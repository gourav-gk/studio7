"use client";

import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { SalaryDoc, SalaryEntry } from "../transaction/types";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  ColumnDef,
} from "@tanstack/react-table";
import { GenericTable } from "@/components/shared/GenericTable";
import Pagination from "@/components/shared/Pagination";
import TableSkeleton from "@/components/shared/skeletons/TableSkeleton";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { CSVLink } from "react-csv";
import { ClientOnly } from "@/components/ClientOnly";

interface SalaryTableItem extends SalaryEntry {
  date: string;
}

const getSalaryColumns = (): ColumnDef<SalaryTableItem>[] => [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const d = row.original.date;
      // d is YYYY-MM-DD; render as-is to avoid timezone issues
      try {
        // Attempt a nicer format but fallback to raw
        const parts = d?.split?.("-") || [];
        if (parts.length === 3) {
          const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          return isNaN(dt.getTime()) ? d : format(dt, "dd MMM yyyy");
        }
        return d || "-";
      } catch {
        return d || "-";
      }
    },
  },
  {
    accessorKey: "employeeName",
    header: "Employee Name",
    cell: ({ row }) => row.original.employeeName || "-",
  },
  {
    accessorKey: "amount",
    header: "Salary Amount",
    cell: ({ row }) => `₹${(row.original.amount || 0).toLocaleString()}`,
  },
  {
    accessorKey: "timestamp",
    header: "Paid At",
    cell: ({ row }) => {
      const ts = row.original.timestamp;
      if (!ts) return "-";
      try {
        let dt: Date;

        if (ts instanceof Date) {
          dt = ts;
        } else if (ts instanceof Timestamp) {
          dt = ts.toDate();
        } else if (typeof ts === "string" || typeof ts === "number") {
          dt = new Date(ts);
        } else if (typeof ts === "object" && "seconds" in ts) {
          dt = new Date(ts.seconds * 1000);
        } else {
          return "-";
        }

        return isNaN(dt.getTime()) ? "-" : format(dt, "dd MMM yyyy HH:mm");
      } catch {
        return "-";
      }
    },
  },
];

export default function SalaryPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<SalaryTableItem[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Load all salary records across date docs
  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, "salary"), (snapshot) => {
      const items: SalaryTableItem[] = [];
      snapshot.docs.forEach((d) => {
        const docData = d.data() as SalaryDoc;
        const dateKey = d.id; // YYYY-MM-DD
        const arr: SalaryTableItem[] = (docData?.employees || []).map((emp) => {
          let normalizedTs: Date | null = null;
          const rawTs = emp?.timestamp;
          if (rawTs instanceof Timestamp) {
            normalizedTs = rawTs.toDate();
          } else if (rawTs instanceof Date) {
            normalizedTs = rawTs;
          } else if (rawTs && typeof rawTs === "object" && "seconds" in rawTs) {
            normalizedTs = new Date(rawTs.seconds * 1000);
          } else if (typeof rawTs === "string") {
            const parsed = new Date(rawTs);
            normalizedTs = isNaN(parsed.getTime()) ? null : parsed;
          }

          return {
            ...emp,
            date: emp?.date || dateKey,
            timestamp: normalizedTs,
          } as SalaryTableItem;
        });
        items.push(...arr);
      });
      setData(items.sort((a, b) => (a.date > b.date ? -1 : 1)));
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredData = useMemo(() => {
    if (!startDate && !endDate) return data;
    return data.filter((t) => {
      const d = t.date;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [data, startDate, endDate]);

  const columns = useMemo(() => getSalaryColumns(), []);

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  const totalSalary = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [filteredData]);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Salary Records</h1>
          <p className="text-muted-foreground">View all employee salary payments</p>
        </div>
        <div className="flex items-center gap-2">
          <ClientOnly>
            <CSVLink
              data={filteredData}
              filename={`salary-${startDate || "all"}-${endDate || "all"}.csv`}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Export CSV
            </CSVLink>
          </ClientOnly>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total Records</h3>
          <p className="text-2xl font-bold">{filteredData.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total Salary Paid</h3>
          <p className="text-2xl font-bold text-green-600">₹{totalSalary.toLocaleString()}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Date Range</h3>
          <p className="text-sm">
            {startDate && endDate ? `${startDate} to ${endDate}` : "All dates"}
          </p>
        </div>
      </div>

      {/* Date Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-sm text-muted-foreground">Start date</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">End date</label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton columnCount={4} rowCount={5} />
      ) : (
        <>
          <GenericTable table={table} />
          <Pagination table={table} />
        </>
      )}
    </div>
  );
}
