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
    slug: "keepers-of-kashmir-craft",
    category: "Heritage",
    title: "The hands keeping Kashmir's living craft alive",
    summary: "Inside the workshops where patience, memory and precision still shape every knot.",
    author: "Yusuf Mir",
    imageKey: "artisan",
    featured: false,
    displayOrder: 5,
    minutesAgo: 180,
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
    slug: "water-future-valley",
    category: "Kashmir",
    title: "Water will define the valley's next decade",
    summary: "Scientists and residents map the pressure points from glaciers to growing towns.",
    author: "Hiba Qadri",
    imageKey: "lead",
    featured: false,
    displayOrder: 8,
    minutesAgo: 360,
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
    slug: "last-boat-makers",
    category: "Shows",
    title: "The last boat makers of Dal Lake",
    summary: "An original film follows one family preserving an irreplaceable waterside tradition.",
    author: "GKTV Originals",
    imageKey: "lake",
    featured: false,
    displayOrder: 10,
    minutesAgo: 600,
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
