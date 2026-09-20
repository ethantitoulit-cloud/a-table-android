import { EXTRA_RECIPES } from "../app/extra-recipes";
import { CORE_RECIPES } from "../app/core-recipes";
import { inventoryMeasure } from "./inventory-measures";
import { automaticRecipeNutritionAudit, hasVegetableIngredient, isStarchyCourse } from "./menu-nutrition";
import type { MenuCourse, Mood, Recipe } from "./app-types";
import type { InventoryZone as Zone } from "./receipt-scanner";

export type Item = {
  id: number;
  name: string;
  quantity: string;
  zone: Zone;
  expires?: string | null;
};
export type Person = {
  id?: string;
  name: string;
  likes: string;
  avoid: string;
  hidden: string;
  allergies: string;
  diet: string;
  needs: string;
  temporary: boolean;
  active: boolean;
};
export type Hist = {
  id: number;
  meal: string;
  people: number;
  eatenAt: string;
  rating: number;
};
export type Shop = { id: number; name: string; quantity: string; checked: boolean; pending?: boolean };
export const shoppingSection = (name: string) => {
  const value = name.toLocaleLowerCase("fr-FR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/(poisson|cabillaud|saumon|thon|sardine|maquereau|hareng|morue|crevette|poulet|boeuf|porc|veau|dinde|jambon|lardon)/.test(value)) return "Poissonnerie et viandes";
  if (/(lait|yaourt|beurre|creme|fromage|mozzarella|emmental|oeuf)/.test(value)) return "Produits frais";
  if (/(banane|mandarine|tomate|courgette|carotte|poireau|giraumon|giromon|christophine|fruit a pain|igname|patate|manioc|salade|laitue|concombre|aubergine|poivron|oignon|ail|citron|orange|pomme|poire|mangue|ananas|avocat|fruit)/.test(value)) return "Fruits et légumes";
  if (/(surgele|glace)/.test(value)) return "Surgelés";
  if (/(savon|papier|essuie|lessive|liquide vaisselle|sac poubelle)/.test(value)) return "Maison";
  return "Épicerie";
};
export const SHOPPING_SECTION_ORDER = ["Fruits et légumes", "Poissonnerie et viandes", "Produits frais", "Surgelés", "Épicerie", "Maison"];
export type Measure = { amount: number; unit: "g" | "ml" | "unité" };
export type SpecialMenu = { type: "apero" | "fete"; recipes: string[] };
export const stepDurationSeconds = (step: string) => {
  const hour = step.match(/(\d+(?:[,.]\d+)?)\s*h(?:eure)?s?/i);
  const minute = step.match(/(\d+)\s*(?:min(?:ute)?s?)/i);
  const seconds = (hour ? Number(hour[1].replace(",", ".")) * 3600 : 0) + (minute ? Number(minute[1]) * 60 : 0);
  return seconds || 5 * 60;
};
export const timerLabel = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
export type WeekPlan = {
  choices: string[];
  extraChoices?: string[][];
  starterChoices: string[];
  dessertChoices: string[];
  presence: boolean[][];
  alternatives: Record<string, string>[];
  specials: Record<number, SpecialMenu>;
  skipped: Record<number, boolean>;
};
export const NO_STARTER = "__sans_entree__";
export const EMPTY_STARTER: Recipe = { name: "Sans entrée", time: 0, ingredients: [], tags: ["leger"], steps: [], course: "entrée", simpleFood: true };
export const SIMPLE_FOODS: Recipe[] = [];
export const RECIPES: Recipe[] = [...CORE_RECIPES, ...EXTRA_RECIPES];
export const WEB_SOURCE_URLS: Record<string, string> = {
  "Boulettes de dinde sauce tomate": "https://www.cuisineaz.com/recettes/boulettes-de-dinde-hachee-108755.aspx",
  "Cannelloni aux légumes": "https://www.cuisineaz.com/recettes/cannellonis-farcis-aux-legumes-47033.aspx",
  "Cannelloni jambon fromage": "https://www.cuisineaz.com/recettes/cannelloni-fourres-au-jambon-et-champignons-au-four-67970.aspx",
  "Colombo de porc": "https://www.cuisineaz.com/recettes/colombo-de-porc-52861.aspx",
  "Curry de pois chiches": "https://www.cuisineaz.com/recettes/curry-de-pois-chiches-et-epinards-a-la-tomate-117412.aspx",
  "Galettes de thon": "https://www.cuisineaz.com/recettes/galettes-de-pommes-de-terre-au-thon-56935.aspx",
  "Gratin de poulet aux poireaux": "https://www.cuisineaz.com/recettes/gratin-de-poulet-aux-poireaux-et-pommes-de-terre-102736.aspx",
  "Omelette roulée aux épinards": "https://www.cuisineaz.com/recettes/omelette-feta-epinards-118028.aspx",
  "Parmentier de lentilles": "https://www.cuisineaz.com/recettes/parmentier-de-lentilles-a-la-puree-de-patate-douce-111588.aspx",
  "Pizza aux légumes": "https://www.cuisineaz.com/recettes/pizza-legere-aux-legumes-4854.aspx",
  "Porc au caramel et riz": "https://www.cuisineaz.com/recettes/porc-au-caramel-69764.aspx",
  "Poulet coco au citron vert": "https://www.cuisineaz.com/recettes/poulet-au-lait-de-coco-et-citron-au-wok-70903.aspx",
  "Poulet express aux légumes": "https://www.cuisineaz.com/recettes/poulet-aux-petits-legumes-14507.aspx",
  "Poulet à la moutarde et poireaux": "https://www.cuisineaz.com/recettes/papillotes-de-poulet-carottes-et-poireaux-a-la-moutarde-68903.aspx",
  "Poulet à l’ananas léger": "https://www.cuisineaz.com/recettes/poulet-a-l-ananas-facile-46858.aspx",
  "Quiche poireaux et lard": "https://www.cuisineaz.com/recettes/quiche-poireaux-lardons-7282.aspx",
  "Riz au chorizo et poivron": "https://www.cuisineaz.com/recettes/risotto-au-chorizo-poivrons-120943.aspx",
  "Tortilla espagnole": "https://www.cuisineaz.com/recettes/tortilla-espagnole-facile-122402.aspx",
  "Tortillas jambon fromage": "https://www.cuisineaz.com/recettes/lunchbox-roules-de-tortillas-au-jambon-fromage-et-epinards-117643.aspx",
  "Velouté de patate douce": "https://www.cuisineaz.com/recettes/veloute-de-patate-douce-au-gingembre-92114.aspx",
  "Wok de poulet aux légumes": "https://www.cuisineaz.com/recettes/wok-de-poulet-aux-legumes-croquants-et-au-soja-97065.aspx",
  "Œufs cocotte aux épinards": "https://www.cuisineaz.com/recettes/oeufs-cocotte-cremeux-aux-epinards-120206.aspx",
};
export const WEB_RECIPE_MIGRATION_VERSION = 1;
export const RECIPE_AUDIT_VERSION = 7;
export const LOCAL_RECIPE_MIGRATION_VERSION = 2;
export const TATIE_MARYSE_MIGRATION_VERSION = 1;
export const ODELICES_MIGRATION_VERSION = 1;
export const MY_RECIPE_BOX_MIGRATION_VERSION = 1;
export const CURATED_BANK_VERSION = 1;
export const SHOPPING_RESET_VERSION = 1;
export const LOCAL_RECIPE_URLS = [
  "https://www.cuisineaz.com/recettes/migan-de-fruit-a-pain-107090.aspx",
  "https://www.cuisineaz.com/recettes/riz-au-giraumon-antillais-120851.aspx",
  "https://www.cuisineaz.com/recettes/gratin-de-christophine-41814.aspx",
  "https://www.cuisineaz.com/recettes/gratin-d-ignames-13709.aspx",
  "https://www.cuisineaz.com/recettes/puree-d-igname-88518.aspx",
  "https://www.cuisineaz.com/recettes/blaff-de-poissons-9543.aspx",
  "https://www.cuisineaz.com/recettes/blaf-de-poissons-antillais-8152.aspx",
  "https://www.cuisineaz.com/recettes/dombres-de-crevettes-18255.aspx",
  "https://www.cuisineaz.com/recettes/gratin-de-christophines-aux-petits-legumes-33529.aspx",
  "https://www.cuisineaz.com/recettes/gratin-de-chouchou-et-citrouille-49732.aspx",
  "https://www.cuisineaz.com/recettes/gratin-de-chouchou-cuisine-creole-17263.aspx",
  "https://www.cuisineaz.com/recettes/tartare-de-thon-au-citron-11175.aspx",
  "https://www.cuisineaz.com/recettes/thon-a-la-creole-6952.aspx",
  "https://www.cuisineaz.com/recettes/chiquetaille-de-morue-9917.aspx",
  "https://www.cuisineaz.com/recettes/mijote-de-poisson-curry-et-lait-de-coco-122419.aspx",
  "https://www.cuisineaz.com/recettes/colombo-vegetarien-114153.aspx",
];
export const recipeThemes = (recipe: Recipe): Recipe["themes"] => {
  const text = norm(`${recipe.name} ${recipe.ingredients.join(" ")}`);
  const themes: NonNullable<Recipe["themes"]> = [];
  if (/(fruit a pain|christophine|chouchou|giromon|giraumon|igname|manioc|patate douce|banane plantain|banane jaune|pois d angole|pois rouge|vivaneau|dorade|marlin|thon|morue|ouassou|crevette|citron vert|cive|bois d inde|colombo)/.test(text)) themes.push("local");
  if (recipe.time <= 30) themes.push("rapide");
  if (recipe.tags.includes("leger") || (recipe.calories !== undefined && recipe.calories <= (recipe.course === "plat" ? 650 : 300)) || (recipe.fatGrams !== undefined && recipe.fatGrams <= 16)) themes.push("léger");
  if (/(curry|dahl|wok|tajine|taboule|ceviche|poke|ramen|pho|chili|fajita|tortilla|risotto|minestrone|moussaka|rougail|cari|teriyaki|tikka|tha[iï]|grec|liban|mexic|japon|indien|maroc|italien|vietnam|africain)/.test(text)) themes.push("monde");
  if (!themes.includes("local") && !themes.includes("monde") && !/(facile|classique|traditionnel)/.test(text)) themes.push("original");
  return themes.length ? themes : ["original"];
};
export const buildCuratedBank = (recipes: Recipe[]) => {
  const unique = [...new Map(recipes
    .filter((recipe) => recipe.source && isRecipeConcordant(recipe) && (recipe.course === "autre" || automaticRecipeNutritionAudit(recipe).eligible))
    .map((recipe) => [norm(recipe.name), { ...recipe, themes: recipeThemes(recipe), occasional: false }])).values()];
  const quotas: Record<NonNullable<Recipe["course"]>, number> = { "entrée": 60, plat: 165, dessert: 60, autre: 15 };
  const score = (recipe: Recipe) => {
    const themes = recipe.themes || [];
    return (themes.includes("local") ? 100 : 0) + (themes.includes("rapide") ? 35 : 0) + (themes.includes("léger") ? 30 : 0) + (themes.includes("monde") ? 22 : 0) + (themes.includes("original") ? 12 : 0) + (recipe.image ? 8 : 0) + Math.min(10, recipe.steps.length);
  };
  const selected: Recipe[] = [];
  Object.entries(quotas).forEach(([course, quota]) => {
    const pool = unique.filter((recipe) => (recipe.course || "plat") === course).sort((a, b) => score(b) - score(a));
    const chosen: Recipe[] = [];
    const take = (theme: NonNullable<Recipe["themes"]>[number], count: number) => pool.filter((recipe) => recipe.themes?.includes(theme) && !chosen.includes(recipe)).slice(0, count).forEach((recipe) => chosen.push(recipe));
    take("local", Math.ceil(quota * 0.35));
    take("rapide", Math.ceil(quota * 0.25));
    take("monde", Math.ceil(quota * 0.2));
    pool.filter((recipe) => !chosen.includes(recipe)).slice(0, Math.max(0, quota - chosen.length)).forEach((recipe) => chosen.push(recipe));
    selected.push(...chosen.slice(0, quota));
  });
  if (selected.length < 300) unique.filter((recipe) => !selected.includes(recipe)).sort((a, b) => score(b) - score(a)).slice(0, 300 - selected.length).forEach((recipe) => selected.push(recipe));
  return selected.slice(0, 300);
};
export const recipePhotoStyle = (recipe: Recipe | string) => {
  const name = typeof recipe === "string" ? recipe : recipe.name;
  if (typeof recipe !== "string" && recipe.image)
    return { backgroundImage: `url("${recipe.image.replace(/"/g, "%22")}")`, backgroundPosition: "center", backgroundSize: "cover" };
  const recipeIndex = RECIPES.findIndex((recipe) => recipe.name === name);
  const isCore = recipeIndex >= 0 && recipeIndex < CORE_RECIPES.length;
  const extraIndex = Math.max(0, recipeIndex - CORE_RECIPES.length);
  const cell = isCore ? recipeIndex : extraIndex % 16;
  const grid = isCore ? 0 : Math.floor(extraIndex / 16) + 1;
  const column = cell % 4;
  const row = Math.floor(cell / 4);
  return {
    backgroundImage: `url('/recipe-photo-grid${grid ? `-${grid}` : ""}.webp')`,
    backgroundPosition: `${(column / 3) * 100}% ${(row / 3) * 100}%`,
  };
};
export const DEMO: Item[] = [
  { id: -1, name: "Œufs", quantity: "8", zone: "frigo" },
  { id: -3, name: "Crème fraîche", quantity: "20 cl", zone: "frigo" },
  { id: -4, name: "Pâte brisée", quantity: "1", zone: "frigo" },
  { id: -5, name: "Poulet", quantity: "600 g", zone: "congelateur" },
  { id: -6, name: "Riz", quantity: "1 kg", zone: "garde-manger" },
  { id: -7, name: "Pois rouges", quantity: "2 boîtes", zone: "garde-manger" },
  { id: -8, name: "Giromon", quantity: "1 morceau", zone: "frigo" },
];
export const BREAKFAST = [
  { name: "Café", quantity: "dosettes Nespresso" },
  { name: "Lait", quantity: "4 L" },
  { name: "Pain", quantity: "3 pains" },
  { name: "Pain de mie", quantity: "1 paquet" },
  { name: "Beurre", quantity: "1 plaquette" },
  { name: "Tortillas", quantity: "1 paquet" },
  { name: "Fruits", quantity: "14 pièces" },
  { name: "Yaourts", quantity: "12" },
  { name: "Œufs", quantity: "12" },
  { name: "Chocolat", quantity: "1 paquet" },
];
export const MENU_ENGINE_VERSION = 4;
export const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/œ/g, "oe")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/s$/g, "");
export const canonicalIngredient = (s: string) => {
  const value = norm(s).replace(/[-']/g, " ").replace(/\s+/g, " ").trim();
  if (value.includes("nespresso") || value.includes("dosette de cafe"))
    return "cafe";
  const aliases: Record<string, string> = {
    "haricot rouge": "pois rouge",
    "haricots rouge": "pois rouge",
    "pois rouge": "pois rouge",
    giraumon: "giromon",
    giraumont: "giromon",
    giromont: "giromon",
    "champignons noir": "champignon noir",
    "champignon noirs": "champignon noir",
    poireaux: "poireau",
    lentilles: "lentille",
    epinards: "epinard",
    tomates: "tomate",
    courgettes: "courgette",
    carottes: "carotte",
    oignons: "oignon",
    poivrons: "poivron",
    pommes: "pomme",
    bananes: "banane",
  };
  return aliases[value] || value;
};
export const stepMentionsIngredient = (step: string, ingredient: string) => {
  const words = (value: string) => norm(value)
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !["avec", "dans", "des", "les", "une", "pour", "sur", "aux", "par", "puis"].includes(word))
    .map((word) => word.replace(/s$/, ""));
  const stepWords = new Set(words(step));
  return words(canonicalIngredient(ingredient)).some((word) => stepWords.has(word));
};
export const isEverydayRecipe = (recipe: Recipe) => {
  if (!automaticRecipeNutritionAudit(recipe).eligible) return false;
  const richName = /beignet|frit|friture|raclette|tartiflette|foie gras|charcuterie|lardons?|bacon|triple chocolat|caramel au beurre|chantilly|gâteau d['’ ]anniversaire|gateau d['’ ]anniversaire/i.test(recipe.name);
  if (richName) return false;
  const ingredients = recipe.ingredients.map(canonicalIngredient);
  const addsButter = ingredients.some((ingredient) => ingredient === "beurre");
  const addsOil = ingredients.some((ingredient) => ingredient === "huile" || ingredient.startsWith("huile "));
  const alreadyRichProtein = ingredients.some((ingredient) => /(sardine|maquereau|saumon)/.test(ingredient));
  if (addsButter && addsOil && alreadyRichProtein) return false;
  const course = recipe.course || "plat";
  const maxCalories = course === "plat" ? 750 : 350;
  const maxFat = course === "plat" ? 30 : 18;
  if (recipe.calories && recipe.calories > maxCalories) return false;
  if (recipe.fatGrams && recipe.fatGrams > maxFat) return false;
  return true;
};
export const isRejectedRecipe = (recipe: Recipe) => /oeufs? brouilles? aux sardines?/.test(norm(recipe.name));
export const isMainDish = (recipe: Recipe) => !/(rillettes?|tartinade|toast|tartines?|bouchees?|dip|aperitif)/.test(norm(recipe.name));
export const isNoCookRecipe = (recipe: Recipe | MenuCourse) => {
  const steps = "steps" in recipe ? recipe.steps.join(" ") : "";
  const preparation = norm(steps).replace(/sans cuisson/g, "");
  const cooking = /(cuire|cuisson|four|enfourner|poele|casserole|bouillir|mijoter|griller|rissoler|frire|vapeur|prechauffer)/.test(preparation);
  const needsCooking = /(riz|pates?|semoule|farine|pate brisee|pate feuilletee|pomme de terre|patate douce|oeufs? crus?|poulet cru|poisson cru|viande crue)/.test(norm(recipe.ingredients.join(" ")));
  return !cooking && !needsCooking;
};
export const recipeMatchesMood = (recipe: Recipe, mood: Mood, portions: number) => {
  if (mood === "tout") return true;
  const text = norm(`${recipe.name} ${recipe.steps.join(" ")} ${recipe.ingredients.join(" ")}`);
  if (mood === "rapide") return recipe.time <= 25;
  if (mood === "sans-cuisson") {
    return isNoCookRecipe(recipe);
  }
  if (mood === "leger") return (hasVegetableIngredient(recipe) || (recipe.calories || 0) > 0 && (recipe.calories || 0) <= 550) && !isStarchyCourse(recipe);
  if (mood === "reconfort") return /(gratin|mijote|curry|colombo|soupe|veloute|quiche|lasagne|parmentier|cremeux)/.test(text);
  if (mood === "budget") return estimatedRecipeCost(recipe, portions) <= 14;
  return recipe.tags.includes(mood);
};
export const seasonalIngredients = (month: number) => {
  const allYear = ["banane", "citron vert", "giraumon", "patate douce", "christophine", "fruit à pain", "igname", "madère", "manioc", "ananas", "avocat", "mangue", "maracudja", "aubergine", "concombre", "tomate", "pois d'angole"];
  const periods: Record<number, string[]> = {
    0: ["orange", "mandarine", "carambole", "christophine"], 1: ["orange", "mandarine", "carambole", "christophine"],
    2: ["orange", "ananas", "carambole", "concombre"], 3: ["ananas", "melon", "concombre", "tomate"],
    4: ["ananas", "mangue", "melon", "tomate"], 5: ["mangue", "melon", "pastèque", "aubergine"],
    6: ["mangue", "avocat", "maracudja", "aubergine"], 7: ["mangue", "avocat", "maracudja", "concombre"],
    8: ["avocat", "maracudja", "concombre", "aubergine"], 9: ["avocat", "goyave", "christophine", "giraumon"],
    10: ["goyave", "orange", "christophine", "giraumon"], 11: ["orange", "mandarine", "carambole", "christophine"],
  };
  return [...allYear, ...(periods[month] || [])].map(norm);
};
export const seasonalScore = (recipe: Recipe) => {
  const inSeason = seasonalIngredients(new Date().getMonth());
  return recipe.ingredients.filter((ingredient) => inSeason.some((item) => norm(ingredient).includes(item))).length;
};
export const localProductScore = (recipe: Recipe | MenuCourse) => {
  const text = norm(`${recipe.name} ${recipe.ingredients.join(" ")}`);
  const localProducts = ["fruit a pain", "igname", "patate douce", "manioc", "madere", "malanga", "dachine", "christophine", "chayotte", "giraumon", "giromon", "banane plantain", "pois d angole", "cive", "bois d inde", "poisson", "vivaneau", "dorade", "thon", "sardine", "maquereau", "hareng", "morue", "crevette"];
  return localProducts.filter((product) => text.includes(product)).length;
};
export const estimatedRecipeCost = (recipe: Recipe | MenuCourse, portions: number) => {
  const prices: Record<string, number> = {
    poisson: 2.6, saumon: 3.2, cabillaud: 2.8, poulet: 1.8, dinde: 1.9, boeuf: 2.5, porc: 1.8,
    thon: 1.1, sardine: .8, maquereau: .9, hareng: 1, oeuf: .45, fromage: .7,
    riz: .3, pate: .3, "pomme de terre": .45, "patate douce": .6, legume: .65, fruit: .65,
  };
  return recipe.ingredients.reduce((total, ingredient) => {
    const key = Object.keys(prices).find((candidate) => canonicalIngredient(ingredient).includes(candidate));
    return total + (key ? prices[key] : .22) * portions;
  }, 0);
};
export const isValidCourseRecipe = (recipe: Recipe) => {
  const title = norm(recipe.name);
  if (/^(recette|recettes|idee|idees|selection|top)\b/.test(title)) return false;
  if (recipe.course === "entrée" && /\b(sauce(s)?|crepe(s)?|gaufre(s)?|pancake(s)?)\b/.test(title)) return false;
  if (recipe.course === "dessert" && /^(dessert|desserts|dessert pas cher|desserts pas chers)$/.test(title)) return false;
  return true;
};
export const isOtherPreparationName = (name: string) => /^(pate (brisee|sablee|feuilletee|a pizza)|citronnade|limonade|smoothie|cocktail|boisson|jus de|the glace|sauce\b|vinaigrette\b|marinade\b|coulis\b|mayonnaise\b|pesto\b)/.test(norm(name));
export const isRecipeConcordant = (recipe: Recipe) => {
  if (recipe.custom) return true;
  if (!recipe.source) return true;
  const preparation = norm(recipe.steps.join(" "));
  const pantry = /^(huile|sel|poivre|beurre|eau|epice|herbe|thym|persil|curry|paprika|muscade)/;
  const meaningful = recipe.ingredients.filter((ingredient) => !pantry.test(norm(ingredient)));
  if (!meaningful.length) return true;
  const mentioned = meaningful.filter((ingredient) => {
    const words = norm(ingredient).match(/[a-z]{4,}/g) || [];
    return words.some((word) => preparation.includes(word.replace(/s$/, "")));
  });
  return mentioned.length / meaningful.length >= 0.75;
};
export const ingredientUsedInSteps = (ingredient: string, steps: string[]) => {
  const normalized = norm(ingredient);
  if (/^(huile|sel|poivre|beurre|eau|epice|herbe|thym|persil|curry|paprika|muscade)/.test(normalized)) return true;
  const preparation = norm(steps.join(" "));
  const words = normalized.match(/[a-z]{4,}/g) || [];
  return words.some((word) => preparation.includes(word.replace(/s$/, "")));
};
export const sanitizeImportedRecipe = (recipe: Recipe): Recipe => {
  const invalid = /^(preparation|ingredient|ingredients|pour la recette|facultatif|melange|montage|pour (la|le|les) (pate|montage|garniture|sauce|creme|appareil)|garniture|appareil)$/;
  const ingredients = recipe.ingredients.filter((ingredient) => !invalid.test(norm(ingredient)) && (!recipe.source || ingredientUsedInSteps(ingredient, recipe.steps)));
  const ingredientQuantities = recipe.ingredientQuantities
    ? Object.fromEntries(Object.entries(recipe.ingredientQuantities).filter(([ingredient]) => ingredients.some((kept) => sameIngredient(kept, ingredient))))
    : undefined;
  const appetizerFish = /(rillettes?|tartinade|dip|bouchees?)/.test(norm(recipe.name));
  const otherPreparation = isOtherPreparationName(recipe.name);
  return { ...recipe, ingredients, ingredientQuantities, course: otherPreparation ? "autre" : appetizerFish ? "entrée" : recipe.course };
};
export const spellingDistance = (a: string, b: string) => {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[b.length];
};
export const sameIngredient = (stock: string, needed: string) => {
  const a = canonicalIngredient(stock);
  const b = canonicalIngredient(needed);
  if (a === b) return true;
  const exactOnly = new Set([
    "farine",
    "poisson",
    "fromage",
    "pain",
    "lait",
    "creme",
  ]);
  if (exactOnly.has(a) || exactOnly.has(b)) return false;
  const longest = Math.max(a.length, b.length);
  const tolerance = longest >= 8 ? 2 : longest >= 5 ? 1 : 0;
  if (tolerance && spellingDistance(a, b) <= tolerance) return true;
  return a.includes(b) || b.includes(a);
};
export const ingredientMeasure = (name: string, portions: number): Measure => {
  const n = canonicalIngredient(name);
  const grams: Record<string, number> = {
    poulet: 150, dinde: 150, "dinde hachee": 150, porc: 150, boeuf: 150,
    poisson: 150, crevette: 120, palourde: 170, saumon: 100,
    "saumon fume": 70, lard: 55, lardon: 55, jambon: 55, chorizo: 45,
    riz: 75, pate: 80, lasagne: 85, cannelloni: 85, farine: 45,
    lentille: 70, "pois rouge": 80, "pois chiche": 80,
    giromon: 180, epinard: 150, poireau: 150, courgette: 150,
    aubergine: 150, "patate douce": 180, "pomme de terre": 180,
    "pommes de terre": 180,
    carotte: 90, tomate: 120, poivron: 100, champignon: 100,
    salade: 70, laitue: 50, concombre: 100, avocat: 80, anana: 100,
    fromage: 35, "fromage rape": 35, mozzarella: 50, feta: 40, ricotta: 60,
    beurre: 12, chocolat: 25, cacahuete: 25, popcorn: 25,
    sucre: 15, "sucre roux": 15, pesto: 20, herbe: 3, persil: 3,
    thym: 2, epice: 4, "epices colombo": 5, curcuma: 3, sel: 2,
    cannelle: 1,
  };
  const millilitres: Record<string, number> = {
    lait: 120, "lait de coco": 80, "creme fraiche": 40,
    huile: 10, "sauce soja": 12,
  };
  const units: Record<string, number> = {
    oeuf: 1.5, tortilla: 1, "pate brisee": 0.25, "pate a pizza": 0.25,
    pain: 0.18, "pain de mie": 2, yaourt: 1, fruit: 1, banane: 1,
    pomme: 1, mandarine: 1,
    "nem poulet": 3, oignon: 0.35, ail: 0.5, "citron vert": 0.35,
  };
  if (grams[n]) return { amount: grams[n] * portions, unit: "g" };
  if (millilitres[n]) return { amount: millilitres[n] * portions, unit: "ml" };
  return { amount: (units[n] || 0.25) * portions, unit: "unité" };
};
export const breakfastMeasure = (name: string, portions: number): Measure => {
  const n = canonicalIngredient(name);
  const perPerson: Record<string, Measure> = {
    cafe: { amount: 7, unit: "unité" },
    lait: { amount: 1400, unit: "ml" },
    pain: { amount: 1, unit: "unité" },
    "pain de mie": { amount: 8, unit: "unité" },
    beurre: { amount: 125, unit: "g" },
    tortilla: { amount: 2, unit: "unité" },
    fruit: { amount: 7, unit: "unité" },
    yaourt: { amount: 7, unit: "unité" },
    oeuf: { amount: 4, unit: "unité" },
    chocolat: { amount: 100, unit: "g" },
  };
  const base = perPerson[n] || { amount: 1, unit: "unité" as const };
  return { amount: base.amount * portions, unit: base.unit };
};
export const quantityMeasure = (quantity: string, targetUnit: Measure["unit"]) =>
  inventoryMeasure({ quantity }, targetUnit);
export const recipeIngredientMeasure = (recipe: Recipe, name: string, portions: number): Measure => {
  const fallback = ingredientMeasure(name, portions);
  const saved = recipe.ingredientQuantities?.[name];
  if (!saved) return fallback;
  const parsed = quantityMeasure(saved, fallback.unit);
  if (!parsed) return fallback;
  const base = Math.max(1, recipe.servings || portions);
  return { amount: parsed.amount * portions / base, unit: parsed.unit };
};
export const recipeIngredientAvailability = (items: Item[], recipe: Recipe, name: string, portions: number) => {
  const needed = recipeIngredientMeasure(recipe, name, portions);
  const measures = items.filter((item) => sameIngredient(item.name, name)).map((item) => inventoryMeasure(item, needed.unit));
  const stocked = measures.reduce((sum, measure) => sum + (measure?.amount || 0), 0);
  const missing = Math.max(0, needed.amount - stocked);
  return { needed, stocked, missing, enough: missing === 0, uncertain: measures.some((measure) => measure === null) };
};
export const formatMeasure = ({ amount, unit }: Measure) => {
  if (unit === "g" && amount >= 1000)
    return `${(amount / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} kg`;
  if (unit === "ml" && amount >= 1000)
    return `${(amount / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} L`;
  const rounded = unit === "unité" ? Math.ceil(amount) : Math.ceil(amount / 5) * 5;
  return `${rounded.toLocaleString("fr-FR")} ${unit}${unit === "unité" && rounded > 1 ? "s" : ""}`;
};
export const purchasePackMeasure = (name: string, measure: Measure): Measure => {
  const key = canonicalIngredient(name);
  const gramPacks: Array<[RegExp, number]> = [
    [/beurre/, 250], [/(pates?|semoule)/, 500], [/(riz|farine|sucre)/, 1000],
    [/(fromage|emmental|mozzarella)/, 200], [/(thon|sardine|maquereau|hareng)/, 140],
  ];
  const liquidPacks: Array<[RegExp, number]> = [[/(lait|huile)/, 1000], [/(creme)/, 200]];
  const unitPacks: Array<[RegExp, number]> = [[/oeuf/, 6], [/(yaourt|compote)/, 4]];
  const packs = measure.unit === "g" ? gramPacks : measure.unit === "ml" ? liquidPacks : unitPacks;
  const size = packs.find(([pattern]) => pattern.test(key))?.[1];
  return size ? { amount: Math.ceil(measure.amount / size) * size, unit: measure.unit } : measure;
};
export const hasEnoughIngredient = (items: Item[], name: string, portions: number) => {
  const needed = ingredientMeasure(name, portions);
  const matching = items.filter((item) => sameIngredient(item.name, name));
  if (!matching.length) return false;
  return matching.reduce(
    (sum, item) => sum + (inventoryMeasure(item, needed.unit)?.amount || 0),
    0,
  ) >= needed.amount;
};
export const ingredientAvailability = (items: Item[], name: string, portions: number) => {
  const needed = ingredientMeasure(name, portions);
  const matching = items.filter((item) => sameIngredient(item.name, name));
  const measures = matching.map((item) => inventoryMeasure(item, needed.unit));
  const uncertain = measures.filter((measure) => measure === null).length;
  const stocked = measures.reduce((sum, measure) => sum + (measure?.amount || 0), 0);
  const missing = Math.max(0, needed.amount - stocked);
  return { needed, stocked, missing, enough: missing === 0, uncertain };
};
export const seasoningsForRecipe = (recipe: Recipe) => {
  if (recipe.seasonings) return recipe.seasonings;
  const text = norm(`${recipe.name} ${recipe.ingredients.join(" ")}`);
  const choices = ["sel", "poivre", "huile"];
  if (/(creole|colombo|curry|poulet|giromon)/.test(text)) choices.push("thym", "curcuma");
  if (/(tomate|pizza|pate|lasagne|aubergine)/.test(text)) choices.push("herbes de Provence");
  if (/(dessert|chocolat|pomme|banane|tiramisu)/.test(text)) return ["cannelle", "vanille"];
  return [...new Set(choices)];
};
export const utensilsForRecipe = (recipe: Recipe) => {
  const text = norm(`${recipe.name} ${recipe.steps.join(" ")}`);
  const utensils = ["couteau", "planche à découper"];
  if (/(four|gratiner|quiche|tarte|pizza)/.test(text)) utensils.push("four", "plat ou plaque");
  else if (/(mijoter|bouillir|cuire le riz|soupe)/.test(text)) utensils.push("casserole avec couvercle");
  else utensils.push("poêle");
  return utensils;
};
export const expandedRecipeSteps = (recipe: Recipe) => {
  const steps = [...recipe.steps];
  const preparation = norm(steps.join(" "));
  const hasOil = recipe.ingredients.some((ingredient) => /^(huile|huile d olive|huile de tournesol)$/.test(canonicalIngredient(ingredient)));
  if (hasOil && !/\bhuile\b/.test(preparation)) {
    const cookingIndex = steps.findIndex((step) => /(cuire|dorer|poele|croquette|galette)/.test(norm(step)));
    const instruction = /(croquette|galette)/.test(norm(recipe.name))
      ? "Faire chauffer l’huile dans une poêle sur feu moyen, puis y déposer les croquettes sans les serrer."
      : /four|enfourner/.test(preparation)
        ? "Badigeonner légèrement la préparation avec l’huile avant de l’enfourner."
        : "Faire chauffer l’huile dans la poêle avant d’y déposer les ingrédients à cuire.";
    steps.splice(cookingIndex >= 0 ? cookingIndex : Math.max(0, steps.length - 1), 0, instruction);
  }
  return steps;
};
export const personKey = (person: Person, index: number) => person.id || `${index}-${person.name}`;
