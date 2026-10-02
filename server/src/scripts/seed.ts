import { eq } from "drizzle-orm";
import { closePool, db } from "../db/client.js";
import { admins, stories } from "../db/schema.js";
import { hashPassword } from "../lib/password.js";

type SeedStory = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  author: string;
  imageKey: string;
  featured: boolean;
  displayOrder: number;
  minutesAgo: number;
  body?: string;
};

const seedStories: SeedStory[] = [
  {
    slug: "valley-speaks-to-world",
    category: "Kashmir",
    title: "The valley speaks to the world on its own terms",
    summary:
      "A new generation of reporters and filmmakers is reshaping how Kashmir is seen, heard and understood.",
    author: "Aamir Sofi",
    imageKey: "lead",
    featured: true,
    displayOrder: 1,
    minutesAgo: 18,
    body: [
      "Kashmir has never lacked storytellers. What changed is who holds the camera.",
      "",
      "## A newsroom inside the valley",
      "",
      "For years, most reporting on Kashmir was written from somewhere else, by people who flew in for a week and filed from a hotel lobby. The result was a body of work that described the place accurately enough and understood it hardly at all.",
      "",
      "That has changed. A generation that grew up with a phone in hand and a grievance about how their home was described decided to do the describing themselves.",
      "",
      "> We stopped waiting for permission to tell our own stories.",
      "",
      "The shift shows in the work. Interviews run long because the subject is allowed to finish a thought. Camera crews wait for the second answer, not the first. Editors argue about nuance in a way that only becomes possible when the story is yours.",
      "",
      "## What it costs",
      "",
      "None of this is simple. Reporting honestly from inside a contested place asks more of a journalist than reporting on it from outside. Sources are neighbours. Every sentence is read twice, once by an editor and once by someone who will live with the consequences.",
      "",
      "The reporters doing this work say the trade is worth it. The alternative, being explained to the world by strangers, has been tried for a long time.",
    ].join("\n"),
  },
  {
    slug: "orchards-record-harvest",
    category: "Kashmir",
    title: "High-altitude orchards mark a record harvest",
    summary: "Growers across the valley are adapting old knowledge to a changing climate.",
    author: "Nida Dar",
    imageKey: "artisan",
    featured: false,
    displayOrder: 2,
    minutesAgo: 42,
    body: [
      "The crates stacked at the roadside this week tell a story the weather reports do not. After three uncertain seasons, the high-altitude orchards have produced a harvest growers are calling the best in a decade.",
      "",
      "## Reading the trees differently",
      "",
      "Orchard families have kept notes for generations, but the old calendar no longer holds. Bloom is arriving earlier, frost is arriving later, and the gap between the two has narrowed to the point where a single cold night decides the year.",
      "",
      "- Grafting has moved to hardier rootstock.",
      "- Irrigation now runs on drip lines fed by meltwater tanks.",
      "- Harvest crews are smaller, and paid more, because the picking window is shorter.",
      "",
      "The knowledge that matters most is still the oldest kind: knowing which slope holds the cold, and which one lets it go first.",
    ].join("\n"),
  },
  {
    slug: "water-future-valley",
    category: "Kashmir",
    title: "Water will define the valley's next decade",
    summary: "Scientists and residents map the pressure points from glaciers to growing towns.",
    author: "Hiba Qadri",
    imageKey: "lead",
    featured: false,
    displayOrder: 8,
    minutesAgo: 360,
    body: [
      "Follow the water out of the high glaciers and it passes, in order, through farms, a power station, three towns and a lake that is itself a livelihood.",
      "",
      "## Every user is a claimant",
      "",
      "That single thread is why water politics here are so difficult. A change made upstream, for irrigation or for power, is felt downstream within a day.",
      "",
      "Researchers are mapping the pressure points now, before the dry years force the argument. Their models point to two pinch points: the spring melt arriving earlier than the planting calendar, and the towns drawing more than the aquifer refills.",
      "",
      "Residents are not waiting for the models. The canal committees in the old quarters have been allocating water by unwritten rule for longer than anyone can remember, and they are already adjusting those rules.",
    ].join("\n"),
  },
  {
    slug: "keepers-of-kashmir-craft",
    category: "Heritage",
    title: "The hands keeping Kashmir's living craft alive",
    summary: "Inside the workshops where patience, memory and precision still shape every knot.",
    author: "Yusuf Mir",
    imageKey: "artisan",
    featured: false,
    displayOrder: 5,
    minutesAgo: 180,
    body: [
      "The workshop smells of wool, dye and kerosene, and it is colder than the street outside. Six men sit at six looms, and none of them look up when the door opens.",
      "",
      "A single carpet can take two years. The pattern is not drawn; it is remembered, passed from a father to a son who spent a decade doing the background before he was allowed to attempt a medallion.",
      "",
      "> If you rush it, it shows. Fifty years later it still shows.",
      "",
      "The economics are unforgiving. Machine copies sell for a fraction of the price and arrive in a week. The answer, the workshop's owner says, is not to compete on price but to make something a machine cannot: a piece with a maker's name on it, and a story about who made it.",
    ].join("\n"),
  },
  {
    slug: "dal-lake-sunrise-guide",
    category: "Tourism",
    title: "Dal Lake before the city wakes",
    summary:
      "A dawn journey with the boatmen, growers and traders who begin their day on the water.",
    author: "Inaya Shah",
    imageKey: "lake",
    featured: false,
    displayOrder: 6,
    minutesAgo: 240,
    body: [
      "At half past five the lake is doing the work that the city gets credit for. Vegetable growers are poling towards the floating gardens, and the first traders are already arguing about the price of lotus stem.",
      "",
      "## The market on water",
      "",
      "Nothing about the floating market is staged for visitors, which is precisely why it is worth the early start. Boats pull alongside one another and the bargaining happens at close range, over produce that was in the ground an hour ago.",
      "",
      "By seven the light has changed and the lake has become a different place, busy with visitors and the sound of outboard motors. The boatmen say the hour before that is the one that belongs to them.",
    ].join("\n"),
  },
  {
    slug: "last-boat-makers",
    category: "Shows",
    title: "The last boat makers of Dal Lake",
    summary: "An original film follows one family preserving an irreplaceable waterside tradition.",
    author: "GKTV Originals",
    imageKey: "lake",
    featured: false,
    displayOrder: 10,
    minutesAgo: 600,
    body: [
      "A GKTV Original film, shot over four seasons on the western shore of Dal Lake.",
      "",
      "Four generations of one family have built the same boat: the wicker-and-deodar craft that carries everything on the lake, from tourists to turnips. There are now three workshops left.",
      "",
      "The film follows a single hull from the first plank to the water, and the argument between a grandfather who will not change a measurement and a grandson who has already started taking commissions for a different kind of boat.",
      "",
      "Runtime 41 minutes. Filmed and directed by GKTV Originals.",
    ].join("\n"),
  },
  {
    slug: "trade-corridor-opens",
    category: "Pakistan",
    title: "New trade corridor opens a vital regional lane",
    summary:
      "The route promises faster connections for producers, markets and mountain communities.",
    author: "Zara Khan",
    imageKey: "lead",
    featured: false,
    displayOrder: 3,
    minutesAgo: 60,
  },
  {
    slug: "world-summit-cautious-path",
    category: "World",
    title: "World summit ends with a cautious path forward",
    summary: "Delegates signal progress after a week of tense negotiations.",
    author: "Maya Ali",
    imageKey: "lead",
    featured: false,
    displayOrder: 4,
    minutesAgo: 120,
  },
  {
    slug: "mountain-football-future",
    category: "Sports",
    title: "Football's mountain generation plays forward",
    summary:
      "Young players are turning remote grounds into proving grounds for a wider sporting future.",
    author: "Sameer Lone",
    imageKey: "sport",
    featured: false,
    displayOrder: 7,
    minutesAgo: 300,
  },
  {
    slug: "diaspora-new-conversation",
    category: "Global",
    title: "A diaspora starts a new conversation",
    summary: "Communities across four continents are creating cultural networks beyond nostalgia.",
    author: "Raza Wani",
    imageKey: "artisan",
    featured: false,
    displayOrder: 9,
    minutesAgo: 480,
  },
  {
    slug: "archive-voices-1960s",
    category: "Library",
    title: "From the archive: voices of the 1960s",
    summary:
      "Restored recordings bring an extraordinary chapter of oral history back into public memory.",
    author: "GKTV Library",
    imageKey: "artisan",
    featured: false,
    displayOrder: 11,
    minutesAgo: 1440,
  },
  {
    slug: "women-cricket-league",
    category: "Sports",
    title: "Women's cricket league expands across districts",
    summary:
      "New clubs and coaches are building pathways from school grounds to elite competition.",
    author: "Farah Bashir",
    imageKey: "sport",
    featured: false,
    displayOrder: 12,
    minutesAgo: 1440,
  },
];

async function seedStoriesTable(): Promise<void> {
  for (const story of seedStories) {
    const publishedAt = new Date(Date.now() - story.minutesAgo * 60_000);
    const values = {
      slug: story.slug,
      category: story.category,
      title: story.title,
      summary: story.summary,
      body: story.body ?? null,
      author: story.author,
      imageKey: story.imageKey,
      featured: story.featured,
      displayOrder: story.displayOrder,
      publishedAt,
    };

    await db
      .insert(stories)
      .values({ id: crypto.randomUUID(), ...values })
      .onDuplicateKeyUpdate({ set: values });
  }

  console.log(`[seed] upserted ${seedStories.length} stories`);
}

async function seedAdmin(): Promise<void> {
  const email = (process.env["SEED_ADMIN_EMAIL"] ?? "admin@gktv.local").trim().toLowerCase();
  const password = process.env["SEED_ADMIN_PASSWORD"] ?? "ChangeMe123!";
  const name = process.env["SEED_ADMIN_NAME"] ?? "GKTV Admin";

  const existing = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
  if (existing.length > 0) {
    console.log(`[seed] admin ${email} already exists, skipping`);
    return;
  }

  await db.insert(admins).values({
    id: crypto.randomUUID(),
    email,
    name,
    passwordHash: await hashPassword(password),
    role: "admin",
  });

  console.log(`[seed] created admin ${email}`);
}

async function main(): Promise<void> {
  await seedStoriesTable();
  await seedAdmin();
  console.log("[seed] done");
}

main()
  .catch((error) => {
    console.error("[seed] failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void closePool();
  });
