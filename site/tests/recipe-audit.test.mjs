import test from "node:test";
import assert from "node:assert/strict";
import { auditRecipe, auditRecipeCollection } from "../lib/recipe-audit.ts";
import { recipeHasIngredientConcordance } from "../lib/ingredient-concordance.ts";

const good = { name: "Cabillaud rôti aux courgettes", time: 30, course: "plat", source: "https://example.test/recette", image: "https://example.test/photo.jpg", ingredients: ["cabillaud", "courgettes", "huile d’olive"], ingredientQuantities: { cabillaud: "400 g", courgettes: "500 g", "huile d’olive": "1 c. à soupe" }, steps: ["Couper les courgettes en rondelles et les déposer dans un plat.", "Ajouter le cabillaud, arroser d’huile d’olive et cuire 20 minutes à 190 °C."] };

test("accepte une recette sourcée, détaillée et concordante", () => assert.deepEqual(auditRecipe(good).reasons, []));
test("accepte des légumes regroupés sous le mot légumes dans les étapes", () => {
  const colombo = {
    ...good,
    name: "Colombo de poulet des Antilles",
    ingredients: ["poulet", "pommes de terre", "aubergine", "cive", "colombo"],
    ingredientQuantities: { poulet: "1,2 kg", "pommes de terre": "4 unités", aubergine: "1 unité", cive: "2 branches", colombo: "2 c. à soupe" },
    steps: ["Faire mariner le poulet avec la cive et le colombo pendant 2 heures.", "Faire dorer le poulet, ajouter les légumes et laisser mijoter 40 minutes."],
  };
  assert.deepEqual(auditRecipe(colombo).reasons, []);
});
test("le premier filtre accepte les légumes regroupés dans les étapes", () => {
  assert.equal(recipeHasIngredientConcordance(
    ["Blancs de poulet", "Pommes de terre", "Aubergine", "Cive", "Colombo"],
    ["Faire mariner le poulet avec la cive et le colombo.", "Faire dorer le poulet, ajouter les légumes et laisser mijoter 40 minutes."],
  ), true);
});
test("rejette une ancienne recette interne et les étapes de remplissage", () => {
  const result = auditRecipe({ ...good, source: undefined, steps: ["Préparer le plan de travail et les ingrédients.", "Goûter, rectifier l’assaisonnement puis servir."] });
  assert.ok(result.reasons.includes("ancienne recette interne sans source"));
  assert.ok(result.reasons.includes("étapes génériques sans valeur culinaire"));
});
test("rejette les faux ingrédients et les discordances", () => {
  const result = auditRecipe({ ...good, ingredients: ["cabillaud", "préparation", "huile d’olive"], steps: ["Cuire le cabillaud au four pendant 20 minutes.", "Déposer le poisson dans les assiettes."] });
  assert.ok(result.reasons.includes("faux ingrédient"));
  assert.match(result.reasons.join(" "), /huile d’olive/);
});
test("corrige les catégories évidentes et supprime les doublons", () => {
  assert.equal(auditRecipe({ ...good, name: "Rillettes de sardines", course: "plat", ingredients: ["sardines", "yaourt"], steps: ["Écraser les sardines dans un bol.", "Ajouter le yaourt et mélanger soigneusement."] }).recipe.course, "entrée");
  const result = auditRecipeCollection([good, { ...good }]);
  assert.equal(result.accepted.length, 1);
  assert.equal(result.duplicates, 1);
});
test("classe les pâtes de base dans Autres et rejette le bruit d’import", () => {
  const dough = auditRecipe({ ...good, name: "Pâte à crêpe", course: "dessert" });
  assert.equal(dough.recipe.course, "autre");
  const noisy = auditRecipe({ ...good, ingredients: ["tranche(s) Pain", "Bouillon cube Kub Duo Maggi", "cabillaud"] });
  assert.deepEqual(noisy.recipe.ingredients, ["Pain", "Bouillon cube", "cabillaud"]);
});

test("sépare automatiquement entrées, plats et desserts", () => {
  assert.equal(auditRecipe({ ...good, name: "Crêpes faciles", course: "entrée" }).recipe.course, "dessert");
  assert.equal(auditRecipe({ ...good, name: "Colombo de poulet", course: "dessert" }).recipe.course, "plat");
  assert.equal(auditRecipe({ ...good, name: "Velouté de giraumon", course: "plat" }).recipe.course, "entrée");
});

test("respecte un reclassement manuel dans la banque", () => {
  assert.equal(auditRecipe({ ...good, name: "Galettes de légumes", course: "entrée", courseManuallySet: true }).recipe.course, "entrée");
});

test("rejette une omelette au chocolat", () => {
  const result = auditRecipe({
    ...good,
    name: "Omelette au chocolat",
    ingredients: ["œufs", "chocolat noir"],
    ingredientQuantities: { "œufs": "4", "chocolat noir": "80 g" },
    steps: ["Faire fondre le chocolat noir au bain-marie.", "Battre les œufs puis cuire l’omelette avec le chocolat."],
  });
  assert.ok(result.reasons.includes("association culinaire incohérente"));
});
