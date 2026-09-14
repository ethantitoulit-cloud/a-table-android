export type NutritionalCourse = {
  name: string;
  ingredients: string[];
  steps?: string[];
  course?: "entrée" | "plat" | "dessert" | "autre";
  ingredientQuantities?: Record<string, string>;
  calories?: number;
  fatGrams?: number;
};

const normalize = (value: string) => value.toLowerCase().replace(/œ/g, "oe").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const recipeText = (recipe: NutritionalCourse) => normalize(`${recipe.name} ${recipe.ingredients.join(" ")}`);

export const isStarchyCourse = (recipe: NutritionalCourse) =>
  /(tarte|quiche|pizza|feuillete|crepe|pate brisee|pate feuilletee|tortilla espagnole|pomme de terre|patate douce|igname|manioc|madere|fruit a pain|riz|pates|semoule|pain|farine|avoine|porridge|cereale|mais)/.test(recipeText(recipe));

export const hasVegetableIngredient = (recipe: NutritionalCourse) =>
  /(salade|crudite|soupe|veloute|legume|tomate|concombre|carotte|courgette|aubergine|poireau|giromon|giraumon|poivron|chou|betterave|christophine|avocat|haricot vert|epinard|cresson|gombo|navet|radis|laitue)/.test(recipeText(recipe));

export const isVegetableForward = (recipe: NutritionalCourse) => hasVegetableIngredient(recipe) && !isStarchyCourse(recipe);

export const isLightDessert = (recipe: NutritionalCourse) => {
  const text = recipeText(recipe);
  const fruitOrDairy = /(fruit|compote|yaourt|fromage blanc|salade de fruits|pomme|poire|orange|mandarine|clementine|ananas|mangue|banane|goyave|papaye|pasteque|melon|maracudja|chia)/.test(text);
  const dense = /(gateau|tarte|cake|brownie|mousse au chocolat|tiramisu|porridge|avoine|cereale|crepe|beignet|frit|chantilly|caramel|pate feuilletee)/.test(text);
  return fruitOrDairy && !dense && (!recipe.calories || recipe.calories <= 250) && (!recipe.fatGrams || recipe.fatGrams <= 10);
};

export const isRichCourse = (recipe: NutritionalCourse) => {
  const text = recipeText(recipe);
  const method = normalize((recipe.steps || []).join(" "));
  const quantities = normalize(Object.values(recipe.ingredientQuantities || {}).join(" "));
  const richIngredients = recipe.ingredients.filter((ingredient) => /(beurre|creme fraiche|chantilly|mascarpone|mayonnaise|lardons|bacon|charcuterie|saindoux|huile de friture)/.test(normalize(ingredient))).length;
  const obviousRichDish = /(frit|beignet|raclette|tartiflette|charcuterie|lardons|bacon|creme fraiche|double creme|chantilly|triple chocolat|caramel au beurre)/.test(text);
  const deepFried = /(bain d.huile|huile de friture|faire frire|friteuse)/.test(method);
  const largeFatQuantity = /(2[5-9]\d|[3-9]\d\d)\s*g/.test(quantities) && /(beurre|creme|mascarpone)/.test(text);
  return (recipe.calories || 0) > 650 || (recipe.fatGrams || 0) > 25 || obviousRichDish || deepFried || largeFatQuantity || richIngredients >= 2;
};

export const automaticRecipeNutritionAudit = (recipe: NutritionalCourse) => {
  const reasons: string[] = [];
  if (isRichCourse(recipe)) reasons.push("trop riche pour une proposition automatique");
  if (recipe.course === "entrée" && isStarchyCourse(recipe) && !isVegetableForward(recipe)) reasons.push("entrée principalement féculente");
  if (recipe.course === "dessert" && !isLightDessert(recipe)) reasons.push("dessert à réserver aux choix manuels");
  return { eligible: reasons.length === 0, reasons };
};

export const automaticMenuIsBalanced = (starter: NutritionalCourse, main: NutritionalCourse, dessert: NutritionalCourse) => {
  const starchCount = [starter, main, dessert].filter(isStarchyCourse).length;
  const hasVegetables = hasVegetableIngredient(main) || isVegetableForward(starter);
  const needsLightDessert = starchCount > 0 || isRichCourse(main) || !hasVegetables;
  return starchCount <= 1 && hasVegetables && (!needsLightDessert || isLightDessert(dessert));
};

export const proteinFamily = (recipe: NutritionalCourse) => {
  const text = recipeText(recipe);
  if (/(poisson|cabillaud|thon|sardine|hareng|maquereau|saumon|dorade|vivaneau|ouassou|crevette|moule|palourde)/.test(text)) return "poisson";
  if (/(poulet|dinde|pintade)/.test(text)) return "volaille";
  if (/(boeuf|porc|veau|agneau|lard)/.test(text)) return "viande";
  if (/(oeuf|omelette|tortilla)/.test(text)) return "oeufs";
  if (/(lentille|pois rouge|pois d.angole|haricot|pois chiche)/.test(text)) return "legumineuses";
  return "vegetal";
};

export const starchFamily = (recipe: NutritionalCourse) => {
  const text = recipeText(recipe);
  if (/fruit a pain/.test(text)) return "fruit-a-pain";
  if (/(patate douce|igname|manioc|madere|pomme de terre)/.test(text)) return "racines";
  if (/riz/.test(text)) return "riz";
  if (/(pates|semoule)/.test(text)) return "cereales";
  if (/(pain|farine|tarte|quiche|pizza|crepe|feuillete)/.test(text)) return "pate-pain";
  return "sans-feculent";
};

export const vegetableFamily = (recipe: NutritionalCourse) => {
  const text = recipeText(recipe);
  for (const [family, pattern] of [
    ["courges", /(giromon|giraumon|courgette)/], ["feuilles", /(epinard|cresson|laitue|salade|chou)/],
    ["tomate-poivron", /(tomate|poivron)/], ["concombre", /(concombre|crudite)/],
    ["racines-legumes", /(carotte|navet|betterave|radis)/], ["christophine", /christophine/],
    ["aubergine", /aubergine/], ["gombo-haricot", /(gombo|haricot vert)/],
  ] as const) if (pattern.test(text)) return family;
  return hasVegetableIngredient(recipe) ? "legumes-varies" : "sans-legume";
};

export const menuNutritionWarnings = (starter: NutritionalCourse, main: NutritionalCourse, dessert: NutritionalCourse) => {
  const warnings: string[] = [];
  const starchCount = [starter, main, dessert].filter(isStarchyCourse).length;
  if (starchCount > 1) warnings.push("Plusieurs féculents dans ce repas");
  if (!hasVegetableIngredient(main) && !isVegetableForward(starter)) warnings.push("Il manque une vraie portion de légumes");
  if ((isStarchyCourse(main) || isRichCourse(main)) && !isLightDessert(dessert)) warnings.push("Préférer un dessert plus léger");
  return warnings;
};
