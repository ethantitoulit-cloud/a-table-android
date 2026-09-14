import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("produces the worker and client assets", async () => {
  await access(new URL("../dist/server/index.js", import.meta.url));
  const manifest = await readFile(new URL("../dist/client/.vite/manifest.json", import.meta.url), "utf8");
  assert.match(manifest, /app\/page/);
});
