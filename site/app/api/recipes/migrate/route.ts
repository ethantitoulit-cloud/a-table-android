import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { recipeIngredients, recipeMigrationRuns, recipes, recipeSteps, recipeTags, settings } from "../../../../db/schema";
import { ownerCanWrite, writeForbidden } from "../../owner";

const MIGRATION_VERSION = 1;
const COLLECTIONS = ["customRecipes", "webRecipes", "courseRecipes", "fishRecipes"] as const;
type LegacyRecipe = { name?: string; ingredients?: string[]; steps?: string[]; tags?: string[]; servings?: number; time?: number; course?: string; source?: string; image?: string; ingredientQuantities?: Record<string, string>; [key: string]: unknown };

const normalize = (value: string) => value.toLocaleLowerCase("fr-FR").replace(/œ/g, "oe").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const stableId = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return `recipe_${(hash >>> 0).toString(36)}`;
};

export async function GET() {
  try {
    const db = getDb();
    const [latest] = await db.select().from(recipeMigrationRuns).orderBy(desc(recipeMigrationRuns.id)).limit(1);
    return Response.json({ version: MIGRATION_VERSION, latest: latest ? { ...latest, report: JSON.parse(latest.report) } : null });
  } catch {
    return Response.json({ version: MIGRATION_VERSION, latest: null, unavailable: true });
  }
}

export async function POST(request: Request) {
  if (!ownerCanWrite(request)) return writeForbidden();
  const db = getDb();
  const startedAt = new Date().toISOString();
  const [run] = await db.insert(recipeMigrationRuns).values({ version: MIGRATION_VERSION, status: "running", report: "{}", startedAt }).returning();
  try {
    const rows = await db.select().from(settings);
    const saved = new Map(rows.map((row) => [row.key, row.value]));
    const byDedupe = new Map<string, { recipe: LegacyRecipe; collection: string }>();
    const sourceCounts: Record<string, number> = {};
    for (const collection of COLLECTIONS) {
      const parsed = JSON.parse(saved.get(collection) || "[]") as LegacyRecipe[];
      sourceCounts[collection] = Array.isArray(parsed) ? parsed.length : 0;
      if (!Array.isArray(parsed)) continue;
      for (const recipe of parsed) {
        if (!recipe?.name?.trim()) continue;
        const key = normalize(recipe.source || recipe.name);
        if (!byDedupe.has(key)) byDedupe.set(key, { recipe, collection });
      }
    }

    let inserted = 0;
    let retained = 0;
    for (const [dedupeKey, entry] of byDedupe) {
      const id = stableId(dedupeKey);
      const [existing] = await db.select({ id: recipes.id }).from(recipes).where(eq(recipes.id, id)).limit(1);
      if (existing) { retained += 1; continue; }
      const recipe = entry.recipe;
      const now = new Date().toISOString();
      await db.insert(recipes).values({
        id, name: recipe.name!.trim(), normalizedName: normalize(recipe.name!), dedupeKey,
        course: (["entrée", "plat", "dessert", "autre"].includes(String(recipe.course)) ? recipe.course : "plat") as "entrée" | "plat" | "dessert" | "autre",
        source: recipe.source || null, sourceCollection: entry.collection, servings: Math.max(1, Number(recipe.servings) || 1),
        timeMinutes: Math.max(0, Number(recipe.time) || 0), image: recipe.image || null, payload: JSON.stringify(recipe), createdAt: now, updatedAt: now,
      });
      const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
      if (ingredients.length) await db.insert(recipeIngredients).values(ingredients.map((name, position) => ({ recipeId: id, name, normalizedName: normalize(name), quantity: recipe.ingredientQuantities?.[name] || null, position })));
      const steps = Array.isArray(recipe.steps) ? recipe.steps : [];
      if (steps.length) await db.insert(recipeSteps).values(steps.map((instruction, position) => ({ recipeId: id, instruction, position })));
      const tags = [...new Set(Array.isArray(recipe.tags) ? recipe.tags.filter(Boolean) : [])];
      if (tags.length) await db.insert(recipeTags).values(tags.map((tag) => ({ recipeId: id, tag })));
      inserted += 1;
    }

    const report = { sourceCounts, uniqueRecipes: byDedupe.size, inserted, retained, simpleFoodsPreloaded: 0, legacySettingsPreserved: true };
    await db.update(recipeMigrationRuns).set({ status: "completed", report: JSON.stringify(report), completedAt: new Date().toISOString() }).where(eq(recipeMigrationRuns.id, run.id));
    return Response.json({ ok: true, version: MIGRATION_VERSION, report });
  } catch (error) {
    const report = { error: error instanceof Error ? error.message : "Migration impossible", legacySettingsPreserved: true };
    await db.update(recipeMigrationRuns).set({ status: "failed", report: JSON.stringify(report), completedAt: new Date().toISOString() }).where(eq(recipeMigrationRuns.id, run.id)).catch(() => null);
    return Response.json({ error: "Migration impossible", report }, { status: 500 });
  }
}
