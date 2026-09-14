export type StandardMeasure = { amount: number; unit: "g" | "ml" | "unité" };
type StockQuantity = { quantity: string };

const normalize = (value: string) => value.toLocaleLowerCase("fr-FR").replace(/œ/g, "oe").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function inventoryMeasure(item: StockQuantity, targetUnit: StandardMeasure["unit"]): StandardMeasure | null {
  const raw = normalize(item.quantity).replace(",", ".").replace(/½/g, "0.5").replace(/¼/g, "0.25").replace(/¾/g, "0.75");
  const approximateFactor = /\b(environ|approximativement|presque)\b/.test(raw) ? 0.9 : 1;
  const packageMatch = raw.match(/(\d+(?:\.\d+)?|\d+\/\d+)\s*(?:boites?|paquets?|sachets?|pots?|bocaux|bouteilles?|flacons?)\b.*?(\d+(?:\.\d+)?)\s*(kg|g|gr|grammes?|l|litres?|cl|ml)\b/);
  if (packageMatch) {
    const countParts = packageMatch[1].split("/").map(Number);
    const count = countParts.length === 2 ? countParts[0] / countParts[1] : countParts[0];
    const size = Number(packageMatch[2]);
    const unit = packageMatch[3];
    const amount = count * size * approximateFactor;
    if (targetUnit === "g" && unit === "kg") return { amount: amount * 1000, unit: "g" };
    if (targetUnit === "g" && /^(g|gr|gramme)/.test(unit)) return { amount, unit: "g" };
    if (targetUnit === "ml" && unit === "cl") return { amount: amount * 10, unit: "ml" };
    if (targetUnit === "ml" && /^(l|litre)/.test(unit)) return { amount: amount * 1000, unit: "ml" };
    if (targetUnit === "ml" && unit === "ml") return { amount, unit: "ml" };
  }
  const valueBefore = (pattern: RegExp) => raw.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${pattern.source}`))?.[1];
  const kg = valueBefore(/kg\b/), grams = valueBefore(/(?:g|gr|grammes?)\b/), cl = valueBefore(/cl\b/), ml = valueBefore(/ml\b/), litres = valueBefore(/(?:l|litres?)\b/);
  if (targetUnit === "g") {
    if (kg) return { amount: Number(kg) * 1000 * approximateFactor, unit: "g" };
    if (grams) return { amount: Number(grams) * approximateFactor, unit: "g" };
    return null;
  }
  if (targetUnit === "ml") {
    if (cl) return { amount: Number(cl) * 10 * approximateFactor, unit: "ml" };
    if (ml) return { amount: Number(ml) * approximateFactor, unit: "ml" };
    if (litres) return { amount: Number(litres) * 1000 * approximateFactor, unit: "ml" };
    return null;
  }
  const found = raw.match(/\d+(?:\.\d+)?/);
  return found ? { amount: Number(found[0]), unit: "unité" } : null;
}

export function isReproducibleQuantity(quantity: string) {
  const raw = normalize(quantity).replace(",", ".").trim();
  if (!/\d/.test(raw)) return false;
  if (/\b(boite|paquet|sachet|pot|bocal|bouteille|flacon)\b/.test(raw)) return /\d+(?:\.\d+)?\s*(kg|g|gr|grammes?|l|litres?|cl|ml)\b/.test(raw);
  return /^\d+(?:\.\d+)?$/.test(raw) || /\d+(?:\.\d+)?\s*(kg|g|gr|grammes?|l|litres?|cl|ml|unites?|pieces?|parts?|dosettes?|tranches?)\b/.test(raw);
}

export function packageProfileFromQuantity(quantity: string) {
  const raw = normalize(quantity).replace(",", ".");
  const match = raw.match(/(?:boite|paquet|sachet|pot|bocal|bouteille|flacon)s?\b.*?(\d+(?:\.\d+)?)\s*(kg|g|gr|grammes?|l|litres?|cl|ml)\b/);
  return match ? `${match[1]} ${match[2]}` : null;
}
