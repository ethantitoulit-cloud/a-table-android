"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { Clock3, Trash2, X } from "lucide-react";
import type { PendingScannedProduct } from "../lib/purchase-scanner-actions";
import { INVENTORY_ZONE_LABELS, type InventoryZone } from "../lib/receipt-scanner";

export type UnknownProduct = { barcode: string; name: string; quantity: string };
export type FeedbackMeal = { id: number; meal: string; people: number; eatenAt: string; rating: number };

export function MealFeedbackModal({ meal, close, rate }: { meal: FeedbackMeal; close: () => void; rate: (rating: 1 | 2 | 3) => void }) {
  return <div className="modal-backdrop" onClick={close}><section className="scan-modal meal-feedback" onClick={(event) => event.stopPropagation()}><button className="close" aria-label="Fermer" onClick={close}><X /></button><p className="eyebrow">APRÈS LE REPAS</p><h2>On garde cette recette ?</h2><p>{meal.meal}</p><div className="feedback-choices"><button onClick={() => rate(3)}><span>👍</span><b>À refaire</b></button><button onClick={() => rate(2)}><span>😐</span><b>Bof</b></button><button onClick={() => rate(1)}><span>👎</span><b>Non</b></button></div><small>Sans réponse, la recette est considérée comme « À refaire ». Tu pourras modifier cet avis dans l’historique.</small></section></div>;
}

export function PurchaseScannerModal({ videoRef, status, product, products, setProduct, setProducts, close, ignore, save, validate }: {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: string;
  product: UnknownProduct | null;
  products: PendingScannedProduct[];
  setProduct: Dispatch<SetStateAction<UnknownProduct | null>>;
  setProducts: Dispatch<SetStateAction<PendingScannedProduct[]>>;
  close: () => void;
  ignore: () => void;
  save: () => void;
  validate: () => void;
}) {
  return <div className="modal-backdrop purchase-scanner-backdrop"><section className="scan-modal purchase-scanner-modal" aria-modal="true" role="dialog" aria-labelledby="purchase-scanner-title">
    <button className="close" onClick={close} aria-label="Fermer le scanner"><X /></button><p className="eyebrow">SCAN DES ACHATS</p><h2 id="purchase-scanner-title">Présente un code-barres</h2>
    <div className="purchase-camera"><video ref={videoRef} autoPlay muted playsInline /><span className="purchase-scan-frame" aria-hidden="true" /></div>
    <p className="purchase-scanner-status" aria-live="polite">{status}</p>
    {product && <div className="unknown-product-form"><b>Produit inconnu</b><label>Nom du produit<input autoFocus value={product.name} onChange={(event) => setProduct((current) => current ? { ...current, name: event.target.value } : current)} placeholder="Ex. Yaourt coco" /></label><label>Poids ou quantité<input value={product.quantity} onChange={(event) => setProduct((current) => current ? { ...current, quantity: event.target.value } : current)} placeholder="Ex. 4 × 125 g" /></label><div><button className="outline" onClick={ignore}>Ignorer</button><button className="primary" onClick={save} disabled={!product.name.trim()}>Ajouter</button></div></div>}
    <div className="scanned-products"><div className="scanned-products-heading"><b>Articles scannés</b><span>{products.length}</span></div>
      {products.length === 0 ? <p className="scanned-products-empty">Les produits apparaîtront ici avant d’être ajoutés aux réserves.</p> : products.map((item) => <div className="scanned-product" key={item.id}>
        <input aria-label="Nom de l’article" value={item.name} onChange={(event) => setProducts((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, name: event.target.value } : candidate))} />
        <input aria-label={`Quantité de ${item.name}`} value={item.quantity} onChange={(event) => setProducts((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, quantity: event.target.value } : candidate))} />
        <select aria-label={`Rangement de ${item.name}`} value={item.zone} onChange={(event) => setProducts((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, zone: event.target.value as InventoryZone } : candidate))}>
          {(["frigo", "congelateur", "garde-manger", "epices"] as InventoryZone[]).map((zone) => <option value={zone} key={zone}>{INVENTORY_ZONE_LABELS[zone]}</option>)}
        </select>
        <button aria-label={`Supprimer ${item.name}`} onClick={() => setProducts((current) => current.filter((candidate) => candidate.id !== item.id))}><Trash2 size={18} /></button>
      </div>)}</div>
    <button className="primary purchase-scanner-validate" onClick={validate} disabled={!products.length || products.some((item) => !item.name.trim())}>Valider {products.length ? `${products.length} article${products.length > 1 ? "s" : ""}` : "les articles"}</button>
    <button className="outline purchase-scanner-finish" onClick={close}>{products.length ? "Annuler et fermer" : "Fermer"}</button>
  </section></div>;
}

export function FloatingTimer({ recipeName, seconds, initialSeconds, running, open, setOpen, setSeconds, setInitialSeconds, setRunning, stop }: {
  recipeName?: string;
  seconds: number;
  initialSeconds: number;
  running: boolean;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setSeconds: Dispatch<SetStateAction<number>>;
  setInitialSeconds: Dispatch<SetStateAction<number>>;
  setRunning: Dispatch<SetStateAction<boolean>>;
  stop: () => void;
}) {
  const label = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return <aside className={`floating-timer ${open ? "open" : ""} ${seconds === 0 ? "finished" : ""}`} aria-live="polite">
    <button className="floating-timer-summary" onClick={() => setOpen((value) => !value)} aria-expanded={open}><Clock3 size={18} /><span><small>{recipeName || "Cuisson"}</small><b>{seconds === 0 ? "Terminé" : label}</b></span></button>
    {open && <div className="floating-timer-controls"><button onClick={() => { if (seconds === 0) { setSeconds(initialSeconds); setRunning(true); } else setRunning((value) => !value); }}>{running ? "Pause" : seconds === 0 ? "Recommencer" : "Reprendre"}</button><button onClick={() => { setSeconds((value) => value + 60); setInitialSeconds((value) => value + 60); }}>+ 1 min</button><button onClick={() => { setSeconds((value) => value + 300); setInitialSeconds((value) => value + 300); }}>+ 5 min</button><button onClick={stop}>Annuler</button></div>}
  </aside>;
}
