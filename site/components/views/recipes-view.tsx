"use client";

import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { ChevronRight, Plus, Search, Share2, SlidersHorizontal, X } from "lucide-react";
import type { Recipe } from "../../lib/app-types";
import { PageTitle, RecipeTile } from "../recipe-tile";
import { openExternalPage } from "../../lib/browser-navigation";

export type RecipeTheme = "toutes" | "favoris" | "local" | "rapide" | "léger" | "monde" | "original";

type Props = {
  query: string;
  setQuery: (value: string) => void;
  limit: number;
  setLimit: Dispatch<SetStateAction<number>>;
  theme: RecipeTheme;
  setTheme: (value: RecipeTheme) => void;
  filtersOpen: boolean;
  setFiltersOpen: Dispatch<SetStateAction<boolean>>;
  addOpen: boolean;
  setAddOpen: (value: boolean) => void;
  importOpen: boolean;
  setImportOpen: (value: boolean) => void;
  importStatus: string;
  link: { name: string; url: string };
  setLink: Dispatch<SetStateAction<{ name: string; url: string }>>;
  recipes: Recipe[];
  favorites: string[];
  photoStyle: (recipe: Recipe) => CSSProperties;
  startNewRecipe: () => void;
  saveWebRecipe: () => void;
  openRecipe: (recipe: Recipe) => void;
  toggleFavorite: (name: string) => void;
  editRecipe: (recipe: Recipe) => void;
  deleteRecipe: (recipe: Recipe) => void;
};

export function RecipesView(props: Props) {
  const chooseTheme = (theme: RecipeTheme, clearQuery = false) => {
    props.setTheme(theme);
    if (clearQuery) props.setQuery("");
    props.setLimit(60);
  };
  return <section className="content">
    <PageTitle eyebrow="MON CARNET DE CUISINE" title="Banque de recettes" />
    <div className="recipe-search">
      <label><Search /><input value={props.query} onChange={(event) => { props.setQuery(event.target.value); props.setLimit(60); }} placeholder="Tiramisu, colombo, gratin…" /></label>
      <div className="recipe-search-actions"><button className="primary recipe-add-trigger" onClick={() => props.setAddOpen(true)}><Plus size={17} /> Ajouter une recette</button></div>
    </div>
    {props.addOpen && <div className="recipe-add-backdrop" role="presentation" onClick={() => props.setAddOpen(false)}>
      <section className="recipe-add-sheet" role="dialog" aria-modal="true" aria-labelledby="recipe-add-title" onClick={(event) => event.stopPropagation()}>
        <div className="recipe-add-sheet-head"><div><p className="eyebrow">MON CARNET DE CUISINE</p><h2 id="recipe-add-title">Ajouter une recette</h2></div><button className="close" aria-label="Fermer" onClick={() => props.setAddOpen(false)}><X size={20} /></button></div>
        <div className="recipe-add-choices">
          <button onClick={() => { props.setAddOpen(false); props.startNewRecipe(); }}><span><Plus size={20} /></span><div><b>Créer une recette</b><small>Je saisis ma recette moi-même</small></div><ChevronRight size={20} /></button>
          <button onClick={() => { props.setAddOpen(false); props.setImportOpen(true); }}><span><Share2 size={20} /></span><div><b>Importer depuis un lien</b><small>Je colle l’adresse d’une recette</small></div><ChevronRight size={20} /></button>
          <button onClick={() => { props.setAddOpen(false); openExternalPage(`https://www.google.com/search?q=${encodeURIComponent("recette " + props.query)}`); }}><span><Search size={20} /></span><div><b>Chercher sur Internet</b><small>{props.query.trim() ? `Rechercher « ${props.query.trim()} »` : "Saisis d’abord un plat dans la recherche"}</small></div><ChevronRight size={20} /></button>
        </div>
      </section>
    </div>}
    {props.importOpen && <div className="recipe-import">
      <div><b>Enregistrer une recette trouvée sur Internet</b><span>Colle son adresse : l’app récupère la fiche automatiquement.</span>{props.importStatus && <small>{props.importStatus}</small>}</div>
      <input value={props.link.name} onChange={(event) => props.setLink((link) => ({ ...link, name: event.target.value }))} placeholder="Nom de la recette" />
      <input type="url" value={props.link.url} onChange={(event) => props.setLink((link) => ({ ...link, url: event.target.value }))} placeholder="https://…" />
      <button className="outline" onClick={props.saveWebRecipe} disabled={!props.link.url.trim()}><Plus size={17} /> Enregistrer</button>
    </div>}
    <div className="recipe-theme-filters recipe-primary-filters" aria-label="Trier les recettes">
      {([['toutes', 'Toutes'], ['favoris', 'Mes favoris']] as const).map(([id, label]) => <button key={id} className={props.theme === id ? "active" : ""} onClick={() => { chooseTheme(id, true); window.requestAnimationFrame(() => document.getElementById("recipe-results")?.scrollIntoView({ behavior: "smooth", block: "start" })); }}>{label}</button>)}
      <button className={props.filtersOpen || !["toutes", "favoris"].includes(props.theme) ? "active" : ""} onClick={() => props.setFiltersOpen((open) => !open)}><SlidersHorizontal size={16} /> Filtrer</button>
    </div>
    {props.filtersOpen && <div className="recipe-theme-filters recipe-secondary-filters">{([['local', 'Produits locaux'], ['rapide', 'Rapides'], ['léger', 'Légères'], ['monde', 'Cuisine du monde'], ['original', 'Originales']] as const).map(([id, label]) => <button key={id} className={props.theme === id ? "active" : ""} onClick={() => chooseTheme(id)}>{label}</button>)}</div>}
    <p className="recipe-swipe-hint">Astuce : glisse une recette pour la modifier ou la supprimer.</p>
    <div id="recipe-results">{([['entrée', 'Entrées'], ['plat', 'Plats'], ['dessert', 'Desserts'], ['autre', 'Autres']] as const).map(([course, title]) => {
      const recipes = props.recipes.filter((recipe) => (recipe.course || "plat") === course);
      if (!recipes.length) return null;
      return <div className="recipe-section" key={course}><h3>{title} <small>{recipes.length}</small></h3>{course === "autre" && <p className="recipe-section-note">Pâtes de base, sauces, vinaigrettes, marinades et boissons maison.</p>}<div className="recipe-library">{recipes.slice(0, props.limit).map((recipe) => <RecipeTile key={recipe.source || recipe.name} recipe={recipe} favorite={props.favorites.includes(recipe.name)} photoStyle={props.photoStyle(recipe)} onOpen={() => props.openRecipe(recipe)} onFavorite={() => props.toggleFavorite(recipe.name)} onEdit={() => props.editRecipe(recipe)} onDelete={() => props.deleteRecipe(recipe)} />)}</div></div>;
    })}</div>
    {!props.recipes.length && <p className="section-empty">Aucune recette ne correspond à cette recherche.</p>}
    {props.recipes.length > props.limit && <button className="outline recipe-more" onClick={() => props.setLimit((limit) => limit + 60)}>Afficher 60 recettes de plus</button>}
  </section>;
}
