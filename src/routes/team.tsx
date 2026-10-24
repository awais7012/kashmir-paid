import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShimmer } from "@/components/site/page-shimmer";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { mediaUrl } from "@/lib/media";
import { siteSettingsQueryOptions } from "@/lib/site-settings";
import { looksUrdu, storyTextAttrs, URDU_TEXT_CLASS } from "@/lib/story-language";
import { primeQuery, storiesQueryOptions } from "@/lib/stories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/team")({
  loader: async ({ context }) => {
    await primeQuery(context.queryClient, siteSettingsQueryOptions);
    await primeQuery(context.queryClient, storiesQueryOptions);
  },
  head: () => ({
    meta: [
      { title: "Team · Global Kashmir TV" },
      {
        name: "description",
        content:
          "The leadership and organisational structure of Global Kashmir TV — bridging the valley and the world.",
      },
    ],
  }),
  component: TeamPage,
});

const INTRO =
  "Global Kashmir TV operates through an international leadership team, regional management offices, professional editorial departments and a network of bureau chiefs and correspondents across Pakistan, Azad Jammu & Kashmir, the United Kingdom and Saudi Arabia.";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? (parts.at(-1)?.charAt(0) ?? "") : "";
  return `${first}${last}`.toUpperCase() || "?";
}

/** A role line may carry its own detail after an em dash. */
function splitRole(role: string): { title: string; note: string } {
  const separator = role.indexOf(" — ");
  if (separator === -1) return { title: role, note: "" };
  return { title: role.slice(0, separator), note: role.slice(separator + 3) };
}

function TeamPage() {
  const { data: settings } = useQuery(siteSettingsQueryOptions);
  if (!settings) return <PageShimmer />;

  const { members, structure } = settings.team;
  const empty = members.length === 0 && structure.length === 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader settings={settings} />

      <main>
        <section className="mx-auto max-w-[1100px] px-4 py-12 sm:px-8 lg:py-16">
          <div className="border-b-2 border-foreground pb-6">
            <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">
              Who we are
            </p>
            <h1 className="mt-1 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.9] font-black">
              Team
            </h1>
            <p className="mt-3 font-display text-xl text-primary italic sm:text-2xl">
              Bridging the Valley and the World
            </p>
            <p className="mt-5 max-w-[70ch] text-base leading-relaxed text-muted-foreground">
              {INTRO}
            </p>
          </div>
        </section>

        {empty ? (
          <section className="mx-auto max-w-[1100px] px-4 pb-16 sm:px-8">
            <div className="grid justify-items-start gap-3 border-2 border-foreground bg-card px-5 py-12">
              <h2 className="font-display text-3xl">The team is being put together</h2>
              <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                Team profiles have not been published yet. Please check back shortly.
              </p>
            </div>
          </section>
        ) : null}

        {members.length > 0 ? (
          <section className="mx-auto max-w-[1100px] px-4 pb-16 sm:px-8">
            <div className="border-b-2 border-foreground pb-3">
              <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">
                Leadership
              </p>
              <h2 className="mt-1 font-display text-3xl leading-none sm:text-4xl">
                Our leadership
              </h2>
            </div>

            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((member, index) => {
                const photo = mediaUrl(member.photo);
                const nameUrdu = looksUrdu(member.name);
                const roleUrdu = looksUrdu(member.role);
                return (
                  <article
                    key={member.id || `${member.name}-${index}`}
                    className="grid content-start gap-4"
                  >
                    {photo ? (
                      <img
                        src={photo}
                        alt={member.name}
                        loading="lazy"
                        className="aspect-[4/5] w-full border-2 border-foreground object-cover object-top"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="grid aspect-[4/5] w-full place-items-center border-2 border-foreground bg-card font-display text-6xl text-primary"
                      >
                        {initials(member.name)}
                      </div>
                    )}

                    <div>
                      <h3
                        {...storyTextAttrs(nameUrdu ? "ur" : "en")}
                        className={cn(
                          "font-display text-2xl leading-tight font-bold break-words",
                          nameUrdu && URDU_TEXT_CLASS,
                        )}
                      >
                        {member.name}
                      </h3>
                      {member.role ? (
                        <p
                          {...storyTextAttrs(roleUrdu ? "ur" : "en")}
                          className={cn(
                            "mt-1 text-[10px] font-black tracking-[0.14em] text-primary uppercase break-words",
                            roleUrdu && URDU_TEXT_CLASS,
                          )}
                        >
                          {member.role}
                        </p>
                      ) : null}
                      {member.bio ? (
                        <p
                          {...storyTextAttrs(looksUrdu(member.bio) ? "ur" : "en")}
                          className={cn(
                            "mt-3 text-sm leading-relaxed text-muted-foreground",
                            looksUrdu(member.bio) && URDU_TEXT_CLASS,
                          )}
                        >
                          {member.bio}
                        </p>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {structure.length > 0 ? (
          <section className="border-y-2 border-foreground bg-card">
            <div className="mx-auto max-w-[1100px] px-4 py-14 sm:px-8 lg:py-16">
              <div className="border-b-2 border-foreground pb-3">
                <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">
                  How we are organised
                </p>
                <h2 className="mt-1 font-display text-3xl leading-none sm:text-4xl">
                  Organisational structure
                </h2>
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                {structure.map((section, index) => (
                  <article
                    key={section.id || `${section.title}-${index}`}
                    className="grid content-start gap-4 border-2 border-foreground bg-background p-6"
                  >
                    <div>
                      <p className="text-[10px] font-black tracking-[0.16em] text-primary uppercase">
                        Part {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3 className="mt-1 font-display text-2xl leading-tight font-bold">
                        {section.title}
                      </h3>
                      {section.description ? (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {section.description}
                        </p>
                      ) : null}
                    </div>

                    {section.roles.length > 0 ? (
                      <ul className="grid gap-3 border-t border-border pt-4">
                        {section.roles.map((role) => {
                          const { title, note } = splitRole(role);
                          return (
                            <li key={role} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                              <span
                                aria-hidden="true"
                                className="mt-2 size-2 shrink-0 bg-primary"
                              />
                              <span className="min-w-0">
                                <span className="block text-sm leading-snug font-bold break-words">
                                  {title}
                                </span>
                                {note ? (
                                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                                    {note}
                                  </span>
                                ) : null}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter settings={settings} />
    </div>
  );
}
