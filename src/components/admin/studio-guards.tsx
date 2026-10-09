import { useCallback, useRef } from "react";
import { useBlocker } from "@tanstack/react-router";
import { adminButton } from "@/components/admin/controls";
import { cn } from "@/lib/utils";

/**
 * Blocks studio navigation (tab clicks, browser back) and the browser's own
 * unload prompt while a form has unsaved changes. Callers pass a function so a
 * successful save can release the block without waiting for a re-render.
 */
export function useLeaveGuard(shouldBlock: () => boolean, promptOnUnload: boolean) {
  const shouldBlockRef = useRef(shouldBlock);
  shouldBlockRef.current = shouldBlock;
  const blockFn = useCallback(() => shouldBlockRef.current(), []);

  const blocker = useBlocker({
    shouldBlockFn: blockFn,
    withResolver: true,
    enableBeforeUnload: promptOnUnload,
  });

  return {
    blocked: blocker.status === "blocked",
    stay: () => blocker.reset?.(),
    leave: () => blocker.proceed?.(),
  };
}

export function LeaveGuardDialog({
  open,
  onStay,
  onLeave,
}: {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-guard-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") onStay();
        }}
        className="w-full max-w-md border-2 border-foreground bg-card p-5"
      >
        <h2 id="leave-guard-title" className="font-display text-2xl leading-tight">
          Leave with unsaved changes?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your edits have not been saved yet. Leaving this page discards them.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            autoFocus
            onClick={onStay}
            className={adminButton({ variant: "outline" })}
          >
            Keep editing
          </button>
          <button type="button" onClick={onLeave} className={adminButton({ variant: "danger" })}>
            Leave without saving
          </button>
        </div>
      </div>
    </div>
  );
}

export function RecoveredDraftNotice({ onDiscard }: { onDiscard: () => void }) {
  return (
    <div className="border-2 border-foreground bg-muted/40 px-4 py-3">
      <p className="text-sm font-bold">Unsaved changes were recovered from your last session.</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Review them and save when ready, or discard the recovered copy.
      </p>
      <button
        type="button"
        onClick={onDiscard}
        className={cn(adminButton({ variant: "outline", size: "sm" }), "mt-3")}
      >
        Discard recovered changes
      </button>
    </div>
  );
}
