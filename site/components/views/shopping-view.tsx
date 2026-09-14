"use client";

import { useRef, type Dispatch, type KeyboardEvent, type SetStateAction } from "react";
import { Plus, Printer, ScanLine, Share2, ShoppingBasket, Trash2, X } from "lucide-react";
import { PageTitle } from "../recipe-tile";

export type ShoppingItem = { id: number; name: string; quantity: string; checked: boolean; pending?: boolean };

export function ShoppingView({ form, setForm, items, groupedItems, boughtItems, addItem, editItem, removeItem, checkItem, clearBought, scan, share }: {
  form: { name: string; quantity: string };
  setForm: Dispatch<SetStateAction<{ name: string; quantity: string }>>;
  items: ShoppingItem[];
  groupedItems: Array<{ section: string; products: ShoppingItem[] }>;
  boughtItems: ShoppingItem[];
  addItem: () => void;
  editItem: (item: ShoppingItem) => void;
  removeItem: (item: ShoppingItem) => void;
  checkItem: (item: ShoppingItem, checked: boolean) => void;
  clearBought: () => void;
  scan: () => void;
  share: () => void;
}) {
  const swipe = useRef<{ id: number; x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const onEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") { event.preventDefault(); addItem(); }
  };
  return <section className="content">
    <PageTitle eyebrow="RIEN N’EST OUBLIÉ" title="Ma liste de courses" />
    <div className="shopping-tools">
      <button className="primary shopping-main-scan" onClick={scan}><ScanLine size={21} /> Scanner mes achats</button>
      <button className="outline" onClick={() => window.print()}><Printer size={17} /> Imprimer</button>
      <button className="outline" onClick={share}><Share2 size={17} /> Partager</button>
    </div>
    <div className="shopping-add">
      <label>Produit<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} onKeyDown={onEnter} placeholder="Ex. bananes" /></label>
      <label>Quantité<input value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} onKeyDown={onEnter} placeholder="Ex. 1 kg" /></label>
      <button className="primary" onClick={addItem} disabled={!form.name.trim()}><Plus size={17} /> Ajouter aux courses</button>
    </div>
    <div className="shopping-card">{items.length === 0 ? <div className="empty"><ShoppingBasket /><h3>La liste est vide</h3><p>Les produits manquants d’un menu apparaîtront ici.</p></div> : <>
      {groupedItems.map(({ section, products }) => <div className="shopping-section" key={section}><h3>{section}</h3>{products.map((item) => <div className={item.checked ? "done swipe-shopping" : "swipe-shopping"} key={item.id}
        onPointerDown={(event) => { swiped.current = false; swipe.current = { id: item.id, x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }}
        onPointerMove={(event) => { const start = swipe.current; if (!start || start.id !== item.id) return; const dx = event.clientX - start.x; const dy = event.clientY - start.y; if (dx > 0 && Math.abs(dx) > Math.abs(dy)) { if (dx > 10) swiped.current = true; const offset = Math.min(dx, 130); event.currentTarget.style.transform = `translateX(${offset}px)`; event.currentTarget.style.opacity = String(1 - offset / 260); } }}
        onPointerUp={(event) => { const start = swipe.current; swipe.current = null; event.currentTarget.style.transform = ""; event.currentTarget.style.opacity = ""; if (start?.id === item.id && event.clientX - start.x > 80 && Math.abs(event.clientY - start.y) < 70) { event.preventDefault(); removeItem(item); } }}
        onPointerCancel={(event) => { swipe.current = null; event.currentTarget.style.transform = ""; event.currentTarget.style.opacity = ""; }}
        onClick={(event) => { if ((event.target as HTMLElement).closest("button,input")) return; event.preventDefault(); if (swiped.current) { swiped.current = false; return; } editItem(item); }}>
        <input type="checkbox" checked={item.checked} disabled={item.pending} aria-label={`Marquer ${item.name} comme acheté`} onClick={(event) => event.stopPropagation()} onChange={(event) => checkItem(item, event.target.checked)} />
        <span>{item.name}<small>{item.quantity}{item.pending ? " · enregistrement…" : ""}</small></span>
        <button aria-label={`Supprimer ${item.name}`} onClick={(event) => { event.preventDefault(); removeItem(item); }}><X size={16} /></button>
      </div>)}</div>)}
      {boughtItems.length > 0 && <div className="shopping-section shopping-bought"><div className="shopping-bought-heading"><h3>Déjà achetés</h3><button className="outline" onClick={clearBought}><Trash2 size={16} /> Vider les articles achetés</button></div>{boughtItems.map((item) => <div className="done swipe-shopping" key={item.id}><input type="checkbox" checked disabled={item.pending} aria-label={`${item.name} est acheté`} onChange={(event) => checkItem(item, event.target.checked)} /><span>{item.name}<small>{item.quantity}</small></span><button aria-label={`Supprimer ${item.name}`} onClick={() => removeItem(item)}><X size={16} /></button></div>)}</div>}
    </>}</div>
  </section>;
}
