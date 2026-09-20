import type { Dispatch, SetStateAction } from "react";
import type { Recipe } from "./app-types";
import { auditRecipe } from "./recipe-audit";
import {
  LOCAL_RECIPE_MIGRATION_VERSION,
  LOCAL_RECIPE_URLS,
  MY_RECIPE_BOX_MIGRATION_VERSION,
  ODELICES_MIGRATION_VERSION,
  RECIPES,
  TATIE_MARYSE_MIGRATION_VERSION,
  WEB_RECIPE_MIGRATION_VERSION,
  WEB_SOURCE_URLS,
  isEverydayRecipe,
  isValidCourseRecipe,
  norm,
} from "./app-domain";

type SaveSetting = (key: string, value: unknown) => Promise<unknown>;
type RecipeSetter = Dispatch<SetStateAction<Recipe[]>>;

const postSetting = async (key: string, value: unknown) => {
  await fetch("/api/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "setting", key, value }),
  }).catch(() => null);
};

export async function migrateMyRecipeBox(existing: Recipe[], setRecipes: RecipeSetter, saveSetting: SaveSetting) {
  const response = await fetch("/myrecipebox-recipes.json").catch(() => null);
  if (!response?.ok) return existing;
  const imported = await response.json().catch(() => []);
  if (!Array.isArray(imported)) return existing;
  const knownSources = new Set(existing.map((recipe) => recipe.source).filter(Boolean));
  const knownNames = new Set(existing.map((recipe) => norm(recipe.name)));
  const additions = (imported as Recipe[]).filter((recipe) => {
    if (!recipe.name || knownNames.has(norm(recipe.name)) || recipe.source && knownSources.has(recipe.source)) return false;
    knownNames.add(norm(recipe.name));
    if (recipe.source) knownSources.add(recipe.source);
    return true;
  });
  const next = [...existing, ...additions];
  setRecipes(next);
  await Promise.all([
    saveSetting("customRecipes", next),
    saveSetting("myRecipeBoxMigrationVersion", MY_RECIPE_BOX_MIGRATION_VERSION),
  ]);
  return next;
}

export async function migrateWebCatalog(existing: Recipe[], setRecipes: RecipeSetter) {
  const migrated = new Map(existing.map((recipe) => [recipe.name, recipe]));
  let changed = false;
  for (const [originalName, url] of Object.entries(WEB_SOURCE_URLS)) {
    if (migrated.has(originalName)) continue;
    const response = await fetch("/api/import-recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    }).catch(() => null);
    if (!response?.ok) continue;
    const data = await response.json().catch(() => ({}));
    const imported = data.recipe as Recipe | undefined;
    if (!imported || imported.ingredients.length < 3 || imported.steps.length < 3) continue;
    const former = RECIPES.find((recipe) => recipe.name === originalName);
    migrated.set(originalName, { ...imported, name: originalName, source: url, tags: former?.tags || ["tout"], hidden: former?.hidden });
    changed = true;
  }
  const next = [...migrated.values()];
  if (changed) {
    setRecipes(next);
    await postSetting("webRecipes", next);
  }
  if (next.length >= Object.keys(WEB_SOURCE_URLS).length) await postSetting("webRecipeMigrationVersion", WEB_RECIPE_MIGRATION_VERSION);
  return next;
}

export async function migrateLocalCatalog(existing: Recipe[], setRecipes: RecipeSetter, saveSetting: SaveSetting) {
  const catalog = new Map(existing.filter((recipe) => recipe.source).map((recipe) => [recipe.source as string, recipe]));
  for (const url of LOCAL_RECIPE_URLS) {
    if (catalog.has(url)) continue;
    const response = await fetch("/api/import-recipe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) }).catch(() => null);
    if (!response?.ok) continue;
    const data = await response.json().catch(() => ({}));
    const imported = data.recipe as Recipe | undefined;
    if (!imported || auditRecipe(imported).reasons.length) continue;
    catalog.set(url, { ...imported, source: url, course: imported.course || "plat", tags: ["tout"] });
  }
  const next = [...catalog.values()];
  setRecipes(next);
  await Promise.all([saveSetting("webRecipes", next), saveSetting("localRecipeMigrationVersion", LOCAL_RECIPE_MIGRATION_VERSION)]);
  return next;
}

export async function migrateTatieMaryseCatalog(existing: Recipe[], setRecipes: RecipeSetter, setStatus: (status: string) => void, saveSetting: SaveSetting) {
  const catalog = new Map(existing.filter((recipe) => recipe.source).map((recipe) => [recipe.source as string, recipe]));
  let added = 0;
  setStatus("Import des recettes Tatie Maryse…");
  for (let page = 1; page <= 10; page += 1) {
    const response = await fetch("/api/import-catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "tatie-maryse", page }) }).catch(() => null);
    if (!response?.ok) continue;
    const data = await response.json().catch(() => ({}));
    const incoming = Array.isArray(data.recipes) ? data.recipes as Recipe[] : [];
    for (const recipe of incoming) {
      if (!recipe.source || catalog.has(recipe.source) || auditRecipe(recipe).reasons.length) continue;
      if ([...catalog.values()].some((saved) => norm(saved.name) === norm(recipe.name))) continue;
      const themes: NonNullable<Recipe["themes"]> = [...new Set<NonNullable<Recipe["themes"]>[number]>([...(recipe.themes || []), "local"])];
      catalog.set(recipe.source, { ...recipe, tags: ["tout"], themes });
      added += 1;
    }
    const next = [...catalog.values()];
    setRecipes(next);
    await saveSetting("webRecipes", next);
    setStatus(`Tatie Maryse : ${added} nouvelle${added > 1 ? "s" : ""} recette${added > 1 ? "s" : ""} validée${added > 1 ? "s" : ""}…`);
  }
  await saveSetting("tatieMaryseMigrationVersion", TATIE_MARYSE_MIGRATION_VERSION);
  setStatus(added ? `${added} recettes Tatie Maryse ajoutées.` : "Les recettes Tatie Maryse accessibles sont déjà présentes ou n’ont pas passé le contrôle qualité.");
  return migrateOdelicesCatalog([...catalog.values()], setRecipes, setStatus, saveSetting);
}

export async function migrateOdelicesCatalog(existing: Recipe[], setRecipes: RecipeSetter, setStatus: (status: string) => void, saveSetting: SaveSetting) {
  const catalog = new Map(existing.filter((recipe) => recipe.source).map((recipe) => [recipe.source as string, recipe]));
  let added = 0;
  setStatus("Import des recettes Ôdélices…");
  for (let page = 1; page <= 10; page += 1) {
    const response = await fetch("/api/import-catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "odelices", page }) }).catch(() => null);
    if (!response?.ok) continue;
    const data = await response.json().catch(() => ({}));
    const incoming = Array.isArray(data.recipes) ? data.recipes as Recipe[] : [];
    for (const recipe of incoming) {
      if (!recipe.source || catalog.has(recipe.source) || auditRecipe(recipe).reasons.length) continue;
      if ([...catalog.values()].some((saved) => norm(saved.name) === norm(recipe.name))) continue;
      catalog.set(recipe.source, { ...recipe, tags: ["tout"] });
      added += 1;
    }
    const next = [...catalog.values()];
    setRecipes(next);
    await saveSetting("webRecipes", next);
    setStatus(`Ôdélices : ${added} nouvelle${added > 1 ? "s" : ""} recette${added > 1 ? "s" : ""} validée${added > 1 ? "s" : ""}…`);
  }
  await saveSetting("odelicesMigrationVersion", ODELICES_MIGRATION_VERSION);
  setStatus(added ? `${added} recettes Ôdélices ajoutées.` : "Les recettes Ôdélices accessibles sont déjà présentes ou n’ont pas passé le contrôle qualité.");
  return [...catalog.values()];
}

export async function migrateCourseCatalogs(existing: Recipe[], setRecipes: RecipeSetter) {
  const catalog = new Map(existing.filter((recipe) => recipe.source).map((recipe) => [recipe.source as string, recipe]));
  const pages = Array.from({ length: 24 }, (_, index) => index + 1);
  for (const course of ["entrée", "dessert"] as const) {
    let count = [...catalog.values()].filter((recipe) => recipe.course === course && isValidCourseRecipe(recipe)).length;
    if (count >= 125) continue;
    for (const page of pages) {
      if (count >= 125) break;
      const response = await fetch("/api/import-catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: course, page }) }).catch(() => null);
      if (!response?.ok) continue;
      const data = await response.json().catch(() => ({}));
      const incoming = Array.isArray(data.recipes) ? data.recipes as Recipe[] : [];
      for (const recipe of incoming) {
        if (count >= 125 || !recipe.source || catalog.has(recipe.source) || !isValidCourseRecipe(recipe)) continue;
        if ([...catalog.values()].some((saved) => norm(saved.name) === norm(recipe.name))) continue;
        catalog.set(recipe.source, recipe);
        count += 1;
      }
      const next = [...catalog.values()];
      setRecipes(next);
      await postSetting("courseRecipes", next);
    }
  }
}

export async function migrateFishCatalog(existing: Recipe[], setRecipes: RecipeSetter) {
  const catalog = new Map(existing.filter((recipe) => recipe.source).map((recipe) => [recipe.source as string, recipe]));
  let count = [...catalog.values()].filter((recipe) => recipe.collection === "poisson").length;
  for (let page = 1; page <= 15 && count < 100; page += 1) {
    const response = await fetch("/api/import-catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "poisson", page }) }).catch(() => null);
    if (!response?.ok) continue;
    const data = await response.json().catch(() => ({}));
    const incoming = Array.isArray(data.recipes) ? data.recipes as Recipe[] : [];
    for (const recipe of incoming) {
      if (count >= 100 || !recipe.source || catalog.has(recipe.source) || !isEverydayRecipe(recipe)) continue;
      if ([...catalog.values()].some((saved) => norm(saved.name) === norm(recipe.name))) continue;
      catalog.set(recipe.source, recipe);
      count += 1;
    }
    const next = [...catalog.values()];
    setRecipes(next);
    await postSetting("fishRecipes", next);
  }
}
