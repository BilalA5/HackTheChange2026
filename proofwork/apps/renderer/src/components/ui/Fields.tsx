import {
  forwardRef,
  useId,
  useLayoutEffect,
  useRef,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

const FIELD =
  "w-full rounded-2xl border border-fg-line bg-field px-4 text-[14px] text-fg placeholder:text-fg-muted/70 transition-colors duration-200 hover:bg-field-hover focus:bg-field-focus disabled:opacity-45 aria-[invalid=true]:border-danger";

interface FieldChromeProps {
  label?: string;
  hint?: string;
  error?: string;
  id: string;
  children: ReactNode;
}

/** Label, control and message wrapper shared by the field components. */
function FieldChrome({ label, hint, error, id, children }: FieldChromeProps) {
  // w-full + min-w-0: fills a column, and in a row (e.g. composer + send button) takes the remaining width.
  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="font-mono text-[11px] font-medium tracking-[0.08em] text-fg-muted uppercase">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-[12px] text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="text-[12px] text-fg-muted">{hint}</p>
      )}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, hint, error, className, id, ...rest }, ref) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldChrome label={label} hint={hint} error={error} id={fieldId}>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={cn(FIELD, "h-11", className)}
        {...rest}
      />
    </FieldChrome>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** Grow with content up to maxRows. Default true. */
  autoGrow?: boolean;
  maxRows?: number;
}

/** Textarea that grows with its content (up to maxRows lines). */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, autoGrow = true, maxRows = 10, className, id, value, onChange, rows = 2, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const innerRef = useRef<HTMLTextAreaElement | null>(null);

  const resize = () => {
    const el = innerRef.current;
    if (!el || !autoGrow) return;
    el.style.height = "auto";
    const lineH = parseFloat(getComputedStyle(el).lineHeight) || 20;
    const max = lineH * maxRows + 24;
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  };

  useLayoutEffect(resize, [value, autoGrow, maxRows]);

  return (
    <FieldChrome label={label} hint={hint} error={error} id={fieldId}>
      <textarea
        ref={(el) => {
          innerRef.current = el;
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
        }}
        id={fieldId}
        rows={rows}
        value={value}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
          onChange?.(e);
          resize();
        }}
        aria-invalid={error ? true : undefined}
        className={cn(FIELD, "resize-none py-3 leading-relaxed", className)}
        {...rest}
      />
    </FieldChrome>
  );
});

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  onValueChange?(value: string): void;
}

/** Native select (keeps keyboard and screen reader behaviour), styled to the field look. */
export function Select({ label, hint, error, options, onValueChange, className, id, ...rest }: SelectProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldChrome label={label} hint={hint} error={error} id={fieldId}>
      <select
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={cn(FIELD, "h-11 appearance-none", className)}
        onChange={(e) => onValueChange?.(e.target.value)}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled} className="bg-night text-fg">
            {o.label}
          </option>
        ))}
      </select>
    </FieldChrome>
  );
}

export interface SwitchProps {
  checked: boolean;
  onCheckedChange(checked: boolean): void;
  label: string;
  description?: string;
  disabled?: boolean;
}

/** On/off switch (role=switch). The label is required for screen readers. */
export function Switch({ checked, onCheckedChange, label, description, disabled }: SwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-[14px] text-fg">{label}</div>
        {description && <div className="text-[12px] text-fg-muted">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-45",
          checked ? "bg-accent" : "bg-fg-muted/30",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange(v: number): void;
  /** Shown after the value, e.g. "x" for rate. */
  unit?: string;
  disabled?: boolean;
}

export function Slider({ label, value, min, max, step = 1, onValueChange, unit, disabled }: SliderProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[14px] text-fg">
          {label}
        </label>
        <span className="font-mono text-[12px] text-fg-muted">
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onValueChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-fg-muted/25 accent-accent disabled:opacity-45"
      />
    </div>
  );
}

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange(checked: boolean): void;
  label: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onCheckedChange, label, disabled }: CheckboxProps) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3 text-[14px] text-fg">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="size-4 cursor-pointer accent-accent"
      />
      {label}
    </label>
  );
}
