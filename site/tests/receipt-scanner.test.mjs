import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, server: { middlewareMode: true } });
after(async () => vite.close());

const scanner = await vite.ssrLoadModule("/lib/receipt-scanner.ts");

test("écarte les produits ménagers et l’alimentation animale", () => {
  const result = scanner.receiptProducts("TOMATES CERISE\nLIQUIDE VAISSELLE\nCROQUETTES CHAT\nYAOURTS NATURE\nPAIN DE MIE");
  assert.match(result.text, /TOMATES CERISE/);
  assert.match(result.text, /YAOURTS NATURE/);
  assert.doesNotMatch(result.text, /VAISSELLE|CROQUETTES/);
  assert.equal(result.excluded, 2);
});

test("range automatiquement les produits reconnus", () => {
  assert.equal(scanner.inventoryZoneFor("Yaourts nature"), "frigo");
  assert.equal(scanner.inventoryZoneFor("Légumes surgelés"), "congelateur");
  assert.equal(scanner.inventoryZoneFor("Paprika moulu"), "epices");
  assert.equal(scanner.inventoryZoneFor("Riz basmati"), "garde-manger");
});

test("conserve les quantités lisibles du ticket", () => {
  const rows = scanner.scanRowsFromText("YAOURTS 12 x 125 g\nRIZ BASMATI 1 kg\nCITRONS");
  assert.equal(rows[0].quantity, "12 x 125 g");
  assert.equal(rows[1].quantity, "1 kg");
  assert.equal(rows[2].uncertain, true);
});
