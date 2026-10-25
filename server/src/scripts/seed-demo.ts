/**
 * A design fixture, in two languages: a full English set and a full Urdu set, so
 * either build of the site renders as it will in use. The site publishes one
 * language per deployment (`SITE_LANG`), so only one set is ever visible at a
 * time — seed both, then build with `SITE_LANG=ur` to review the Urdu set.
 *
 * Every row is marked twice: the slug begins with "demo-", and the byline reads
 * "Demo Desk". Re-running replaces the whole set rather than adding to it, and
 * one flag removes it again:
 *
 *   npm run db:seed-demo            # replace the demo rows
 *   npm run db:seed-demo -- --clean # remove every demo row
 *
 * Covers are generated, not photographed: each story gets a branded gradient
 * plate with its section on it, drawn here with sharp. They are written into the
 * API's upload root (`UPLOAD_DIR`), which is gitignored — regenerate them by
 * re-running this script (missing files fall back to the bundled artwork).
 *
 * `--lend` additionally plates every other published row that has no cover, so
 * no two cards on a review page share a picture. It is off by default: it writes
 * to rows this script does not own, and the plates are stamped "DEMO", so it is
 * not something to point at a live database.
 */
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { isNull, like, or, eq } from "drizzle-orm";
import sharp from "sharp";
import { closePool, db } from "../db/client.js";
import { stories } from "../db/schema.js";
import { UPLOAD_ROOT } from "../lib/storage.js";

const DEMO_PREFIX = "demo-";
/** Covers are written into the upload root the API actually serves, not a local
 *  `uploads/` next to this script: on a server those are different directories,
 *  and a cover written to the wrong one is a broken image on every card. */
const COVER_DIR = path.join(UPLOAD_ROOT, "2026", "demo");
const PLATE_PREFIX = "demo-plate-";
/** Matches the path the API serves uploads from. */
const COVER_URL_DIR = "/uploads/2026/demo";

const thumb = (n: number) => `${COVER_URL_DIR}/demo-img-${String(n).padStart(2, "0")}.jpg`;
const thumbFile = (n: number) => `${COVER_DIR}/demo-img-${String(n).padStart(2, "0")}.jpg`;
const clip = (n: number) => `${COVER_URL_DIR}/demo-clip-${n}.mp4`;
const clipFile = (n: number) => `${COVER_DIR}/demo-clip-${n}.mp4`;
const plate = (key: string) => `${COVER_URL_DIR}/${PLATE_PREFIX}${key}.jpg`;
const plateFile = (key: string) => `${COVER_DIR}/${PLATE_PREFIX}${key}.jpg`;
const photo = (n: number) => `${COVER_URL_DIR}/demo-photo-0${n}.jpg`;
const photoFile = (n: number) => `${COVER_DIR}/demo-photo-0${n}.jpg`;

/**
 * The four photographs the site ships with. There are only four, so they are
 * spent on the slots that render large — the hero, the video band, the section
 * leads and the opinion card — and cycled so no two neighbours repeat. Every
 * smaller thumbnail keeps a generated plate instead.
 */
const PHOTOS = [
  "../src/assets/kashmir-lead.jpg",
  "../src/assets/dal-lake.jpg",
  "../src/assets/kashmir-artisan.jpg",
  "../src/assets/kashmir-sport.jpg",
];

/** Demo slug -> which photograph it wears. Assigned against the running order. */
const PHOTO_SLOTS: Record<string, number> = {
  // hero: the lead frame, then the four in the rail
  "baramulla-bridge": 1,
  "trade-corridor-lane": 2,
  "climate-summit": 3,
  "rail-freight": 4,
  "flood-belt-aid": 1,
  // the video band, left to right
  "women-news-bureau": 2,
  "winter-air-plan": 3,
  "markets-steady": 4,
  "opinion-local-reporting": 1,
  // the lead card at the top of each section block
  "handloom-export": 2,
  "freight-depot": 3,
  "shipping-reroute": 4,
  "archive-radio-tapes": 1,
  // the single opinion card
  "opinion-economy-decade": 2,
  // ---- the Urdu set, spent the same way ----
  // hero: the lead frame, then the slide rail
  "ur-rail-freight": 1,
  "ur-handloom": 2,
  "ur-trade-lane": 3,
  "ur-summit": 4,
  "ur-aid": 1,
  // the video band, left to right
  "ur-schools": 2,
  "ur-dal-lake": 3,
  "ur-craft": 4,
  "ur-opinion-reporting": 1,
  // the lead card at the top of each section block
  "ur-saffron": 2,
  "ur-power-grid": 3,
  "ur-shipping": 4,
  "ur-archive": 1,
  // the single opinion card
  "ur-opinion-economy": 2,
};

/**
 * Bright, high-contrast pairs, in the brand's own key. Rotated so adjacent
 * cards never repeat a colour.
 */
const PALETTES: { from: string; to: string; accent: string }[] = [
  { from: "#0B3C8C", to: "#1FA2C4", accent: "#7BE0A6" },
  { from: "#7A1E86", to: "#E2542C", accent: "#FFC94D" },
  { from: "#0E7C5A", to: "#8FD14F", accent: "#0B2A6B" },
  { from: "#123A6B", to: "#2E62E0", accent: "#5EE7F0" },
  { from: "#B3123C", to: "#F07B24", accent: "#FFE07A" },
  { from: "#2B1A6B", to: "#7B4BE0", accent: "#F2A8FF" },
  { from: "#0A6E7A", to: "#22B573", accent: "#F2FF8F" },
  { from: "#154C79", to: "#2E9B4A", accent: "#FFD166" },
  { from: "#8A1C5A", to: "#D6537F", accent: "#FFD9E6" },
  { from: "#1B2A6B", to: "#3E8FD1", accent: "#9BE7A0" },
  { from: "#A63A0B", to: "#E9A020", accent: "#FFF0B3" },
  { from: "#0B5D3B", to: "#3FBF8F", accent: "#F4FF7A" },
];

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * One branded channel plate: gradient ground, the channel mark, the section in
 * large type, and the DEMO tag.
 *
 * There is deliberately no headline text on the plate. The plate is also the
 * hero picture, and the hero lays its own headline over it and crops a 16:9
 * plate hard: top and bottom on a desktop, the sides on a phone. So:
 *
 *  - every label sits between x=80 and x=400, which the desktop hero keeps and
 *    the phone hero crops away whole (a wider line would show up as a sliced
 *    fragment on a phone), and
 *  - nothing goes below y=330, because that is where the hero's own headline
 *    and chip begin.
 */
function coverSvg({ kicker, index }: { kicker: string; index: number }): string {
  const { from, to, accent } = PALETTES[index % PALETTES.length]!;
  const label = escapeXml(kicker.toUpperCase());

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#g)"/>
  <circle cx="1130" cy="150" r="300" fill="#ffffff" opacity="0.09"/>
  <circle cx="980" cy="650" r="330" fill="#000000" opacity="0.10"/>
  <rect x="80" y="150" width="142" height="42" rx="4" fill="${accent}"/>
  <text x="151" y="179" font-family="Helvetica, Arial, sans-serif" font-size="21" font-weight="700" fill="#0B1B33" text-anchor="middle">GKTV</text>
  <text x="80" y="300" font-family="Helvetica, Arial, sans-serif" font-size="52" font-weight="700" letter-spacing="2" fill="#ffffff">${label}</text>
  <rect x="80" y="328" width="150" height="14" fill="${accent}"/>
  <text x="1200" y="560" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="4" fill="#ffffff" opacity="0.7" text-anchor="end">DEMO</text>
</svg>`;
}

async function renderCover(
  file: string,
  { kicker, index }: { kicker: string; index: number },
): Promise<void> {
  mkdirSync(path.dirname(file), { recursive: true });
  await sharp(Buffer.from(coverSvg({ kicker, index })))
    .jpeg({ quality: 84, chromaSubsampling: "4:4:4" })
    .toFile(file);
}

/** Crops one of the site's own photographs to the 16:9 frame every card uses. */
async function renderPhoto(target: string, source: string): Promise<void> {
  mkdirSync(path.dirname(target), { recursive: true });
  await sharp(source)
    .resize(1280, 720, { fit: "cover", position: sharp.strategy.attention })
    .jpeg({ quality: 84, chromaSubsampling: "4:4:4" })
    .toFile(target);
}

type DemoStory = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  image: number;
  minutesAgo: number;
  featured?: boolean;
  video?: number;
  body?: string;
  /** Defaults to "en". An Urdu story renders right-to-left on the site. */
  language?: "en" | "ur";
  /**
   * Latin text for the generated plate. The plate is drawn by sharp, which has
   * no Urdu face to fall back on, so an Urdu story still passes its section's
   * English name here rather than a string that would render as blanks.
   */
  kicker?: string;
};

/**
 * Order matters. The five newest become the hero, the video stories are older
 * so they survive into the shelf, and the rest fill the category blocks.
 */
const STORIES: DemoStory[] = [
  {
    slug: "baramulla-bridge",
    category: "Kashmir",
    title: "A new bridge at Baramulla cuts an hour off the valley's north road",
    summary:
      "The crossing opens after four winters of work and changes the arithmetic for growers moving fruit south.",
    image: 1,
    minutesAgo: 10,
    featured: true,
    body: "For the growers around Sopore, the difference is measured in hours of cold. Fruit that once sat in a queue for the ferry now reaches the highway while the morning is still cool.\n\n## Four winters of work\n\nThe crossing was poured in sections, each one paused by weather. Engineers kept a working calendar of frost days and lost most of the second winter to it.\n\n> We did not beat the weather. We learned to work around it.\n\nThe wider question is what the road brings next. Two fuel stations and a cold-storage yard have already been surveyed on the southern approach.",
  },
  {
    slug: "trade-corridor-lane",
    category: "Pakistan",
    title: "Trade corridor opens a second lane at the northern crossing",
    summary: "Freight volume has doubled since the route was resurfaced.",
    image: 2,
    minutesAgo: 20,
  },
  {
    slug: "climate-summit",
    category: "World",
    title: "Climate summit closes with a cautious timetable",
    summary: "Delegates agree a review mechanism but leave the finance question open.",
    image: 3,
    minutesAgo: 25,
  },
  {
    slug: "rail-freight",
    category: "Pakistan",
    title: "Rail upgrade promises faster freight to the coast",
    summary: "The first of nine stations reopens with a rebuilt loading yard.",
    image: 4,
    minutesAgo: 30,
  },
  {
    slug: "flood-belt-aid",
    category: "World",
    title: "Aid agencies scale up along the flood belt",
    summary: "Three districts remain cut off, and the road window is closing.",
    image: 5,
    minutesAgo: 35,
  },
  {
    slug: "women-news-bureau",
    category: "Kashmir",
    title: "Inside the valley's first all-women news bureau",
    summary: "Six reporters, one desk, and a different set of questions.",
    image: 6,
    minutesAgo: 60,
    video: 1,
    body: "A GKTV Original film. Six reporters share one desk in a converted flat, and the newsroom they have built asks a different set of questions than the ones the valley is used to being asked.\n\n## The desk\n\nTwo of them came from regional bureaus where, they say, the assignments ran out at the human-interest end. The rest are on their first staff job.\n\nRuntime 18 minutes.",
  },
  {
    slug: "winter-air-plan",
    category: "Pakistan",
    title: "Winter restrictions return as air quality plans are tested",
    summary: "Schools and building sites face a staged schedule through January.",
    image: 7,
    minutesAgo: 90,
    video: 2,
  },
  {
    slug: "markets-steady",
    category: "World",
    title: "Markets steady after a volatile week",
    summary: "Energy prices gave back early losses as shipping resumed.",
    image: 8,
    minutesAgo: 120,
    video: 3,
  },
  {
    slug: "opinion-local-reporting",
    category: "Opinion",
    title: "Opinion: why local reporting still costs more than it earns",
    summary: "Good journalism is a public good that no market here is yet paying for.",
    image: 9,
    minutesAgo: 150,
    video: 4,
  },
  {
    slug: "handloom-export",
    category: "Kashmir",
    title: "Handloom co-operatives win their first export order in a decade",
    summary: "Forty families in three villages will supply a European retailer next spring.",
    image: 10,
    minutesAgo: 200,
  },
  {
    slug: "winter-schools",
    category: "Kashmir",
    title: "Winter schools reopen in the higher reaches after early snow",
    summary: "Almost 900 students return to classrooms as district teams clear the approach roads.",
    image: 11,
    minutesAgo: 260,
  },
  {
    slug: "opinion-economy-decade",
    category: "Opinion",
    title: "Opinion: the valley's economy needs a decade, not a season",
    summary: "Short interventions keep missing the horizon that investment actually needs.",
    image: 12,
    minutesAgo: 320,
  },
  {
    slug: "archive-radio-tapes",
    category: "Library",
    title: "From the archive: the radio tapes that outlived their station",
    summary: "Reel-to-reel recordings found in a district office are being cleaned and catalogued.",
    image: 13,
    minutesAgo: 380,
    body: "Nine cardboard boxes, stored badly, held four decades of a station that no longer exists. The tapes were brittle and the labels were written in three different hands.\n\n## What survives on tape\n\nThe collection runs from news bulletins to a music programme whose presenter is now a grandfather. Archivists are cleaning, digitising and cataloguing each reel before any of it is played again.\n\nListeners who remember the station have already written in with corrections to the catalogue.",
  },
  {
    slug: "reading-room-reopens",
    category: "Library",
    title: "A reading room reopens with twelve thousand volumes",
    summary: "A private collection donated in the 1970s has finally been catalogued and opened.",
    image: 14,
    minutesAgo: 440,
  },
  /*
   * The rows below are older on purpose: they sit behind the hero and the video
   * shelf, and exist so every category block has a lead and a full list.
   */
  {
    slug: "freight-depot",
    category: "Pakistan",
    title: "Freight rates ease as a new depot opens at the border",
    summary: "Handling time at the crossing falls by a third in the first month.",
    image: 15,
    minutesAgo: 480,
  },
  {
    slug: "cotton-planting",
    category: "Pakistan",
    title: "Cotton growers hold back planting as the canal schedule slips",
    summary: "A dry fortnight has pushed the watering calendar past its window.",
    image: 16,
    minutesAgo: 520,
  },
  {
    slug: "grid-link",
    category: "Pakistan",
    title: "A second grid link promises steadier power for the northern belt",
    summary: "Engineers have energised the first of two new transmission lines.",
    image: 17,
    minutesAgo: 560,
  },
  {
    slug: "border-markets",
    category: "Pakistan",
    title: "Border markets reopen after a four-month closure",
    summary: "Traders returned to a shorter day and a longer queue.",
    image: 18,
    minutesAgo: 600,
  },
  {
    slug: "shipping-reroute",
    category: "World",
    title: "Shipping lines reroute as the strait stays congested",
    summary: "Two carriers have added a week to schedules on the southern route.",
    image: 19,
    minutesAgo: 660,
  },
  {
    slug: "vaccine-trial",
    category: "World",
    title: "A vaccine trial reports its first full-year results",
    summary: "Efficacy held across the season, with supply still the constraint.",
    image: 20,
    minutesAgo: 720,
  },
  {
    slug: "munich-talks",
    category: "World",
    title: "Munich talks end without a joint statement",
    summary: "Delegations agreed to meet again, but not on what to discuss.",
    image: 21,
    minutesAgo: 780,
  },
  {
    slug: "grain-prices",
    category: "World",
    title: "Grain prices settle after three weeks of volatility",
    summary: "Buyers stepped back and the futures curve flattened.",
    image: 22,
    minutesAgo: 840,
  },
  {
    slug: "photography-archive",
    category: "Library",
    title: "A century of valley photography, catalogued at last",
    summary: "Four thousand negatives have been cleaned, scanned and indexed.",
    image: 23,
    minutesAgo: 900,
  },
  {
    slug: "caravan-letters",
    category: "Library",
    title: "The letters that travelled with a merchant caravan",
    summary: "Correspondence found in a family trunk traces a route across three passes.",
    image: 24,
    minutesAgo: 960,
  },
  {
    slug: "saffron-harvest",
    category: "Kashmir",
    title: "Saffron growers look to a shorter, sharper harvest",
    summary: "A warm autumn has brought the picking forward by ten days.",
    image: 25,
    minutesAgo: 1020,
  },
  {
    slug: "bus-link",
    category: "Kashmir",
    title: "A new bus link joins two valley towns",
    summary: "The service runs six times a day and costs less than the shared taxi.",
    image: 26,
    minutesAgo: 1080,
  },
  {
    slug: "boat-histories",
    category: "Library",
    title: "Oral histories from the lake's boat families",
    summary: "Forty hours of recordings have been transcribed and put online.",
    image: 27,
    minutesAgo: 1140,
  },
  {
    slug: "district-gazetteer",
    category: "Library",
    title: "A district gazetteer, digitised and searchable",
    summary: "The 1911 edition is now indexed by place name and by year.",
    image: 28,
    minutesAgo: 1200,
  },
];

/**
 * The Urdu set. Same shape and running order as the English list, written in
 * Urdu and filed under the Urdu section names the site already maps
 * (کشمیر, پاکستان, دنیا, رائے, سیاحت, کھیل, ورثہ, کتب خانہ). Plate numbers
 * start at 29 so they never overwrite an English plate.
 */
const STORIES_UR: DemoStory[] = [
  {
    slug: "ur-rail-freight",
    category: "کشمیر",
    kicker: "KASHMIR",
    title: "برہ پورہ کی نئی ریل لائن نے شمالی سڑک کا ایک گھنٹہ بچا لیا",
    summary: "چار سردیوں کے کام کے بعد پل کھل گیا اور باغبانوں کا حساب بدل گیا۔",
    image: 29,
    minutesAgo: 12,
    featured: true,
    language: "ur",
    body: "سوپور کے آس پاس کے باغبانوں کے لیے فرق گھنٹوں میں ناپا جاتا ہے۔ جو پھل پہلے فیری کی قطار میں سردی میں بیٹھا رہتا تھا، اب صبح ٹھنڈی رہتے ہوئے شاہراہ تک پہنچ جاتا ہے۔\n\n## چار سردیوں کا کام\n\nپل ٹکڑوں میں ڈھالا گیا اور ہر ٹکڑا موسم نے روکا۔ انجینئروں نے پالے کے دنوں کا کیلنڈر رکھا اور دوسری سردی تقریباً پوری ضائع ہوئی۔\n\n> ہم نے موسم کو نہیں ہرایا۔ ہم نے اس کے گرد کام کرنا سیکھا۔\n\nاصل سوال یہ ہے کہ سڑک آگے کیا لاتی ہے۔ جنوبی راستے پر دو پٹرول پمپ اور ایک کولڈ اسٹور کے لیے سروے ہو چکا ہے۔",
  },
  {
    slug: "ur-handloom",
    category: "کشمیر",
    kicker: "KASHMIR",
    title: "ہتھ کڑھائی کے دستکاروں کو ایک دہائی بعد پہلا برآمدی آرڈر ملا",
    summary: "تین گاؤں کے چالیس گھرانے اگلی بہار یورپی خریدار کو مال بھیجیں گے۔",
    image: 30,
    minutesAgo: 25,
    language: "ur",
  },
  {
    slug: "ur-saffron",
    category: "کشمیر",
    kicker: "KASHMIR",
    title: "زعفران کے کاشتکار مختصر اور تیز فصل کی طرف دیکھ رہے ہیں",
    summary: "گرم خزاں نے چنائی کا وقت دس دن آگے بڑھا دیا ہے۔",
    image: 31,
    minutesAgo: 140,
    language: "ur",
  },
  {
    slug: "ur-schools",
    category: "کشمیر",
    kicker: "KASHMIR",
    title: "برف باری کے بعد بلند علاقوں کے اسکول دوبارہ کھل گئے",
    summary: "تقریباً نو سو طلبہ کلاسوں میں واپس آئے، سڑکیں صاف کر دی گئی ہیں۔",
    image: 32,
    minutesAgo: 75,
    video: 1,
    language: "ur",
  },
  {
    slug: "ur-trade-lane",
    category: "پاکستان",
    kicker: "PAKISTAN",
    title: "شمالی راستے پر تجارتی گلیارے کی دوسری لین کھل گئی",
    summary: "سڑک کی مرمت کے بعد مال بردار گاڑیوں کی تعداد دوگنی ہو گئی۔",
    image: 33,
    minutesAgo: 40,
    language: "ur",
  },
  {
    slug: "ur-power-grid",
    category: "پاکستان",
    kicker: "PAKISTAN",
    title: "شمالی پٹی کے لیے دوسرا گرڈ لنک بجلی مستحکم کرے گا",
    summary: "انجینئروں نے دو نئی ٹرانسمیشن لائنوں میں سے پہلی چالو کر دی۔",
    image: 34,
    minutesAgo: 170,
    language: "ur",
  },
  {
    slug: "ur-markets",
    category: "پاکستان",
    kicker: "PAKISTAN",
    title: "مارکیٹیں ہفتے بھر کے اتار چڑھاؤ کے بعد مستحکم ہو گئیں",
    summary: "شپنگ بحال ہونے پر توانائی کی قیمتوں نے ابتدائی نقصان پورا کر لیا۔",
    image: 35,
    minutesAgo: 230,
    language: "ur",
  },
  {
    slug: "ur-summit",
    category: "دنیا",
    kicker: "WORLD",
    title: "موسمیاتی اجلاس محتاط ٹائم ٹیبل پر ختم ہوا",
    summary: "وفود نے جائزے کا طریقہ طے کر لیا، مالی معاملہ کھلا رہ گیا۔",
    image: 36,
    minutesAgo: 48,
    language: "ur",
  },
  {
    slug: "ur-shipping",
    category: "دنیا",
    kicker: "WORLD",
    title: "آبنائے میں رکاوٹ کے باعث شپنگ کمپنیوں نے راستے بدل لیے",
    summary: "دو کمپنیوں نے جنوبی راستے کے شیڈول میں ایک ہفتہ بڑھا دیا۔",
    image: 37,
    minutesAgo: 200,
    language: "ur",
  },
  {
    slug: "ur-aid",
    category: "دنیا",
    kicker: "WORLD",
    title: "سیلابی پٹی میں امدادی اداروں نے کام بڑھا دیا",
    summary: "تین اضلاع اب بھی کٹے ہوئے ہیں اور سڑک کا موقع تنگ ہو رہا ہے۔",
    image: 38,
    minutesAgo: 60,
    language: "ur",
  },
  {
    slug: "ur-opinion-reporting",
    category: "رائے",
    kicker: "OPINION",
    title: "رائے: مقامی صحافت اب بھی اپنی کمائی سے مہنگی ہے",
    summary: "اچھی صحافت ایک عوامی خدمت ہے جس کی قیمت یہاں کوئی مارکیٹ ادا نہیں کرتی۔",
    image: 39,
    minutesAgo: 110,
    video: 4,
    language: "ur",
  },
  {
    slug: "ur-opinion-economy",
    category: "رائے",
    kicker: "OPINION",
    title: "رائے: وادی کی معیشت کو ایک موسم نہیں، ایک دہائی چاہیے",
    summary: "چھوٹی مداخلتیں وہ افق بار بار چوک دیتی ہیں جو سرمایہ کاری کو درکار ہے۔",
    image: 40,
    minutesAgo: 260,
    language: "ur",
  },
  {
    slug: "ur-dal-lake",
    category: "سیاحت",
    kicker: "TOURISM",
    title: "ڈل جھیل، شہر کے بیدار ہونے سے پہلے",
    summary: "کشتی والوں، سبزی اگانے والوں اور تاجروں کے ساتھ صبح کی ایک سفر۔",
    image: 41,
    minutesAgo: 88,
    video: 2,
    language: "ur",
  },
  {
    slug: "ur-gardens",
    category: "سیاحت",
    kicker: "TOURISM",
    title: "مغل باغات میں بہار کا پہلا ہفتہ",
    summary: "درختوں پر پھول کھل گئے اور شہر نے اپنا پرانا میلہ یاد کیا۔",
    image: 42,
    minutesAgo: 300,
    language: "ur",
  },
  {
    slug: "ur-cricket",
    category: "کھیل",
    kicker: "SPORTS",
    title: "خواتین کرکٹ لیگ ضلع بھر میں پھیل گئی",
    summary: "نئے کلب اور کوچ اسکول کے میدانوں سے آگے راستے بنا رہے ہیں۔",
    image: 43,
    minutesAgo: 340,
    language: "ur",
  },
  {
    slug: "ur-football",
    category: "کھیل",
    kicker: "SPORTS",
    title: "پہاڑی فٹبال کی نسل آگے بڑھ رہی ہے",
    summary: "نوجوان کھلاڑی دور دراز کے میدانوں کو آزمائش کی جگہ بنا رہے ہیں۔",
    image: 44,
    minutesAgo: 380,
    language: "ur",
  },
  {
    slug: "ur-craft",
    category: "ورثہ",
    kicker: "HERITAGE",
    title: "کشمیر کی زندہ دستکاری کو زندہ رکھنے والے ہاتھ",
    summary: "ان کارگاہوں کے اندر جہاں صبر، یاد اور مہارت ہر گرہ بناتی ہے۔",
    image: 45,
    minutesAgo: 96,
    video: 3,
    language: "ur",
  },
  {
    slug: "ur-archive",
    category: "کتب خانہ",
    kicker: "LIBRARY",
    title: "محفوظات سے: ریڈیو کے وہ ٹیپ جو اپنے اسٹیشن سے زیادہ جیے",
    summary: "ایک ضلعی دفتر میں ملے ریل ٹیپ صاف اور فہرست بند کیے جا رہے ہیں۔",
    image: 46,
    minutesAgo: 420,
    language: "ur",
    body: "نو گتے کے ڈبے، بری طرح رکھے ہوئے، ایک ایسے اسٹیشن کی چار دہائیاں سمیٹے ہوئے تھے جو اب نہیں ہے۔ ٹیپ نازک تھے اور لیبل تین مختلف ہاتھوں میں لکھے گئے تھے۔\n\n## ٹیپ پر کیا بچا\n\nمجموعے میں خبریں بھی ہیں اور ایک موسیقی کا پروگرام بھی جس کا میزبان اب دادا ہے۔ محافظین ہر ریل کو صاف، ڈیجیٹل اور فہرست بند کر رہے ہیں۔\n\nاسٹیشن کو یاد رکھنے والے سامعین نے پہلے ہی فہرست میں تصحیح کے لیے خط لکھ دیے ہیں۔",
  },
  {
    slug: "ur-reading-room",
    category: "کتب خانہ",
    kicker: "LIBRARY",
    title: "بارہ ہزار کتابوں کے ساتھ پڑھنے کا کمرہ دوبارہ کھل گیا",
    summary: "ستر کی دہائی میں دیا گیا نجی ذخیرہ آخرکار فہرست بند ہو کر کھل گیا۔",
    image: 47,
    minutesAgo: 470,
    language: "ur",
  },
];

/** Both sets, so one pass seeds whichever language the build will show. */
const ALL_STORIES: DemoStory[] = [...STORIES, ...STORIES_UR];

function bodyFor(story: DemoStory): string {
  return (
    story.body ??
    `${story.summary}\n\nBrief filed by the Demo Desk. This page exists only for design review.`
  );
}

/** Removes the demo rows and the plates lent to everything else. */
async function clean(): Promise<void> {
  await db
    .update(stories)
    .set({ heroImageUrl: null })
    .where(like(stories.heroImageUrl, `%${PLATE_PREFIX}%`));

  await db.delete(stories).where(like(stories.slug, `${DEMO_PREFIX}%`));
  console.log(`[seed-demo] removed every story whose slug starts with "${DEMO_PREFIX}"`);
}

async function main(): Promise<void> {
  if (process.argv.includes("--clean")) {
    await clean();
    return;
  }

  const lendPlates = process.argv.includes("--lend");

  // The clips are pre-recorded; the covers are drawn below.
  const missing = [1, 2, 3, 4].map(clipFile).filter((file) => !existsSync(file));

  if (missing.length > 0) {
    console.warn(
      `[seed-demo] note: ${missing.length} demo clip(s) missing from ${COVER_DIR} — ` +
        `the video stories will still render, but their players will not play.`,
    );
  }

  // Replace rather than accumulate, so the fixture is always exactly this set.
  await clean();

  for (const story of ALL_STORIES) {
    const shot = PHOTO_SLOTS[story.slug];
    await db.insert(stories).values({
      id: crypto.randomUUID(),
      slug: `${DEMO_PREFIX}${story.slug}`,
      category: story.category,
      title: story.title,
      summary: story.summary,
      language: story.language ?? "en",
      body: bodyFor(story),
      author: "Demo Desk",
      imageKey: "lead",
      heroImageUrl: shot ? photo(shot) : thumb(story.image),
      videoUrl: story.video ? clip(story.video) : null,
      videoTitle: story.video ? story.title : null,
      featured: story.featured ?? false,
      displayOrder: 0,
      publishedAt: new Date(Date.now() - story.minutesAgo * 60_000),
    });
  }

  // Draw the photographic frames first, then one branded plate per demo story.
  for (const [index, source] of PHOTOS.entries()) {
    await renderPhoto(photoFile(index + 1), source);
  }

  // Draw one branded plate per demo story, replacing whatever was there.
  for (const story of ALL_STORIES) {
    await renderCover(thumbFile(story.image), {
      kicker: story.kicker ?? story.category,
      index: story.image - 1,
    });
  }

  let lent = 0;
  if (lendPlates) {
    /*
     * `--lend` only. Plates every other published row that has no cover, so a
     * review page never shows the same bundled photograph twice. It writes to
     * rows this script does not own, and the plates are stamped "DEMO", so it
     * stays opt-in rather than something a plain run does to a live database.
     */
    const others = await db
      .select({
        id: stories.id,
        slug: stories.slug,
        category: stories.category,
        heroImageUrl: stories.heroImageUrl,
      })
      .from(stories)
      .where(or(isNull(stories.heroImageUrl), eq(stories.heroImageUrl, "")));

    for (const [position, row] of others.entries()) {
      const key = row.slug.replace(/[^a-z0-9-]/gi, "").slice(0, 60) || `row-${position}`;
      await renderCover(plateFile(key), {
        kicker: row.category,
        index: position + ALL_STORIES.length,
      });
      await db
        .update(stories)
        .set({ heroImageUrl: plate(key) })
        .where(eq(stories.id, row.id));
      lent += 1;
    }
  }

  const english = ALL_STORIES.filter((story) => (story.language ?? "en") === "en");
  const urdu = ALL_STORIES.filter((story) => story.language === "ur");
  const sections = [...new Set(english.map((story) => story.category))].sort();

  console.log(
    `[seed-demo] inserted ${english.length} English stories ` +
      `(${english.filter((story) => story.video).length} with video) ` +
      `across ${sections.join(", ")}`,
  );
  console.log(
    `[seed-demo] inserted ${urdu.length} Urdu stories ` +
      `(${urdu.filter((story) => story.video).length} with video)`,
  );
  console.log(
    `[seed-demo] drew ${ALL_STORIES.length + lent} branded covers (${lent} lent to other rows)`,
  );
  console.log(
    `[seed-demo] the site shows one language per build: review the Urdu set with ` +
      `SITE_LANG=ur npm run build`,
  );
  console.log(`[seed-demo] remove them with: npm run db:seed-demo -- --clean`);
}

main()
  .catch((error) => {
    console.error("[seed-demo] failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void closePool();
  });
