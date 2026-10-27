# Hooked

Crochet patterns as tick-off checklists, as a phone web app.

- Each round or step has a tick; repeated rounds ("Rnd 6–12") count up a tap at a time.
- "Make 4" parts are ticked off one copy at a time.
- Abbreviations in the steps can be tapped for their meaning, how-to and photos.
- Each step shows the pattern's photos for it.
- Progress is saved per person, and the page opens at the next step.
- Projects: notes on what each person is making, linked to a pattern or not.

Stack: SvelteKit (Svelte 5) on Cloudflare Workers, Drizzle ORM on Cloudflare D1 (photos included), Vitest and Playwright.

## Running locally

```sh
npm install
npm run db:migrate:local
npx wrangler d1 execute hooked --local --command "INSERT INTO user (email, name) VALUES ('you@example.com', 'You')"
cp .dev.vars.example .dev.vars
node scripts/import-pattern.ts <slug> --local   # a pattern in patterns/<slug>/
npm run dev    # the login page has dev-only "Sign in as" buttons
```

Tests: `npm test` (unit), `npm run test:e2e` (Playwright), `npm run check` (types), `npm run lint`.

## Adding a pattern

Patterns aren't in git (they're bought). Put `pattern.json` (the `Pattern` type in `src/lib/pattern.ts`) and its photos (`images/<name>.jpg`) in `patterns/<slug>/`, then `node scripts/import-pattern.ts <slug> --remote`.

## Sign-in

Google OAuth. Only emails in the `user` table can sign in.

## Configuration

Var in `wrangler.jsonc`: `GOOGLE_CLIENT_ID`. Secret (`wrangler secret put`): `GOOGLE_CLIENT_SECRET`.

## Deploying

Pushing to `main` deploys through Cloudflare Workers Builds, whose deploy command `npm run deploy:ci` applies D1 migrations first.

## Installing on a phone

Open https://hooked.app.haddow.me in Safari (iPhone) or Chrome (Android), sign in with Google, then Share → Add to Home Screen.
