import React from "react";
import { FormField } from "./FormField";

interface FinancialSectionProps {
  formData: {
    price: number;
    extraExpenses: number;
    discount: number;
    finalAmount: number;
    advance: number;
    due: number;
  };
  onInputChange: (field: string, value: string | number) => void;
}

export function FinancialSection({
  formData,
  onInputChange,
}: FinancialSectionProps) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <h2 className="text-lg font-semibold mb-3 text-gray-800">Financial Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          label="Price"
          type="number"
          value={formData.price}
          onChange={(value) => onInputChange("price", value)}
          placeholder="Enter price"
          min={0}
          required
        />

        <FormField
          label="Extra Expenses"
          type="number"
          value={formData.extraExpenses}
          onChange={(value) => onInputChange("extraExpenses", value)}
          placeholder="Enter extra expenses"
          min={0}
          required
        />

        <FormField
          label="Discount"
          type="number"
          value={formData.discount}
          onChange={(value) => onInputChange("discount", value)}
          placeholder="Enter discount"
          min={0}
          required
        />

        <FormField
          label="Final Amount"
          type="number"
          value={formData.finalAmount}
          onChange={() => {}} // Read-only
          readOnly
          className="bg-gray-50"
        />

        <FormField
          label="Advance"
          type="number"
          value={formData.advance}
          onChange={(value) => onInputChange("advance", value)}
          placeholder="Enter advance amount"
          min={0}
          required
        />

        <FormField
          label="Due"
          type="number"
          value={formData.due}
          onChange={() => {}} // Read-only
          readOnly
          className="bg-gray-50"
        />
      </div>
    </div>
  );
} 