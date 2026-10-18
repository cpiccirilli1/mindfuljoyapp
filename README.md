# Mindful Joy (mindfuljoy.app)

A free meditation timer, breathing pacer and reflection tool. It is a fully static website: plain HTML, CSS and
JavaScript, with no server code, database or build step. Open source under the MIT License.

## Features

- **Timer:** 5 to 60 minute sessions, a custom length, or a **sit and walk sequence** made of up to 12 segments
  (each Sit or Walk, 1 to 120 minutes) with presets, saved layouts and a bell between segments.
- **Bells:** five real CC0 bell recordings, start and end bells (1 to 5 strikes), a fixed higher-toned interval
  bell (repeating or custom times), volume, a preparation delay, and an optional vibration at the start and end
  (off by default; needs a browser that supports the Vibration API, which most iPhones lack).
- **Breathe:** box, 4-7-8 and coherent breathing pacer. **Reflect:** reflection prompts.
- **More ▾:** a menu of extra timers. **Pomodoro** (focus, short and long breaks, rounds, auto-start, a faint
  theme-tinted tomato behind the ring), **Count Up** (open-ended, optional interval chime) and **Stopwatch**
  (hundredths of a second and up to 99 laps). Only one timer runs at a time.
- **25 color themes** (Light, Dark, High Contrast, and two Pride themes with seven-segment rainbow timer rings), keyboard shortcuts, screen reader announcements, and a screen
  wake lock during sessions.
- Header menu (Timer, Articles, About, Privacy Policy, Terms of Service; on phones it also holds Donations), a
  dismissible updates strip under the header, and a cookie notice.
- **Works offline and installs** to the home screen or desktop (web app manifest and a service worker).
- About page with credits, the open source notice and a land acknowledgement linking to native-land.ca.

## Files

```
index.html            Timer, Breathe, Reflect, Pomodoro, Count Up and Stopwatch tools
articles.html         Articles page (placeholder for now, set to noindex)
about.html            About page (features, credits and licenses)
privacy.html          Privacy Policy
terms.html            Terms of Service
ads.txt               Google AdSense publisher line (keep the filename lowercase) (pub-8467685368663778)
robots.txt            Search engine rules (points to the sitemap)
sitemap.xml           The public pages, using https://mindfuljoy.app
manifest.webmanifest  Web app manifest (name, colors, icons) so the site can be installed
sw.js                 Service worker: saves the site for offline use (network first; bump CACHE_VERSION to clear old copies)
wrangler.jsonc        Cloudflare Workers static-assets config (see Deploying)
.assetsignore         Repo files that Cloudflare should NOT publish on the site
LICENSE               MIT License
TODO.txt              Planned work (not published on the site)
assets/
  css/styles.css      All styling
  js/themes.js        The 25 color themes (loaded on every page)
  js/app/             The timer page (index.html only), written as ES modules: index.html loads
                        main.js, and each file imports what it needs. One file per feature:
                        timer, sequence, sequence-editor, intervals, audio, bell-settings, tabs,
                        pomodoro, countup, stopwatch, breathing, reflect, theme-menu, shortcuts,
                        storage, plus small shared ones (dom, state, display, wake, activity)
  js/menu.js          Header menu button and the updates strip (every page)
  js/consent.js       Cookie notice banner (every page)
  js/site.js          Theme menu and Back to top button for the About, Privacy, Terms and Articles pages
  js/pwa.js           Registers the service worker (every page)
  js/preview.js       Shows a "Preview build" tag and [Preview] tab title on any address other than mindfuljoy.app
                      (checks the address, not the branch, so merging to main never marks production;
                      edit LIVE_HOSTS if the live address changes)
  audio/*.mp3         Five CC0 bell recordings
  audio/CREDITS.txt   Recording credits and license details
  favicon.svg         Site icon (the lotus flower)
  icons/              App icons (icon.svg is the source; PNG sizes are rendered from icon-full.svg)
```

## Deploying

The live site is a Cloudflare Workers project (`gentle-mountain-87c6`) that builds from this GitHub repository
and serves the repository root as static assets, on https://mindfuljoy.app.

- **`main` branch:** every push to `main` goes live on mindfuljoy.app.
- **Other branches (for example `dev`):** every push builds a preview at its own address, found in the
  Cloudflare dashboard under the project's Deployments. The live site is not touched.
- **Suggested workflow:** make changes on `dev`, check the preview (it shows a "Preview build" tag), then merge
  `dev` into `main` to publish.

`wrangler.jsonc` holds the Worker name, a compatibility date, the assets folder (`./`) and an empty `previews`
block, which the non-production deploy command (`npx wrangler preview`) requires. `.assetsignore` keeps
`wrangler.jsonc`, itself and `TODO.txt` off the live site. Note that `README.md` and `LICENSE` are published
along with everything else.

The files can also be uploaded to any other static host. Serve them over HTTPS.

To test on your computer, run `python3 -m http.server` inside this folder and open http://localhost:8000.
Opening index.html by double-clicking (a file:// address) works, but browsers block loading the bell audio
that way, so the app falls back to simple synthesized tones. Use a local server or deploy to hear the real bells.

## Google AdSense

The AdSense loader script (publisher ca-pub-8467685368663778) is in the `<head>` of every page, and
`ads.txt` contains the publisher line. Search the files for `ADSENSE AD SLOT` to find the comments that mark
where to paste ad units once they are created in AdSense:

1. `index.html`: AD SLOT 1, below the tools and above the footer.
2. `about.html`, `privacy.html`, `terms.html`: an ad slot at the end of the article.

Plans: after approval, place ad units on content pages only, and keep them clear of the play, pause and reset
buttons so they are not tapped by accident. The Privacy Policy and Terms already disclose advertising.

**Cookie notice.** `assets/js/consent.js` shows a banner on every page until the visitor chooses Accept (the
choice is saved in the browser and the banner stops appearing) or Reject (the visitor is sent to google.com).
It is a notice only: the AdSense script still loads on every page. After AdSense approves the site, replace it
with AdSense's own consent message (AdSense, Privacy & messaging), which is the tool meant for visitors in the
EEA, UK and Switzerland, and update Privacy Policy section 5 to match.

**Articles.** `articles.html` is a placeholder with `noindex`. When real articles are published, remove the
`noindex` tag and add the pages to `sitemap.xml`.

## Header menu and updates strip

`assets/js/menu.js` builds the menu from the `PAGES` list at the top of the file, so a new page is one line.
The updates strip directly under the header is set by the `UPDATE` object in the same file (`text`, `href`,
`linkText`). It shows on every page load, and its close button only hides it until the next load.

## Color themes

There are 25 themes in four groups (Light, Dark, High Contrast, Pride). They all live in `assets/js/themes.js`.
Each theme is one line with an `id`, a `group`, a `name` and its colors. The Pride themes also have a `rainbow` list of seven colors (red to violet) that draws the segmented timer rings, plus a `header` gradient; leave `rainbow` out and a theme gets the normal single-color ring. To add or change a theme, edit that
file only: the menu on every page builds itself from it. Keep the `id` values of existing themes unchanged,
because visitors' saved choices refer to them. For readable text, keep the dim and accent colors at least
4.5:1 against the background.

## License

The code in this repository (HTML, CSS and JavaScript) is released under the MIT License. See the `LICENSE` file.

Third-party assets keep their own licenses:

- **Bell recordings** (`assets/audio/*.mp3`): Creative Commons CC0 1.0 (public domain). Credits and sources are in `assets/audio/CREDITS.txt`.
- **Inter typeface**: SIL Open Font License 1.1, loaded from Google Fonts.
- **Icons and logo** (lotus flower, tomato): original artwork made for this project, covered by the MIT License.

## Notes

- Visitors' settings are saved in their own browser (localStorage): `still.settings.v1` (preferences and the
  current sit/walk segments), `still.layouts.v1` (saved layouts) and `mj.consent.v1` (cookie notice choice).
  Nothing is sent to a server by the site itself. The service worker also keeps a saved copy of the site's own
  files in the browser (cache `mj-v5`; bump `CACHE_VERSION` in `sw.js` when the file list changes). The settings
  record also holds the Pomodoro and Count Up options and the vibration switch.
- Outside requests the pages make: the Inter font from Google Fonts, and Google AdSense. To remove the font
  request, self-host the font and delete the Google Fonts `<link>` tags.
- The Ko-fi link and contact email are set in the Donations button (every page header) and in about.html,
  privacy.html and terms.html.
