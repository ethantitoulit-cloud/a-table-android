import test from "node:test";
import assert from "node:assert/strict";
import { batchPreparationFor, sundayBefore } from "../lib/batch-cooking.ts";

test("programme la session le dimanche précédant la semaine choisie", () => {
  assert.equal(sundayBefore("2026-12-21"), "2026-12-20");
  assert.equal(sundayBefore("2027-01-04"), "2027-01-03");
});

test("ne propose pas de préparer les condiments", () => {
  for (const ingredient of ["sel", "poivre", "huile", "beurre", "eau", "sauce"]) {
    assert.equal(batchPreparationFor(ingredient), null);
  }
});

test("garde seulement les préparations reproductibles qui font gagner du temps", () => {
  assert.equal(batchPreparationFor("riz")?.action, "Cuire");
  assert.equal(batchPreparationFor("christophine")?.action, "Éplucher et découper");
  assert.equal(batchPreparationFor("sardine"), null);
});

test("écarte les crudités et les petites découpes rapides", () => {
  for (const ingredient of ["tomate", "tomate cerise", "concombre", "salade", "poivron", "courgette", "oignon"]) {
    assert.equal(batchPreparationFor(ingredient), null);
  }
});

test("propose la cuisson anticipée d’une viande utilisée plusieurs fois", () => {
  assert.equal(batchPreparationFor("poulet")?.action, "Cuire");
  assert.equal(batchPreparationFor("boeuf")?.duration, 30);
  assert.match(batchPreparationFor("dinde")?.storage || "", /3 jours.*congeler/);
});
