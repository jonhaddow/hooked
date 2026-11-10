# Hooked

Crochet patterns as tick-off checklists, as a phone web app.

Each round or step of a pattern gets a tick, repeated rounds count up a tap at a time, and the page opens at the next step, so you never lose your place. Abbreviations can be tapped for their meaning and how-to, and a projects list keeps notes on what everyone is making.

## Tech stack

- [SvelteKit](https://svelte.dev) (Svelte 5) and TypeScript, as an installable PWA
- [Cloudflare Workers](https://workers.cloudflare.com), with [D1](https://developers.cloudflare.com/d1/) (SQLite) through [Drizzle ORM](https://orm.drizzle.team), photos included
- Google sign-in ([Arctic](https://arcticjs.dev)) for an allowlist of users
- [Tailwind CSS](https://tailwindcss.com) and [shadcn-svelte](https://shadcn-svelte.com)
- [Vitest](https://vitest.dev) and [Playwright](https://playwright.dev) for tests
- Deployed from `main` by Cloudflare Workers Builds

## Development

See [`docs/development.md`](docs/development.md) for running it locally, configuration and deploying.
