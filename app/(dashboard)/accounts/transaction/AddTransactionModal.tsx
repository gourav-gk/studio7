"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect, Option } from "@/components/shared/MultiSelect";
import { collection, doc, getDocs, setDoc, updateDoc, getDoc, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { CreditMode, DebitType, SalaryEntry, TransactionItem, TransactionsDoc } from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

interface UserDoc {
  uId: string;
  name: string;
}

export default function AddTransactionModal({ open, onOpenChange }: Props) {
  const [txnType, setTxnType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10));

  // credit
  const [creditMode, setCreditMode] = useState<CreditMode>("cash");
  const [utr, setUtr] = useState("");

  // debit
  const [debitType, setDebitType] = useState<DebitType>("employee_salary");
  const [employees, setEmployees] = useState<UserDoc[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  const employeeOptions: Option[] = useMemo(
    () => employees.map((e) => ({ value: e.uId, label: e.name })),
    [employees]
  );

  useEffect(() => {
    if (!open) return;
    const unsubscribe = onSnapshot(collection(firestore, "users"), (snapshot) => {
      const arr = snapshot.docs.map((d) => {
        const data: any = d.data();
        const name = data?.name || data?.displayName || data?.fullName || data?.email || d.id;
        return { uId: d.id, name } as UserDoc;
      }).sort((a, b) => a.name.localeCompare(b.name));
      setEmployees(arr);
    }, (error) => {
      console.error("Failed to subscribe users:", error);
    });
    return () => unsubscribe();
  }, [open]);

  const resetForm = () => {
    setTxnType("credit");
    setAmount("");
    setPurpose("");
    setDateStr(new Date().toISOString().slice(0, 10));
    setCreditMode("cash");
    setUtr("");
    setDebitType("employee_salary");
    setSelectedEmployeeIds([]);
  };

  const handleSubmit = async () => {
    try {
      const todayDocId = dateStr; // YYYY-MM-DD
      const now = new Date();

      const base = {
        id: uuidv4(),
        date: dateStr,
        purpose: purpose.trim(),
        amount: Number(amount || 0),
        timestamp: now,
      } as const;

      let item: TransactionItem;

      if (txnType === "credit") {
        item = {
          ...base,
          type: "credit",
          status: "credit",
          mode: creditMode,
          utr: creditMode === "online" ? utr.trim() : undefined,
        };
      } else {
        if (debitType === "employee_salary") {
          const salaryEntries: SalaryEntry[] = selectedEmployeeIds.map((id) => {
            const emp = employees.find((e) => e.uId === id);
            return {
              employeeId: id,
              employeeName: emp?.name || id,
              amount: Number(amount || 0),
              timestamp: now,
            };
          });
          item = {
            ...base,
            type: "debit",
            status: "debit",
            debitType: "employee_salary",
            employees: salaryEntries,
          };
        } else {
          item = {
            ...base,
            type: "debit",
            status: "debit",
            debitType: "office_saman",
          } as TransactionItem;
        }
      }

      // Upsert transactions doc for the date
      const txnDocRef = doc(firestore, "transactions", todayDocId);
      await setDoc(
        txnDocRef,
        {
          date: todayDocId,
          createdAt: now,
          updatedAt: now,
          // Firestore merge arrays by overwrite, so we must use update with arrayUnion normally.
          // Here we fetch existing via updateDoc with a function-like approach: we will overwrite with concatenation.
        },
        { merge: true }
      );

      // Read-modify-write: load existing items via a getDocs is heavy; instead attempt update with arrayUnion fallback.
      // Using updateDoc with a field path using Firestore arrayUnion would be ideal, but we want to keep types intact.
      // We'll do a small fetch by getDocs on the specific doc via setDoc merge with items default [] then updateDoc to append.
      const existingSnap = await getDoc(txnDocRef);
      const existing = existingSnap.exists() ? (existingSnap.data() as TransactionsDoc) : (null as any);
      const nextItems = [...(existing?.items || []), item];
      await updateDoc(txnDocRef, { items: nextItems, updatedAt: now });

      // If salary debit, also upsert salary doc for the date
      if (txnType === "debit" && item.type === "debit" && item.debitType === "employee_salary") {
        const salaryDocRef = doc(firestore, "salary", todayDocId);
        await setDoc(
          salaryDocRef,
          {
            date: todayDocId,
            createdAt: now,
            updatedAt: now,
          },
          { merge: true }
        );
        const existingSalarySnap = await getDoc(salaryDocRef);
        const existingSalary = existingSalarySnap.exists() ? existingSalarySnap.data() as any : null;
        const prevEmployees = existingSalary?.employees || [];
        const mergedEmployees = [...prevEmployees, ...(item.employees || [])];
        await updateDoc(salaryDocRef, { employees: mergedEmployees, updatedAt: now });
      }

      toast.success("Transaction recorded");
      onOpenChange(false);
      resetForm();
    } catch (e) {
      console.error(e);
      toast.error("Failed to record transaction");
    }
  };

  const canSubmit = () => {
    if (!amount || Number(amount) <= 0) return false;
    if (!purpose.trim()) return false;
    if (txnType === "credit" && creditMode === "online" && !utr.trim()) return false;
    if (txnType === "debit" && debitType === "employee_salary" && selectedEmployeeIds.length === 0) return false;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <Select value={txnType} onValueChange={(v) => setTxnType(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Purpose</Label>
            <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Purpose / where used" />
          </div>
        </div>

        {txnType === "credit" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select value={creditMode} onValueChange={(v) => setCreditMode(v as CreditMode)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {creditMode === "online" && (
              <div className="space-y-2">
                <Label>UTR No.</Label>
                <Input value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="Enter UTR number" />
              </div>
            )}
          </div>
        )}

        {txnType === "debit" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Debited Type</Label>
              <Select value={debitType} onValueChange={(v) => setDebitType(v as DebitType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee_salary">Employee Salary</SelectItem>
                  <SelectItem value="office_saman">Office Saman</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {debitType === "employee_salary" && (
              <div className="space-y-2 md:col-span-2">
                <Label>Select Employees</Label>
                <MultiSelect
                  options={employeeOptions}
                  selected={selectedEmployeeIds}
                  onChange={setSelectedEmployeeIds}
                  placeholder="Choose employees"
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={!canSubmit()}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


