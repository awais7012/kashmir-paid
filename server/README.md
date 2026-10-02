# Kashmir Connect API

Express + MySQL backend for Global Kashmir TV. This replaces the previous Supabase
setup: the frontend now talks to this REST API instead of the Supabase Postgres
client.

## Stack

| Concern     | Choice                                      |
| ----------- | ------------------------------------------- |
| Runtime     | Node.js 20+ (ESM)                           |
| HTTP        | Express 5                                   |
| Database    | MySQL 8+                                    |
| Query layer | Drizzle ORM (`mysql2` driver)               |
| Validation  | Zod                                         |
| Auth        | JWT bearer tokens + bcrypt password hashes  |
| Hardening   | helmet, CORS allow-list, rate-limited login |

## Getting started

```sh
cd server
npm install
cp .env.example .env      # then edit DATABASE_URL + JWT_SECRET
```

Create the database (and optionally the tables from the SQL file):

```sh
mysql -u root -e "CREATE DATABASE IF NOT EXISTS kashmir_connect CHARACTER SET utf8mb4;"
mysql -u root kashmir_connect < drizzle/0000_init.sql
```

Or let Drizzle build the tables straight from the schema:

```sh
npm run db:push
```

Then seed the 12 launch stories plus your first admin account:

```sh
npm run db:seed
```

Run it:

```sh
npm run dev        # http://localhost:4000
```

Prefer Docker for MySQL? `docker compose up -d` starts MySQL on port **3307**;
point `DATABASE_URL` at that port.

```sh
DATABASE_URL=mysql://root@127.0.0.1:3307/kashmir_connect
```

## Environment variables

| Variable                                                       | Required | Notes                                        |
| -------------------------------------------------------------- | -------- | -------------------------------------------- |
| `DATABASE_URL`                                                 | yes      | `mysql://user:pass@host:port/database`       |
| `JWT_SECRET`                                                   | yes      | At least 32 chars. `openssl rand -base64 48` |
| `PORT`                                                         | no       | Defaults to `4000`                           |
| `CORS_ORIGINS`                                                 | no       | Comma separated browser origins, or `*`      |
| `JWT_EXPIRES_IN`                                               | no       | Defaults to `7d`                             |
| `BCRYPT_ROUNDS`                                                | no       | Defaults to `10`                             |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` | no       | Used by `npm run db:seed`                    |

## API

Base URL: `http://localhost:4000`. All responses are JSON. Success bodies are
`{ "data": ... }` (`+ "meta"` on list endpoints); errors are
`{ "error": { "message": "...", "details?": ... } }`.

### Public

| Method | Path                      | Description                                                                        |
| ------ | ------------------------- | ---------------------------------------------------------------------------------- |
| `GET`  | `/api/health`             | Liveness + database check                                                          |
| `GET`  | `/api/stories`            | Published stories. Query: `category`, `featured`, `q`, `limit` (max 100), `offset` |
| `GET`  | `/api/stories/categories` | Distinct category names                                                            |
| `GET`  | `/api/stories/:slug`      | Single published story                                                             |

Only rows with `published_at <= now` are ever returned publicly.

```sh
curl "http://localhost:4000/api/stories?category=Kashmir&limit=5"
curl "http://localhost:4000/api/stories/valley-speaks-to-world"
```

### Auth

| Method | Path              | Description                                           |
| ------ | ----------------- | ----------------------------------------------------- |
| `POST` | `/api/auth/login` | `{ email, password }` to `{ data: { token, admin } }` |
| `GET`  | `/api/auth/me`    | Current admin (requires token)                        |

```sh
curl -X POST http://localhost:4000/api/auth/login \
  -H "content-type: application/json" \
  -d '{"email":"admin@gktv.local","password":"ChangeMe123!"}'
```

Login is rate limited to 20 attempts per 15 minutes per IP.

### Admin (requires `Authorization: Bearer <token>`)

| Method   | Path                     | Description                        |
| -------- | ------------------------ | ---------------------------------- |
| `GET`    | `/api/admin/stories`     | All stories, including unpublished |
| `POST`   | `/api/admin/stories`     | Create a story                     |
| `GET`    | `/api/admin/stories/:id` | Fetch by id                        |
| `PUT`    | `/api/admin/stories/:id` | Partial update                     |
| `DELETE` | `/api/admin/stories/:id` | Delete (204 on success)            |

Story payload fields: `slug`, `category`, `title`, `summary`, `author`,
`image_key`, `featured`, `display_order`, `published_at` (optional ISO date,
defaults to now). `slug` is unique and lowercase-dashed.

```sh
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "content-type: application/json" \
  -d '{"email":"admin@gktv.local","password":"ChangeMe123!"}' | jq -r .data.token)

curl -X POST http://localhost:4000/api/admin/stories \
  -H "authorization: Bearer $TOKEN" -H "content-type: application/json" \
  -d '{"slug":"new-dispatch","category":"Kashmir","title":"A new dispatch","summary":"Short standfirst.","author":"Aamir Sofi","image_key":"lead","featured":false,"display_order":13}'
```

## Studio (admin UI)

The editor interface lives in the main app at `/admin`, and talks to the admin
endpoints above with a token kept in `localStorage`.

- `/admin` lists every story, live and scheduled, with search and filters.
- `/admin/new` creates a story. `/admin/:id` edits or deletes one.
- Sign in with an account created by `npm run db:seed`.

There is no public link to `/admin`; navigate to it directly. A story's status is
derived from `published_at`: a future date keeps it hidden from the public API
until that time, which is why the UI says "Scheduled" rather than "Draft".

## Project layout

```
server/
├── drizzle/0000_init.sql        # reference DDL
├── docker-compose.yml           # optional local MySQL
└── src/
    ├── app.ts                   # express app + middleware wiring
    ├── index.ts                 # bootstrap + graceful shutdown
    ├── env.ts                   # validated environment
    ├── db/                      # drizzle schema + pool
    ├── lib/                     # jwt, password, http error
    ├── middleware/              # auth, validation, error handling
    ├── modules/                 # auth + stories (routes/controller/service/schema)
    └── scripts/seed.ts          # launch content + first admin
```

## Notes

- `image_key` selects one of the four bundled photographs and is validated as an
  enum: `lead`, `artisan`, `lake`, `sport`. Uploads are not supported yet, so an
  unknown key is rejected with a 422 instead of rendering the wrong photo.
- Timestamps are stored and returned as UTC. The MySQL pool runs with
  `timezone: "Z"` so `published_at` round-trips cleanly.
- To add a module, mirror `modules/stories/`: a Zod schema, a service for
  queries, a thin controller, and a router.
