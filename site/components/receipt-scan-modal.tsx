"use client";

import { Camera, Plus, Trash2, X } from "lucide-react";
import { INVENTORY_ZONE_LABELS, type InventoryZone, type ReceiptScanRow } from "../lib/receipt-scanner";

type Props = {
  image: string | null;
  status: string;
  rows: ReceiptScanRow[];
  onRowsChange: (rows: ReceiptScanRow[]) => void;
  onClose: () => void;
  onImport: () => void;
};

export function ReceiptScanModal({ image, status, rows, onRowsChange, onClose, onImport }: Props) {
  const update = (id: string, patch: Partial<ReceiptScanRow>) => onRowsChange(rows.map((row) => row.id === id ? { ...row, ...patch } : row));
  return <div className="modal-backdrop">
    <section className="scan-modal">
      <button className="close" onClick={onClose} aria-label="Fermer"><X /></button>
      <div className="modal-icon"><Camera /></div>
      <p className="eyebrow">COURSES DÉJÀ FAITES</p>
      <h2>Ajouter les achats aux réserves</h2>
      <p className="scan-intro">Cette liste ne sera pas ajoutée aux courses à faire : les produits validés iront directement dans tes réserves.</p>
      <p className="scan-status">{status}</p>
      {/* A local blob preview cannot be optimized by next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {image && <img className="scan-thumb" src={image} alt="Liste photographiée" />}
      {rows.length > 0 && <div className="scan-product-editor">
        <div className="scan-product-heading"><b>Produits reconnus</b><small>Corrige avant d’ajouter</small></div>
        {rows.map((row) => <div className="scan-product-row" key={row.id}>
          <label>Produit<input value={row.name} onChange={(event) => update(row.id, { name: event.target.value })} /></label>
          <label>Quantité<input value={row.quantity} onChange={(event) => update(row.id, { quantity: event.target.value })} /></label>
          <label>Rangement<select value={row.zone} onChange={(event) => update(row.id, { zone: event.target.value as InventoryZone })}>{Object.entries(INVENTORY_ZONE_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <button aria-label={`Supprimer ${row.name}`} onClick={() => onRowsChange(rows.filter((item) => item.id !== row.id))}><Trash2 size={18} /></button>
          {row.uncertain && <small className="scan-uncertain">Quantité à vérifier</small>}
        </div>)}
        <button className="outline scan-add-row" onClick={() => onRowsChange([...rows, { id: `${Date.now()}`, name: "", quantity: "1", zone: "garde-manger" }])}><Plus size={17} /> Ajouter une ligne</button>
      </div>}
      <div className="modal-actions">
        <button className="outline" onClick={onClose}>Annuler</button>
        <button className="primary" disabled={!rows.some((row) => row.name.trim())} onClick={onImport}>Ajouter aux réserves</button>
      </div>
    </section>
  </div>;
}
