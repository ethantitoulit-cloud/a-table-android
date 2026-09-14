"use client";

import type { Dispatch, SetStateAction } from "react";
import { X } from "lucide-react";
import type { InventoryZone } from "../lib/receipt-scanner";
import type { PersonProfile } from "./views/people-view";
import type { ShoppingItem } from "./views/shopping-view";

export type InventoryForm = { name: string; quantity: string; zone: InventoryZone; expires: string };

export function InventoryItemModal({ form, setForm, editing, quantityValid, quantityHelp, close, save }: {
  form: InventoryForm;
  setForm: Dispatch<SetStateAction<InventoryForm>>;
  editing: boolean;
  quantityValid: boolean;
  quantityHelp: string;
  close: () => void;
  save: () => void;
}) {
  return <div className="modal-backdrop"><section className="scan-modal">
    <button className="close" onClick={close} aria-label="Fermer"><X /></button><p className="eyebrow">MES RÉSERVES</p><h2>{editing ? "Modifier le produit" : "Ajouter des produits ou des restes"}</h2>
    <div className="form-grid">
      <label>Produit<input autoFocus value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); save(); } }} placeholder="Ex. tomates" /></label>
      <label>Quantité<input value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} placeholder="Ex. 500 g ou 2 parts" /><small className={quantityValid ? "measure-help" : "measure-help warning"}>{quantityHelp}</small></label>
      <label>Emplacement<select value={form.zone} onChange={(event) => setForm((current) => ({ ...current, zone: event.target.value as InventoryZone }))}><option value="frigo">Réfrigérateur</option><option value="congelateur">Congélateur</option><option value="garde-manger">Placard</option><option value="epices">Épices & essentiels</option></select></label>
      <label>Date limite<input type="date" value={form.expires} onChange={(event) => setForm((current) => ({ ...current, expires: event.target.value }))} /></label>
    </div>
    <div className="modal-actions"><button className="outline" onClick={close}>{editing ? "Annuler" : "Terminer"}</button><button className="primary" onClick={save} disabled={!form.name.trim() || !quantityValid}>{editing ? "Enregistrer" : "Ajouter et continuer"}</button></div>
  </section></div>;
}

export function ShoppingItemModal({ item, setItem, close, save }: { item: ShoppingItem; setItem: Dispatch<SetStateAction<ShoppingItem | null>>; close: () => void; save: () => void }) {
  return <div className="modal-backdrop"><section className="scan-modal"><button className="close" onClick={close} aria-label="Fermer"><X /></button><p className="eyebrow">MA LISTE DE COURSES</p><h2>Modifier l’article</h2>
    <div className="form-grid"><label>Produit<input autoFocus value={item.name} onChange={(event) => setItem((current) => current ? { ...current, name: event.target.value } : current)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); save(); } }} /></label><label>Quantité<input value={item.quantity} onChange={(event) => setItem((current) => current ? { ...current, quantity: event.target.value } : current)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); save(); } }} /></label></div>
    <div className="modal-actions"><button className="outline" onClick={close}>Annuler</button><button className="primary" onClick={save} disabled={!item.name.trim()}>Enregistrer</button></div>
  </section></div>;
}

type PersonForm = Omit<PersonProfile, "active" | "id">;
export function PersonModal({ form, setForm, close, save }: { form: PersonForm; setForm: Dispatch<SetStateAction<PersonForm>>; close: () => void; save: () => void }) {
  const field = (key: keyof PersonForm, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  return <div className="modal-backdrop"><section className="scan-modal"><button className="close" onClick={close} aria-label="Fermer"><X /></button><p className="eyebrow">FICHE PERSONNE</p><h2>Ajouter une personne</h2>
    <div className="form-grid person-form">
      <label>Prénom<input autoFocus value={form.name} onChange={(event) => field("name", event.target.value)} placeholder="Ex. Maman" /></label>
      <label className="person-kind">Présence<select value={form.temporary ? "temporary" : "permanent"} onChange={(event) => field("temporary", event.target.value === "temporary")}><option value="temporary">Temporaire</option><option value="permanent">Habituelle</option></select></label>
      <label>Aime<textarea value={form.likes} onChange={(event) => field("likes", event.target.value)} placeholder="Ses plats et aliments préférés" /></label>
      <label>N’aime pas<textarea value={form.avoid} onChange={(event) => field("avoid", event.target.value)} placeholder="Aliments à éviter" /></label>
      <label>Possible si discret ou mixé<textarea value={form.hidden} onChange={(event) => field("hidden", event.target.value)} placeholder="Aliments acceptés sous certaines formes" /></label>
      <label>Allergies — exclusion stricte<textarea value={form.allergies} onChange={(event) => field("allergies", event.target.value)} placeholder="Ex. arachides, crustacés" /></label>
      <label>Régime alimentaire<textarea value={form.diet} onChange={(event) => field("diet", event.target.value)} placeholder="Ex. végétarien, sans porc, sans lactose" /></label>
      <label>Besoins particuliers<textarea value={form.needs} onChange={(event) => field("needs", event.target.value)} placeholder="Ex. repas léger, sans gluten" /></label>
    </div>
    <div className="modal-actions"><button className="outline" onClick={close}>Annuler</button><button className="primary" onClick={save} disabled={!form.name.trim()}>Ajouter la personne</button></div>
  </section></div>;
}
