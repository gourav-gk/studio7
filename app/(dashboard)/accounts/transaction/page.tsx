"use client";

import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { TransactionsDoc, TransactionItem } from "./types";
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, ColumnFiltersState, SortingState, VisibilityState } from "@tanstack/react-table";
import { getTransactionColumns } from "./columns";
import { GenericTable } from "@/components/shared/GenericTable";
import Pagination from "@/components/shared/Pagination";
import TableSkeleton from "@/components/shared/skeletons/TableSkeleton";
import TableActions from "@/components/shared/TableActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddTransactionModal from "./AddTransactionModal";
import { CSVLink } from "react-csv";
 

export default function TransactionsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<TransactionItem[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Load all transactions across date docs
  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, "transactions"), (snapshot) => {
      const items: TransactionItem[] = [];
      snapshot.docs.forEach((d) => {
        const docData = d.data() as TransactionsDoc as any;
        const dateKey = d.id; // YYYY-MM-DD
        const arr: TransactionItem[] = (docData?.items || []).map((it) => ({ ...it, date: it.date || dateKey }));
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

  const summary = useMemo(() => {
    const credits = filteredData.filter(t => t.type === "credit").reduce((sum, t) => sum + t.amount, 0);
    const debits = filteredData.filter(t => t.type === "debit").reduce((sum, t) => sum + t.amount, 0);
    const net = credits - debits;
    return { credits, debits, net };
  }, [filteredData]);

  const columns = useMemo(() => getTransactionColumns(), []);

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

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">View all credits and debits</p>
        </div>
        <div className="flex items-center gap-2">
          <CSVLink 
            data={filteredData} 
            filename={`transactions-${startDate || 'all'}-${endDate || 'all'}.csv`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            Export CSV
          </CSVLink>
          <Button onClick={() => setOpen(true)}>Add</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total Credits</h3>
          <p className="text-2xl font-bold text-green-600">₹{summary.credits.toLocaleString()}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total Debits</h3>
          <p className="text-2xl font-bold text-red-600">₹{summary.debits.toLocaleString()}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Net Balance</h3>
          <p className={`text-2xl font-bold ${summary.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{summary.net.toLocaleString()}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total Records</h3>
          <p className="text-2xl font-bold">{filteredData.length}</p>
        </div>
      </div>

      {/* Date Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-muted-foreground">Start date</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">End date</label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton columnCount={6} rowCount={5} />
      ) : (
        <>
          <TableActions table={table} data={filteredData} searchPlaceholder="Filter by purpose..." />
          <GenericTable table={table} />
          <Pagination table={table} />
        </>
      )}

      <AddTransactionModal open={open} onOpenChange={setOpen} />
    </div>
  );
}


