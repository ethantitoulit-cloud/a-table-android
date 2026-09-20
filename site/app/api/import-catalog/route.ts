import { auditRecipe } from "../../../lib/recipe-audit";

type JsonValue = Record<string, unknown>;

const textOnly = (value: unknown) =>
  String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const ingredientName = (value: unknown) =>
  textOnly(value)
    .replace(/\(s\)/gi, "s")
    .replace(/^\s*[\d¼½¾⅓⅔.,/\-–]+\s*/u, "")
    .replace(/^(?:un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)\s+/i, "")
    .replace(/^(?:kg|g|gr|grammes?|l|dl|cl|ml|cuillères?\s+à\s+(?:soupe|café)|c\.\s*à\s*[sc]|pincées?|sachets?|paquets?|boîtes?|pots?|bocaux|bouteilles?|tranches?|pièces?|branches?|bottes?|poignées?|feuilles?|tasses?|verres?|gousses?|cubes?|boules?|noisettes?|brins?)\s+(?:de\s+|d['’])?/i, "")
    .replace(/,.*$/, "")
    .trim();

const ingredientQuantity = (value: unknown) => {
  const raw = textOnly(value).toLowerCase().replace(",", ".");
  const found = raw.match(/(\d+(?:\.\d+)?|[¼½¾⅓⅔])/u)?.[1];
  const fractions: Record<string, string> = { "¼": "0.25", "½": "0.5", "¾": "0.75", "⅓": "0.33", "⅔": "0.67" };
  const number = found ? fractions[found] || found : "";
  if (!number) return "";
  const unit = raw.match(/\b(kg|g|gr|grammes?|l|cl|ml)\b/i)?.[1];
  return `${number} ${unit || "unité"}${!unit && number !== "1" ? "s" : ""}`;
};
const validIngredientName = (value: string) => !/^(préparation|preparation|ingrédients?|ingredients?|pour\b|facultatif|mélange|melange|montage|garniture|appareil)/i.test(value.trim()) && !/(Filière Auchan|Cultivons le bon|Kub Duo|Maggi|Arôme\(s\)|FAST\[OCHE\])/i.test(value);

const durationMinutes = (value: unknown) => {
  const raw = String(value || "");
  return Number(raw.match(/(\d+)H/)?.[1] || 0) * 60 + Number(raw.match(/(\d+)M/)?.[1] || 0) || 30;
};
const nutritionNumber = (value: unknown) => Number(String(value || "").replace(",", ".").match(/\d+(?:\.\d+)?/)?.[0] || 0) || undefined;
const invalidCatalogTitle = (name: string, course: "entrée" | "plat" | "dessert") => {
  const title = textOnly(name).toLocaleLowerCase("fr-FR");
  if (/^(?:recettes?|idées?|sélection|top)\b/.test(title)) return true;
  if (course === "entrée" && /\b(sauces?|crêpes?|crepes?|gaufres?|pancakes?)\b/.test(title)) return true;
  if (course === "dessert" && /^(?:desserts?|dessert pas cher|desserts pas chers)$/.test(title)) return true;
  return false;
};
const recipeHasIngredientConcordance = (ingredients: string[], steps: string[]) => {
  const preparation = textOnly(steps.join(" ")).toLocaleLowerCase("fr-FR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const pantry = /^(huile|sel|poivre|beurre|eau|epice|herbe|thym|persil|curry|paprika|muscade)/;
  const meaningful = ingredients.filter((ingredient) => !pantry.test(ingredient.toLocaleLowerCase("fr-FR").normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
  const mentioned = meaningful.filter((ingredient) => {
    const words = ingredient.toLocaleLowerCase("fr-FR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[a-z]{4,}/g) || [];
    return words.some((word) => preparation.includes(word.replace(/s$/, "")));
  });
  return meaningful.length === 0 || mentioned.length / meaningful.length >= 0.75;
};

function findRecipe(value: unknown, depth = 0): JsonValue | null {
  if (depth > 12) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findRecipe(item, depth + 1);
      if (found) return found;
    }
  }
  if (value && typeof value === "object") {
    const object = value as JsonValue;
    const type = object["@type"];
    if (type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"))) return object;
    for (const child of Object.values(object)) {
      const found = findRecipe(child, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

const recipeImage = (value: unknown, base: URL) => {
  let candidate: unknown = value;
  if (Array.isArray(candidate)) candidate = candidate[0];
  if (candidate && typeof candidate === "object") candidate = (candidate as JsonValue).url || (candidate as JsonValue).contentUrl;
  if (typeof candidate !== "string" || !candidate.trim()) return undefined;
  try { return new URL(candidate, base).toString(); } catch { return undefined; }
};

async function importRecipe(url: string, course: "entrée" | "plat" | "dessert", collection?: "poisson", allowOccasional = false) {
  try {
    const target = new URL(url);
    const response = await fetch(target.toString(), { headers: { "User-Agent": "Mozilla/5.0 RecipeImporter/1.0" } });
    if (!response.ok) return null;
    const html = await response.text();
    const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    let recipe: JsonValue | null = null;
    for (const script of scripts) {
      try { recipe = findRecipe(JSON.parse(script[1])); } catch { /* bloc suivant */ }
      if (recipe) break;
    }
    if (!recipe) return null;
    const instructions = Array.isArray(recipe.recipeInstructions) ? recipe.recipeInstructions : [];
    const rawIngredients = Array.isArray(recipe.recipeIngredient) ? recipe.recipeIngredient : [];
    const ingredients = rawIngredients.map(ingredientName).filter((name) => name && validIngredientName(name));
    const steps = instructions.flatMap((step) => {
      if (typeof step === "string") return [textOnly(step)];
      if (step && typeof step === "object") {
        const item = step as JsonValue;
        if (Array.isArray(item.itemListElement)) return item.itemListElement.map((part) => textOnly(typeof part === "object" && part ? (part as JsonValue).text : part));
        return [textOnly(item.text || item.name)];
      }
      return [];
    }).filter((step) => step.length > 12);
    if (ingredients.length < 2 || steps.length < 2 || !recipeHasIngredientConcordance(ingredients, steps)) return null;
    const calories = nutritionNumber((recipe.nutrition as JsonValue | undefined)?.calories);
    const fatGrams = nutritionNumber((recipe.nutrition as JsonValue | undefined)?.fatContent);
    if (invalidCatalogTitle(textOnly(recipe.name), course)) return null;
    const richName = /beignet|frit|friture|raclette|tartiflette|foie gras|charcuterie|lardons?|bacon|triple chocolat|caramel au beurre|chantilly|gâteau d['’ ]anniversaire|gateau d['’ ]anniversaire/i.test(textOnly(recipe.name));
    const maxCalories = course === "dessert" || course === "entrée" ? 350 : 750;
    const maxFat = course === "dessert" || course === "entrée" ? 18 : 30;
    const occasional = Boolean(richName || (calories && calories > maxCalories) || (fatGrams && fatGrams > maxFat));
    if (occasional && !allowOccasional) return null;
    const category = textOnly(recipe.recipeCategory);
    const inferredCourse: "entrée" | "plat" | "dessert" | "autre" =
      /(dessert|patisserie|pâtisserie|gateau|gâteau|glace|sorbet|flan|tarte sucr|confiture|compote|gourmandise)/i.test(`${category} ${recipe.name}`) ? "dessert" :
      /(entree|entrée|aperitif|apéritif|amuse|bouchee|bouchée|accras|tartinade|salade)/i.test(`${category} ${recipe.name}`) ? "entrée" :
      /(boisson|cocktail|jus|punch|sirop)/i.test(`${category} ${recipe.name}`) ? "autre" : course;
    const candidate = {
      name: textOnly(recipe.name),
      time: durationMinutes(recipe.totalTime || recipe.cookTime || recipe.prepTime),
      ingredients,
      ingredientQuantities: Object.fromEntries(rawIngredients.map((value) => [ingredientName(value), ingredientQuantity(value)]).filter(([name, quantity]) => name && quantity && validIngredientName(name))),
      servings: Number(String(recipe.recipeYield || "").match(/\d+/)?.[0] || 0) || undefined,
      steps,
      image: recipeImage(recipe.image, target),
      source: target.toString(),
      course: inferredCourse,
      collection,
      tags: ["tout"],
      calories,
      fatGrams,
      occasional,
    };
    const audited = auditRecipe(candidate);
    return audited.reasons.length ? null : audited.recipe;
  } catch { return null; }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { kind?: string; page?: number };
  const fishCollections = [
    "https://www.cuisineaz.com/diaporamas/recettes-avec-une-boite-de-sardines-405/interne/1.aspx",
    "https://www.cuisineaz.com/diaporamas/15-recettes-printanieres-pour-redecouvrir-le-hareng-4426/interne/1.aspx",
    "https://www.cuisineaz.com/diaporamas/recettes-au-saumon-562/interne/1.aspx",
    "https://www.cuisineaz.com/diaporamas/30-plats-de-poissons-faciles-a-faire-pour-les-diners-de-la-semaine-6235/interne/1.aspx",
    "https://www.cuisineaz.com/diaporamas/15-recettes-legeres-et-gourmandes-au-saumon-4237/interne/1.aspx",
    "https://www.cuisineaz.com/diaporamas/15-recettes-express-avec-du-poisson-blanc-3802/interne/1.aspx",
    "https://www.cuisineaz.com/diaporamas/15-recettes-pour-sublimer-une-boite-de-thon-4251/interne/1.aspx",
    "https://www.cuisineaz.com/diaporamas/plats-pas-chers-au-poisson-1542/interne/1.aspx",
    "https://www.cuisineaz.com/diaporamas/12-recettes-de-maquereau-a-savourer-pendant-la-canicule-cet-ete-2026-8336/interne/1.aspx",
    "https://www.cuisineaz.com/diaporamas/15-recettes-variees-au-cabillaud-3803/interne/1.aspx",
    "https://www.cuisineaz.com/diaporamas/22-recettes-de-poisson-blanc-gourmandes-pour-un-ete-convivial-ce-2-aout-8232/interne/1.aspx",
    "https://www.cuisineaz.com/diaporamas/30-recettes-printanieres-a-base-de-poisson-pour-un-weekend-d-avril-plein-de-saveurs-7531/interne/1.aspx",
    "https://www.cuisineaz.com/diaporamas/plats-a-base-de-poisson-pas-chers-2167/interne/1.aspx",
    "https://www.cuisineaz.com/diaporamas/15-recettes-fraiches-a-base-de-saumon-pour-l-ete-5495/interne/1.aspx",
    "https://www.cuisineaz.com/diaporamas/50-recettes-de-saumon-pour-tous-les-jours-simples-economiques-et-pleines-de-gout-6803/interne/1.aspx",
  ];
  const isTatieMaryse = body.kind === "tatie-maryse";
  const isOdelices = body.kind === "odelices";
  const isFish = body.kind === "poisson";
  const course = isFish ? "plat" : body.kind === "dessert" ? "dessert" : "entrée";
  const root = course === "dessert"
    ? "https://www.cuisineaz.com/recettes-pas-cheres/desserts-pas-chers-p1190"
    : "https://www.cuisineaz.com/recettes-pas-cheres/entrees-pas-cheres-p1187";
  const page = Math.max(1, Math.min(250, Number(body.page) || 1));
  const listingUrl = isTatieMaryse
    ? page === 1 ? "https://www.tatiemaryse.com/les-recettes/" : `https://www.tatiemaryse.com/les-recettes/page/${page}/`
    : isOdelices
      ? page === 1 ? "https://odelices.ouest-france.fr/recettes/" : `https://odelices.ouest-france.fr/recettes/page/${page}/`
    : isFish ? fishCollections[(page - 1) % fishCollections.length] : page === 1 ? root : `${root}/${page}/`;
  try {
    const listing = await fetch(listingUrl, { headers: { "User-Agent": "Mozilla/5.0 RecipeImporter/1.0" } });
    if (!listing.ok) throw new Error("Catalogue inaccessible");
    const html = await listing.text();
    const urls = isTatieMaryse
      ? [...new Set([...html.matchAll(/href=["'](https?:\/\/www\.tatiemaryse\.com\/[^"'#?]+\/|\/[^"'#?]+\/)["']/gi)]
          .map((match) => new URL(match[1], listingUrl).toString())
          .filter((url) => !/\/(?:les-recettes|category|tag|author|boutique|ateliers?|magazine|page|wp-|propos-|plan-du-site)(?:\/|$)/i.test(new URL(url).pathname)))].slice(0, 24)
      : isOdelices
        ? [...new Set([...html.matchAll(/href=["'](https?:\/\/odelices\.ouest-france\.fr\/[^"'#?]+|\/[^"'#?]+)["']/gi)]
            .map((match) => new URL(match[1], listingUrl).toString())
            .filter((url) => /\/recettes?\//i.test(new URL(url).pathname) && !/\/recettes?\/(?:page|categorie|category|tag|auteur|author)(?:\/|$)/i.test(new URL(url).pathname)))].slice(0, 24)
      : [...new Set([...html.matchAll(/href=["']([^"']*\/recettes\/[^"'#?]+-\d+\.aspx)["']/gi)].map((match) => new URL(match[1], listingUrl).toString()))].slice(0, 24);
    const fishTerms = /poisson|sardine|hareng|thon|maquereau|saumon|cabillaud|colin|lieu|dorade|daurade|truite|anchois|haddock|flétan|merlu|rouget|sole|raie|bonite/i;
    const recipes = (await Promise.all(urls.map((url) => importRecipe(url, course, isFish ? "poisson" : undefined, isTatieMaryse || isOdelices))))
      .filter((recipe) => recipe && (!isFish || fishTerms.test(`${recipe.name} ${recipe.ingredients.join(" ")}`)));
    return Response.json({ recipes, page, course });
  } catch {
    return Response.json({ recipes: [], page, course, error: "Impossible de lire cette page du catalogue" }, { status: 502 });
  }
}
