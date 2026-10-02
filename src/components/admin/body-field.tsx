import { useState } from "react";
import { Markdown } from "@/lib/markdown";
import { URDU_TEXT_CLASS } from "@/lib/story-language";
import { cn } from "@/lib/utils";

const SYNTAX_HINT =
  "Blank line for a new paragraph, ## for a heading, > for a pull quote, - for a list, **bold**, *italic*, [link](https://…).";

/**
 * Article body editor. The preview uses the same renderer as the public story
 * page, so what an editor sees here is what readers get.
 */
export function BodyField({
  value,
  onChange,
  error,
  urdu = false,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  /** Urdu bodies are typed and previewed right to left. */
  urdu?: boolean | undefined;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="text-[10px] font-black tracking-[0.16em] text-muted-foreground uppercase">
          Article body
        </span>
        <div className="flex gap-1" role="tablist" aria-label="Body editor mode">
          {(["write", "preview"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={tab === option}
              onClick={() => setTab(option)}
              className={cn(
                "px-2.5 py-1 text-[10px] font-black tracking-[0.12em] uppercase transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                tab === option ? "bg-foreground text-background" : "hover:text-primary",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {tab === "write" ? (
        <textarea
          id="body"
          name="body"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={18}
          dir={urdu ? "rtl" : undefined}
          placeholder={
            urdu
              ? "کشمیر میں کہانی سنانے والوں کی کمی کبھی نہیں رہی۔\n\n## ایک نیا نیوز روم\n\nفرق صرف یہ ہے کہ کیمرہ اب کس کے ہاتھ میں ہے۔"
              : "Kashmir has never lacked storytellers.\n\n## A new newsroom\n\nWhat changed is who holds the camera."
          }
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "body-error" : "body-hint"}
          className={cn(
            "w-full border-2 border-foreground bg-card px-3 py-2.5 text-base leading-relaxed text-foreground transition-colors md:text-sm",
            "placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            error && "border-destructive",
          )}
        />
      ) : (
        <div
          dir={urdu ? "rtl" : undefined}
          lang={urdu ? "ur" : undefined}
          className="min-h-[18rem] border-2 border-border bg-card px-4 py-4"
        >
          {value.trim() ? (
            <div className={cn("max-w-[70ch]", urdu && URDU_TEXT_CLASS)}>
              <Markdown source={value} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nothing to preview yet. Write in the Write tab, then switch here to see it as readers
              will.
            </p>
          )}
        </div>
      )}

      {error ? (
        <p id="body-error" role="alert" className="text-xs font-bold text-destructive">
          {error}
        </p>
      ) : (
        <p id="body-hint" className="text-xs leading-relaxed text-muted-foreground">
          {SYNTAX_HINT}
        </p>
      )}
    </div>
  );
}
