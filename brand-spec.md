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
| npm | where `@storage-kernel/*` is **not yet** published | Simple Icons CDN | `src/assets/logos/npm.svg` |
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

Verified on 2026-08-28 against the registries, **not** the repositories, because a
tag is not a release:

- `storage-kernel-py` — eight distributions, tagged `v0.1.0a1`. PyPI serves three
  of them: `storage-kernel-contracts`, `storage-kernel-core` and
  `storage-kernel-factory`, all at `0.1.0a1`, uploaded 2026-08-27. The four
  provider distributions and `storage-kernel-testing` are **not** on PyPI.
- `storage-kernel-js` — eight packages, tagged `v0.1.0-alpha.1`. **Nothing** is on
  npm; the `@storage-kernel` scope resolves to nothing.
- Both GitHub repositories are private, so every link into them 404s for the
  public. The links are therefore commented out in `src/index.html` rather than
  deleted, ready to restore when that changes.
- Providers: `local-filesystem`, `aws-s3`, `gcp-storage`, `sftp`.
- Seventeen client methods; five writable-stream methods.
- Python 3.12+; the TypeScript packages target Node 22+.

The page states the registry gap where a reader will hit it — in the install
section, next to the commands that do not work yet — rather than letting them find
out at a failing `uv add`. Versions are stated in one place, the changelog, so
this file does not repeat them per release.

No download count, star count, adoption claim, testimonial or benchmark appears on
the site, because none of those exist for a `0.1.0a` library.
