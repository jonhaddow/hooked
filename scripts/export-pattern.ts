// Rebuilds patterns/<slug>/ (pattern.json and its photos) from D1, for editing
// a pattern when the laptop's copy is gone. The reverse of import-pattern.ts.
// Usage: node scripts/export-pattern.ts <slug> --remote|--local [more wrangler flags]
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const [slug, ...flags] = process.argv.slice(2);
if (!slug || !flags.length) {
	console.error('Usage: node scripts/export-pattern.ts <slug> --remote|--local');
	process.exit(1);
}
if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('Slugs are lowercase words and dashes');

function query<T>(sql: string): T[] {
	const out = execFileSync(
		'npx',
		['wrangler', 'd1', 'execute', 'hooked', ...flags, '--json', `--command=${sql}`],
		{ encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
	);
	return (JSON.parse(out) as { results: T[] }[])[0].results;
}

const [row] = query<{ data: string }>(`SELECT data FROM pattern WHERE slug = '${slug}'`);
if (!row) throw new Error(`No pattern ${slug}`);
const dir = `patterns/${slug}`;
mkdirSync(`${dir}/images`, { recursive: true });
writeFileSync(`${dir}/pattern.json`, JSON.stringify(JSON.parse(row.data), null, '\t') + '\n');

const images = query<{ key: string; data: string }>(
	`SELECT key, data FROM image WHERE key LIKE '${slug}/%'`
);
for (const { key, data } of images)
	writeFileSync(`${dir}/images/${key.slice(slug.length + 1)}.jpg`, Buffer.from(data, 'base64'));
console.log(`Exported ${slug} with ${images.length} photos to ${dir}`);
