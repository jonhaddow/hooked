# Hooked

Crochet patterns as tick-off checklists, as a phone web app.

Each round or step of a pattern gets a tick, repeated rounds count up a tap at a time, and the page opens at the next step, so you never lose your place. Abbreviations can be tapped for their meaning and how-to, and a projects list keeps notes on what everyone is making.

## Tech stack

- [SvelteKit](https://svelte.dev) (Svelte 5) and TypeScript, as an installable PWA
- [Cloudflare Workers](https://workers.cloudflare.com), with [D1](https://developers.cloudflare.com/d1/) (SQLite) through [Drizzle ORM](https://orm.drizzle.team), photos included
- Google sign-in (OAuth with PKCE, shared code in [`auth`](https://github.com/jonhaddow/auth)) for an allowlist of users
- [Tailwind CSS](https://tailwindcss.com) and [shadcn-svelte](https://shadcn-svelte.com)
- [Vitest](https://vitest.dev) and [Playwright](https://playwright.dev) for tests
- Deployed from `main` by Cloudflare Workers Builds

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
