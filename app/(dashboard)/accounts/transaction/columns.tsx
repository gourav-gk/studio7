"use client";

import { ColumnDef } from "@tanstack/react-table";
import { TransactionItem } from "./types";

export const getTransactionColumns = (): ColumnDef<TransactionItem>[] => [
  {
    accessorKey: "name",
    header: "name",
    cell: ({ row }) => row.original.purpose,
    enableHiding: true,
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: (info) => info.getValue() as string,
  },
  {
    accessorKey: "type",
    header: "Transaction Type",
    cell: ({ row }) => row.original.type,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => row.original.status,
  },
  {
    accessorKey: "purpose",
    header: "Purpose",
    cell: ({ row }) => row.original.purpose,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => `₹${row.original.amount}`,
  },
  {
    id: "detail",
    header: "Detail",
    cell: ({ row }) => {
      const t = row.original;
      if (t.type === "credit") {
        return t.mode === "online" ? `Online (UTR: ${t.utr || "-"})` : "Cash";
      }
      if (t.type === "debit") {
        if (t.debitType === "employee_salary") {
          return `Salary for ${t.employees?.length || 0} employee(s)`;
        }
        return "Office Saman";
      }
      return "-";
    },
  },
];


