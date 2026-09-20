import { auditRecipe } from "../../../lib/recipe-audit";
import { recipeHasIngredientConcordance } from "../../../lib/ingredient-concordance";
import { parseTatieMaryseRecipe } from "../../../lib/tatie-maryse-parser";

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
  const hours = Number(raw.match(/(\d+)H/)?.[1] || 0);
  const minutes = Number(raw.match(/(\d+)M/)?.[1] || 0);
  return hours * 60 + minutes || 30;
};
const nutritionNumber = (value: unknown) => Number(String(value || "").replace(",", ".").match(/\d+(?:\.\d+)?/)?.[0] || 0) || undefined;

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

export async function POST(request: Request) {
  try {
    const { url } = (await request.json()) as { url?: string };
    if (!url) return Response.json({ error: "Adresse requise" }, { status: 400 });
    let target = new URL(url.trim().replace(/[),.;!?]+$/u, ""));
    if (!/^https?:$/.test(target.protocol)) throw new Error("Adresse invalide");
    if (/^(?:www\.)?google\.[a-z.]+$/i.test(target.hostname) && target.pathname === "/url") {
      const destination = target.searchParams.get("url") || target.searchParams.get("q");
      if (destination) target = new URL(destination);
    }
    const cache = typeof caches !== "undefined" && "default" in caches
      ? (caches as CacheStorage & { default: Cache }).default
      : null;
    const cacheKey = new Request(`${new URL(request.url).origin}/api/import-recipe-cache?url=${encodeURIComponent(target.toString())}`);
    const cached = await cache?.match(cacheKey);
    if (cached) return cached;
    const response = await fetch(target.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.7",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error("Page inaccessible");
    target = new URL(response.url || target.toString());
    const html = await response.text();
    const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    let recipe: JsonValue | null = null;
    for (const script of scripts) {
      try { recipe = findRecipe(JSON.parse(script[1])); } catch { /* autre bloc JSON-LD */ }
      if (recipe) break;
    }
    if (!recipe) recipe = parseTatieMaryseRecipe(html, target);
    if (!recipe) return Response.json({ error: "Cette page ne fournit pas une fiche recette lisible automatiquement" }, { status: 422 });
    const instructions = Array.isArray(recipe.recipeInstructions)
      ? recipe.recipeInstructions
      : recipe.recipeInstructions ? [recipe.recipeInstructions] : [];
    const rawIngredients = Array.isArray(recipe.recipeIngredient)
      ? recipe.recipeIngredient
      : recipe.recipeIngredient ? [recipe.recipeIngredient] : [];
    const ingredients = rawIngredients.map(ingredientName).filter((name) => name && validIngredientName(name));
    const ingredientQuantities = Object.fromEntries(rawIngredients.map((value) => [ingredientName(value), ingredientQuantity(value)]).filter(([name, quantity]) => name && quantity && validIngredientName(name)));
    const servings = Number(String(recipe.recipeYield || "").match(/\d+/)?.[0] || 0) || undefined;
    const steps = instructions.flatMap((step) => {
      if (typeof step === "string") return [textOnly(step)];
      if (step && typeof step === "object") {
        const item = step as JsonValue;
        if (Array.isArray(item.itemListElement)) return item.itemListElement.map((part) => textOnly(typeof part === "object" && part ? (part as JsonValue).text : part));
        return [textOnly(item.text || item.name)];
      }
      return [];
    }).filter(Boolean);
    if (ingredients.length < 2 || steps.length < 2 || !recipeHasIngredientConcordance(ingredients, steps))
      return Response.json({ error: "Cette fiche ne précise pas assez clairement comment utiliser ses ingrédients" }, { status: 422 });
    const course: "autre" | undefined = /(citronnade|limonade|smoothie|cocktail|boisson|jus de|thé glacé|the glace)/i.test(textOnly(recipe.name)) ? "autre" : undefined;
    const candidate = {
        name: textOnly(recipe.name),
        time: durationMinutes(recipe.totalTime || recipe.cookTime || recipe.prepTime),
        ingredients,
        ingredientQuantities,
        servings,
        steps,
        image: recipeImage(recipe.image, target),
        source: target.toString(),
        course,
        calories: nutritionNumber((recipe.nutrition as JsonValue | undefined)?.calories),
        fatGrams: nutritionNumber((recipe.nutrition as JsonValue | undefined)?.fatContent),
      };
    const audited = auditRecipe(candidate);
    if (audited.reasons.length) return Response.json({ error: `Recette refusée : ${audited.reasons.join(" · ")}` }, { status: 422 });
    const result = Response.json({ recipe: audited.recipe }, { headers: { "Cache-Control": "public, max-age=3600" } });
    await cache?.put(cacheKey, result.clone()).catch(() => undefined);
    return result;
  } catch {
    return Response.json({ error: "Impossible de lire cette recette" }, { status: 502 });
  }
}
