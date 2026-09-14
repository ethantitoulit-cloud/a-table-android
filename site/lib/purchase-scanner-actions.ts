import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { Item, Shop } from "./app-domain";
import { norm } from "./app-domain";
import { inventoryZoneFor, type InventoryZone } from "./receipt-scanner";

export type ManualScannedProduct = { barcode: string; name: string; quantity: string };
export type PendingScannedProduct = ManualScannedProduct & { id: string; zone: InventoryZone };
export type ScanUndo = { inventoryItem: Item; previousShopping: Shop | null; shoppingItem: Shop | null };

type Context = {
  shopping: Shop[];
  manualScannedProduct: ManualScannedProduct | null;
  pendingScannedProducts: PendingScannedProduct[];
  scanUndo: ScanUndo | null;
  purchaseScanBusyRef: MutableRefObject<boolean>;
  lastBarcodeRef: MutableRefObject<{ value: string; at: number } | null>;
  purchaseScannerControlsRef: MutableRefObject<{ stop: () => void } | null>;
  setItems: Dispatch<SetStateAction<Item[]>>;
  setShopping: Dispatch<SetStateAction<Shop[]>>;
  setManualScannedProduct: Dispatch<SetStateAction<ManualScannedProduct | null>>;
  setPendingScannedProducts: Dispatch<SetStateAction<PendingScannedProduct[]>>;
  setScanUndo: Dispatch<SetStateAction<ScanUndo | null>>;
  setPurchaseScannerStatus: Dispatch<SetStateAction<string>>;
  setPurchaseScannerOpen: Dispatch<SetStateAction<boolean>>;
  flash: (message: string) => void;
};

export function createPurchaseScannerActions(context: Context) {
  const {
    shopping, manualScannedProduct, pendingScannedProducts, scanUndo, purchaseScanBusyRef, lastBarcodeRef,
    purchaseScannerControlsRef, setItems, setShopping, setManualScannedProduct,
    setPendingScannedProducts, setScanUndo, setPurchaseScannerStatus, setPurchaseScannerOpen, flash,
  } = context;

  function startShoppingProductScan() {
    purchaseScanBusyRef.current = false;
    lastBarcodeRef.current = null;
    setManualScannedProduct(null);
    setPendingScannedProducts([]);
    setPurchaseScannerStatus("Présente le code-barres face à la caméra");
    setPurchaseScannerOpen(true);
  }

  function closePurchaseScanner() {
    purchaseScannerControlsRef.current?.stop();
    purchaseScannerControlsRef.current = null;
    purchaseScanBusyRef.current = false;
    setManualScannedProduct(null);
    setPendingScannedProducts([]);
    setPurchaseScannerOpen(false);
  }

  function queueScannedProduct(barcode: string, productName: string, suppliedQuantity?: string | null) {
    setPendingScannedProducts((products) => {
      if (products.some((product) => product.barcode === barcode)) return products;
      return [...products, { id: `${barcode}-${Date.now()}`, barcode, name: productName, quantity: suppliedQuantity?.trim() || "1", zone: inventoryZoneFor(productName) }];
    });
    setPurchaseScannerStatus(`${productName} ajouté à la liste ✓ Présente le produit suivant`);
    navigator.vibrate?.(80);
    window.setTimeout(() => {
      setPurchaseScannerStatus("Présente le code-barres suivant");
      purchaseScanBusyRef.current = false;
    }, 650);
  }

  function matchShoppingItem(productName: string) {
      const productWords = new Set(norm(productName).split(/\s+/).filter((word) => word.length >= 3));
      const matching = shopping.filter((item) => !item.checked && !item.pending).map((item) => {
        const itemName = norm(item.name);
        const words = itemName.split(/\s+/).filter((word) => word.length >= 3);
        const overlap = words.filter((word) => productWords.has(word)).length;
        const score = norm(productName).includes(itemName) || itemName.includes(norm(productName)) ? 100 + itemName.length : overlap;
        return { item, score };
      }).sort((a, b) => b.score - a.score)[0];
      return matching?.score > 0 ? matching.item : null;
  }

  async function validateScannedProducts() {
    const validProducts = pendingScannedProducts.filter((product) => product.name.trim());
    if (!validProducts.length) return;
    setPurchaseScannerStatus(`Enregistrement de ${validProducts.length} article${validProducts.length > 1 ? "s" : ""}…`);
    purchaseScanBusyRef.current = true;
    const results = await Promise.all(validProducts.map(async (product) => {
      try {
        const matchedItem = matchShoppingItem(product.name);
        const quantity = product.quantity.trim() || matchedItem?.quantity || "1";
        const response = await fetch("/api/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "scan-purchase", shoppingId: matchedItem?.id, name: product.name.trim(), quantity, zone: product.zone }),
        });
        const saved = await response.json() as { inventoryItem?: Item; shoppingItem?: Shop | null; previousShopping?: Shop | null };
        return response.ok && saved.inventoryItem ? { product, saved } : null;
      } catch {
        return null;
      }
    }));
    const successful = results.filter((result): result is NonNullable<typeof result> => result !== null);
    const successfulIds = new Set(successful.map(({ product }) => product.id));
    if (successful.length) {
      setItems((items) => [...successful.map(({ saved }) => saved.inventoryItem!), ...items]);
      const shoppingUpdates = successful.flatMap(({ saved }) => saved.shoppingItem ? [saved.shoppingItem] : []);
      if (shoppingUpdates.length) setShopping((items) => {
        const updates = new Map(shoppingUpdates.map((item) => [item.id, item]));
        return [...items.map((item) => updates.get(item.id) || item), ...shoppingUpdates.filter((item) => !items.some((current) => current.id === item.id))];
      });
      const last = successful.at(-1)!.saved;
      setScanUndo({ inventoryItem: last.inventoryItem!, shoppingItem: last.shoppingItem || null, previousShopping: last.previousShopping || null });
    }
    const failedCount = validProducts.length - successful.length;
    if (failedCount) {
      setPendingScannedProducts((products) => products.filter((product) => !successfulIds.has(product.id)));
      setPurchaseScannerStatus(`${failedCount} article${failedCount > 1 ? "s n’ont" : " n’a"} pas pu être enregistré${failedCount > 1 ? "s" : ""}. Réessaie.`);
      purchaseScanBusyRef.current = false;
      return;
    }
    purchaseScannerControlsRef.current?.stop();
    purchaseScannerControlsRef.current = null;
    setPendingScannedProducts([]);
    setPurchaseScannerOpen(false);
    purchaseScanBusyRef.current = false;
    flash(`${successful.length} article${successful.length > 1 ? "s ajoutés" : " ajouté"} aux réserves`);
  }

  async function handleScannedBarcode(barcode: string) {
    purchaseScanBusyRef.current = true;
    setPurchaseScannerStatus("Produit reconnu, je cherche son nom…");
    try {
      const lookup = await fetch(`/api/product-lookup?barcode=${encodeURIComponent(barcode)}`);
      const product = await lookup.json() as { name?: string; quantity?: string | null };
      if (!lookup.ok || !product.name) {
        setManualScannedProduct({ barcode, name: "", quantity: "1" });
        setPurchaseScannerStatus("Ce produit n’est pas encore connu. Indique son nom une seule fois.");
        return;
      }
      queueScannedProduct(barcode, product.name, product.quantity);
    } catch {
      setPurchaseScannerStatus("La recherche du produit a échoué. Présente le code à nouveau.");
      purchaseScanBusyRef.current = false;
    }
  }

  async function saveManualScannedProduct() {
    if (!manualScannedProduct?.name.trim()) return;
    const product = manualScannedProduct;
    setManualScannedProduct(null);
    queueScannedProduct(product.barcode, product.name.trim(), product.quantity);
  }

  function ignoreUnknownProduct() {
    setManualScannedProduct(null);
    purchaseScanBusyRef.current = false;
    setPurchaseScannerStatus("Produit ignoré. Présente le code-barres suivant");
  }

  async function undoScannedPurchase() {
    if (!scanUndo) return;
    const undo = scanUndo;
    setScanUndo(null);
    const response = await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "undo-scan-purchase", inventoryId: undo.inventoryItem.id, shoppingId: undo.previousShopping?.id, createdShoppingId: !undo.previousShopping ? undo.shoppingItem?.id : undefined, previousName: undo.previousShopping?.name, previousQuantity: undo.previousShopping?.quantity }),
    }).catch(() => null);
    if (!response?.ok) {
      setScanUndo(undo);
      flash("L’annulation n’a pas pu être enregistrée");
      return;
    }
    setItems((items) => items.filter((item) => item.id !== undo.inventoryItem.id));
    if (undo.previousShopping) setShopping((items) => items.map((item) => item.id === undo.previousShopping!.id ? undo.previousShopping! : item));
    else if (undo.shoppingItem) setShopping((items) => items.filter((item) => item.id !== undo.shoppingItem!.id));
    flash("Dernier scan annulé");
  }

  return {
    startShoppingProductScan, closePurchaseScanner, handleScannedBarcode,
    saveManualScannedProduct, ignoreUnknownProduct, validateScannedProducts, undoScannedPurchase,
  };
}
