import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { AdminShell, StudioSplash } from "@/components/admin/admin-shell";
import { adminButton, CheckboxField, FormAlert, TextField } from "@/components/admin/controls";
import { SlidesEditor } from "@/components/admin/slides-editor";
import { TeamEditor } from "@/components/admin/team-editor";
import {
  LeaveGuardDialog,
  RecoveredDraftNotice,
  useLeaveGuard,
} from "@/components/admin/studio-guards";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import {
  ApiError,
  clearSession,
  fetchAdminSettings,
  saveSettings,
  type FieldErrors,
  type SettingsPatch,
} from "@/lib/admin-api";
import type { HeroSlide, SiteSettings, TeamMember, TeamSection } from "@/lib/site-settings";
import { clearDraft, draftKey, readDraft, saveDraft } from "@/lib/studio-drafts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [{ title: "Website · Global Kashmir Studio" }, { name: "robots", content: "noindex" }],
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

type SettingsDraft = {
  slides: HeroSlide[];
  ticker: SiteSettings["ticker"];
  contact: SiteSettings["contact"];
  social: SiteSettings["social"];
  members: TeamMember[];
  structure: TeamSection[];
  footer: SiteSettings["footer"];
};

const SETTINGS_DRAFT_KEY = draftKey("settings");

function SettingsForm({ initial }: { initial: SiteSettings }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // A draft stashed after a 401 is restored on the next visit.
  const [recovered] = useState<SettingsDraft | null>(() =>
    readDraft<SettingsDraft>(SETTINGS_DRAFT_KEY),
  );
  const [recoveredNotice, setRecoveredNotice] = useState(Boolean(recovered));

  const [slides, setSlides] = useState<HeroSlide[]>(recovered?.slides ?? initial.hero.slides);
  const [ticker, setTicker] = useState(recovered?.ticker ?? initial.ticker);
  const [contact, setContact] = useState(recovered?.contact ?? initial.contact);
  const [social, setSocial] = useState(recovered?.social ?? initial.social);
  const [members, setMembers] = useState<TeamMember[]>(recovered?.members ?? initial.team.members);
  const [structure, setStructure] = useState<TeamSection[]>(
    recovered?.structure ?? initial.team.structure,
  );
  const [footer, setFooter] = useState(recovered?.footer ?? initial.footer);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [sessionExpired, setSessionExpired] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const baseline = {
    slides: initial.hero.slides,
    ticker: initial.ticker,
    contact: initial.contact,
    social: initial.social,
    members: initial.team.members,
    structure: initial.team.structure,
    footer: initial.footer,
  };

  const dirty =
    JSON.stringify({ slides, ticker, contact, social, members, structure, footer }) !==
    JSON.stringify(baseline);

  const leaveBypassRef = useRef(false);
  const guard = useLeaveGuard(() => dirty && !leaveBypassRef.current, dirty);

  useEffect(() => {
    if (sessionExpired) {
      leaveBypassRef.current = true;
      void navigate({ to: "/admin/login", replace: true });
    }
  }, [sessionExpired, navigate]);

  function discard() {
    clearDraft(SETTINGS_DRAFT_KEY);
    setRecoveredNotice(false);
    setSlides(baseline.slides);
    setTicker(baseline.ticker);
    setContact(baseline.contact);
    setSocial(baseline.social);
    setMembers(baseline.members);
    setStructure(baseline.structure);
    setFooter(baseline.footer);
    setError(null);
    setFieldErrors({});
  }

  async function save() {
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const patch: SettingsPatch = {
      hero: { slides },
      ticker,
      contact,
      social,
      team: { members, structure },
      footer,
    };

    try {
      const saved = await saveSettings(patch);
      clearDraft(SETTINGS_DRAFT_KEY);
      setRecoveredNotice(false);
      // The response is the trimmed, merged truth, so adopting it stops the
      // form from staying "dirty" over whitespace.
      setSlides(saved.hero.slides);
      setTicker(saved.ticker);
      setContact(saved.contact);
      setSocial(saved.social);
      setMembers(saved.team.members);
      setStructure(saved.team.structure);
      setFooter(saved.footer);
      toast.success("Website saved");
      queryClient.setQueryData(["admin", "settings"], saved);
      void queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        saveDraft(SETTINGS_DRAFT_KEY, {
          slides,
          ticker,
          contact,
          social,
          members,
          structure,
          footer,
        });
        clearSession();
        setSessionExpired(true);
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

  const fieldMeta = (id: string, label: string, hint?: string) => ({ id, label, hint });

  return (
    <div className="grid gap-12">
      <div className="border-b-2 border-foreground pb-4">
        <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">Studio</p>
        <h1 className="mt-1 font-display text-4xl leading-none">Website</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
          The homepage slider, the breaking ticker, the contact details and the team. The broadcast
          has its own screen under Go live.
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

      {recoveredNotice ? <RecoveredDraftNotice onDiscard={discard} /> : null}

      <section className="grid gap-6">
        <div className="border-b-2 border-foreground pb-3">
          <h2 className="font-display text-2xl">Homepage slider</h2>
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
            The big area at the top of the front page. Add as many pictures or videos as you like;
            they change automatically, and visitors can swipe or use the arrows.
          </p>
        </div>
        <SlidesEditor slides={slides} onChange={setSlides} />
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
        <div className="border-b-2 border-foreground pb-3">
          <h2 className="font-display text-2xl">Contact</h2>
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
            Shown on the Contact page. Leave a line blank and it is simply not shown.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <TextField
            meta={fieldMeta("contact-email", "Email")}
            type="email"
            value={contact.email}
            onChange={(value) => setContact({ ...contact, email: value })}
            placeholder="news@globalkashmirtv.com"
          />
          <TextField
            meta={fieldMeta("contact-phone", "Phone")}
            value={contact.phone}
            onChange={(value) => setContact({ ...contact, phone: value })}
            placeholder="+92 300 0000000"
          />
          <TextField
            meta={fieldMeta("contact-whatsapp", "WhatsApp")}
            value={contact.whatsapp}
            onChange={(value) => setContact({ ...contact, whatsapp: value })}
            placeholder="+92 300 0000000"
          />
          <TextField
            meta={fieldMeta("contact-address", "Address")}
            value={contact.address}
            onChange={(value) => setContact({ ...contact, address: value })}
            placeholder="Muzaffarabad, Azad Kashmir"
          />
        </div>

        <div className="grid gap-6 border-t border-border pt-6 lg:grid-cols-2">
          <TextField
            meta={fieldMeta("social-instagram", "Instagram link")}
            value={social.instagram}
            onChange={(value) => setSocial({ ...social, instagram: value })}
            placeholder="https://instagram.com/yourchannel"
          />
          <TextField
            meta={fieldMeta("social-twitter", "X (Twitter) link")}
            value={social.twitter}
            onChange={(value) => setSocial({ ...social, twitter: value })}
            placeholder="https://x.com/yourchannel"
          />
          <TextField
            meta={fieldMeta("social-facebook", "Facebook link")}
            value={social.facebook}
            onChange={(value) => setSocial({ ...social, facebook: value })}
            placeholder="https://facebook.com/yourchannel"
          />
          <TextField
            meta={fieldMeta("social-youtube", "YouTube link")}
            value={social.youtube}
            onChange={(value) => setSocial({ ...social, youtube: value })}
            placeholder="https://youtube.com/@yourchannel"
          />
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          The Instagram and X links appear as icons in the header. Any link left blank stays hidden.
        </p>
      </section>

      <section className="grid gap-6">
        <div className="border-b-2 border-foreground pb-3">
          <h2 className="font-display text-2xl">Team</h2>
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
            The people shown on the Team page. The order here is the order on the site.
          </p>
        </div>
        <TeamEditor
          members={members}
          onChange={setMembers}
          structure={structure}
          onStructureChange={setStructure}
        />
      </section>

      <section className="border-2 border-foreground bg-card">
        <button
          type="button"
          aria-expanded={showAdvanced}
          aria-controls="settings-advanced"
          onClick={() => setShowAdvanced((open) => !open)}
          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span>
            <span className="block text-[11px] font-black tracking-[0.12em] uppercase">
              More options
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
              Footer wording.
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn("size-5 shrink-0 transition-transform", showAdvanced && "rotate-180")}
          />
        </button>

        {showAdvanced ? (
          <div
            id="settings-advanced"
            className="grid gap-6 border-t-2 border-foreground p-4 sm:p-6"
          >
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
          </div>
        ) : null}
      </section>

      <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-t-2 border-foreground bg-background/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !dirty}
          className={adminButton({ variant: "primary" })}
        >
          {saving ? "Saving" : "Save website"}
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

      <LeaveGuardDialog open={guard.blocked} onStay={guard.stay} onLeave={guard.leave} />
    </div>
  );
}
