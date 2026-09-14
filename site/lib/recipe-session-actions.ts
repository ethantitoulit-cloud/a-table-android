import type { Dispatch, SetStateAction } from "react";
import type { Recipe } from "./app-types";
import type { Hist, Item } from "./app-domain";
import { formatMeasure, quantityMeasure, recipeIngredientMeasure, sameIngredient, seasoningsForRecipe } from "./app-domain";
import { inventoryMeasure } from "./inventory-measures";
import { localDateKey, today } from "./date-utils";

type Setter<T> = Dispatch<SetStateAction<T>>;
type Context = {
  people: number; detail: Recipe | null; detailPeople: number; leftoverParts: number; temporaryIngredient: string;
  temporarySeasoning: string; substitutionIngredient: string; ingredientSubstitutions: Record<string, string>;
  omitted: string[]; items: Item[]; usedQuantities: Record<string, string>;
  setOmitted: Setter<string[]>; setOmittedSeasonings: Setter<string[]>; setTemporaryIngredient: Setter<string>;
  setTemporarySeasoning: Setter<string>; setIngredientSubstitutions: Setter<Record<string, string>>;
  setSubstitutionTarget: Setter<string | null>; setSubstitutionIngredient: Setter<string>; setEditingRecipe: Setter<boolean>;
  setGuidedStep: Setter<number | null>; setLeftoverParts: Setter<number>; setDetailPeople: Setter<number>;
  setUsedQuantities: Setter<Record<string, string>>; setDetail: Setter<Recipe | null>; setItems: Setter<Item[]>;
  setHistory: Setter<Hist[]>; setFeedbackMeal: Setter<Hist | null>; flash: (message: string) => void;
};

export function createRecipeSessionActions(c: Context) {
  function openRecipe(recipe: Recipe, portions = c.people) {
    if (recipe.simpleFood) return;
    c.setOmitted([]); c.setOmittedSeasonings([]); c.setTemporaryIngredient(""); c.setTemporarySeasoning("");
    c.setIngredientSubstitutions({}); c.setSubstitutionTarget(null); c.setSubstitutionIngredient("");
    c.setEditingRecipe(false); c.setGuidedStep(null); c.setLeftoverParts(0); c.setDetailPeople(portions);
    c.setUsedQuantities(Object.fromEntries(recipe.ingredients.map((name) => [name, formatMeasure(recipeIngredientMeasure(recipe, name, portions))])));
    c.setDetail(recipe);
  }
  function addTemporaryIngredient() {
    const name = c.temporaryIngredient.trim();
    if (!c.detail || !name || c.detail.ingredients.some((ingredient) => sameIngredient(ingredient, name))) return;
    const next = { ...c.detail, ingredients: [...c.detail.ingredients, name] }; c.setDetail(next);
    c.setUsedQuantities((values) => ({ ...values, [name]: formatMeasure(recipeIngredientMeasure(next, name, c.detailPeople + c.leftoverParts)) }));
    c.setTemporaryIngredient("");
  }
  function addTemporarySeasoning() {
    const name = c.temporarySeasoning.trim(); if (!c.detail || !name) return;
    const current = seasoningsForRecipe(c.detail);
    if (!current.some((seasoning) => sameIngredient(seasoning, name))) c.setDetail({ ...c.detail, seasonings: [...current, name] });
    c.setTemporarySeasoning("");
  }
  function replaceIngredientForThisMeal(original: string) {
    if (!c.detail) return;
    const replacement = c.substitutionIngredient.trim(); if (!replacement || sameIngredient(original, replacement)) return;
    const expected = recipeIngredientMeasure(c.detail, original, c.detailPeople + c.leftoverParts);
    c.setIngredientSubstitutions((values) => ({ ...values, [original]: replacement }));
    c.setUsedQuantities((values) => { const next = { ...values, [replacement]: values[original] || formatMeasure(expected) }; delete next[original]; return next; });
    c.setSubstitutionTarget(null); c.setSubstitutionIngredient("");
  }
  function restoreIngredient(original: string) {
    if (!c.detail) return;
    const replacement = c.ingredientSubstitutions[original], expected = recipeIngredientMeasure(c.detail, original, c.detailPeople + c.leftoverParts);
    c.setIngredientSubstitutions((values) => { const next = { ...values }; delete next[original]; return next; });
    c.setUsedQuantities((values) => {
      const next = { ...values, [original]: replacement ? values[replacement] || formatMeasure(expected) : formatMeasure(expected) };
      if (replacement) delete next[replacement]; return next;
    });
  }
  function changeDetailPeople(nextPeople: number) {
    if (!c.detail) return;
    const portions = Math.min(12, Math.max(1, nextPeople)); c.setDetailPeople(portions);
    c.setUsedQuantities(Object.fromEntries(c.detail.ingredients.map((name) => [c.ingredientSubstitutions[name] || name, formatMeasure(recipeIngredientMeasure(c.detail!, name, portions + c.leftoverParts))])));
  }
  function changeLeftoverParts(parts: number) {
    if (!c.detail) return;
    const next = Math.min(3, Math.max(0, parts)); c.setLeftoverParts(next);
    c.setUsedQuantities(Object.fromEntries(c.detail.ingredients.map((name) => [c.ingredientSubstitutions[name] || name, formatMeasure(recipeIngredientMeasure(c.detail!, name, c.detailPeople + next))])));
  }
  async function eatLeftover(item: Item) {
    const amount = inventoryMeasure(item, "unité")?.amount || 1;
    if (amount <= 1) {
      c.setItems((items) => items.filter((candidate) => candidate.id !== item.id));
      if (item.id > 0) await fetch(`/api/inventory?id=${item.id}`, { method: "DELETE" });
    } else {
      const updated = { ...item, quantity: `${amount - 1} part${amount - 1 > 1 ? "s" : ""}` };
      c.setItems((items) => items.map((candidate) => candidate.id === item.id ? updated : candidate));
      if (item.id > 0) await fetch("/api/inventory", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
    }
    c.flash("Une part de reste a été utilisée");
  }
  async function cook(recipe: Recipe) {
    const nextItems = [...c.items];
    for (const originalName of recipe.ingredients.filter((name) => !c.omitted.includes(name))) {
      const name = c.ingredientSubstitutions[originalName] || originalName;
      const expected = recipeIngredientMeasure(recipe, originalName, c.detailPeople + c.leftoverParts);
      const needed = quantityMeasure(c.usedQuantities[name] || c.usedQuantities[originalName] || "", expected.unit) || expected;
      let remaining = needed.amount;
      for (const stock of nextItems.filter((item) => sameIngredient(item.name, name))) {
        if (remaining <= 0) break;
        const available = inventoryMeasure(stock, needed.unit); if (!available) continue;
        const used = Math.min(available.amount, remaining); remaining -= used;
        const left = available.amount - used, index = nextItems.findIndex((item) => item.id === stock.id);
        if (left <= 0) {
          if (index >= 0) nextItems.splice(index, 1);
          if (stock.id > 0) fetch(`/api/inventory?id=${stock.id}`, { method: "DELETE" });
        } else {
          const updated = { ...stock, quantity: formatMeasure({ amount: left, unit: needed.unit }) };
          if (index >= 0) nextItems[index] = updated;
          if (stock.id > 0) fetch("/api/inventory", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
        }
      }
    }
    c.setItems(nextItems);
    if (c.leftoverParts > 0) {
      const expires = new Date(); expires.setDate(expires.getDate() + 3);
      const leftover: Item = { id: -Date.now(), name: `Reste de ${recipe.name}`, quantity: `${c.leftoverParts} part${c.leftoverParts > 1 ? "s" : ""}`, zone: "frigo", expires: localDateKey(expires) };
      c.setItems((items) => [leftover, ...items]);
      fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(leftover) }).then((response) => response.json()).then((data) => data.item && c.setItems((items) => items.map((item) => item.id === leftover.id ? data.item : item))).catch(() => null);
    }
    c.setDetail(null);
    const temp: Hist = { id: -Date.now() - 1, meal: recipe.name, people: c.detailPeople, eatenAt: today(), rating: 3 };
    c.setHistory((entries) => [temp, ...entries]);
    const response = await fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "meal", meal: recipe.name, people: c.detailPeople, date: today(), rating: 3 }) }).catch(() => null);
    const data = response ? await response.json().catch(() => ({})) : {};
    const saved = data.item ? { ...temp, ...data.item } : temp;
    c.setHistory((entries) => entries.map((entry) => entry.id === temp.id ? saved : entry)); c.setFeedbackMeal(saved);
    c.flash(c.omitted.length ? "Repas enregistré, sans les ingrédients retirés" : "Repas enregistré");
  }
  async function rateMeal(meal: Hist, rating: 1 | 2 | 3) {
    c.setHistory((entries) => entries.map((entry) => entry.id === meal.id ? { ...entry, rating } : entry)); c.setFeedbackMeal(null);
    if (meal.id > 0) await fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "rate-meal", id: meal.id, rating }) }).catch(() => null);
    c.flash(rating === 3 ? "À refaire : cette recette sera favorisée" : rating === 1 ? "Cette recette ne sera plus proposée automatiquement" : "Avis enregistré");
  }
  return { openRecipe, addTemporaryIngredient, addTemporarySeasoning, replaceIngredientForThisMeal, restoreIngredient, changeDetailPeople, changeLeftoverParts, eatLeftover, cook, rateMeal };
}
