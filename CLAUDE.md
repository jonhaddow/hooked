# Hooked

Crochet patterns as checklists, like a cookbook app: each round or step is ticked off, repeated rounds count up, "Make 4" parts are ticked per copy, and abbreviations open their how-to. A PWA at https://hooked.app.haddow.me, for Jon's household.

Stack, workflow, commands and shared gotchas: the `app-stack` skill.

## Worth knowing

- `src/lib/pattern.ts` is the pattern shape and the progress maths (totals, next step, abbreviation links): pure and unit tested, keep it that way.
- Patterns are bought, so they never go in git: `patterns/<slug>/` (gitignored) holds `pattern.json` and its photos. The `import-pattern` skill (`.claude/skills/`) turns a PDF into one and loads it.
- Re-importing keeps everyone's ticks as long as section and step ids don't change; progress keys are `<section>/<copy>/<step>`.
- Pattern photos are base64 in D1's `image` table, served to signed-in people only.

## Review focus

Progress keys staying stable across re-imports, ticks saving in order (the page queues them), D1 limits in the import script.
