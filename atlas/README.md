# SZL Frontier Atlas retained source and reviewed derivatives

This directory proposes a GitHub source binding for the recovered Atlas bundle
in `szl-holdings/szl-showcase`. The binding becomes canonical after protected
merge. The five original imported files remain available byte for byte at GitHub
commit `70c6888b24465fb62e721e1d666342ef601b2542`. Their declared historical context
is cloud source revision `016bb9a6dc75d739617a11b1eb92c47a25a29a36`, associated
with Site version 4; that declaration is not independent proof of cloud history.
[SOURCE.json](SOURCE.json) v2 preserves the original sizes, SHA-256 hashes, and
Git blobs under `retained_import`, pinned to that GitHub import commit. Its
`files` list binds the current files, resolved together with this manifest at
one GitHub commit.

The current builder, generated HTML, and projection test are reviewed derivatives
of that retained import. They classify the observed `NO_APP_FILE` Space failure
as adverse evidence and check its count and filter behavior. They are not the
original cloud bytes. This classification repair does not refresh observations
or change the packaged estate/Anatomy projection data or its digests.

The retained [public Site](https://szl-frontier-atlas.stephenlutar2.chatgpt.site)
is a separate publication surface. Its current publication and running-source
binding remain **UNKNOWN** in this source manifest. A protected merge and green
source contracts establish neither a provider update nor runtime parity.

The estate projection is dated `2026-10-03T00:35:40.584884+00:00`: 259 public asset
records and 54 findings from mixed observation times and revisions. It is a
historical evidence view, not a live census or a complete estate claim. The
Anatomy payload remains evaluation-only: executable `false`, authority `false`,
and its related implementation link is not a proven payload-source binding.
Changing the reviewed projection counts or digests requires a fresh review.

## Offline source contracts

Use Node.js **24.19.0**; no packages or credentials are required. From the
repository root:

```bash
node --check atlas/build-atlas.mjs
node --check atlas/tests/anatomy-projection.test.mjs
node atlas/tests/anatomy-projection.test.mjs
node atlas/tests/source-binding.test.mjs
```

The current projection contract checks public-only data, fixed projection
digests, simulated payload boundaries, filtering, pagination, export escaping,
and interactions. The binding contract checks the current bytes against the
current `files` manifest, preserves the pinned retained-import identity list,
and rebuilds a temporary copy, comparing its generated output byte for byte.
It leaves the tracked bundle untouched.

The provider control binding is excluded from this directory. Its original
bytes and the full six-file source readback are retained in private recovery
evidence. The repository's existing root site, `CNAME`, build, and CodeQL gate
retain their separate contracts and publication ownership.
