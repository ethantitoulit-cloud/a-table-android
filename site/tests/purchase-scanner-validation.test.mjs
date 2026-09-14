import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("affiche les articles sous le lecteur avant leur validation", async () => {
  const modal = await readFile(new URL("../components/floating-tools.tsx", import.meta.url), "utf8");
  assert.match(modal, /Articles scannés/);
  assert.match(modal, /products\.map/);
  assert.match(modal, /Rangement de/);
  assert.match(modal, /INVENTORY_ZONE_LABELS/);
  assert.match(modal, /Valider \{products\.length/);
});

test("n’enregistre les achats qu’au moment de la validation", async () => {
  const actions = await readFile(new URL("../lib/purchase-scanner-actions.ts", import.meta.url), "utf8");
  const scanHandler = actions.slice(actions.indexOf("async function handleScannedBarcode"), actions.indexOf("async function saveManualScannedProduct"));
  const validation = actions.slice(actions.indexOf("async function validateScannedProducts"), actions.indexOf("async function handleScannedBarcode"));
  assert.doesNotMatch(scanHandler, /fetch\("\/api\/state"/);
  assert.match(validation, /fetch\("\/api\/state"/);
  assert.match(validation, /zone: product\.zone/);
});
