import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { adminButton } from "@/components/admin/controls";
import { ApiError, deleteStory, type AdminStory } from "@/lib/admin-api";

export function DeleteStoryButton({
  story,
  onDeleted,
  size = "md",
}: {
  story: AdminStory;
  onDeleted: (story: AdminStory) => void;
  size?: "md" | "sm" | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setPending(true);
    setError(null);
    try {
      await deleteStory(story.id);
      setOpen(false);
      onDeleted(story);
      toast.success("Story deleted");
    } catch (caught) {
      const message =
        caught instanceof ApiError ? caught.message : "Could not delete this story. Try again.";
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <AlertDialogTrigger asChild>
        <button type="button" className={adminButton({ variant: "danger", size })}>
          Delete
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-2 border-foreground bg-card p-5 sm:max-w-md sm:rounded-none">
        <AlertDialogHeader className="space-y-3 text-left">
          <AlertDialogTitle className="font-display text-2xl leading-tight">
            Delete “{story.title}”?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
            This removes the story and its URL permanently. It cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? (
          <p
            role="alert"
            className="border-2 border-destructive bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive"
          >
            {error}
          </p>
        ) : null}

        <AlertDialogFooter className="mt-2 flex-col gap-2 sm:flex-row sm:gap-3">
          <AlertDialogCancel disabled={pending} className={adminButton({ variant: "outline" })}>
            Keep story
          </AlertDialogCancel>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={pending}
            className={adminButton({ variant: "danger" })}
          >
            {pending ? "Deleting" : "Delete story"}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
