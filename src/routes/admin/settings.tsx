import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminShell, StudioSplash } from "@/components/admin/admin-shell";
import {
  adminButton,
  adminInput,
  CheckboxField,
  FormAlert,
  TextField,
} from "@/components/admin/controls";
import { MediaField } from "@/components/admin/media-field";
import { VideoField } from "@/components/admin/video-field";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import {
  ApiError,
  fetchAdminSettings,
  saveSettings,
  type FieldErrors,
  type SettingsPatch,
} from "@/lib/admin-api";
import { SUGGESTED_CATEGORIES, type NavSection, type SiteSettings } from "@/lib/site-settings";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [{ title: "Settings · Global Kashmir Studio" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminSettingsRoute,
});

function AdminSettingsRoute() {
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
          Loading settings
        </p>
      ) : null}

      {query.isError ? (
        <div className="grid gap-4">
          <FormAlert>
            {query.error instanceof ApiError ? query.error.message : "Could not load settings."}
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

      {query.data ? <SettingsForm initial={query.data} /> : null}
    </AdminShell>
  );
}

function NavEditor({
  sections,
  onChange,
}: {
  sections: NavSection[];
  onChange: (next: NavSection[]) => void;
}) {
  function updateAt(index: number, patch: Partial<NavSection>) {
    onChange(sections.map((section, i) => (i === index ? { ...section, ...patch } : section)));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    const next = [...sections];
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    onChange(next);
  }

  return (
    <div className="grid gap-4">
      <ul className="grid gap-3">
        {sections.map((section, index) => (
          <li
            key={`nav-row-${index}`}
            className="grid gap-3 border-2 border-border bg-card p-3 lg:grid-cols-[minmax(0,1fr)_10rem_10rem_auto] lg:items-end"
          >
            <div className="grid gap-1">
              <label
                htmlFor={`nav-label-${index}`}
                className="text-[10px] font-black tracking-[0.16em] text-muted-foreground uppercase"
              >
                Label
              </label>
              <input
                id={`nav-label-${index}`}
                value={section.label}
                onChange={(event) => updateAt(index, { label: event.target.value })}
                className={adminInput}
              />
            </div>

            <div className="grid gap-1">
              <label
                htmlFor={`nav-kind-${index}`}
                className="text-[10px] font-black tracking-[0.16em] text-muted-foreground uppercase"
              >
                Links to
              </label>
              <select
                id={`nav-kind-${index}`}
                value={section.kind}
                onChange={(event) =>
                  updateAt(index, { kind: event.target.value as NavSection["kind"] })
                }
                className={cn(adminInput, "appearance-none")}
              >
                <option value="home">Homepage</option>
                <option value="index">All stories</option>
                <option value="live">Live page</option>
                <option value="category">A category</option>
              </select>
            </div>

            {section.kind === "category" ? (
              <div className="grid gap-1">
                <label
                  htmlFor={`nav-category-${index}`}
                  className="text-[10px] font-black tracking-[0.16em] text-muted-foreground uppercase"
                >
                  Category
                </label>
                <input
                  id={`nav-category-${index}`}
                  value={section.category}
                  list="nav-category-options"
                  onChange={(event) => updateAt(index, { category: event.target.value })}
                  className={adminInput}
                />
              </div>
            ) : (
              <div className="hidden lg:block" />
            )}

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 border-2 border-foreground bg-card px-3">
                <input
                  type="checkbox"
                  checked={section.visible}
                  onChange={(event) => updateAt(index, { visible: event.target.checked })}
                  className="size-5 accent-[var(--primary)]"
                />
                <span className="text-[10px] font-black tracking-[0.12em] uppercase">Shown</span>
              </label>
              <button
                type="button"
                aria-label={`Move ${section.label} up`}
                onClick={() => move(index, -1)}
                className={cn(adminButton({ variant: "ghost", size: "sm" }), "px-2.5")}
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                type="button"
                aria-label={`Move ${section.label} down`}
                onClick={() => move(index, 1)}
                className={cn(adminButton({ variant: "ghost", size: "sm" }), "px-2.5")}
              >
                <ArrowDown className="size-4" />
              </button>
              <button
                type="button"
                aria-label={`Remove ${section.label}`}
                onClick={() => onChange(sections.filter((_, i) => i !== index))}
                className={cn(adminButton({ variant: "danger", size: "sm" }), "px-2.5")}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <datalist id="nav-category-options">
        {SUGGESTED_CATEGORIES.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>

      <div>
        <button
          type="button"
          onClick={() =>
            onChange([
              ...sections,
              { label: "New section", kind: "category", category: "", visible: true },
            ])
          }
          className={adminButton({ variant: "outline", size: "sm" })}
        >
          Add section
        </button>
      </div>
    </div>
  );
}

function SettingsForm({ initial }: { initial: SiteSettings }) {
  const queryClient = useQueryClient();

  const [hero, setHero] = useState(initial.hero);
  const [ticker, setTicker] = useState(initial.ticker);
  const [sections, setSections] = useState<NavSection[]>(initial.nav.sections);
  const [footer, setFooter] = useState(initial.footer);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const dirty =
    JSON.stringify({ hero, ticker, sections, footer }) !==
    JSON.stringify({
      hero: initial.hero,
      ticker: initial.ticker,
      sections: initial.nav.sections,
      footer: initial.footer,
    });

  function discard() {
    setHero(initial.hero);
    setTicker(initial.ticker);
    setSections(initial.nav.sections);
    setFooter(initial.footer);
    setError(null);
    setFieldErrors({});
  }

  async function save() {
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const patch: SettingsPatch = {
      hero,
      ticker,
      nav: { sections },
      footer,
    };

    try {
      await saveSettings(patch);
      toast.success("Settings saved");
      // Public pages read the same settings, so they need refetching.
      void queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    } catch (caught) {
      const message =
        caught instanceof ApiError ? caught.message : "Could not save. Check the fields and retry.";
      setError(message);
      setFieldErrors(caught instanceof ApiError ? caught.fieldErrors : {});
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  const fieldMeta = (id: string, label: string, hint?: string) => ({ id, label, hint });

  return (
    <div className="grid gap-12">
      <div className="border-b-2 border-foreground pb-4">
        <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">Studio</p>
        <h1 className="mt-1 font-display text-4xl leading-none">Settings</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
          These control the public site: the homepage headline block, the breaking ticker, the
          navigation and the footer. The broadcast has its own screen under Live.
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
        <h2 className="border-b-2 border-foreground pb-2 font-display text-2xl">Hero</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <TextField
            meta={fieldMeta("hero-eyebrow", "Eyebrow")}
            value={hero.eyebrow}
            onChange={(value) => setHero({ ...hero, eyebrow: value })}
          />
          <TextField
            meta={fieldMeta("hero-headline", "Headline")}
            value={hero.headline}
            onChange={(value) => setHero({ ...hero, headline: value })}
          />
          <TextField
            meta={fieldMeta("hero-accent", "Headline accent", "The highlighted second line.")}
            value={hero.accent}
            onChange={(value) => setHero({ ...hero, accent: value })}
          />
          <TextField
            meta={fieldMeta("hero-primary", "Primary button")}
            value={hero.primaryCta}
            onChange={(value) => setHero({ ...hero, primaryCta: value })}
          />
          <TextField
            meta={fieldMeta("hero-secondary", "Secondary button")}
            value={hero.secondaryCta}
            onChange={(value) => setHero({ ...hero, secondaryCta: value })}
          />
        </div>

        <MediaField
          id="hero_image"
          kind="image"
          label="Hero image"
          value={hero.image}
          onChange={(value) => setHero({ ...hero, image: value })}
          emptyMessage="No hero image set. The featured story's own cover is used."
          hint="Upload or pick artwork for the homepage hero. This overrides the featured story's cover."
        />

        <div className="grid gap-3 border-2 border-border bg-muted/40 p-3">
          <p className="text-[10px] font-black tracking-[0.16em] uppercase">Hero video</p>
          <p className="max-w-prose text-xs leading-relaxed text-muted-foreground">
            Optional. An uploaded file plays behind the headline, muted and looping. A YouTube or
            Vimeo link shows a play button over the hero image instead, because a third-party embed
            cannot be relied on to autoplay.
          </p>
          <VideoField
            videoUrl={hero.videoUrl}
            onVideoUrlChange={(value) => setHero({ ...hero, videoUrl: value })}
            showCaption={false}
          />
        </div>
      </section>

      <section className="grid gap-6">
        <h2 className="border-b-2 border-foreground pb-2 font-display text-2xl">Breaking ticker</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <CheckboxField
            id="ticker-enabled"
            label="Show the ticker"
            hint="Scrolls the five newest headlines under the masthead."
            checked={ticker.enabled}
            onChange={(checked) => setTicker({ ...ticker, enabled: checked })}
          />
          <TextField
            meta={fieldMeta("ticker-label", "Ticker label")}
            value={ticker.label}
            onChange={(value) => setTicker({ ...ticker, label: value })}
          />
        </div>
      </section>

      <section className="grid gap-6">
        <h2 className="border-b-2 border-foreground pb-2 font-display text-2xl">Navigation</h2>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          The order here is the order on the site. Each entry links to a real page, so nothing in
          the menu is a dead link.
        </p>
        <NavEditor sections={sections} onChange={setSections} />
      </section>

      <section className="grid gap-6">
        <h2 className="border-b-2 border-foreground pb-2 font-display text-2xl">Footer</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <TextField
            meta={fieldMeta("footer-note", "Footer note")}
            value={footer.note}
            onChange={(value) => setFooter({ ...footer, note: value })}
          />
          <TextField
            meta={fieldMeta("footer-copyright", "Copyright line")}
            value={footer.copyright}
            onChange={(value) => setFooter({ ...footer, copyright: value })}
          />
        </div>
      </section>

      <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-t-2 border-foreground bg-background/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !dirty}
          className={adminButton({ variant: "primary" })}
        >
          {saving ? "Saving" : "Save settings"}
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
          {saving ? "Saving settings." : dirty ? "Unsaved changes." : "Everything is saved."}
        </p>
      </div>
    </div>
  );
}
