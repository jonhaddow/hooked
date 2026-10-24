---
name: import-pattern
description: Turn a crochet or knitting pattern PDF into a Hooked pattern (steps, photos, abbreviations) and load it into the app, or fix one already in. Use when Jon or Mollie sends a pattern PDF, asks to import or add a pattern, or reports a wrong step or photo.
---

# Import a pattern

A pattern is `patterns/<slug>/pattern.json` (the `Pattern` type in `src/lib/pattern.ts`) plus `images/<name>.jpg`, loaded straight into D1: no PR or deploy. `patterns/` is gitignored (patterns are bought), so work in `~/code/hooked`, not a worktree.

The PDF comes as an attachment.

Below, `$CF` stands for `CLOUDFLARE_API_TOKEN='op://Claude/Cloudflare/credential' op-claude run --`.

## 1. Pull the PDF apart

```sh
scripts/pdf-extract.py <file.pdf> <slug>    # slug like rose-dirt-baby
```

Read the `text.txt`, `pages.png` and `sheet.png` it names. Photos are `<page>-<n>`, `n` counting across the whole PDF; match them to steps by where they sit in `pages.png`, rendering a page bigger (`pdftoppm -r 40 -f N -l N -png`) when unsure.

## 2. Write pattern.json

Copy the shape of `patterns/rose-dirt-baby/pattern.json` (if missing: `$CF node scripts/export-pattern.ts rose-dirt-baby --remote`).

- `craft`: `"crochet"` or `"knitting"` (hooks and sc/dc → crochet; needles and k/p → knitting). It picks the list tab the pattern shows under; missing means crochet.
- A section per part, in making order; assembly and optional extras (face details, `optional: true`) are sections too. "Make 4" is `make: 4`.
- A step per round or per thing to tick: turns, slip stitches between rounds, stuffing, placing eyes. "Rnd 6–12" is one step with `times: 7`. Keep stitch instructions exactly as written; side notes become `tip`.
- Ids short and stable (`r1`, `turn`): ticks are keyed by them.
- Every abbreviation as a term, written as it appears in steps. Special stitches and techniques get `how`, `images` and `video` when the pattern has them.
- Photos on the step they show; finished-part photos on that part's last step. Pick a `cover`. Leave out shop blurb and social links.

## 3. Check locally, then show Jon

```sh
scripts/shot.sh / /tmp/warm.png    # starts the e2e server on a fresh database
node scripts/import-pattern.ts <slug> --local --persist-to .wrangler/e2e
scripts/shot.sh /p/<slug> /tmp/<slug>.png --full; scripts/shot.sh --stop
```

The import refuses missing photos and repeated ids. Show Jon a crop or two (Read; photos far down are lazy and show blank) and say which photo placements were guesses.

## 4. Load it live, after Jon's OK

```sh
$CF node scripts/import-pattern.ts <slug> --remote
```

To fix a pattern later, edit its JSON and import again: ticks survive if ids are unchanged. No local copy? `$CF node scripts/export-pattern.ts <slug> --remote` first.
