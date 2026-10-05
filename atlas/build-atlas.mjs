import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(here, "dist", "index.html");
const anatomyPath = path.join(here, "dist", "anatomy-control-plane.json");
const projectionFlag = process.argv.indexOf("--projection");
if (projectionFlag !== -1 && !process.argv[projectionFlag + 1]) {
  throw new Error("--projection requires a reviewed showcase-public.html path");
}
const projectionPath = projectionFlag === -1
  ? outputPath
  : path.resolve(process.cwd(), process.argv[projectionFlag + 1]);
const projectionSource = fs.readFileSync(projectionPath, "utf8");
const inventoryMatch = projectionSource.match(/const DATA=(.*?);\r?\nconst (?:ANATOMY|esc)=/s);

if (!inventoryMatch) {
  throw new Error("The current Site does not contain the public inventory projection.");
}

const sourceData = JSON.parse(inventoryMatch[1]);
const anatomy = JSON.parse(fs.readFileSync(anatomyPath, "utf8"));
const publicAssetFields = [
  "kind", "id", "owner", "url", "private", "archived", "description",
  "category", "status", "license", "revision", "updated", "workflow_count",
  "test_path_count", "skill_count", "kernel_path_count", "source_file_count",
  "tree_truncated", "downloads", "likes", "file_count", "card_available",
  "declared_artifact_class", "declared_base", "declared_eval_gate",
  "publication_eligible", "tensor_artifact", "numeric_archives",
];
const data = {
  generated_at: sourceData.generated_at,
  assets: sourceData.assets.map((asset) => Object.fromEntries(
    publicAssetFields.filter((key) => key in asset).map((key) => [key, asset[key]]),
  )),
  findings: sourceData.findings,
  coverage: sourceData.coverage,
};

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

const projectionDigest = crypto
  .createHash("sha256")
  .update(JSON.stringify(canonical(data)))
  .digest("hex");

const template = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#061015">
  <meta name="description" content="A source-linked public evidence atlas of the SZL GitHub and Hugging Face estate.">
  <title>SZL Frontier Atlas — Public Evidence Observatory</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2064%2064%27%3E%3Crect%20width=%2764%27%20height=%2764%27%20rx=%2714%27%20fill=%27%23061015%27/%3E%3Cpath%20d=%27M13%2046L32%2010l19%2036H39l-7-14-7%2014H13z%27%20fill=%27%2367f7d4%27/%3E%3Ccircle%20cx=%2732%27%20cy=%2727%27%20r=%274%27%20fill=%27%23e9fff9%27/%3E%3C/svg%3E">
  <style>
    :root {
      color-scheme: dark;
      --ink: #eefcf8;
      --muted: #9db7b0;
      --faint: #6e8781;
      --void: #061015;
      --deep: #08171d;
      --panel: rgba(12, 31, 37, .78);
      --panel-solid: #0c1f25;
      --panel-2: #102a30;
      --line: rgba(135, 204, 190, .17);
      --line-strong: rgba(135, 204, 190, .34);
      --mint: #67f7d4;
      --cyan: #55c9ff;
      --violet: #9b8cff;
      --amber: #ffcc72;
      --coral: #ff8f8a;
      --good: #7cf0b2;
      --shadow: 0 24px 70px rgba(0, 0, 0, .28);
      --chart-gradient: conic-gradient(var(--mint) 0 52.34%, var(--violet) 52.34% 70.31%, var(--cyan) 70.31% 85.94%, var(--amber) 85.94% 100%);
    }

    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      min-width: 320px;
      background:
        radial-gradient(circle at 83% 8%, rgba(61, 221, 197, .11), transparent 27rem),
        radial-gradient(circle at 15% 32%, rgba(111, 91, 255, .08), transparent 31rem),
        var(--void);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 16px;
      line-height: 1.55;
      overflow-x: hidden;
    }

    body::before {
      content: "";
      position: fixed;
      inset: 0;
      z-index: -2;
      pointer-events: none;
      background-image:
        linear-gradient(rgba(127, 214, 196, .035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(127, 214, 196, .035) 1px, transparent 1px);
      background-size: 48px 48px;
      mask-image: linear-gradient(to bottom, black, transparent 72%);
    }

    a { color: inherit; }
    button, input, select { font: inherit; }
    button, select { cursor: pointer; }
    button { color: inherit; }
    :focus-visible { outline: 3px solid var(--cyan); outline-offset: 3px; }
    ::selection { color: var(--void); background: var(--mint); }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

    .skip-link {
      position: fixed;
      top: 12px;
      left: 12px;
      z-index: 100;
      transform: translateY(-150%);
      padding: 10px 14px;
      border-radius: 8px;
      background: var(--ink);
      color: var(--void);
      font-weight: 750;
    }
    .skip-link:focus { transform: translateY(0); }

    .shell { width: min(1440px, calc(100% - 48px)); margin-inline: auto; }
    .site-nav {
      position: sticky;
      top: 0;
      z-index: 30;
      border-bottom: 1px solid transparent;
      background: linear-gradient(to bottom, rgba(6, 16, 21, .96), rgba(6, 16, 21, .82));
      backdrop-filter: blur(18px);
    }
    .nav-inner {
      min-height: 74px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 28px;
    }
    .brand { display: inline-flex; align-items: center; gap: 12px; text-decoration: none; min-width: max-content; }
    .brand-mark {
      width: 34px;
      aspect-ratio: 1;
      display: grid;
      place-items: center;
      border: 1px solid var(--line-strong);
      border-radius: 10px;
      background: linear-gradient(145deg, rgba(103, 247, 212, .16), rgba(85, 201, 255, .03));
      box-shadow: inset 0 0 20px rgba(103, 247, 212, .07);
    }
    .brand-mark::before {
      content: "";
      width: 13px;
      height: 16px;
      background: var(--mint);
      clip-path: polygon(50% 0, 100% 100%, 72% 100%, 50% 56%, 28% 100%, 0 100%);
    }
    .brand-copy { display: grid; line-height: 1.06; }
    .brand-copy strong { font-size: .9rem; letter-spacing: .08em; text-transform: uppercase; }
    .brand-copy span { margin-top: 5px; color: var(--faint); font-size: .74rem; letter-spacing: .04em; }
    .nav-links { display: flex; align-items: center; gap: 8px; }
    .nav-links a {
      padding: 9px 11px;
      border-radius: 8px;
      color: var(--muted);
      font-size: .88rem;
      text-decoration: none;
    }
    .nav-links a:hover { color: var(--ink); background: rgba(255, 255, 255, .04); }
    .nav-state {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 11px;
      border: 1px solid var(--line);
      border-radius: 999px;
      color: var(--muted);
      font: 650 .72rem/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      letter-spacing: .07em;
      text-transform: uppercase;
    }
    .nav-state::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--mint); box-shadow: 0 0 16px var(--mint); }

    .hero { padding: clamp(40px, 5.5vw, 78px) 0 46px; }
    .hero-grid { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(330px, .7fr); align-items: center; gap: clamp(42px, 7vw, 104px); }
    .eyebrow, .kicker {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 0 18px;
      color: var(--mint);
      font: 700 .77rem/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      letter-spacing: .13em;
      text-transform: uppercase;
    }
    .eyebrow::before, .kicker::before { content: ""; width: 28px; height: 1px; background: currentColor; }
    h1, h2, h3, p { margin-top: 0; }
    h1 {
      max-width: 980px;
      margin-bottom: 26px;
      font-size: clamp(3.25rem, 7.2vw, 6.65rem);
      line-height: .93;
      letter-spacing: -.067em;
      font-weight: 780;
    }
    .gradient-word { color: transparent; background: linear-gradient(95deg, var(--mint), #d6fff3 44%, var(--cyan)); background-clip: text; -webkit-background-clip: text; }
    .hero-copy { max-width: 780px; margin-bottom: 30px; color: var(--muted); font-size: clamp(1.05rem, 1.8vw, 1.3rem); line-height: 1.62; }
    .hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
    .button {
      min-height: 46px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 11px 17px;
      border: 1px solid var(--line-strong);
      border-radius: 10px;
      background: rgba(255, 255, 255, .025);
      color: var(--ink);
      font-weight: 720;
      font-size: .9rem;
      text-decoration: none;
      transition: transform .2s ease, border-color .2s ease, background .2s ease;
    }
    .button:hover { transform: translateY(-2px); border-color: rgba(103, 247, 212, .65); background: rgba(103, 247, 212, .06); }
    .button.primary { border-color: transparent; background: var(--mint); color: #04110d; box-shadow: 0 12px 36px rgba(103, 247, 212, .16); }
    .button.primary:hover { background: #83ffdf; }
    .button.subtle { min-height: 42px; padding: 9px 13px; color: var(--muted); font-weight: 650; }

    .orbit-panel {
      position: relative;
      min-height: 360px;
      display: grid;
      place-items: center;
      border: 1px solid var(--line);
      border-radius: 26px;
      background: linear-gradient(145deg, rgba(17, 46, 52, .68), rgba(7, 20, 25, .54));
      box-shadow: var(--shadow), inset 0 1px rgba(255, 255, 255, .04);
      overflow: hidden;
    }
    .orbit-panel::before, .orbit-panel::after {
      content: "";
      position: absolute;
      border: 1px solid rgba(103, 247, 212, .12);
      border-radius: 50%;
    }
    .orbit-panel::before { width: 360px; height: 360px; }
    .orbit-panel::after { width: 280px; height: 280px; border-style: dashed; animation: orbit 60s linear infinite; }
    .orbit-core {
      position: relative;
      z-index: 1;
      width: 216px;
      aspect-ratio: 1;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: var(--chart-gradient);
      box-shadow: 0 0 80px rgba(103, 247, 212, .08);
    }
    .orbit-core::before { content: ""; position: absolute; inset: 19px; border-radius: 50%; background: #0a1a20; box-shadow: inset 0 0 40px rgba(103, 247, 212, .06); }
    .orbit-number { position: relative; z-index: 1; display: grid; text-align: center; }
    .orbit-number strong { font-size: 3.25rem; line-height: 1; letter-spacing: -.06em; }
    .orbit-number span { margin-top: 9px; color: var(--muted); font: 700 .68rem/1.3 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .12em; text-transform: uppercase; }
    .orbit-legend { position: absolute; inset: 20px; z-index: 2; pointer-events: none; }
    .orbit-label { position: absolute; max-width: 126px; padding: 7px 9px; border: 1px solid var(--line); border-radius: 8px; background: rgba(6, 16, 21, .78); color: var(--muted); font-size: .72rem; line-height: 1.25; backdrop-filter: blur(8px); }
    .orbit-label strong { display: block; color: var(--ink); font-size: .93rem; }
    .orbit-label:nth-child(1) { top: 12px; left: 14px; }
    .orbit-label:nth-child(2) { top: 36px; right: 5px; }
    .orbit-label:nth-child(3) { bottom: 18px; right: 14px; }
    .orbit-label:nth-child(4) { bottom: 43px; left: 2px; }
    .orbit-foot { position: absolute; bottom: 14px; left: 50%; z-index: 2; transform: translateX(-50%); color: var(--faint); font: 600 .65rem/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; }

    .metric-rail { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 38px; border-block: 1px solid var(--line); }
    .metric { min-height: 104px; padding: 19px 24px; border: 0; border-right: 1px solid var(--line); background: transparent; color: var(--ink); text-align: left; }
    button.metric { cursor: pointer; }
    button.metric:hover { background: rgba(103, 247, 212, .045); }
    .metric:last-child { border-right: 0; }
    .metric strong { display: block; margin-bottom: 7px; font-size: clamp(1.7rem, 3vw, 2.4rem); line-height: 1; letter-spacing: -.045em; }
    .metric span { color: var(--faint); font-size: .78rem; letter-spacing: .07em; text-transform: uppercase; }

    .snapshot-band {
      display: grid;
      grid-template-columns: minmax(180px, .65fr) minmax(0, 1.35fr);
      gap: 26px;
      margin-top: 34px;
      padding: 22px 24px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: rgba(10, 27, 32, .58);
      overflow: hidden;
    }
    .snapshot-title { min-width: 0; display: flex; align-items: flex-start; gap: 12px; font-weight: 750; overflow-wrap: anywhere; }
    .snapshot-title::before { content: ""; flex: 0 0 auto; width: 10px; height: 10px; margin-top: 7px; border: 2px solid var(--amber); border-radius: 50%; }
    .snapshot-band p { min-width: 0; margin: 0; color: var(--muted); font-size: .91rem; overflow-wrap: anywhere; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; overflow-wrap: anywhere; word-break: break-all; }

    .section { padding: clamp(78px, 10vw, 142px) 0 0; scroll-margin-top: 80px; }
    .section-heading { display: grid; grid-template-columns: minmax(0, 1fr) minmax(300px, .7fr); gap: 42px; align-items: end; margin-bottom: 34px; }
    .section-heading h2 { max-width: 760px; margin-bottom: 0; font-size: clamp(2.15rem, 4.7vw, 4.4rem); line-height: 1; letter-spacing: -.052em; }
    .section-heading > p { margin-bottom: 2px; color: var(--muted); font-size: 1rem; }

    .signal-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; }
    .signal-card, .owner-panel, .boundary-card, .lab-card, .finding-card {
      border: 1px solid var(--line);
      background: linear-gradient(145deg, rgba(15, 38, 44, .72), rgba(8, 22, 27, .72));
      box-shadow: inset 0 1px rgba(255, 255, 255, .025);
    }
    .signal-card { grid-column: span 3; min-height: 190px; padding: 23px; border-radius: 16px; overflow: hidden; position: relative; }
    .signal-card::after { content: ""; position: absolute; right: -35px; bottom: -45px; width: 130px; height: 130px; border: 1px solid currentColor; border-radius: 50%; opacity: .12; }
    .signal-card .signal-index { color: currentColor; font: 700 .7rem/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .12em; }
    .signal-card strong { display: block; margin: 36px 0 7px; color: var(--ink); font-size: 2.65rem; line-height: 1; letter-spacing: -.05em; }
    .signal-card span { color: var(--muted); font-size: .84rem; }
    .owner-panel { grid-column: span 7; min-height: 340px; padding: 27px; border-radius: 18px; }
    .boundary-card { grid-column: span 5; min-height: 340px; padding: 27px; border-radius: 18px; }
    .panel-label { margin-bottom: 22px; color: var(--faint); font: 700 .72rem/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .12em; text-transform: uppercase; }
    .owner-row { display: grid; grid-template-columns: minmax(118px, 1fr) 2.3fr 38px; gap: 14px; align-items: center; margin: 17px 0; }
    .owner-row span { color: var(--muted); font-size: .82rem; overflow-wrap: anywhere; }
    .owner-track { height: 8px; border-radius: 999px; background: rgba(255, 255, 255, .055); overflow: hidden; }
    .owner-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--mint), var(--cyan)); box-shadow: 0 0 18px rgba(103, 247, 212, .2); }
    .owner-row strong { text-align: right; font: 700 .78rem/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .boundary-list { display: grid; gap: 11px; padding: 0; margin: 0; list-style: none; }
    .boundary-list li { position: relative; padding: 0 0 0 26px; color: var(--muted); font-size: .9rem; }
    .boundary-list li::before { content: ""; position: absolute; left: 0; top: .6em; width: 11px; height: 1px; background: var(--amber); }

    .explorer-shell { border: 1px solid var(--line); border-radius: 22px; background: rgba(7, 20, 24, .72); box-shadow: var(--shadow); overflow: clip; }
    .filter-dock { position: sticky; top: 74px; z-index: 20; padding: 18px; border-bottom: 1px solid var(--line); background: rgba(8, 23, 28, .94); backdrop-filter: blur(18px); }
    .filter-grid { display: grid; grid-template-columns: minmax(250px, 1.5fr) repeat(3, minmax(145px, .55fr)) auto; gap: 10px; }
    .field { display: grid; gap: 7px; }
    .field label { color: var(--faint); font: 700 .68rem/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .1em; text-transform: uppercase; }
    input, select {
      width: 100%;
      min-height: 46px;
      border: 1px solid var(--line-strong);
      border-radius: 10px;
      background: #0a1c22;
      color: var(--ink);
      padding: 10px 12px;
    }
    input::placeholder { color: #68827b; }
    input:hover, select:hover { border-color: rgba(103, 247, 212, .5); }
    .filter-actions { display: flex; align-items: end; gap: 9px; }
    .toggle {
      min-height: 46px;
      padding: 10px 13px;
      border: 1px solid var(--line-strong);
      border-radius: 10px;
      background: #0a1c22;
      color: var(--muted);
      white-space: nowrap;
    }
    .toggle[aria-pressed="true"] { border-color: var(--amber); color: var(--amber); background: rgba(255, 204, 114, .08); }
    .filter-meta { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-top: 15px; }
    .result-count { color: var(--muted); font-size: .88rem; }
    .result-count strong { color: var(--ink); }
    .filter-meta-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
    .scope-pill { display: inline-flex; align-items: center; min-height: 42px; padding: 8px 12px; border: 1px solid rgba(103, 247, 212, .28); border-radius: 999px; color: var(--mint); font: 700 .69rem/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .06em; text-transform: uppercase; }
    .asset-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; padding: 18px; }
    .asset-card {
      --kind-color: var(--mint);
      min-width: 0;
      min-height: 330px;
      display: flex;
      flex-direction: column;
      padding: 20px;
      border: 1px solid var(--line);
      border-radius: 15px;
      background: linear-gradient(160deg, rgba(16, 40, 46, .74), rgba(8, 22, 27, .74));
      box-shadow: inset 0 2px var(--kind-color);
      transition: transform .2s ease, border-color .2s ease, background .2s ease;
    }
    .asset-card:hover { transform: translateY(-3px); border-color: var(--line-strong); background: linear-gradient(160deg, rgba(19, 47, 53, .86), rgba(9, 24, 29, .84)); }
    .kind-github { --kind-color: var(--mint); }
    .kind-hf-model { --kind-color: var(--violet); }
    .kind-hf-space { --kind-color: var(--cyan); }
    .kind-hf-dataset { --kind-color: var(--amber); }
    .card-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 21px; }
    .badge { display: inline-flex; align-items: center; min-height: 25px; padding: 5px 8px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); font: 700 .66rem/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .05em; text-transform: uppercase; }
    .badge.kind { border-color: color-mix(in srgb, var(--kind-color), transparent 65%); color: var(--kind-color); }
    .badge.warning { color: var(--coral); border-color: rgba(255, 143, 138, .32); background: rgba(255, 143, 138, .055); }
    .badge.ok { color: var(--good); border-color: rgba(124, 240, 178, .24); }
    .badge.unknown { color: var(--amber); border-color: rgba(255, 204, 114, .3); background: rgba(255, 204, 114, .045); }
    .card-owner { color: var(--faint); font-size: .72rem; overflow-wrap: anywhere; text-align: right; }
    .asset-card h3 { margin-bottom: 11px; font-size: 1.1rem; line-height: 1.32; letter-spacing: -.02em; overflow-wrap: anywhere; }
    .asset-card h3 a { text-decoration: none; }
    .asset-card h3 a:hover { color: var(--kind-color); text-decoration: underline; text-underline-offset: 4px; }
    .asset-description { color: var(--muted); font-size: .86rem; line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 2px 0 18px; }
    .mini-tag { padding: 4px 7px; border-radius: 6px; background: rgba(255, 255, 255, .04); color: var(--faint); font-size: .7rem; }
    .card-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; margin-top: auto; }
    .card-metric { padding: 8px 9px; border: 1px solid rgba(135, 204, 190, .11); border-radius: 8px; }
    .card-metric strong { display: block; color: var(--ink); font: 700 .78rem/1.25 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; overflow-wrap: anywhere; }
    .card-metric span { color: var(--faint); font-size: .65rem; text-transform: uppercase; letter-spacing: .05em; }
    .card-footer { display: flex; align-items: end; justify-content: space-between; gap: 12px; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--line); }
    .revision { min-width: 0; color: var(--faint); font: 600 .68rem/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .revision code { display: block; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 170px; }
    .source-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
    .source-link, .copy-revision { color: var(--kind-color); font-size: .75rem; font-weight: 750; text-decoration: none; white-space: nowrap; }
    .copy-revision { padding: 0; border: 0; background: transparent; }
    .source-link:hover { text-decoration: underline; text-underline-offset: 4px; }
    .asset-card details { margin-top: 13px; color: var(--muted); font-size: .77rem; }
    .asset-card summary { min-height: 34px; display: flex; align-items: center; cursor: pointer; color: var(--faint); }
    .asset-card details[open] summary { margin-bottom: 9px; color: var(--ink); }
    .evidence-list { display: grid; grid-template-columns: auto 1fr; gap: 5px 12px; margin: 0; }
    .evidence-list dt { color: var(--faint); }
    .evidence-list dd { margin: 0; text-align: right; overflow-wrap: anywhere; }
    .empty-state { grid-column: 1 / -1; padding: 76px 20px; text-align: center; color: var(--muted); }
    .load-row { display: flex; justify-content: center; padding: 2px 18px 24px; }

    .lab-shell { position: relative; padding: clamp(24px, 4vw, 48px); border: 1px solid rgba(155, 140, 255, .25); border-radius: 24px; background: radial-gradient(circle at 85% 8%, rgba(155, 140, 255, .12), transparent 25rem), linear-gradient(145deg, rgba(16, 35, 48, .85), rgba(8, 22, 28, .88)); overflow: hidden; }
    .lab-shell::before { content: "SYNTHETIC"; position: absolute; top: 24px; right: -35px; padding: 7px 45px; border-block: 1px solid rgba(155, 140, 255, .2); color: rgba(192, 183, 255, .32); font: 800 .67rem/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .2em; transform: rotate(34deg); }
    .lab-intro { max-width: 880px; margin-bottom: 32px; color: var(--muted); font-size: 1rem; }
    .proof-path { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 26px; }
    .proof-node { position: relative; padding: 18px; border: 1px solid var(--line); border-radius: 12px; background: rgba(5, 18, 23, .55); }
    .proof-node:not(:last-child)::after { content: ""; position: absolute; top: 50%; right: -13px; z-index: 2; width: 13px; height: 1px; background: var(--violet); }
    .proof-node strong { display: block; margin: 9px 0 5px; font-size: .93rem; }
    .proof-node span { color: var(--faint); font-size: .77rem; }
    .lab-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .lab-card { min-height: 230px; padding: 19px; border-radius: 14px; }
    .lab-outcome { display: inline-flex; padding: 5px 7px; border-radius: 6px; background: rgba(155, 140, 255, .09); color: #c0b7ff; font: 750 .64rem/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .05em; }
    .lab-card h3 { margin: 24px 0 9px; font-size: 1rem; }
    .lab-card p { margin-bottom: 18px; color: var(--muted); font-size: .82rem; }
    .lab-facts { padding-top: 13px; border-top: 1px solid var(--line); color: var(--faint); font: 600 .68rem/1.6 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .lab-footer { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 24px; align-items: end; margin-top: 26px; padding-top: 22px; border-top: 1px solid var(--line); }
    .hash { min-width: 0; color: var(--faint); font: 600 .71rem/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; overflow-wrap: anywhere; }
    .hash strong { display: block; margin-bottom: 3px; color: var(--muted); }

    .queue-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px; }
    .queue-stat { padding: 17px 18px; border: 1px solid var(--line); border-radius: 12px; background: rgba(10, 27, 32, .65); color: var(--muted); text-align: left; }
    .queue-stat strong { display: block; margin-bottom: 5px; color: var(--ink); font-size: 1.55rem; }
    .queue-stat[aria-pressed="true"] { border-color: var(--mint); color: var(--mint); }
    .finding-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    .finding-card { min-height: 250px; display: flex; flex-direction: column; padding: 20px; border-radius: 14px; }
    .finding-card h3 { margin: 19px 0 9px; font-size: 1rem; overflow-wrap: anywhere; }
    .finding-card h3 a { text-decoration: none; }
    .finding-card h3 a:hover { color: var(--mint); text-decoration: underline; text-underline-offset: 4px; }
    .finding-card p { color: var(--muted); font-size: .84rem; }
    .finding-card details { margin-top: 12px; color: var(--muted); font-size: .78rem; }
    .finding-card summary { cursor: pointer; color: var(--amber); }
    .finding-links { display: grid; gap: 8px; margin: 10px 0 0; padding-left: 18px; }
    .finding-links a { color: var(--muted); text-underline-offset: 3px; }
    .next-step { margin-top: auto; padding-top: 14px; border-top: 1px solid var(--line); color: var(--faint); font-size: .75rem; }
    .findings-footer { display: flex; justify-content: center; margin-top: 22px; }

    .protocol { display: grid; grid-template-columns: repeat(3, 1fr); margin-top: clamp(78px, 10vw, 142px); border-block: 1px solid var(--line); }
    .protocol article { padding: 32px; border-right: 1px solid var(--line); }
    .protocol article:last-child { border-right: 0; }
    .protocol-index { color: var(--mint); font: 700 .69rem/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .1em; }
    .protocol h3 { margin: 18px 0 9px; font-size: 1rem; }
    .protocol p { margin: 0; color: var(--muted); font-size: .84rem; }

    footer { padding: 50px 0 64px; }
    .footer-inner { display: flex; align-items: flex-end; justify-content: space-between; gap: 28px; }
    .footer-title { margin-bottom: 8px; font-weight: 760; letter-spacing: -.01em; }
    .footer-copy { max-width: 760px; margin: 0; color: var(--faint); font-size: .78rem; }
    .footer-mark { color: var(--mint); font: 700 .67rem/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .11em; text-transform: uppercase; text-align: right; }

    @keyframes orbit { to { transform: rotate(360deg); } }
    @media (max-width: 1120px) {
      .hero-grid { grid-template-columns: 1fr .72fr; gap: 44px; }
      .orbit-panel { min-height: 390px; }
      .asset-grid, .finding-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .signal-card { grid-column: span 6; }
      .lab-grid { grid-template-columns: repeat(2, 1fr); }
      .filter-grid { grid-template-columns: 1fr 1fr 1fr; }
      .field.search { grid-column: 1 / -1; }
      .filter-actions { grid-column: 1 / -1; }
    }
    @media (max-width: 850px) {
      .shell { width: min(100% - 32px, 720px); }
      .nav-links a:not(.queue-link) { display: none; }
      .hero { padding-top: 68px; }
      .hero-grid, .section-heading, .snapshot-band { grid-template-columns: minmax(0, 1fr); }
      h1 { font-size: clamp(3.25rem, 15vw, 5.7rem); }
      .orbit-panel { min-height: 410px; }
      .metric-rail { grid-template-columns: repeat(2, 1fr); }
      .metric:nth-child(2) { border-right: 0; }
      .metric:nth-child(-n + 2) { border-bottom: 1px solid var(--line); }
      .signal-card { grid-column: span 6; }
      .owner-panel, .boundary-card { grid-column: 1 / -1; }
      .proof-path, .protocol { grid-template-columns: 1fr; }
      .proof-node:not(:last-child)::after { top: auto; right: auto; bottom: -13px; left: 50%; width: 1px; height: 13px; }
      .protocol article { border-right: 0; border-bottom: 1px solid var(--line); }
      .protocol article:last-child { border-bottom: 0; }
      .footer-inner { align-items: flex-start; flex-direction: column; }
      .footer-mark { text-align: left; }
    }
    @media (max-width: 620px) {
      .shell { width: min(100% - 24px, 560px); }
      .nav-inner { min-height: 68px; }
      .brand-copy span { display: none; }
      .nav-state { padding: 8px; font-size: .61rem; }
      h1 { font-size: clamp(3rem, 16vw, 4.5rem); }
      .hero-copy { font-size: 1rem; }
      .orbit-panel { min-height: 360px; }
      .orbit-panel::before { width: 310px; height: 310px; }
      .orbit-panel::after { width: 250px; height: 250px; }
      .orbit-core { width: 185px; }
      .orbit-number strong { font-size: 2.8rem; }
      .metric { padding: 20px 15px; }
      .section { padding-top: 90px; }
      .section-heading { gap: 20px; }
      .signal-card, .owner-panel, .boundary-card { grid-column: 1 / -1; }
      .filter-dock { position: static; }
      .filter-grid { grid-template-columns: 1fr; }
      .field.search, .filter-actions { grid-column: auto; }
      .filter-actions { align-items: stretch; flex-direction: column; }
      .filter-meta { align-items: flex-start; flex-direction: column; }
      .filter-meta-actions { width: 100%; justify-content: flex-start; }
      .asset-grid, .finding-grid, .lab-grid, .queue-summary { grid-template-columns: 1fr; }
      .asset-grid { padding: 12px; }
      .asset-card { min-height: 0; }
      .proof-path { grid-template-columns: 1fr; }
      .lab-footer { grid-template-columns: 1fr; }
      .protocol article { padding: 28px 8px; }
    }
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
      *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
    }
  </style>
</head>
<body>
  <a class="skip-link" href="#main">Skip to main content</a>
  <nav class="site-nav" aria-label="Primary navigation">
    <div class="shell nav-inner">
      <a class="brand" href="#top" aria-label="SZL Frontier Atlas home">
        <span class="brand-mark" aria-hidden="true"></span>
        <span class="brand-copy"><strong>Frontier Atlas</strong><span>Public evidence observatory</span></span>
      </a>
      <div class="nav-links">
        <a href="#signal">Signal map</a>
        <a href="#explore">Explorer</a>
        <a href="#evidence-lab">Evidence lab</a>
        <a class="queue-link" href="#findings">Queue <span id="navQueueCount"></span></a>
        <span class="nav-state" id="navState">Snapshot</span>
      </div>
    </div>
  </nav>

  <noscript><div class="shell snapshot-band" style="margin-top:24px"><div class="snapshot-title">JavaScript is disabled</div><p>The evidence boundary still applies, but interactive filtering and rendered inventory cards require JavaScript. No remote code is loaded by this Site.</p></div></noscript>

  <main id="main">
    <header class="hero shell" id="top">
      <div class="hero-grid">
        <div>
          <p class="eyebrow">SZL Holdings · public estate · source-linked</p>
          <h1>See the whole <span class="gradient-word">frontier.</span><br>Trust the evidence.</h1>
          <p class="hero-copy">A navigable map of public repositories, models, datasets, and Spaces—each tied to its observed source revision. Availability, evaluation, and release eligibility remain deliberately separate.</p>
          <div class="hero-actions">
            <a class="button primary" href="#explore">Explore the estate</a>
            <a class="button" id="queueCta" href="#findings">Review the evidence queue</a>
          </div>
        </div>
        <aside class="orbit-panel" aria-labelledby="orbitTitle">
          <div class="orbit-core">
            <div class="orbit-number"><strong id="orbitTotal">—</strong><span id="orbitTitle">public assets</span></div>
          </div>
          <div class="orbit-legend" id="orbitLegend" aria-label="Asset type composition"></div>
          <div class="orbit-foot">Observed metadata · no execution</div>
        </aside>
      </div>
      <div class="metric-rail" id="metricRail" aria-label="Snapshot metrics"></div>
      <div class="snapshot-band">
        <div class="snapshot-title" id="snapshotTitle">Evidence snapshot, not a live monitor</div>
        <p><span id="snapshotStamp">Observed metadata is loading. This atlas does not prove current availability, model quality, or release readiness.</span><br><span class="mono" id="projectionHash"></span></p>
      </div>
    </header>

    <section class="section shell" id="signal" aria-labelledby="signalTitle">
      <div class="section-heading">
        <div><p class="kicker">Estate topology</p><h2 id="signalTitle">A field map with the receipts attached.</h2></div>
        <p>Volume shows where the estate lives. Every count comes from the packaged public projection; owner names and source states are preserved exactly as observed.</p>
      </div>
      <div class="signal-grid">
        <div id="kindSignals" style="display:contents"></div>
        <article class="owner-panel"><div class="panel-label">Owner distribution</div><div id="ownerBars"></div></article>
        <article class="boundary-card"><div class="panel-label">Known limits</div><ul class="boundary-list" id="limitList"></ul></article>
      </div>
    </section>

    <section class="section shell" id="explore" aria-labelledby="exploreTitle">
      <div class="section-heading">
        <div><p class="kicker">Public asset explorer</p><h2 id="exploreTitle">Find the signal. Open the source.</h2></div>
        <p>Search across identifiers, descriptions, owners, categories, licenses, and observed status. The export contains only the currently filtered public rows.</p>
      </div>
      <div class="explorer-shell">
        <div class="filter-dock">
          <form class="filter-grid" id="filterForm" role="search" aria-label="Filter public estate assets">
            <div class="field search"><label for="query">Search the estate</label><input id="query" type="search" autocomplete="off" placeholder="Try a11oy, Khipu, dataset, Python…"></div>
            <div class="field"><label for="kind">Asset class</label><select id="kind"><option value="">All classes</option></select></div>
            <div class="field"><label for="owner">Owner</label><select id="owner"><option value="">All owners</option></select></div>
            <div class="field"><label for="reviewState">Evidence state</label><select id="reviewState"><option value="">All states</option><option value="adverse">Adverse</option><option value="unknown">Unknown / unverified</option><option value="positive">Observed positive</option></select></div>
            <div class="filter-actions">
              <button class="toggle" id="attention" type="button" aria-pressed="false">Needs review</button>
            </div>
          </form>
          <div class="filter-meta">
            <div class="result-count" id="resultCount" role="status" aria-live="polite"></div>
            <div class="filter-meta-actions">
              <span class="scope-pill">Public records only</span>
              <button class="button subtle" id="resetFilters" type="button">Reset filters</button>
              <button class="button subtle" id="exportCsv" type="button">Export filtered CSV</button>
            </div>
          </div>
        </div>
        <div class="asset-grid" id="assetGrid"></div>
        <div class="load-row"><button class="button" id="loadMore" type="button">Show more assets</button></div>
      </div>
    </section>

    <section class="section shell" id="evidence-lab" aria-labelledby="labTitle">
      <div class="section-heading">
        <div><p class="kicker">Evidence boundary lab</p><h2 id="labTitle">A demonstration that refuses to overclaim.</h2></div>
        <p>The uploaded control-plane artifact is represented as a fixed, non-executable public projection. Its synthetic outcomes are not authentication, authorization, policy-engine, or deployment proof.</p>
      </div>
      <div class="lab-shell">
        <p class="lab-intro" id="labSummary"></p>
        <div class="proof-path" aria-label="Evidence interpretation path">
          <div class="proof-node"><span class="badge">01 · input</span><strong>Submitted artifact</strong><span>Reviewed as untrusted audit data.</span></div>
          <div class="proof-node"><span class="badge">02 · projection</span><strong>Fixed scenarios</strong><span>Rendered without executing policy or identity code.</span></div>
          <div class="proof-node"><span class="badge">03 · relation</span><strong>Related code link</strong><span>A related implementation, not proven source lineage.</span></div>
        </div>
        <div class="lab-grid" id="labGrid"></div>
        <div class="lab-footer">
          <div class="hash"><strong>Payload digest</strong><span id="payloadHash"></span></div>
          <a class="button" id="relatedImplementation" href="#">Inspect related implementation</a>
        </div>
      </div>
    </section>

    <section class="section shell" id="findings" aria-labelledby="findingsTitle">
      <div class="section-heading">
        <div><p class="kicker">Observed review queue</p><h2 id="findingsTitle">Where the next proof belongs.</h2></div>
        <p>These are snapshot findings—not diagnoses. Each recommended step starts by opening the linked evidence and reproducing the exact condition before changing source.</p>
      </div>
      <div class="queue-summary" aria-label="Finding categories">
        <button class="queue-stat" id="queueWorkflow" type="button" aria-pressed="false"><strong>—</strong>failed workflow observations</button>
        <button class="queue-stat" id="queueModel" type="button" aria-pressed="false"><strong>—</strong>blocked model releases</button>
        <button class="queue-stat" id="queueDocs" type="button" aria-pressed="false"><strong>—</strong>documentation gaps</button>
      </div>
      <div class="finding-grid" id="findingGrid"></div>
      <div class="findings-footer"><button class="button" id="showFindings" type="button"></button></div>
    </section>

    <section class="protocol shell" aria-label="Atlas evidence protocol">
      <article><span class="protocol-index">01 · SCOPE</span><h3>Public projection only</h3><p>Private inventory rows and local identity or credential diagnostics are not part of this published surface.</p></article>
      <article><span class="protocol-index">02 · PROVENANCE</span><h3>Source and revision together</h3><p>An asset name is not evidence by itself. The atlas keeps the observed source URL, revision, and timestamp beside the claim.</p></article>
      <article><span class="protocol-index">03 · INTERPRETATION</span><h3>Unknown stays unknown</h3><p>A green workflow is not proof that every workflow or the current head passed. Artifact names do not prove successful training or inference.</p></article>
    </section>
  </main>

  <footer>
    <div class="shell footer-inner">
      <div><div class="footer-title">SZL Frontier Atlas</div><p class="footer-copy">Generated from read-only metadata and source documentation. No repository code, model weights, datasets, inference, or paid compute jobs were executed to produce this snapshot.</p></div>
      <div class="footer-mark">Map the frontier<br>keep the receipts</div>
    </div>
  </footer>

  <script>
const DATA=__SZL_DATA_JSON__;
const ANATOMY=__SZL_ANATOMY_JSON__;
const PROJECTION_SHA256='__SZL_PROJECTION_SHA256__';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const APPROVED_HOSTS=new Set(['github.com','huggingface.co']);
const safeUrl=value=>{try{const url=new URL(String(value));return url.protocol==='https:'&&APPROVED_HOSTS.has(url.hostname)?url.href:'#';}catch{return '#';}};
const byId=id=>document.getElementById(id);
const countBy=(items,key)=>items.reduce((counts,item)=>{const value=String(item[key]??'Unknown');counts[value]=(counts[value]||0)+1;return counts;},{});
const formatNumber=value=>new Intl.NumberFormat('en-US').format(Number(value)||0);
function statusTone(asset){
  const status=String(asset.status||'').toLowerCase();
  if(/failures at observed revision|declared promotion blocked|runtime_error|build_error|config_error|no_app_file/.test(status))return 'adverse';
  if(/observed runs successful at revision/.test(status))return 'positive';
  return 'unknown';
}
const needsAttention=asset=>statusTone(asset)==='adverse';
const needsReview=asset=>statusTone(asset)!=='positive';
const kindColors={'GitHub':'#67f7d4','HF Model':'#9b8cff','HF Space':'#55c9ff','HF Dataset':'#ffcc72'};
const kindClasses={'GitHub':'kind-github','HF Model':'kind-hf-model','HF Space':'kind-hf-space','HF Dataset':'kind-hf-dataset'};
const PAGE_SIZE=24;
const state={query:'',kind:'',owner:'',review:'',attention:false,shown:PAGE_SIZE,findingsExpanded:false,findingCategory:''};

function filterAssets(criteria){
  const q=String(criteria.query||'').trim().toLowerCase();
  return DATA.assets.filter(asset=>{
    const haystack=[asset.id,asset.description,asset.owner,asset.kind,asset.category,asset.status,asset.license].join(' ').toLowerCase();
    return (!q||haystack.includes(q))&&(!criteria.kind||asset.kind===criteria.kind)&&(!criteria.owner||asset.owner===criteria.owner)&&(!criteria.review||statusTone(asset)===criteria.review)&&(!criteria.attention||needsReview(asset));
  });
}

function buildGradient(counts,total){
  let cursor=0;
  const stops=[];
  Object.entries(counts).forEach(([kind,count])=>{const start=cursor;cursor+=count/total*100;stops.push((kindColors[kind]||'#67f7d4')+' '+start.toFixed(2)+'% '+cursor.toFixed(2)+'%');});
  return 'conic-gradient('+stops.join(',')+')';
}

function renderOverview(){
  const assets=DATA.assets;
  const kindCounts=countBy(assets,'kind');
  const ownerCounts=countBy(assets,'owner');
  const adverseCount=assets.filter(needsAttention).length;
  const unknownCount=assets.filter(asset=>statusTone(asset)==='unknown').length;
  byId('orbitTotal').textContent=formatNumber(assets.length);
  document.documentElement.style.setProperty('--chart-gradient',buildGradient(kindCounts,assets.length));
  byId('orbitLegend').innerHTML=Object.entries(kindCounts).map(([kind,count])=>'<div class="orbit-label"><strong>'+formatNumber(count)+'</strong>'+esc(kind)+'</div>').join('');
  byId('metricRail').innerHTML=[
    '<div class="metric"><strong>'+formatNumber(assets.length)+'</strong><span>public assets</span></div>',
    '<div class="metric"><strong>'+formatNumber(Object.keys(ownerCounts).length)+'</strong><span>observed owners</span></div>',
    '<button class="metric" id="metricAdverse" type="button"><strong>'+formatNumber(adverseCount)+'</strong><span>adverse evidence · filter</span></button>',
    '<button class="metric" id="metricUnknown" type="button"><strong>'+formatNumber(unknownCount)+'</strong><span>unknown / unverified · filter</span></button>'
  ].join('');
  const observed=new Date(DATA.generated_at);
  const provenance=DATA.coverage.provenance||{};
  const formatObserved=value=>value?new Date(value).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}):'unknown';
  if(DATA.coverage.converged===false){
    byId('snapshotTitle').textContent='Mixed-source, revision-bound, non-live projection';
    byId('snapshotStamp').textContent='Assembled '+formatObserved(DATA.generated_at)+'. GitHub baseline '+formatObserved(provenance.github_baseline_observed_at)+'; authenticated org delta '+formatObserved(provenance.github_delta_observed_at)+'; Hugging Face '+formatObserved(provenance.huggingface_observed_at)+'. Controls were not refreshed.';
    byId('navState').textContent='Mixed snapshot';
  }else{
    byId('snapshotStamp').textContent='Observed '+observed.toLocaleString(undefined,{dateStyle:'long',timeStyle:'short'})+'. The page is a fixed metadata snapshot; source state may have changed since collection.';
  }
  byId('projectionHash').textContent='Public projection SHA-256 '+PROJECTION_SHA256;
  byId('navQueueCount').textContent=formatNumber(DATA.findings.length);
  byId('queueCta').textContent='Review '+formatNumber(DATA.findings.length)+' findings';
  byId('kindSignals').innerHTML=Object.entries(kindCounts).map(([kind,count],index)=>'<article class="signal-card" style="color:'+esc(kindColors[kind]||'#67f7d4')+'"><span class="signal-index">0'+(index+1)+' · '+esc(kind.toUpperCase())+'</span><strong>'+formatNumber(count)+'</strong><span>'+((count/assets.length)*100).toFixed(1)+'% of the public projection</span></article>').join('');
  const max=Math.max(...Object.values(ownerCounts));
  byId('ownerBars').innerHTML=Object.entries(ownerCounts).sort((a,b)=>b[1]-a[1]).map(([owner,count])=>'<div class="owner-row"><span>'+esc(owner)+'</span><div class="owner-track" role="img" aria-label="'+esc(owner)+': '+formatNumber(count)+' public assets"><div class="owner-fill" style="width:'+((count/max)*100).toFixed(2)+'%"></div></div><strong>'+formatNumber(count)+'</strong></div>').join('');
  byId('limitList').innerHTML=DATA.coverage.limits.map(limit=>'<li>'+esc(limit)+'</li>').join('');
  byId('metricAdverse').addEventListener('click',()=>activateEvidenceFilter('adverse'));
  byId('metricUnknown').addEventListener('click',()=>activateEvidenceFilter('unknown'));
}

function activateEvidenceFilter(value){
  state.attention=false;state.review=value;
  byId('attention').setAttribute('aria-pressed','false');
  byId('reviewState').value=value;
  renderAssets(true);
  byId('explore').scrollIntoView({block:'start'});
}

function populateFilters(){
  const kinds=Object.keys(countBy(DATA.assets,'kind')).sort();
  const owners=Object.keys(countBy(DATA.assets,'owner')).sort((a,b)=>a.localeCompare(b));
  byId('kind').insertAdjacentHTML('beforeend',kinds.map(value=>'<option value="'+esc(value)+'">'+esc(value)+'</option>').join(''));
  byId('owner').insertAdjacentHTML('beforeend',owners.map(value=>'<option value="'+esc(value)+'">'+esc(value)+'</option>').join(''));
}

function assetMetrics(asset){
  const pairs=[];
  if(asset.workflow_count!=null)pairs.push([formatNumber(asset.workflow_count),'workflows seen']);
  if(asset.test_path_count!=null)pairs.push([formatNumber(asset.test_path_count),'test paths']);
  if(asset.skill_count!=null)pairs.push([formatNumber(asset.skill_count),'skill files']);
  if(asset.kernel_path_count!=null)pairs.push([formatNumber(asset.kernel_path_count),'kernel paths']);
  if(asset.downloads!=null)pairs.push([formatNumber(asset.downloads),'hub downloads']);
  if(asset.likes!=null)pairs.push([formatNumber(asset.likes),'hub likes']);
  return pairs.slice(0,4);
}

function statusLabel(asset){
  const status=String(asset.status||'Unknown state');
  if(/^Observed runs successful at revision$/i.test(status))return 'Observed workflows successful at revision';
  if(/historical workflow failures/i.test(status))return 'Older failures; observed revision unverified';
  if(/workflow failures at observed revision/i.test(status))return 'Workflow failures at observed revision';
  if(asset.kind==='HF Space'&&/^RUNNING$/i.test(status))return 'Hub stage: RUNNING · endpoint unchecked';
  if(/^Observed runs successful$/i.test(status))return 'Observed workflow sample · mixed revisions possible';
  if(/workflow failures/i.test(status))return 'Observed workflow failures · snapshot';
  return 'Observed: '+status;
}

function statusScope(asset){
  if(asset.kind==='GitHub')return 'Latest collected per-workflow metadata; runs can span revisions.';
  if(asset.kind==='HF Space')return 'Hub-reported stage at snapshot; live endpoint was not checked.';
  return 'Hub card or metadata observation; not an independent evaluation.';
}

function revisionUrl(asset){
  const revision=String(asset.revision||'');
  if(!/^[0-9a-f]{40,64}$/i.test(revision))return '#';
  return safeUrl(String(asset.url).replace(/\/$/,'')+'/tree/'+revision);
}

function assetCard(asset){
  const metrics=assetMetrics(asset);
  const tone=statusTone(asset);
  const pinned=revisionUrl(asset);
  const evidence=[
    ['Source updated',asset.updated||'Unknown'],
    ['License',asset.license||'Unknown'],
    ['Category',asset.category||'Unknown'],
    ['Tree truncated',asset.tree_truncated==null?'Not reported':asset.tree_truncated?'Yes':'No'],
    ['Status scope',statusScope(asset)]
  ];
  return '<article class="asset-card '+esc(kindClasses[asset.kind]||'')+'">'+
    '<div class="card-top"><span class="badge kind">'+esc(asset.kind)+'</span><span class="card-owner">'+esc(asset.owner)+'</span></div>'+
    '<h3><a href="'+esc(pinned)+'" target="_blank" rel="noopener noreferrer">'+esc(asset.id)+'<span class="sr-only"> observed revision (opens in a new tab)</span></a></h3>'+
    '<p class="asset-description">'+esc(asset.description||'No public description was observed at this snapshot.')+'</p>'+
    '<div class="card-tags"><span class="mini-tag">'+esc(asset.category||'Uncategorized')+'</span><span class="badge '+(tone==='adverse'?'warning':tone==='positive'?'ok':'unknown')+'">'+esc(statusLabel(asset))+'</span>'+(asset.archived?'<span class="mini-tag">Archived</span>':'')+'</div>'+
    (metrics.length?'<div class="card-metrics">'+metrics.map(item=>'<div class="card-metric"><strong>'+esc(item[0])+'</strong><span>'+esc(item[1])+'</span></div>').join('')+'</div>':'')+
    '<details><summary>Observed metadata</summary><dl class="evidence-list">'+evidence.map(item=>'<dt>'+esc(item[0])+'</dt><dd>'+esc(item[1])+'</dd>').join('')+'</dl></details>'+
    '<div class="card-footer"><div class="revision">observed revision<code title="'+esc(asset.revision||'Unknown')+'">'+esc(asset.revision||'Unknown')+'</code></div><div class="source-actions"><a class="source-link" href="'+esc(pinned)+'" target="_blank" rel="noopener noreferrer">Pinned evidence<span class="sr-only"> (opens in a new tab)</span></a><a class="source-link" href="'+esc(safeUrl(asset.url))+'" target="_blank" rel="noopener noreferrer">Current source<span class="sr-only"> (opens in a new tab)</span></a><button class="copy-revision" type="button" data-copy-revision="'+esc(asset.revision||'')+'">Copy hash</button></div></div>'+
    '</article>';
}

function renderAssets(resetPage){
  if(resetPage)state.shown=PAGE_SIZE;
  const filtered=filterAssets(state);
  const shown=filtered.slice(0,state.shown);
  byId('assetGrid').innerHTML=shown.length?shown.map(assetCard).join(''):'<div class="empty-state"><strong>No public assets match this view.</strong><br>Try clearing a filter or using a broader search term.</div>';
  byId('resultCount').innerHTML='Showing <strong>'+formatNumber(shown.length)+'</strong> of <strong>'+formatNumber(filtered.length)+'</strong> matching assets · '+formatNumber(DATA.assets.length)+' total public assets';
  byId('loadMore').hidden=shown.length>=filtered.length;
  byId('loadMore').textContent='Show '+formatNumber(Math.min(PAGE_SIZE,filtered.length-shown.length))+' more assets';
  return filtered;
}

function readControls(){
  state.query=byId('query').value;
  state.kind=byId('kind').value;
  state.owner=byId('owner').value;
  state.review=byId('reviewState').value;
  renderAssets(true);
}

function resetFilters(){
  state.query='';state.kind='';state.owner='';state.review='';state.attention=false;
  byId('query').value='';byId('kind').value='';byId('owner').value='';byId('reviewState').value='';
  byId('attention').setAttribute('aria-pressed','false');
  renderAssets(true);
}

function csvForAssets(assets){
  const columns=['kind','id','owner','category','status','license','revision','url'];
  const quote=value=>{let cell=String(value??'');if(/^[=+\-@]/.test(cell))cell="'"+cell;return '"'+cell.replaceAll('"','""')+'"';};
  return [columns.join(','),...assets.map(asset=>columns.map(column=>quote(asset[column])).join(','))].join('\r\n');
}

function exportCsv(){
  const csv=csvForAssets(filterAssets(state));
  const blobUrl=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=blobUrl;link.download='szl-frontier-atlas-public-filter.csv';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(blobUrl),0);
}

function renderLab(){
  byId('labSummary').textContent=ANATOMY.summary;
  byId('payloadHash').textContent='SHA-256 '+ANATOMY.payload.sha256+' · '+ANATOMY.payload.self_check.passed+'/'+(ANATOMY.payload.self_check.passed+ANATOMY.payload.self_check.failed)+' synthetic self-checks represented · executable: no · authority: no';
  byId('labGrid').innerHTML=ANATOMY.scenarios.map(scenario=>{const outcome=String(scenario.outcome).startsWith('SIMULATED_')?scenario.outcome:'SIMULATED_'+scenario.outcome;return '<article class="lab-card"><span class="lab-outcome">'+esc(outcome)+'</span><h3>'+esc(scenario.label)+'</h3><p>'+esc(scenario.detail)+'</p><div class="lab-facts">Executable: no<br>Identity authenticated: no</div></article>';}).join('');
  const related=byId('relatedImplementation');related.href=safeUrl(ANATOMY.related_implementation.url);related.target='_blank';related.rel='noopener noreferrer';related.textContent=ANATOMY.related_implementation.label;related.setAttribute('aria-label',ANATOMY.related_implementation.label+' (opens in a new tab)');
}

function findingCategory(finding){
  if(/run for/i.test(finding.finding))return 'workflow';
  if(/model card/i.test(finding.finding))return 'model';
  if(/readme/i.test(finding.finding))return 'docs';
  return 'other';
}

function selectFindingCategory(category){
  state.findingCategory=state.findingCategory===category?'':category;
  state.findingsExpanded=false;
  renderFindings();
}

function renderFindings(){
  const counts=countBy(DATA.findings.map(finding=>({...finding,category:findingCategory(finding)})),'category');
  const queueButtons={workflow:'queueWorkflow',model:'queueModel',docs:'queueDocs'};
  Object.entries(queueButtons).forEach(([category,id])=>{
    const button=byId(id);
    button.querySelector?.('strong');
    button.innerHTML='<strong>'+formatNumber(counts[category]||0)+'</strong>'+(category==='workflow'?'failed workflow observations':category==='model'?'blocked model releases':'documentation gaps');
    button.setAttribute('aria-pressed',String(state.findingCategory===category));
  });
  const matching=DATA.findings.filter(finding=>!state.findingCategory||findingCategory(finding)===state.findingCategory);
  const groups=[];
  matching.forEach(finding=>{
    let group=groups.find(item=>item.asset===finding.asset);
    if(!group){group={asset:finding.asset,findings:[]};groups.push(group);}
    group.findings.push(finding);
  });
  const visible=groups.slice(0,state.findingsExpanded?groups.length:6);
  byId('findingGrid').innerHTML=visible.map(group=>{
    const first=group.findings[0];
    const current=group.findings.filter(finding=>finding.priority==='P1').length;
    return '<article class="finding-card"><span class="badge '+(current?'warning':'unknown')+'">'+formatNumber(group.findings.length)+' observation'+(group.findings.length===1?'':'s')+'</span><h3><a href="'+esc(safeUrl(first.url))+'" target="_blank" rel="noopener noreferrer">'+esc(group.asset)+'<span class="sr-only"> (opens in a new tab)</span></a></h3><p>'+formatNumber(current)+' current-priority; '+formatNumber(group.findings.length-current)+' older or documentation observations.</p><details><summary>Open exact evidence links</summary><ul class="finding-links">'+group.findings.map(finding=>'<li><a href="'+esc(safeUrl(finding.url))+'" target="_blank" rel="noopener noreferrer">'+esc(finding.finding)+'</a></li>').join('')+'</ul></details><div class="next-step"><strong>Next evidence step</strong><br>'+esc(first.action)+'</div></article>';
  }).join('');
  const button=byId('showFindings');button.hidden=groups.length<=6;button.textContent=state.findingsExpanded?'Show the focused queue':'Show all '+formatNumber(groups.length)+' affected assets';button.setAttribute('aria-expanded',String(state.findingsExpanded));
}

function bindEvents(){
  byId('filterForm').addEventListener('submit',event=>event.preventDefault());
  ['query','kind','owner','reviewState'].forEach(id=>byId(id).addEventListener('input',readControls));
  byId('attention').addEventListener('click',()=>{state.attention=!state.attention;state.review='';byId('reviewState').value='';byId('attention').setAttribute('aria-pressed',String(state.attention));renderAssets(true);});
  byId('resetFilters').addEventListener('click',resetFilters);
  byId('exportCsv').addEventListener('click',exportCsv);
  byId('loadMore').addEventListener('click',()=>{state.shown+=PAGE_SIZE;renderAssets(false);});
  byId('showFindings').addEventListener('click',()=>{state.findingsExpanded=!state.findingsExpanded;renderFindings();});
  byId('queueWorkflow').addEventListener('click',()=>selectFindingCategory('workflow'));
  byId('queueModel').addEventListener('click',()=>selectFindingCategory('model'));
  byId('queueDocs').addEventListener('click',()=>selectFindingCategory('docs'));
  byId('assetGrid').addEventListener('click',async event=>{const button=event.target.closest?.('[data-copy-revision]');if(!button)return;try{await navigator.clipboard.writeText(button.dataset.copyRevision);button.textContent='Copied';}catch{button.textContent='Copy unavailable';}});
}

renderOverview();
populateFilters();
renderAssets(true);
renderLab();
renderFindings();
bindEvents();
window.__SZL_ATLAS__={filterAssets,needsAttention,needsReview,statusTone,revisionUrl,countBy,csvForAssets,safeUrl,findingCategory};
  </script>
</body>
</html>
`;

function safeInlineJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

const output = template
  .replace("__SZL_DATA_JSON__", safeInlineJson(data))
  .replace("__SZL_ANATOMY_JSON__", safeInlineJson(anatomy))
  .replace("__SZL_PROJECTION_SHA256__", projectionDigest);

fs.writeFileSync(outputPath, output, "utf8");
console.log(`Built ${outputPath} with ${data.assets.length} public assets.`);
