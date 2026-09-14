import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, server: { middlewareMode: true } });
after(async () => vite.close());

const measures = await vite.ssrLoadModule("/lib/inventory-measures.ts");
const item = (quantity) => ({ quantity });

test("convertit les mesures reproductibles", () => {
  assert.deepEqual(measures.inventoryMeasure(item("1,25 kg"), "g"), { amount: 1250, unit: "g" });
  assert.deepEqual(measures.inventoryMeasure(item("75 cl"), "ml"), { amount: 750, unit: "ml" });
  assert.deepEqual(measures.inventoryMeasure(item("6 unités"), "unité"), { amount: 6, unit: "unité" });
});

test("calcule le contenu réel des conditionnements", () => {
  assert.deepEqual(measures.inventoryMeasure(item("2 boîtes de 400 g"), "g"), { amount: 800, unit: "g" });
  assert.deepEqual(measures.inventoryMeasure(item("1/2 paquet de 500 g"), "g"), { amount: 250, unit: "g" });
  assert.deepEqual(measures.inventoryMeasure(item("0,5 bouteille de 1 L"), "ml"), { amount: 500, unit: "ml" });
});

test("reste prudent avec une quantité approximative", () => {
  assert.deepEqual(measures.inventoryMeasure(item("environ 200 g"), "g"), { amount: 180, unit: "g" });
});

test("refuse un conditionnement sans contenu mesurable", () => {
  assert.equal(measures.inventoryMeasure(item("1 boîte"), "g"), null);
  assert.equal(measures.isReproducibleQuantity("1 boîte"), false);
  assert.equal(measures.isReproducibleQuantity("1 boîte de 400 g"), true);
  assert.equal(measures.packageProfileFromQuantity("1 boîte de 400 g"), "400 g");
});
