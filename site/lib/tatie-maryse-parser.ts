type JsonValue = Record<string, unknown>;

const decodeHtml = (value: string) => value
  .replace(/&nbsp;|&#160;/gi, " ")
  .replace(/&rsquo;|&#8217;|&#039;/gi, "’")
  .replace(/&eacute;/gi, "é")
  .replace(/&egrave;/gi, "è")
  .replace(/&agrave;/gi, "à")
  .replace(/&ecirc;/gi, "ê")
  .replace(/&ccedil;/gi, "ç")
  .replace(/&amp;/gi, "&")
  .replace(/&quot;/gi, '"')
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));

const htmlLines = (value: string) => decodeHtml(value)
  .replace(/<br\s*\/?>/gi, "\n")
  .replace(/<\/p>/gi, "\n")
  .replace(/<[^>]+>/g, " ")
  .split("\n")
  .map((line) => line.replace(/\s+/g, " ").replace(/^\*+/, "").trim())
  .filter(Boolean);

export function parseTatieMaryseRecipe(html: string, target: URL): JsonValue | null {
  if (!/(?:^|\.)tatiemaryse\.com$/i.test(target.hostname)) return null;
  const article = html.match(/<article\b[^>]*class=["'][^"']*\brecette\b[^"']*["'][^>]*>([\s\S]*?)<\/article>/i)?.[1] || html;
  const name = htmlLines(article.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "")[0];
  const ingredientBlock = article.match(/<div\b[^>]*class=["'][^"']*\bingredients\b[^"']*["'][^>]*>([\s\S]*?)<div\b[^>]*class=["'][^"']*recettes-pub-sous-ingredients/i)?.[1] || "";
  const ingredientContent = ingredientBlock.match(/<div\b[^>]*class=["'][^"']*\bcontenu\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] || ingredientBlock;
  const ingredients = htmlLines(ingredientContent)
    .filter((line) => !/^(ingrédients?|fermer|ouvrir|voir l’aide|pour \d+ poissons? frits?)$/i.test(line))
    .filter((line) => !/^(pour la saumure|pour la friture)\s*:?$/i.test(line));
  const steps = [...article.matchAll(/<div\b[^>]*class=["'][^"']*\betape\b[^"']*["'][^>]*>([\s\S]*?)<div\b[^>]*class=["'][^"']*clearer/gi)]
    .flatMap((match) => htmlLines(match[1]))
    .filter((line) => line.length > 12 && !/^recette poisson frit/i.test(line));
  if (!name || ingredients.length < 2 || steps.length < 2) return null;
  const image = article.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
  const preparation = Number(article.match(/class=["'][^"']*temps-preparation[^"']*["'][\s\S]{0,200}?(\d+)\s*min/i)?.[1] || 0);
  const cooking = Number(article.match(/class=["'][^"']*temps-cuisson[^"']*["'][\s\S]{0,200}?(\d+)\s*min/i)?.[1] || 0);
  const servings = Number(ingredientBlock.match(/Pour\s+(\d+)/i)?.[1] || 0) || undefined;
  return {
    "@type": "Recipe",
    name,
    recipeIngredient: ingredients,
    recipeInstructions: steps,
    image: image ? new URL(image, target).toString() : undefined,
    totalTime: `PT${preparation + cooking || 30}M`,
    recipeYield: servings,
    recipeCategory: "plat",
  };
}
