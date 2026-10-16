# Design direction — decision record

Status: **decided — direction A, palette A1 (Navy & Brass)**

This page did **not** run its own three-direction exploration. That gate was run
once, for the family, while `secret-kernel-pages` was being built on 2026-08-27:
three directions were built as real rendered HTML from one shared brief, shown to
the user with screenshots, and one was chosen. The four palettes and the
per-library assignment were decided in the same session.

The artefacts live one repository over, in **lib-family**:

- `lib-family/pages/directions/` — the three directions that were proposed
- `lib-family/pages/palettes/` — the four palette variants, as renderable HTML
- `lib-family/docs/paletas.md` — token values, measured contrast, the assignment

## What was inherited

**Direction A — dark warm editorial.** A single left-aligned column at a book
measure, hanging section numbers, editorial marginalia in the right margin, and —
adopted from the direction the user did not pick — two-column prose/code rows for
the dense reference sections, which hold reference-heavy content better than a
single measure does.

**Palette A1 — Navy & Brass.** Assigned to `storage-kernel` by the user on
2026-08-27, and confirmed for this page in their own words: *"a cor dele é a
amarela dentre as que criamos"*.

| Library | Palette | Page |
| --- | --- | --- |
| `secret-kernel` | A2 Prussian & Sky | `secret-kernel-pages`, built |
| `storage-kernel` | **A1 Navy & Brass** | this repository |
| `ai-llm-kernel` | A3 Midnight & Jade | to do |
| `edd-kernel` | A4 Oxblood & Rose | to do |

One palette belongs to one library. Reusing one across two pages costs the set
the per-page identity that is its only reason to exist.

## Guardrails that came with the palette

The family brief forbids the GitHub-dark treatment — uniform `#0D1117` plus a
cyan/violet neon glow. A1 stays out of it the same way its siblings do:

- the ground is chromatic navy `#0A1120`, not desaturated blue-grey;
- the brass accent `#E3A44F` carries no `text-shadow` glow and no `filter: blur()`
  halo anywhere;
- separation is carried by 1px rules only;
- the serif display and the marginalia stay, because they are what make the page
  unattributable to the cliché regardless of hue.

The single `blur()` in the stylesheet is the masthead's `backdrop-filter`, which
is a translucency, not a halo.

## Decided here, not inherited

Two things this page needed that the family brief did not settle:

1. **A caution colour.** In A2 the warning badge could borrow the palette's amber,
   because the accent was a cool sky. Here the accent *is* amber, so a badge in it
   would read as emphasis rather than caution. `--warn` is therefore a muted rose
   `#E39AA0` — 8.43:1 on the ground — used only by the "not on PyPI yet" and
   "not on npm yet" markers in the changelog.

2. **Marks for the two providers that have none.** AWS and Google Cloud have
   official brand marks and use them. The local filesystem and SFTP do not — SFTP
   is a protocol and a local disk is not a vendor — so both take the typographic
   bullet the family already uses for non-branded providers, rather than an
   invented logo that would imply an owner.

3. **A blue for the gutter marks.** The family's compare blocks mark the lines
   that differ between samples green (swap), red (only in this one) and blue
   (comment), and in A2 the blue is the accent itself. Here the accent is brass,
   so the blue is chosen: `--mark-info` `#79B8F0`. Against the code ground
   `--ink-sunk` `#070D18` the three measure green `#6CC884` 9.48:1, red `#E8857F`
   7.49:1 and blue 9.19:1, all above the 3:1 that `paginas.md` §8.9 asks of a
   non-text mark.
