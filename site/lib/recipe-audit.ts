export type AuditableRecipe = {
  name: string;
  time: number;
  ingredients: string[];
  steps: string[];
  source?: string;
  custom?: boolean;
  image?: string;
  course?: "entrée" | "plat" | "dessert" | "autre";
  courseManuallySet?: boolean;
  calories?: number;
  fatGrams?: number;
  seasonings?: string[];
  ingredientQuantities?: Record<string, string>;
  [key: string]: unknown;
};

export type RecipeAuditResult<T> = {
  accepted: T[];
  rejected: Array<{ recipe: T; reasons: string[] }>;
  corrected: number;
  duplicates: number;
};

const normalize = (value: string) => value.toLocaleLowerCase("fr-FR").replace(/œ/g, "oe").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, " ").replace(/[^a-z0-9]+/g, " ").trim();

const falseIngredient = /^(preparation|melange|montage|garniture|appareil|finition|decor|decoration|pour .+|ingredients?|facultatif)$/;
const fillerStep = /^(preparer (les ingredients|le plan de travail)|sortir les ustensiles|gouter|rectifier l assaisonnement|servir avec .* selon l envie)/;
const richTitle = /(beignet|friture|raclette|tartiflette|foie gras|triple chocolat|caramel au beurre|chantilly|gateau d anniversaire|tiramisu|brownie|cookie|chamallow|marshmallow|bonbon|confiture|coulant au chocolat|mascarpone|biscuits? pas cher|quiche.*(maroilles|chorizo)|minis? souffles? au chorizo)/;
const commercialNoise = /(fast oche|\bthermomix\b|®)/;
const cleanIngredientLabel = (value: string) => value
  .replace(/\(s\)/gi, "s")
  .replace(/Filière Auchan Cultivons le bon(?:s)?/gi, "")
  .replace(/Kub Duo Maggi/gi, "")
  .replace(/^\s*[\d¼½¾⅓⅔.,/\-–]+\s*/u, "")
  .replace(/^(?:un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)\s+/i, "")
  .replace(/^(?:kg|g|gr|grammes?|l|dl|cl|ml|cuillères?\s+à\s+(?:soupe|café)|c\.\s*à\s*[sc]|pincées?|sachets?|paquets?|boîtes?|pots?|bocaux|bouteilles?|tranches?|pièces?|branches?|bottes?|poignées?|feuilles?|tasses?|verres?|gousses?|cubes?|boules?|noisettes?|brins?)\s+(?:de\s+|d['’])?/i, "")
  .replace(/\s+/g, " ")
  .trim();

const ingredientWords = (ingredient: string) => normalize(ingredient)
  .replace(/^\d+(?:[.,]\d+)?\s*/, "")
  .split(" ")
  .filter((word) => word.length >= 4 && !/^(gramme|litre|cuillere|soupe|cafe|tranche|boite|sachet|pincee|piece|petit|grand|frais|fraiche|facultatif)$/.test(word))
  .map((word) => word.replace(/s$/, ""));

const inferredCourse = (recipe: AuditableRecipe): AuditableRecipe["course"] => {
  const title = normalize(recipe.name);
  if (recipe.courseManuallySet && recipe.course) return recipe.course;
  if (/(citronnade|limonade|smoothie|cocktail|boisson|jus de|the glace|pate brisee|pate sablee|pate feuilletee|pate a crepe|sauce|vinaigrette|marinade)/.test(title)) return "autre";
  if (/(rillettes?|tartinade|dip|bouchees?|verrines?)/.test(title)) return "entrée";
  if (/(gateau|dessert|compote|salade de fruits?|mousse au chocolat|flan|creme dessert|sorbet|glace|clafoutis|crumble|cookies?|brownies?|panna cotta|riz au lait|tiramisu|crepes?|gaufres?|pancakes?|fruits? rotis?|fruits? poches?)/.test(title)) return "dessert";
  if (/(soupe|veloute|gaspacho|crudites?|carpaccio|salade verte|salade de concombre|salade de tomate)/.test(title)) return "entrée";
  if (/(colombo|curry|poulet|poisson|cabillaud|saumon|thon|sardine|maquereau|hareng|morue|boeuf|porc|dinde|crevette|omelette|tortilla|quiche|gratin|parmentier|lasagnes?|pates? |riz |ragout|mijote|poelee|galettes? de)/.test(title)) return "plat";
  return recipe.course || "plat";
};

export const auditRecipe = <T extends AuditableRecipe>(recipe: T) => {
  const reasons: string[] = [];
  const name = String(recipe.name || "").trim();
  const title = normalize(name);
  const originalIngredients = Array.isArray(recipe.ingredients) ? recipe.ingredients.map(String).map((value) => value.trim()).filter(Boolean) : [];
  const ingredients = originalIngredients.map(cleanIngredientLabel).filter(Boolean);
  const cleanedQuantities = recipe.ingredientQuantities ? Object.fromEntries(originalIngredients.flatMap((ingredient) => {
    const cleaned = cleanIngredientLabel(ingredient);
    const quantity = recipe.ingredientQuantities?.[ingredient] || recipe.ingredientQuantities?.[cleaned];
    return cleaned && quantity ? [[cleaned, quantity]] : [];
  })) : undefined;
  const steps = Array.isArray(recipe.steps) ? recipe.steps.map(String).map((value) => value.trim()).filter(Boolean) : [];
  const course = inferredCourse(recipe);

  if (!name || /^(recette|idee|selection|dessert pas cher|plat pas cher|entree pas chere?|en cas sucre.*)$/.test(title)) reasons.push("titre non exploitable");
  if (!recipe.source && !recipe.custom) reasons.push("ancienne recette interne sans source");
  if (recipe.source && !/^https?:\/\//i.test(recipe.source) && recipe.source !== "new://recipe") reasons.push("source invalide");
  if (!recipe.custom && /^https?:\/\//i.test(recipe.source || "") && !recipe.image) reasons.push("photo manquante");
  if (!recipe.custom && ingredients.length < 2) reasons.push("liste d’ingrédients incomplète");
  if (!recipe.custom && /^https?:\/\//i.test(recipe.source || "")) {
    const quantities = cleanedQuantities || recipe.ingredientQuantities || {};
    const quantified = ingredients.filter((ingredient) => String(quantities[ingredient] || "").trim()).length;
    if (ingredients.length && quantified / ingredients.length < 0.7) reasons.push("quantités incomplètes");
  }
  if (!recipe.custom && (steps.length < 2 || steps.some((step) => step.length < 12))) reasons.push("étapes insuffisamment détaillées");
  if (steps.some((step) => fillerStep.test(normalize(step)))) reasons.push("étapes génériques sans valeur culinaire");
  if (ingredients.some((ingredient) => falseIngredient.test(normalize(ingredient)))) reasons.push("faux ingrédient");
  if (ingredients.some((ingredient) => commercialNoise.test(normalize(ingredient))) || commercialNoise.test(title)) reasons.push("mention commerciale ou appareil imposé");
  if (!recipe.courseManuallySet && course === "entrée" && /^(sauce|crepes?|gaufres?|pancakes?)/.test(title)) reasons.push("catégorie entrée incorrecte");
  if (!recipe.courseManuallySet && course === "plat" && /(rillettes?|tartinade|dip|bouchees?)/.test(title)) reasons.push("ce n’est pas un plat principal");
  if (course === "dessert" && /^(dessert|dessert pas cher)$/.test(title)) reasons.push("nom de dessert incorrect");
  if (/(omelette.*chocolat|chocolat.*omelette)/.test(title)) reasons.push("association culinaire incohérente");

  const preparation = normalize(steps.join(" "));
  const exempt = /^(eau|sel|poivre)$/;
  const missingInSteps = ingredients.filter((ingredient) => {
    const normalized = normalize(ingredient);
    if (exempt.test(normalized)) return false;
    const groupedAsVegetable = /\blegumes?\b/.test(preparation) && /(pommes? de terre|aubergine|courgette|carotte|poivron|christophine|chouchou|giromon|giraumon|navet|poireau|brocoli|chou fleur|haricot vert|patate douce|igname|manioc)/.test(normalized);
    if (groupedAsVegetable) return false;
    const words = ingredientWords(ingredient);
    return words.length > 0 && !words.some((word) => preparation.includes(word));
  });
  if (!recipe.custom && missingInSteps.length) reasons.push(`ingrédient absent des étapes : ${missingInSteps.slice(0, 3).join(", ")}`);

  const ingredientsText = normalize(ingredients.join(" "));
  const doublyRich = /(beurre)/.test(ingredientsText) && /(huile)/.test(ingredientsText) && /(sardine|maquereau|saumon|lardon|bacon)/.test(ingredientsText);
  const maxCalories = course === "plat" ? 750 : course === "autre" ? 500 : 350;
  const maxFat = course === "plat" ? 30 : course === "autre" ? 25 : 18;
  if (!recipe.custom && (richTitle.test(title) || doublyRich || (recipe.calories && recipe.calories > maxCalories) || (recipe.fatGrams && recipe.fatGrams > maxFat))) reasons.push("trop riche pour la banque quotidienne");

  const cleanedIngredients = ingredients.filter((ingredient) => !falseIngredient.test(normalize(ingredient)));
  const cleanedSteps = steps.filter((step) => !fillerStep.test(normalize(step)));
  const corrected = course !== recipe.course || cleanedIngredients.some((ingredient, index) => ingredient !== originalIngredients[index]) || cleanedIngredients.length !== originalIngredients.length || cleanedSteps.length !== steps.length;
  return { recipe: { ...recipe, name, course, ingredients: cleanedIngredients, ingredientQuantities: cleanedQuantities || recipe.ingredientQuantities, steps: cleanedSteps } as T, reasons: [...new Set(reasons)], corrected };
};

export const auditRecipeCollection = <T extends AuditableRecipe>(recipes: T[]): RecipeAuditResult<T> => {
  const accepted: T[] = [];
  const rejected: Array<{ recipe: T; reasons: string[] }> = [];
  const seen = new Set<string>();
  let corrected = 0;
  let duplicates = 0;
  for (const value of recipes) {
    const result = auditRecipe(value);
    const key = normalize(result.recipe.name);
    if (seen.has(key)) { duplicates += 1; continue; }
    if (result.reasons.length) { rejected.push({ recipe: value, reasons: result.reasons }); continue; }
    seen.add(key);
    accepted.push(result.recipe);
    if (result.corrected) corrected += 1;
  }
  return { accepted, rejected, corrected, duplicates };
};
