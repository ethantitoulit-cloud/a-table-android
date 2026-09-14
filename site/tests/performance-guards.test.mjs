import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("garde l'image du splash légère et préchargée", async () => {
  const image = await stat(new URL("public/food-mosaic.webp", root));
  const layout = await readFile(new URL("app/layout.tsx", root), "utf8");
  const css = await readFile(new URL("app/globals.css", root), "utf8");
  assert.ok(image.size < 400_000, `le splash pèse ${image.size} octets`);
  assert.match(layout, /preload[^>]+food-mosaic\.webp/);
  assert.match(css, /url\("\/food-mosaic\.webp"\)/);
  assert.doesNotMatch(css, /food-mosaic\.png/);
});

test("regroupe les réglages dans une seule requête", async () => {
  const saver = await readFile(new URL("lib/use-settings-saver.ts", root), "utf8");
  const route = await readFile(new URL("app/api/state/route.ts", root), "utf8");
  assert.match(saver, /action: "settings"/);
  assert.match(saver, /new Map<string, PendingSave>/);
  assert.match(route, /body\.action === "settings"/);
});

test("préserve les choix personnels lors d'une mise à jour des recettes", async () => {
  const hydration = await readFile(new URL("lib/use-initial-app-hydration.ts", root), "utf8");
  const rebuild = hydration.split("if (rebuildingBank) {")[1]?.split("if (b.settings?.batchPlans")[0] || "";
  for (const personalSetting of [
    "deletedRecipeKeys",
    "favorites",
    "weekPlans",
    "weekChoices",
    "weekStarterChoices",
    "weekDessertChoices",
    "batchPlans",
  ]) {
    assert.doesNotMatch(rebuild, new RegExp(`\\["${personalSetting}",`));
  }
});

test("retente une sauvegarde groupée après une coupure brève", async () => {
  const saver = await readFile(new URL("lib/use-settings-saver.ts", root), "utf8");
  assert.match(saver, /attempt < 2/);
  assert.match(saver, /keepalive: true/);
});

test("lit d'abord le texte intégré aux PDF avant de lancer l'OCR", async () => {
  const scanner = await readFile(new URL("lib/receipt-scanner.ts", root), "utf8");
  const textLayer = scanner.indexOf("page.getTextContent()");
  const ocrWorker = scanner.indexOf('createWorker("fra"', textLayer);
  assert.ok(textLayer > -1 && ocrWorker > textLayer);
  assert.match(scanner, /receiptProducts\(embeddedText\)\.reliable/);
});

test("enregistre un ticket en une seule requête groupée", async () => {
  const actions = await readFile(new URL("lib/receipt-scan-actions.ts", root), "utf8");
  const route = await readFile(new URL("app/api/inventory/route.ts", root), "utf8");
  assert.match(actions, /JSON\.stringify\(\{ items:/);
  assert.match(route, /await db\.batch\(statements/);
});

test("met brièvement en cache les recettes déjà contrôlées", async () => {
  const route = await readFile(new URL("app/api/import-recipe/route.ts", root), "utf8");
  assert.match(route, /cache\?\.match\(cacheKey\)/);
  assert.match(route, /max-age=3600/);
});
