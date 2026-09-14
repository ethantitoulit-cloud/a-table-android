import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { Recipe } from "./app-types";
import type { Hist, Person, SpecialMenu, WeekPlan } from "./app-domain";
import { localDateKey, mondayOf, today } from "./date-utils";

type Setter<T> = Dispatch<SetStateAction<T>>;
type SpecialBuilder = { day: number; type: "apero" | "fete"; recipes: string[] };
type Context = {
  specialBuilder: SpecialBuilder | null; specialMenus: Record<number, SpecialMenu>; profiles: Person[];
  selectedWeekStart: string; history: Hist[]; people: number; homeDate: string;
  weekPlans: Record<string, WeekPlan>; setWeekPlans: Setter<Record<string, WeekPlan>>; outsideMealPendingRef: MutableRefObject<string | null>;
  setSpecialMenus: Setter<Record<number, SpecialMenu>>; setSpecialBuilder: Setter<SpecialBuilder | null>;
  setSpecialQuery: Setter<string>; setSelectedWeekStart: Setter<string>; setWeekChoices: Setter<string[]>;
  setWeekExtraChoices: Setter<string[][]>; setWeekStarterChoices: Setter<string[]>; setWeekDessertChoices: Setter<string[]>;
  setWeekPresence: Setter<boolean[][]>; setWeekAlternatives: Setter<Record<string, string>[]>;
  setSkippedDays: Setter<Record<number, boolean>>; setWeekPicker: Setter<{ day: number; course: "entrée" | "plat" | "dessert"; addToMeal?: boolean } | null>;
  setHistory: Setter<Hist[]>; setTiredChoice: Setter<{ date: string; recipeName: string } | null>; setTiredOpen: Setter<boolean>;
  saveSetting: (key: string, value: unknown) => Promise<unknown>; flash: (message: string) => void;
};

export function createWeekHistoryActions(c: Context) {
  function saveSpecialMenu() {
    if (!c.specialBuilder || !c.specialBuilder.recipes.length) { c.flash("Choisis au moins une recette"); return; }
    const next = { ...c.specialMenus, [c.specialBuilder.day]: { type: c.specialBuilder.type, recipes: c.specialBuilder.recipes } };
    c.setSpecialMenus(next); c.setSpecialBuilder(null); c.setSpecialQuery(""); c.flash("Repas spécial enregistré");
  }
  function removeSpecialMenu(day: number) {
    const next = { ...c.specialMenus }; delete next[day]; c.setSpecialMenus(next);
  }
  function switchWeek(value: string) {
    const start = mondayOf(value), plan = c.weekPlans[start];
    c.setSelectedWeekStart(start);
    c.setWeekChoices(plan?.choices || []);
    c.setWeekExtraChoices(plan?.extraChoices || Array.from({ length: 7 }, () => []));
    c.setWeekStarterChoices(plan?.starterChoices || []); c.setWeekDessertChoices(plan?.dessertChoices || []);
    c.setWeekPresence(plan?.presence || Array.from({ length: 7 }, () => c.profiles.map((person) => person.active)));
    c.setWeekAlternatives(plan?.alternatives || Array.from({ length: 7 }, () => ({})));
    c.setSpecialMenus(plan?.specials || {}); c.setSkippedDays(plan?.skipped || {});
    c.setWeekPicker(null); c.setSpecialBuilder(null); c.setSpecialQuery(""); c.saveSetting("selectedWeekStart", start);
  }
  function setOutsideMeal(start: string, day: number, outside: boolean) {
    const current = c.weekPlans[start];
    const plan: WeekPlan = current || {
      choices: [], extraChoices: Array.from({ length: 7 }, () => []), starterChoices: [], dessertChoices: [],
      presence: Array.from({ length: 7 }, () => c.profiles.map((person) => person.active)),
      alternatives: Array.from({ length: 7 }, () => ({})), specials: {}, skipped: {},
    };
    const skipped = { ...(plan.skipped || {}), [day]: outside };
    if (!outside) delete skipped[day];
    const nextPlans = { ...c.weekPlans, [start]: { ...plan, skipped } };
    c.setWeekPlans(nextPlans);
    c.saveSetting("weekPlans", nextPlans);
    if (start === c.selectedWeekStart) c.setSkippedDays(skipped);
  }
  async function markTonightOutside() {
    const date = today(), start = mondayOf(date);
    if (c.outsideMealPendingRef.current === date || c.history.some((entry) => entry.meal === "Repas à l’extérieur / commandé" && entry.eatenAt === date)) {
      c.flash("Ce repas est déjà enregistré pour aujourd’hui"); return;
    }
    c.outsideMealPendingRef.current = date;
    const day = Math.round((new Date(`${date}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime()) / 86400000);
    setOutsideMeal(start, day, true);
    const temp: Hist = { id: -Date.now(), meal: "Repas à l’extérieur / commandé", people: c.people, eatenAt: date, rating: 0 };
    c.setHistory((entries) => entries.some((entry) => entry.meal === temp.meal && entry.eatenAt === date) ? entries : [temp, ...entries]);
    const response = await fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "meal", meal: temp.meal, people: c.people, date }) }).catch(() => null);
    const data = response ? await response.json().catch(() => ({})) : {};
    if (data.item) c.setHistory((entries) => entries.map((entry) => entry.id === temp.id ? { ...entry, ...data.item } : entry));
    c.outsideMealPendingRef.current = null; c.flash("Ce soir est retiré des repas, des courses et des réserves");
  }
  function chooseTiredRecipe(recipe: Recipe) {
    const date = c.homeDate, start = mondayOf(date);
    const day = Math.round((new Date(`${date}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime()) / 86400000);
    const previous = c.weekPlans[start], choices = [...(previous?.choices || [])]; choices[day] = recipe.name;
    const skipped = { ...(previous?.skipped || {}) }; delete skipped[day];
    const plan: WeekPlan = {
      choices, extraChoices: previous?.extraChoices || Array.from({ length: 7 }, () => []),
      starterChoices: previous?.starterChoices || [], dessertChoices: previous?.dessertChoices || [],
      presence: previous?.presence || Array.from({ length: 7 }, () => c.profiles.map((person) => person.active)),
      alternatives: previous?.alternatives || Array.from({ length: 7 }, () => ({})), specials: previous?.specials || {}, skipped,
    };
    const nextPlans = { ...c.weekPlans, [start]: plan }; c.setWeekPlans(nextPlans); c.saveSetting("weekPlans", nextPlans);
    c.setSelectedWeekStart(start); c.setWeekChoices(choices); c.setWeekExtraChoices(plan.extraChoices || Array.from({ length: 7 }, () => []));
    c.setWeekStarterChoices(plan.starterChoices); c.setWeekDessertChoices(plan.dessertChoices); c.setWeekPresence(plan.presence);
    c.setWeekAlternatives(plan.alternatives); c.setSpecialMenus(plan.specials); c.setSkippedDays(skipped); c.saveSetting("selectedWeekStart", start);
    const next = { date, recipeName: recipe.name }; c.setTiredChoice(next); c.saveSetting("tiredChoice", next); c.setTiredOpen(false);
    c.flash(`${recipe.name} est prévu pour ce soir`);
  }
  function restoreOutsideMeal(day: number) {
    const date = new Date(`${c.selectedWeekStart}T12:00:00`); date.setDate(date.getDate() + day);
    const iso = localDateKey(date); setOutsideMeal(c.selectedWeekStart, day, false);
    c.setHistory((entries) => entries.filter((entry) => !(entry.meal === "Repas à l’extérieur / commandé" && entry.eatenAt === iso)));
    fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete-meal", meal: "Repas à l’extérieur / commandé", date: iso }) }).catch(() => null);
    c.flash("Repas remis dans la semaine");
  }
  async function deleteHistoryMeal(meal: Hist) {
    const isOutside = meal.meal === "Repas à l’extérieur / commandé";
    c.setHistory((entries) => entries.filter((entry) => isOutside ? !(entry.meal === meal.meal && entry.eatenAt === meal.eatenAt) : entry.id !== meal.id));
    if (isOutside) {
      const start = mondayOf(meal.eatenAt);
      const day = Math.round((new Date(`${meal.eatenAt}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime()) / 86400000);
      setOutsideMeal(start, day, false);
    }
    await fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(isOutside ? { action: "delete-meal", meal: meal.meal, date: meal.eatenAt } : { action: "delete-meal", id: meal.id }) }).catch(() => null);
    c.flash("Repas supprimé de l’historique");
  }
  return { saveSpecialMenu, removeSpecialMenu, switchWeek, markTonightOutside, chooseTiredRecipe, restoreOutsideMeal, deleteHistoryMeal };
}
