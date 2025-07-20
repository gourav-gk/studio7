import React from "react";

interface DeliverableRow {
  id: string;
  name: string;
  qty: string;
}

interface DeliverablesTableSectionProps {
  deliverablesData: DeliverableRow[];
  onChange: (index: number, value: string) => void;
  onAddRow: () => void;
}

export const DeliverablesTableSection: React.FC<DeliverablesTableSectionProps> = ({ deliverablesData, onChange, onAddRow }) => {
  return (
    <div className="bg-white rounded-lg border p-4 mt-4">
      <h2 className="text-lg font-semibold mb-3 text-gray-800">Deliverables</h2>
      <table className="min-w-full border text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Sl No.</th>
            <th className="border px-2 py-1">Deliverable Name</th>
            <th className="border px-2 py-1">Qty Details</th>
          </tr>
        </thead>
        <tbody>
          {deliverablesData.map((row, idx) => (
            <tr key={row.id}>
              <td className="border px-2 py-1 text-center">{idx + 1}</td>
              <td className="border px-2 py-1">{row.name}</td>
              <td className="border px-2 py-1">
                <input
                  type="text"
                  value={row.qty}
                  onChange={e => onChange(idx, e.target.value)}
                  className="w-full border rounded px-1 py-0.5"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        className="mt-2 px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={onAddRow}
      >
        Add Row
      </button>
    </div>
  );
}; 