import React from "react";

interface ShootRow {
  id: string;
  day: string;
  ritual: string;
  date: string;
  traditionalPhotographer: string;
  traditionalVideographer: string;
  candid: string;
  cinemetographer: string;
  assistant: string;
  drone: string;
  other: string;
}

interface ShootTableSectionProps {
  shootsData: ShootRow[];
  onChange: (index: number, field: keyof ShootRow, value: string) => void;
  onAddRow: () => void;
}

const dayOptions = ["day1", "day2", "day3", "day4", "day5"];

export const ShootTableSection: React.FC<ShootTableSectionProps> = ({ shootsData, onChange, onAddRow }) => {
  return (
    <div className="bg-white rounded-lg border p-4 mt-4">
      <h2 className="text-lg font-semibold mb-3 text-gray-800">Shoots</h2>
      <table className="min-w-full border text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Sl No.</th>
            <th className="border px-2 py-1">Days</th>
            <th className="border px-2 py-1">Ritual</th>
            <th className="border px-2 py-1">Date</th>
            <th className="border px-2 py-1">Traditional Photographer</th>
            <th className="border px-2 py-1">Traditional Videographer</th>
            <th className="border px-2 py-1">Candid</th>
            <th className="border px-2 py-1">Cinemetographer</th>
            <th className="border px-2 py-1">Assistant</th>
            <th className="border px-2 py-1">Drone</th>
            <th className="border px-2 py-1">Others</th>
          </tr>
        </thead>
        <tbody>
          {shootsData.map((row, idx) => (
            <tr key={row.id}>
              <td className="border px-2 py-1 text-center">{idx + 1}</td>
              <td className="border px-2 py-1">
                <select
                  value={row.day}
                  onChange={e => onChange(idx, "day", e.target.value)}
                  className="w-full border rounded px-1 py-0.5"
                >
                  {dayOptions.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </td>
              <td className="border px-2 py-1">
                <input
                  type="text"
                  value={row.ritual}
                  onChange={e => onChange(idx, "ritual", e.target.value)}
                  className="w-full border rounded px-1 py-0.5"
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  type="date"
                  value={row.date}
                  onChange={e => onChange(idx, "date", e.target.value)}
                  className="w-full border rounded px-1 py-0.5"
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  type="text"
                  value={row.traditionalPhotographer}
                  onChange={e => onChange(idx, "traditionalPhotographer", e.target.value)}
                  className="w-full border rounded px-1 py-0.5"
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  type="text"
                  value={row.traditionalVideographer}
                  onChange={e => onChange(idx, "traditionalVideographer", e.target.value)}
                  className="w-full border rounded px-1 py-0.5"
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  type="text"
                  value={row.candid}
                  onChange={e => onChange(idx, "candid", e.target.value)}
                  className="w-full border rounded px-1 py-0.5"
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  type="text"
                  value={row.cinemetographer}
                  onChange={e => onChange(idx, "cinemetographer", e.target.value)}
                  className="w-full border rounded px-1 py-0.5"
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  type="text"
                  value={row.assistant}
                  onChange={e => onChange(idx, "assistant", e.target.value)}
                  className="w-full border rounded px-1 py-0.5"
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  type="text"
                  value={row.drone}
                  onChange={e => onChange(idx, "drone", e.target.value)}
                  className="w-full border rounded px-1 py-0.5"
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  type="text"
                  value={row.other}
                  onChange={e => onChange(idx, "other", e.target.value)}
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