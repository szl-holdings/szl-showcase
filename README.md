# SZL Holdings showcase

A one-page static tour of the SZL Holdings estate. Every card links to its canonical source.
Every number comes from a dated audit snapshot, not from a live read.

**Disposition:** public launch authorized by the owner (2026-11-19). This repository is public; the estate alignment policy keeps nothing private. The page carries a CNAME for showcase.a-11-oy.com. Hosting state is whatever the audit snapshot recorded.

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

## Models

Flagship models live on Hugging Face under the [SZLHOLDINGS](https://huggingface.co/SZLHOLDINGS) organization. Canonical source code lives on [GitHub](https://github.com/szl-holdings).

| Model family | Card | Canonical source |
| --- | --- | --- |
| szl-khipu kernels | [szl-khipu](https://huggingface.co/SZLHOLDINGS/szl-khipu) | [szl-holdings/szl-khipu](https://github.com/szl-holdings/szl-khipu) |
| Khipu scholar | [salad-khipu-scholar-v1](https://huggingface.co/SZLHOLDINGS/salad-khipu-scholar-v1) | [szl-holdings/szl-khipu-scholar](https://github.com/szl-holdings/szl-khipu-scholar) |
| Khipu structure | [salad-khipu-structure-v1](https://huggingface.co/SZLHOLDINGS/salad-khipu-structure-v1) | [szl-holdings org](https://github.com/szl-holdings) |
| Yachay nano | [SZL-Khipu-Yachay-Nano](https://huggingface.co/SZLHOLDINGS/SZL-Khipu-Yachay-Nano) | [szl-holdings org](https://github.com/szl-holdings) |
| Flagship 54 | [salad-flagship54-v1](https://huggingface.co/SZLHOLDINGS/salad-flagship54-v1), [salad-flagship54-v2](https://huggingface.co/SZLHOLDINGS/salad-flagship54-v2) | [szl-holdings org](https://github.com/szl-holdings) |
| Doctrine math | [frontier-54-doctrine-math-r1-candidate](https://huggingface.co/SZLHOLDINGS/frontier-54-doctrine-math-r1-candidate) | [szl-holdings org](https://github.com/szl-holdings) |
| Ring ouroboros ladder | [salad-ring-ouro](https://huggingface.co/SZLHOLDINGS/salad-ring-ouro-l1) (heads l1-l133) | [szl-holdings org](https://github.com/szl-holdings) |
| x402 frontier | [salad-x402-frontier-v1](https://huggingface.co/SZLHOLDINGS/salad-x402-frontier-v1), [salad-x402-frontier-v2](https://huggingface.co/SZLHOLDINGS/salad-x402-frontier-v2) | [szl-holdings org](https://github.com/szl-holdings) |
