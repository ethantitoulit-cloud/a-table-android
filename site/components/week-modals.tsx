"use client";

import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { Check, ChevronRight, Plus, Search, Sparkles, X } from "lucide-react";
import type { Recipe } from "../lib/app-types";

export type WeekPickerState = { day: number; course: "entrée" | "plat" | "dessert"; addToMeal?: boolean };
export type SpecialBuilderState = { day: number; type: "apero" | "fete"; recipes: string[] };

export function WeekPickerModal({ picker, setPicker, date, currentMeal, query, setQuery, simpleFood, setSimpleFood, netOpen, toggleNet, importStatus, link, setLink, recipes, photoStyle, recipeMeta, close, addSimpleFood, chooseNoStarter, searchWeb, importLink, chooseRecipe }: {
  picker: WeekPickerState;
  setPicker: Dispatch<SetStateAction<WeekPickerState | null>>;
  date?: string;
  currentMeal: string;
  query: string;
  setQuery: (value: string) => void;
  simpleFood: string;
  setSimpleFood: (value: string) => void;
  netOpen: boolean;
  toggleNet: () => void;
  importStatus: string;
  link: { name: string; url: string };
  setLink: Dispatch<SetStateAction<{ name: string; url: string }>>;
  recipes: Recipe[];
  photoStyle: (recipe: Recipe) => CSSProperties;
  recipeMeta: (recipe: Recipe) => string;
  close: () => void;
  addSimpleFood: () => void;
  chooseNoStarter: () => void;
  searchWeb: () => void;
  importLink: () => void;
  chooseRecipe: (recipe: Recipe) => void;
}) {
  return <div className="modal-backdrop" onClick={close}><section className="scan-modal week-picker" onClick={(event) => event.stopPropagation()}>
    <button className="close" onClick={close} aria-label="Fermer"><X /></button><p className="eyebrow">{date?.toUpperCase()}</p><h2>{picker.addToMeal ? "Ajouter une recette au plat" : "Changer le menu"}</h2>
    {picker.addToMeal && <p className="picker-meal-summary">Déjà prévu : <b>{currentMeal}</b></p>}
    <div className="week-picker-tabs">{(["entrée", "plat", "dessert"] as const).map((course) => <button key={course} className={picker.course === course ? "active" : ""} onClick={() => { setPicker({ ...picker, course, addToMeal: course === "plat" ? picker.addToMeal : false }); setQuery(""); setSimpleFood(""); }}>{course.charAt(0).toUpperCase() + course.slice(1)}</button>)}</div>
    <div className="simple-food-entry"><span className="simple-food-badge"><Sparkles size={14} /> Ajout express</span><div className="simple-food-pill"><input aria-label="Aliment simple à ajouter" value={simpleFood} onChange={(event) => setSimpleFood(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addSimpleFood(); }} placeholder="Laitue, yaourt, pommes…" /><button onClick={addSimpleFood} disabled={!simpleFood.trim()} aria-label="Ajouter cet aliment simple"><Plus size={20} /></button></div><small>Écris juste l’aliment, sans créer de recette.</small></div>
    {picker.course === "entrée" && <button className="no-starter-choice" onClick={chooseNoStarter}>Continuer sans entrée</button>}
    <button className={`week-net-toggle ${netOpen ? "active" : ""}`} onClick={toggleNet}><Search size={17} /> Choisir sur le net</button>
    {netOpen && <div className="week-net-panel"><p><b>Quelle recette veux-tu chercher ?</b><span>Écris son nom précis, par exemple « gratin dauphinois » ou « côtes de porc au caramel ».</span></p><label className="week-picker-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") searchWeb(); }} placeholder="Nom de la recette" /></label><button className="outline" onClick={searchWeb} disabled={!query.trim()}><Search size={16} /> Chercher « {query.trim() || "ma recette"} » sur Internet</button><small>Sur la recette choisie, touche <b>Partager</b>, puis sélectionne <b>À table</b>. L’application se rouvrira avec la recette prête à importer.</small>{importStatus && <small>{importStatus}</small>}<details><summary>À table n’apparaît pas dans Partager ?</summary><input value={link.name} onChange={(event) => setLink((current) => ({ ...current, name: event.target.value }))} placeholder="Nom facultatif" /><input type="url" value={link.url} onChange={(event) => setLink((current) => ({ ...current, url: event.target.value }))} placeholder="Coller le lien https://…" /><button className="outline" onClick={importLink} disabled={!link.url.trim()}>Importer ce lien</button></details></div>}
    <label className="week-picker-search"><Search /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Chercher une ${picker.course === "entrée" ? "entrée" : picker.course === "dessert" ? "recette de dessert" : "recette de plat"}`} /></label>
    <div className="week-picker-list">{recipes.map((recipe) => <button key={`${recipe.source || "recipe"}-${recipe.name}`} onClick={() => chooseRecipe(recipe)}><span className="week-picker-photo" style={photoStyle(recipe)} /><span><b>{recipe.name}</b><small>{recipeMeta(recipe)}</small></span><ChevronRight /></button>)}{!recipes.length && <p className="section-empty">Aucune recette ne correspond à cette recherche.</p>}</div>
  </section></div>;
}

export function SpecialMenuModal({ builder, setBuilder, date, query, setQuery, recipes, hasSavedMenu, photoStyle, close, restoreNormal, save }: {
  builder: SpecialBuilderState;
  setBuilder: Dispatch<SetStateAction<SpecialBuilderState | null>>;
  date?: string;
  query: string;
  setQuery: (value: string) => void;
  recipes: Recipe[];
  hasSavedMenu: boolean;
  photoStyle: (recipe: Recipe) => CSSProperties;
  close: () => void;
  restoreNormal: () => void;
  save: () => void;
}) {
  const update = (patch: Partial<SpecialBuilderState>) => setBuilder({ ...builder, ...patch });
  return <div className="modal-backdrop" onClick={close}><section className="scan-modal week-picker" onClick={(event) => event.stopPropagation()}><button className="close" onClick={close} aria-label="Fermer"><X /></button><p className="eyebrow">{date?.toUpperCase()}</p><h2>Je compose mon repas de fête</h2>
    <div className="week-picker-tabs"><button className={builder.type === "apero" ? "active" : ""} onClick={() => update({ type: "apero" })}>Apéro dînatoire</button><button className={builder.type === "fete" ? "active" : ""} onClick={() => update({ type: "fete" })}>Repas de fête</button></div><p>Aucune recette n’est imposée. Recherche dans ta banque puis ajoute uniquement celles que tu veux.</p>
    {builder.recipes.length > 0 && <div className="special-selected"><b>Mon menu ({builder.recipes.length})</b>{builder.recipes.map((name) => <button key={name} onClick={() => update({ recipes: builder.recipes.filter((selected) => selected !== name) })}><span>{name}</span><X size={16} /></button>)}</div>}
    <label className="week-picker-search"><Search /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Chercher une recette dans ma banque" /></label>{!query.trim() && !builder.recipes.length && <p className="section-empty special-empty">Ton repas est vide. Commence par rechercher une recette.</p>}
    <div className="week-picker-list special-picker-list">{recipes.map((recipe) => { const selected = builder.recipes.includes(recipe.name); return <button key={`${recipe.source || "recipe"}-${recipe.name}`} className={selected ? "selected" : ""} onClick={() => update({ recipes: selected ? builder.recipes.filter((name) => name !== recipe.name) : [...builder.recipes, recipe.name] })}><span className="week-picker-photo" style={photoStyle(recipe)} /><span><b>{recipe.name}</b><small>{recipe.course || "plat"}</small></span>{selected ? <Check /> : <Plus />}</button>; })}</div>
    <div className="special-picker-actions">{hasSavedMenu && <button className="outline" onClick={restoreNormal}>Repas normal</button>}<button className="primary" onClick={save} disabled={!builder.recipes.length}>Enregistrer mon menu</button></div>
  </section></div>;
}
