import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("nettoie le partage après avoir rouvert l'importation", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  const cleanup = page.indexOf('window.history.replaceState({}, "", window.location.pathname)');
  const effectReturn = page.indexOf("return () => window.clearTimeout(timer);", cleanup);
  assert.ok(cleanup > 0 && effectReturn > cleanup, "le nettoyage doit être exécuté avant le retour de l’effet");
});

test("ouvre la recherche hors de la WebView Android", async () => {
  const navigation = await readFile(new URL("lib/browser-navigation.ts", root), "utf8");
  const android = await readFile(new URL("../app/src/main/java/com/ethantitoulit/atable/MainActivity.kt", root), "utf8");
  assert.match(navigation, /ATableAndroid/);
  assert.match(navigation, /location\.assign/);
  assert.match(android, /APP_HOST/);
  assert.match(android, /Intent\.ACTION_VIEW/);
  assert.match(android, /WindowInsetsCompat\.Type\.systemBars/);
});

test("accepte les recettes JSON-LD imbriquées et les liens Google", async () => {
  const route = await readFile(new URL("app/api/import-recipe/route.ts", root), "utf8");
  assert.match(route, /Object\.values\(object\)/);
  assert.match(route, /target\.searchParams\.get\("url"\)/);
  assert.match(route, /AbortSignal\.timeout/);
});

test("importe les catalogues Tatie Maryse et Ôdélices", async () => {
  const route = await readFile(new URL("app/api/import-catalog/route.ts", root), "utf8");
  const migrations = await readFile(new URL("lib/recipe-migrations.ts", root), "utf8");
  assert.match(route, /body\.kind === "tatie-maryse"/);
  assert.match(route, /body\.kind === "odelices"/);
  assert.match(route, /odelices\.ouest-france\.fr/);
  assert.match(migrations, /migrateOdelicesCatalog/);
  assert.match(migrations, /odelicesMigrationVersion/);
});
