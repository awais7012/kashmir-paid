import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShimmer } from "@/components/site/page-shimmer";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { BRAND_LOGO, CEO_PORTRAIT } from "@/lib/brand";
import { primeQuery } from "@/lib/stories";
import { siteSettingsQueryOptions } from "@/lib/site-settings";

export const Route = createFileRoute("/about")({
  loader: async ({ context }) => {
    await primeQuery(context.queryClient, siteSettingsQueryOptions);
  },
  head: () => ({
    meta: [
      { title: "About · Global Kashmir TV" },
      {
        name: "description",
        content:
          "Global Kashmir TV: our vision, mission, core values, editorial promise and a message from the chief executive.",
      },
      { property: "og:title", content: "About Global Kashmir TV" },
      {
        property: "og:description",
        content: "Our vision, mission and core values, and a message from the CEO.",
      },
    ],
  }),
  component: AboutPage,
});

const INTRO = [
  "Every headline can shape an opinion. Every broadcast can influence a life. That makes public trust our greatest responsibility.",
  "People deserve accurate information, thoughtful analysis and journalism that helps them understand the decisions affecting their lives. They deserve a platform that listens to their concerns, examines the evidence and asks the questions that matter.",
  "Global Kashmir TV was established with this responsibility at its heart. We aim to make truth, research, human dignity and professional journalism the foundations of our identity.",
  "Our work goes beyond reporting what happened. We explore why it happened, who it affects and what possible solutions deserve attention.",
  "By connecting communities across Azad Kashmir, Pakistan, the United Kingdom and the worldwide Kashmiri and Pakistani diaspora, we seek to create a shared space for reliable information, respectful discussion and constructive action.",
];

const MISSION: { title: string; detail: string }[] = [
  {
    title: "Deliver accurate, timely and verified news.",
    detail:
      "Put reliable information at the centre of our reporting and explain clearly when facts remain uncertain.",
  },
  {
    title: "Bring Kashmir’s stories to a global audience.",
    detail:
      "Present its issues, culture, history and everyday life with accuracy, context and balance.",
  },
  {
    title: "Support the next generation.",
    detail:
      "Encourage young people to pursue education, research, employment and responsible leadership.",
  },
  {
    title: "Strengthen civic awareness.",
    detail:
      "Promote understanding of the rule of law, public responsibilities and the role individuals can play in improving society.",
  },
  {
    title: "Make room for respectful disagreement.",
    detail:
      "Encourage journalism and discussion in which different views can be examined without sacrificing dignity or respect.",
  },
  {
    title: "Connect people with those who make decisions.",
    detail:
      "Create meaningful opportunities for communication between the public, institutions and decision-makers.",
  },
  {
    title: "Encourage hope and practical progress.",
    detail: "Give attention to ideas, initiatives and solutions that can improve people’s lives.",
  },
];

const VALUES: { name: string; detail: string }[] = [
  {
    name: "Truth",
    detail:
      "Every news story must be grounded in facts. We will take reasonable steps to verify information before publication or broadcast and make clear what has been confirmed and what remains unverified.",
  },
  {
    name: "Integrity",
    detail:
      "Our editorial decisions must serve the public interest. Personal, political, financial or group interests must not compromise our judgment.",
  },
  {
    name: "Impartiality",
    detail:
      "We will give relevant perspectives a fair opportunity to be heard and distinguish clearly between factual reporting and opinion. Our coverage will be guided by evidence and editorial judgment.",
  },
  {
    name: "Research",
    detail:
      "Credible sources and careful investigation will underpin our reports, analysis and documentaries. We will look beyond immediate claims to examine context, causes and consequences.",
  },
  {
    name: "Human Dignity",
    detail:
      "Every person deserves to be treated with respect. We will avoid language and content that unjustifiably humiliates, degrades or targets individuals or communities.",
  },
  {
    name: "Responsibility",
    detail:
      "Freedom of expression carries responsibility. We will consider the social impact of what we publish while fulfilling our duty to report matters of public interest.",
  },
  {
    name: "Local and Global Understanding",
    detail:
      "We will examine local issues within their wider international context and explain how global events affect the communities we serve.",
  },
];

const PRIORITIES = [
  "Public interest and accountability",
  "Education",
  "Health",
  "The economy",
  "Youth development",
  "Women’s participation",
  "The environment",
  "Tourism",
  "Culture and heritage",
  "Science and technology",
  "Human rights",
  "Social harmony",
];

const PROMISE = [
  "Presenting news accurately, fairly and responsibly.",
  "Correcting mistakes promptly and transparently.",
  "Maintaining a clear distinction between news and commentary.",
  "Treating public trust as our most valuable asset.",
  "Upholding professional standards across every programme.",
];

const CEO_PARAGRAPHS = [
  "Behind every story are people whose lives matter. Our responsibility is to ensure their voices are heard and their stories are told with honesty, dignity and care.",
  "I founded Global Kashmir TV with a clear purpose: to connect our communities through credible journalism and give Kashmir’s stories the attention they deserve.",
  "Across Azad Kashmir, Pakistan, the United Kingdom and our worldwide diaspora, people share a deep connection to their homeland and a genuine concern for its future. Through Global Kashmir TV, we aim to strengthen that connection by reporting accurately, asking meaningful questions and creating space for respectful discussion.",
  "Our responsibility extends beyond covering events. We must examine their causes, explain their consequences and explore practical solutions. Education, health, employment, culture and the aspirations of young people deserve sustained attention because these issues shape the future of every family.",
  "We will uphold editorial integrity, distinguish facts from opinion and correct our mistakes openly. We will listen to different perspectives and approach difficult subjects with fairness. Public trust must be earned through the choices we make every day.",
  "I also want Global Kashmir TV to be a platform where young talent finds encouragement, women’s voices receive meaningful representation and people working quietly for their communities gain the recognition they deserve.",
  "To our viewers, contributors and colleagues: your trust, feedback and participation will help us improve. Hold us to our commitments. Share your concerns and bring forward the stories that deserve to be heard.",
  "Together, we can build a media platform that informs with honesty, connects with purpose and contributes to a more thoughtful and hopeful society.",
];

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-black tracking-[0.18em] text-primary uppercase">{children}</p>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mt-2 font-display text-4xl leading-none sm:text-5xl">{children}</h2>;
}

function AboutPage() {
  const { data: settings } = useQuery(siteSettingsQueryOptions);
  if (!settings) return <PageShimmer />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader settings={settings} />

      <main>
        <section className="mx-auto max-w-[1100px] px-4 py-12 sm:px-8 lg:py-16">
          <div className="grid gap-8 border-b-2 border-foreground pb-10 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
            <img
              src={BRAND_LOGO}
              alt="Global Kashmir TV"
              width={1254}
              height={1254}
              className="size-28 rounded-full bg-white object-cover sm:size-36"
            />
            <div>
              <Eyebrow>About us</Eyebrow>
              <h1 className="mt-2 font-display text-[clamp(2.75rem,7vw,5rem)] leading-[0.88] font-black">
                Global Kashmir TV
              </h1>
              <p className="mt-4 font-display text-2xl text-muted-foreground italic">
                Bringing Kashmir’s news to the world.
              </p>
            </div>
          </div>

          <div className="mt-10 grid max-w-[70ch] gap-5 text-base leading-relaxed text-muted-foreground">
            {INTRO.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="border-y-2 border-foreground bg-card">
          <div className="mx-auto max-w-[1100px] px-4 py-14 sm:px-8 lg:py-20">
            <Eyebrow>Our vision</Eyebrow>
            <blockquote className="mt-4 max-w-[46ch] font-display text-3xl leading-tight sm:text-4xl">
              “To help build an informed, thoughtful and ethical society through truth, research,
              justice and positive change, reporting on Kashmir, Pakistan and the wider world with
              responsibility, integrity and balance.”
            </blockquote>
            <p className="mt-6 max-w-[70ch] text-base leading-relaxed text-muted-foreground">
              This vision guides every aspect of our work. It calls on us to create space for
              knowledge, meaningful dialogue and mutual respect, while giving audiences the
              information they need to form their own judgments.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1100px] px-4 py-14 sm:px-8 lg:py-20">
          <Eyebrow>Our mission</Eyebrow>
          <SectionTitle>What we set out to do</SectionTitle>
          <ol className="mt-10 grid gap-px bg-border">
            {MISSION.map((item, index) => (
              <li
                key={item.title}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-5 bg-background py-6 sm:gap-8"
              >
                <span className="font-display text-3xl leading-none text-primary italic sm:text-4xl">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-2xl leading-tight font-bold sm:text-3xl">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {item.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-y-2 border-foreground bg-foreground text-background">
          <div className="mx-auto max-w-[1100px] px-4 py-14 text-center sm:px-8 lg:py-20">
            <p className="text-[11px] font-black tracking-[0.18em] text-primary uppercase">
              Our guiding purpose
            </p>
            <blockquote className="mx-auto mt-5 max-w-[50ch] font-display text-3xl leading-tight sm:text-5xl">
              “News that serves society. Research that seeks the truth. Journalism that serves
              humanity.”
            </blockquote>
          </div>
        </section>

        <section className="mx-auto max-w-[1100px] px-4 py-14 sm:px-8 lg:py-20">
          <Eyebrow>Our core values</Eyebrow>
          <SectionTitle>What we hold to</SectionTitle>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {VALUES.map((value, index) => (
              <article key={value.name} className="border-2 border-foreground bg-card p-6">
                <p className="text-[10px] font-black tracking-[0.16em] text-primary uppercase">
                  Value {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-display text-2xl leading-tight font-bold">{value.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{value.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y-2 border-foreground bg-card">
          <div className="mx-auto grid max-w-[1100px] gap-10 px-4 py-14 sm:px-8 lg:grid-cols-2 lg:py-20">
            <div>
              <Eyebrow>Our editorial philosophy</Eyebrow>
              <SectionTitle>Journalism earns its value</SectionTitle>
              <div className="mt-6 grid gap-4 text-base leading-relaxed text-muted-foreground">
                <p>
                  Journalism earns its value through the understanding it gives people. Global
                  Kashmir TV believes that audiences should be able to examine facts, question
                  claims and consider different perspectives without being drawn into hostility or
                  division.
                </p>
                <p>
                  We will avoid sensationalism, rumours and hate-driven narratives. Our journalism
                  will give priority to evidence, reasoned discussion and respectful debate.
                </p>
                <p>
                  We will ask difficult questions where the public interest requires them, seek fair
                  responses and help audiences understand the issues beyond the headline.
                </p>
              </div>
            </div>

            <div>
              <Eyebrow>Our priorities</Eyebrow>
              <SectionTitle>What we cover</SectionTitle>
              <p className="mt-6 max-w-[60ch] text-base leading-relaxed text-muted-foreground">
                Our coverage will focus on the issues that shape everyday life and long-term
                opportunity.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {PRIORITIES.map((priority) => (
                  <li
                    key={priority}
                    className="border-2 border-foreground px-3 py-1.5 text-[11px] font-black tracking-[0.08em] uppercase"
                  >
                    {priority}
                  </li>
                ))}
              </ul>
              <p className="mt-6 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
                These priorities will guide us towards stories that matter to people, including
                those whose experiences receive too little attention.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1100px] px-4 py-14 sm:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="border-2 border-foreground bg-card p-6 sm:p-8">
              <Eyebrow>Our promise to our audience</Eyebrow>
              <h2 className="mt-2 font-display text-3xl leading-tight">
                Your trust must be earned through our work, every day.
              </h2>
              <p className="mt-6 text-[10px] font-black tracking-[0.16em] text-muted-foreground uppercase">
                We commit to
              </p>
              <ul className="mt-4 grid gap-3">
                {PROMISE.map((item) => (
                  <li
                    key={item}
                    className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 text-sm leading-relaxed"
                  >
                    <span aria-hidden="true" className="mt-2 size-2.5 shrink-0 bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Eyebrow>Our identity</Eyebrow>
              <SectionTitle>Where we are going</SectionTitle>
              <div className="mt-6 grid gap-4 text-base leading-relaxed text-muted-foreground">
                <p>
                  Global Kashmir TV aims to be a trusted meeting place for news, knowledge,
                  research, dialogue and hope.
                </p>
                <p>
                  We want our audiences to understand what is happening, why it matters and how it
                  may affect their lives and communities. We want them to leave each programme
                  better informed and better equipped to ask questions, make decisions and
                  participate in society.
                </p>
                <p>
                  Technology can extend our reach. Professional standards, sound judgment and
                  consistent conduct will determine whether we deserve that reach.
                </p>
                <p>
                  Our ambition is to become a credible, respected and dependable media institution,
                  measured by the quality of our journalism and the trust of the people we serve.
                </p>
              </div>
              <p className="mt-6 font-display text-2xl">Bringing Kashmir’s news to the world.</p>
            </div>
          </div>
        </section>

        <section className="border-t-2 border-foreground bg-foreground text-background">
          <div className="mx-auto grid max-w-[1100px] gap-10 px-4 py-14 sm:px-8 lg:grid-cols-[20rem_minmax(0,1fr)] lg:py-20">
            <figure className="grid content-start gap-4">
              <img
                src={CEO_PORTRAIT}
                alt="Raja Ejaz Ahmed Khan, Chief Executive Officer of Global Kashmir TV"
                width={941}
                height={1672}
                className="aspect-[4/5] w-full border-2 border-background/30 object-cover object-top"
              />
              <figcaption className="text-[11px] font-black tracking-[0.16em] uppercase">
                Raja Ejaz Ahmed Khan
                <span className="mt-1 block font-bold text-primary">Chief Executive Officer</span>
              </figcaption>
            </figure>

            <div>
              <p className="text-[11px] font-black tracking-[0.18em] text-primary uppercase">
                Message from the CEO
              </p>
              <h2 className="mt-2 font-display text-4xl leading-none sm:text-5xl">
                A message from our chief executive
              </h2>
              <div className="mt-6 grid gap-4 text-base leading-relaxed text-background/80">
                {CEO_PARAGRAPHS.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <p className="mt-8 font-display text-2xl">Raja Ejaz Ahmed Khan</p>
              <p className="mt-1 text-[11px] font-black tracking-[0.16em] uppercase">
                Chief Executive Officer
                <span className="mt-1 block text-background/60">Global Kashmir TV</span>
              </p>
              <p className="mt-8 border-t border-background/20 pt-6 font-display text-xl text-primary italic">
                Bringing Kashmir’s news to the world.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter settings={settings} />
    </div>
  );
}
