import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminShell, StudioSplash } from "@/components/admin/admin-shell";
import { adminButton, FormAlert, TextField } from "@/components/admin/controls";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { ApiError, changePassword } from "@/lib/admin-api";

export const Route = createFileRoute("/admin/account")({
  head: () => ({
    meta: [{ title: "Account · Global Kashmir Studio" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminAccountRoute,
});

function AdminAccountRoute() {
  const { status, admin, signOut } = useAdminAuth();

  if (status !== "signed_in") {
    return (
      <StudioSplash
        label={status === "checking" ? "Checking your session" : "Redirecting to sign in"}
      />
    );
  }

  return (
    <AdminShell admin={admin} onSignOut={signOut}>
      <div className="max-w-xl">
        <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">Studio</p>
        <h1 className="mt-1 font-display text-4xl leading-none">Account</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {admin ? `Signed in as ${admin.email}. ` : ""}
          Change the password you use to sign in to the studio.
        </p>

        <PasswordForm />
      </div>
    </AdminShell>
  );
}

const MIN_PASSWORD_LENGTH = 8;

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Your new password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The two new passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not update your password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-5">
      {error ? <FormAlert>{error}</FormAlert> : null}

      <TextField
        meta={{
          id: "current-password",
          label: "Current password",
          hint: "The password you signed in with.",
        }}
        type="password"
        value={currentPassword}
        onChange={setCurrentPassword}
        autoComplete="current-password"
        autoFocus
      />

      <TextField
        meta={{
          id: "new-password",
          label: "New password",
          hint: `At least ${MIN_PASSWORD_LENGTH} characters.`,
        }}
        type="password"
        value={newPassword}
        onChange={setNewPassword}
        autoComplete="new-password"
      />

      <TextField
        meta={{ id: "confirm-password", label: "Confirm new password" }}
        type="password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
      />

      <div>
        <button type="submit" disabled={submitting} className={adminButton({ variant: "primary" })}>
          {submitting ? "Updating" : "Update password"}
        </button>
      </div>
    </form>
  );
}
