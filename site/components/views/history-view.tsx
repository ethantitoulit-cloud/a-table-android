"use client";

import { History, Trash2 } from "lucide-react";
import { PageTitle } from "../recipe-tile";

export type MealHistory = { id: number; meal: string; people: number; eatenAt: string; rating: number };
export type HistoryFilter = "all" | "love" | "okay" | "no";

export function HistoryView({ meals, filter, setFilter, rate, remove, markOutside }: {
  meals: MealHistory[];
  filter: HistoryFilter;
  setFilter: (filter: HistoryFilter) => void;
  rate: (meal: MealHistory, rating: 1 | 2 | 3) => void;
  remove: (meal: MealHistory) => void;
  markOutside: () => void;
}) {
  const visible = meals.filter((meal) => filter === "all" || filter === "love" && (meal.rating || 3) === 3 || filter === "okay" && meal.rating === 2 || filter === "no" && meal.rating === 1);
  return <section className="content">
    <PageTitle eyebrow="NOS BONS SOUVENIRS DE TABLE" title="On aime !" />
    <div className="history-filters">{([['all', 'Tous'], ['love', '👍 À refaire'], ['okay', '😐 Bof'], ['no', '👎 Non']] as const).map(([id, label]) => <button key={id} className={filter === id ? "active" : ""} onClick={() => setFilter(id)}>{label}</button>)}</div>
    <div className="history-list">{visible.length ? visible.map((meal) => <article key={meal.id}>
      <div className="history-date">{new Date(meal.eatenAt + "T12:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</div>
      <div><h3>{meal.meal}</h3><p>{meal.people} personne{meal.people > 1 ? "s" : ""}</p></div>
      <div className="meal-rating" aria-label={`Avis sur ${meal.meal}`}><button className={(meal.rating || 3) === 3 ? "selected" : ""} onClick={() => rate(meal, 3)} aria-label="À refaire">👍</button><button className={meal.rating === 2 ? "selected" : ""} onClick={() => rate(meal, 2)} aria-label="Bof">😐</button><button className={meal.rating === 1 ? "selected" : ""} onClick={() => rate(meal, 1)} aria-label="Non">👎</button></div>
      <button className="history-delete" onClick={() => remove(meal)} aria-label={`Supprimer ${meal.meal} de l’historique`} title="Supprimer"><Trash2 size={18} /></button>
    </article>) : <div className="empty"><History /><h3>{meals.length ? "Aucun repas dans ce filtre" : "Notre carnet est encore vide"}</h3><p>{meals.length ? "Choisis un autre avis pour retrouver davantage de repas." : "Les repas que vous notez apparaîtront ici."}</p></div>}</div>
    <button className="eat-out" onClick={markOutside}><span>🍽️</span><b>Ce soir, on mange dehors ou on commande</b><small>Retirer ce repas du menu et des courses</small></button>
  </section>;
}
