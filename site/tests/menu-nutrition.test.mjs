import test from "node:test";
import assert from "node:assert/strict";
import { automaticMenuIsBalanced, automaticRecipeNutritionAudit, hasVegetableIngredient, isLightDessert, isStarchyCourse, menuNutritionWarnings, proteinFamily, starchFamily } from "../lib/menu-nutrition.ts";

const recipe = (name, ingredients, extra = {}) => ({ name, ingredients, ...extra });

test("reconnaît les féculents antillais et les légumes", () => {
  assert.equal(isStarchyCourse(recipe("Fruit à pain rôti", ["fruit à pain"])), true);
  assert.equal(hasVegetableIngredient(recipe("Poisson grillé aux christophines", ["poisson", "christophines"])), true);
});

test("classe les familles pour varier toute la semaine", () => {
  assert.equal(proteinFamily(recipe("Colombo de poulet", ["poulet", "christophine"])), "volaille");
  assert.equal(proteinFamily(recipe("Thon aux crudités", ["thon", "concombre"])), "poisson");
  assert.equal(starchFamily(recipe("Gratin de fruit à pain", ["fruit à pain"])), "fruit-a-pain");
});

test("signale un choix manuel déséquilibré sans le bloquer", () => {
  const warnings = menuNutritionWarnings(recipe("Crêpes", ["farine"]), recipe("Tortilla", ["œufs", "pommes de terre"]), recipe("Gâteau", ["farine", "beurre"]));
  assert.ok(warnings.some((warning) => warning.includes("féculents")));
  assert.ok(warnings.some((warning) => warning.includes("légumes")));
});

test("écarte prudemment les recettes riches sans calories renseignées", () => {
  const fried = recipe("Beignets de poisson", ["poisson", "farine", "huile de friture"], { course: "plat", steps: ["Faire frire dans un bain d’huile."] });
  assert.equal(automaticRecipeNutritionAudit(fried).eligible, false);
  const creamy = recipe("Gratin très crémeux", ["pommes de terre", "beurre", "crème fraîche"], { course: "plat" });
  assert.equal(automaticRecipeNutritionAudit(creamy).eligible, false);
});

test("garde les recettes riches dans la banque pour un choix manuel", () => {
  const birthdayCake = recipe("Gâteau d’anniversaire", ["farine", "beurre", "sucre"], { course: "dessert" });
  assert.equal(automaticRecipeNutritionAudit(birthdayCake).eligible, false);
});

test("refuse trois préparations riches en féculents dans un même repas", () => {
  const starter = recipe("Tarte à la tomate", ["pâte brisée", "tomate"]);
  const main = recipe("Tortilla espagnole", ["œufs", "pommes de terre"]);
  const dessert = recipe("Gâteau d'anniversaire", ["farine", "beurre", "sucre"]);
  assert.equal(automaticMenuIsBalanced(starter, main, dessert), false);
});

test("accepte légumes, plat complet et dessert fruité léger", () => {
  const starter = recipe("Concombre au citron vert", ["concombre", "citron vert"]);
  const main = recipe("Poisson et riz créole", ["poisson", "riz", "poivron"]);
  const dessert = recipe("Salade de mangue", ["mangue", "citron vert"], { calories: 120, fatGrams: 1 });
  assert.equal(isLightDessert(dessert), true);
  assert.equal(automaticMenuIsBalanced(starter, main, dessert), true);
});

test("classe correctement les aliments simples dans le repas", () => {
  const starter = recipe("Laitue", ["laitue"], { course: "entrée" });
  const main = recipe("Poulet, riz et poivrons", ["poulet", "riz", "poivron"], { course: "plat" });
  const dessert = recipe("Mandarine", ["mandarine"], { course: "dessert" });
  assert.equal(hasVegetableIngredient(starter), true);
  assert.equal(isLightDessert(dessert), true);
  assert.equal(automaticMenuIsBalanced(starter, main, dessert), true);
});
