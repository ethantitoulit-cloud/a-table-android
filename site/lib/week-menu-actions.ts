import type { Dispatch, SetStateAction } from "react";
import type { Mood, Recipe } from "./app-types";
import type { Person } from "./app-domain";
import { MENU_ENGINE_VERSION, NO_STARTER, formatMeasure, ingredientMeasure, norm, personKey } from "./app-domain";

type Setter<T> = Dispatch<SetStateAction<T>>;
type Picker = { day: number; course: "entrée" | "plat" | "dessert"; addToMeal?: boolean };
type Context = {
  weekPicker: Picker | null; simpleFoodName: string; weekChoices: string[]; weekExtraChoices: string[][];
  weekStarterChoices: string[]; weekDessertChoices: string[]; profiles: Person[];
  weekPresence: boolean[][]; weekAlternatives: Record<string, string>[];
  setSimpleFoods: Setter<Recipe[]>; setSimpleFoodName: Setter<string>; setWeekChoices: Setter<string[]>;
  setWeekExtraChoices: Setter<string[][]>; setWeekStarterChoices: Setter<string[]>; setWeekDessertChoices: Setter<string[]>;
  setWeekPicker: Setter<Picker | null>; setWeekPickerQuery: Setter<string>; setWeekPresence: Setter<boolean[][]>;
  setWeekAlternatives: Setter<Record<string, string>[]>; setMood: Setter<Mood>;
  saveSetting: (key: string, value: unknown) => Promise<unknown>; flash: (message: string) => void;
};

export function createWeekMenuActions(c: Context) {
  function chooseWeekCourse(recipe: Recipe) {
    if (!c.weekPicker) return;
    const { day, course } = c.weekPicker;
    if (course === "plat") {
      if (c.weekPicker.addToMeal) {
        const next = Array.from({ length: 7 }, (_, index) => [...(c.weekExtraChoices[index] || [])]);
        if (!next[day].includes(recipe.name) && c.weekChoices[day] !== recipe.name) next[day].push(recipe.name);
        c.setWeekExtraChoices(next); c.saveSetting("weekExtraChoices", next);
      } else {
        const next = [...c.weekChoices]; next[day] = recipe.name;
        c.setWeekChoices(next); c.saveSetting("weekChoices", next);
      }
    } else if (course === "entrée") {
      const next = [...c.weekStarterChoices]; next[day] = recipe.name;
      c.setWeekStarterChoices(next); c.saveSetting("weekStarterChoices", next);
    } else {
      const next = [...c.weekDessertChoices]; next[day] = recipe.name;
      c.setWeekDessertChoices(next); c.saveSetting("weekDessertChoices", next);
    }
    c.setWeekPicker(null); c.setWeekPickerQuery("");
    c.flash(c.weekPicker.addToMeal ? `${recipe.name} ajouté au repas` : `${course.charAt(0).toUpperCase() + course.slice(1)} modifié${course === "entrée" ? "e" : ""} pour ce jour`);
  }

  async function addSimpleFoodToMenu() {
    if (!c.weekPicker || !c.simpleFoodName.trim()) return;
    const name = c.simpleFoodName.trim(), ingredient = name.toLocaleLowerCase("fr-FR");
    const quantityPerPerson = formatMeasure(ingredientMeasure(ingredient, 1));
    const item: Recipe = { name, time: 0, ingredients: [ingredient], ingredientQuantities: { [ingredient]: quantityPerPerson }, servings: 1, tags: ["sans-cuisson"], steps: [], course: c.weekPicker.course, simpleFood: true };
    const response = await fetch("/api/simple-foods", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, course: c.weekPicker.course, quantityPerPerson }) }).catch(() => null);
    if (!response?.ok) { c.flash("Impossible d’ajouter cet aliment"); return; }
    c.setSimpleFoods((foods) => [...foods.filter((food) => !(norm(food.name) === norm(name) && food.course === c.weekPicker?.course)), item]);
    c.setSimpleFoodName(""); chooseWeekCourse(item);
  }

  function removeExtraRecipe(day: number, recipeName: string) {
    const next = Array.from({ length: 7 }, (_, index) => [...(c.weekExtraChoices[index] || [])]);
    next[day] = next[day].filter((name) => name !== recipeName);
    c.setWeekExtraChoices(next); c.saveSetting("weekExtraChoices", next); c.flash(`${recipeName} retiré du repas`);
  }
  function removeSimpleFoodFromMenu(day: number, course: "entrée" | "plat" | "dessert", name: string) {
    if (course === "entrée") {
      const next = [...c.weekStarterChoices]; next[day] = NO_STARTER;
      c.setWeekStarterChoices(next); c.saveSetting("weekStarterChoices", next);
    } else if (course === "dessert") {
      const next = [...c.weekDessertChoices]; next[day] = "";
      c.setWeekDessertChoices(next); c.saveSetting("weekDessertChoices", next);
    } else {
      const next = [...c.weekChoices]; next[day] = "";
      c.setWeekChoices(next); c.saveSetting("weekChoices", next);
    }
    c.flash(`${name} retiré du repas`);
  }
  function chooseNoStarter() {
    if (!c.weekPicker) return;
    const next = [...c.weekStarterChoices]; next[c.weekPicker.day] = NO_STARTER;
    c.setWeekStarterChoices(next); c.saveSetting("weekStarterChoices", next);
    c.setWeekPicker(null); c.setWeekPickerQuery(""); c.flash("Repas prévu sans entrée");
  }
  function toggleWeekPresence(day: number, personIndex: number) {
    const next = Array.from({ length: 7 }, (_, index) => c.profiles.map((person, profileIndex) => typeof c.weekPresence[index]?.[profileIndex] === "boolean" ? c.weekPresence[index][profileIndex] : person.active));
    next[day][personIndex] = !next[day][personIndex];
    if (!next[day].some((present, index) => present && c.profiles[index]?.active)) { c.flash("Il faut au moins une personne pour ce repas"); return; }
    c.setWeekPresence(next); c.saveSetting("weekPresence", next);
  }
  function setAlternativeMeal(day: number, personIndex: number, recipeName: string) {
    const next = Array.from({ length: 7 }, (_, index) => ({ ...(c.weekAlternatives[index] || {}) }));
    const key = personKey(c.profiles[personIndex], personIndex);
    if (recipeName) next[day][key] = recipeName; else delete next[day][key];
    c.setWeekAlternatives(next); c.saveSetting("weekAlternatives", next);
    c.flash(recipeName ? `Plat différent prévu pour ${c.profiles[personIndex].name}` : "Plat commun rétabli");
  }
  function refreshWeekFromStock() {
    const extras = Array.from({ length: 7 }, () => [] as string[]);
    c.setWeekChoices([]); c.setWeekExtraChoices(extras); c.setWeekStarterChoices([]); c.setWeekDessertChoices([]);
    c.saveSetting("weekChoices", []); c.saveSetting("weekExtraChoices", extras);
    c.saveSetting("weekStarterChoices", []); c.saveSetting("weekDessertChoices", []);
    c.saveSetting("menuEngineVersion", MENU_ENGINE_VERSION); c.flash("Menu recalculé avec tes réserves");
  }
  function changeMood(nextMood: Mood) {
    c.setMood(nextMood); c.setWeekChoices([]); c.setWeekExtraChoices(Array.from({ length: 7 }, () => []));
    c.setWeekStarterChoices([]); c.setWeekDessertChoices([]); c.saveSetting("mood", nextMood);
    c.flash(`Menu de cette semaine recalculé : ${{ tout: "équilibré", rapide: "rapide", leger: "léger", reconfort: "réconfortant", budget: "petit budget", "sans-cuisson": "sans cuisson" }[nextMood]}`);
  }
  return { addSimpleFoodToMenu, chooseWeekCourse, removeExtraRecipe, removeSimpleFoodFromMenu, chooseNoStarter, toggleWeekPresence, setAlternativeMeal, refreshWeekFromStock, changeMood };
}
