import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { Mood, Recipe } from "./app-types";
import type { Hist, Item, Person, Shop, SpecialMenu, WeekPlan } from "./app-domain";
import { CURATED_BANK_VERSION, LOCAL_RECIPE_MIGRATION_VERSION, MENU_ENGINE_VERSION, MY_RECIPE_BOX_MIGRATION_VERSION, RECIPE_AUDIT_VERSION, SHOPPING_RESET_VERSION, TATIE_MARYSE_MIGRATION_VERSION, WEB_RECIPE_MIGRATION_VERSION, buildCuratedBank, isOtherPreparationName, isValidCourseRecipe, norm, sanitizeImportedRecipe } from "./app-domain";
import { auditRecipeCollection } from "./recipe-audit";
import { automaticRecipeNutritionAudit } from "./menu-nutrition";
import { mondayOf } from "./date-utils";
import type { BatchPlan } from "../components/week-organizers";
import { migrateCourseCatalogs as runCourseCatalogMigration, migrateFishCatalog as runFishCatalogMigration, migrateLocalCatalog as runLocalCatalogMigration, migrateMyRecipeBox as runMyRecipeBoxMigration, migrateTatieMaryseCatalog as runTatieMaryseMigration, migrateWebCatalog as runWebCatalogMigration } from "./recipe-migrations";

type Setter<T> = Dispatch<SetStateAction<T>>;
type Context = {
  profiles: Person[]; setWeekPlans: Setter<Record<string, WeekPlan>>;
  setItems: Setter<Item[]>; setDataStatus: Setter<"loading" | "ready" | "error">; setProfiles: Setter<Person[]>; setPeople: Setter<number>;
  setWeekPresence: Setter<boolean[][]>; setFavorites: Setter<string[]>; setTiredChoice: Setter<{ date: string; recipeName: string } | null>;
  setDeletedRecipeKeys: Setter<string[]>; setWeekAlternatives: Setter<Record<string, string>[]>; setWeekStarterChoices: Setter<string[]>;
  setWeekDessertChoices: Setter<string[]>; setWeekExtraChoices: Setter<string[][]>; setSpecialMenus: Setter<Record<number, SpecialMenu>>;
  setCustomRecipes: Setter<Recipe[]>; setWebRecipes: Setter<Recipe[]>; setCourseRecipes: Setter<Recipe[]>; setFishRecipes: Setter<Recipe[]>;
  setRecipeImportStatus: Setter<string>; setBatchPlans: Setter<Record<string, BatchPlan>>; setThawStatuses: Setter<Record<string, boolean>>;
  setPackagingProfiles: Setter<Record<string, string>>; setPreferSeasonal: Setter<boolean>; setWeeklyBudget: Setter<number>; setMood: Setter<Mood>;
  setWeekChoices: Setter<string[]>; setSelectedWeekStart: Setter<string>; setSkippedDays: Setter<Record<number, boolean>>;
  setWeekPlansHydrated: Setter<boolean>; setHistory: Setter<Hist[]>; setShopping: Setter<Shop[]>;
};

export function useInitialAppHydration(c: Context) {
  const { profiles, setWeekPlans, setItems, setDataStatus, setProfiles, setPeople, setWeekPresence, setFavorites, setTiredChoice, setDeletedRecipeKeys, setWeekAlternatives, setWeekStarterChoices, setWeekDessertChoices, setWeekExtraChoices, setSpecialMenus, setCustomRecipes, setWebRecipes, setCourseRecipes, setFishRecipes, setRecipeImportStatus, setBatchPlans, setThawStatuses, setPackagingProfiles, setPreferSeasonal, setWeeklyBudget, setMood, setWeekChoices, setSelectedWeekStart, setSkippedDays, setWeekPlansHydrated, setHistory, setShopping } = c;
  const saveSetting = async (key: string, value: unknown) => {
    const response = await fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "setting", key, value }) }).catch(() => null);
    return Boolean(response?.ok);
  };
  const migrateMyRecipeBox = (existing: Recipe[]) => runMyRecipeBoxMigration(existing, setCustomRecipes, saveSetting);
  const migrateWebCatalog = (existing: Recipe[]) => runWebCatalogMigration(existing, setWebRecipes);
  const migrateLocalCatalog = (existing: Recipe[]) => runLocalCatalogMigration(existing, setWebRecipes, saveSetting);
  const migrateTatieMaryseCatalog = (existing: Recipe[]) => runTatieMaryseMigration(existing, setWebRecipes, setRecipeImportStatus, saveSetting);
  const migrateCourseCatalogs = (existing: Recipe[]) => runCourseCatalogMigration(existing, setCourseRecipes);
  const migrateFishCatalog = (existing: Recipe[]) => runFishCatalogMigration(existing, setFishRecipes);
  useEffect(() => {
    Promise.all([
      fetch("/api/inventory").then((r) => r.json()),
      fetch("/api/state").then((r) => r.json()),
    ])
      .then(async ([a, b]) => {
        if (a.unavailable || b.unavailable || !Array.isArray(a.items) || !b.settings) throw new Error("Données indisponibles");
        const rebuildingBank = b.settings?.curatedBankVersion !== CURATED_BANK_VERSION;
        setItems(a.items);
        if (b.settings?.profiles) {
          const loaded: Person[] = b.settings.profiles.map(
            (p: Partial<Person>, index: number) => ({
              id: p.id || `person-${index}`,
              name: p.name || "Personne",
              likes: p.likes || "",
              avoid: p.avoid || "",
              hidden: p.hidden || "",
              allergies: p.allergies || "",
              diet: p.diet || "",
              needs: p.needs || "",
              temporary: p.temporary || false,
              active: p.active !== false,
            }),
          );
          setProfiles(loaded);
          setPeople(Math.max(1, loaded.filter((p) => p.active).length));
          if (Array.isArray(b.settings?.weekPresence)) {
            setWeekPresence(
              Array.from({ length: 7 }, (_, day) =>
                loaded.map((person, index) =>
                  typeof b.settings.weekPresence?.[day]?.[index] === "boolean"
                    ? b.settings.weekPresence[day][index]
                    : person.active,
                ),
              ),
            );
          } else {
            setWeekPresence(
              Array.from({ length: 7 }, () => loaded.map((person) => person.active)),
            );
          }
        }
        if (b.settings?.favorites) setFavorites(b.settings.favorites);
        if (b.settings?.tiredChoice && typeof b.settings.tiredChoice.date === "string" && typeof b.settings.tiredChoice.recipeName === "string")
          setTiredChoice(b.settings.tiredChoice);
        if (Array.isArray(b.settings?.deletedRecipeKeys)) setDeletedRecipeKeys(b.settings.deletedRecipeKeys);
        if (Array.isArray(b.settings?.weekAlternatives))
          setWeekAlternatives(Array.from({ length: 7 }, (_, day) => b.settings.weekAlternatives[day] || {}));
        if (Array.isArray(b.settings?.weekStarterChoices)) setWeekStarterChoices(b.settings.weekStarterChoices);
        if (Array.isArray(b.settings?.weekDessertChoices)) setWeekDessertChoices(b.settings.weekDessertChoices);
        if (Array.isArray(b.settings?.weekExtraChoices)) setWeekExtraChoices(Array.from({ length: 7 }, (_, day) => b.settings.weekExtraChoices[day] || []));
        if (b.settings?.specialMenus) setSpecialMenus(b.settings.specialMenus);
        const rawCustomRecipes = Array.isArray(b.settings?.customRecipes) ? b.settings.customRecipes as Recipe[] : [];
        const customAudit = auditRecipeCollection(rawCustomRecipes);
        const cleanedCustomRecipes = customAudit.accepted;
        setCustomRecipes(cleanedCustomRecipes);
        if (!rebuildingBank && b.settings?.myRecipeBoxMigrationVersion !== MY_RECIPE_BOX_MIGRATION_VERSION)
          migrateMyRecipeBox(cleanedCustomRecipes);
        const rawWebRecipes = Array.isArray(b.settings?.webRecipes) ? b.settings.webRecipes as Recipe[] : [];
        const webAudit = auditRecipeCollection(rawWebRecipes);
        const savedWebRecipes = webAudit.accepted;
        setWebRecipes(savedWebRecipes);
        if (!rebuildingBank && b.settings?.webRecipeMigrationVersion !== WEB_RECIPE_MIGRATION_VERSION)
          migrateWebCatalog(savedWebRecipes).then((next) => migrateLocalCatalog(next)).then((next) => migrateTatieMaryseCatalog(next));
        else if (!rebuildingBank && b.settings?.localRecipeMigrationVersion !== LOCAL_RECIPE_MIGRATION_VERSION)
          migrateLocalCatalog(savedWebRecipes).then((next) => migrateTatieMaryseCatalog(next));
        else if (!rebuildingBank && b.settings?.tatieMaryseMigrationVersion !== TATIE_MARYSE_MIGRATION_VERSION)
          migrateTatieMaryseCatalog(savedWebRecipes);
        const rawCourseRecipes = Array.isArray(b.settings?.courseRecipes) ? b.settings.courseRecipes as Recipe[] : [];
        const courseAudit = auditRecipeCollection(rawCourseRecipes);
        const savedCourseRecipes = courseAudit.accepted;
        setCourseRecipes(savedCourseRecipes);
        const entryCount = savedCourseRecipes.filter((recipe: Recipe) => recipe.course === "entrée" && isValidCourseRecipe(recipe)).length;
        const dessertCount = savedCourseRecipes.filter((recipe: Recipe) => recipe.course === "dessert" && isValidCourseRecipe(recipe)).length;
        if (!rebuildingBank && (entryCount < 125 || dessertCount < 125)) migrateCourseCatalogs(savedCourseRecipes);
        const rawFishRecipes = Array.isArray(b.settings?.fishRecipes) ? b.settings.fishRecipes as Recipe[] : [];
        const fishAudit = auditRecipeCollection(rawFishRecipes);
        const savedFishRecipes = fishAudit.accepted;
        setFishRecipes(savedFishRecipes);
        const fishCount = savedFishRecipes.filter((recipe: Recipe) => recipe.collection === "poisson").length;
        if (!rebuildingBank && fishCount < 100) migrateFishCatalog(savedFishRecipes);
        const audits = [customAudit, webAudit, courseAudit, fishAudit];
        const rejectedCount = audits.reduce((total, audit) => total + audit.rejected.length, 0);
        const acceptedRecipes = [...cleanedCustomRecipes, ...savedWebRecipes, ...savedCourseRecipes, ...savedFishRecipes];
        const uniqueAcceptedRecipes = [...new Map(acceptedRecipes.map((recipe) => [norm(recipe.name), recipe])).values()];
        const crossCollectionDuplicates = acceptedRecipes.length - uniqueAcceptedRecipes.length;
        const duplicateCount = audits.reduce((total, audit) => total + audit.duplicates, 0) + crossCollectionDuplicates;
        const correctedCount = audits.reduce((total, audit) => total + audit.corrected, 0);
        const checkedCount = rawCustomRecipes.length + rawWebRecipes.length + rawCourseRecipes.length + rawFishRecipes.length;
        const acceptedCount = uniqueAcceptedRecipes.length;
        const nutritionExcluded = uniqueAcceptedRecipes.filter((recipe) => !automaticRecipeNutritionAudit(recipe).eligible).length;
        const categories = uniqueAcceptedRecipes.reduce((counts, recipe) => {
          const category = recipe.course || "plat";
          counts[category] += 1;
          return counts;
        }, { "entrée": 0, plat: 0, dessert: 0, autre: 0 });
        const auditExamples = audits.flatMap((audit) => audit.rejected.map(({ recipe, reasons }) => `${recipe.name} — ${reasons.join(", ")}`)).slice(0, 8);
        const removedFalseIngredients = [...rawCustomRecipes, ...rawWebRecipes, ...rawCourseRecipes, ...rawFishRecipes].reduce((count, recipe) => count + Math.max(0, recipe.ingredients.length - sanitizeImportedRecipe(recipe).ingredients.length), 0);
        const reclassifiedCount = [...rawCustomRecipes, ...rawWebRecipes, ...rawCourseRecipes, ...rawFishRecipes].filter((recipe) => recipe.course === "plat" && /(rillettes?|tartinade|dip|bouchees?)/.test(norm(recipe.name))).length;
        const otherReclassifiedCount = [...rawCustomRecipes, ...rawWebRecipes, ...rawCourseRecipes, ...rawFishRecipes].filter((recipe) => recipe.course !== "autre" && isOtherPreparationName(recipe.name)).length;
        if (!rebuildingBank && (b.settings?.recipeAuditVersion !== RECIPE_AUDIT_VERSION || rejectedCount > 0 || duplicateCount > 0 || correctedCount > 0 || removedFalseIngredients > 0 || reclassifiedCount > 0 || otherReclassifiedCount > 0)) {
          Promise.all([
            fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "setting", key: "customRecipes", value: cleanedCustomRecipes }) }),
            fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "setting", key: "webRecipes", value: savedWebRecipes }) }),
            fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "setting", key: "courseRecipes", value: savedCourseRecipes }) }),
            fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "setting", key: "fishRecipes", value: savedFishRecipes }) }),
            fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "setting", key: "recipeAuditVersion", value: RECIPE_AUDIT_VERSION }) }),
            fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "setting", key: "recipeAuditReport", value: { checked: checkedCount, accepted: acceptedCount, rejected: rejectedCount, corrected: correctedCount, duplicates: duplicateCount, nutritionExcluded, categories, examples: auditExamples, auditedAt: new Date().toISOString() } }) }),
          ]).catch(() => null);
        }
        if (rebuildingBank) {
          const curatedBank = buildCuratedBank(uniqueAcceptedRecipes);
          if (curatedBank.length !== 300) {
            setRecipeImportStatus(`La nouvelle banque est en préparation : ${curatedBank.length}/300 recettes validées.`);
          } else {
          const curatedMains = curatedBank.filter((recipe) => (recipe.course || "plat") === "plat");
          const curatedCourses = curatedBank.filter((recipe) => recipe.course === "entrée" || recipe.course === "dessert");
          const curatedOthers = curatedBank.filter((recipe) => recipe.course === "autre");
          const writes = await Promise.all([
            ["customRecipes", curatedOthers], ["webRecipes", curatedMains], ["courseRecipes", curatedCourses], ["fishRecipes", []],
            ["curatedBankVersion", CURATED_BANK_VERSION],
          ].map(([key, value]) => fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "setting", key, value }) })));
          if (writes.some((response) => !response.ok)) {
            setRecipeImportStatus("La nouvelle banque n’a pas encore pu être enregistrée. L’ancienne reste disponible.");
          } else {
          setCustomRecipes(curatedOthers);
          setCourseRecipes(curatedCourses);
          setFishRecipes([]);
          setWebRecipes(curatedMains);
          }
          }
        }
        if (b.settings?.batchPlans && typeof b.settings.batchPlans === "object") {
          setBatchPlans(b.settings.batchPlans);
        } else if (b.settings?.batchTime || b.settings?.batchStatuses) {
          const batchStart = typeof b.settings?.selectedWeekStart === "string" ? mondayOf(b.settings.selectedWeekStart) : mondayOf();
          setBatchPlans({
            [batchStart]: {
              enabled: false,
              sundayTime: "15:00",
              duration: Number(b.settings?.batchTime) || 60,
              statuses: b.settings?.batchStatuses || {},
            },
          });
        }
        if (b.settings?.thawStatuses) setThawStatuses(b.settings.thawStatuses);
        if (b.settings?.packagingProfiles) setPackagingProfiles(b.settings.packagingProfiles);
        if (typeof b.settings?.preferSeasonal === "boolean") setPreferSeasonal(b.settings.preferSeasonal);
        if (b.settings?.weeklyBudget) setWeeklyBudget(Number(b.settings.weeklyBudget));
        if (["tout", "rapide", "leger", "reconfort", "budget", "sans-cuisson"].includes(b.settings?.mood)) setMood(b.settings.mood as Mood);
        if (
          b.settings?.menuEngineVersion === MENU_ENGINE_VERSION &&
          b.settings?.weekChoices
        ) {
          setWeekChoices(b.settings.weekChoices);
        } else {
          setWeekChoices([]);
          fetch("/api/state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "setting",
              key: "menuEngineVersion",
              value: MENU_ENGINE_VERSION,
            }),
          }).catch(() => null);
        }
        const loadedProfiles: Person[] = b.settings?.profiles
          ? b.settings.profiles.map((p: Partial<Person>, index: number) => ({
              id: p.id || `person-${index}`, name: p.name || "Personne", likes: p.likes || "", avoid: p.avoid || "",
              hidden: p.hidden || "", allergies: p.allergies || "", diet: p.diet || "", needs: p.needs || "", temporary: p.temporary || false, active: p.active !== false,
            }))
          : profiles;
        const start = typeof b.settings?.selectedWeekStart === "string" ? mondayOf(b.settings.selectedWeekStart) : mondayOf();
        const storedPlans = b.settings?.weekPlans && typeof b.settings.weekPlans === "object" ? b.settings.weekPlans as Record<string, WeekPlan> : {};
        const fallbackPresence = Array.from({ length: 7 }, (_, day) => loadedProfiles.map((person, index) =>
          typeof b.settings?.weekPresence?.[day]?.[index] === "boolean" ? b.settings.weekPresence[day][index] : person.active));
        const legacyPlan: WeekPlan = {
          choices: Array.isArray(b.settings?.weekChoices) ? b.settings.weekChoices : [],
          extraChoices: Array.isArray(b.settings?.weekExtraChoices) ? b.settings.weekExtraChoices : Array.from({ length: 7 }, () => []),
          starterChoices: Array.isArray(b.settings?.weekStarterChoices) ? b.settings.weekStarterChoices : [],
          dessertChoices: Array.isArray(b.settings?.weekDessertChoices) ? b.settings.weekDessertChoices : [],
          presence: fallbackPresence,
          alternatives: Array.from({ length: 7 }, (_, day) => b.settings?.weekAlternatives?.[day] || {}),
          specials: b.settings?.specialMenus || {},
          skipped: {},
        };
        const plan = storedPlans[start] || legacyPlan;
        setWeekPlans({ ...storedPlans, [start]: plan });
        setSelectedWeekStart(start);
        setWeekChoices(plan.choices || []);
        setWeekExtraChoices(plan.extraChoices || Array.from({ length: 7 }, () => []));
        setWeekStarterChoices(plan.starterChoices || []);
        setWeekDessertChoices(plan.dessertChoices || []);
        setWeekPresence(plan.presence || fallbackPresence);
        setWeekAlternatives(plan.alternatives || Array.from({ length: 7 }, () => ({})));
        setSpecialMenus(plan.specials || {});
        setSkippedDays(plan.skipped || {});
        setWeekPlansHydrated(true);
        if (b.history) {
          const outsideDates = new Set<string>();
          setHistory(b.history.filter((entry: Hist) => {
            if (entry.meal !== "Repas à l’extérieur / commandé") return true;
            if (outsideDates.has(entry.eatenAt)) return false;
            outsideDates.add(entry.eatenAt);
            return true;
          }));
        }
        if (b.settings?.shoppingResetVersion !== SHOPPING_RESET_VERSION) {
          const resetResponse = await fetch("/api/state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "reset-shopping" }),
          }).catch(() => null);
          if (resetResponse?.ok) {
            setShopping([]);
            await fetch("/api/state", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "setting", key: "shoppingResetVersion", value: SHOPPING_RESET_VERSION }),
            }).catch(() => null);
          } else if (Array.isArray(b.shopping)) setShopping(b.shopping);
        } else if (Array.isArray(b.shopping)) setShopping(b.shopping);
        setDataStatus("ready");
      })
      .catch(() => setDataStatus("error"));
  // Initial hydration and one-time data migrations deliberately run once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
