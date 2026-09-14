"use client";

import type { ComponentProps } from "react";
import { CalendarDays, ChevronRight, Flame, Refrigerator, ShoppingBasket, SlidersHorizontal, Users } from "lucide-react";
import type { Mood } from "../../lib/app-types";
import { christmasWeek, localDateKey, mondayOf } from "../../lib/date-utils";
import { PageTitle } from "../recipe-tile";
import { WeekGrid } from "../week-grid";
import { BatchCookingPanel, BreakfastPanel, ThawPanel, WeekShoppingPanel } from "../week-organizers";

export function WeekView({ selectedWeekStart, switchWeek, mood, changeMood, maxTime, setMaxTime, refreshFromStock, preferSeasonal, toggleSeasonal, weeklyBudget, setWeeklyBudget, people, needsCount, estimatedCost, grid, thaw, batch, breakfast, shopping }: {
  selectedWeekStart: string;
  switchWeek: (date: string) => void;
  mood: Mood;
  changeMood: (mood: Mood) => void;
  maxTime: number;
  setMaxTime: (minutes: number) => void;
  refreshFromStock: () => void;
  preferSeasonal: boolean;
  toggleSeasonal: () => void;
  weeklyBudget: number;
  setWeeklyBudget: (budget: number) => void;
  people: number;
  needsCount: number;
  estimatedCost: number;
  grid: ComponentProps<typeof WeekGrid>;
  thaw: ComponentProps<typeof ThawPanel>;
  batch: ComponentProps<typeof BatchCookingPanel>;
  breakfast: ComponentProps<typeof BreakfastPanel>;
  shopping: ComponentProps<typeof WeekShoppingPanel>;
}) {
  const moveWeek = (days: number) => {
    const date = new Date(`${selectedWeekStart}T12:00:00`);
    date.setDate(date.getDate() + days);
    switchWeek(localDateKey(date));
  };
  return <section className="content">
    <PageTitle eyebrow="MENU ET COURSES ADAPTÉS" title="Ma semaine de repas" />
    <div className="week-calendar-bar"><button aria-label="Semaine précédente" onClick={() => moveWeek(-7)}>←</button><label><CalendarDays size={18} /><span>Semaine du</span><input type="date" value={selectedWeekStart} onChange={(event) => event.target.value && switchWeek(event.target.value)} /></label><button aria-label="Semaine suivante" onClick={() => moveWeek(7)}>→</button><button className="week-shortcut" onClick={() => switchWeek(mondayOf())}>Cette semaine</button>{new Date().getMonth() >= 10 && <button className="week-shortcut christmas" onClick={() => switchWeek(christmasWeek())}>Préparer Noël</button>}</div>
    <details className="week-fold week-preferences"><summary><SlidersHorizontal /><span><b>Personnaliser la semaine</b><small>Temps, envie, budget et produits locaux</small></span><ChevronRight /></summary><div className="decision-bar"><div><SlidersHorizontal size={18} /><strong>J’ai envie de</strong></div>{(["tout", "rapide", "leger", "budget", "sans-cuisson"] as Mood[]).map((choice) => <button key={choice} className={mood === choice ? "active" : ""} onClick={() => changeMood(choice)}>{{ tout: "Tout", rapide: "Rapide", leger: "Léger", reconfort: "Réconfortant", budget: "Petit budget", "sans-cuisson": "Sans cuisson" }[choice]}</button>)}<label>≤ <select value={maxTime} onChange={(event) => setMaxTime(Number(event.target.value))}><option value="20">20 min</option><option value="35">35 min</option><option value="60">1 h</option></select></label><button className="stock-refresh" onClick={refreshFromStock}><Refrigerator size={16} />Recalculer avec mes réserves</button><button className={preferSeasonal ? "active" : ""} onClick={toggleSeasonal}>Produits locaux Guadeloupe</button><label>Budget semaine<select value={weeklyBudget} onChange={(event) => setWeeklyBudget(Number(event.target.value))}><option value="60">60 €</option><option value="75">75 €</option><option value="90">90 €</option><option value="110">110 €</option><option value="140">140 €</option></select></label></div></details>
    <div className="week-summary"><div><Users /><span><b>{people} personnes</b><small>Les réserves sont déduites automatiquement</small></span></div><div><ShoppingBasket /><span><b>{needsCount} produits à acheter</b><small>Quantités calculées pour les repas prévus</small></span></div><div className={estimatedCost > weeklyBudget ? "budget-over" : ""}><Flame /><span><b>Environ {estimatedCost.toFixed(0)} € la semaine</b><small>{estimatedCost > weeklyBudget ? `Au-dessus de l’objectif de ${weeklyBudget} €` : `Dans l’objectif de ${weeklyBudget} €`}</small></span></div></div>
    <WeekGrid {...grid} />
    <ThawPanel {...thaw} />
    <BatchCookingPanel {...batch} />
    <BreakfastPanel {...breakfast} />
    <WeekShoppingPanel {...shopping} />
  </section>;
}
