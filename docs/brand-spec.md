# Brand assets — Storage Kernel website

Storage Kernel has no logo, wordmark or palette of its own. There is nothing to
extract: the two repositories carry only source, docs and an MIT `LICENSE`. The
site's identity comes from the family set (`direction-approved.md`), and this file
records only the **third-party marks the page names** and where each came from.

## Third-party marks in use

Identification only — every mark stays byte-for-byte from its official source and
is stripped of nothing but its hardcoded `fill`, so the page can recolour it with
`currentColor`. No mark is redrawn, restyled or recombined.

| Mark | Named in | Source | File |
| --- | --- | --- | --- |
| Amazon Web Services | `aws-s3` | svgl.app (official AWS wordmark, dark variant) | `src/assets/logos/aws.svg` |
| Google Cloud | `gcp-storage` | Simple Icons CDN | `src/assets/logos/googlecloud.svg` |
| Python | the Python implementation and code toggle | Simple Icons CDN | `src/assets/logos/python.svg` |
| TypeScript | the TypeScript implementation and code toggle | Simple Icons CDN | `src/assets/logos/typescript.svg` |
| PyPI | where `storage-kernel-*` is published | Simple Icons CDN | `src/assets/logos/pypi.svg` |
| npm | where `@storage-kernel/*` is published | Simple Icons CDN | `src/assets/logos/npm.svg` |
| GitHub | source links, currently commented out | Simple Icons CDN | `src/assets/logos/github.svg` |

`scripts/lib/sprite.mjs` folds all seven into one inline `<symbol>` sprite, which
the build injects into the page. The sprite is never written to `src/`: it is
derived from the SVGs above, and a derived file in the source tree is one that can
go stale. Nothing is referenced by URL, so the page has no external image
dependency and cannot render with broken marks if it is moved.

The GitHub mark stays in the set while its links are commented out. It costs ~840
bytes and belongs there the moment the repositories go public.

`local-filesystem` and `sftp` deliberately have **no** mark. A protocol and a
local disk have no owner, and drawing something logo-shaped for them would imply
one. They take the typographic bullet the family already uses for non-branded
providers.

## Facts the page asserts

Verified on 2026-10-14 against the registries' JSON APIs, **not** the
repositories, because a tag is not a release:

- `storage-kernel-py` — eight distributions, tagged `v0.1.0a1` to `v0.1.0a4`. PyPI
  serves all eight at `0.1.0a4`, and the seven that existed then at `0.1.0a1`.
  `a2` and `a3` were never published.
- `storage-kernel-js` — eight packages, tagged `v0.1.0-alpha.1` to
  `v0.1.0-alpha.4`. npm serves all eight at `0.1.0-alpha.4`, the first version
  published under `@storage-kernel`.
- Both GitHub repositories are private, so every link into them 404s for the
  public. The links are therefore commented out in `src/index.html` rather than
  deleted, ready to restore when that changes.
- Providers: `local-filesystem`, `aws-s3`, `gcp-storage`, `sftp`.
- Seventeen client methods; five writable-stream methods.
- Python 3.12+; the TypeScript packages require Node 22.13+.

The page says what the registries serve only in the changelog, where a tagged
version the registry does not serve carries a "not on PyPI yet" / "not on npm
yet" marker (`lib-family/docs/paginas.md` §8.1) — there is no notice block. With
the latest tags published, no entry carries one today. Versions are stated in
one place, the changelog, so this file does not repeat them per release.

No download count, star count, adoption claim, testimonial or benchmark appears on
the site, because none of those exist for a `0.1.0a` library.
