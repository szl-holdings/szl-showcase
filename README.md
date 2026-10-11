# SZL Holdings showcase

A one-page static tour of the SZL Holdings estate. Every card links to its canonical source.
Every number comes from a dated audit snapshot, not from a live read.

**Disposition:** private operator surface. The repository stays private until a public launch
is authorized. The page carries a `CNAME` for `showcase.a-11-oy.com`. This README does not claim
that the domain or any hosting is live.

<!-- szl:header v1 -->
<!-- Native identity: szl-brand@4309f6fce89179331b0b3ed8c99494e76c5be256; Orbit v2 icon. -->
<p>
  <a href="https://github.com/szl-holdings">
    <img src="https://raw.githubusercontent.com/szl-holdings/szl-brand/4309f6fce89179331b0b3ed8c99494e76c5be256/kit/logos/orbit-v2/suite/szl-icon-32.svg" alt="SZL Holdings — Orbit v2" width="32" height="32" />
  </a>
</p>

**Control before action. Evidence after.**

[Product](https://a-11-oy.com) · [Proof](https://a11oy.net) · [GitHub organization](https://github.com/szl-holdings)
<!-- /szl:header -->

## What is here

| Path | What it is |
|---|---|
| `index.html`, `styles.css`, `assets/` | The rendered page, its stylesheet, the favicon, the KANCHAY token sheet and the 1200×630 social image. |
| `build.py` | Renders `index.html` from `data/estate.json`. It uses the standard library only. |
| `data/estate.json` | The audit snapshot behind every number on the page. Its `observed` field is the capture time, currently `2026-10-01T01:10Z`. |
| `atlas/` | The retained SZL Frontier Atlas source, with its own binding contract. See [`atlas/README.md`](atlas/README.md). |
| `CNAME` | The intended custom domain. |

## Build the page

Requires Python 3.10 or newer, with no packages.

```bash
python build.py        # rewrites index.html from data/estate.json
```

To change a number, refresh `data/estate.json` from a new audit and keep its `observed` time,
then rebuild. Do not edit `index.html` by hand. The snapshot is a historical view of the estate,
not a live census. Read current state at the canonical destinations below.

## Checks

- **Atlas source contract** (`.github/workflows/atlas-source-contract.yml`) runs on every pull
  request and on `main`. It checks the retained Atlas bytes and their offline reproduction with
  Node.js 24.19.0. The same commands are in [`atlas/README.md`](atlas/README.md).
- **CodeQL** (`.github/workflows/codeql.yml`) scans the repository.

## Canonical destinations

- Product: [a-11-oy.com](https://a-11-oy.com/)
- Proof and evidence: [a11oy.net](https://a11oy.net/)
- Source: [github.com/szl-holdings](https://github.com/szl-holdings)
- Artifacts: [huggingface.co/SZLHOLDINGS](https://huggingface.co/SZLHOLDINGS)

## License

No `LICENSE` file is committed yet, so this repository grants no license. Add one before any
public launch. The SZL Holdings name, wordmark and brand colors are trademarks of SZL Holdings.
