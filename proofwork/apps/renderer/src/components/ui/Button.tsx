import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Feedback";

export type ButtonVariant = "primary" | "light" | "glass" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover shadow-[0_8px_24px_-12px_var(--color-accent)]",
  light: "bg-white text-ink hover:bg-white/90 shadow-[0_10px_30px_-14px_rgb(0_0_0/0.6)]",
  glass: "bg-white/10 text-fg border border-line backdrop-blur-md hover:bg-white/15",
  ghost: "bg-transparent text-fg-muted hover:text-fg hover:bg-white/8",
  danger: "bg-danger text-white hover:brightness-110",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-[13px] gap-1.5",
  md: "h-10 px-5 text-sm gap-2",
  lg: "h-[52px] px-7 text-base gap-2.5",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, disables the button and sets aria-busy. */
  loading?: boolean;
  /** Icon rendered before the label. */
  icon?: ReactNode;
  /** Icon rendered after the label. */
  iconRight?: ReactNode;
}

/** Pill button. Use "light" for the big Continue action on dark screens. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, icon, iconRight, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex select-none items-center justify-center rounded-full font-medium whitespace-nowrap transition-[background,transform,filter] duration-200 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner size={size === "lg" ? 18 : 14} label="Working" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
});

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Required accessible name. */
  label: string;
  icon: ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md";
  active?: boolean;
}

/** Round icon-only button. The label is used as aria-label and as the tooltip text when wrapped in Tooltip. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, variant = "ghost", size = "md", active = false, className, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={active || undefined}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-colors duration-200 disabled:opacity-45",
        size === "sm" ? "size-8" : "size-10",
        VARIANT[variant],
        active && "bg-white/15 text-fg",
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
});
