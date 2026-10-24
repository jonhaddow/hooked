-- Made-up data for the end-to-end tests.
INSERT INTO user (email, name) VALUES ('alex@example.com', 'Alex'), ('sam@example.com', 'Sam');
INSERT INTO pattern (slug, title, designer, data, created_at) VALUES ('test-bear', 'Test Bear', 'Someone', '{
	"slug": "test-bear",
	"title": "Test Bear",
	"designer": "Someone",
	"notes": ["US terms."],
	"materials": ["Yarn", "4 mm hook"],
	"terms": [
		{ "abbr": "sc", "meaning": "Single crochet" },
		{ "abbr": "inc", "meaning": "Increase", "how": ["Two sc in the same stitch."] }
	],
	"sections": [
		{
			"id": "head",
			"name": "Head",
			"steps": [
				{ "id": "r1", "label": "Rnd 1", "text": "6 sc in a magic ring", "count": 6 },
				{ "id": "r2", "label": "Rnd 2-4", "text": "sc around", "count": 6, "times": 3 },
				{ "id": "fo", "text": "Fasten off.", "tip": "Leave a long tail." }
			]
		},
		{
			"id": "ear",
			"name": "Ears",
			"make": 2,
			"steps": [{ "id": "r1", "label": "Rnd 1", "text": "6 inc", "count": 12 }]
		}
	]
}', '2026-10-24T00:00:00.000Z');
