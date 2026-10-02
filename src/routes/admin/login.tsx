import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { adminButton, FormAlert, TextField } from "@/components/admin/controls";
import { ApiError, getToken, saveSession, signIn } from "@/lib/admin-api";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [{ title: "Studio sign in · Global Kashmir TV" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getToken()) {
      void navigate({ to: "/admin", replace: true });
    }
  }, [navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const session = await signIn(email.trim().toLowerCase(), password);
      saveSession(session.token, session.admin);
      toast.success("Signed in");
      await navigate({ to: "/admin", replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not sign in. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-background text-foreground lg:grid-cols-2">
      <section
        aria-hidden="true"
        className="hidden flex-col justify-between bg-foreground p-10 text-background lg:flex xl:p-14"
      >
        <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">Studio</p>
        <div>
          <p className="font-display text-[clamp(3rem,5vw,5rem)] leading-[0.86] font-black uppercase">
            Global
            <br />
            Kashmir
            <br />
            <span className="text-primary">Studio</span>
          </p>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-background/70">
            Publish and schedule the stories that run on Global Kashmir TV.
          </p>
        </div>
        <p className="text-[10px] tracking-[0.16em] text-background/50 uppercase">Editors only</p>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase lg:hidden">
            Global Kashmir Studio
          </p>
          <h1 className="mt-2 font-display text-4xl leading-none">Sign in</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Use your studio account to manage stories.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-5">
            {error ? <FormAlert>{error}</FormAlert> : null}

            <TextField
              meta={{ id: "email", label: "Email" }}
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              autoFocus
              placeholder="you@gktv.local"
            />

            <TextField
              meta={{ id: "password", label: "Password" }}
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />

            <button
              type="submit"
              disabled={submitting}
              className={adminButton({ variant: "primary" })}
            >
              {submitting ? "Signing in" : "Sign in"}
            </button>

            <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
              {submitting ? "Checking your credentials." : ""}
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
