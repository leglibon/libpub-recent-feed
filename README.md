# libpub-recent-feed

Produces `recent.json` — a small, keyless, publicly-cacheable feed of the
most recently published guides from the Library Publications
site. The homepage's "Recently published"
section fetches this file directly from jsDelivr; it never talks to the
LibGuides API itself, so no API key is ever exposed in the page source.

## How it fits together

```
LibGuides Guides API  →  build-feed.mjs  →  recent.json  →  jsDelivr CDN  →  homepage fetch()
       (needs key)         (GitHub Action)      (this repo)    (public, keyless)
```

- **`build-feed.mjs`** — fetches the newest published guides across the
  site's four publication lines (Research Papers, PAB, Visualized Data,
  Collection Resources) via the LibGuides v1.1 Guides API, keeps the top 5
  by `published` date, merges in a `thumbnail` URL from `thumbnails.json`
  where one exists, and writes `recent.json`.
- **`.github/workflows/feed.yml`** — runs `build-feed.mjs` nightly, on any
  push to `thumbnails.json`, or on demand (Actions tab → "Run workflow").
  Commits `recent.json` if it changed, then purges the jsDelivr cache for
  it so updates show up within a minute or two instead of jsDelivr's
  normal ~half-day cache window.
- **`thumbnails.json`** — a hand-maintained lookup of `friendly_url` →
  cover image URL, for publications that have a unique cover. Anything
  without an entry here falls back to a generic, colour-coded tile on the
  homepage 
- **`recent.json`** — the actual output. Served via:
  `https://cdn.jsdelivr.net/gh/leglibon/libpub-recent-feed@main/recent.json`

## Updating a thumbnail

1. Find the image url in the Image Manager
2. Edit `thumbnails.json` on github.com (pencil icon → edit → commit to
   `main`). Key is the full URL, value is the cover image's URL.
3. Committing to `main` triggers a rebuild automatically. Check the
   **Actions** tab for a new run (triggered by `push`, not `Scheduled`).
4. Give it a minute or two for the build + jsDelivr purge, then hard
   refresh the live homepage to confirm.

If a run fails, click into it in the Actions tab and read the failing
step's log — the two `node -e` steps in `feed.yml` are the most likely
place to check first.

## Repo visibility

**Must stay public.** jsDelivr does not serve files from private GitHub
repos — making this repo private would silently break the entire
Recently Published feed on the homepage, not just thumbnails. The
`LIBGUIDES_KEY` secret is safe either way: GitHub Actions secrets are
encrypted and never appear in the repo's files or history, regardless of
visibility.

## Secrets

- `LIBGUIDES_KEY` — LibGuides API key, used only inside the Action to
  call the Guides API. Never appears in `recent.json` or anywhere in this
  repo's committed files.
