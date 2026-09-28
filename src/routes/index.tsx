import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Menu, Play, Search, X } from "lucide-react";
import { storiesQueryOptions, type Story } from "@/lib/stories";
import leadImage from "@/assets/kashmir-lead.jpg";
import artisanImage from "@/assets/kashmir-artisan.jpg";
import lakeImage from "@/assets/dal-lake.jpg";
import sportImage from "@/assets/kashmir-sport.jpg";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(storiesQueryOptions),
  head: () => ({
    meta: [
      { title: "Global Kashmir TV — Kashmir, Connected to the World" },
      { name: "description", content: "Live news, stories, heritage, people, tourism and sport from Kashmir and across the world." },
      { property: "og:title", content: "Global Kashmir TV — Kashmir, Connected to the World" },
      { property: "og:description", content: "See Kashmir. Hear Kashmir. Understand Kashmir." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const imageMap: Record<string, string> = { lead: leadImage, artisan: artisanImage, lake: lakeImage, sport: sportImage };
const navItems = ["Home", "News", "Kashmir", "Pakistan", "World", "Live", "Shows", "Videos", "Tourism", "Sports", "Heritage", "Library"];

function timeAgo(date: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

function SectionHeader({ eyebrow, title, dark = false }: { eyebrow: string; title: string; dark?: boolean }) {
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b-2 pb-3 ${dark ? "border-primary-foreground/25" : "border-foreground"}`}>
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <h2 className="mt-1 font-display text-4xl leading-none sm:text-5xl">{title}</h2>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
    </div>
  );
}

function StoryCard({ story, large = false }: { story: Story; large?: boolean }) {
  return (
    <article className="group cursor-pointer">
      <div className={`overflow-hidden bg-muted ${large ? "aspect-[16/10]" : "aspect-[4/3]"}`}>
        <img loading="lazy" width={1024} height={768} src={imageMap[story.image_key] ?? leadImage} alt="" className="story-image h-full w-full object-cover grayscale-[18%] group-hover:scale-[1.025] group-hover:grayscale-0" />
      </div>
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-primary">{story.category} · {timeAgo(story.published_at)}</p>
      <h3 className={`mt-2 font-display font-bold leading-[1.02] decoration-primary decoration-2 underline-offset-4 group-hover:underline ${large ? "text-3xl sm:text-4xl" : "text-2xl"}`}>{story.title}</h3>
      {large && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{story.summary}</p>}
    </article>
  );
}

function Index() {
  const { data: stories } = useSuspenseQuery(storiesQueryOptions);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [liveOpen, setLiveOpen] = useState(false);
  const lead = stories.find((story) => story.featured) ?? stories[0];
  const latest = stories.filter((story) => story.id !== lead?.id).slice(0, 3);
  const top = stories.slice(1, 5);
  const culture = stories.filter((story) => ["Kashmir", "Heritage"].includes(story.category)).slice(0, 3);
  const world = stories.filter((story) => ["Pakistan", "World", "Global"].includes(story.category)).slice(0, 3);
  const show = stories.find((story) => story.category === "Shows");
  const tourism = stories.find((story) => story.category === "Tourism");
  const sports = stories.find((story) => story.category === "Sports");
  const matches = query.trim()
    ? stories.filter((story) => `${story.title} ${story.summary} ${story.category}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : [];

  if (!lead) return <main className="grid min-h-screen place-items-center">No stories published yet.</main>;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="relative z-40 bg-card">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b-4 border-foreground py-5 sm:py-7">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 font-display text-[clamp(2rem,6vw,5.25rem)] font-black uppercase leading-[.82]">
                <span className="truncate">Global Kashmir</span><span className="shrink-0 text-primary">TV</span>
              </div>
              <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground sm:text-[11px] sm:tracking-[0.34em]">Kashmir. Connected to the World.</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button aria-label="Search" onClick={() => setSearchOpen((open) => !open)} className="grid size-10 place-items-center border border-foreground transition-colors hover:bg-foreground hover:text-background"><Search className="size-4" /></button>
              <button aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((open) => !open)} className="grid size-10 place-items-center bg-foreground text-background lg:hidden">{menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
              <a href="#live" className="hidden items-center gap-2 bg-primary px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-primary-foreground sm:flex"><span className="signal-pulse size-2 rounded-full bg-primary-foreground" /> Watch live</a>
            </div>
          </div>
          {searchOpen && <div className="border-b-2 border-foreground py-4"><label className="sr-only" htmlFor="story-search">Search stories</label><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><input id="story-search" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Kashmir, world, culture…" className="min-w-0 border border-foreground bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"/><button onClick={() => setSearchOpen(false)} className="grid size-12 place-items-center bg-foreground text-background" aria-label="Close search"><X className="size-5"/></button></div>{query.trim() && <div className="grid gap-0 border-x border-b border-border bg-card">{matches.length ? matches.map((story) => <a key={story.id} href="#top-stories" onClick={() => setSearchOpen(false)} className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 border-t border-border p-3 hover:bg-muted"><span className="text-[10px] font-black uppercase text-primary">{story.category}</span><span className="min-w-0 truncate font-display text-lg font-bold">{story.title}</span></a>) : <p className="p-4 text-sm text-muted-foreground">No stories found.</p>}</div>}</div>}
          <nav className="hidden items-center justify-between border-b border-border py-3 lg:flex" aria-label="Main navigation">
            {navItems.map((item) => <a key={item} href={`#${item.toLowerCase()}`} className={`text-[11px] font-bold uppercase tracking-[0.1em] transition-colors hover:text-primary ${item === "Live" ? "text-primary" : ""}`}>{item}</a>)}
          </nav>
          {menuOpen && <nav className="grid grid-cols-2 border-b border-foreground py-4 lg:hidden" aria-label="Mobile navigation">{navItems.map((item) => <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)} className="border-b border-border py-3 text-sm font-bold uppercase">{item}</a>)}</nav>}
        </div>
      </header>

      <div className="flex overflow-hidden border-b-2 border-foreground bg-primary text-primary-foreground">
        <div className="z-10 flex shrink-0 items-center gap-2 bg-foreground px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-background"><span className="signal-pulse size-2 rounded-full bg-primary" />Breaking</div>
        <div className="ticker-track flex w-max min-w-max items-center whitespace-nowrap py-2.5 text-xs font-bold uppercase tracking-[0.08em]">
          {[...stories.slice(0, 5), ...stories.slice(0, 5)].map((story, index) => <span key={`${story.id}-${index}`} className="px-6">{story.title} <span className="ml-6 opacity-50">◆</span></span>)}
        </div>
      </div>

      <main>
        <section className="mx-auto grid max-w-[1440px] grid-cols-1 bg-card lg:grid-cols-12">
          <article className="group border-b border-border p-4 sm:p-8 lg:col-span-8 lg:border-r lg:p-10">
            <div className="relative min-h-[430px] overflow-hidden sm:min-h-[590px]">
              <img src={leadImage} width={1536} height={1024} fetchPriority="high" alt="Kashmir valley at dawn" className="story-image absolute inset-0 h-full w-full object-cover group-hover:scale-[1.02]" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/10 to-transparent" />
              <div className="editorial-rise absolute inset-x-0 bottom-0 p-5 text-background sm:p-9">
                <p className="mb-3 inline-flex bg-primary px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary-foreground">Breaking report</p>
                <h1 className="max-w-4xl font-display text-[clamp(3rem,7vw,6.5rem)] font-black leading-[.84]">Kashmir,<br/><em className="font-normal text-primary">connected.</em></h1>
                <p className="mt-5 max-w-2xl text-sm leading-relaxed text-background/80 sm:text-lg">{lead.summary}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href="#live" className="inline-flex items-center gap-2 bg-primary px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-primary-foreground"><Play className="size-4 fill-current" /> Watch live</a>
                  <a href="#top-stories" className="inline-flex items-center gap-2 border border-background px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-background">Explore GKTV <ArrowRight className="size-4" /></a>
                </div>
              </div>
            </div>
          </article>

          <aside className="flex flex-col lg:col-span-4">
            <div className="p-6 sm:p-8">
              <p className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground"><span className="h-px w-5 bg-border" />The latest</p>
              <div className="space-y-8">{latest.map((story, index) => <article key={story.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-4"><span className="font-display text-4xl italic leading-none text-border">0{index + 1}</span><div className="min-w-0"><h2 className="font-display text-2xl font-bold leading-[1.05] hover:text-primary">{story.title}</h2><p className="mt-2 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{story.category} · {timeAgo(story.published_at)}</p></div></article>)}</div>
            </div>
            <div id="live" className="mt-auto bg-foreground p-8 text-center text-background">
              <p className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-primary"><span className="signal-pulse size-2 rounded-full bg-primary" />Live now</p>
              <blockquote className="mt-5 font-display text-3xl italic leading-tight">“Watch Global Kashmir TV — live from the valley.”</blockquote>
              <button onClick={() => setLiveOpen(true)} className="mt-7 inline-flex items-center gap-2 border border-background px-5 py-3 text-xs font-black uppercase tracking-[0.12em]"><Play className="size-4 fill-current" /> Open broadcast</button>
            </div>
          </aside>
        </section>

        <section id="top-stories" className="mx-auto max-w-[1440px] border-t-2 border-foreground bg-card px-4 py-14 sm:px-8 lg:px-12 lg:py-20">
          <SectionHeader eyebrow="Top stories" title="Kashmir · Pakistan · World" />
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{top.map((story) => <StoryCard key={story.id} story={story} />)}</div>
        </section>

        <section id="kashmir" className="bg-foreground text-background">
          <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-8 lg:px-12 lg:py-20">
            <SectionHeader eyebrow="Kashmir" title="People · Issues · Future" dark />
            <div className="mt-8 grid gap-8 md:grid-cols-3">{culture.map((story) => <StoryCard key={story.id} story={story} large />)}</div>
          </div>
        </section>

        <section id="world" className="mx-auto max-w-[1440px] bg-card px-4 py-14 sm:px-8 lg:px-12 lg:py-20">
          <SectionHeader eyebrow="Global" title="News from around the world" />
          <div className="mt-8 grid gap-8 md:grid-cols-3">{world.map((story) => <StoryCard key={story.id} story={story} large />)}</div>
        </section>

        {show && <section id="shows" className="border-y-2 border-foreground bg-primary text-primary-foreground"><div className="mx-auto grid max-w-[1440px] lg:grid-cols-2"><div className="p-8 sm:p-12 lg:p-16"><p className="text-[10px] font-black uppercase tracking-[.2em]">Shows & videos</p><h2 className="mt-5 font-display text-5xl leading-[.95] sm:text-7xl">Interviews.<br/>Analysis.<br/><em>Originals.</em></h2><p className="mt-6 max-w-lg text-sm leading-relaxed opacity-80">{show.summary}</p><button className="mt-8 inline-flex items-center gap-2 bg-foreground px-5 py-3 text-xs font-black uppercase tracking-[.12em] text-background"><Play className="size-4 fill-current"/> Watch now</button></div><div className="relative min-h-[380px]"><img loading="lazy" width={1024} height={768} src={lakeImage} alt="Dal Lake at sunrise" className="absolute inset-0 h-full w-full object-cover grayscale"/><div className="absolute inset-0 grid place-items-center"><span className="grid size-20 place-items-center rounded-full bg-primary text-primary-foreground"><Play className="size-7 fill-current"/></span></div></div></div></section>}

        <section className="mx-auto grid max-w-[1440px] border-b-2 border-foreground bg-card md:grid-cols-2">
          {tourism && <div id="tourism" className="border-b border-border p-4 py-12 sm:p-8 md:border-b-0 md:border-r lg:p-12"><StoryCard story={tourism} large /></div>}
          {sports && <div id="sports" className="p-4 py-12 sm:p-8 lg:p-12"><StoryCard story={sports} large /></div>}
        </section>

        <section id="library" className="bg-card px-4 py-16 text-center sm:px-8 lg:py-24">
          <p className="text-[10px] font-black uppercase tracking-[.25em] text-primary">Library · History · Heritage · Knowledge</p>
          <h2 className="mx-auto mt-5 max-w-5xl font-display text-[clamp(3rem,8vw,7rem)] leading-[.88]">See Kashmir.<br/>Hear Kashmir.<br/><em>Understand Kashmir.</em></h2>
          <p className="mt-8 text-xs font-black uppercase tracking-[.22em]">Global Kashmir TV</p>
        </section>
      </main>
      {liveOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/90 p-4" role="dialog" aria-modal="true" aria-label="Live broadcast"><div className="w-full max-w-4xl bg-background p-3 sm:p-5"><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border pb-3"><div className="min-w-0"><p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-primary"><span className="signal-pulse size-2 rounded-full bg-primary"/>Live now</p><h2 className="truncate font-display text-3xl font-bold">The Valley Report</h2></div><button onClick={() => setLiveOpen(false)} className="grid size-10 shrink-0 place-items-center bg-foreground text-background" aria-label="Close broadcast"><X className="size-5"/></button></div><div className="relative mt-3 aspect-video overflow-hidden bg-foreground"><img src={leadImage} width={1536} height={1024} alt="Live view across the Kashmir valley" className="h-full w-full object-cover opacity-70"/><div className="absolute inset-0 grid place-items-center"><div className="text-center text-background"><span className="mx-auto grid size-16 place-items-center rounded-full bg-primary"><Play className="size-6 fill-current"/></span><p className="mt-4 text-xs font-black uppercase tracking-[.18em]">Broadcast preview</p></div></div></div></div></div>}
      <footer className="bg-foreground px-4 py-8 text-background"><div className="mx-auto grid max-w-[1440px] gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><p className="font-display text-3xl">Global Kashmir <span className="text-primary">TV</span></p><p className="text-[10px] uppercase tracking-[.16em] text-background/60">Independent voices · Global perspective · © 2026</p></div></footer>
    </div>
  );
}