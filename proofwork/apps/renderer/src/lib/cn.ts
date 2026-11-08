import { clsx, type ClassValue } from "clsx";

/** Joins class names. Conditional classes go through clsx; no tailwind-merge, so avoid conflicting utilities. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
