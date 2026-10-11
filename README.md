# Meditation Timer (mindfuljoy.app) - export package

A fully static website: plain HTML, CSS and JavaScript. There is no server code, database, or build step.

## Files

```
index.html            Timer, Breathe and Reflect tools
about.html            About page (features, credits and licenses)
privacy.html          Privacy Policy
terms.html            Terms of Service
ads.txt               Google AdSense publisher line (keep the filename lowercase) (pub-8467685368663778)
robots.txt            Search engine rules (points to the sitemap)
sitemap.xml           The four pages, using https://mindfuljoy.app
assets/
  css/styles.css      All styling
  js/themes.js        The 23 color themes (loaded on every page)
  js/app.js           Timer, bells, breathing pacer, settings (index.html only)
  js/site.js          Theme menu and Back to top button for the About, Privacy and Terms pages
  audio/*.mp3         Five CC0 bell recordings
  audio/CREDITS.txt   Recording credits and license details
  favicon.svg         Site icon
```

## Deploying

Upload the contents of this folder to the root of any static host (Netlify, Cloudflare Pages, GitHub Pages,
Vercel, an S3 bucket, or ordinary web hosting) and point mindfuljoy.app at it. Serve it over HTTPS.

To test on your computer, run `python3 -m http.server` inside this folder and open http://localhost:8000.
Opening index.html by double-clicking (a file:// address) works, but browsers block loading the bell audio
that way, so the app falls back to simple synthesized tones. Use a local server or deploy to hear the real bells.

## Google AdSense

The AdSense loader script (publisher ca-pub-8467685368663778) is already in the `<head>` of every page, and
`ads.txt` contains your publisher line. Search the files for `ADSENSE AD SLOT` to find the comments that mark
where to paste ad units once you create them in AdSense:

1. `index.html`: AD SLOT 1, below the tools and above the footer.
2. `about.html`, `privacy.html`, `terms.html`: an ad slot at the end of the article.

The About, Privacy and Terms pages already disclose that the site uses advertising (Google AdSense, cookies,
and opt-out links). If you serve visitors in the EEA, UK or Switzerland, also turn on a consent message in
your AdSense account (Privacy & messaging) so personalized ads are only served with consent. Re-read the
Privacy Policy if you add other services later, such as analytics.

Keep ads clear of the play, pause and reset buttons so they are not tapped by accident.

## Color themes

There are 23 themes in three groups (Light, Dark, High Contrast). They all live in `assets/js/themes.js`.
Each theme is one line with an `id`, a `group`, a `name` and its colors. To add or change a theme, edit that
file only: the menu on every page builds itself from it. Keep the `id` values of existing themes unchanged,
because visitors' saved choices refer to them. For readable text, keep the dim and accent colors at least
4.5:1 against the background.

## License

The code in this repository (HTML, CSS and JavaScript) is released under the MIT License. See the `LICENSE` file.

Third-party assets keep their own licenses:

- **Bell recordings** (`assets/audio/*.mp3`): Creative Commons CC0 1.0 (public domain). Credits and sources are in `assets/audio/CREDITS.txt`.
- **Inter typeface**: SIL Open Font License 1.1, loaded from Google Fonts.

## Notes

- Visitors' settings are saved in their own browser (localStorage). Nothing is sent to a server.
- The only outside request the pages make is the Inter font from Google Fonts. To remove it, self-host
  the font and delete the Google Fonts `<link>` tags.
- The Ko-fi link and contact email are set in the Donations button (every page header) and in about.html,
  privacy.html and terms.html.
