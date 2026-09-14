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
  assert.match(navigation, /ATableAndroid/);
  assert.match(navigation, /location\.assign/);
});

test("accepte les recettes JSON-LD imbriquées et les liens Google", async () => {
  const route = await readFile(new URL("app/api/import-recipe/route.ts", root), "utf8");
  assert.match(route, /Object\.values\(object\)/);
  assert.match(route, /target\.searchParams\.get\("url"\)/);
  assert.match(route, /AbortSignal\.timeout/);
});
