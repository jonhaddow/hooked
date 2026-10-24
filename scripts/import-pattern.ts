// Loads a pattern into D1: patterns/<slug>/pattern.json (the Pattern type in
// src/lib/pattern.ts) and its photos in patterns/<slug>/images/*.jpg.
// Re-importing keeps people's ticks, as long as section and step ids stay put.
// Usage: node scripts/import-pattern.ts <slug> --local|--remote [more wrangler flags]
// Patterns are bought, so patterns/ stays out of git.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const [slug, ...flags] = process.argv.slice(2);
if (!slug || !flags.length) {
	console.error('Usage: node scripts/import-pattern.ts <slug> --local|--remote');
	process.exit(1);
}

type Named = { images?: string[] };
const dir = `patterns/${slug}`;
const pattern = JSON.parse(readFileSync(`${dir}/pattern.json`, 'utf8')) as {
	slug: string;
	title: string;
	designer: string;
	cover?: string;
	terms: Named[];
	sections: { id: string; steps: ({ id: string } & Named)[] }[];
};
if (pattern.slug !== slug) throw new Error(`pattern.json's slug is ${pattern.slug}`);

const files = readdirSync(`${dir}/images`).filter((f) => f.endsWith('.jpg'));
const names = new Set(files.map((f) => f.slice(0, -4)));
const used = [
	pattern.cover,
	...pattern.terms.flatMap((t) => t.images ?? []),
	...pattern.sections.flatMap((s) => s.steps.flatMap((st) => st.images ?? []))
].filter((n): n is string => !!n);
const missing = used.filter((n) => !names.has(n));
if (missing.length) throw new Error(`Missing images: ${missing.join(', ')}`);
for (const s of pattern.sections) {
	const ids = s.steps.map((st) => st.id);
	if (new Set(ids).size !== ids.length) throw new Error(`Repeated step id in ${s.id}`);
}

const q = (s: string) => `'${s.replaceAll("'", "''")}'`;
const sql = [
	`INSERT INTO pattern (slug, title, designer, data, created_at) VALUES (${q(slug)}, ${q(pattern.title)}, ${q(pattern.designer)}, ${q(JSON.stringify(pattern))}, ${q(new Date().toISOString())})
	ON CONFLICT (slug) DO UPDATE SET title = excluded.title, designer = excluded.designer, data = excluded.data;`,
	`DELETE FROM image WHERE key LIKE ${q(`${slug}/%`)};`,
	// Only the photos the pattern uses.
	...[...new Set(used)].map(
		(n) =>
			`INSERT INTO image (key, type, data) VALUES (${q(`${slug}/${n}`)}, 'image/jpeg', '${readFileSync(`${dir}/images/${n}.jpg`).toString('base64')}');`
	)
].join('\n');

const out = `.wrangler/import-${slug}.sql`;
mkdirSync('.wrangler', { recursive: true });
writeFileSync(out, sql);
execFileSync('npx', ['wrangler', 'd1', 'execute', 'hooked', ...flags, `--file=${out}`], {
	stdio: 'inherit'
});
console.log(`Imported ${pattern.title} with ${new Set(used).size} photos.`);
