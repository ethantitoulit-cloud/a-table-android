"use client";

import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from "react";
import { Check, ChefHat, ChevronRight, Clock3, Flame, Heart, Plus, Sparkles, Star, X } from "lucide-react";
import type { Recipe } from "../lib/app-types";

export type RecipeDraft = {
  name: string;
  time: string;
  servings: string;
  course: "entrée" | "plat" | "dessert" | "autre";
  ingredients: string;
  steps: string;
  seasonings: string;
  themes: NonNullable<Recipe["themes"]>;
};

export function RecipeDetailHeader({ recipe, favorite, photoStyle, close, toggleFavorite, children }: {
  recipe: Recipe;
  favorite: boolean;
  photoStyle: CSSProperties;
  close: () => void;
  toggleFavorite: () => void;
  children?: ReactNode;
}) {
  return <>
    <button className="close" onClick={close}><X /></button>
    <button className={`detail-heart ${favorite ? "active" : ""}`} onClick={toggleFavorite}><Heart />{favorite ? "Dans mes favoris" : "Ajouter aux favoris"}</button>
    <div className="recipe-detail-photo" role="img" aria-label={`Photo de ${recipe.name}`} style={photoStyle} />
    <h2>{recipe.name}</h2>
    {children}
    {!recipe.simpleFood && <div className="recipe-detail-meta">
      <span><Clock3 /><small>Préparation</small><b>{Math.max(5, Math.round(recipe.time * .35))} min</b></span>
      <span><Flame /><small>Cuisson</small><b>{Math.max(0, Math.round(recipe.time * .65))} min</b></span>
      <span><Star /><small>Difficulté</small><b>{recipe.time <= 25 ? "Facile" : recipe.time <= 50 ? "Moyenne" : "Élaborée"}</b></span>
    </div>}
  </>;
}

export function RecipePortions({ people, changePeople, leftoverParts, changeLeftovers, utensils, hasBatch }: {
  people: number;
  changePeople: (people: number) => void;
  leftoverParts?: number;
  changeLeftovers?: (parts: number) => void;
  utensils?: string[];
  hasBatch: boolean;
}) {
  return <>
    <div className="recipe-portions"><b>Recette pour</b><button onClick={() => changePeople(people - 1)} disabled={people <= 1}>−</button><strong>{people}</strong><button onClick={() => changePeople(people + 1)} disabled={people >= 12}>+</button><span>personne{people > 1 ? "s" : ""}</span></div>
    {leftoverParts !== undefined && changeLeftovers && <div className={`recipe-leftovers ${leftoverParts ? "active" : ""}`}><span><b>Parts à garder</b><small>Enregistrées automatiquement au réfrigérateur</small></span><button onClick={() => changeLeftovers(leftoverParts - 1)} disabled={leftoverParts === 0}>−</button><strong>{leftoverParts}</strong><button onClick={() => changeLeftovers(leftoverParts + 1)} disabled={leftoverParts === 3}>+</button></div>}
    {utensils && <div className="utensil-box"><b>Ustensiles</b><span>{utensils.join(" · ")}</span></div>}
    {hasBatch && <div className="batch-ready"><Check /> Des préparations du batch cooking sont déjà prêtes.</div>}
  </>;
}

export type IngredientRow = {
  originalName: string;
  effectiveName: string;
  omitted: boolean;
  owned: boolean;
  batchReady: boolean;
  quantity: string;
  availability: string;
};

export type SeasoningRow = { name: string; owned: boolean };

export function RecipeIngredients({ ingredients, seasonings, substitutionTarget, substitutionIngredient, setSubstitutionIngredient, chooseIngredient, setUsedQuantity, restoreIngredient, startSubstitution, toggleIngredient, confirmSubstitution, cancelSubstitution, temporaryIngredient, setTemporaryIngredient, addTemporaryIngredient, removeSeasoning, temporarySeasoning, setTemporarySeasoning, addTemporarySeasoning }: {
  ingredients: IngredientRow[];
  seasonings: SeasoningRow[];
  substitutionTarget: string | null;
  substitutionIngredient: string;
  setSubstitutionIngredient: (value: string) => void;
  chooseIngredient: (name: string) => void;
  setUsedQuantity: (name: string, value: string) => void;
  restoreIngredient: (name: string) => void;
  startSubstitution: (name: string) => void;
  toggleIngredient: (name: string, omitted: boolean) => void;
  confirmSubstitution: (name: string) => void;
  cancelSubstitution: () => void;
  temporaryIngredient: string;
  setTemporaryIngredient: (value: string) => void;
  addTemporaryIngredient: () => void;
  removeSeasoning: (name: string) => void;
  temporarySeasoning: string;
  setTemporarySeasoning: (value: string) => void;
  addTemporarySeasoning: () => void;
}) {
  return <details open className="recipe-detail-section"><summary>À prévoir</summary>
    <p className="ingredient-help">Tu peux retirer ou remplacer un ingrédient uniquement pour ce repas.</p>
    <ul className="ingredient-list">{ingredients.map((ingredient) => <li key={ingredient.originalName} className={ingredient.omitted ? "omitted" : ingredient.owned ? "owned" : "missing"} onClick={() => !ingredient.omitted && chooseIngredient(ingredient.effectiveName)}>
      {ingredient.omitted ? <X /> : ingredient.owned ? <Check /> : <Plus />}
      <span>{ingredient.originalName !== ingredient.effectiveName ? <><s>{ingredient.originalName}</s> → <b>{ingredient.effectiveName}</b></> : ingredient.originalName}
        {ingredient.batchReady && !ingredient.omitted && <em className="batch-ingredient">Prêt en batch</em>}
        {!ingredient.omitted && <><label className="used-quantity" onClick={(event) => event.stopPropagation()}>Quantité utilisée<input value={ingredient.quantity} onChange={(event) => setUsedQuantity(ingredient.effectiveName, event.target.value)} /></label><small>{ingredient.availability}</small></>}
        {ingredient.omitted && <small>Retiré pour cette fois</small>}
      </span>
      <div className="ingredient-actions" onClick={(event) => event.stopPropagation()}>{!ingredient.omitted && (ingredient.originalName !== ingredient.effectiveName ? <button onClick={() => restoreIngredient(ingredient.originalName)}>Annuler remplacement</button> : <button onClick={() => startSubstitution(ingredient.originalName)}>Remplacer</button>)}<button aria-label={ingredient.omitted ? `Remettre ${ingredient.originalName}` : `Retirer ${ingredient.originalName}`} onClick={() => toggleIngredient(ingredient.originalName, ingredient.omitted)}>{ingredient.omitted ? "Remettre" : "Retirer"}</button></div>
      {substitutionTarget === ingredient.originalName && !ingredient.omitted && <div className="ingredient-substitution" onClick={(event) => event.stopPropagation()}><input autoFocus value={substitutionIngredient} onChange={(event) => setSubstitutionIngredient(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") confirmSubstitution(ingredient.originalName); }} placeholder={`Remplacer ${ingredient.originalName} par…`} /><button className="primary" onClick={() => confirmSubstitution(ingredient.originalName)} disabled={!substitutionIngredient.trim()}>Valider</button><button onClick={cancelSubstitution}>Annuler</button></div>}
    </li>)}</ul>
    <div className="temporary-add"><input value={temporaryIngredient} onChange={(event) => setTemporaryIngredient(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addTemporaryIngredient(); }} placeholder="Ajouter un ingrédient pour cette fois" /><button className="outline" onClick={addTemporaryIngredient} disabled={!temporaryIngredient.trim()}><Plus /> Ajouter</button></div>
    <aside className="seasoning-box"><div><Sparkles /><span><b>Assaisonnement</b><small>À ajuster selon vos goûts</small></span></div><div>{seasonings.map((seasoning) => <span key={seasoning.name} className={`seasoning-pill ${seasoning.owned ? "owned" : "missing"}`}><button onClick={() => chooseIngredient(seasoning.name)}>{seasoning.owned ? <Check /> : <Plus />} {seasoning.name}</button><button aria-label={`Retirer ${seasoning.name} pour cette fois`} onClick={() => removeSeasoning(seasoning.name)}><X /></button></span>)}</div><div className="temporary-add seasoning-add"><input value={temporarySeasoning} onChange={(event) => setTemporarySeasoning(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addTemporarySeasoning(); }} placeholder="Ajouter une épice pour cette fois" /><button onClick={addTemporarySeasoning} disabled={!temporarySeasoning.trim()}><Plus /> Ajouter</button></div></aside>
  </details>;
}

export function RecipeEditor({ draft, setDraft, changePhoto, cancel, save }: {
  draft: RecipeDraft;
  setDraft: Dispatch<SetStateAction<RecipeDraft>>;
  changePhoto: (file?: File) => void;
  cancel: () => void;
  save: () => void;
}) {
  const update = <Key extends keyof RecipeDraft>(key: Key, value: RecipeDraft[Key]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return <div className="recipe-editor">
    <label>Nom<input value={draft.name} onChange={(event) => update("name", event.target.value)} /></label>
    <div><label>Durée (min)<input type="number" min="1" value={draft.time} onChange={(event) => update("time", event.target.value)} /></label><label>Portions<input type="number" min="1" value={draft.servings} onChange={(event) => update("servings", event.target.value)} /></label></div>
    <label>Catégorie<select value={draft.course} onChange={(event) => update("course", event.target.value as RecipeDraft["course"])}><option value="entrée">Entrée</option><option value="plat">Plat</option><option value="dessert">Dessert</option><option value="autre">Autres</option></select></label>
    <fieldset className="recipe-theme-editor"><legend>Classement dans la banque</legend><small>Tu peux sélectionner plusieurs mots-clés.</small><div>{([['local', 'Produits locaux'], ['rapide', 'Rapide'], ['léger', 'Légère'], ['monde', 'Cuisine du monde'], ['original', 'Originale']] as const).map(([id, label]) => <label key={id} className={draft.themes.includes(id) ? "active" : ""}><input type="checkbox" checked={draft.themes.includes(id)} onChange={(event) => update("themes", event.target.checked ? [...new Set([...draft.themes, id])] : draft.themes.filter((theme) => theme !== id))} />{label}</label>)}</div></fieldset>
    <label className="recipe-photo-input">Photo de la recette<input type="file" accept="image/*" onChange={(event) => changePhoto(event.target.files?.[0])} /><small>Choisis une photo depuis ton appareil. Elle remplacera l’image actuelle.</small></label>
    <label>Ingrédients — un par ligne<textarea value={draft.ingredients} onChange={(event) => update("ingredients", event.target.value)} /></label>
    <label>Étapes — une par ligne<textarea value={draft.steps} onChange={(event) => update("steps", event.target.value)} /></label>
    <label>Sel, poivre et épices<textarea value={draft.seasonings} onChange={(event) => update("seasonings", event.target.value)} /></label>
    <div className="recipe-editor-actions"><button className="outline" onClick={cancel}>Annuler</button><button className="primary" onClick={save}>Enregistrer</button></div>
  </div>;
}

export function RecipePreparation({ steps, source, guidedStep, setGuidedStep, timerStarted, timerStartSeconds, timerSeconds, startTimer, changeTimer, openTimer, timerLabel, finish }: {
  steps: string[];
  source?: string;
  guidedStep: number | null;
  setGuidedStep: Dispatch<SetStateAction<number | null>>;
  timerStarted: boolean;
  timerStartSeconds: number;
  timerSeconds: number;
  startTimer: () => void;
  changeTimer: (seconds: number) => void;
  openTimer: () => void;
  timerLabel: (seconds: number) => string;
  finish: () => void;
}) {
  return <details open className="recipe-detail-section"><summary>Préparation</summary>
    {guidedStep === null ? <>
      {steps.length ? <><ol className="steps">{steps.map((step) => <li key={step}>{step}</li>)}</ol><button className="outline wide" onClick={() => setGuidedStep(0)}><ChefHat /> Cuisiner pas à pas</button></> : <p className="ingredient-help">Aucune étape de préparation ne reste après tes modifications.</p>}
      {source && <a className="recipe-source" href={source} target="_blank" rel="noreferrer">Voir la recette originale sur {new URL(source).hostname.replace(/^www\./, "")} <ChevronRight size={15} /></a>}
    </> : <div className="guided-cooking">
      <div className="guided-progress" aria-label={`Étape ${guidedStep + 1} sur ${steps.length}`}><span style={{ width: `${((guidedStep + 1) / steps.length) * 100}%` }} /></div>
      <p>ÉTAPE {guidedStep + 1} SUR {steps.length}</p><strong>{steps[guidedStep]}</strong>
      <div className="step-timer">{!timerStarted ? <><button onClick={startTimer}><Clock3 /> Lancer {timerLabel(timerStartSeconds)}</button><span><button aria-label="Retirer une minute" onClick={() => changeTimer(Math.max(60, timerStartSeconds - 60))}>−</button><button aria-label="Ajouter une minute" onClick={() => changeTimer(timerStartSeconds + 60)}>+</button></span></> : <button className="timer-running-line" onClick={openTimer}><Check size={16} /> Minuteur lancé · {timerSeconds === 0 ? "terminé" : `${timerLabel(timerSeconds)} restantes`}</button>}</div>
      <div><button className="outline" disabled={guidedStep === 0} onClick={() => setGuidedStep((step) => Math.max(0, (step || 0) - 1))}>Précédente</button>{guidedStep < steps.length - 1 ? <button className="primary" onClick={() => setGuidedStep((step) => (step || 0) + 1)}>Étape suivante <ChevronRight /></button> : <button className="primary" onClick={finish}><Check /> Repas terminé</button>}</div>
      <button className="guided-exit" onClick={() => setGuidedStep(null)}>Voir toute la recette</button>
    </div>}
  </details>;
}
