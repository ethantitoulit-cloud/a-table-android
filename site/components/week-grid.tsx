"use client";

import type { CSSProperties } from "react";
import { AlertTriangle, ChevronRight, Users, X } from "lucide-react";
import type { MenuCourse, Recipe } from "../lib/app-types";

export type WeekGridDay = {
  date: string;
  recipe?: Recipe;
  extraRecipes: Recipe[];
  starter: MenuCourse;
  dessert: MenuCourse;
  portions: number;
  special?: { type: "apero" | "fete"; recipes: string[] };
  specialRecipes: Recipe[];
  skipped: boolean;
  missingCount: number;
  nutritionWarnings: string[];
};

type ProfileChoice = { key: string; name: string; active: boolean };

export function WeekGrid({ days, costs, profiles, presence, alternatives, recipes, ranked, photoStyle, isSeasonal, openRecipe, togglePresence, setAlternative, composeSpecial, restoreMeal, chooseMeal, removeExtra, removeSimpleFood }: {
  days: WeekGridDay[];
  costs: number[];
  profiles: ProfileChoice[];
  presence: boolean[][];
  alternatives: Record<string, string>[];
  recipes: Recipe[];
  ranked: Recipe[];
  photoStyle: (recipe: Recipe) => CSSProperties;
  isSeasonal: (recipe: Recipe | MenuCourse) => boolean;
  openRecipe: (recipe: Recipe, portions: number) => void;
  togglePresence: (day: number, person: number) => void;
  setAlternative: (day: number, person: number, recipe: string) => void;
  composeSpecial: (day: number, type: "apero" | "fete", recipes: string[]) => void;
  restoreMeal: (day: number) => void;
  chooseMeal: (day: number, add: boolean) => void;
  removeExtra: (day: number, recipe: string) => void;
  removeSimpleFood: (day: number, course: "entrée" | "plat" | "dessert", name: string) => void;
}) {
  const recipeByName = (name: string, course?: "dessert") => recipes.find((recipe) => recipe.name === name && (!course || recipe.course === course));
  return <div className="week-grid week-seven">{days.map((day, dayIndex) => <article key={day.date} className={`${day.recipe && !day.recipe.simpleFood && !day.skipped ? "tappable" : ""}${day.skipped ? " skipped-meal" : ""}`} onClick={() => day.recipe && !day.recipe.simpleFood && !day.skipped && openRecipe(day.recipe, day.portions)}>
    {day.recipe ? <>
      <div className="week-card-head"><div className="week-meal-photo" role="img" aria-label={`Photo de ${day.recipe.name}`} style={photoStyle(day.recipe)} /><div className="day">{day.date}</div></div>
      {day.skipped ? <div className="daily-menu outside-menu"><b>Repas à l’extérieur / commandé</b><span>Aucun achat ni retrait des réserves pour ce jour.</span></div> : day.specialRecipes.length ? <div className="daily-menu special-menu-list"><b>{day.special?.type === "apero" ? "Apéro dînatoire" : "Repas de fête"}</b>{day.specialRecipes.map((recipe) => <button key={recipe.name} className="menu-course-link" onClick={(event) => { event.stopPropagation(); openRecipe(recipe, day.portions); }}>{recipe.name}<ChevronRight /></button>)}</div> : <div className="daily-menu">
        {day.starter.name !== "Sans entrée" && <p className={day.starter.simpleFood ? "removable-course" : ""}><b>Entrée</b>{!day.starter.simpleFood ? <button className="menu-course-link" onClick={(event) => { event.stopPropagation(); const recipe = recipeByName(day.starter.name); if (recipe) openRecipe(recipe, day.portions); }}>{day.starter.name}<ChevronRight /></button> : <><span>{day.starter.name}</span><button className="remove-extra" aria-label={`Retirer ${day.starter.name} du repas`} onClick={(event) => { event.stopPropagation(); removeSimpleFood(dayIndex, "entrée", day.starter.name); }}><X size={15} /></button></>}</p>}
        <p className={`daily-main${day.recipe.simpleFood ? " removable-course" : ""}`}><b>Plat</b>{day.recipe.simpleFood ? <><span>{day.recipe.name}</span><button className="remove-extra" aria-label={`Retirer ${day.recipe.name} du repas`} onClick={(event) => { event.stopPropagation(); removeSimpleFood(dayIndex, "plat", day.recipe!.name); }}><X size={15} /></button></> : <button className="menu-course-link" onClick={(event) => { event.stopPropagation(); openRecipe(day.recipe!, day.portions); }}>{day.recipe.name}<ChevronRight /></button>}</p>
        {day.extraRecipes.map((extra, index) => <p className="daily-extra" key={extra.name}><b>{index === 0 ? "Avec" : "+"}</b>{extra.simpleFood ? <span>{extra.name}</span> : <button className="menu-course-link" onClick={(event) => { event.stopPropagation(); openRecipe(extra, day.portions); }}>{extra.name}<ChevronRight /></button>}<button className="remove-extra" aria-label={`Retirer ${extra.name} du repas`} onClick={(event) => { event.stopPropagation(); removeExtra(dayIndex, extra.name); }}><X size={15} /></button></p>)}
        <p className={day.dessert.simpleFood ? "removable-course" : ""}><b>Dessert</b>{recipeByName(day.dessert.name, "dessert") ? <button className="menu-course-link" onClick={(event) => { event.stopPropagation(); const recipe = recipeByName(day.dessert.name, "dessert"); if (recipe) openRecipe(recipe, day.portions); }}>{day.dessert.name}<ChevronRight /></button> : day.dessert.simpleFood ? <><span>{day.dessert.name}</span><button className="remove-extra" aria-label={`Retirer ${day.dessert.name} du repas`} onClick={(event) => { event.stopPropagation(); removeSimpleFood(dayIndex, "dessert", day.dessert.name); }}><X size={15} /></button></> : <span>{day.dessert.name}</span>}</p>
      </div>}
      <div className="meal-balance-meta"><span>≈ {(costs[dayIndex] || 0).toFixed(0)} €</span>{[day.starter, day.recipe, ...day.extraRecipes, day.dessert].some(isSeasonal) && <span>Produits locaux</span>}</div>
      <p className="menu-availability">{day.recipe.time + day.extraRecipes.reduce((sum, recipe) => sum + recipe.time, 0)} min pour le plat · {day.missingCount === 0 ? "tout est en réserve" : `${day.missingCount} ingrédient${day.missingCount > 1 ? "s" : ""} à acheter`}</p>
      {day.nutritionWarnings.length > 0 && <p className="nutrition-warning"><AlertTriangle />{day.nutritionWarnings.join(" · ")}</p>}
      <details className="day-options" onClick={(event) => event.stopPropagation()}><summary><Users size={16} /> {day.portions} part{day.portions > 1 ? "s" : ""} · Présences et options <ChevronRight size={16} /></summary><div className="day-presence">{profiles.map((person, personIndex) => person.active ? <button key={person.key} className={presence[dayIndex]?.[personIndex] !== false ? "present" : "absent"} aria-pressed={presence[dayIndex]?.[personIndex] !== false} onClick={() => togglePresence(dayIndex, personIndex)}>{person.name}</button> : null)}<small>{day.portions} part{day.portions > 1 ? "s" : ""}</small></div>
        <details className="alternative-meals" onClick={(event) => event.stopPropagation()}><summary>Un plat différent</summary>{profiles.map((person, personIndex) => person.active && presence[dayIndex]?.[personIndex] !== false ? <label key={person.key}><span>{person.name}</span><select value={alternatives[dayIndex]?.[person.key] || ""} onChange={(event) => setAlternative(dayIndex, personIndex, event.target.value)}><option value="">Même plat</option>{ranked.slice(0, 60).map((recipe) => <option key={recipe.name} value={recipe.name}>{recipe.name}</option>)}</select></label> : null)}</details>
        <button className="day-special" onClick={() => composeSpecial(dayIndex, day.special?.type || "fete", day.special?.recipes || [])}>Composer un repas spécial</button>
      </details>
      <div className="week-actions">{day.skipped ? <button className="week-action-full" onClick={(event) => { event.stopPropagation(); restoreMeal(dayIndex); }}>Remettre un repas</button> : <><button className="week-action-change" onClick={(event) => { event.stopPropagation(); chooseMeal(dayIndex, false); }}>Changer</button><button className="week-action-add" onClick={(event) => { event.stopPropagation(); chooseMeal(dayIndex, true); }}>Ajouter une recette</button></>}</div>
    </> : <><div className="day">{day.date}</div><p>Aucun repas prévu.</p><button className="empty-day-action" onClick={(event) => { event.stopPropagation(); chooseMeal(dayIndex, false); }}>Composer ce jour</button></>}
  </article>)}</div>;
}
