import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { BodyField } from "@/components/admin/body-field";
import {
  adminButton,
  CheckboxField,
  FormAlert,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/admin/controls";
import { MediaField } from "@/components/admin/media-field";
import { VideoField } from "@/components/admin/video-field";
import {
  LeaveGuardDialog,
  RecoveredDraftNotice,
  useLeaveGuard,
} from "@/components/admin/studio-guards";
import {
  ApiError,
  clearSession,
  createStory,
  fetchStoryCategories,
  updateStory,
  type AdminStory,
  type FieldErrors,
  type StoryDraft,
} from "@/lib/admin-api";
import { STORY_IMAGE_KEYS, STORY_IMAGE_LABELS } from "@/lib/story-images";
import { SUGGESTED_CATEGORIES } from "@/lib/site-settings";
import { clearDraft, draftKey, readDraft, saveDraft } from "@/lib/studio-drafts";
import { readStudioPrefs, saveStudioPrefs } from "@/lib/studio-prefs";
import { STORY_LANGUAGE_OPTIONS, type StoryLanguage } from "@/lib/story-language";
import { cn } from "@/lib/utils";

const DEFAULT_AUTHOR = "GKTV Desk";
const DEFAULT_CATEGORY = "Kashmir";
/** Sentinel option that switches the section picker into free-text mode. */
const NEW_SECTION = "__new_section__";

/** Every control on the form, in the shape the form works with. */
type FormValues = {
  title: string;
  slug: string;
  category: string;
  summary: string;
  language: StoryLanguage;
  author: string;
  body: string;
  imageKey: string;
  heroImageUrl: string;
  videoUrl: string;
  videoTitle: string;
  featured: boolean;
  displayOrder: string;
  publishedAt: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 191);
}

// datetime-local needs "YYYY-MM-DDTHH:mm" in the viewer's own timezone.
function toLocalInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function readable(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    date,
  );
}

function valuesFromStory(story: AdminStory): FormValues {
  return {
    title: story.title,
    slug: story.slug,
    category: story.category,
    summary: story.summary,
    language: story.language,
    author: story.author,
    body: story.body ?? "",
    imageKey: story.image_key,
    heroImageUrl: story.hero_image_url ?? "",
    videoUrl: story.video?.url ?? "",
    videoTitle: story.video?.title ?? "",
    featured: story.featured,
    displayOrder: String(story.display_order),
    publishedAt: toLocalInput(story.published_at),
  };
}

function valuesFromDraft(draft: StoryDraft): FormValues {
  return {
    title: draft.title,
    slug: draft.slug,
    category: draft.category,
    summary: draft.summary,
    language: draft.language,
    author: draft.author,
    body: draft.body,
    imageKey: draft.image_key,
    heroImageUrl: draft.hero_image_url,
    videoUrl: draft.video_url,
    videoTitle: draft.video_title,
    featured: draft.featured,
    displayOrder: String(draft.display_order),
    publishedAt: draft.published_at ? toLocalInput(draft.published_at) : "",
  };
}

type PublishState = {
  label: string;
  message: string;
  swatch: string;
};

function publishState(value: string, isEdit: boolean): PublishState {
  if (!value) {
    return isEdit
      ? {
          label: "Keeps current date",
          message: "The story keeps the publish time it already has.",
          swatch: "border-2 border-foreground",
        }
      : {
          label: "Publishes on save",
          message: "No date set, so this story goes live the moment you save it.",
          swatch: "border-2 border-foreground",
        };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {
      label: "Unreadable date",
      message: "Pick a valid date and time, or clear the field.",
      swatch: "bg-destructive",
    };
  }

  if (date.getTime() > Date.now()) {
    return {
      label: "Scheduled",
      message: `Stays a draft on the site until ${readable(date)}.`,
      swatch: "bg-foreground",
    };
  }

  return {
    label: "Live",
    message: `Visible on the site since ${readable(date)}.`,
    swatch: "bg-primary",
  };
}

export function StoryForm({
  story,
  onSaved,
}: {
  story?: AdminStory;
  onSaved: (saved: AdminStory) => void;
}) {
  const isEdit = Boolean(story);
  const navigate = useNavigate();
  const storageKey = draftKey(story ? story.id : "new");

  // A draft stashed after a 401 is restored on the next visit, so a long
  // article is never typed twice.
  const [recovered] = useState<StoryDraft | null>(() => readDraft<StoryDraft>(storageKey));
  const [recoveredNotice, setRecoveredNotice] = useState(Boolean(recovered));
  const [prefs] = useState(() => readStudioPrefs());

  // A brand-new story starts nearby-ready: the section and byline are remembered
  // from the last story, and it publishes straight away unless a date is set.
  const defaults = useMemo<FormValues>(
    () => ({
      title: "",
      slug: "",
      category: prefs?.category || DEFAULT_CATEGORY,
      summary: "",
      language: "en",
      author: prefs?.author || DEFAULT_AUTHOR,
      body: "",
      imageKey: STORY_IMAGE_KEYS[0],
      heroImageUrl: "",
      videoUrl: "",
      videoTitle: "",
      featured: false,
      displayOrder: "0",
      publishedAt: "",
    }),
    [prefs],
  );

  const baseline = useMemo(() => (story ? valuesFromStory(story) : defaults), [story, defaults]);

  const [values, setValues] = useState<FormValues>(() =>
    recovered ? valuesFromDraft(recovered) : story ? valuesFromStory(story) : defaults,
  );
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(story && (story.featured || story.has_video || story.display_order !== 0)),
  );
  const [customSection, setCustomSection] = useState(false);

  // Sections already in use come from the API, so the dropdown lists the real
  // names on the site as well as the built-in suggestions.
  const categories = useQuery({
    queryKey: ["admin", "story-categories"],
    queryFn: fetchStoryCategories,
    staleTime: 5 * 60_000,
  });

  const sectionOptions = useMemo(() => {
    const names: string[] = [];
    const seen = new Set<string>();
    const add = (name: string) => {
      const trimmed = name.trim();
      if (!trimmed || seen.has(trimmed)) return;
      seen.add(trimmed);
      names.push(trimmed);
    };

    add(values.category); // keep the current value selectable even if unknown
    for (const name of categories.data ?? []) add(name);
    for (const name of SUGGESTED_CATEGORIES) add(name);

    return [
      ...names.map((name) => ({ value: name, label: name })),
      { value: NEW_SECTION, label: "＋ Add a new section…" },
    ];
  }, [categories.data, values.category]);

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const dirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(baseline),
    [values, baseline],
  );

  // A ref lets success and sign-out paths release the leave guard immediately,
  // before React has re-rendered with the new state.
  const leaveBypassRef = useRef(false);
  const guard = useLeaveGuard(() => dirty && !leaveBypassRef.current, dirty);

  useEffect(() => {
    if (sessionExpired) {
      leaveBypassRef.current = true;
      void navigate({ to: "/admin/login", replace: true });
    }
  }, [sessionExpired, navigate]);

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const status = publishState(values.publishedAt, isEdit);
  const urdu = values.language === "ur";

  const field = (id: string, label: string, hint?: string) => ({
    id,
    label,
    hint,
    error: fieldErrors[id]?.[0],
  });

  function update(patch: Partial<FormValues>) {
    setValues((current) => ({ ...current, ...patch }));
  }

  function handleTitleChange(next: string) {
    setValues((current) => ({
      ...current,
      title: next,
      slug: slugTouched ? current.slug : slugify(next),
    }));
  }

  function discardRecovered() {
    clearDraft(storageKey);
    setValues(baseline);
    setRecoveredNotice(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    const draft: StoryDraft = {
      title: values.title.trim(),
      slug: values.slug.trim() || slugify(values.title),
      category: values.category.trim(),
      summary: values.summary.trim(),
      language: values.language,
      author: values.author.trim(),
      image_key: values.imageKey,
      featured: values.featured,
      display_order: Number.parseInt(values.displayOrder, 10) || 0,
      body: values.body,
      hero_image_url: values.heroImageUrl.trim(),
      video_url: values.videoUrl.trim(),
      video_title: values.videoTitle.trim(),
    };

    // Only send the publish time when the editor changed it. The form keeps
    // minute precision, so resending an untouched value would shave the
    // seconds off an old story's publish time on every save.
    if (values.publishedAt && values.publishedAt !== baseline.publishedAt) {
      const parsed = new Date(values.publishedAt);
      if (!Number.isNaN(parsed.getTime())) draft.published_at = parsed.toISOString();
    }

    try {
      const saved = story ? await updateStory(story.id, draft) : await createStory(draft);
      clearDraft(storageKey);
      setRecoveredNotice(false);
      // Remember the byline and section so the next story is quicker to write.
      saveStudioPrefs({ author: draft.author, category: draft.category });
      toast.success(isEdit ? "Story saved" : "Story published");
      leaveBypassRef.current = true;
      onSaved(saved);
    } catch (caught) {
      // The session can expire mid-edit. Stash the draft and hand the editor
      // the sign-in screen instead of an error they cannot act on.
      if (caught instanceof ApiError && caught.status === 401) {
        saveDraft(storageKey, draft);
        clearSession();
        setSessionExpired(true);
        return;
      }

      if (caught instanceof ApiError) {
        setFieldErrors(caught.fieldErrors);
        setFormError(caught.message);
        toast.error(caught.message);
      } else {
        setFormError("Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-8">
      {formError ? (
        <FormAlert>
          {formError}
          {hasFieldErrors ? (
            <span className="mt-1 block text-xs font-normal">
              Some fields need attention — open More options if the problem is not visible here.
            </span>
          ) : null}
        </FormAlert>
      ) : null}

      {recoveredNotice ? <RecoveredDraftNotice onDiscard={discardRecovered} /> : null}

      <section className="grid gap-6">
        <div className="border-b-2 border-foreground pb-3">
          <h2 className="font-display text-2xl">Write the story</h2>
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
            A headline, a standfirst and the story itself are all you need. The rest is filled in
            for you.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SelectField
            meta={field("language", "Language", "Urdu stories read right to left.")}
            value={values.language}
            onChange={(next) => update({ language: next as StoryLanguage })}
            options={STORY_LANGUAGE_OPTIONS}
          />

          {customSection ? (
            <div className="grid gap-2">
              <TextField
                meta={field(
                  "category-new",
                  "New section name",
                  "A new section is created on the site with this name.",
                )}
                value={values.category}
                onChange={(next) => update({ category: next })}
                placeholder={DEFAULT_CATEGORY}
              />
              <button
                type="button"
                onClick={() => setCustomSection(false)}
                className="justify-self-start text-[10px] font-black tracking-[0.12em] text-primary uppercase underline underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Choose from the list instead
              </button>
            </div>
          ) : (
            <SelectField
              meta={field(
                "category",
                "Section",
                "Where the story appears on the site. Pick a name, or add a new one.",
              )}
              value={values.category}
              onChange={(next) => {
                if (next === NEW_SECTION) {
                  setCustomSection(true);
                  return;
                }
                update({ category: next });
              }}
              options={sectionOptions}
            />
          )}
        </div>

        <TextField
          meta={field("title", "Headline", urdu ? "Write the headline in Urdu." : undefined)}
          value={values.title}
          onChange={handleTitleChange}
          dir={urdu ? "rtl" : undefined}
          placeholder={urdu ? "وادی دنیا سے مخاطب ہے" : "The valley speaks to the world"}
          autoFocus
        />

        <TextAreaField
          meta={field(
            "summary",
            "Standfirst",
            "One or two sentences. Readers see this under the headline.",
          )}
          value={values.summary}
          onChange={(next) => update({ summary: next })}
          rows={3}
          dir={urdu ? "rtl" : undefined}
          placeholder={
            urdu
              ? "صحافیوں کی نئی نسل کشمیر کو دنیا کے سامنے پیش کر رہی ہے۔"
              : "A new generation of reporters is reshaping how Kashmir is seen."
          }
        />

        <BodyField
          value={values.body}
          onChange={(next) => update({ body: next })}
          error={fieldErrors["body"]?.[0]}
          urdu={urdu}
        />

        <MediaField
          id="hero_image_url"
          kind="image"
          label="Cover picture (optional)"
          value={values.heroImageUrl}
          onChange={(next) => update({ heroImageUrl: next })}
          emptyMessage="Optional. Skip this and a matching photo from the site is used instead."
          hint="Optional. Drag a picture in, or upload one."
        />
      </section>

      <section className="border-2 border-foreground bg-card">
        <button
          type="button"
          aria-expanded={showAdvanced}
          aria-controls="story-advanced"
          onClick={() => setShowAdvanced((open) => !open)}
          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span>
            <span className="block text-[11px] font-black tracking-[0.12em] uppercase">
              More options
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
              {showAdvanced
                ? "Hide the optional settings."
                : "Optional: address, byline, homepage feature, publish time and video."}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn("size-5 shrink-0 transition-transform", showAdvanced && "rotate-180")}
          />
        </button>

        {showAdvanced ? (
          <div id="story-advanced" className="grid gap-6 border-t-2 border-foreground p-4 sm:p-5">
            <div className="grid gap-6 lg:grid-cols-2">
              <TextField
                meta={field(
                  "slug",
                  "Web address",
                  urdu
                    ? "Story addresses stay in Latin letters, so type one yourself. Example: valley-speaks-to-world"
                    : "Filled in from the headline. Change it only if you need a different address.",
                )}
                value={values.slug}
                onChange={(next) => {
                  setSlugTouched(true);
                  update({ slug: next });
                }}
                placeholder="valley-speaks-to-world"
              />

              <TextField
                meta={field("author", "Byline", "Whose name appears under the headline.")}
                value={values.author}
                onChange={(next) => update({ author: next })}
                placeholder="Aamir Sofi"
              />

              {!values.heroImageUrl ? (
                <SelectField
                  meta={field(
                    "image_key",
                    "Fallback photograph",
                    "Used when no cover picture is uploaded.",
                  )}
                  value={values.imageKey}
                  onChange={(next) => update({ imageKey: next })}
                  options={STORY_IMAGE_KEYS.map((key) => ({
                    value: key,
                    label: STORY_IMAGE_LABELS[key],
                  }))}
                />
              ) : null}

              <TextField
                meta={field(
                  "display_order",
                  "Position in section",
                  "Lower numbers appear first. Leave at 0 unless you want to pin it.",
                )}
                value={values.displayOrder}
                onChange={(next) => update({ displayOrder: next })}
                type="number"
                inputMode="numeric"
              />
            </div>

            <CheckboxField
              id="featured"
              label="Feature on the homepage"
              hint="Makes this the big story at the top of the homepage. Only one story holds it, so this replaces whichever story has it now."
              checked={values.featured}
              onChange={(checked) => update({ featured: checked })}
            />

            <div className="grid gap-3">
              <TextField
                meta={field("published_at", "Publish time")}
                type="datetime-local"
                value={values.publishedAt}
                onChange={(next) => update({ publishedAt: next })}
                aside={
                  <button
                    type="button"
                    onClick={() => update({ publishedAt: toLocalInput(new Date().toISOString()) })}
                    className="text-[10px] font-black tracking-[0.12em] text-primary uppercase underline underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Set to now
                  </button>
                }
              />
              <div className="grid gap-2 border-2 border-border bg-muted/40 px-3 py-3">
                <p className="flex items-center gap-2 text-[10px] font-black tracking-[0.16em] uppercase">
                  <span aria-hidden="true" className={cn("size-2.5 shrink-0", status.swatch)} />
                  {status.label}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">{status.message}</p>
              </div>
            </div>

            <div className="grid gap-4 border-t border-border pt-5">
              <h3 className="font-display text-xl">Video</h3>
              <p className="max-w-prose text-xs leading-relaxed text-muted-foreground">
                Optional. Attach one video: a YouTube or Vimeo link, or an uploaded file.
              </p>
              <VideoField
                videoUrl={values.videoUrl}
                onVideoUrlChange={(next) => update({ videoUrl: next })}
                videoTitle={values.videoTitle}
                onVideoTitleChange={(next) => update({ videoTitle: next })}
                error={fieldErrors["video_url"]?.[0]}
              />
            </div>
          </div>
        ) : null}
      </section>

      <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-t-2 border-foreground bg-background/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <button type="submit" disabled={submitting} className={adminButton({ variant: "primary" })}>
          {submitting ? "Saving" : isEdit ? "Save changes" : "Publish story"}
        </button>
        <Link to="/admin/stories" className={adminButton({ variant: "outline" })}>
          Cancel
        </Link>
        <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
          {submitting ? "Saving this story." : dirty ? "Unsaved changes." : "Nothing to save yet."}
        </p>
      </div>

      <LeaveGuardDialog open={guard.blocked} onStay={guard.stay} onLeave={guard.leave} />
    </form>
  );
}
