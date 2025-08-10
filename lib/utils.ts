import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getEmployeeNames = (ids: string[], allEmployees: { uId: string; name: string }[]) => {
  return ids.map((id) => allEmployees.find((emp) => emp.uId === id)?.name || id).filter(Boolean);
};
