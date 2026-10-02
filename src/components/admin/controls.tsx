import { cva } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Shared control styling for the studio. Square corners, 2px rules and a
// visible focus ring come from the site's own design tokens.
const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export const adminButton = cva(
  cn(
    "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 border-2 px-4 py-2.5 text-xs font-black uppercase tracking-[0.1em] transition-colors",
    focusRing,
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  ),
  {
    variants: {
      variant: {
        primary:
          "border-foreground bg-foreground text-background hover:border-primary hover:bg-primary hover:text-primary-foreground",
        outline:
          "border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background",
        danger:
          "border-destructive bg-transparent text-destructive hover:bg-destructive hover:text-destructive-foreground",
        ghost:
          "border-transparent bg-transparent text-foreground hover:bg-muted hover:text-foreground",
      },
      size: {
        md: "",
        sm: "min-h-9 px-3 py-1.5 text-[11px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export const adminInput = cn(
  // text-base keeps iOS Safari from zooming on focus; md:text-sm restores density.
  "min-h-11 w-full border-2 border-foreground bg-card px-3 py-2.5 text-base text-foreground transition-colors",
  "placeholder:text-muted-foreground",
  focusRing,
  "disabled:cursor-not-allowed disabled:opacity-60 md:text-sm",
);

type FieldMeta = {
  id: string;
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
};

function describedBy(meta: FieldMeta): string | undefined {
  if (meta.error) return `${meta.id}-error`;
  if (meta.hint) return `${meta.id}-hint`;
  return undefined;
}

function FieldFrame({
  meta,
  children,
  aside,
}: {
  meta: FieldMeta;
  children: ReactNode;
  aside?: ReactNode | undefined;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={meta.id}
          className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground"
        >
          {meta.label}
        </label>
        {aside}
      </div>
      {children}
      {meta.error ? (
        <p id={`${meta.id}-error`} role="alert" className="text-xs font-bold text-destructive">
          {meta.error}
        </p>
      ) : meta.hint ? (
        <p id={`${meta.id}-hint`} className="text-xs leading-relaxed text-muted-foreground">
          {meta.hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  meta,
  value,
  onChange,
  type = "text",
  placeholder,
  autoFocus,
  autoComplete,
  list,
  inputMode,
  maxLength,
  dir,
  aside,
}: {
  meta: FieldMeta;
  value: string;
  onChange: (value: string) => void;
  type?: string | undefined;
  placeholder?: string | undefined;
  autoFocus?: boolean | undefined;
  autoComplete?: string | undefined;
  list?: string | undefined;
  inputMode?: "text" | "numeric" | undefined;
  maxLength?: number | undefined;
  /** "rtl" for Urdu so the caret and text start on the right. */
  dir?: "ltr" | "rtl" | undefined;
  aside?: ReactNode | undefined;
}) {
  return (
    <FieldFrame meta={meta} aside={aside}>
      <input
        id={meta.id}
        name={meta.id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        list={list}
        inputMode={inputMode}
        maxLength={maxLength}
        dir={dir}
        aria-invalid={meta.error ? true : undefined}
        aria-describedby={describedBy(meta)}
        className={cn(adminInput, meta.error && "border-destructive")}
      />
    </FieldFrame>
  );
}

export function TextAreaField({
  meta,
  value,
  onChange,
  rows = 5,
  placeholder,
  dir,
}: {
  meta: FieldMeta;
  value: string;
  onChange: (value: string) => void;
  rows?: number | undefined;
  placeholder?: string | undefined;
  /** "rtl" for Urdu so the caret and text start on the right. */
  dir?: "ltr" | "rtl" | undefined;
}) {
  return (
    <FieldFrame meta={meta}>
      <textarea
        id={meta.id}
        name={meta.id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        dir={dir}
        aria-invalid={meta.error ? true : undefined}
        aria-describedby={describedBy(meta)}
        className={cn(adminInput, "resize-y leading-relaxed", meta.error && "border-destructive")}
      />
    </FieldFrame>
  );
}

export function SelectField({
  meta,
  value,
  onChange,
  options,
}: {
  meta: FieldMeta;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <FieldFrame meta={meta}>
      <select
        id={meta.id}
        name={meta.id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={meta.error ? true : undefined}
        aria-describedby={describedBy(meta)}
        className={cn(adminInput, "appearance-none", meta.error && "border-destructive")}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  );
}

export function CheckboxField({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string | undefined;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="grid gap-2">
      <label
        htmlFor={id}
        className="flex min-h-11 cursor-pointer items-center gap-3 border-2 border-foreground bg-card px-3 py-2.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
      >
        <input
          id={id}
          name={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="size-5 shrink-0 accent-[var(--primary)]"
        />
        <span className="text-sm font-bold">{label}</span>
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="border-2 border-destructive bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive"
    >
      {children}
    </div>
  );
}
