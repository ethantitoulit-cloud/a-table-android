"use client";

import { AlertTriangle, Camera, Flame, IceCreamBowl, PackageOpen, Plus, Refrigerator, Search, Trash2 } from "lucide-react";
import { isReproducibleQuantity } from "../../lib/inventory-measures";
import type { InventoryZone } from "../../lib/receipt-scanner";
import { PageTitle } from "../recipe-tile";

export type InventoryItem = { id: number; name: string; quantity: string; zone: InventoryZone; expires?: string | null };
type Expiry = { level: string; label: string } | null;

const zones = {
  frigo: { label: "Réfrigérateur", icon: Refrigerator },
  congelateur: { label: "Congélateur", icon: IceCreamBowl },
  "garde-manger": { label: "Placard", icon: PackageOpen },
  epices: { label: "Épices & essentiels", icon: Flame },
};
const normalized = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function InventoryView({ items, expiringCount, query, zone, setQuery, setZone, scan, addLeftover, addItem, editItem, removeItem, expiryInfo }: {
  items: InventoryItem[];
  expiringCount: number;
  query: string;
  zone: InventoryZone | "tous";
  setQuery: (value: string) => void;
  setZone: (value: InventoryZone | "tous") => void;
  scan: () => void;
  addLeftover: () => void;
  addItem: () => void;
  editItem: (item: InventoryItem) => void;
  removeItem: (id: number) => void;
  expiryInfo: (expires?: string | null) => Expiry;
}) {
  return <section className="content">
    <PageTitle eyebrow="FRIGO · CONGÉLATEUR · PLACARD · ÉPICES" title="Ce qu’il y a à la maison" action={<div className="page-action-group">
      <button className="outline stock-scan-action" onClick={scan}><Camera size={17} /> Scanner la liste</button>
      <button className="outline" onClick={addLeftover}>Un reste</button>
      <button className="primary" onClick={addItem}><Plus size={17} /> Ajouter</button>
    </div>} />
    {expiringCount > 0 && <button className="expiry-alert" onClick={() => { setZone("tous"); setQuery(""); }}><AlertTriangle size={20} /><span><b>{expiringCount} produit{expiringCount > 1 ? "s" : ""} à vérifier</b><small>À consommer rapidement ou date dépassée</small></span></button>}
    <div className="stock-toolbar">
      <label><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Chercher un produit" /></label>
      <div className="zone-filters">
        <button className={zone === "tous" ? "active" : ""} onClick={() => setZone("tous")}>Tout</button>
        {Object.entries(zones).map(([key, meta]) => <button key={key} className={zone === key ? "active" : ""} onClick={() => setZone(key as InventoryZone)}>{meta.label}</button>)}
      </div>
    </div>
    <div className="inventory-grid">{items.map((item) => {
      const meta = zones[item.zone];
      const Icon = meta.icon;
      const expiry = expiryInfo(item.expires);
      return <article className="inventory-item tappable" key={item.id} onClick={() => editItem(item)}>
        <div className="zone-icon"><Icon /></div>
        <div><h3>{item.name}</h3><p>{item.quantity} · {meta.label}</p>
          {!isReproducibleQuantity(item.quantity) && <span className="quantity-warning"><AlertTriangle size={13} /> Quantité à préciser</span>}
          {/\b(environ|approximativement|presque)\b/.test(normalized(item.quantity)) && <span className="quantity-estimate">Estimation prudente : 90 % comptés</span>}
          {expiry && <span className={`expiry ${expiry.level}`}>{expiry.label}</span>}
        </div>
        <button onClick={(event) => { event.stopPropagation(); removeItem(item.id); }} aria-label={`Supprimer ${item.name}`}><Trash2 size={17} /></button>
      </article>;
    })}</div>
  </section>;
}
