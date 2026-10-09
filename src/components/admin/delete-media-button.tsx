import { useState } from "react";
import { Link } from "@tanstack/react-router";
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
import { ApiError, deleteMedia, type MediaItem } from "@/lib/admin-api";

export function DeleteMediaButton({
  item,
  onDeleted,
  size = "sm",
}: {
  item: MediaItem;
  onDeleted: (item: MediaItem) => void;
  size?: "md" | "sm" | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setPending(true);
    setError(null);
    try {
      await deleteMedia(item.id);
      setOpen(false);
      onDeleted(item);
      toast.success("File deleted");
    } catch (caught) {
      const message = caught instanceof ApiError ? caught.message : "Could not delete this file.";
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
            Delete “{item.original_name}”?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
            This removes the file from disk permanently. If a story or the site settings still use
            it, the delete is refused so you can detach it first.
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
            Keep file
          </AlertDialogCancel>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={pending}
            className={adminButton({ variant: "danger" })}
          >
            {pending ? "Deleting" : "Delete file"}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
