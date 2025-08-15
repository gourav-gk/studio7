import { Timestamp } from "firebase/firestore";

export type TransactionType = "credit" | "debit";

export type CreditMode = "cash" | "online";

export type DebitType = "employee_salary" | "office_saman";

export interface SalaryEntry {
  employeeId: string;
  employeeName: string;
  amount: number;
  // timestamp: Date;
  timestamp: Date | Timestamp | { seconds: number; nanoseconds?: number } | string | null;
  // If you expect date to sometimes be stored in the document itself
  date?: string;
}

export interface TransactionItemBase {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType; // credit or debit
  status: TransactionType; // redundant for UI (requested as status)
  purpose: string; // where use
  amount: number;
  timestamp: Date;
}

export interface CreditTransactionItem extends TransactionItemBase {
  type: "credit";
  status: "credit";
  mode: CreditMode;
  utr?: string; // required if mode is online
}

export interface DebitTransactionItem extends TransactionItemBase {
  type: "debit";
  status: "debit";
  debitType: DebitType;
  employees?: SalaryEntry[]; // when debitType is employee_salary
}

export type TransactionItem = CreditTransactionItem | DebitTransactionItem;

export interface TransactionsDoc {
  date: string; // doc id mirrors this
  createdAt: Date;
  updatedAt: Date;
  items: TransactionItem[];
}

export interface SalaryDoc {
  date: string; // doc id mirrors this
  createdAt: Date;
  updatedAt: Date;
  employees: SalaryEntry[];
}
