import type { Company } from "@pw/shared";
import { cn } from "@/lib/cn";

export interface CompanyGlyphProps {
  company: Pick<Company, "name" | "glyph" | "color">;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE = { sm: "size-7 text-[11px] rounded-lg", md: "size-10 text-[14px] rounded-xl", lg: "size-14 text-[20px] rounded-2xl" };

/** Monogram tile in the company's colour. Fictional companies only. */
export function CompanyGlyph({ company, size = "md", className }: CompanyGlyphProps) {
  return (
    <span
      role="img"
      aria-label={company.name}
      className={cn("inline-flex shrink-0 items-center justify-center font-mono font-semibold text-white/95", SIZE[size], className)}
      style={{ backgroundColor: company.color }}
    >
      {company.glyph}
    </span>
  );
}
