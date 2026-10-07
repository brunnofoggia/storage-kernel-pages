# CLAUDE.md

## Project scope

This repository is the one-page site for Storage Kernel. Read these in full before
working on it:

@docs/design-spec.md
@docs/direction-approved.md
@docs/brand-spec.md

`design-spec.md` is the content brief: audience, the sections in order and what each
must say, the two toggles, format and visual rules. `direction-approved.md` records
what was chosen for this page and what it inherited from the family. `brand-spec.md`
lists the third-party marks the page carries, where each came from and what was
verified.

How to run, build, verify and deploy is in `README.md`.

## Family

This site is one of the `<concept>-kernel-pages` repositories, one per library of the
family — `secret-kernel`, `storage-kernel`, `edd-kernel` and `ai-llm-kernel`. What the
pages share is decided once, in `~/projects/labs/lib-family`, because four copies of a
decision drift.

These two are loaded together with this file:

<!-- prettier-ignore -->
@~/projects/labs/lib-family/docs/paginas.md
<!-- prettier-ignore -->
@~/projects/labs/lib-family/docs/paletas.md

`paginas.md` is the normative rule for building a page: structure, build, gates, CI
and deploy, the two toggles, and the content rules — publication state checked against
the registry, the version stated only in the changelog, third-party marks, what never
appears. `paletas.md` says which palette belongs to which library, with token values
and measured contrast. This page is **A1 — Navy & Brass**.

Read the rest when the work reaches it:

| Path                                                                     | Answers                                                                                  |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `~/projects/labs/lib-family/pages/`                                      | The design directions proposed for the family and the four palettes, as renderable HTML. |
| `~/projects/labs/storage-kernel-py/docs/storage-kernel-api-reference.md` | Every name, option, default and error the page states for Python.                        |
| `~/projects/labs/storage-kernel-js/docs/storage-kernel-api-reference.md` | The same for TypeScript.                                                                 |

The page is downstream of the two libraries. Every claim, option name, default and
version comes from their api-references, which both repositories declare normative; a
divergence between the page and them is a defect of the page.

A divergence from a family decision is a defect, not a variation. When one has to
change, it changes in `lib-family` first and then in each page — never in one page
alone, and never in the opposite order.

## Principles

The coding, architecture and security principles come from the global instructions in
`~/ai/instructions/`. This repository keeps no copy of them: a copy drifts from the
original, and a drifted copy is read as the truth.
