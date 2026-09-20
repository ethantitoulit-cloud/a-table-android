"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { DESSERTS, STARTERS } from "./core-recipes";
import { inventoryMeasure, isReproducibleQuantity, packageProfileFromQuantity } from "../lib/inventory-measures";
import { auditRecipe } from "../lib/recipe-audit";
import { hasVegetableIngredient, isLightDessert, isRichCourse, isStarchyCourse, isVegetableForward, menuNutritionWarnings, proteinFamily, starchFamily, vegetableFamily } from "../lib/menu-nutrition";
import { batchPreparationFor, sundayBefore } from "../lib/batch-cooking";
import { ReceiptScanModal } from "../components/receipt-scan-modal";
import { RecipesView } from "../components/views/recipes-view";
import { InventoryView } from "../components/views/inventory-view";
import { ShoppingView } from "../components/views/shopping-view";
import { PeopleView } from "../components/views/people-view";
import { HistoryView } from "../components/views/history-view";
import { HomeView } from "../components/views/home-view";
import { InventoryItemModal, PersonModal, ShoppingItemModal } from "../components/entity-modals";
import { AppNavigation, type AppView } from "../components/app-navigation";
import { FloatingTimer, MealFeedbackModal, PurchaseScannerModal } from "../components/floating-tools";
import { expiryInfo, mondayOf, moveDate, niceDate, today } from "../lib/date-utils";
import { SpecialMenuModal, WeekPickerModal } from "../components/week-modals";
import { RecipeDetailHeader, RecipeEditor, RecipeIngredients, RecipePortions, RecipePreparation, type IngredientRow, type RecipeDraft } from "../components/recipe-detail";
import type { BatchPlan, BatchStatus } from "../components/week-organizers";
import type { WeekGridDay } from "../components/week-grid";
import { WeekView } from "../components/views/week-view";
import type { MenuCourse, Mood, Recipe } from "../lib/app-types";
import { type InventoryZone as Zone, type ReceiptScanRow as ScanRow } from "../lib/receipt-scanner";
import { BREAKFAST, DEMO, EMPTY_STARTER, NO_STARTER, SHOPPING_SECTION_ORDER, SIMPLE_FOODS, breakfastMeasure, canonicalIngredient, estimatedRecipeCost, expandedRecipeSteps, formatMeasure, hasEnoughIngredient, ingredientAvailability, ingredientMeasure, isEverydayRecipe, isMainDish, isNoCookRecipe, isRecipeConcordant, isRejectedRecipe, isValidCourseRecipe, localProductScore, norm, personKey, purchasePackMeasure, quantityMeasure, recipeIngredientAvailability, recipeIngredientMeasure, recipeMatchesMood, recipePhotoStyle, recipeThemes, sameIngredient, seasonalScore, seasoningsForRecipe, shoppingSection, stepDurationSeconds, stepMentionsIngredient, timerLabel, utensilsForRecipe } from "../lib/app-domain";
import type { Hist, Item, Measure, Person, Shop, SpecialMenu, WeekPlan } from "../lib/app-domain";
import { createRecipeImportActions } from "../lib/recipe-import-actions";
import { createPurchaseScannerActions, type PendingScannedProduct } from "../lib/purchase-scanner-actions";
import { createReceiptScanActions } from "../lib/receipt-scan-actions";
import { createRecipeBankActions } from "../lib/recipe-bank-actions";
import { createWeekMenuActions } from "../lib/week-menu-actions";
import { useInitialAppHydration } from "../lib/use-initial-app-hydration";
import { createWeekHistoryActions } from "../lib/week-history-actions";
import { createHouseholdActions } from "../lib/household-actions";
import { createInventoryActions } from "../lib/inventory-actions";
import { createShoppingActions } from "../lib/shopping-actions";
import { createRecipeSessionActions } from "../lib/recipe-session-actions";
import { useSettingsSaver } from "../lib/use-settings-saver";
import { openExternalPage } from "../lib/browser-navigation";
export default function Home() {
  const [showSplash, setShowSplash] = useState(true),
    [, setDeviceTimeMarker] = useState(() => `${Intl.DateTimeFormat().resolvedOptions().timeZone}|${today()}`),
    [view, setView] = useState<AppView>("soir"),
    [homeDate, setHomeDate] = useState(today),
    [moreOpen, setMoreOpen] = useState(false),
    [items, setItems] = useState<Item[]>(DEMO),
    [profiles, setProfiles] = useState<Person[]>([
      { id: "sylvie", name: "Sylvie", likes: "", avoid: "", hidden: "", allergies: "", diet: "", needs: "", temporary: false, active: true },
      { id: "ethan", name: "Ethan", likes: "", avoid: "lentilles, épinards", hidden: "lentilles", allergies: "", diet: "", needs: "", temporary: false, active: true },
      { id: "christophe", name: "Christophe", likes: "", avoid: "", hidden: "", allergies: "", diet: "", needs: "", temporary: false, active: true },
    ]),
    [history, setHistory] = useState<Hist[]>([]),
    [historyFilter, setHistoryFilter] = useState<"all" | "love" | "okay" | "no">("all"),
    [feedbackMeal, setFeedbackMeal] = useState<Hist | null>(null),
    [shopping, setShopping] = useState<Shop[]>([]),
    [favorites, setFavorites] = useState<string[]>([]),
    [customRecipes, setCustomRecipes] = useState<Recipe[]>([]),
    [webRecipes, setWebRecipes] = useState<Recipe[]>([]),
    [courseRecipes, setCourseRecipes] = useState<Recipe[]>([]),
    [fishRecipes, setFishRecipes] = useState<Recipe[]>([]),
    [simpleFoods, setSimpleFoods] = useState<Recipe[]>(SIMPLE_FOODS),
    [deletedRecipeKeys, setDeletedRecipeKeys] = useState<string[]>([]),
    [dataStatus, setDataStatus] = useState<"loading" | "ready" | "error">("loading"),
    [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle"),
    [people, setPeople] = useState(3),
    [mood, setMood] = useState<Mood>("tout"),
    [tiredOpen, setTiredOpen] = useState(false),
    [tiredTime, setTiredTime] = useState(30),
    [tiredNoCook, setTiredNoCook] = useState(false),
    [tiredSuggestionOffset, setTiredSuggestionOffset] = useState(0),
    [tiredChoice, setTiredChoice] = useState<{ date: string; recipeName: string } | null>(null),
    [maxTime, setMaxTime] = useState(60),
    [preferSeasonal, setPreferSeasonal] = useState(true),
    [weeklyBudget, setWeeklyBudget] = useState(90),
    [query, setQuery] = useState(""),
    [recipeQuery, setRecipeQuery] = useState(""),
    [recipeLimit, setRecipeLimit] = useState(60),
    [recipeTheme, setRecipeTheme] = useState<"toutes" | "favoris" | "local" | "rapide" | "léger" | "monde" | "original">("toutes"),
    [recipeFiltersOpen, setRecipeFiltersOpen] = useState(false),
    [recipeLink, setRecipeLink] = useState({ name: "", url: "" }),
    [recipeImportStatus, setRecipeImportStatus] = useState(""),
    [recipeImportOpen, setRecipeImportOpen] = useState(false),
    [recipeAddOpen, setRecipeAddOpen] = useState(false),
    [weekNetOpen, setWeekNetOpen] = useState(false),
    [shoppingForm, setShoppingForm] = useState({ name: "", quantity: "1" }),
    [scanUndo, setScanUndo] = useState<{ inventoryItem: Item; previousShopping: Shop | null; shoppingItem: Shop | null } | null>(null),
    [purchaseScannerOpen, setPurchaseScannerOpen] = useState(false),
    [purchaseScannerStatus, setPurchaseScannerStatus] = useState("Présente le code-barres face à la caméra"),
    [manualScannedProduct, setManualScannedProduct] = useState<{ barcode: string; name: string; quantity: string } | null>(null),
    [pendingScannedProducts, setPendingScannedProducts] = useState<PendingScannedProduct[]>([]),
    [weekChoices, setWeekChoices] = useState<string[]>([]),
    [weekExtraChoices, setWeekExtraChoices] = useState<string[][]>(Array.from({ length: 7 }, () => [])),
    [weekStarterChoices, setWeekStarterChoices] = useState<string[]>([]),
    [weekDessertChoices, setWeekDessertChoices] = useState<string[]>([]),
    [weekPicker, setWeekPicker] = useState<{ day: number; course: "entrée" | "plat" | "dessert"; addToMeal?: boolean } | null>(null),
    [weekPickerQuery, setWeekPickerQuery] = useState(""),
    [simpleFoodName, setSimpleFoodName] = useState(""),
    [specialMenus, setSpecialMenus] = useState<Record<number, SpecialMenu>>({}),
    [skippedDays, setSkippedDays] = useState<Record<number, boolean>>({}),
    [specialBuilder, setSpecialBuilder] = useState<{ day: number; type: "apero" | "fete"; recipes: string[] } | null>(null),
    [specialQuery, setSpecialQuery] = useState(""),
    [selectedWeekStart, setSelectedWeekStart] = useState(mondayOf()),
    [weekPlansHydrated, setWeekPlansHydrated] = useState(false),
    [weekPresence, setWeekPresence] = useState<boolean[][]>(
      Array.from({ length: 7 }, () => [true, true, true]),
    ),
    [weekAlternatives, setWeekAlternatives] = useState<Record<string, string>[]>(
      Array.from({ length: 7 }, () => ({})),
    ),
    [batchPlans, setBatchPlans] = useState<Record<string, BatchPlan>>({}),
    [thawStatuses, setThawStatuses] = useState<Record<string, boolean>>({}),
    [packagingProfiles, setPackagingProfiles] = useState<Record<string, string>>({}),
    [zone, setZone] = useState<Zone | "tous">("tous"),
    [detail, setDetail] = useState<Recipe | null>(null),
    [detailPeople, setDetailPeople] = useState(3),
    [leftoverParts, setLeftoverParts] = useState(0),
    [omitted, setOmitted] = useState<string[]>([]),
    [omittedSeasonings, setOmittedSeasonings] = useState<string[]>([]),
    [temporaryIngredient, setTemporaryIngredient] = useState(""),
    [temporarySeasoning, setTemporarySeasoning] = useState(""),
    [ingredientSubstitutions, setIngredientSubstitutions] = useState<Record<string, string>>({}),
    [substitutionTarget, setSubstitutionTarget] = useState<string | null>(null),
    [substitutionIngredient, setSubstitutionIngredient] = useState(""),
    [editingRecipe, setEditingRecipe] = useState(false),
    [recipeDraft, setRecipeDraft] = useState<RecipeDraft>({ name: "", time: "30", servings: "4", course: "plat", ingredients: "", steps: "", seasonings: "", themes: [] }),
    [usedQuantities, setUsedQuantities] = useState<Record<string, string>>({}),
    [guidedStep, setGuidedStep] = useState<number | null>(null),
    [timerSeconds, setTimerSeconds] = useState(300),
    [timerStartSeconds, setTimerStartSeconds] = useState(300),
    [timerRunning, setTimerRunning] = useState(false),
    [timerStarted, setTimerStarted] = useState(false),
    [timerOpen, setTimerOpen] = useState(false),
    [modal, setModal] = useState<"scan" | "item" | "shopping" | "person" | null>(null),
    [editingShop, setEditingShop] = useState<Shop | null>(null),
    [editingItem, setEditingItem] = useState<Item | null>(null),
    [personForm, setPersonForm] = useState({
      name: "",
      likes: "",
      avoid: "",
      hidden: "",
      allergies: "",
      diet: "",
      needs: "",
      temporary: true,
    }),
    [scanRows, setScanRows] = useState<ScanRow[]>([]),
    [scanImage, setScanImage] = useState<string | null>(null),
    [scanStatus, setScanStatus] = useState(""),
    [canEdit, setCanEdit] = useState<boolean | null>(null),
    [form, setForm] = useState({
      name: "",
      quantity: "1",
      zone: "garde-manger" as Zone,
      expires: "",
    }),
    [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const purchaseVideoRef = useRef<HTMLVideoElement>(null);
  const purchaseScannerControlsRef = useRef<{ stop: () => void } | null>(null);
  const purchaseScanBusyRef = useRef(false);
  const lastBarcodeRef = useRef<{ value: string; at: number } | null>(null);
  const [weekPlans, setWeekPlans] = useState<Record<string, WeekPlan>>({});
  const tempIdRef = useRef(-1);
  const outsideMealPendingRef = useRef<string | null>(null);
  const saveSetting = useSettingsSaver(setSaveStatus);
  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 1650);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedText = `${params.get("url") || ""} ${params.get("text") || ""}`;
    const sharedUrl = sharedText.match(/https?:\/\/[^\s]+/)?.[0]?.replace(/[),.;!?]+$/u, "");
    if (!sharedUrl) return;
    const timer = window.setTimeout(() => {
      const pending = window.localStorage.getItem("pending-recipe-picker");
      if (pending) {
        try {
          const picker = JSON.parse(pending) as { day: number; course: "entrée" | "plat" | "dessert"; addToMeal?: boolean };
          if (Number.isInteger(picker.day) && picker.day >= 0 && picker.day < 7) setWeekPicker(picker);
          setWeekNetOpen(true);
        } catch {
          setView("recettes");
          setRecipeImportOpen(true);
        }
      } else {
        setView("recettes");
        setRecipeImportOpen(true);
      }
      setRecipeLink({ name: params.get("title") || "", url: sharedUrl });
      setRecipeImportStatus("Recette reçue : touche le bouton d’importation.");
      window.localStorage.removeItem("pending-recipe-picker");
      window.history.replaceState({}, "", window.location.pathname);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!scanUndo) return;
    const timer = window.setTimeout(() => setScanUndo(null), 3000);
    return () => window.clearTimeout(timer);
  }, [scanUndo]);
  useEffect(() => {
    let marker = `${Intl.DateTimeFormat().resolvedOptions().timeZone}|${today()}`;
    const syncDeviceTime = () => {
      const next = `${Intl.DateTimeFormat().resolvedOptions().timeZone}|${today()}`;
      if (next !== marker) {
        marker = next;
        setDeviceTimeMarker(next);
      }
    };
    const timer = window.setInterval(syncDeviceTime, 60000);
    window.addEventListener("focus", syncDeviceTime);
    document.addEventListener("visibilitychange", syncDeviceTime);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", syncDeviceTime);
      document.removeEventListener("visibilitychange", syncDeviceTime);
    };
  }, []);
  useEffect(() => {
    fetch("/api/session").then((response) => response.json()).then((session) => setCanEdit(Boolean(session.canEdit))).catch(() => setCanEdit(false));
  }, []);
  useInitialAppHydration({
    profiles, setWeekPlans, setItems, setDataStatus, setProfiles, setPeople, setWeekPresence,
    setFavorites, setTiredChoice, setDeletedRecipeKeys, setWeekAlternatives, setWeekStarterChoices,
    setWeekDessertChoices, setWeekExtraChoices, setSpecialMenus, setCustomRecipes, setWebRecipes,
    setCourseRecipes, setFishRecipes, setRecipeImportStatus, setBatchPlans, setThawStatuses,
    setPackagingProfiles, setPreferSeasonal, setWeeklyBudget, setMood, setWeekChoices,
    setSelectedWeekStart, setSkippedDays, setWeekPlansHydrated, setHistory, setShopping,
  });
  useEffect(() => {
    const loadSimpleFoods = () => fetch("/api/simple-foods")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Aliments simples indisponibles")))
      .then((data) => {
        if (!Array.isArray(data.items) || !data.items.length) return;
        setSimpleFoods(data.items.map((item: { name: string; course: "entrée" | "plat" | "dessert"; quantityPerPerson: string; nutritionGroup: string; optionalSeasoning?: string | null }) => ({
          name: item.name,
          time: 0,
          ingredients: [item.name.toLocaleLowerCase("fr-FR")],
          ingredientQuantities: { [item.name.toLocaleLowerCase("fr-FR")]: item.quantityPerPerson },
          servings: 1,
          tags: ["leger", "sans-cuisson", ...(item.nutritionGroup === "fruit" || item.nutritionGroup === "légumes" ? ["budget" as const] : [])],
          steps: [],
          course: item.course,
          simpleFood: true,
          optionalSeasoning: item.optionalSeasoning || undefined,
        })));
      });
    fetch("/api/recipes/migrate")
      .then((response) => response.json())
      .then((status) => status.latest?.version === 1 && status.latest?.status === "completed"
        ? undefined
        : fetch("/api/recipes/migrate", { method: "POST" }).then((response) => {
            if (!response.ok) throw new Error("Migration impossible");
          }))
      .then(loadSimpleFoods)
      .catch(() => null);
  }, []);
  useEffect(() => {
    if (!weekPlansHydrated) return;
    const plan: WeekPlan = {
      choices: weekChoices, extraChoices: weekExtraChoices, starterChoices: weekStarterChoices, dessertChoices: weekDessertChoices,
      presence: weekPresence, alternatives: weekAlternatives, specials: specialMenus,
      skipped: skippedDays,
    };
    if (JSON.stringify(weekPlans[selectedWeekStart]) === JSON.stringify(plan)) return;
    const next = { ...weekPlans, [selectedWeekStart]: plan };
    const timer = window.setTimeout(() => {
      setWeekPlans(next);
      saveSetting("weekPlans", next);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [weekPlansHydrated, selectedWeekStart, weekChoices, weekExtraChoices, weekStarterChoices, weekDessertChoices, weekPresence, weekAlternatives, specialMenus, skippedDays, weekPlans, saveSetting]);
  const allRecipes = useMemo(() => {
    const combined = [
      ...customRecipes.filter((recipe) => !recipe.needsReview).filter(isRecipeConcordant).filter((recipe) => !isRejectedRecipe(recipe)),
      ...courseRecipes.filter((recipe) => isRecipeConcordant(recipe) && isValidCourseRecipe(recipe)),
      ...fishRecipes.filter((recipe) => isRecipeConcordant(recipe)),
      ...webRecipes.filter((recipe) => isRecipeConcordant(recipe)),
    ].map((recipe) => {
      const checked = auditRecipe(recipe).recipe;
      return checked.themesManuallySet ? checked : { ...checked, themes: recipeThemes(checked) };
    });
    const unique = new Map<string, Recipe>();
    combined.forEach((recipe) => {
      const key = norm(recipe.name);
      const saved = unique.get(key);
      if (!saved || recipe.courseManuallySet || !saved.courseManuallySet && recipe.custom) unique.set(key, recipe);
    });
    const deleted = new Set(deletedRecipeKeys);
    return [...unique.values()].filter((recipe) => !deleted.has(norm(recipe.name)) && !(recipe.source && deleted.has(recipe.source.trim())));
  }, [customRecipes, courseRecipes, fishRecipes, webRecipes, deletedRecipeKeys]);
  const visibleRecipes = useMemo(() => allRecipes.filter((recipe) =>
    norm(recipe.name).includes(norm(recipeQuery)) && (recipeTheme === "toutes" || (recipeTheme === "favoris" ? favorites.some((name) => norm(name) === norm(recipe.name)) : recipe.themes?.includes(recipeTheme))),
  ), [allRecipes, recipeQuery, recipeTheme, favorites]);
  const disliked = useMemo(
    () => profiles.filter((p) => p.active).flatMap((p) => p.avoid.split(",").map(norm).filter(Boolean)),
    [profiles],
  );
  const hiddenOk = useMemo(
    () =>
      profiles.filter((p) => p.active).flatMap((p) => p.hidden.split(",").map(norm).filter(Boolean)),
    [profiles],
  );
  const dietTerms = (person: Person) => {
    const value = norm(`${person.diet || ""} ${person.needs || ""}`);
    const terms: string[] = [];
    if (/vegetar/.test(value)) terms.push("boeuf", "porc", "veau", "agneau", "poulet", "dinde", "poisson", "thon", "sardine", "hareng", "maquereau", "saumon", "cabillaud", "crevette", "moule", "palourde");
    else if (/pesco|pescetar/.test(value)) terms.push("boeuf", "porc", "veau", "agneau", "poulet", "dinde");
    if (/sans porc/.test(value)) terms.push("porc", "jambon", "lard", "lardon", "bacon", "saucisse");
    if (/sans lactose/.test(value)) terms.push("lait", "creme", "fromage", "yaourt", "beurre", "mascarpone");
    if (/sans gluten/.test(value)) terms.push("ble", "farine", "pain", "pate", "semoule", "biscuit");
    return terms;
  };
  const recipeBlockedForActivePeople = (recipe: Recipe) => {
    const ingredients = recipe.ingredients.map(canonicalIngredient);
    return profiles.filter((person) => person.active).flatMap((person) => {
      const allergies = (person.allergies || "").split(",").map(canonicalIngredient).filter(Boolean);
      const avoided = (person.avoid || "").split(",").map(canonicalIngredient).filter(Boolean);
      const discreet = (person.hidden || "").split(",").map(canonicalIngredient).filter(Boolean);
      const hardTerms = [...allergies, ...dietTerms(person)];
      return ingredients.filter((ingredient) => hardTerms.some((term) => ingredient.includes(term) || term.includes(ingredient)) || avoided.some((term) => (ingredient.includes(term) || term.includes(ingredient)) && !discreet.includes(term)));
    });
  };
  const recipePreferenceScore = (recipe: Recipe) => {
    const text = norm(`${recipe.name} ${recipe.ingredients.join(" ")}`);
    return profiles.filter((person) => person.active).reduce((score, person) => score + (person.likes || "").split(",").map(norm).filter(Boolean).filter((liked) => text.includes(liked)).length * 25, 0);
  };
  const ranked = useMemo(
    () =>
      allRecipes
        .filter((recipe) => !recipe.occasional && isEverydayRecipe(recipe) && (!recipe.course || recipe.course === "plat") && isMainDish(recipe))
        .map((r) => {
          const missing = r.ingredients.filter(
            (x) => !hasEnoughIngredient(items, x, people),
          );
          const blocked = recipeBlockedForActivePeople(r);
          const recent = history.slice(0, 5).some((h) => h.meal === r.name);
          const lastMeal = history.find((h) => h.meal === r.name);
          const lastRating = lastMeal ? lastMeal.rating || 3 : 0;
          const availableCount = r.ingredients.length - missing.length;
          const coverage = r.ingredients.length
            ? availableCount / r.ingredients.length
            : 0;
          const moodMatch = recipeMatchesMood(r, mood, people);
          const score =
            coverage * 500 -
            missing.length * 90 -
            r.time / 5 -
            blocked.length * 100 -
            (recent ? 25 : 0) +
            (preferSeasonal ? seasonalScore(r) * 22 : 0) +
            localProductScore(r) * 36 +
            recipePreferenceScore(r) +
            (lastRating === 3 ? 120 : lastRating === 2 ? -25 : lastRating === 1 ? -1000 : 0) +
            (moodMatch ? 80 : -80) -
            (mood === "budget" ? estimatedRecipeCost(r, people) * 12 : 0);
          return { ...r, missing, blocked, coverage, score, moodMatch, lastRating };
        })
        .filter((r) => r.time <= maxTime && r.blocked.length === 0 && r.lastRating !== 1)
        .sort(
          (a, b) =>
            Number(b.moodMatch) - Number(a.moodMatch) ||
            a.missing.length - b.missing.length ||
            b.coverage - a.coverage ||
            b.score - a.score,
        ),
    // Both helper functions derive preferences from profiles/history already listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allRecipes, items, people, profiles, disliked, hiddenOk, history, mood, maxTime, preferSeasonal, weeklyBudget],
  );
  const diverseMains = useMemo(() => {
    const selected: typeof ranked = [];
    const usedFamilies = new Set<string>();
    for (const recipe of ranked) {
      const family = canonicalIngredient(recipe.ingredients[0] || recipe.name);
      if (!usedFamilies.has(family)) {
        selected.push(recipe);
        usedFamilies.add(family);
      }
      if (selected.length === 7) break;
    }
    for (const recipe of ranked) {
      if (selected.length === 7) break;
      if (!selected.some((item) => item.name === recipe.name)) selected.push(recipe);
    }
    return selected;
  }, [ranked]);
  const tiredSuggestionPool = useMemo(() => allRecipes
    .filter((recipe) => !recipe.course || recipe.course === "plat")
    .filter((recipe) => recipe.time <= tiredTime)
    .filter((recipe) => !tiredNoCook || isNoCookRecipe(recipe))
    .filter((recipe) => recipeBlockedForActivePeople(recipe).length === 0)
    .map((recipe) => {
      const missing = recipe.ingredients.filter((ingredient) => !hasEnoughIngredient(items, ingredient, people));
      return { recipe, missing, score: missing.length * 100 + recipe.steps.length * 5 + recipe.time - localProductScore(recipe) * 8 };
    })
    // recipeBlockedForActivePeople derives its value from profiles, included below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    .sort((a, b) => a.score - b.score), [allRecipes, tiredTime, tiredNoCook, items, people, profiles]);
  const tiredSuggestions = useMemo(() => {
    if (!tiredSuggestionPool.length) return [];
    const count = Math.min(1, tiredSuggestionPool.length);
    return Array.from({ length: count }, (_, index) => tiredSuggestionPool[(tiredSuggestionOffset + index) % tiredSuggestionPool.length]);
  }, [tiredSuggestionPool, tiredSuggestionOffset]);
  const importedStarters = useMemo(
    () => allRecipes.filter((recipe) => !recipe.occasional && recipe.course === "entrée" && isEverydayRecipe(recipe) && isValidCourseRecipe(recipe)).sort((a, b) => localProductScore(b) - localProductScore(a)),
    [allRecipes],
  );
  const importedDesserts = useMemo(
    () => allRecipes.filter((recipe) => !recipe.occasional && recipe.course === "dessert" && isEverydayRecipe(recipe) && isValidCourseRecipe(recipe)).sort((a, b) => localProductScore(b) - localProductScore(a)),
    [allRecipes],
  );
  const menuStarters = useMemo<Recipe[]>(() => {
    const combined = [...simpleFoods.filter((item) => item.course === "entrée"), ...importedStarters];
    return [...new Map(combined.map((item) => [norm(item.name), item])).values()];
  }, [simpleFoods, importedStarters]);
  const menuDesserts = useMemo<Recipe[]>(() => {
    const combined = [...simpleFoods.filter((item) => item.course === "dessert"), ...importedDesserts];
    return [...new Map(combined.map((item) => [norm(item.name), item])).values()];
  }, [simpleFoods, importedDesserts]);
  const savoryMenuChoices = useMemo<Recipe[]>(() => {
    const combined = [
      ...simpleFoods.filter((item) => item.course === "entrée" || item.course === "plat"),
      ...allRecipes.filter((item) => !item.course || item.course === "entrée" || item.course === "plat"),
    ];
    return [...new Map(combined.map((item) => [norm(item.name), item])).values()];
  }, [simpleFoods, allRecipes]);
  const filtered = items.filter(
    (i) =>
      (zone === "tous" || i.zone === zone) &&
      norm(i.name).includes(norm(query)),
  ).sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
  const expiringItems = items.filter((item) => {
    const info = expiryInfo(item.expires);
    return info && info.days <= 3;
  });
  const leftoverItems = useMemo(() => items.filter((item) => norm(item.name).startsWith("reste de ")).sort((a, b) => (a.expires || "9999").localeCompare(b.expires || "9999")), [items]);
  const week = useMemo(() => {
      const recentNames = new Set<string>();
      for (let offset = 1; offset <= 3; offset += 1) {
        const date = new Date(`${selectedWeekStart}T12:00:00`);
        date.setDate(date.getDate() - offset * 7);
        const prior = weekPlans[mondayOf(date)];
        [...(prior?.choices || []), ...(prior?.starterChoices || []), ...(prior?.dessertChoices || [])].forEach((name) => name && recentNames.add(name));
      }
      const usedMains = new Set<string>(), usedStarters = new Set<string>(), usedDesserts = new Set<string>();
      const proteinCounts = new Map<string, number>(), starchCounts = new Map<string, number>(), vegetableCounts = new Map<string, number>();
      return Array.from({ length: 7 }, (_, i) => {
        const weekSeed = Math.floor(new Date(`${selectedWeekStart}T12:00:00`).getTime() / 604800000);
        const portions = Math.max(
          1,
          profiles.filter((person, index) => person.active && weekPresence[i]?.[index] !== false).length,
        );
        const alternatives = profiles.flatMap((person, index) => {
          if (!person.active || weekPresence[i]?.[index] === false) return [];
          const recipeName = weekAlternatives[i]?.[personKey(person, index)];
          const recipe = allRecipes.find((candidate) => candidate.name === recipeName);
          return recipe ? [{ person, recipe }] : [];
        });
        const basePortions = Math.max(0, portions - alternatives.length);
        const chosen = savoryMenuChoices.find((r) => r.name === weekChoices[i]);
        const moodMains = mood === "sans-cuisson" ? ranked.filter(isNoCookRecipe) : diverseMains;
        const availableMains = moodMains.filter((recipe) => !recentNames.has(recipe.name) && !usedMains.has(recipe.name));
        const nutritionOrdered = [...availableMains].sort((a, b) => {
          const penalty = (recipe: Recipe) => (proteinCounts.get(proteinFamily(recipe)) || 0) * 8 + (starchCounts.get(starchFamily(recipe)) || 0) * 5 + (vegetableCounts.get(vegetableFamily(recipe)) || 0) * 3;
          return penalty(a) - penalty(b) || b.score - a.score;
        });
        const selected = chosen || nutritionOrdered[0] || moodMains[(i + weekSeed) % Math.max(1, moodMains.length)];
        const extraRecipes = (weekExtraChoices[i] || []).flatMap((name) => savoryMenuChoices.find((recipe) => recipe.name === name) || []);
        if (selected) usedMains.add(selected.name);
        if (selected) {
          const increment = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) || 0) + 1);
          increment(proteinCounts, proteinFamily(selected));
          increment(starchCounts, starchFamily(selected));
          increment(vegetableCounts, vegetableFamily(selected));
        }
        const r = selected
          ? {
              ...selected,
              missing: selected.ingredients.filter(
                (ingredient) => !hasEnoughIngredient(items, ingredient, portions),
              ),
            }
          : undefined;
        const starterBase: MenuCourse[] = menuStarters.length ? menuStarters : STARTERS;
        const dessertBase: MenuCourse[] = menuDesserts.length ? menuDesserts : DESSERTS;
        const noCookStarters = starterBase.filter(isNoCookRecipe);
        const noCookDesserts = dessertBase.filter(isNoCookRecipe);
        const starterPool = mood === "sans-cuisson" && noCookStarters.length ? noCookStarters : starterBase;
        const dessertPool = mood === "sans-cuisson" && noCookDesserts.length ? noCookDesserts : dessertBase;
        const chosenStarter = weekStarterChoices[i] === NO_STARTER ? EMPTY_STARTER : savoryMenuChoices.find((recipe) => recipe.name === weekStarterChoices[i]);
        const nonStarchyStarters = starterPool.filter((recipe) => !isStarchyCourse(recipe) && !isRichCourse(recipe));
        const mainNeedsVegetables = !!r && (!hasVegetableIngredient(r) || isStarchyCourse(r) || isRichCourse(r));
        const balancedStarters = mainNeedsVegetables ? nonStarchyStarters.filter(isVegetableForward) : nonStarchyStarters;
        const starterChoices = balancedStarters.length ? balancedStarters : starterPool;
        const availableStarters = starterChoices.filter((recipe) => !recentNames.has(recipe.name) && !usedStarters.has(recipe.name));
        const starter = chosenStarter || availableStarters[(i + weekSeed * 2) % Math.max(1, availableStarters.length)] || starterChoices[(i + weekSeed * 2) % starterChoices.length];
        usedStarters.add(starter.name);
        const chosenDessert = dessertPool.find((recipe) => recipe.name === weekDessertChoices[i]);
        const needsLightDessert = !!r && (isStarchyCourse(r) || isRichCourse(r) || !hasVegetableIngredient(r) || !isVegetableForward(starter));
        const balancedDesserts = needsLightDessert ? dessertPool.filter(isLightDessert) : dessertPool;
        const dessertChoices = balancedDesserts.length ? balancedDesserts : dessertPool;
        const availableDesserts = dessertChoices.filter((recipe) => !recentNames.has(recipe.name) && !usedDesserts.has(recipe.name));
        const dessert = chosenDessert || availableDesserts[(i + weekSeed * 3) % Math.max(1, availableDesserts.length)] || dessertChoices[(i + weekSeed * 3) % dessertChoices.length];
        usedDesserts.add(dessert.name);
        const d = new Date(`${selectedWeekStart}T12:00:00`);
        d.setDate(d.getDate() + i);
        const specialRecipes = (specialMenus[i]?.recipes || []).flatMap((name) => allRecipes.find((candidate) => candidate.name === name) || []);
        return {
          date: new Intl.DateTimeFormat("fr-FR", {
            weekday: "long",
            day: "numeric",
          }).format(d),
          recipe: r,
          extraRecipes,
          starter,
          dessert,
          portions,
          basePortions,
          alternatives,
          special: specialMenus[i],
          specialRecipes,
          skipped: !!skippedDays[i],
          menuMissing: skippedDays[i] ? [] : [
            ...starter.ingredients.filter((ingredient) => !recipeIngredientAvailability(items, starter as Recipe, ingredient, portions).enough),
            ...(basePortions > 0 && r ? r.ingredients.filter((ingredient) => !recipeIngredientAvailability(items, r, ingredient, basePortions).enough) : []),
            ...(basePortions > 0 ? extraRecipes.flatMap((extra) => extra.ingredients.filter((ingredient) => !recipeIngredientAvailability(items, extra, ingredient, basePortions).enough)) : []),
            ...alternatives.flatMap(({ recipe }) => recipe.ingredients.filter((ingredient) => !recipeIngredientAvailability(items, recipe, ingredient, 1).enough)),
            ...dessert.ingredients.filter((ingredient) => !recipeIngredientAvailability(items, dessert as Recipe, ingredient, portions).enough),
          ],
          nutritionWarnings: r ? menuNutritionWarnings(starter, r, dessert) : [],
        };
      });
    },
    [diverseMains, ranked, allRecipes, savoryMenuChoices, weekChoices, weekExtraChoices, weekStarterChoices, weekDessertChoices, items, profiles, weekPresence, weekAlternatives, menuStarters, menuDesserts, specialMenus, skippedDays, selectedWeekStart, mood, weekPlans],
  );
  useEffect(() => {
    if (!weekPlansHydrated || !week.length || (weekChoices.length >= 7 && weekStarterChoices.length >= 7 && weekDessertChoices.length >= 7)) return;
    const timer = window.setTimeout(() => {
      setWeekChoices(week.map((day) => day.recipe?.name || ""));
      setWeekStarterChoices(week.map((day) => day.starter.name));
      setWeekDessertChoices(week.map((day) => day.dessert.name));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [weekPlansHydrated, selectedWeekStart, week, weekChoices.length, weekStarterChoices.length, weekDessertChoices.length]);
  const weekPickerRecipes = useMemo(() => {
    if (!weekPicker) return [];
    const choices = weekPicker.course === "dessert" ? menuDesserts : savoryMenuChoices;
    return choices
      .filter((recipe) => weekPicker.course === "dessert" ? recipe.course === "dessert" : recipe.course !== "dessert" && recipe.course !== "autre")
      .filter((recipe) => norm(recipe.name).includes(norm(weekPickerQuery)))
      .sort((a, b) => mood === "budget"
        ? estimatedRecipeCost(a, week[weekPicker.day]?.portions || people) - estimatedRecipeCost(b, week[weekPicker.day]?.portions || people)
        : a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
  }, [menuDesserts, savoryMenuChoices, weekPicker, weekPickerQuery, mood, week, people]);
  const todayMenu = useMemo(() => {
    const date = homeDate;
    const start = mondayOf(date);
    const dayIndex = Math.max(0, Math.min(6, Math.round((new Date(`${date}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime()) / 86400000)));
    if (selectedWeekStart === start) {
      const day = week[dayIndex];
      if (!day?.recipe || day.skipped) return { recipes: [] as { label: string; recipe: Recipe }[], portions: people };
      return {
        recipes: [
          ...(day.starter.name === "Sans entrée" ? [] : [{ label: "Entrée", recipe: day.starter }]),
          { label: "Plat", recipe: day.recipe },
          ...day.extraRecipes.map((recipe) => ({ label: "Avec", recipe })),
          { label: "Dessert", recipe: day.dessert },
        ],
        portions: day.portions,
      };
    }
    const plan = weekPlans[start];
    if (!plan || plan.skipped?.[dayIndex]) return { recipes: [] as { label: string; recipe: Recipe }[], portions: people };
    const starter = plan.starterChoices?.[dayIndex] === NO_STARTER ? undefined : savoryMenuChoices.find((recipe) => recipe.name === plan.starterChoices?.[dayIndex]);
    const main = savoryMenuChoices.find((recipe) => recipe.name === plan.choices?.[dayIndex]);
    const extras = (plan.extraChoices?.[dayIndex] || []).flatMap((name) => savoryMenuChoices.find((recipe) => recipe.name === name) || []);
    const dessert = menuDesserts.find((recipe) => recipe.name === plan.dessertChoices?.[dayIndex]);
    const portions = Math.max(1, (plan.presence?.[dayIndex] || profiles.map((person) => person.active)).filter(Boolean).length);
    const recipes = [
      starter ? { label: "Entrée", recipe: starter } : null,
      main ? { label: "Plat", recipe: main } : null,
      ...extras.map((recipe) => ({ label: "Avec", recipe })),
      dessert ? { label: "Dessert", recipe: dessert } : null,
    ].filter((item): item is { label: string; recipe: Recipe } => item !== null);
    return { recipes, portions };
  }, [homeDate, selectedWeekStart, week, savoryMenuChoices, menuDesserts, people, profiles, weekPlans]);
  const todayMenuRecipes = todayMenu.recipes;
  const tiredChoiceRecipe = tiredChoice?.date === homeDate
    ? allRecipes.find((recipe) => recipe.name === tiredChoice.recipeName)
    : undefined;
  const displayedTodayMenuRecipes: Array<{ label: string; recipe: Recipe | MenuCourse }> = tiredChoiceRecipe
    ? [{ label: "Choix express", recipe: tiredChoiceRecipe }]
    : todayMenuRecipes;
  const weekCosts = useMemo(() => week.map(({ starter, recipe, extraRecipes, dessert, portions, specialRecipes, skipped }) =>
    skipped ? 0 : specialRecipes.length
      ? specialRecipes.reduce((sum, special) => sum + estimatedRecipeCost(special, Math.max(1, portions / 2)), 0)
      : estimatedRecipeCost(starter, portions) + (recipe ? estimatedRecipeCost(recipe, portions) : 0) + extraRecipes.reduce((sum, extra) => sum + estimatedRecipeCost(extra, portions), 0) + estimatedRecipeCost(dessert, portions),
  ), [week]);
  const estimatedWeekCost = weekCosts.reduce((sum, cost) => sum + cost, 0);
  const thawTasks = useMemo(() => week.flatMap(({ date, starter, recipe, extraRecipes, dessert, skipped }, day) => {
    if (skipped) return [];
    const ingredients = [...starter.ingredients, ...(recipe?.ingredients || []), ...extraRecipes.flatMap((extra) => extra.ingredients), ...dessert.ingredients];
    const found = new Map<string, Item>();
    ingredients.forEach((ingredient) => {
      const frozen = items.find((item) => item.zone === "congelateur" && sameIngredient(item.name, ingredient));
      const key = frozen ? canonicalIngredient(frozen.name) : "";
      const cooksFromFrozen = /(epinard|giromon|giraumon|poireau|courgette|aubergine|carotte|haricot vert|brocoli|chou fleur|petit pois|poivron|champignon|legume)/.test(key);
      if (frozen && !cooksFromFrozen) found.set(key, frozen);
    });
    return [...found.entries()].map(([key, item]) => ({
      id: `${day}-${key}`,
      day,
      date,
      item,
      timing: /(poulet|dinde|porc|boeuf|poisson|saumon|cabillaud|thon|sardine|maquereau|palourde|crevette)/.test(key)
        ? "La veille, au réfrigérateur"
        : "Le matin, au réfrigérateur",
    }));
  }), [week, items]);
  function toggleThawTask(id: string) {
    const next = { ...thawStatuses, [id]: !thawStatuses[id] };
    setThawStatuses(next);
    saveSetting("thawStatuses", next);
  }
  const breakfastNeeds = useMemo(
    () =>
      BREAKFAST.flatMap((item) => {
        const measure = breakfastMeasure(item.name, people);
        const matching = items.filter((stock) => sameIngredient(stock.name, item.name));
        const stocked = matching.reduce(
          (sum, stock) => sum + (inventoryMeasure(stock, measure.unit)?.amount || 0),
          0,
        );
        const amount = Math.max(0, measure.amount - stocked);
        return amount > 0
          ? [{ name: item.name, quantity: formatMeasure({ amount, unit: measure.unit }) }]
          : [];
      }),
    [items, people],
  );
  const combinedWeekNeeds = useMemo(() => {
    const totals = new Map<string, { name: string; measure: Measure }>();
    const add = (name: string, measure: Measure) => {
      const key = canonicalIngredient(name);
      const current = totals.get(key);
      totals.set(key, {
        name: current?.name || name,
        measure: {
          amount: (current?.measure.amount || 0) + measure.amount,
          unit: measure.unit,
        },
      });
    };
    week.forEach(({ starter, recipe, extraRecipes, dessert, portions, basePortions, alternatives, specialRecipes, skipped }) => {
      if (skipped) return;
      if (specialRecipes.length) {
        const smallPortions = Math.max(1, portions / Math.max(2, Math.ceil(specialRecipes.length / 2)));
        specialRecipes.forEach((special) => special.ingredients.forEach((name) => add(name, ingredientMeasure(name, smallPortions))));
        return;
      }
      starter.ingredients.forEach((name) => add(name, recipeIngredientMeasure(starter as Recipe, name, portions)));
      if (basePortions > 0)
        recipe?.ingredients.forEach((name) => add(name, ingredientMeasure(name, basePortions)));
      if (basePortions > 0)
        extraRecipes.forEach((extra) => extra.ingredients.forEach((name) => add(name, recipeIngredientMeasure(extra, name, basePortions))));
      alternatives.forEach(({ recipe: alternative }) =>
        alternative.ingredients.forEach((name) => add(name, ingredientMeasure(name, 1))),
      );
      dessert.ingredients.forEach((name) => add(name, recipeIngredientMeasure(dessert as Recipe, name, portions)));
    });
    BREAKFAST.forEach(({ name }) => add(name, breakfastMeasure(name, people)));
    return [...totals.values()].flatMap(({ name, measure }) => {
      const matching = items.filter((item) => sameIngredient(item.name, name));
      const uncertainStock = matching.some((item) => inventoryMeasure(item, measure.unit) === null);
      const stocked = matching.reduce(
        (sum, item) => sum + (inventoryMeasure(item, measure.unit)?.amount || 0),
        0,
      );
      const amount = Math.max(0, measure.amount - stocked);
      return amount > 0 ? [{ name, quantity: formatMeasure(purchasePackMeasure(name, { amount, unit: measure.unit })), uncertainStock }] : [];
    });
  }, [week, items, people]);
  const groupedShopping = useMemo(() => SHOPPING_SECTION_ORDER.flatMap((section) => {
    const products = shopping.filter((item) => !item.checked && shoppingSection(item.name) === section).sort((a, b) => a.name.localeCompare(b.name, "fr"));
    return products.length ? [{ section, products }] : [];
  }), [shopping]);
  const boughtShopping = useMemo(() => shopping.filter((item) => item.checked).sort((a, b) => a.name.localeCompare(b.name, "fr")), [shopping]);
  const {
    saveSpecialMenu, removeSpecialMenu, switchWeek, markTonightOutside,
    chooseTiredRecipe, restoreOutsideMeal, deleteHistoryMeal,
  // The ref is only read by returned click handlers, never while rendering.
  // eslint-disable-next-line react-hooks/refs
  } = createWeekHistoryActions({
    specialBuilder, specialMenus, profiles, selectedWeekStart, history, people, homeDate,
    weekPlans, setWeekPlans, outsideMealPendingRef, setSpecialMenus, setSpecialBuilder, setSpecialQuery,
    setSelectedWeekStart, setWeekChoices, setWeekExtraChoices, setWeekStarterChoices,
    setWeekDessertChoices, setWeekPresence, setWeekAlternatives, setSkippedDays, setWeekPicker,
    setHistory, setTiredChoice, setTiredOpen, saveSetting, flash,
  });
  const batchTasks = useMemo(() => {
    const counts = new Map<string, { name: string; days: Set<string>; recipes: Set<string> }>();
    week.forEach(({ date, starter, recipe, extraRecipes, dessert, alternatives, specialRecipes, skipped }) => {
      if (skipped) return;
      const recipes = specialRecipes.length
        ? specialRecipes
        : [starter, ...(recipe ? [recipe] : []), ...extraRecipes, dessert, ...alternatives.map(({ recipe: alternative }) => alternative)];
      recipes.forEach((sourceRecipe) => sourceRecipe.ingredients.forEach((name) => {
        const key = canonicalIngredient(name);
        const current = counts.get(key) || { name, days: new Set<string>(), recipes: new Set<string>() };
        current.days.add(date);
        current.recipes.add(sourceRecipe.name);
        counts.set(key, current);
      }));
    });
    return [...counts.entries()]
      .flatMap(([key, value]) => {
        const preparation = value.days.size >= 2 ? batchPreparationFor(key) : null;
        if (!preparation) return [];
        return {
          id: `${preparation.action === "Cuire" ? "cook" : "cut"}-${key}`,
          ingredientKey: key,
          ingredient: value.name,
          label: `${preparation.action} ${value.name}`,
          duration: preparation.duration,
          days: value.days.size,
          recipes: [...value.recipes],
          storage: preparation.storage,
        };
      })
      .sort((a, b) => b.days - a.days || a.duration - b.duration);
  }, [week]);
  const currentBatchPlan = useMemo<BatchPlan>(() => batchPlans[selectedWeekStart] || { enabled: false, sundayTime: "15:00", duration: 60, statuses: {} }, [batchPlans, selectedWeekStart]);
  const batchSunday = useMemo(() => {
    const date = new Date(`${sundayBefore(selectedWeekStart)}T12:00:00`);
    return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(date);
  }, [selectedWeekStart]);
  const visibleBatchTasks = useMemo(() => {
    return batchTasks.reduce<{ used: number; tasks: typeof batchTasks }>((result, task) => {
      if (currentBatchPlan.statuses[task.id] === "done") {
        return { ...result, tasks: [...result.tasks, task] };
      }
      if (result.used + task.duration > currentBatchPlan.duration) return result;
      return { used: result.used + task.duration, tasks: [...result.tasks, task] };
    }, { used: 0, tasks: [] }).tasks;
  }, [batchTasks, currentBatchPlan]);
  const batchDone = useMemo(() => new Set(batchTasks.filter((task) => currentBatchPlan.statuses[task.id] === "done").map((task) => task.ingredientKey)), [batchTasks, currentBatchPlan]);
  const detailSteps = useMemo(() => {
    if (!detail) return [];
    const completeSteps = expandedRecipeSteps(detail);
    const withoutOmittedIngredients = completeSteps.filter((step) =>
      !omitted.some((ingredient) => stepMentionsIngredient(step, ingredient)),
    );
    const remaining = withoutOmittedIngredients.filter((step) => {
      const normalized = norm(step);
      return !detail.ingredients.some((ingredient) =>
        batchDone.has(canonicalIngredient(ingredient)) &&
        normalized.includes(norm(ingredient)) &&
        /(laver|decoup|couper|cuire|precuire|preparer|assaisonner)/.test(normalized),
      );
    });
    return remaining;
  }, [detail, batchDone, omitted]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (timerStarted) return;
      if (guidedStep === null || !detailSteps[guidedStep]) {
        if (guidedStep !== null) setGuidedStep(null);
        setTimerRunning(false);
        setTimerStarted(false);
        setTimerOpen(false);
        return;
      }
      const seconds = stepDurationSeconds(detailSteps[guidedStep]);
      setTimerSeconds(seconds);
      setTimerStartSeconds(seconds);
      setTimerRunning(false);
      setTimerStarted(false);
      setTimerOpen(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [guidedStep, detailSteps, timerStarted]);
  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setTimerSeconds((seconds) => {
        if (seconds > 1) return seconds - 1;
        window.clearInterval(interval);
        setTimerRunning(false);
        setToast("Minuteur terminé");
        window.setTimeout(() => setToast(""), 4000);
        navigator.vibrate?.([200, 100, 200]);
        return 0;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);
  function updateBatchPlan(patch: Partial<BatchPlan>) {
    const nextPlan = { ...currentBatchPlan, ...patch };
    const next = { ...batchPlans, [selectedWeekStart]: nextPlan };
    setBatchPlans(next);
    saveSetting("batchPlans", next);
  }
  function setBatchStatus(id: string, status: BatchStatus) {
    updateBatchPlan({ statuses: { ...currentBatchPlan.statuses, [id]: status } });
  }
  function flash(s: string) {
    setToast(s);
    setTimeout(() => setToast(""), 2500);
  }
  function toggleFavorite(name: string) {
    const next = favorites.includes(name)
      ? favorites.filter((x) => x !== name)
      : [...favorites, name];
    setFavorites(next);
    saveSetting("favorites", next);
    flash(next.includes(name) ? "Ajoutée aux favoris" : "Retirée des favoris");
  }
  const { expandPackagingQuantity, addItem, openNewItem, openInventoryEditor, saveInventoryItem, removeItem } = createInventoryActions({
    form, editingItem, items, packagingProfiles, setItems, setForm, setEditingItem,
    setPackagingProfiles, setModal, saveSetting, flash,
  });
  function smartIngredientAction(name: string) {
    const stocked = items.find((item) => sameIngredient(item.name, name));
    const availability = ingredientAvailability(items, name, people);
    if (stocked && availability.enough) openInventoryEditor(stocked);
    else {
      const quantity = availability.missing
        ? formatMeasure({ amount: availability.missing, unit: availability.needed.unit })
        : formatMeasure(availability.needed);
      addMissing([name], { [name]: quantity });
    }
  }
  const { applyProfiles, updatePerson, addPerson, togglePerson, removePerson } = createHouseholdActions({
    profiles, weekPresence, personForm, setProfiles, setWeekPresence, setPeople,
    setPersonForm, setModal, saveSetting, flash,
  });
  const {
    addMissing, addShoppingItem, removeShoppingItem, checkShoppingItem, clearBoughtShopping,
    openShoppingEditor, saveShoppingItem, addWeekNeeds, shareShoppingList,
  // The temporary-ID ref is only changed inside returned user actions.
  // eslint-disable-next-line react-hooks/refs
  } = createShoppingActions({
    shopping, shoppingForm, editingShop, people, combinedWeekNeeds, groupedShopping, tempIdRef,
    setShopping, setShoppingForm, setEditingShop, setItems, setModal, flash,
  });
  const {
    startShoppingProductScan,
    closePurchaseScanner,
    handleScannedBarcode,
    saveManualScannedProduct,
    ignoreUnknownProduct,
    validateScannedProducts,
    undoScannedPurchase,
  // Scanner refs are only touched by camera callbacks and user actions.
  // eslint-disable-next-line react-hooks/refs
  } = createPurchaseScannerActions({
    shopping,
    manualScannedProduct,
    pendingScannedProducts,
    scanUndo,
    purchaseScanBusyRef,
    lastBarcodeRef,
    purchaseScannerControlsRef,
    setItems,
    setShopping,
    setManualScannedProduct,
    setPendingScannedProducts,
    setScanUndo,
    setPurchaseScannerStatus,
    setPurchaseScannerOpen,
    flash,
  });
  useEffect(() => {
    if (!purchaseScannerOpen) return;
    let cancelled = false;
    const begin = async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (cancelled || !purchaseVideoRef.current) return;
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints(
          { audio: false, video: { facingMode: { ideal: "environment" } } },
          purchaseVideoRef.current,
          (result) => {
            const barcode = result?.getText().replace(/\D/g, "");
            if (!barcode || purchaseScanBusyRef.current) return;
            const now = Date.now();
            if (lastBarcodeRef.current?.value === barcode && now - lastBarcodeRef.current.at < 1800) return;
            lastBarcodeRef.current = { value: barcode, at: now };
            void handleScannedBarcode(barcode);
          },
        );
        if (cancelled) controls.stop();
        else purchaseScannerControlsRef.current = controls;
      } catch {
        if (!cancelled) setPurchaseScannerStatus("Caméra indisponible. Autorise son accès puis réessaie.");
      }
    };
    void begin();
    return () => {
      cancelled = true;
      purchaseScannerControlsRef.current?.stop();
      purchaseScannerControlsRef.current = null;
    };
  // The scanner must restart only when its sheet opens or closes; the callback reads refs for scan state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseScannerOpen]);
  const {
    addSimpleFoodToMenu, chooseWeekCourse, removeExtraRecipe, removeSimpleFoodFromMenu, chooseNoStarter,
    toggleWeekPresence, setAlternativeMeal, refreshWeekFromStock, changeMood,
  } = createWeekMenuActions({
    weekPicker, simpleFoodName, weekChoices, weekExtraChoices, weekStarterChoices,
    weekDessertChoices, profiles, weekPresence, weekAlternatives, setSimpleFoods,
    setSimpleFoodName, setWeekChoices, setWeekExtraChoices, setWeekStarterChoices,
    setWeekDessertChoices, setWeekPicker, setWeekPickerQuery, setWeekPresence,
    setWeekAlternatives, setMood, saveSetting, flash,
  });
  const { saveWebRecipe, importWebRecipeForWeek, importCopiedRecipeForWeek } = createRecipeImportActions({
    recipeLink,
    weekPicker,
    customRecipes,
    setCustomRecipes,
    setRecipeLink,
    setRecipeImportStatus,
    setRecipeImportOpen,
    setWeekNetOpen,
    saveSetting,
    chooseWeekCourse,
    flash,
  });
  function openWebRecipeSearch() {
    if (!weekPicker || !weekPickerQuery.trim()) {
      flash("Écris d’abord le nom de la recette que tu veux chercher");
      return;
    }
    window.localStorage.setItem("pending-recipe-picker", JSON.stringify(weekPicker));
    openExternalPage(`https://www.google.com/search?q=${encodeURIComponent(`recette ${weekPickerQuery.trim()}`)}`);
  }
  const {
    openRecipe, addTemporaryIngredient, addTemporarySeasoning, replaceIngredientForThisMeal,
    restoreIngredient, changeDetailPeople, changeLeftoverParts, eatLeftover, cook, rateMeal,
  } = createRecipeSessionActions({
    people, detail, detailPeople, leftoverParts, temporaryIngredient, temporarySeasoning,
    substitutionIngredient, ingredientSubstitutions, omitted, items, usedQuantities,
    setOmitted, setOmittedSeasonings, setTemporaryIngredient, setTemporarySeasoning,
    setIngredientSubstitutions, setSubstitutionTarget, setSubstitutionIngredient,
    setEditingRecipe, setGuidedStep, setLeftoverParts, setDetailPeople, setUsedQuantities,
    setDetail, setItems, setHistory, setFeedbackMeal, flash,
  });
  const { startRecipeEdit, startNewRecipe, changeRecipePhoto, saveRecipeEdit, deleteRecipeFromBank } = createRecipeBankActions({
    detail, detailPeople, people, recipeDraft, customRecipes, webRecipes, courseRecipes, fishRecipes,
    deletedRecipeKeys, favorites, weekChoices, weekExtraChoices, weekStarterChoices, weekDessertChoices,
    weekPresence, weekAlternatives, specialMenus, skippedDays, selectedWeekStart, weekPlans, setWeekPlans,
    setDetail, setDetailPeople, setRecipeDraft, setEditingRecipe, setCustomRecipes, setWebRecipes,
    setCourseRecipes, setFishRecipes, setDeletedRecipeKeys, setFavorites, setWeekChoices,
    setWeekExtraChoices, setWeekStarterChoices, setWeekDessertChoices, setWeekAlternatives,
    setSpecialMenus, openRecipe, saveSetting, flash,
  });
  const { scanFile, closeReceiptScan, importScan } = createReceiptScanActions({
    items,
    scanRows,
    setItems,
    setScanRows,
    setScanImage,
    setScanStatus,
    setModal,
    setView: () => setView("stocks"),
    flash,
  });
  function closeOpenSheet() {
    setDetail(null);
    setModal(null);
    setFeedbackMeal(null);
    setWeekPicker(null);
    setSpecialBuilder(null);
    setEditingRecipe(false);
    setEditingShop(null);
  }
  function navigateTo(nextView: AppView) {
    closeOpenSheet();
    setView(nextView);
    setMoreOpen(false);
  }
  const detailIngredientRows: IngredientRow[] = detail && !detail.simpleFood ? detail.ingredients.map((name) => {
    const effectiveName = ingredientSubstitutions[name] || name;
    const expected = recipeIngredientMeasure(detail, name, detailPeople);
    const actual = quantityMeasure(usedQuantities[effectiveName] || usedQuantities[name] || "", expected.unit) || expected;
    const measures = items.filter((item) => sameIngredient(item.name, effectiveName)).map((item) => inventoryMeasure(item, actual.unit));
    const stocked = measures.reduce((sum, measure) => sum + (measure?.amount || 0), 0);
    const missing = Math.max(0, actual.amount - stocked);
    const uncertain = measures.some((measure) => measure === null);
    const owned = stocked >= actual.amount;
    const availability = owned ? "disponible en réserve" : uncertain ? `quantité en réserve à vérifier · besoin ${formatMeasure(actual)}` : stocked && missing ? `${formatMeasure({ amount: stocked, unit: actual.unit })} en réserve · manque ${formatMeasure({ amount: missing, unit: actual.unit })}` : `manque ${formatMeasure(actual)}`;
    return { originalName: name, effectiveName, omitted: omitted.includes(name), owned, batchReady: batchDone.has(canonicalIngredient(name)), quantity: usedQuantities[effectiveName] || usedQuantities[name] || formatMeasure(expected), availability };
  }) : [];
  const detailSeasonings = detail && !detail.simpleFood ? seasoningsForRecipe(detail).filter((name) => !omittedSeasonings.includes(name)).map((name) => ({ name, owned: hasEnoughIngredient(items, name, detailPeople) })) : [];
  return (
    <main className="app-shell">
      {showSplash && (
        <div
          className="splash splash-food"
          role="status"
          aria-label="Ouverture de À table ! — Qu’est-ce qu’on mange ?"
        >
          <div className="food-tiles">
            {Array.from({ length: 9 }, (_, i) => (
              <div className={`food-tile tile-${i + 1}`} key={i} />
            ))}
          </div>
          <div className="splash-badge">
            <span>À TABLE !</span>
            <h1>Qu’est-ce qu’on mange&nbsp;?</h1>
            <div className="splash-dots">
              <i />
              <i />
              <i />
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast">
          <Check size={17} />
          {toast}
        </div>
      )}
      {scanUndo && (
        <div className="scan-undo" role="status">
          <span><Check size={18} /><b>{scanUndo.inventoryItem.name}</b><small>{scanUndo.inventoryItem.quantity} ajouté aux réserves</small></span>
          <button onClick={undoScannedPurchase}>Annuler</button>
        </div>
      )}
      {purchaseScannerOpen && <PurchaseScannerModal
        videoRef={purchaseVideoRef}
        status={purchaseScannerStatus}
        product={manualScannedProduct}
        products={pendingScannedProducts}
        setProduct={setManualScannedProduct}
        setProducts={setPendingScannedProducts}
        close={closePurchaseScanner}
        ignore={ignoreUnknownProduct}
        save={() => void saveManualScannedProduct()}
        validate={() => void validateScannedProducts()}
      />}
      {timerStarted && <FloatingTimer
        recipeName={detail?.name}
        seconds={timerSeconds}
        initialSeconds={timerStartSeconds}
        running={timerRunning}
        open={timerOpen}
        setOpen={setTimerOpen}
        setSeconds={setTimerSeconds}
        setInitialSeconds={setTimerStartSeconds}
        setRunning={setTimerRunning}
        stop={() => { setTimerRunning(false); setTimerStarted(false); setTimerOpen(false); setTimerSeconds(timerStartSeconds); }}
      />}
      <AppNavigation
        view={view}
        canEdit={canEdit}
        saveStatus={saveStatus}
        dataStatus={dataStatus}
        moreOpen={moreOpen}
        fileRef={fileRef}
        navigate={navigateTo}
        toggleMore={() => { closeOpenSheet(); setMoreOpen((open) => !open); }}
        scanFile={(file) => void scanFile(file)}
      />
      {view === "soir" && <HomeView
        date={homeDate}
        today={today}
        niceDate={niceDate}
        moveDate={moveDate}
        setDate={setHomeDate}
        people={people}
        setPeople={setPeople}
        tiredOpen={tiredOpen}
        setTiredOpen={setTiredOpen}
        tiredTime={tiredTime}
        setTiredTime={(minutes) => { setTiredTime(minutes); setTiredSuggestionOffset(0); }}
        noCook={tiredNoCook}
        setNoCook={(value) => { setTiredNoCook(value); setTiredSuggestionOffset(0); }}
        suggestions={tiredSuggestions}
        suggestionCount={tiredSuggestionPool.length}
        nextSuggestions={() => setTiredSuggestionOffset((offset) => (offset + 1) % tiredSuggestionPool.length)}
        photoStyle={recipePhotoStyle}
        openRecipe={openRecipe}
        chooseRecipe={chooseTiredRecipe}
        leftover={leftoverItems[0]}
        viewLeftover={(item) => { setView("stocks"); setZone("frigo"); setQuery(item.name); }}
        eatLeftover={(item) => void eatLeftover(item)}
        menu={displayedTodayMenuRecipes}
        expressChoice={Boolean(tiredChoiceRecipe)}
        menuPortions={todayMenu.portions}
        allRecipes={allRecipes}
        openWeek={() => setView("semaine")}
      />}
      {view === "recettes" && <RecipesView
        query={recipeQuery}
        setQuery={setRecipeQuery}
        limit={recipeLimit}
        setLimit={setRecipeLimit}
        theme={recipeTheme}
        setTheme={setRecipeTheme}
        filtersOpen={recipeFiltersOpen}
        setFiltersOpen={setRecipeFiltersOpen}
        addOpen={recipeAddOpen}
        setAddOpen={setRecipeAddOpen}
        importOpen={recipeImportOpen}
        setImportOpen={setRecipeImportOpen}
        importStatus={recipeImportStatus}
        link={recipeLink}
        setLink={setRecipeLink}
        recipes={visibleRecipes}
        favorites={favorites}
        photoStyle={recipePhotoStyle}
        startNewRecipe={startNewRecipe}
        saveWebRecipe={() => void saveWebRecipe()}
        openRecipe={openRecipe}
        toggleFavorite={toggleFavorite}
        editRecipe={startRecipeEdit}
        deleteRecipe={(recipe) => void deleteRecipeFromBank(recipe)}
      />}
      {view === "semaine" && <WeekView
        selectedWeekStart={selectedWeekStart}
        switchWeek={switchWeek}
        mood={mood}
        changeMood={changeMood}
        maxTime={maxTime}
        setMaxTime={setMaxTime}
        refreshFromStock={refreshWeekFromStock}
        preferSeasonal={preferSeasonal}
        toggleSeasonal={() => { const next = !preferSeasonal; setPreferSeasonal(next); saveSetting("preferSeasonal", next); }}
        weeklyBudget={weeklyBudget}
        setWeeklyBudget={(value) => { setWeeklyBudget(value); saveSetting("weeklyBudget", value); }}
        people={people}
        needsCount={combinedWeekNeeds.length}
        estimatedCost={estimatedWeekCost}
        grid={{
          days: week.map((day) => ({ ...day, missingCount: new Set(day.menuMissing.map(canonicalIngredient)).size })) as WeekGridDay[],
          costs: weekCosts,
          profiles: profiles.map((person, index) => ({ key: personKey(person, index), name: person.name, active: person.active })),
          presence: weekPresence,
          alternatives: weekAlternatives,
          recipes: allRecipes,
          ranked,
          photoStyle: recipePhotoStyle,
          isSeasonal: (recipe) => seasonalScore(recipe as Recipe) > 0,
          openRecipe,
          togglePresence: toggleWeekPresence,
          setAlternative: setAlternativeMeal,
          composeSpecial: (day, type, recipes) => { setSpecialQuery(""); setSpecialBuilder({ day, type, recipes }); },
          restoreMeal: restoreOutsideMeal,
          chooseMeal: (day, addToMeal) => { setWeekPicker({ day, course: "plat", addToMeal: addToMeal || undefined }); setWeekPickerQuery(""); },
          removeExtra: removeExtraRecipe,
          removeSimpleFood: removeSimpleFoodFromMenu,
        }}
        thaw={{ tasks: thawTasks, statuses: thawStatuses, toggle: toggleThawTask }}
        batch={{ plan: currentBatchPlan, sunday: batchSunday, tasks: visibleBatchTasks, updatePlan: updateBatchPlan, setStatus: setBatchStatus }}
        breakfast={{ people, items: BREAKFAST.map((item) => ({ name: item.name, shortage: breakfastNeeds.find((need) => need.name === item.name)?.quantity })), choose: smartIngredientAction }}
        shopping={{ needs: combinedWeekNeeds, inspectStock: (name) => { setView("stocks"); setQuery(name); }, addNeed: (need) => addMissing([need.name], { [need.name]: need.quantity }), addAll: addWeekNeeds }}
      />}
      {view === "stocks" && <InventoryView
        items={filtered}
        expiringCount={expiringItems.length}
        query={query}
        zone={zone}
        setQuery={setQuery}
        setZone={setZone}
        scan={() => fileRef.current?.click()}
        addLeftover={() => openNewItem({ name: "Reste de ", zone: "frigo" })}
        addItem={() => openNewItem()}
        editItem={openInventoryEditor}
        removeItem={(id) => void removeItem(id)}
        expiryInfo={expiryInfo}
      />}
      {view === "courses" && <ShoppingView
        form={shoppingForm}
        setForm={setShoppingForm}
        items={shopping}
        groupedItems={groupedShopping}
        boughtItems={boughtShopping}
        addItem={() => void addShoppingItem()}
        editItem={openShoppingEditor}
        removeItem={(item) => void removeShoppingItem(item)}
        checkItem={(item, checked) => void checkShoppingItem(item, checked)}
        clearBought={() => void clearBoughtShopping()}
        scan={startShoppingProductScan}
        share={() => void shareShoppingList()}
      />}
      {view === "famille" && <PeopleView
        profiles={profiles}
        add={() => setModal("person")}
        update={updatePerson}
        toggle={togglePerson}
        remove={removePerson}
        save={() => applyProfiles(profiles, "Préférences enregistrées")}
      />}
      {view === "historique" && <HistoryView
        meals={history}
        filter={historyFilter}
        setFilter={setHistoryFilter}
        rate={(meal, rating) => void rateMeal(meal, rating)}
        remove={(meal) => void deleteHistoryMeal(meal)}
        markOutside={() => void markTonightOutside()}
      />}
      {detail && (
        <div className="modal-backdrop">
          <section className="scan-modal recipe-modal">
            <RecipeDetailHeader recipe={detail} favorite={favorites.includes(detail.name)} photoStyle={recipePhotoStyle(detail)} close={() => setDetail(null)} toggleFavorite={() => toggleFavorite(detail.name)}>
              {detail.simpleFood && (
              <div className="simple-food-card">
                <span><b>Quantité</b><small>{formatMeasure(recipeIngredientMeasure(detail, detail.ingredients[0], detailPeople))} pour {detailPeople} personne{detailPeople > 1 ? "s" : ""}</small></span>
                <span><b>Assaisonnement</b><small>{detail.optionalSeasoning || "Aucun nécessaire"}</small></span>
                <span><b>Disponibilité</b><small>{(() => { const availability = recipeIngredientAvailability(items, detail, detail.ingredients[0], detailPeople); return availability.enough ? "Disponible dans les réserves" : availability.stocked ? `${formatMeasure({ amount: availability.stocked, unit: availability.needed.unit })} en réserve · manque ${formatMeasure({ amount: availability.missing, unit: availability.needed.unit })}` : `À acheter : ${formatMeasure(availability.needed)}`; })()}</small></span>
              </div>
              )}
            </RecipeDetailHeader>
            {!detail.simpleFood && (!editingRecipe ? (
              <div className="recipe-bank-actions">
                <button className="recipe-edit-button" onClick={() => startRecipeEdit()}>Modifier cette recette dans la banque</button>
                <button className="recipe-delete-button" onClick={() => void deleteRecipeFromBank()}>Supprimer de la banque</button>
              </div>
            ) : (
              <RecipeEditor draft={recipeDraft} setDraft={setRecipeDraft} changePhoto={changeRecipePhoto} cancel={() => setEditingRecipe(false)} save={saveRecipeEdit} />
            ))}
            <RecipePortions
              people={detailPeople}
              changePeople={changeDetailPeople}
              leftoverParts={detail.simpleFood ? undefined : leftoverParts}
              changeLeftovers={detail.simpleFood ? undefined : changeLeftoverParts}
              utensils={detail.simpleFood ? undefined : utensilsForRecipe(detail)}
              hasBatch={detail.ingredients.some((name) => batchDone.has(canonicalIngredient(name)))}
            />
            {!detail.simpleFood && <RecipeIngredients
              ingredients={detailIngredientRows}
              seasonings={detailSeasonings}
              substitutionTarget={substitutionTarget}
              substitutionIngredient={substitutionIngredient}
              setSubstitutionIngredient={setSubstitutionIngredient}
              chooseIngredient={smartIngredientAction}
              setUsedQuantity={(name, value) => setUsedQuantities((values) => ({ ...values, [name]: value }))}
              restoreIngredient={restoreIngredient}
              startSubstitution={(name) => { setSubstitutionTarget(name); setSubstitutionIngredient(""); }}
              toggleIngredient={(name, isOmitted) => setOmitted((values) => isOmitted ? values.filter((item) => item !== name) : [...values, name])}
              confirmSubstitution={replaceIngredientForThisMeal}
              cancelSubstitution={() => { setSubstitutionTarget(null); setSubstitutionIngredient(""); }}
              temporaryIngredient={temporaryIngredient}
              setTemporaryIngredient={setTemporaryIngredient}
              addTemporaryIngredient={addTemporaryIngredient}
              removeSeasoning={(name) => setOmittedSeasonings((values) => [...values, name])}
              temporarySeasoning={temporarySeasoning}
              setTemporarySeasoning={setTemporarySeasoning}
              addTemporarySeasoning={addTemporarySeasoning}
            />}
            {!detail.simpleFood && <>
              {guidedStep === null && omitted.length > 0 && detail.steps.length > detailSteps.length && <p className="ingredient-help">Le déroulé a été adapté aux ingrédients retirés pour ce repas.</p>}
              <RecipePreparation
                steps={detailSteps}
                source={detail.source}
                guidedStep={guidedStep}
                setGuidedStep={setGuidedStep}
                timerStarted={timerStarted}
                timerStartSeconds={timerStartSeconds}
                timerSeconds={timerSeconds}
                startTimer={() => { setTimerStarted(true); setTimerRunning(true); setTimerOpen(false); }}
                changeTimer={(seconds) => { setTimerStartSeconds(seconds); setTimerSeconds(seconds); }}
                openTimer={() => setTimerOpen(true)}
                timerLabel={timerLabel}
                finish={() => cook(detail)}
              />
            </>}
            {(detail as Recipe & { missing?: string[] }).missing?.filter(
              (x) => !omitted.includes(x),
            ).length ? (
              <button
                className="outline wide"
                onClick={() =>
                  addMissing(
                    (detail as Recipe & { missing: string[] }).missing.filter(
                      (x) => !omitted.includes(x),
                    ),
                  )
                }
              >
                Ajouter ce qui manque aux courses
              </button>
            ) : null}
            {guidedStep === null && <button className="primary wide" onClick={() => cook(detail)}>
              <Check />
              Nous l’avons mangé
              {omitted.length ? " avec mes modifications" : ""}
            </button>}
          </section>
        </div>
      )}
      {feedbackMeal && <MealFeedbackModal meal={feedbackMeal} close={() => setFeedbackMeal(null)} rate={(rating) => void rateMeal(feedbackMeal, rating)} />}
      {weekPicker && <WeekPickerModal
        picker={weekPicker}
        setPicker={setWeekPicker}
        date={week[weekPicker.day]?.date}
        currentMeal={[week[weekPicker.day]?.recipe?.name, ...(week[weekPicker.day]?.extraRecipes || []).map((recipe) => recipe.name)].filter(Boolean).join(" + ")}
        query={weekPickerQuery}
        setQuery={setWeekPickerQuery}
        simpleFood={simpleFoodName}
        setSimpleFood={setSimpleFoodName}
        netOpen={weekNetOpen}
        toggleNet={() => { setWeekNetOpen((open) => !open); setRecipeImportStatus(""); }}
        importStatus={recipeImportStatus}
        link={recipeLink}
        setLink={setRecipeLink}
        recipes={weekPickerRecipes}
        photoStyle={recipePhotoStyle}
        recipeMeta={(recipe) => recipe.simpleFood ? `Aliment simple · ${formatMeasure(recipeIngredientMeasure(recipe, recipe.ingredients[0], week[weekPicker.day]?.portions || people))}` : `${recipe.time} min · ${recipe.ingredients.length} ingrédients · environ ${estimatedRecipeCost(recipe, week[weekPicker.day]?.portions || people).toFixed(0)} €`}
        close={() => { setWeekPicker(null); setWeekNetOpen(false); setRecipeImportStatus(""); }}
        addSimpleFood={() => void addSimpleFoodToMenu()}
        chooseNoStarter={chooseNoStarter}
        searchWeb={openWebRecipeSearch}
        importLink={() => void importWebRecipeForWeek()}
        chooseRecipe={chooseWeekCourse}
      />}
      {specialBuilder && <SpecialMenuModal
        builder={specialBuilder}
        setBuilder={setSpecialBuilder}
        date={week[specialBuilder.day]?.date}
        query={specialQuery}
        setQuery={setSpecialQuery}
        recipes={specialQuery.trim().length >= 2 ? allRecipes.filter((recipe) => norm(recipe.name).includes(norm(specialQuery))).filter((recipe) => recipe.course !== "dessert" || specialBuilder.type === "fete").slice(0, 80) : []}
        hasSavedMenu={Boolean(specialMenus[specialBuilder.day])}
        photoStyle={recipePhotoStyle}
        close={() => { setSpecialBuilder(null); setSpecialQuery(""); }}
        restoreNormal={() => { removeSpecialMenu(specialBuilder.day); setSpecialBuilder(null); setSpecialQuery(""); }}
        save={saveSpecialMenu}
      />}
      {modal === "item" && (() => {
        const expanded = expandPackagingQuantity(form.name, form.quantity);
        const valid = isReproducibleQuantity(expanded);
        const profile = packageProfileFromQuantity(expanded);
        const savedProfile = packagingProfiles[canonicalIngredient(form.name)];
        const help = valid ? profile ? `Mesure reconnue · conditionnement mémorisé : ${profile}` : savedProfile && !isReproducibleQuantity(form.quantity) ? `Conditionnement habituel appliqué : ${savedProfile}` : "Mesure reconnue" : "Indique g, kg, ml, L ou un nombre d’unités. Pour une boîte : ex. 1 boîte de 400 g.";
        return <InventoryItemModal form={form} setForm={setForm} editing={Boolean(editingItem)} quantityValid={valid} quantityHelp={help} close={() => setModal(null)} save={() => void (editingItem ? saveInventoryItem() : addItem())} />;
      })()}
      {modal === "shopping" && editingShop && <ShoppingItemModal item={editingShop} setItem={setEditingShop} close={() => setModal(null)} save={() => void saveShoppingItem()} />}
      {modal === "person" && <PersonModal form={personForm} setForm={setPersonForm} close={() => setModal(null)} save={() => void addPerson()} />}
      {modal === "scan" && <ReceiptScanModal
        image={scanImage}
        status={scanStatus}
        rows={scanRows}
        onRowsChange={setScanRows}
        onClose={closeReceiptScan}
        onImport={importScan}
      />}
    </main>
  );
}
