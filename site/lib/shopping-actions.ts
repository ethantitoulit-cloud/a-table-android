import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { Item, Shop } from "./app-domain";
import { canonicalIngredient, formatMeasure, ingredientMeasure, norm } from "./app-domain";

type Setter<T> = Dispatch<SetStateAction<T>>;
type Context = {
  shopping: Shop[]; shoppingForm: { name: string; quantity: string }; editingShop: Shop | null; people: number;
  combinedWeekNeeds: Array<{ name: string; quantity: string }>;
  groupedShopping: Array<{ section: string; products: Shop[] }>; tempIdRef: MutableRefObject<number>;
  setShopping: Setter<Shop[]>; setShoppingForm: Setter<{ name: string; quantity: string }>;
  setEditingShop: Setter<Shop | null>; setItems: Setter<Item[]>;
  setModal: Setter<"scan" | "item" | "shopping" | "person" | null>; flash: (message: string) => void;
};

export function createShoppingActions(c: Context) {
  async function addMissing(names: string[], quantities: Record<string, string> = {}) {
    for (const name of names) {
      if (c.shopping.some((item) => norm(item.name) === norm(name))) continue;
      const quantity = quantities[name] || formatMeasure(ingredientMeasure(name, c.people));
      const temp: Shop = { id: c.tempIdRef.current--, name, quantity, checked: false, pending: true };
      c.setShopping((items) => [...items, temp]);
      const response = await fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "shopping", name, quantity }) }).catch(() => null);
      if (response?.ok) {
        const data = await response.json(); c.setShopping((items) => items.map((item) => item.id === temp.id ? { ...data.item, pending: false } : item));
      } else {
        c.setShopping((items) => items.filter((item) => item.id !== temp.id)); c.flash(`${name} n’a pas pu être ajouté`);
      }
    }
    c.flash("Ajouté à la liste de courses");
  }
  async function addShoppingItem() {
    const name = c.shoppingForm.name.trim(); if (!name) return;
    const quantity = c.shoppingForm.quantity.trim() || "1";
    const temp: Shop = { id: -Date.now(), name, quantity, checked: false, pending: true };
    c.setShopping((items) => [...items, temp]); c.setShoppingForm({ name: "", quantity: "1" });
    const response = await fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "shopping", name, quantity }) }).catch(() => null);
    if (response?.ok) {
      const data = await response.json(); c.setShopping((items) => items.map((item) => item.id === temp.id ? { ...data.item, pending: false } : item));
    } else {
      c.setShopping((items) => items.filter((item) => item.id !== temp.id)); c.flash(`${name} n’a pas pu être ajouté`); return;
    }
    c.flash(`${name} ajouté aux courses`);
  }
  async function removeShoppingItem(item: Shop) {
    const previous = c.shopping; c.setShopping((items) => items.filter((saved) => saved.id !== item.id));
    if (item.id > 0) {
      const response = await fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete-shopping", id: item.id }) }).catch(() => null);
      if (!response?.ok) { c.setShopping(previous); c.flash("Suppression impossible — l’article a été remis"); return; }
    }
    c.flash(`${item.name} retiré des courses`);
  }
  async function checkShoppingItem(item: Shop, checked: boolean) {
    if (item.id <= 0 || item.pending) { c.flash("Attends un instant : l’article est encore en cours d’enregistrement"); return; }
    c.setShopping((items) => items.map((saved) => saved.id === item.id ? { ...saved, checked } : saved));
    const response = await fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "check", id: item.id, checked }) }).catch(() => null);
    if (!response?.ok) {
      c.setShopping((items) => items.map((saved) => saved.id === item.id ? { ...saved, checked: item.checked } : saved));
      c.flash("Impossible d’enregistrer cet achat"); return;
    }
    const data = await response.json();
    if (data.inventoryItem) { c.setItems((items) => [data.inventoryItem, ...items]); c.flash(`${item.name} ajouté aux réserves`); }
  }
  async function clearBoughtShopping() {
    const previous = c.shopping; c.setShopping((items) => items.filter((item) => !item.checked));
    const response = await fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "clear-bought-shopping" }) }).catch(() => null);
    if (!response?.ok) { c.setShopping(previous); c.flash("Les articles achetés n’ont pas pu être vidés"); return; }
    c.flash("Articles achetés retirés de la liste");
  }
  function openShoppingEditor(item: Shop) { c.setEditingShop({ ...item }); c.setModal("shopping"); }
  async function saveShoppingItem() {
    if (!c.editingShop?.name.trim()) return;
    const updated = { ...c.editingShop, name: c.editingShop.name.trim(), quantity: c.editingShop.quantity.trim() || "1" };
    const previous = c.shopping; c.setShopping((items) => items.map((item) => item.id === updated.id ? updated : item));
    c.setModal(null); c.setEditingShop(null);
    if (updated.id > 0) {
      const response = await fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update-shopping", id: updated.id, name: updated.name, quantity: updated.quantity }) }).catch(() => null);
      if (!response?.ok) { c.setShopping(previous); c.flash("Modification non enregistrée"); return; }
    }
    c.flash(`${updated.name} modifié`);
  }
  async function addWeekNeeds() {
    const alreadyQueued = new Set(c.shopping.map((item) => canonicalIngredient(item.name)));
    for (const need of c.combinedWeekNeeds) {
      const key = canonicalIngredient(need.name); if (alreadyQueued.has(key)) continue; alreadyQueued.add(key);
      const temp: Shop = { id: -Date.now() - Math.random(), name: need.name, quantity: need.quantity, checked: false, pending: true };
      c.setShopping((items) => [...items, temp]);
      const response = await fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "shopping", name: need.name, quantity: need.quantity }) }).catch(() => null);
      if (response?.ok) {
        const data = await response.json(); c.setShopping((items) => items.map((item) => item.id === temp.id ? { ...data.item, pending: false } : item));
      } else c.setShopping((items) => items.filter((item) => item.id !== temp.id));
    }
    c.flash("Liste de la semaine ajoutée aux courses");
  }
  async function shareShoppingList() {
    if (!c.shopping.some((item) => !item.checked)) { c.flash("Il n’y a plus rien à acheter"); return; }
    const text = c.groupedShopping.map(({ section, products }) => {
      const lines = products.filter((item) => !item.checked).map((item) => `• ${item.name} — ${item.quantity}`);
      return lines.length ? `${section}\n${lines.join("\n")}` : "";
    }).filter(Boolean).join("\n\n");
    if (navigator.share) { await navigator.share({ title: "Ma liste de courses", text }).catch(() => null); return; }
    await navigator.clipboard.writeText(text).then(() => c.flash("Liste copiée")).catch(() => c.flash("Partage indisponible"));
  }
  return { addMissing, addShoppingItem, removeShoppingItem, checkShoppingItem, clearBoughtShopping, openShoppingEditor, saveShoppingItem, addWeekNeeds, shareShoppingList };
}
