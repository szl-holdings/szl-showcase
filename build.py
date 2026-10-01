#!/usr/bin/env python3
"""Render index.html for the SZL Holdings showcase from data/estate.json.

Every number on the page comes from the audit snapshot in data/estate.json
(observed timestamp included). Re-run after refreshing the snapshot.
"""
from __future__ import annotations

import html
import json
from pathlib import Path

ROOT = Path(__file__).parent
DATA = json.loads((ROOT / "data" / "estate.json").read_text())
E = html.escape

LOGO = (
    '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">'
    '<defs><linearGradient id="yg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5cc4bf"/><stop offset="1" stop-color="#168f89"/></linearGradient>'
    '<linearGradient id="hg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e4cf99"/><stop offset="1" stop-color="#c08f2f"/></linearGradient></defs>'
    '<rect width="64" height="64" rx="14" fill="#0a0f1e"/>'
    '<path d="M32 12 L14 54" fill="none" stroke="url(#hg)" stroke-width="7" stroke-linecap="round"/>'
    '<path d="M32 12 L50 54" fill="none" stroke="url(#yg)" stroke-width="7" stroke-linecap="round"/>'
    '<g fill="#c0392b"><circle cx="40" cy="28" r="4"/><circle cx="44" cy="40" r="4"/><circle cx="48" cy="51" r="4"/></g></svg>'
)


def card(item: dict, door: bool = False) -> str:
    role = item.get("role") or item.get("kind") or ""
    status = item.get("status")
    meta = []
    if item.get("lang"):
        meta.append(E(item["lang"]))
    if item.get("pushed"):
        meta.append("pushed " + E(item["pushed"]))
    if item.get("private"):
        meta.append("private")
    if status:
        meta.append(E(str(status)))
    surface = item.get("surface")
    surf = f' <a class="pill" href="{E(surface)}" target="_blank" rel="noopener">live</a>' if surface else ""
    return (
        f'<article class="card{" door" if door else ""}">'
        f'<div class="role">{E(role)}</div>'
        f'<div class="name"><a href="{E(item["url"])}" target="_blank" rel="noopener">{E(item["name"])}</a>{surf}</div>'
        f'<p class="desc">{E(item["desc"])}</p>'
        f'<div class="meta">{"".join(f"<span>{m}</span>" for m in meta)}</div>'
        "</article>"
    )


def layer_block(i: int, layer: dict) -> str:
    doors = layer["id"] == "front-doors"
    body = ""
    if layer["id"] == "kernels":
        chips = "".join(
            f'<a class="chip" href="https://huggingface.co/SZLHOLDINGS/{E(k)}" target="_blank" rel="noopener">{E(k)}</a>'
            for k in layer["kernels"]
        )
        rows = "".join(
            f'<tr><td><a href="{E(m["url"])}" target="_blank" rel="noopener">{E(m["id"])}</a></td><td class="num">{m["dl"]:,}</td></tr>'
            for m in layer["models"]
        )
        body = (
            '<div class="split">'
            f'<div><div class="eyebrow" style="margin-bottom:.7rem">{len(layer["kernels"])} software kernels on the Kernel Hub</div><div class="chips">{chips}</div>'
            '<p class="note">Kernels are software artifacts with declared contracts. A kernel card does not claim trained weights or executed inference.</p></div>'
            '<div><div class="eyebrow" style="margin-bottom:.7rem">Text-generation models by downloads</div>'
            f'<div class="tablewrap"><table><thead><tr><th>Model</th><th style="text-align:right">Downloads</th></tr></thead><tbody>{rows}</tbody></table></div>'
            '<p class="note">Download counts are Hub observations at the timestamp below, not quality claims. Qualification state lives in each card.</p></div>'
            "</div>"
        )
    else:
        body = '<div class="cards">' + "".join(card(it, doors) for it in layer["items"]) + "</div>"
    return (
        f'<div class="layer{" doors" if doors else ""} reveal" id="{E(layer["id"])}">'
        f'<div class="rail"><div class="num">LAYER {i:02d}</div><h3>{E(layer["title"])}</h3><p>{E(layer["lede"])}</p></div>'
        f"{body}</div>"
    )


def live_rows() -> str:
    out = []
    labels = {
        200: ("ok", "LIVE"), 401: ("ok", "LIVE · auth-guarded"), 403: ("ok", "LIVE · Access-guarded"),
        530: ("bad", "DOWN · tunnel origin"), 404: ("warn", "NO ROUTE"),
    }
    keep = [
        "https://a-11-oy.com/", "https://www.a-11-oy.com/", "https://a-11-oy.com/verify", "https://a-11-oy.com/code",
        "https://a-11-oy.com/killinchu", "https://a-11-oy.com/api/a11oy/v1/honest", "https://a-11-oy.com/healthz",
        "https://a11oy.net/", "https://a11oy.net/spec/GovernedAction/v1", "https://a11oy.net/record/", "https://a11oy.net/health.json",
        "https://holdings.a-11-oy.com/", "https://dev.a-11-oy.com/", "https://gdw.a-11-oy.com/healthz",
        "https://gpu.a-11-oy.com/", "https://gateway.a-11-oy.com/", "https://meter.a-11-oy.com/", "https://gpu2.a-11-oy.com/",
    ]
    by = {row["url"]: row["code"] for row in DATA["live"]}
    for u in keep:
        code = by.get(u)
        if code is None:
            continue
        cls, lab = labels.get(code, ("warn", "UNKNOWN"))
        out.append(f'<tr><td><a href="{E(u)}" target="_blank" rel="noopener">{E(u.replace("https://", ""))}</a></td><td class="code {cls}">{E(str(code))}</td><td>{E(lab)}</td></tr>')
    return "".join(out)


def spaces_summary() -> str:
    c = DATA["counts"]
    sdk = {}
    for s in DATA["spaces"]:
        sdk[s["sdk"]] = sdk.get(s["sdk"], 0) + 1
    parts = ", ".join(f"{v} {k}" for k, v in sorted(sdk.items(), key=lambda kv: -kv[1]))
    return f'{c["spaces"]} Spaces ({parts}); {c["spaces_reachable"]} of {c["spaces"]} answered a public root probe'


def main() -> None:
    c = DATA["counts"]
    layers = "".join(layer_block(i + 1, L) for i, L in enumerate(DATA["layers"]))
    pypi = ", ".join(DATA["pypi"])
    observed = DATA["observed"].replace("T", " ").replace("Z", " UTC")
    page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SZL Holdings — AI that signs its work</title>
<meta name="description" content="The SZL Holdings governed-AI ecosystem: a11oy command substrate, Killinchu, the SZL Router, receipt formats, Lean proofs, kernels, models, and benchmarks — every claim evidence-bound and verifiable.">
<meta property="og:title" content="SZL Holdings — AI that signs its work">
<meta property="og:description" content="One ecosystem, one doctrine: every claim carries a cryptographic receipt you can verify. Product at a-11-oy.com, proof at a11oy.net, source on GitHub, artifacts on Hugging Face.">
<meta property="og:type" content="website">
<meta name="theme-color" content="#030F29">
<link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
<link rel="stylesheet" href="styles.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="nav">
  <div class="container">
    <a class="brand" href="#top" aria-label="SZL Holdings home">{LOGO}<span>SZL Holdings</span></a>
    <nav class="nav-links" aria-label="Primary">
      <a href="#ecosystem">Ecosystem</a>
      <a href="#verify">Verify</a>
      <a href="#kernels">Models</a>
      <a href="#doctrine">Doctrine</a>
      <a href="#live">Live status</a>
      <a class="btn btn-primary btn-sm" href="https://a-11-oy.com" target="_blank" rel="noopener">Open a-11-oy.com</a>
    </nav>
  </div>
</header>

<main id="main">
<section class="hero" id="top">
  <div class="container">
    <div>
      <span class="eyebrow">Governed AI · evidence you can inspect</span>
      <h1 style="margin-top:.8rem">AI that <em>signs its work</em> and refuses to lie.</h1>
      <p class="lede">Every claim this ecosystem makes carries a cryptographic receipt you can verify yourself. Anything it cannot prove is labeled <code>UNAVAILABLE</code> instead of guessed. One doctrine runs from the Lean proofs to the live product.</p>
      <div class="cta">
        <a class="btn btn-primary" href="https://a-11-oy.com" target="_blank" rel="noopener">Open the product</a>
        <a class="btn btn-ghost" href="https://a-11-oy.com/verify" target="_blank" rel="noopener">Verify a receipt</a>
        <a class="btn btn-ghost" href="https://a11oy.net" target="_blank" rel="noopener">Read the proof registry</a>
      </div>
      <p class="fine">Product · a-11-oy.com &nbsp;·&nbsp; Proof · a11oy.net &nbsp;·&nbsp; Source · github.com/szl-holdings &nbsp;·&nbsp; Artifacts · huggingface.co/SZLHOLDINGS</p>
    </div>
    <aside class="receipt" aria-label="Shape of a governed-action receipt">
      <div class="rhead"><span>GovernedAction/v1 · receipt</span><span class="pill ok">VERIFIED</span></div>
      <div class="line"><span class="k">payloadType</span><span class="v">application/vnd.szl.governed-action+json</span></div>
      <div class="line"><span class="k">decision</span><span class="v">ALLOW</span> <span class="k">· lambda</span><span class="v">0.83</span> <span class="pill gold">CONJECTURE_1_ADVISORY</span></div>
      <div class="line"><span class="k">policy</span><span class="v">deny-by-default · doctrine v11</span></div>
      <div class="line"><span class="k">prev</span><span class="h">sha256:7f3a…c1e9</span></div>
      <div class="line"><span class="k">this</span><span class="h">sha256:b02d…94f7</span></div>
      <div class="line"><span class="k">energy_j</span><span class="v">UNAVAILABLE</span> <span class="k">· method</span><span class="v">NVML not present</span></div>
      <div class="line"><span class="k">signature</span><span class="v">DSSE · ECDSA-P256 · keyid 3e1f…</span></div>
      <div class="line"><span class="k">verify</span><span class="ok">hash-link ok · root ok · signer ok · canonical JSON ok</span></div>
      <div class="note">Illustrative shape, not a live record. Pull a real receipt at a-11-oy.com and check it offline with the prove-it verifier.</div>
    </aside>
  </div>
</section>

<div class="stats" aria-label="Estate counts">
  <div class="container">
    <div class="stat"><b>{c["repos"]}</b><span>GitHub repositories</span></div>
    <div class="stat"><b>{c["active"]}</b><span>active · {c["archived"]} archived</span></div>
    <div class="stat"><b>{c["models"]}</b><span>Hub model repos</span></div>
    <div class="stat"><b>{c["datasets"]}</b><span>Hub datasets</span></div>
    <div class="stat"><b>{c["spaces"]}</b><span>Spaces · {c["spaces_reachable"]} reachable</span></div>
    <div class="stat"><b>{c["pypi"]}</b><span>PyPI packages verified</span></div>
    <div class="observed">Observed {E(observed)} from the GitHub API, the Hugging Face Hub API, PyPI, and direct public probes. Repository counts, not quality or readiness claims.</div>
  </div>
</div>

<section id="ecosystem">
  <div class="container">
    <div class="sec-head reveal">
      <div><span class="eyebrow">The ecosystem</span><h2>One lattice, ten layers</h2></div>
      <p>Front doors at the top, control plane at the bottom. Everything in between is either a product surface or the evidence that makes a product surface believable. Each card links to its canonical source.</p>
    </div>
    {layers}
  </div>
</section>

<section id="verify">
  <div class="container">
    <div class="sec-head reveal">
      <div><span class="eyebrow">Thirty seconds</span><h2>Do not trust it. Verify it.</h2></div>
      <p>The demo and the verification are the same thing. If the receipts did not check out, you would see that too.</p>
    </div>
    <div class="steps reveal">
      <div class="step"><div class="n">1</div><h3>Run a governed action</h3><p>Open the living command fabric. Every governed action emits a hash-chained, DSSE-signed receipt with its decision, policy, and evidence labels.</p><pre><span class="c"># product</span>\nhttps://a-11-oy.com\n<span class="c"># honest status endpoint</span>\ncurl -s https://a-11-oy.com/api/a11oy/v1/honest</pre></div>
      <div class="step"><div class="n">2</div><h3>Check the receipt offline</h3><p>Paste it into the verifier on the product, or use the static prove-it Space, which runs entirely in your browser with no server to trust.</p><pre>https://a-11-oy.com/verify\n<span class="c"># offline, static</span>\nhttps://szlholdings-prove-it.static.hf.space</pre></div>
      <div class="step"><div class="n">3</div><h3>Read the contract and install the stack</h3><p>The receipt predicate is public. The tooling that produces receipts is installable and published with trusted publishing.</p><pre>https://a11oy.net/spec/GovernedAction/v1\npip install szl-receipts szl-guardrail-receipt \\\n            vsp-otel szl-nemo</pre></div>
    </div>
  </div>
</section>

<section id="doctrine">
  <div class="container">
    <div class="sec-head reveal">
      <div><span class="eyebrow">Doctrine v11</span><h2>Labels are typed, not cosmetic</h2></div>
      <p>Source, running software, and model evaluations are separate claims. A green test is not a deployment; a deployment is not a proof. The vocabulary below is enforced by CI across the estate.</p>
    </div>
    <div class="labels reveal">
      <div class="label"><b>MEASURED</b><p>Taken from live instrumentation with the method named, for example joules via NVML.</p></div>
      <div class="label"><b>MODELED</b><p>Computed from a stated model or simulation. Never blended into a measured figure.</p></div>
      <div class="label"><b>DECLARED</b><p>Asserted by a source but not independently measured.</p></div>
      <div class="label"><b>UNAVAILABLE</b><p>Could not be measured. Shown as the gap it is, never estimated into a number.</p></div>
      <div class="label"><b>LIVE</b><p>Observed on a public surface at a stated time. A dated observation, not a promise.</p></div>
      <div class="label"><b>SIMULATED · HISTORICAL</b><p>Simulated results are not production results. Historical evidence stays historical when a newer source exists.</p></div>
    </div>
    <div class="callout reveal"><b>CONJECTURE 1</b><span>The Λ aggregator is formalized in Lean 4 with Mathlib, and its uniqueness remains a labeled conjecture. The CI gate that rejects an unproven proof is red on purpose: that red is the honesty signal, not a failure to hide.</span></div>
  </div>
</section>

<section id="live">
  <div class="container">
    <div class="sec-head reveal">
      <div><span class="eyebrow">Public surfaces</span><h2>Observed, with the code we saw</h2></div>
      <p>Direct probes at the snapshot time. Tunnel-backed own-metal hosts are listed too, including the ones that were down, because hiding a 530 would violate the doctrine the rest of this page describes.</p>
    </div>
    <div class="tablewrap reveal live"><table><thead><tr><th>Surface</th><th>HTTP</th><th>State</th></tr></thead><tbody>{live_rows()}</tbody></table></div>
    <p class="note">Hugging Face: {E(spaces_summary())}. PyPI (verified by name at snapshot): {E(pypi)}.</p>
  </div>
</section>
</main>

<footer>
  <div class="container">
    <div>
      <a class="brand" href="#top">{LOGO}<span>SZL Holdings</span></a>
      <p style="margin-top:.8rem;max-width:36ch">Governed AI. Evidence you can inspect. Work you can verify.</p>
      <p class="tag">Stephen Lutar · Poughkeepsie, NY · ORCID 0009-0001-0110-4173</p>
      <p class="tag">Snapshot {E(observed)} · page built from data/estate.json</p>
    </div>
    <div><h4>Front doors</h4><ul>
      <li><a href="https://a-11-oy.com" target="_blank" rel="noopener">a-11-oy.com — product</a></li>
      <li><a href="https://a11oy.net" target="_blank" rel="noopener">a11oy.net — proof registry</a></li>
      <li><a href="https://github.com/szl-holdings" target="_blank" rel="noopener">github.com/szl-holdings</a></li>
      <li><a href="https://huggingface.co/SZLHOLDINGS" target="_blank" rel="noopener">huggingface.co/SZLHOLDINGS</a></li>
      <li><a href="https://pypi.org/user/betterwithage/" target="_blank" rel="noopener">PyPI</a></li>
    </ul></div>
    <div><h4>Proof</h4><ul>
      <li><a href="https://a11oy.net/spec/GovernedAction/v1" target="_blank" rel="noopener">GovernedAction/v1</a></li>
      <li><a href="https://a11oy.net/record/" target="_blank" rel="noopener">RECORD</a></li>
      <li><a href="https://szlholdings-prove-it.static.hf.space" target="_blank" rel="noopener">prove-it offline verifier</a></li>
      <li><a href="https://github.com/szl-holdings/lutar-lean" target="_blank" rel="noopener">lutar-lean (Lean 4)</a></li>
      <li><a href="https://github.com/szl-holdings/.github/blob/main/TRUST.md" target="_blank" rel="noopener">TRUST.md</a></li>
    </ul></div>
    <div><h4>Flagships</h4><ul>
      <li><a href="https://github.com/szl-holdings/a11oy" target="_blank" rel="noopener">a11oy</a></li>
      <li><a href="https://github.com/szl-holdings/killinchu" target="_blank" rel="noopener">killinchu</a></li>
      <li><a href="https://github.com/szl-holdings/szl-router" target="_blank" rel="noopener">szl-router</a></li>
      <li><a href="https://github.com/szl-holdings/david-leads" target="_blank" rel="noopener">david-leads</a></li>
      <li><a href="https://huggingface.co/spaces/SZLHOLDINGS/szl-constellation" target="_blank" rel="noopener">szl-constellation</a></li>
    </ul></div>
  </div>
</footer>
<script>
(function(){{var els=document.querySelectorAll('.reveal');if(!('IntersectionObserver' in window)){{els.forEach(function(e){{e.classList.add('in')}});return}}
var io=new IntersectionObserver(function(es){{es.forEach(function(x){{if(x.isIntersecting){{x.target.classList.add('in');io.unobserve(x.target)}}}})}},{{rootMargin:'0px 0px -8% 0px'}});els.forEach(function(e){{io.observe(e)}})}})();
</script>
</body>
</html>
"""
    (ROOT / "index.html").write_text(page)
    print("wrote index.html", len(page), "bytes")


if __name__ == "__main__":
    main()
