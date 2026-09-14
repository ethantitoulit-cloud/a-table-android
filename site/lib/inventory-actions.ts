import type { Dispatch, SetStateAction } from "react";
import type { Item } from "./app-domain";
import { canonicalIngredient, norm } from "./app-domain";
import { isReproducibleQuantity, packageProfileFromQuantity } from "./inventory-measures";
import type { InventoryZone } from "./receipt-scanner";

type Form = { name: string; quantity: string; zone: InventoryZone; expires: string };
type Setter<T> = Dispatch<SetStateAction<T>>;
type Context = {
  form: Form; editingItem: Item | null; items: Item[]; packagingProfiles: Record<string, string>;
  setItems: Setter<Item[]>; setForm: Setter<Form>; setEditingItem: Setter<Item | null>;
  setPackagingProfiles: Setter<Record<string, string>>;
  setModal: Setter<"scan" | "item" | "shopping" | "person" | null>;
  saveSetting: (key: string, value: unknown) => Promise<unknown>; flash: (message: string) => void;
};

export function createInventoryActions(c: Context) {
  function expandPackagingQuantity(name: string, quantity: string) {
    const value = quantity.trim();
    if (isReproducibleQuantity(value)) return value;
    const profile = c.packagingProfiles[canonicalIngredient(name)];
    const count = norm(value).match(/(\d+(?:[,.]\d+)?|\d+\/\d+)\s*(?:boite|paquet|sachet|pot|bocal|bouteille|flacon)/)?.[1];
    return profile && count ? `${count} ${value.replace(count, "").trim()} de ${profile}` : value;
  }
  function rememberPackagingProfile(name: string, quantity: string) {
    const profile = packageProfileFromQuantity(quantity); if (!profile) return;
    const next = { ...c.packagingProfiles, [canonicalIngredient(name)]: profile };
    c.setPackagingProfiles(next); c.saveSetting("packagingProfiles", next);
  }
  async function addItem() {
    if (!c.form.name.trim()) return;
    const quantity = expandPackagingQuantity(c.form.name, c.form.quantity);
    if (!isReproducibleQuantity(quantity)) { c.flash("Précise une quantité mesurable, par exemple 400 g, 1 L ou 6 unités"); return; }
    rememberPackagingProfile(c.form.name, quantity);
    const temp = { ...c.form, quantity, id: -Date.now(), expires: c.form.expires || null };
    c.setItems((items) => [temp, ...items]); c.setForm({ ...c.form, name: "", quantity: "1", expires: "" });
    const response = await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(temp) }).catch(() => null);
    if (response?.ok) { const data = await response.json(); c.setItems((items) => items.map((item) => item.id === temp.id ? data.item : item)); }
    c.flash("Produit ajouté — tu peux saisir le suivant");
  }
  function openNewItem(preset?: Partial<Form>) {
    c.setEditingItem(null);
    c.setForm({ name: preset?.name || "", quantity: preset?.quantity || "1", zone: preset?.zone || "garde-manger", expires: preset?.expires || "" });
    c.setModal("item");
  }
  function openInventoryEditor(item: Item) {
    c.setEditingItem(item); c.setForm({ name: item.name, quantity: item.quantity, zone: item.zone, expires: item.expires || "" }); c.setModal("item");
  }
  async function saveInventoryItem() {
    if (!c.editingItem || !c.form.name.trim()) return;
    const quantity = expandPackagingQuantity(c.form.name, c.form.quantity);
    if (!isReproducibleQuantity(quantity)) { c.flash("Précise le contenu réel : par exemple 1 boîte de 400 g"); return; }
    rememberPackagingProfile(c.form.name, quantity);
    const updated: Item = { ...c.editingItem, name: c.form.name.trim(), quantity, zone: c.form.zone, expires: c.form.expires || null };
    c.setItems((items) => items.map((item) => item.id === updated.id ? updated : item)); c.setModal(null); c.setEditingItem(null);
    if (updated.id > 0) await fetch("/api/inventory", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) }).catch(() => null);
    c.flash(`${updated.name} modifié`);
  }
  async function removeItem(id: number) {
    const previous = c.items; c.setItems((items) => items.filter((item) => item.id !== id));
    if (id > 0) {
      const response = await fetch(`/api/inventory?id=${id}`, { method: "DELETE" }).catch(() => null);
      if (!response?.ok) { c.setItems(previous); c.flash("Suppression impossible — le produit a été remis"); return; }
    }
    c.flash("Produit supprimé");
  }
  return { expandPackagingQuantity, addItem, openNewItem, openInventoryEditor, saveInventoryItem, removeItem };
}
