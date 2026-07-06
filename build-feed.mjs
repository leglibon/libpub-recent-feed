// build-feed.mjs — APPROACH A (nightly static JSON)
// Runs in GitHub Actions (Node 20+). Reads the API key from an env secret,
// pulls the newest PUBLISHED guides across the four lines, trims to just the
// fields the page needs, and writes recent.json. The key never appears in
// the output file — only in the Actions secret.
//
// Run locally to test:  LIBGUIDES_KEY=xxxx node build-feed.mjs

import { writeFileSync } from "node:fs";

const SITE_ID = "7829";
const KEY     = process.env.LIBGUIDES_KEY;          // set as a GitHub Actions secret
const GROUPS  = ["13904", "9221", "15789", "14648"]; // RP, PAB, Visualized Data, Collection Resources
const MAX     = 5;

if (!KEY) throw new Error("LIBGUIDES_KEY env var is not set");

const url =
  "https://lgapi-ca.libapps.com/1.1/guides/" +
  `?site_id=${SITE_ID}` +
  `&key=${encodeURIComponent(KEY)}` +
  "&status=1&sort_by=published" +
  `&group_ids=${GROUPS.join(",")}`;

const res = await fetch(url);
if (!res.ok) throw new Error("LibGuides API returned " + res.status);

const data = await res.json();
const guides = Array.isArray(data) ? data : (data.guides || []);

const items = guides
  .filter((g) => GROUPS.includes(String(g.group_id)) && g.published)
  .sort((a, b) => String(b.published).localeCompare(String(a.published)))
  .slice(0, MAX)
  .map((g) => ({
    group_id: g.group_id,
    name: g.name,
    friendly_url: g.friendly_url || g.url,
    published: g.published,
  }));

writeFileSync("recent.json", JSON.stringify(items, null, 2));
console.log(`Wrote recent.json with ${items.length} item(s).`);
