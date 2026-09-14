"use client";

import type { RefObject } from "react";
import { BookOpen, CalendarDays, ChefHat, Ellipsis, History, Refrigerator, ShoppingBasket, Users } from "lucide-react";

export type AppView = "soir" | "semaine" | "recettes" | "stocks" | "courses" | "famille" | "historique";

export function AppNavigation({ view, canEdit, saveStatus, dataStatus, moreOpen, fileRef, navigate, toggleMore, scanFile }: {
  view: AppView;
  canEdit: boolean | null;
  saveStatus: "idle" | "saving" | "saved" | "error";
  dataStatus: "loading" | "ready" | "error";
  moreOpen: boolean;
  fileRef: RefObject<HTMLInputElement | null>;
  navigate: (view: AppView) => void;
  toggleMore: () => void;
  scanFile: (file?: File) => void;
}) {
  const tabs = [
    ["soir", ChefHat, "À table"], ["semaine", CalendarDays, "La semaine"], ["recettes", BookOpen, "Recettes"], ["stocks", Refrigerator, "Réserves"], ["courses", ShoppingBasket, "Courses"],
  ] as const;
  return <>
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><ChefHat /></div><div><h1>À table !</h1><p>Enfin la réponse à « Qu’est-ce qu’on mange ? »</p></div></div>
      {canEdit === false && <a className="read-only-badge" href="/signin-with-chatgpt?return_to=/" target="_top">Consultation uniquement · Se connecter pour modifier</a>}
      {saveStatus !== "idle" && <span className={`save-status ${saveStatus}`} role="status">{saveStatus === "saving" ? "Enregistrement…" : saveStatus === "saved" ? "Enregistré" : "Non enregistré — réessayer"}</span>}
      <input ref={fileRef} className="sr-only" type="file" aria-label="Photo des courses à scanner" accept="image/*,application/pdf" capture="environment" onChange={(event) => scanFile(event.target.files?.[0])} />
    </header>
    <nav className="nav-tabs">
      {tabs.map(([id, Icon, label]) => <button key={id} className={view === id ? "active" : ""} onClick={() => navigate(id)}><Icon size={18} /><span className="nav-label">{label}</span></button>)}
      <div className="nav-more"><button className={view === "famille" || view === "historique" ? "active" : ""} onClick={toggleMore} aria-expanded={moreOpen}><Ellipsis size={20} /><span className="nav-label">Plus</span></button>{moreOpen && <div className="nav-more-menu"><button onClick={() => navigate("famille")}><Users size={18} /> Personnes</button><button onClick={() => navigate("historique")}><History size={18} /> On aime !</button></div>}</div>
    </nav>
    {dataStatus !== "ready" && <div className={`data-status ${dataStatus}`} role="status">{dataStatus === "loading" ? "Chargement de tes données…" : <><span>Connexion aux données impossible.</span><button onClick={() => window.location.reload()}>Réessayer</button></>}</div>}
  </>;
}
