# Kashmir Connect

so i want you to make a fuki anz crazy website news type of website with both frontedn and backedn one thing u ahev to amke sure tahtd eisgn need to be good as hell ux need to impresosv easy ui need to be top nothc add small interactone animation use must feeel the website when scrolling suing also teh deisg wise do make sure it looks good on mobile devsices bcz opften a website os godo from big screen but fucked up in small devices


here are the kind of req:


🌍 GLOBAL KASHMIR TV

Kashmir. Connected to the World.

Main Menu

Home | News | Kashmir | Pakistan | World | Live | Shows | Videos | Tourism | Sports | Heritage | Library

🔴 Hero Section

KASHMIR, CONNECTED.

News. Stories. Heritage. People.

[ WATCH LIVE ]  [ EXPLORE GKTV ]

Homepage Sections

🔴 LIVE NOW

Watch Global Kashmir TV

📰 TOP STORIES

Kashmir • Pakistan • World

🏔️ KASHMIR

People • Issues • Future

🌍 GLOBAL

News from Around the World

📺 SHOWS & VIDEOS

Interviews • Analysis • Originals

🏞️ TOURISM

Discover Kashmir

🏆 SPORTS

Kashmir’s Sporting Spirit

📚 LIBRARY

History • Heritage • Knowledge

Brand Closing Line

Global Kashmir TV

See Kashmir. Hear Kashmir. Understand Kashmir.

## Backend

The site is served by a standalone **Express + MySQL** API that lives in [`server/`](./server).
See [`server/README.md`](./server/README.md) for the full API reference.

```sh
npm run server:install                                  # install backend dependencies
cp server/.env.example server/.env                      # set DATABASE_URL + JWT_SECRET

mysql -u root -e "CREATE DATABASE IF NOT EXISTS kashmir_connect CHARACTER SET utf8mb4;"
npm --prefix server run db:push                         # or: mysql -u root kashmir_connect < server/drizzle/0000_init.sql
npm run server:seed

npm run server:dev                                      # API on http://localhost:4000
npm run dev                                             # frontend on http://localhost:8080
```

The frontend reads the API base URL from `VITE_API_URL` (see [`.env.example`](./.env.example)).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/99db3228-3714-497e-afd9-11bfaab11092).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
