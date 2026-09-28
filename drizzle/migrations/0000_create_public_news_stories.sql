CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  author TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  image_key TEXT NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.stories TO anon;
GRANT SELECT ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published stories are publicly readable"
ON public.stories
FOR SELECT
TO anon, authenticated
USING (published_at <= now());

CREATE INDEX stories_published_order_idx ON public.stories (featured DESC, display_order ASC, published_at DESC);
CREATE INDEX stories_category_idx ON public.stories (category, published_at DESC);

INSERT INTO public.stories (slug, category, title, summary, author, published_at, image_key, featured, display_order) VALUES
('valley-speaks-to-world', 'Kashmir', 'The valley speaks to the world on its own terms', 'A new generation of reporters and filmmakers is reshaping how Kashmir is seen, heard and understood.', 'Aamir Sofi', now() - interval '18 minutes', 'lead', true, 1),
('orchards-record-harvest', 'Kashmir', 'High-altitude orchards mark a record harvest', 'Growers across the valley are adapting old knowledge to a changing climate.', 'Nida Dar', now() - interval '42 minutes', 'artisan', false, 2),
('trade-corridor-opens', 'Pakistan', 'New trade corridor opens a vital regional lane', 'The route promises faster connections for producers, markets and mountain communities.', 'Zara Khan', now() - interval '1 hour', 'lead', false, 3),
('world-summit-cautious-path', 'World', 'World summit ends with a cautious path forward', 'Delegates signal progress after a week of tense negotiations.', 'Maya Ali', now() - interval '2 hours', 'lead', false, 4),
('keepers-of-kashmir-craft', 'Heritage', 'The hands keeping Kashmir’s living craft alive', 'Inside the workshops where patience, memory and precision still shape every knot.', 'Yusuf Mir', now() - interval '3 hours', 'artisan', false, 5),
('dal-lake-sunrise-guide', 'Tourism', 'Dal Lake before the city wakes', 'A dawn journey with the boatmen, growers and traders who begin their day on the water.', 'Inaya Shah', now() - interval '4 hours', 'lake', false, 6),
('mountain-football-future', 'Sports', 'Football’s mountain generation plays forward', 'Young players are turning remote grounds into proving grounds for a wider sporting future.', 'Sameer Lone', now() - interval '5 hours', 'sport', false, 7),
('water-future-valley', 'Kashmir', 'Water will define the valley’s next decade', 'Scientists and residents map the pressure points from glaciers to growing towns.', 'Hiba Qadri', now() - interval '6 hours', 'lead', false, 8),
('diaspora-new-conversation', 'Global', 'A diaspora starts a new conversation', 'Communities across four continents are creating cultural networks beyond nostalgia.', 'Raza Wani', now() - interval '8 hours', 'artisan', false, 9),
('last-boat-makers', 'Shows', 'The last boat makers of Dal Lake', 'An original film follows one family preserving an irreplaceable waterside tradition.', 'GKTV Originals', now() - interval '10 hours', 'lake', false, 10),
('archive-voices-1960s', 'Library', 'From the archive: voices of the 1960s', 'Restored recordings bring an extraordinary chapter of oral history back into public memory.', 'GKTV Library', now() - interval '1 day', 'artisan', false, 11),
('women-cricket-league', 'Sports', 'Women’s cricket league expands across districts', 'New clubs and coaches are building pathways from school grounds to elite competition.', 'Farah Bashir', now() - interval '1 day', 'sport', false, 12);