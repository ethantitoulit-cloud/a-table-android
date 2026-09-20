import test from "node:test";
import assert from "node:assert/strict";
import { parseTatieMaryseRecipe } from "../lib/tatie-maryse-parser.ts";

test("lit une ancienne recette Tatie Maryse sans JSON-LD Recipe", () => {
  const html = `<article class="recette">
    <h1>Recette du POISSON FRIT selon Tatie Maryse</h1>
    <ul class="infos"><li class="temps-preparation">25 min</li><li class="temps-cuisson">10 min</li></ul>
    <div class="ingredients"><h2>Ingrédients</h2><div class="contenu"><p class="intro">Pour 6 poissons frits</p><p>2,5 kg de poisson<br>5 gousses d’ail<br>Jus de 3 citrons<br>Huile<br>Farine</p></div>
    <div class="recettes-pub-sous-ingredients"></div></div>
    <div class="preparation"><div class="etape"><div class="col texte"><p>Préparez la saumure avec l’ail, le citron et le poisson pendant 1h30.</p></div><div class="clearer"></div></div>
    <div class="etape"><div class="col texte"><p>Passez le poisson dans la farine puis déposez-le dans l’huile chaude.</p></div><div class="clearer"></div></div></div>
    <img src="/poisson-frit.jpg"></article>`;
  const recipe = parseTatieMaryseRecipe(html, new URL("https://www.tatiemaryse.com/poisson-frit/"));
  assert.equal(recipe?.name, "Recette du POISSON FRIT selon Tatie Maryse");
  assert.equal(recipe?.recipeYield, 6);
  assert.equal(recipe?.totalTime, "PT35M");
  assert.equal(recipe?.recipeIngredient.length, 5);
  assert.equal(recipe?.recipeInstructions.length, 2);
});
