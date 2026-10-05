import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "SOURCE.json"), "utf8"));
const importedPaths = [
  ".gitignore",
  "build-atlas.mjs",
  "dist/index.html",
  "dist/anatomy-control-plane.json",
  "tests/anatomy-projection.test.mjs",
];

assert.equal(manifest.schema, "szl.atlas-source-binding/v2");
assert.equal(manifest.evidence_class, "DECLARED");
assert.equal(manifest.canonical_source.repository, "szl-holdings/szl-showcase");
assert.equal(manifest.canonical_source.path, "atlas");
assert.equal(manifest.historical_context.publication_state, "UNKNOWN");
assert.equal(manifest.historical_context.running_source_binding, "UNKNOWN");
assert.equal(manifest.projection.payload_executable, false);
assert.equal(manifest.projection.payload_authority, false);
assert.deepEqual(manifest.files.map((file) => file.path), importedPaths);
assert.equal(manifest.retained_import.repository, "szl-holdings/szl-showcase");
assert.equal(manifest.retained_import.commit, "70c6888b24465fb62e721e1d666342ef601b2542");
assert.equal(manifest.retained_import.evidence_class, "DECLARED");
assert.equal(manifest.derivation.base_commit, manifest.retained_import.commit);
assert.deepEqual(manifest.retained_import.files.map((file) => file.path), importedPaths);
assert.deepEqual(
  manifest.files.filter((file, index) => file.git_blob !== manifest.retained_import.files[index].git_blob).map((file) => file.path),
  ["build-atlas.mjs", "dist/index.html", "tests/anatomy-projection.test.mjs"],
);
assert.equal(fs.existsSync(path.join(root, ".openai")), false, "provider control binding must stay out of source import");

const retainedBytes = new Map();
for (const file of manifest.files) {
  const absolute = path.join(root, file.path);
  assert.equal(fs.lstatSync(absolute).isFile(), true, `${file.path} must be a regular file`);
  const bytes = fs.readFileSync(absolute);
  assert.equal(bytes.length, file.bytes, `${file.path} size changed`);
  assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), file.sha256, `${file.path} bytes changed`);
  assert.equal(
    crypto.createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex"),
    file.git_blob,
    `${file.path} Git blob changed`,
  );
  retainedBytes.set(file.path, bytes);
}

const html = retainedBytes.get("dist/index.html").toString("utf8");
const data = JSON.parse(html.match(/const DATA=(.*?);\r?\nconst ANATOMY=/s)[1]);
assert.equal(data.generated_at, manifest.projection.generated_at);
assert.equal(data.assets.length, manifest.projection.assets);
assert.equal(data.findings.length, manifest.projection.findings);
assert.equal(data.assets.every((asset) => asset.private === false), true);

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}
function digest(value) {
  return crypto.createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}
assert.equal(digest(manifest.retained_import.files), "240c96973ff3387e2d0c14f9379481660c1f18da8212469983cf0e46e84c4bfa", "retained import identities changed");
assert.equal(digest(data), manifest.projection.sha256);
assert.equal(digest(JSON.parse(retainedBytes.get("dist/anatomy-control-plane.json"))), manifest.projection.anatomy_sha256);

const tempBase = fs.realpathSync(os.tmpdir());
const temporary = fs.mkdtempSync(path.join(tempBase, "szl-atlas-reproduction-"));
try {
  for (const [relative, bytes] of retainedBytes) {
    const destination = path.join(temporary, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, bytes);
  }
  execFileSync(process.execPath, [path.join(temporary, "build-atlas.mjs")], {
    cwd: temporary,
    env: {},
    timeout: 30_000,
    stdio: "pipe",
  });
  for (const relative of ["dist/index.html", "dist/anatomy-control-plane.json"]) {
    assert.deepEqual(fs.readFileSync(path.join(temporary, relative)), retainedBytes.get(relative), `${relative} rebuild differs`);
  }
} finally {
  const resolved = fs.realpathSync(temporary);
  const relative = path.relative(tempBase, resolved);
  assert.ok(relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
  assert.ok(path.basename(resolved).startsWith("szl-atlas-reproduction-"));
  fs.rmSync(resolved, { recursive: true, force: true });
}

console.log("Atlas retained identities, current source hashes and offline build reproduction passed");
