import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import { toast } from "sonner";
import { AdminShell, StudioSplash } from "@/components/admin/admin-shell";
import { adminButton, FormAlert, TextAreaField, TextField } from "@/components/admin/controls";
import {
  LeaveGuardDialog,
  RecoveredDraftNotice,
  useLeaveGuard,
} from "@/components/admin/studio-guards";
import { VideoPlayer } from "@/components/story/video-player";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import {
  ApiError,
  clearSession,
  fetchAdminSettings,
  saveSettings,
  type FieldErrors,
} from "@/lib/admin-api";
import { formatTime } from "@/lib/format";
import type { SiteSettings } from "@/lib/site-settings";
import { clearDraft, draftKey, readDraft, saveDraft } from "@/lib/studio-drafts";

export const Route = createFileRoute("/admin/live")({
  head: () => ({
    meta: [{ title: "Live · Global Kashmir Studio" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLiveRoute,
});

function AdminLiveRoute() {
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
          Loading broadcast state
        </p>
      ) : null}

      {query.isError ? (
        <div className="grid gap-4">
          <FormAlert>
            {query.error instanceof ApiError
              ? query.error.message
              : "Could not load the broadcast."}
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

      {query.data ? <LivePanel settings={query.data} /> : null}
    </AdminShell>
  );
}

type LiveStatus = {
  tone: "live" | "off" | "warn";
  label: string;
  message: string;
};

function liveStatus(settings: SiteSettings): LiveStatus {
  const { isLive, streamUrl, video, startedAt } = settings.live;
  const linkSaved = streamUrl.trim() !== "";

  if (isLive && !video) {
    return {
      tone: "warn",
      label: "Badge on, nothing playing",
      message:
        "The live badge is showing but the saved link cannot be played, so viewers still see the off-air notice. Fix the stream link below, then save.",
    };
  }

  if (isLive && video) {
    return {
      tone: "live",
      label: startedAt ? `Live since ${formatTime(startedAt)}` : "Live now",
      message: video.embeddable
        ? "Viewers see the player on the watch live page with a live badge, and the homepage says Live now."
        : "Viewers get a button that opens your channel, because this link cannot play inside the page. The homepage still says Live now.",
    };
  }

  return {
    tone: "off",
    label: "Off air",
    message: linkSaved
      ? "Viewers see the off-air notice. The saved stream is ready whenever you go live."
      : "Viewers see the off-air notice. Paste a stream link below to get ready.",
  };
}

const TONE_STYLES: Record<LiveStatus["tone"], string> = {
  live: "border-primary bg-primary/10 text-primary",
  off: "border-border bg-muted/40 text-muted-foreground",
  warn: "border-destructive bg-destructive/10 text-destructive",
};

type LiveDraft = {
  streamUrl: string;
  title: string;
  description: string;
};

const LIVE_DRAFT_KEY = draftKey("live");

function LivePanel({ settings }: { settings: SiteSettings }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // A draft stashed after a 401 is restored on the next visit.
  const [recovered] = useState<LiveDraft | null>(() => readDraft<LiveDraft>(LIVE_DRAFT_KEY));
  const [recoveredNotice, setRecoveredNotice] = useState(Boolean(recovered));

  const [streamUrl, setStreamUrl] = useState(recovered?.streamUrl ?? settings.live.streamUrl);
  const [title, setTitle] = useState(recovered?.title ?? settings.live.title);
  const [description, setDescription] = useState(
    recovered?.description ?? settings.live.description,
  );

  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [sessionExpired, setSessionExpired] = useState(false);

  const status = liveStatus(settings);
  const isLive = settings.live.isLive;
  const video = settings.live.video;

  const dirty =
    streamUrl !== settings.live.streamUrl ||
    title !== settings.live.title ||
    description !== settings.live.description;

  const leaveBypassRef = useRef(false);
  const guard = useLeaveGuard(() => dirty && !leaveBypassRef.current, dirty);

  useEffect(() => {
    if (sessionExpired) {
      leaveBypassRef.current = true;
      void navigate({ to: "/admin/login", replace: true });
    }
  }, [sessionExpired, navigate]);

  function cacheSaved(saved: SiteSettings) {
    queryClient.setQueryData(["admin", "settings"], saved);
    // The public site reads the same settings, so it has to refetch too.
    void queryClient.invalidateQueries({ queryKey: ["site-settings"] });
  }

  async function handleError(caught: unknown, fallback: string) {
    if (caught instanceof ApiError && caught.status === 401) {
      saveDraft(LIVE_DRAFT_KEY, { streamUrl, title, description });
      clearSession();
      setSessionExpired(true);
      return;
    }

    const message = caught instanceof ApiError ? caught.message : fallback;
    setError(message);
    setFieldErrors(caught instanceof ApiError ? caught.fieldErrors : {});
    toast.error(message);
  }

  function discardRecovered() {
    clearDraft(LIVE_DRAFT_KEY);
    setRecoveredNotice(false);
    setStreamUrl(settings.live.streamUrl);
    setTitle(settings.live.title);
    setDescription(settings.live.description);
  }

  async function saveDetails() {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const saved = await saveSettings({
        live: {
          streamUrl: streamUrl.trim(),
          title: title.trim(),
          description: description.trim(),
        },
      });
      clearDraft(LIVE_DRAFT_KEY);
      setRecoveredNotice(false);
      // Adopt the trimmed values so the form does not stay dirty over whitespace.
      setStreamUrl(saved.live.streamUrl);
      setTitle(saved.live.title);
      setDescription(saved.live.description);
      cacheSaved(saved);
      toast.success("Broadcast details saved");
    } catch (caught) {
      await handleError(caught, "Could not save. Check the fields and retry.");
    } finally {
      setSaving(false);
    }
  }

  async function setBroadcast(next: boolean) {
    setToggling(true);
    setError(null);
    try {
      const saved = await saveSettings({ live: { isLive: next } });
      cacheSaved(saved);
      toast.success(next ? "You are live" : "Broadcast ended");
    } catch (caught) {
      await handleError(caught, "Could not change the broadcast state.");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="grid gap-10">
      <div className="border-b-2 border-foreground pb-4">
        <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">Studio</p>
        <h1 className="mt-1 font-display text-4xl leading-none">Live</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
          This app does not broadcast. You go live on YouTube, then paste that link here and switch
          the badge on, so the site can show it.
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

      {recoveredNotice ? <RecoveredDraftNotice onDiscard={discardRecovered} /> : null}

      <section className="grid gap-4">
        <div className={`grid gap-2 border-2 px-4 py-4 ${TONE_STYLES[status.tone]}`}>
          <p className="flex items-center gap-2 text-[10px] font-black tracking-[0.16em] uppercase">
            <span
              aria-hidden="true"
              className={`size-2.5 shrink-0 ${
                status.tone === "live"
                  ? "signal-pulse bg-primary"
                  : status.tone === "warn"
                    ? "bg-destructive"
                    : "border-2 border-foreground"
              }`}
            />
            {status.label}
          </p>
          <p className="text-sm leading-relaxed">{status.message}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isLive ? (
            <button
              type="button"
              onClick={() => void setBroadcast(false)}
              disabled={toggling}
              className={adminButton({ variant: "danger" })}
            >
              {toggling ? "Ending" : "End broadcast"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void setBroadcast(true)}
              disabled={toggling || streamUrl.trim() === ""}
              className={adminButton({ variant: "primary" })}
            >
              <Radio className="size-4" />
              {toggling ? "Going live" : "Go live"}
            </button>
          )}
          {!isLive && streamUrl.trim() === "" ? (
            <p className="text-xs text-muted-foreground">
              Add a stream link first, otherwise the page would have nothing to play.
            </p>
          ) : null}
          {isLive && dirty ? (
            <p className="text-xs text-muted-foreground">
              You have unsaved details. Save them so viewers see the current copy.
            </p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-5">
        <h2 className="border-b-2 border-foreground pb-2 font-display text-2xl">Stream</h2>

        <TextField
          meta={{
            id: "stream_url",
            label: "Stream link",
            hint: "The link YouTube gives you for the broadcast. A channel that is always live can use youtube.com/@YourChannel/live, which links out.",
            error: fieldErrors["live"]?.[0],
          }}
          value={streamUrl}
          onChange={setStreamUrl}
          placeholder="https://www.youtube.com/watch?v=OxXKDGO-MYQ"
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <TextField
            meta={{ id: "live_title", label: "Broadcast title" }}
            value={title}
            onChange={setTitle}
          />
          <TextAreaField
            meta={{ id: "live_description", label: "Broadcast description" }}
            value={description}
            onChange={setDescription}
            rows={3}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void saveDetails()}
            disabled={saving || !dirty}
            className={adminButton({ variant: "primary" })}
          >
            {saving ? "Saving" : "Save broadcast details"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStreamUrl(settings.live.streamUrl);
              setTitle(settings.live.title);
              setDescription(settings.live.description);
              setError(null);
              setFieldErrors({});
            }}
            disabled={!dirty || saving}
            className={adminButton({ variant: "outline" })}
          >
            Discard changes
          </button>
          <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
            {saving
              ? "Saving broadcast details."
              : dirty
                ? "Unsaved changes."
                : "Everything is saved."}
          </p>
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="border-b-2 border-foreground pb-2 font-display text-2xl">
          What viewers see
        </h2>
        {video ? (
          <div className="max-w-2xl border-2 border-border">
            <VideoPlayer video={video} poster={video.thumbnail_url} />
          </div>
        ) : (
          <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
            The watch live page is showing its off-air notice, because no playable stream link is
            saved yet.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          This preview reflects the saved link, so save your changes to see a new one.
        </p>
      </section>

      <LeaveGuardDialog open={guard.blocked} onStay={guard.stay} onLeave={guard.leave} />
    </div>
  );
}
