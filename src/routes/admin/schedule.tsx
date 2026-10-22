import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { AdminShell, StudioSplash } from "@/components/admin/admin-shell";
import { adminButton, FormAlert, TextAreaField, TextField } from "@/components/admin/controls";
import { MediaField } from "@/components/admin/media-field";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import {
  ApiError,
  clearSession,
  fetchAdminSettings,
  saveSettings,
  type FieldErrors,
} from "@/lib/admin-api";
import type { SiteSettings } from "@/lib/site-settings";

export const Route = createFileRoute("/admin/schedule")({
  head: () => ({
    meta: [{ title: "Schedule · Global Kashmir Studio" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminScheduleRoute,
});

function AdminScheduleRoute() {
  const { status, admin, signOut } = useAdminAuth();
  const query = useQuery({ queryKey: ["admin", "settings"], queryFn: fetchAdminSettings });

  if (status !== "signed_in") {
    return (
      <StudioSplash
        label={status === "checking" ? "Checking your session" : "Redirecting to sign in"}
      />
    );
  }

  return (
    <AdminShell admin={admin} onSignOut={signOut}>
      {query.isPending ? (
        <p role="status" className="text-xs text-muted-foreground uppercase">
          Loading the schedule
        </p>
      ) : null}

      {query.isError ? (
        <div className="grid gap-4">
          <FormAlert>
            {query.error instanceof ApiError ? query.error.message : "Could not load the schedule."}
          </FormAlert>
          <div>
            <button
              type="button"
              onClick={() => void query.refetch()}
              className={adminButton({ variant: "outline" })}
            >
              Try again
            </button>
          </div>
        </div>
      ) : null}

      {query.data ? <SchedulePanel settings={query.data} /> : null}
    </AdminShell>
  );
}

function SchedulePanel({ settings }: { settings: SiteSettings }) {
  const queryClient = useQueryClient();

  const [image, setImage] = useState(settings.schedule.image);
  const [title, setTitle] = useState(settings.schedule.title);
  const [caption, setCaption] = useState(settings.schedule.caption);
  const [note, setNote] = useState(settings.schedule.note);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const dirty =
    image !== settings.schedule.image ||
    title !== settings.schedule.title ||
    caption !== settings.schedule.caption ||
    note !== settings.schedule.note;

  function discard() {
    setImage(settings.schedule.image);
    setTitle(settings.schedule.title);
    setCaption(settings.schedule.caption);
    setNote(settings.schedule.note);
    setError(null);
    setFieldErrors({});
  }

  async function save() {
    setSaving(true);
    setError(null);
    setFieldErrors({});

    try {
      const saved = await saveSettings({
        schedule: {
          image: image.trim(),
          title: title.trim(),
          caption: caption.trim(),
          note: note.trim(),
        },
      });
      setImage(saved.schedule.image);
      setTitle(saved.schedule.title);
      setCaption(saved.schedule.caption);
      setNote(saved.schedule.note);
      toast.success("Schedule saved");
      queryClient.setQueryData(["admin", "settings"], saved);
      void queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        clearSession();
        void window.location.assign("/admin/login");
        return;
      }
      const message =
        caught instanceof ApiError ? caught.message : "Could not save. Check the fields and retry.";
      setError(message);
      setFieldErrors(caught instanceof ApiError ? caught.fieldErrors : {});
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-10">
      <div className="border-b-2 border-foreground pb-4">
        <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">Studio</p>
        <h1 className="mt-1 font-display text-4xl leading-none">Programme schedule</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Upload a picture of the programme schedule and it appears on the Schedule page of the
          site. If you change the schedule, come back here and upload the new picture.
        </p>
      </div>

      {error ? (
        <FormAlert>
          {error}
          {Object.keys(fieldErrors).length > 0 ? (
            <ul className="mt-2 list-disc pl-5 text-xs font-normal">
              {Object.entries(fieldErrors).map(([name, messages]) => (
                <li key={name}>
                  {name}: {messages.join(" ")}
                </li>
              ))}
            </ul>
          ) : null}
        </FormAlert>
      ) : null}

      <section className="grid gap-6">
        <h2 className="border-b-2 border-foreground pb-2 font-display text-2xl">
          The schedule picture
        </h2>
        <MediaField
          id="schedule_image"
          kind="image"
          label="Schedule image"
          value={image}
          onChange={setImage}
          emptyMessage="No schedule uploaded yet. Drop a picture of the schedule here, or use Upload image."
          hint="A picture of the schedule (JPEG, PNG or WebP). Make sure the programme names are readable when it is opened full size."
        />
      </section>

      <section className="grid gap-6">
        <h2 className="border-b-2 border-foreground pb-2 font-display text-2xl">
          Heading shown above the picture
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <TextField
            meta={{
              id: "schedule_title",
              label: "Heading",
              hint: "The big title above the schedule. For example: Programme Schedule.",
              error: fieldErrors["schedule"]?.[0],
            }}
            value={title}
            onChange={setTitle}
          />
          <TextField
            meta={{
              id: "schedule_caption",
              label: "Date line",
              hint: "Optional. For example: W.E.F. 6 October 2026.",
            }}
            value={caption}
            onChange={setCaption}
          />
        </div>
        <TextAreaField
          meta={{
            id: "schedule_note",
            label: "Note under the picture",
            hint: "Optional. Anything viewers should know about the schedule.",
          }}
          value={note}
          onChange={setNote}
          rows={3}
        />
      </section>

      <section className="grid gap-3">
        <h2 className="border-b-2 border-foreground pb-2 font-display text-2xl">
          What viewers see
        </h2>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          The picture appears on the public Schedule page once you save.
        </p>
        <div>
          <a
            href="/schedule"
            target="_blank"
            rel="noreferrer"
            className={adminButton({ variant: "outline", size: "sm" })}
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Open the schedule page
          </a>
        </div>
      </section>

      <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-t-2 border-foreground bg-background/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !dirty}
          className={adminButton({ variant: "primary" })}
        >
          {saving ? "Saving" : "Save schedule"}
        </button>
        <button
          type="button"
          onClick={discard}
          disabled={!dirty || saving}
          className={adminButton({ variant: "outline" })}
        >
          Discard changes
        </button>
        <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
          {saving ? "Saving the schedule." : dirty ? "Unsaved changes." : "Everything is saved."}
        </p>
      </div>
    </div>
  );
}
