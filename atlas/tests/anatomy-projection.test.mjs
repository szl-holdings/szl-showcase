import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const dist = path.join(root, "dist");
const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const projection = JSON.parse(
  fs.readFileSync(path.join(dist, "anatomy-control-plane.json"), "utf8"),
);

const dataMatch = html.match(/const DATA=(.*?);\r?\nconst ANATOMY=/s);
const anatomyMatch = html.match(/const ANATOMY=(.*?);\r?\nconst PROJECTION_SHA256=/s);
const projectionDigestMatch = html.match(/const PROJECTION_SHA256='([0-9a-f]{64})'/);
assert.ok(dataMatch, "index.html must embed the reviewed public estate projection");
assert.ok(anatomyMatch, "index.html must embed the Anatomy public projection");
assert.ok(projectionDigestMatch, "index.html must expose the reviewed public projection digest");
const data = JSON.parse(dataMatch[1]);
assert.deepEqual(JSON.parse(anatomyMatch[1]), projection);

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
}

function digest(value) {
  return crypto.createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

assert.equal(
  digest(data),
  "4162e457f75fb0b5702129645bebff8b0e1e755f5fbd3f22a91ed83722cf0534",
  "public estate projection changed without review",
);
assert.equal(projectionDigestMatch[1], digest(data));
assert.equal(
  digest(projection),
  "17f2e9f45d06be64e996e619e7fafb0a7071cad00109323f5f5980b6df904057",
  "Anatomy projection changed without review",
);

assert.deepEqual(Object.keys(data).sort(), ["assets", "coverage", "findings", "generated_at"]);
assert.equal(data.assets.length, 259);
assert.equal(data.assets.filter((asset) => asset.private !== false).length, 0);
assert.equal(data.findings.length, 54);
assert.ok(!("local_models" in data));
assert.ok(!("local_skills" in data));
assert.ok(!("skills" in data));

const assetFields = new Set([
  "kind", "id", "owner", "url", "private", "archived", "description",
  "category", "status", "license", "revision", "updated", "workflow_count",
  "test_path_count", "skill_count", "kernel_path_count", "source_file_count",
  "tree_truncated", "downloads", "likes", "file_count", "card_available",
  "declared_artifact_class", "declared_base", "declared_eval_gate",
  "publication_eligible", "tensor_artifact", "numeric_archives",
]);
const approvedOwners = new Set([
  "szl-holdings", "ai4science-skills", "stephenlutar2-hash", "betterwithage",
  "SZLHOLDINGS",
]);
const approvedHosts = new Set(["github.com", "huggingface.co"]);

for (const asset of data.assets) {
  assert.ok(approvedOwners.has(asset.owner), `unreviewed owner: ${asset.owner}`);
  assert.ok(Object.keys(asset).every((key) => assetFields.has(key)), `unexpected public field on ${asset.id}`);
  const url = new URL(asset.url);
  assert.equal(url.protocol, "https:");
  assert.ok(approvedHosts.has(url.hostname), `unapproved asset host: ${url.hostname}`);
  assert.match(asset.revision, /^[0-9a-f]{40,64}$/i);
  assert.ok(!("ci" in asset), "nested workflow traces are not part of the minimized public projection");
  assert.ok(!("evidence_files" in asset), "raw evidence-file inventories are not part of the public projection");
}

const assetIds = new Set(data.assets.map((asset) => asset.id));
for (const finding of data.findings) {
  assert.ok(assetIds.has(finding.asset), `finding is not tied to a published asset: ${finding.asset}`);
  const url = new URL(finding.url);
  assert.equal(url.protocol, "https:");
  assert.ok(approvedHosts.has(url.hostname), `unapproved finding host: ${url.hostname}`);
}

assert.equal(projection.schema, "szl.public.anatomy-control-plane.v1");
assert.match(projection.payload.sha256, /^[0-9a-f]{64}$/);
assert.deepEqual(
  [projection.payload.self_check.passed, projection.payload.self_check.failed],
  [12, 0],
);
assert.equal(projection.payload.self_check.executable, false);
assert.equal(projection.payload.self_check.authority, false);
assert.ok(
  projection.scenarios.every(
    (scenario) => scenario.executable === false && scenario.identityAuthenticated === false,
  ),
);
assert.match(projection.related_implementation.relationship, /not proven to be the source/);
assert.equal(new URL(projection.related_implementation.url).hostname, "github.com");

function allFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? allFiles(full) : [full];
  });
}

const servedText = allFiles(dist)
  .filter((file) => /\.(?:html|json|js|css|txt|csv)$/i.test(file))
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");
for (const forbidden of [
  /[A-Z]:\\/i,
  /@(?:gmail|outlook|yahoo)\.com/i,
  /appgprj_/i,
  /siwc_bypass/i,
  /gh[opusr]_[A-Za-z0-9]{20,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
]) {
  assert.doesNotMatch(servedText, forbidden);
}
assert.doesNotMatch(dataMatch[1], /</, "embedded JSON must escape markup-significant characters");

for (const marker of [
  '<a class="skip-link" href="#main">',
  '<main id="main">',
  'role="search"',
  'role="status" aria-live="polite"',
  'aria-pressed="false"',
  '@media (prefers-reduced-motion: reduce)',
  'Public records only',
  'Evidence snapshot, not a live monitor',
  'SIMULATED_',
  '<noscript>',
]) {
  assert.ok(html.includes(marker), `missing experience marker: ${marker}`);
}
assert.ok(html.includes("Related code link"));
assert.ok(!html.includes("Canonical code link"));
assert.ok(!html.includes("All visibility"));
assert.ok(!html.includes("Private · internal"));

const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
assert.doesNotThrow(() => new Function(script), "inline application script must parse");

class FakeElement {
  constructor(id = "") {
    this.id = id;
    this.value = "";
    this.innerHTML = "";
    this.textContent = "";
    this.hidden = false;
    this.attributes = {};
    this.listeners = {};
    this.style = { setProperty: (key, value) => { this.style[key] = value; } };
  }
  addEventListener(type, listener) { this.listeners[type] = listener; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  insertAdjacentHTML(_position, value) { this.innerHTML += value; }
  appendChild(child) { child.parent = this; return child; }
  click() { this.clicked = true; }
  remove() { this.removed = true; }
  scrollIntoView() { this.scrolled = true; }
}

const elements = new Map();
const created = [];
const document = {
  documentElement: new FakeElement("documentElement"),
  body: new FakeElement("body"),
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, new FakeElement(id));
    return elements.get(id);
  },
  createElement(tag) {
    const node = new FakeElement(tag);
    created.push(node);
    return node;
  },
};
const context = { document, window: {}, console, Date, Intl, URL, Blob, setTimeout };
vm.runInNewContext(script, context);

const api = context.window.__SZL_ATLAS__;
assert.ok(api, "testable Atlas behavior API must be available");
assert.equal(elements.get("assetGrid").innerHTML.match(/<article /g).length, 24);
assert.match(elements.get("resultCount").innerHTML, /24.*259.*259/);
assert.ok(elements.get("query").listeners.input);
assert.ok(elements.get("loadMore").listeners.click);
assert.ok(elements.get("exportCsv").listeners.click);

const a11oy = api.filterAssets({ query: "A11OY", kind: "GitHub", owner: "szl-holdings", attention: false });
assert.ok(a11oy.length > 0);
assert.ok(a11oy.every((asset) => asset.kind === "GitHub" && asset.owner === "szl-holdings"));
assert.deepEqual(
  Array.from(api.filterAssets({ query: "", kind: "", owner: "", attention: false }), (asset) => asset.id),
  data.assets.map((asset) => asset.id),
  "unfiltered ordering must remain stable",
);
assert.equal(
  api.filterAssets({ query: "", kind: "", owner: "", attention: true }).length,
  data.assets.filter(api.needsReview).length,
);
assert.equal(api.statusTone(data.assets.find((asset) => asset.id === "SZLHOLDINGS/szl-science-forum-corpus")), "unknown");
const missingApp = data.assets.find((asset) => asset.id === "betterwithage/foundation-confirmation-v2");
assert.equal(missingApp.status, "NO_APP_FILE");
assert.equal(api.statusTone(missingApp), "adverse");
assert.equal(api.needsAttention(missingApp), true);
const adverseAssets = api.filterAssets({ query: "", kind: "", owner: "", review: "adverse", attention: false });
assert.equal(adverseAssets.length, 20);
assert.ok(adverseAssets.some((asset) => asset.id === missingApp.id));
const unknownAssets = api.filterAssets({ query: "", kind: "", owner: "", review: "unknown", attention: false });
assert.equal(unknownAssets.length, 235);
assert.ok(!unknownAssets.some((asset) => asset.id === missingApp.id));
assert.match(elements.get("metricRail").innerHTML, /id="metricAdverse"[^>]*><strong>20<\/strong>/);
assert.match(elements.get("metricRail").innerHTML, /id="metricUnknown"[^>]*><strong>235<\/strong>/);
assert.match(api.revisionUrl(data.assets.find((asset) => asset.id === "szl-holdings/szl-science-forum-corpus")), /\/tree\/[0-9a-f]{40}$/);
assert.equal(api.safeUrl("javascript:alert(1)"), "#");
assert.equal(api.safeUrl("https://example.com/not-approved"), "#");
assert.match(api.safeUrl("https://github.com/szl-holdings/a11oy"), /^https:\/\/github\.com\//);

const hostileCsv = api.csvForAssets([{
  kind: "GitHub", id: "=HYPERLINK(\"bad\")", owner: "betterwithage",
  category: "A, B", status: "Observed", license: null, revision: "abc",
  url: "https://github.com/betterwithage/example",
}]);
assert.ok(hostileCsv.startsWith("kind,id,owner,category,status,license,revision,url\r\n"));
assert.ok(hostileCsv.includes("\"'=HYPERLINK(\"\"bad\"\")\""));
assert.ok(hostileCsv.includes('"A, B"'));

elements.get("metricAdverse").listeners.click();
assert.equal(elements.get("reviewState").value, "adverse");
assert.match(elements.get("assetGrid").innerHTML, /betterwithage\/foundation-confirmation-v2/);
assert.equal(elements.get("assetGrid").innerHTML.match(/<article /g).length, 20);
elements.get("resetFilters").listeners.click();

elements.get("loadMore").listeners.click();
assert.equal(elements.get("assetGrid").innerHTML.match(/<article /g).length, 48);
elements.get("query").value = "a11oy";
elements.get("query").listeners.input();
assert.match(elements.get("resultCount").innerHTML, /matching assets/);
elements.get("attention").listeners.click();
assert.equal(elements.get("attention").attributes["aria-pressed"], "true");
elements.get("resetFilters").listeners.click();
assert.equal(elements.get("attention").attributes["aria-pressed"], "false");
elements.get("queueWorkflow").listeners.click();
assert.equal(elements.get("queueWorkflow").attributes["aria-pressed"], "true");
assert.match(elements.get("queueWorkflow").innerHTML, /41/);

let submitPrevented = false;
elements.get("filterForm").listeners.submit({ preventDefault() { submitPrevented = true; } });
assert.equal(submitPrevented, true);
elements.get("exportCsv").listeners.click();
const download = created.at(-1);
assert.equal(download.download, "szl-frontier-atlas-public-filter.csv");
assert.equal(download.clicked, true);

assert.match(elements.get("labGrid").innerHTML, /SIMULATED_ALLOW/);
assert.match(elements.get("labGrid").innerHTML, /SIMULATED_BLOCK/);
assert.match(elements.get("labGrid").innerHTML, /SIMULATED_REVIEW/);
assert.match(elements.get("labGrid").innerHTML, /SIMULATED_EMPTY/);
assert.match(elements.get("payloadHash").textContent, /executable: no · authority: no/);
assert.equal(elements.get("relatedImplementation").attributes["aria-label"].endsWith("(opens in a new tab)"), true);

console.log("Atlas public projection, evidence boundary, and interactions passed");
