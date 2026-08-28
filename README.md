# storage-kernel-pages

The one-page site for the **Storage Kernel** library family — `storage-kernel-py`
and `storage-kernel-js`.

Hand-authored HTML, CSS and vanilla JavaScript. No framework, no bundler. The
tooling is Node only.

Live at <https://storage-kernel.foggia.zip>.

## Run it

```bash
npm run build
npm run serve      # http://localhost:8000
```

`dist/index.html` also opens directly over `file://` — the stylesheet, the script
and the brand marks are all local or inline. Only the web fonts come from the
network.

`src/index.html` is **not** viewable on its own: it carries placeholders the build
fills in. Build first.

## Why there is a build

`dist/` is not a copy of `src/`. Everything `scripts/build.mjs` does is a reason
the step exists:

1. **The brand-mark sprite is generated and injected.** It is folded from
   `src/assets/logos/` at build time, so it exists only in `dist/` — neither
   inline in `src/index.html` nor as a generated file committed beside the
   source, which is also why it cannot go stale.
2. **`styles.css` and `app.js` get a content hash in their filename** —
   `styles.ab915a84.css` — so Pages can serve them with a long cache lifetime and
   still update the moment they change.
3. **`.nojekyll` is written**, without which Pages runs the files through Jekyll.
4. **With a domain configured**, `CNAME`, the canonical link, `og:url`,
   `robots.txt` and `sitemap.xml`. See below.

Nothing is minified. The page is ~102 KB of HTML and gzip on the wire does most of
what a minifier would, for none of the toolchain.

## The deploy target lives in one file

`site.config.json` holds the origin the site is served from:

```json
{ "url": "https://storage-kernel.foggia.zip" }
```

Five outputs depend on it, which is why it is one file rather than five literals:
`dist/CNAME`, `<link rel="canonical">`, `og:url`, `robots.txt` and `sitemap.xml`.
A site served from the wrong host in any one of them is worse than one with none
of them.

Leave `url` empty and the build says so and skips all five — fine for local
preview, and the deploy workflow refuses to run, because **Pages silently reverts
to `<user>.github.io` when the published artifact has no `CNAME`**.

Setting up the custom subdomain, once:

1. put the origin in `site.config.json`;
2. add a DNS `CNAME` record for the subdomain pointing at `<user>.github.io`;
3. in the repository, **Settings → Pages → Source: GitHub Actions**;
4. after the certificate is issued, **Settings → Pages → Enforce HTTPS**.

Asset references in the page are relative, so the build is also correct if you
ever serve it from a subpath such as `<user>.github.io/storage-kernel-pages/`.

## Structure

```text
src/                       hand-authored, the only thing you edit
├── index.html             the page, with placeholders for sprite and canonical
├── styles.css             tokens, layout, responsive rules
├── app.js                 the two toggles, copy buttons, nav highlighting
└── assets/
    └── logos/*.svg        official brand marks, as downloaded
dist/                      the built artifact — gitignored, never edited
site.config.json           the origin the site is served from
scripts/
├── build.mjs              src/ -> dist/
├── serve.mjs              serve dist/ for local preview
├── probe.js               the layout checks, injected into the page
├── verify.mjs             runs the checks via Playwright (the CI gate)
├── verify-local.mjs       runs the same checks via Windows Chrome (this WSL box)
├── shots.mjs              screenshots of dist/ into tmp/final/
└── lib/
    ├── config.mjs         paths, widths, thresholds, storage keys
    ├── sprite.mjs         folds the logo SVGs into one <symbol> sprite
    ├── site.mjs           reads and validates site.config.json
    ├── report.mjs         turns a probe report into a verdict
    └── win-chrome.mjs     driving the Windows Chrome WSL can reach
.github/workflows/
├── ci.yml                 build + verify on push and PR
└── deploy.yml             publish dist/ to Pages when ci succeeds on main
```

`probe.js` keeps the `.js` extension because it is injected into the page and runs
in the browser; it is not a Node module.

Design records, kept because they explain the code: `design-spec.md` (the content
brief), `direction-approved.md` (what was chosen, what was inherited from the
family, and the two things decided here), `brand-spec.md` (which marks are used,
where they came from, and what was verified against the registries).

### What is not here

The design drafts and the palette set are **not** in this repository. They belong
to the four sites the family will have, not to this one, so they live in the
sibling `lib-family` repository:

- `lib-family/pages/directions/` — the three directions that were proposed
- `lib-family/pages/palettes/` — the four palette variants, as renderable HTML
- `lib-family/docs/paletas.md` — the token values, measured contrast, and which
  library owns which palette

This repository keeps only the decision record for *this* page.

## The two toggles

The page carries two independent switches, both remembered in `localStorage`
under `stk.code` and `stk.lang`:

- **Python ↔ TypeScript** — swaps every code sample *and* the identifier names in
  the prose, following the mapping the api-reference documents in both
  repositories declare normative (`read_content ↔ readContent`,
  `include_directories ↔ includeDirectories`, `known_hosts_path ↔ knownHostsPath`,
  and so on). Real differences are preserved rather than smoothed over: Python
  takes frozen dataclasses, TypeScript takes object literals.
- **EN ↔ PT-BR** — swaps the prose.

Both switch through a CSS attribute selector on `<html>`, so the page is readable
with JavaScript disabled; it just stays on the defaults (EN, Python).

### Linking to a specific view

Both toggles can be set from the URL:

```text
https://storage-kernel.foggia.zip/?code=py#changelog
https://storage-kernel.foggia.zip/?code=ts
https://storage-kernel.foggia.zip/?lang=pt
```

Precedence is **query, then `localStorage`, then the attribute in the markup** —
an explicit link beats a remembered preference, which beats the default. This
exists so the published package metadata can link here and a reader arriving from
PyPI sees Python whatever they last clicked.

An unrecognised value is ignored rather than applied, and the choice is then
remembered like any other. The page keeps a parameter that is **already** in the
URL truthful when you click a toggle, so copying the address shares what is on
screen — but it never adds one that was not there.

`npm run verify` seeds `localStorage` with the opposite value and asserts the
query still wins, so this cannot rot silently.

## Verifying a change

```bash
npm run check-all      # build + verify — the CI gate
npm run shots          # screenshots into tmp/final/ to eyeball
```

At eight viewport widths from 1440 down to 360, the verifier checks:

- horizontal overflow, and any element escaping the viewport (code blocks and
  wide tables are exempt — they scroll inside their own container);
- that both toggles actually swap content, rather than only flipping an attribute;
- that within one parent each language variant appears the **same number of
  times**, so a missing translation cannot hide in one of the four toggle
  combinations. A parent that is legitimately uneven declares `data-uneven`;
- that no rendered text falls below 12px, the floor `design-spec.md` sets;
- that no interactive target is under 24px tall (WCAG 2.2 AA, Target Size Minimum);
- that the built page carries all seven brand symbols and every `<use>` resolves;
- that every required section id still exists and no in-page link points at
  nothing.

Console errors fail the run too.

### Two harnesses, one set of checks

The measurements live in `scripts/probe.js` and the verdict in
`scripts/lib/report.mjs`. Two harnesses load both:

- **`npm run verify`** — Playwright. What CI runs, and what works on any machine
  with a normal Chromium.
- **`npm run verify:local`** — Windows Chrome through `/mnt/c/...`, for this WSL
  box.

The duplication is the browser plumbing, not the checks, so the two cannot drift
on *what* they assert. The local harness exists because of three things found the
hard way:

1. Playwright's `chrome-headless-shell` will not start here — `libnspr4.so` and
   `libnss3` are missing, and installing them means touching system packages.
2. Chrome's `--remote-debugging-port` is not reachable from WSL: the port binds on
   the Windows side and the firewall drops the connection, so there is no CDP
   either — only the command line.
3. Windows Chrome refuses a window narrower than roughly 500px, and even above
   that the window is ~16px wider than the layout viewport it produces. Every
   width is therefore rendered inside an `<iframe>` of the exact size, so the
   number in the table is the number that was tested, with the probe reporting
   back over `postMessage`.

Install `libnspr4` and `libnss3` and `verify-local.mjs` can be deleted in favour
of `verify.mjs`.

## CI and deploying

`ci.yml` runs on every push and pull request to `main`: check the sprite, build,
verify, and upload `dist/` as an artifact. It never deploys — the artifact is also
the way to inspect the built page without publishing it (Actions → the run →
Artifacts → dist).

`deploy.yml` publishes `dist/` to Pages. It runs when **`ci` succeeds on `main`**,
and can always be started by hand from the Actions tab.

It chains off `ci` rather than off the push, so a commit that fails the gate never
reaches the site. Three details make that hold:

- `workflow_run` fires on `completed`, which includes failure, so the job checks
  `github.event.workflow_run.conclusion == 'success'` explicitly;
- the `deploy` job is `needs: build`, so a skipped or failed build skips the
  deploy rather than publishing something unverified;
- a `workflow_run` checkout defaults to the default branch's tip, which may
  already be a later commit than the one `ci` verified, so it checks out
  `workflow_run.head_sha`.

It then re-runs build and verify, refuses to start without a configured domain,
and asserts `dist/CNAME` exists before uploading.

**The consequence, deliberately accepted:** every commit that lands on `main` and
passes `ci` goes live. Rolling back is a revert plus another deploy — nothing
un-publishes. To go back to manual-only, delete the `workflow_run` block from
`deploy.yml` and keep `workflow_dispatch`.

## Content is downstream of the libraries

Every claim, option name, default and version on the page comes from the two
library repositories — mostly `docs/storage-kernel-api-reference.md`, which both
declare normative for the public surface. When the libraries change, the page
follows; it is not a second source of truth.

Deliberately absent: download counts, star counts, testimonials and benchmarks.
The libraries are at `0.1.0a` and the page says so.

## What the page says about publication

Checked against the registries on 2026-08-28, not against the repositories,
because a tag is not a release:

- **PyPI** serves `storage-kernel-contracts`, `storage-kernel-core` and
  `storage-kernel-factory` at `0.1.0a1`. The four provider distributions and
  `storage-kernel-testing` are **not** published.
- **npm** serves nothing under `@storage-kernel`.
- Both library repositories are **private**, so links into them 404 for the
  public. Every GitHub link is commented out in `src/index.html` — in the hero,
  the whole footer Documentation column, and the per-language entries — ready to
  uncomment when that changes.

The install section carries a notice saying exactly this, so a reader meets the
gap next to the command rather than at a failing `uv add`. Three things change
when the release completes: that notice, the "not on npm yet" markers, and the
changelog entries.

## Palette

This page uses **A1 — Navy & Brass**, one of four in the family set. The tokens
are declared in `src/styles.css` under `:root`; the reasoning, the measured
contrast and the assignment of the other three to the sibling libraries are in
`lib-family/docs/paletas.md`.

Changing the palette here means editing those tokens. It does not mean picking a
different one from the set — each palette belongs to one library, which is the
only reason the set exists.

## Known gaps

- **The web fonts are the only external request.** They come from Google Fonts,
  which means visitor IPs reach Google. Self-hosting is four `woff2` files in
  `src/assets/fonts/` plus an `@font-face` block; the build would copy them.
- **`dist/` is unminified**, by the decision above.
- **No social card image.** `og:image` is absent, so shared links render without a
  preview picture.

## License

MIT, matching the libraries.
