import { cn } from "@/lib/utils";
import { looksUrdu, URDU_TEXT_CLASS } from "@/lib/story-language";

type ChipTone = "green" | "navy" | "light";

const TONES: Record<ChipTone, string> = {
  green: "bg-green text-green-foreground",
  navy: "bg-primary text-primary-foreground",
  light: "bg-card/90 text-foreground ring-1 ring-border",
};

/**
 * The small category mark that sits on a card. Green is the accent a reader
 * scans for, so it carries section labels; navy is used for the VIDEO mark, and
 * the light chip is for a caption laid on a photograph. Red is never used here
 * — it belongs to the live and breaking marks alone.
 */
export function CategoryChip({
  label,
  tone = "green",
  className,
}: {
  label: string;
  tone?: ChipTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-[10px] font-black tracking-[0.14em] uppercase",
        TONES[tone],
        looksUrdu(label) && URDU_TEXT_CLASS,
        className,
      )}
    >
      {label}
    </span>
  );
}
