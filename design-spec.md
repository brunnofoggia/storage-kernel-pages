# Storage Kernel — Website Design Spec

The brief for this page. Unlike the sibling `secret-kernel-pages`, this spec was
not written to feed a three-direction exploration: the direction and the palette
were already decided for the whole family (see `direction-approved.md`). What is
written here is the content contract — what the page has to say, and what it is
not allowed to say.

## 1. What is being designed

A one-page website for the **Storage Kernel** library family: two independent
implementations of the same contract, `storage-kernel-py` and
`storage-kernel-js`.

Hand-authored HTML + CSS + minimal vanilla JS. No Vue, React, Angular, no
framework. Responsive and modern. Dark mode.

## 2. What the library does — the thing the site has to land

Read and write files on a local disk, AWS S3, Google Cloud Storage or SFTP,
behind one contract.

Your code asks for `reports/2026/summary.csv`. Whether that lives on a mounted
volume, in an S3 bucket, in Google Cloud Storage or on a remote SFTP server does
not change the call — only which distribution you install.

The interesting claim is not "we do storage". It is that the four backends are
held to **one contract of seventeen methods**, and that where a service genuinely
cannot do something the call **raises instead of emulating**. A signed URL on a
local disk is `StorageCapabilityNotSupportedError`, not a fabricated link. The
capability matrix is therefore part of the product, not a footnote.

## 3. Audience and context

Backend and platform engineers picking a storage abstraction, at a laptop, in a
tab next to their editor. They arrive with one question — "does this fit my stack
and how much does it cost me to try" — and they scan code before prose. A second,
smaller audience: someone already using it, back to check an option name or a
default.

Consequence: the first screen carries a real code sample, not a slogan. Every
claim needs the code that proves it, visible without a click.

## 4. Content — sections in order

1. **Hero** — one-sentence purpose, the resolved-path motif, a write and a read,
   links to PyPI / npm.
2. **01 Scope** — one contract, and what it refuses to fake: no emulation, real
   streams, provider options that never leak, injected clients that stay the
   caller's, the empty-path rule, per-call location replacing rather than merging.
3. **02 Install** — the base, then two provider subtopics (`local-filesystem` and
   `aws-s3`), then an honest statement of what the registries actually serve.
4. **03 Paths** — `bucket`/`directory`, `prefix` and `path`; which provider uses
   which; normalization; the local containment check.
5. **04 Text, bytes and streams** — whole values, then progressive uploads, then
   the full table of the seventeen methods in six groups.
6. **05 Directories and metadata** — the two listing defaults, the four
   combinations, synthesized directories on object storage, `exists=false`
   rather than an exception.
7. **06 Capabilities** — the matrix across the four backends. This is the page's
   signature block: it is the section no other library's page would carry.
8. **07 Providers** — the four, their distributions, what they root on;
   credentials and lifecycle; SFTP host identity as an explicit, opt-in decision.
9. **08 Errors** — the seven classes, and why only two are normalized.
10. **09 Observability and your own provider** — fixed event levels, sanitized
    context, `provider_class` / `providerClass`, the portable contract suite.
11. **10 Changelog** — short and factual, and the only place on the page that
    states a version number. It follows the code toggle, because the two
    implementations release independently.
12. **Footer** — registry links, license MIT.

## 5. Two toggles, both persistent

- **Language of the code**: Python ↔ TypeScript. Every sample switches, and so do
  the identifier names in the prose, per the api-reference documents both
  repositories declare normative: `read_content ↔ readContent`,
  `provider_name ↔ providerName`, `include_directories ↔ includeDirectories`,
  `known_hosts_path ↔ knownHostsPath`. Real differences are preserved rather than
  smoothed over — Python takes frozen dataclasses and `snake_case`, TypeScript
  takes object literals and `camelCase`, and both `create_storage_client` and
  `createStorageClient` are asynchronous.
- **Language of the prose**: EN ↔ PT-BR.

Both in vanilla JS, remembered in `localStorage`, overridable from the URL with
`?code=` and `?lang=`. Default: EN + Python.

## 6. Format

Desktop-first at 1440, verified at eight widths from 1440 down to 360. No
horizontal scroll at any width. Body text ≥ 16px, labels ≥ 12px, contrast ≥ 4.5:1,
interactive targets ≥ 24px.

## 7. Constraints and known anti-patterns

- Dark mode is required. **Avoid the GitHub-dark default** — uniform `#0D1117`
  plus generic cyan/violet neon glow is the single most copied look in developer
  marketing and carries no identity.
- No folder icons, no cloud icons, no hard-drive glyphs, no "server rack"
  illustration. These are the stock iconography of storage and say nothing about
  *this* library.
- No invented benchmarks, no throughput numbers, no fake user counts, no
  testimonial, no star count the repositories do not have. The library is at
  `0.1.0a` and the page says so.
- No emoji as icons. Brand marks (Python, TypeScript, AWS, Google Cloud, npm,
  PyPI, GitHub) must be the real official SVGs, inline, recolored via
  `currentColor`. Backends with no brand mark — the local filesystem and SFTP —
  take a typographic bullet rather than an invented logo.
- **The install lines must not outrun the registries.** At the time of writing,
  PyPI serves only the three base distributions and npm serves nothing. The page
  states that where a reader will hit it, in the install section, rather than
  letting them discover it at a failing command.

## 8. Visual motif — the seed for form

The same skeleton as the rest of the family — dark editorial, serif display,
hanging section numbers, marginalia in the right margin — with two things that
are this page's own:

- **The resolved path.** `bucket · directory / prefix / path` assembled into
  `app-files/reports/2026/summary.csv`. One string built from a root, an optional
  namespace and what the call asked for. The provider maps it to whatever its
  service calls a place, and that mapping is the contract.
- **The capability matrix.** Four backends against eight capabilities, with the
  gaps shown rather than hidden. It is the visual argument for the section 2
  claim: the differences sit *in* the contract, not behind it.
