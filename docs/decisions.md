# Decisions

- **A pattern is steps to tick, like a cookbook app** (October 2026): a tick per round or step, with its stitch count. Repeated rounds ("Rnd 6–12") are one step done 7 times, counted up a tap at a time (with Undo one), not 7 rows. "Make 4" sections show the same steps per copy (1 of 4, 2 of 4…), ticked separately. Tapping anywhere on a step ticks it; abbreviations and photos in it do their own thing.
- **Parsed by Claude Code, not in the app** (October 2026): there's no Anthropic API key, and a pattern only needs doing once. Claude Code reads the PDF (text and the embedded photos), writes `pattern.json` and matches photos to steps by their place on the page. Upload-and-parse in the app is on the roadmap.
- **Photos from the PDF next to each step**: many steps only make sense with the picture ("the white dots", where to sew a leaf). The PDF's embedded JPEGs are extracted, shrunk to 480px and stored in D1 (about 600 KB a pattern). Not R2: it needs a card, and the token has no R2 access.
- **Patterns stay out of git and behind sign-in**: they're bought, and their copyright allows personal use only. `patterns/` is gitignored, and photos are served to signed-in people only. robots.txt disallows everything.
- **Progress per person**: each person their own ticks, so two people can make the same pattern. Ticks show at once and are saved in order behind the scenes (`keepalive`, so leaving straight after a tap still saves).
- **Abbreviations link themselves**: any of the pattern's `terms` in a step is a dotted-underline button that opens a sheet with its meaning, how-to steps, photos and video link.
- **Optional parts** (face details) don't count towards the percentage, and come last for "Carry on".
- **Its own look**: Nunito, warm oatmeal and a rose red, like the yarn. Budget's floating tab bar.
- **No push notifications**: nothing time-based to remind about.
