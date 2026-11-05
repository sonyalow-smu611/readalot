# The demo account and the code 111111 (for the team)

Not needed for grading: the professor's guide is [../README.md](../README.md).

## What it is

- **Demo account:** `demo@demo.ikda.app` / `Ikda-Demo-2026` / code `111111`. It is **Jordan Lee**
  (`@demo.reader`), a reader with a full town, shelf and room, made by `pnpm --filter readalot-server seed:demo`.
- **The code 111111.** An email on `demo.ikda.app` has no inbox, so `client/src/services/auth.js` accepts
  `111111` for it and signs in with the password the reader typed (Supabase still checks the password).
  Registering with such an address goes through `POST /api/demo-auth/register`
  (`server/src/routes/demoAuth.js`), which creates an already-confirmed account, so a professor can
  register with any `name@demo.ikda.app`. Every other email still gets a real emailed code.
- **Settings.** `DEMO_CODE_DOMAINS` (server) and `VITE_DEMO_CODE_DOMAINS` (client) list the domains.
  Unset means `demo.ikda.app`; set both to nothing to turn the feature off after the course. See
  `.env.example`. The client one is read when Vite builds, so rebuild after a change.
- **Deploying.** Both the client and the API must be deployed with this code for the live site to accept
  `111111`. Until then the live site only sends real codes.

## Seeding and resetting

Run against the Supabase project in `.env`:

```bash
pnpm --filter readalot-server seed:readers   # once: the fictional readers (Emma, Ayaan, Sofia, ...)
pnpm --filter readalot-server seed:demo      # the demo account: run it again before each demo or grading round
```

`seed:demo` only writes Jordan's rows, plus a few notes, messages, reviews and visits that mention Jordan,
and the "last online" time of four friends. It puts Emma and Ayaan back **online**, and resets the shelf,
XP, coins, friends, chats, notes, the bell's read and cleared marks, and the room. Set `DEMO_PASSWORD` to use another password.

What it makes: a finished profile (level 4, 620 XP, 600 coins), 10 books (3 finished and reviewed, 2
reading, 5 to be read), 4 friends (Emma and Ayaan online, Sofia away 12 days, Mei away 5 weeks) and a
request from Noah, chats with Emma and Ayaan, notes on the corkboard, visits in the bell, 3 saved quotes,
and a decorated room with 5 pieces left in the Inventory. The Daily tasks and streak are reset (the
`daily_state` row is deleted and made again when the town opens). Today's mood check-in is remembered by
each browser (localStorage), so it cannot be seeded: it appears the first time My Room opens in a browser.

## Live demo: an 8-minute order

1. Run `pnpm --filter readalot-server seed:demo`, then log in as `demo@demo.ikda.app` / `Ikda-Demo-2026` / `111111`.
2. **Town** (1 min): the weather chip, friends walking with their glow, Emma's and Ayaan's houses.
3. **Bell and Friends** (1 min): visits, Noah's request (accept it), the chat with Emma.
4. **Cafe** (1 min): match scores, Emma's profile, shared books.
5. **Visit Emma's room** (1 min): her corkboard, leave a note.
6. **My Room** (2 min): the bookshelf, open Dune, mark it finished (620 + 100 XP is level 5), then the
   Shop and Inventory.
7. **Salon** (1 min): restyle the character, save (confetti), the Profile tab.
8. **Library** (1 min): a genre bookcase, the help desk, the scanner.
