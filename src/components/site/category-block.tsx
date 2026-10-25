import { Reveal } from "@/components/site/reveal";
import { SectionHeader, ViewAllSectionLink } from "@/components/site/section-header";
import { StoryCard } from "@/components/story/story-card";
import { t } from "@/lib/i18n";
import { slugifyLabel } from "@/lib/site-settings";
import type { Story } from "@/lib/stories";
import { cn } from "@/lib/utils";

/** The accent each category block carries. Only the colour differs. */
export type BlockTone = keyof typeof TONE_BAR;

const TONE_BAR: Record<string, string> = {
  navy: "bg-band-navy",
  green: "bg-band-green",
  sky: "bg-band-sky",
};

/**
 * One category block, the same shape for every section: a lead card at about
 * 60% width with its title and standfirst below the picture, and a list of up
 * to four stories beside it. The two columns share one height and the list rows
 * are spread across it, so the block always reads as a full rectangle.
 *
 * `inverted` is for the block that sits on the green band: the tone bar is
 * dropped and the copy turns white.
 */
export function CategoryBlock({
  title,
  id,
  stories,
  tone = "navy",
  inverted = false,
  className,
}: {
  title: string;
  /** Anchor id, so the masthead can link straight to the block. */
  id: string;
  stories: Story[];
  tone?: BlockTone;
  /** True when the block sits on a full colour band. */
  inverted?: boolean;
  className?: string;
}) {
  const [lead, ...rest] = stories;
  if (!lead) return null;

  // The link is built from the category the desk actually typed, so the section
  // page filters on a name the API will match.
  const slug = slugifyLabel(lead.category);
  const list = rest.slice(0, 4);

  return (
    <section id={id} className={cn("scroll-mt-24", className)} aria-label={title}>
      {inverted ? null : (
        <span className={cn("block h-1 w-full rounded-full", TONE_BAR[tone])} aria-hidden="true" />
      )}

      <SectionHeader
        title={title}
        tone={inverted ? "dark" : "light"}
        action={
          <ViewAllSectionLink slug={slug} label={t.viewAll} tone={inverted ? "dark" : "light"} />
        }
        className={inverted ? undefined : "mt-4"}
      />

      <Reveal>
        {/* With nothing to list, the lead takes the whole width rather than
            leaving half the block empty. */}
        <div
          className={cn(
            "mt-6 grid gap-8",
            list.length > 0 && "lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]",
          )}
        >
          <StoryCard story={lead} variant="large" inverted={inverted} />

          {list.length > 0 ? (
            <ul className="flex flex-col justify-between gap-5">
              {list.map((story) => (
                <li key={story.id}>
                  <StoryCard story={story} variant="compact" inverted={inverted} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Reveal>
    </section>
  );
}
