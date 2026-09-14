import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("../app/page.tsx", import.meta.url);

test("maintient la page principale sous 1 500 lignes", async () => {
  const page = await readFile(pagePath, "utf8");
  assert.ok(page.split("\n").length <= 1500);
});

test("délègue les grands parcours interactifs à des modules dédiés", async () => {
  const page = await readFile(pagePath, "utf8");
  for (const moduleName of [
    "inventory-actions",
    "shopping-actions",
    "household-actions",
    "purchase-scanner-actions",
    "receipt-scan-actions",
    "recipe-session-actions",
    "recipe-bank-actions",
    "week-menu-actions",
    "week-history-actions",
    "use-initial-app-hydration",
  ]) {
    assert.match(page, new RegExp(moduleName));
  }
});
