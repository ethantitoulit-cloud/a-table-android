import type { Dispatch, SetStateAction } from "react";
import type { Item } from "./app-domain";
import { formatMeasure, sameIngredient } from "./app-domain";
import { inventoryMeasure } from "./inventory-measures";
import { recognizeReceiptFile, receiptProducts, scanRowsFromText, type ReceiptScanRow } from "./receipt-scanner";

type Context = {
  items: Item[];
  scanRows: ReceiptScanRow[];
  setItems: Dispatch<SetStateAction<Item[]>>;
  setScanRows: Dispatch<SetStateAction<ReceiptScanRow[]>>;
  setScanImage: Dispatch<SetStateAction<string | null>>;
  setScanStatus: Dispatch<SetStateAction<string>>;
  setModal: Dispatch<SetStateAction<"scan" | "item" | "shopping" | "person" | null>>;
  setView: (view: "stocks") => void;
  flash: (message: string) => void;
};

export function createReceiptScanActions(context: Context) {
  const { items, scanRows, setItems, setScanRows, setScanImage, setScanStatus, setModal, setView, flash } = context;

  async function scanFile(file?: File) {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    setScanImage((current) => {
      if (current) URL.revokeObjectURL(current);
      return isPdf ? null : URL.createObjectURL(file);
    });
    setModal("scan");
    setScanStatus("Lecture de la photo…");
    try {
      const text = await recognizeReceiptFile(file, setScanStatus);
      const products = receiptProducts(text);
      setScanRows(scanRowsFromText(products.text));
      setScanStatus(products.text ? `J’ai préparé la liste alimentaire${products.excluded ? ` et écarté ${products.excluded} produit${products.excluded > 1 ? "s" : ""} non alimentaire${products.excluded > 1 ? "s" : ""}` : ""}. Vérifie-la avant de l’ajouter.` : "Photo trop difficile à lire : rapproche-toi jusqu’à ce que le ticket remplisse presque tout l’écran, pose-le bien à plat et évite les ombres.");
    } catch (error) {
      console.error("Receipt OCR failed", error);
      setScanStatus("La lecture a échoué. Reprends la photo de plus près, bien à plat et sans ombre.");
    }
  }

  function closeReceiptScan() {
    setModal(null);
    setScanImage((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }

  async function importScan() {
    const rows = scanRows.filter((row) => row.name.trim());
    let workingItems = [...items];
    const changed = new Map<string, Item>();
    for (const row of rows) {
      const name = row.name.trim();
      const existing = workingItems.find((item) => sameIngredient(item.name, name));
      const targetUnit: "g" | "ml" | "unité" = /\b(?:kg|g)\b/i.test(`${existing?.quantity || ""} ${row.quantity}`) ? "g" : /\b(?:l|cl|ml)\b/i.test(`${existing?.quantity || ""} ${row.quantity}`) ? "ml" : "unité";
      const existingMeasure = existing && inventoryMeasure(existing, targetUnit);
      const incomingMeasure = inventoryMeasure({ quantity: row.quantity || "1" }, targetUnit);
      const mergedQuantity = existing && existingMeasure && incomingMeasure ? formatMeasure({ amount: existingMeasure.amount + incomingMeasure.amount, unit: targetUnit }) : existing ? `${existing.quantity} + ${row.quantity || "1"}` : row.quantity || "1";
      const temp = { id: existing?.id || -Date.now() - Math.random(), name, quantity: mergedQuantity, zone: row.zone };
      const changeKey = existing?.id && existing.id > 0 ? `id:${existing.id}` : `name:${name.toLocaleLowerCase("fr-FR")}`;
      changed.set(changeKey, temp);
      workingItems = existing
        ? workingItems.map((item) => item.id === existing.id ? temp : item)
        : [temp, ...workingItems];
    }
    if (!changed.size) {
      setScanStatus("Aucun produit à importer.");
      return;
    }
    setScanStatus(`Enregistrement de ${changed.size} produit${changed.size > 1 ? "s" : ""}…`);
    const response = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [...changed.values()].map((item) => ({ ...item, id: item.id > 0 ? item.id : undefined })) }),
    }).catch(() => null);
    const data = response ? await response.json().catch(() => ({})) as { items?: Item[] } : {};
    if (!response?.ok || !Array.isArray(data.items)) {
      setScanStatus("L’import n’a pas fonctionné. Vérifie la connexion puis réessaie.");
      return;
    }
    const updatedCount = [...changed.values()].filter((item) => item.id > 0).length;
    const savedCount = changed.size - updatedCount;
    setItems(data.items);
    closeReceiptScan();
    setScanRows([]);
    setView("stocks");
    flash(`${savedCount} ajouté${savedCount > 1 ? "s" : ""}${updatedCount ? ` · ${updatedCount} fusionné${updatedCount > 1 ? "s" : ""}` : ""}`);
  }

  return { scanFile, closeReceiptScan, importScan };
}
