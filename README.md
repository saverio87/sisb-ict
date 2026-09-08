# SISB ICT

Class hub for Primary 4 ICT at SISB. Hosted on GitHub Pages.

## Structure

```
/                   → Main hub (links to everything)
/ui-ux-examples/    → Good vs Bad UI/UX interactive examples (4 pages)
/wordwall/          → Wordwall activities by week
```

## How to use

Push to `main` — GitHub Pages will serve the site at:
`https://<your-username>.github.io/sisb-ict/`

## Adding a new Wordwall link

1. Create the activity on [Wordwall](https://wordwall.net)
2. Open `wordwall/index.html`
3. Replace the `<span class="activity-link">Coming soon</span>` for that activity with:
   `<a class="activity-link live" href="YOUR_WORDWALL_URL" target="_blank">Open →</a>`
