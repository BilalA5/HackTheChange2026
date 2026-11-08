// Vision board fields as shown during onboarding. Pure, so the fill count is testable.
import type { VisionBoard } from "@pw/shared";

export interface BoardField {
  key: Exclude<keyof VisionBoard, "why" | "background" | "drawingDataUrl">;
  label: string;
  placeholder: string;
}

export const BOARD_FIELDS: readonly BoardField[] = [
  { key: "targetRole", label: "Target role", placeholder: "Any job title you want" },
  { key: "level", label: "Level", placeholder: "Junior, mid, senior" },
  { key: "industry", label: "Industry", placeholder: "Where you would work" },
  { key: "companyType", label: "Company type", placeholder: "Startup, scale-up, enterprise" },
  { key: "location", label: "Location", placeholder: "A city, or remote" },
  { key: "timeline", label: "Timeline", placeholder: "How soon" },
];

/** A board value as trimmed text. Numbers and other scalars are stringified; objects and nulls become "". */
export function boardText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

/** Every board field with its display text and whether it is filled. */
export function boardRows(board: Partial<VisionBoard>): (BoardField & { value: string; filled: boolean })[] {
  return BOARD_FIELDS.map((f) => {
    const value = boardText(board[f.key]);
    return { ...f, value, filled: value.length > 0 };
  });
}

export function boardFilledCount(board: Partial<VisionBoard>): number {
  return boardRows(board).filter((r) => r.filled).length;
}
