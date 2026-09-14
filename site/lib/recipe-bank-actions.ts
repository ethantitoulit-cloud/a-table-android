import type { Dispatch, SetStateAction } from "react";
import type { Recipe } from "./app-types";
import type { SpecialMenu, WeekPlan } from "./app-domain";
import { isOtherPreparationName, norm, seasoningsForRecipe } from "./app-domain";
import { auditRecipe } from "./recipe-audit";
import type { RecipeDraft } from "../components/recipe-detail";

type Setter<T> = Dispatch<SetStateAction<T>>;
type Context = {
  detail: Recipe | null; detailPeople: number; people: number; recipeDraft: RecipeDraft;
  customRecipes: Recipe[]; webRecipes: Recipe[]; courseRecipes: Recipe[]; fishRecipes: Recipe[];
  deletedRecipeKeys: string[]; favorites: string[]; weekChoices: string[]; weekExtraChoices: string[][];
  weekStarterChoices: string[]; weekDessertChoices: string[]; weekPresence: boolean[][];
  weekAlternatives: Record<string, string>[]; specialMenus: Record<number, SpecialMenu>;
  skippedDays: Record<number, boolean>; selectedWeekStart: string;
  weekPlans: Record<string, WeekPlan>; setWeekPlans: Setter<Record<string, WeekPlan>>;
  setDetail: Setter<Recipe | null>; setDetailPeople: Setter<number>; setRecipeDraft: Setter<RecipeDraft>;
  setEditingRecipe: Setter<boolean>; setCustomRecipes: Setter<Recipe[]>; setWebRecipes: Setter<Recipe[]>;
  setCourseRecipes: Setter<Recipe[]>; setFishRecipes: Setter<Recipe[]>; setDeletedRecipeKeys: Setter<string[]>;
  setFavorites: Setter<string[]>; setWeekChoices: Setter<string[]>; setWeekExtraChoices: Setter<string[][]>;
  setWeekStarterChoices: Setter<string[]>; setWeekDessertChoices: Setter<string[]>;
  setWeekAlternatives: Setter<Record<string, string>[]>; setSpecialMenus: Setter<Record<number, SpecialMenu>>;
  openRecipe: (recipe: Recipe, portions?: number) => void;
  saveSetting: (key: string, value: unknown) => Promise<unknown>;
  flash: (message: string) => void;
};

export function createRecipeBankActions(context: Context) {
  const c = context;
  function startRecipeEdit(recipe: Recipe | null = c.detail) {
    if (!recipe) return;
    if (recipe !== c.detail) c.openRecipe(recipe, recipe.servings || c.people);
    c.setRecipeDraft({
      name: recipe.name, time: String(recipe.time), servings: String(recipe.servings || c.detailPeople || 4),
      course: recipe.course || "plat", ingredients: recipe.ingredients.join("\n"), steps: recipe.steps.join("\n"),
      seasonings: seasoningsForRecipe(recipe).join(", "), themes: recipe.themes || [],
    });
    c.setEditingRecipe(true);
  }

  function startNewRecipe() {
    const blank: Recipe = { name: "Nouvelle recette", time: 30, servings: 4, course: "plat", custom: true, source: "new://recipe", ingredients: [], steps: [], tags: ["tout"], seasonings: [] };
    c.setDetail(blank);
    c.setDetailPeople(4);
    c.setRecipeDraft({ name: "", time: "30", servings: "4", course: "plat", ingredients: "", steps: "", seasonings: "", themes: [] });
    c.setEditingRecipe(true);
  }

  function changeRecipePhoto(file?: File) {
    if (!file || !c.detail) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 900 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
        c.setDetail((current) => current ? { ...current, image: canvas.toDataURL("image/webp", .82) } : current);
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  }

  async function saveRecipeEdit() {
    if (!c.detail) return;
    const ingredients = c.recipeDraft.ingredients.split(/\n|,/).map((value) => value.trim()).filter(Boolean);
    const steps = c.recipeDraft.steps.split(/\n/).map((value) => value.trim()).filter(Boolean);
    if (!c.recipeDraft.name.trim() || !ingredients.length || !steps.length) {
      c.flash("Il faut un nom, au moins un ingrédient et une étape");
      return;
    }
    const original = c.detail;
    const isNew = original.source === "new://recipe";
    const updated: Recipe = {
      ...original, name: c.recipeDraft.name.trim(), time: Math.max(1, Number(c.recipeDraft.time) || 30),
      servings: Math.max(1, Number(c.recipeDraft.servings) || 4),
      course: isOtherPreparationName(c.recipeDraft.name.trim()) ? "autre" : c.recipeDraft.course,
      courseManuallySet: true, ingredients, steps, needsReview: false,
      seasonings: c.recipeDraft.seasonings.split(/,|\n/).map((value) => value.trim()).filter(Boolean),
      themes: c.recipeDraft.themes, themesManuallySet: true,
    };
    if (isNew) delete updated.source;
    const checked = auditRecipe(updated);
    if (checked.reasons.length) {
      c.flash(`À corriger : ${checked.reasons.join(" · ")}`);
      return;
    }
    Object.assign(updated, checked.recipe);
    const matches = (recipe: Recipe) => original.source ? recipe.source === original.source : recipe.name === original.name;
    const updateList = (list: Recipe[]) => list.map((recipe) => matches(recipe) ? updated : recipe);
    const nextCustom = isNew ? [updated, ...c.customRecipes] : updateList(c.customRecipes);
    const nextWeb = updateList(c.webRecipes), nextCourse = updateList(c.courseRecipes), nextFish = updateList(c.fishRecipes);
    c.setCustomRecipes(nextCustom); c.setWebRecipes(nextWeb); c.setCourseRecipes(nextCourse); c.setFishRecipes(nextFish);
    c.setDetail(updated); c.setEditingRecipe(false);
    await Promise.all([
      c.saveSetting("customRecipes", nextCustom), c.saveSetting("webRecipes", nextWeb),
      c.saveSetting("courseRecipes", nextCourse), c.saveSetting("fishRecipes", nextFish),
    ]);
    c.flash(isNew ? "Recette créée dans la banque" : "Recette modifiée dans la banque");
  }

  async function deleteRecipeFromBank(recipe: Recipe | null = c.detail) {
    if (!recipe || !window.confirm(`Supprimer définitivement « ${recipe.name} » de la banque ?`)) return;
    const removedName = recipe.name;
    const matches = (candidate: Recipe) => recipe.source ? candidate.source === recipe.source : norm(candidate.name) === norm(recipe.name);
    const nextCustom = c.customRecipes.filter((item) => !matches(item));
    const nextWeb = c.webRecipes.filter((item) => !matches(item));
    const nextCourse = c.courseRecipes.filter((item) => !matches(item));
    const nextFish = c.fishRecipes.filter((item) => !matches(item));
    const nextDeleted = [...new Set([...c.deletedRecipeKeys, norm(recipe.name), ...(recipe.source ? [recipe.source.trim()] : [])])];
    const nextFavorites = c.favorites.filter((name) => norm(name) !== norm(removedName));
    const cleanPlan = (plan: WeekPlan): WeekPlan => ({
      ...plan,
      choices: (plan.choices || []).map((name) => norm(name) === norm(removedName) ? "" : name),
      extraChoices: (plan.extraChoices || []).map((names) => names.filter((name) => norm(name) !== norm(removedName))),
      starterChoices: (plan.starterChoices || []).map((name) => norm(name) === norm(removedName) ? "" : name),
      dessertChoices: (plan.dessertChoices || []).map((name) => norm(name) === norm(removedName) ? "" : name),
      alternatives: (plan.alternatives || []).map((alternatives) => Object.fromEntries(Object.entries(alternatives).filter(([, name]) => norm(name) !== norm(removedName)))),
      specials: Object.fromEntries(Object.entries(plan.specials || {}).flatMap(([day, menu]) => {
        const recipes = menu.recipes.filter((name) => norm(name) !== norm(removedName));
        return recipes.length ? [[day, { ...menu, recipes }]] : [];
      })),
    });
    const nextPlans = Object.fromEntries(Object.entries(c.weekPlans).map(([start, plan]) => [start, cleanPlan(plan)]));
    const currentPlan = cleanPlan({
      choices: c.weekChoices, extraChoices: c.weekExtraChoices, starterChoices: c.weekStarterChoices,
      dessertChoices: c.weekDessertChoices, presence: c.weekPresence, alternatives: c.weekAlternatives,
      specials: c.specialMenus, skipped: c.skippedDays,
    });
    nextPlans[c.selectedWeekStart] = currentPlan;
    c.setWeekPlans(nextPlans);
    c.setCustomRecipes(nextCustom); c.setWebRecipes(nextWeb); c.setCourseRecipes(nextCourse); c.setFishRecipes(nextFish);
    c.setDeletedRecipeKeys(nextDeleted); c.setFavorites(nextFavorites);
    c.setWeekChoices(currentPlan.choices); c.setWeekExtraChoices(currentPlan.extraChoices || Array.from({ length: 7 }, () => []));
    c.setWeekStarterChoices(currentPlan.starterChoices); c.setWeekDessertChoices(currentPlan.dessertChoices);
    c.setWeekAlternatives(currentPlan.alternatives); c.setSpecialMenus(currentPlan.specials);
    c.setDetail(null); c.setEditingRecipe(false);
    await Promise.all([
      c.saveSetting("customRecipes", nextCustom), c.saveSetting("webRecipes", nextWeb),
      c.saveSetting("courseRecipes", nextCourse), c.saveSetting("fishRecipes", nextFish),
      c.saveSetting("deletedRecipeKeys", nextDeleted), c.saveSetting("favorites", nextFavorites),
      c.saveSetting("weekPlans", nextPlans),
    ]);
    c.flash(`« ${removedName} » a été supprimée de la banque`);
  }
  return { startRecipeEdit, startNewRecipe, changeRecipePhoto, saveRecipeEdit, deleteRecipeFromBank };
}
