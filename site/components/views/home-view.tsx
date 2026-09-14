"use client";

import { useEffect } from "react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { ChefHat, ChevronLeft, ChevronRight, Clock3, History, Sparkles, Users } from "lucide-react";
import type { MenuCourse, Recipe } from "../../lib/app-types";
import type { InventoryItem } from "./inventory-view";

// Conservé pour pouvoir réactiver ce parcours après les tests utilisateurs.
const SHOW_TIRED_MODE = false;

export function HomeView({ date, today, niceDate, moveDate, setDate, people, setPeople, tiredOpen, setTiredOpen, tiredTime, setTiredTime, noCook, setNoCook, suggestions, suggestionCount, nextSuggestions, photoStyle, openRecipe, chooseRecipe, leftover, viewLeftover, eatLeftover, menu, expressChoice, menuPortions, allRecipes, openWeek }: {
  date: string;
  today: () => string;
  niceDate: (date: string) => string;
  moveDate: (date: string, days: number) => string;
  setDate: Dispatch<SetStateAction<string>>;
  people: number;
  setPeople: (people: number) => void;
  tiredOpen: boolean;
  setTiredOpen: Dispatch<SetStateAction<boolean>>;
  tiredTime: number;
  setTiredTime: (minutes: number) => void;
  noCook: boolean;
  setNoCook: (value: boolean) => void;
  suggestions: Array<{ recipe: Recipe; missing: string[] }>;
  suggestionCount: number;
  nextSuggestions: () => void;
  photoStyle: (recipe: Recipe | string) => CSSProperties;
  openRecipe: (recipe: Recipe, portions: number) => void;
  chooseRecipe: (recipe: Recipe) => void;
  leftover?: InventoryItem;
  viewLeftover: (item: InventoryItem) => void;
  eatLeftover: (item: InventoryItem) => void;
  menu: Array<{ label: string; recipe: Recipe | MenuCourse }>;
  expressChoice: boolean;
  menuPortions: number;
  allRecipes: Recipe[];
  openWeek: () => void;
}) {
  useEffect(() => {
    if (!SHOW_TIRED_MODE || !tiredOpen || suggestionCount < 2) return;
    let lastShake = 0;
    const handleMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;
      const strength = Math.sqrt((acceleration.x || 0) ** 2 + (acceleration.y || 0) ** 2 + (acceleration.z || 0) ** 2);
      const now = Date.now();
      if (strength < 19 || now - lastShake < 1200) return;
      lastShake = now;
      nextSuggestions();
      navigator.vibrate?.(45);
    };
    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [tiredOpen, suggestionCount, nextSuggestions]);

  return <section className="content">
    <div className="intro-row"><div><div className="home-date-line"><p className="eyebrow" suppressHydrationWarning>{niceDate(date).toUpperCase()}</p><div className="home-date-selector" aria-label="Choisir le jour affiché"><button aria-label="Voir le jour précédent" onClick={() => setDate((value) => moveDate(value, -1))}><ChevronLeft size={18} /></button>{date !== today() && <button className="home-date-today" onClick={() => setDate(today())}>Aujourd’hui</button>}<button aria-label="Voir le jour suivant" onClick={() => setDate((value) => moveDate(value, 1))}><ChevronRight size={18} /></button></div></div><h2>À table !</h2></div>
      <div className="people"><Users size={17} /><button onClick={() => setPeople(Math.max(1, people - 1))}>−</button><b>{people}</b><button onClick={() => setPeople(Math.min(8, people + 1))}>+</button></div>
    </div>
    {SHOW_TIRED_MODE && <div className="tired-mode">
      <button className="tired-trigger" onClick={() => setTiredOpen((value) => !value)}><Sparkles size={20} /><span><b>Pas envie de cuisiner</b><small>Une idée simple avec ce que tu as</small></span><ChevronRight className={tiredOpen ? "open" : ""} /></button>
      {tiredOpen && <div className="tired-panel"><div className="tired-controls"><span>Temps maximum</span>{[10, 15, 20, 30].map((minutes) => <button key={minutes} className={tiredTime === minutes ? "active" : ""} onClick={() => setTiredTime(minutes)}>{minutes} min</button>)}<label><input type="checkbox" checked={noCook} onChange={(event) => setNoCook(event.target.checked)} /> Sans cuisson</label></div>
        <div className="tired-results" aria-live="polite">{suggestions.length ? suggestions.map(({ recipe, missing }) => <article key={recipe.name}><span className="tired-photo" style={photoStyle(recipe)} aria-hidden="true" /><div><b>{recipe.name}</b><small>{recipe.time} min · {recipe.steps.length} étapes · {missing.length ? `${missing.length} achat${missing.length > 1 ? "s" : ""}` : "tout est en réserve"}</small></div><button className="outline" onClick={() => openRecipe(recipe, people)}>Voir</button><button className="primary" onClick={() => chooseRecipe(recipe)}>Choisir</button></article>) : <p>Aucune recette assez simple ne correspond. Augmente le temps ou enlève « Sans cuisson ».</p>}</div>
        {suggestionCount > 1 && <><p className="ingredient-help">Secoue le téléphone pour une autre idée.</p><button className="tired-refresh" onClick={nextSuggestions}><Sparkles size={17} /> Une autre idée · {suggestionCount} recettes possibles</button></>}
      </div>}
    </div>}
    <div className="home-meal">
      {leftover && <aside className="leftover-priority"><div><History /><span><b>Un reste est disponible</b><small>{leftover.name.replace(/^Reste de /, "")} · {leftover.quantity}</small></span></div><div><button className="outline" onClick={() => viewLeftover(leftover)}>Voir</button><button className="primary" onClick={() => eatLeftover(leftover)}>Manger 1 part</button></div></aside>}
      {menu.length > 0 && <aside className="tonight-side today-combo"><span className="recipe-kicker">{expressChoice ? "TON CHOIX POUR CE SOIR" : "AU MENU AUJOURD’HUI"}</span><div className="today-combo-list">{menu.map(({ label, recipe }) => {
        const fullRecipe = allRecipes.find((candidate) => candidate.name === recipe.name);
        return recipe.simpleFood || !fullRecipe ? <div key={`${label}-${recipe.name}`} className="today-course simple-course"><span className="today-course-photo" aria-hidden="true" style={photoStyle(recipe.name)} /><span className="today-course-copy"><small>{label}</small><b>{recipe.name}</b><em>Aliment simple</em></span></div> : <button key={`${label}-${recipe.name}`} className="today-course" onClick={() => openRecipe(fullRecipe, expressChoice ? people : menuPortions)}><span className="today-course-photo" aria-hidden="true" style={photoStyle(fullRecipe)} /><span className="today-course-copy"><small>{label}</small><b>{recipe.name}</b><em><Clock3 size={14} /> {fullRecipe.time} min</em></span><ChevronRight size={20} aria-hidden="true" /></button>;
      })}</div></aside>}
      {!menu.length && <aside className="home-empty-meal"><ChefHat /><span><b>Rien de prévu pour ce soir</b><small>Compose ton repas en quelques secondes.</small></span><button className="primary" onClick={openWeek}>Composer le repas</button></aside>}
    </div>
  </section>;
}
