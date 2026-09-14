"use client";

import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { ChevronRight, Clock3, Heart } from "lucide-react";
import type { Recipe } from "../lib/app-types";

export function PageTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return <div className="intro-row">
    <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>
    {action}
  </div>;
}

export function RecipeTile({ recipe, favorite, photoStyle, onOpen, onFavorite, onEdit, onDelete }: {
  recipe: Recipe;
  favorite: boolean;
  photoStyle: CSSProperties;
  onOpen: () => void;
  onFavorite: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [swipeX, setSwipeX] = useState(0);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const didSwipe = useRef(false);
  const beginSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    swipeStart.current = { x: event.clientX, y: event.clientY };
    didSwipe.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!swipeStart.current) return;
    const dx = event.clientX - swipeStart.current.x;
    const dy = event.clientY - swipeStart.current.y;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) return;
    if (Math.abs(dx) > 8) didSwipe.current = true;
    setSwipeX(Math.max(-104, Math.min(104, dx)));
  };
  const finishSwipe = () => {
    const action = Math.abs(swipeX) >= 76 ? (swipeX > 0 ? onEdit : onDelete) : null;
    swipeStart.current = null;
    setSwipeX(0);
    if (action) action();
    window.setTimeout(() => { didSwipe.current = false; }, 0);
  };
  return <article className="recipe-swipe">
    <span className="recipe-swipe-action edit" aria-hidden="true">Modifier</span>
    <span className="recipe-swipe-action delete" aria-hidden="true">Supprimer</span>
    <div className="recipe-swipe-content" style={{ transform: `translateX(${swipeX}px)` }} onPointerDown={beginSwipe} onPointerMove={moveSwipe} onPointerUp={finishSwipe} onPointerCancel={finishSwipe}>
      <button className={`heart ${favorite ? "active" : ""}`} aria-label="Mettre en favori" onClick={(event) => { if (didSwipe.current) event.preventDefault(); else onFavorite(); }}><Heart /></button>
      <button className="recipe-open" onClick={(event) => { if (didSwipe.current) event.preventDefault(); else onOpen(); }}>
        <div className="recipe-tile-head">
          <span className="recipe-tile-photo" role="img" aria-label={`Photo de ${recipe.name}`} style={photoStyle} />
          <span><small><Clock3 size={14} /> {recipe.time} min</small><h4>{recipe.name}</h4></span>
        </div>
        {recipe.themes?.length ? <span className="recipe-theme-tags">{recipe.themes.slice(0, 3).map((theme) => <small key={theme}>{theme}</small>)}</span> : null}
        <p>{recipe.ingredients.slice(0, 3).join(" · ")}</p>
        <b>Voir la recette <ChevronRight size={15} /></b>
      </button>
    </div>
  </article>;
}
