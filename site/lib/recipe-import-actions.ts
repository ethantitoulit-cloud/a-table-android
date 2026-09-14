import type { Dispatch, SetStateAction } from "react";
import type { Recipe } from "./app-types";
import { isOtherPreparationName, norm, sanitizeImportedRecipe } from "./app-domain";
import { auditRecipe } from "./recipe-audit";

type RecipeLink = { name: string; url: string };
type WeekPicker = { day: number; course: "entrée" | "plat" | "dessert"; addToMeal?: boolean };

type RecipeImportContext = {
  recipeLink: RecipeLink;
  weekPicker: WeekPicker | null;
  customRecipes: Recipe[];
  setCustomRecipes: Dispatch<SetStateAction<Recipe[]>>;
  setRecipeLink: Dispatch<SetStateAction<RecipeLink>>;
  setRecipeImportStatus: Dispatch<SetStateAction<string>>;
  setRecipeImportOpen: Dispatch<SetStateAction<boolean>>;
  setWeekNetOpen: Dispatch<SetStateAction<boolean>>;
  saveSetting: (key: string, value: unknown) => Promise<unknown>;
  chooseWeekCourse: (recipe: Recipe) => void;
  flash: (message: string) => void;
};

const fetchRecipe = async (url: string) => {
  const response = await fetch("/api/import-recipe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  }).catch(() => null);
  const data = response ? await response.json().catch(() => ({})) : {};
  return { response, data };
};

export function createRecipeImportActions(context: RecipeImportContext) {
  const {
    recipeLink, weekPicker, customRecipes, setCustomRecipes, setRecipeLink,
    setRecipeImportStatus, setRecipeImportOpen, setWeekNetOpen, saveSetting,
    chooseWeekCourse, flash,
  } = context;

  async function saveWebRecipe() {
    const sourceUrl = recipeLink.url.trim();
    if (!sourceUrl) return;
    setRecipeImportStatus("Lecture de la recette…");
    const { response, data } = await fetchRecipe(sourceUrl);
    const imported = data.recipe;
    if (!response?.ok || !imported) {
      setRecipeImportStatus(data.error || "Recette refusée : la fiche Internet est incomplète");
      flash("Recette non ajoutée : elle ne passe pas le contrôle qualité");
      return;
    }
    const name = recipeLink.name.trim() || imported.name || "Recette importée";
    const recipe: Recipe = sanitizeImportedRecipe({
      name,
      time: imported.time || 30,
      ingredients: imported.ingredients || [],
      tags: ["tout"],
      steps: imported.steps || [],
      source: sourceUrl,
      image: imported.image,
      servings: imported.servings,
      ingredientQuantities: imported.ingredientQuantities,
      course: isOtherPreparationName(name) ? "autre" : imported.course,
      custom: true,
    });
    const audit = auditRecipe(recipe);
    if (audit.reasons.length) {
      setRecipeImportStatus(`Recette refusée : ${audit.reasons.join(" · ")}`);
      flash("Recette non ajoutée : elle ne passe pas le contrôle qualité");
      return;
    }
    const next = [audit.recipe, ...customRecipes.filter((saved) => saved.name !== recipe.name)];
    setCustomRecipes(next);
    await saveSetting("customRecipes", next);
    setRecipeLink({ name: "", url: "" });
    setRecipeImportStatus("Recette contrôlée : ingrédients, étapes, quantités, photo et nutrition conformes");
    setRecipeImportOpen(false);
    flash("Recette contrôlée et ajoutée à ta banque");
  }

  async function importWebRecipeForWeek(urlOverride?: string) {
    const sourceUrl = urlOverride?.trim() || recipeLink.url.trim();
    if (!weekPicker || !sourceUrl) return;
    setRecipeImportStatus("Lecture et contrôle de la recette…");
    const { response, data } = await fetchRecipe(sourceUrl);
    const imported = data.recipe;
    if (!response?.ok || !imported) {
      setRecipeImportStatus(data.error || "Cette page ne contient pas une fiche de recette assez complète");
      return;
    }
    const recipe: Recipe = sanitizeImportedRecipe({
      name: recipeLink.name.trim() || imported.name || "Recette importée",
      time: imported.time || 30,
      ingredients: imported.ingredients || [],
      tags: ["tout"],
      steps: imported.steps || [],
      source: sourceUrl,
      image: imported.image,
      servings: imported.servings,
      ingredientQuantities: imported.ingredientQuantities,
      course: weekPicker.course === "dessert" ? "dessert" : imported.course === "entrée" ? "entrée" : "plat",
      custom: true,
    });
    const audit = auditRecipe(recipe);
    if (audit.reasons.length) {
      setRecipeImportStatus(`Recette refusée : ${audit.reasons.join(" · ")}`);
      return;
    }
    const next = [audit.recipe, ...customRecipes.filter((saved) => norm(saved.name) !== norm(audit.recipe.name))];
    setCustomRecipes(next);
    await saveSetting("customRecipes", next);
    setRecipeLink({ name: "", url: "" });
    setRecipeImportStatus("");
    setWeekNetOpen(false);
    chooseWeekCourse(audit.recipe);
  }

  async function importCopiedRecipeForWeek() {
    try {
      const copiedText = await navigator.clipboard.readText();
      const copiedUrl = copiedText.match(/https?:\/\/[^\s]+/)?.[0];
      if (!copiedUrl) {
        setRecipeImportStatus("Aucun lien de recette n’est copié. Sur la recette, touche Partager puis Copier le lien.");
        return;
      }
      setRecipeLink((current) => ({ ...current, url: copiedUrl }));
      await importWebRecipeForWeek(copiedUrl);
    } catch {
      setRecipeImportStatus("Chrome n’autorise pas la lecture du lien. Tu peux encore le coller dans le champ de secours.");
    }
  }

  return { saveWebRecipe, importWebRecipeForWeek, importCopiedRecipeForWeek };
}
