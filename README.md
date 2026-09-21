# SISB ICT — Activity Hub

A growing library of ICT activities, games, worksheets, and resources for SISB Primary.
Hosted on GitHub Pages.

**Live site:** `https://saverio87.github.io/sisb-ict/`

---

## Structure

```
/
├── index.html              → the hub: topic cards + tag filters
├── assets/
│   ├── styles.css           → the design system (shared by every page)
│   ├── app.js               → filtering + card rendering
│   └── data/
│       └── activities.json  → the catalogue: every activity + its tags
├── activities/
│   ├── _template.html       → starter file for new activities
│   ├── networks/            → network games
│   ├── functions/           → function games
│   ├── data/                → data games
│   ├── ui-ux/               → UI/UX good-vs-bad examples
│   └── wordwall/            → Wordwall activity list
└── wordwall/                → redirect stub (old URL still works)
```

The hub is **data-driven**. `index.html` contains no activity listings —
it renders whatever is in `assets/data/activities.json`. Adding an activity
means adding one JSON entry, not editing HTML.

---

## Adding a new activity

### 1. Put the file in the right topic folder

```
activities/networks/my-new-game.html
```

If the topic is new, create the folder. Use lowercase, hyphens instead of spaces.

### 2. Add an entry to `assets/data/activities.json`

```json
{
  "id": "my-new-game",
  "title": "My New Game",
  "description": "One sentence telling students what they'll do.",
  "path": "activities/networks/my-new-game.html",
  "year_levels": ["upper primary"],
  "topic": "Networks",
  "type": "game",
  "tags": ["router", "packets"],
  "external": false
}
```

| Field | Notes |
|---|---|
| `id` | Unique slug. Must not repeat an existing one. |
| `title` | Shown on the card. |
| `description` | One line. Keep it short — it truncates on narrow screens. |
| `path` | Path **from the site root**. |
| `year_levels` | Array — `"lower primary"` or `"upper primary"` (or both). |
| `topic` | Groups activities together. New topics create a new filter chip automatically. |
| `type` | `game`, `activity`, `website`, `video`, `worksheet`, `slides`, or `other`. |
| `tags` | Free-form keywords. The first three show on the card. |
| `external` | `true` for off-site links (opens a new tab), `false` for local files. |

**Filter chips are generated from the data.** You never edit the filter bar —
add an entry with a new topic or year level and the chip appears by itself.

### 3. Starting a new activity page

Copy `activities/_template.html` into your topic folder, rename it, and fill it in.
It has the standard back-link, footer, and a placeholder for your activity.

**One thing to change:** the stylesheet path. The template sits one level up from
the topic folders, so its link reads `../assets/styles.css`. Once copied into a
topic folder it needs one more level:

```html
<link rel="stylesheet" href="../../assets/styles.css">
```

If your finished page loads with no styling, that path is almost always why.

### 4. Check it before pushing

```bash
# Validate the JSON — a syntax error here breaks the whole hub
python3 -c "import json; json.load(open('assets/data/activities.json'))"

# Preview locally (opening index.html directly won't work — see below)
python3 -m http.server 8000
# then visit http://localhost:8000
```

> **Why a server?** The hub loads `activities.json` with `fetch()`, and browsers
> block that when you open a file directly from disk. Over GitHub Pages — or any
> local server — it works normally. If you open it straight from disk you'll see
> a friendly message explaining this.

### 5. Publish

```bash
git add .
git commit -m "Add <activity name>"
git push
```

GitHub Pages redeploys within a minute or so.

---

## Filtering

The hub filters on three axes:

- **Year level** — lower primary, upper primary
- **Topic** — Networks, UI/UX, ...
- **Type** — game, activity, video, ...

Matching is **OR within a group**, **AND across groups**: selecting `upper primary` + `Networks`
shows upper primary network activities; adding `lower primary` widens it to either year level
in Networks.

Filtered views are shareable — the URL updates as you filter, e.g.
`.../#year=upper%20primary&topic=Networks`. Copy the address bar to send someone a specific view.

---

## Design system

`assets/styles.css` holds all shared styling as CSS custom properties at the top
of the file (`:root`). To retheme the whole site, change the tokens there —
colours, radii, shadows, fonts — and every page follows.

All activity pages should link it:

```html
<link rel="stylesheet" href="../../assets/styles.css">
```

The network, function, and data games are deliberately **self-contained** (no shared
CSS, no external requests) so they keep working offline. That's fine — they simply
don't participate in the design system.

---

## Old URLs

Moving files into `activities/` changed some URLs.

`ui-ux-examples/` has been removed — those old URLs no longer resolve. The
`wordwall/` redirect stub is still in place, pointing at
`activities/wordwall/index.html`. Once you're confident nothing links to the old
path any more, that stub can go too. If an old link does surface, the deleted
stubs are still in git history: