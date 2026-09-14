export type BatchPreparation = {
  action: string;
  duration: number;
  storage: string;
};

const excluded = /^(sel|poivre|huile|beurre|margarine|eau|epice|herbe|aromate|vinaigre|moutarde|mayonnaise|sauce)$/;
const longCookingStarches = /^(riz|lentille|pois rouge|haricot rouge|pois d angole|quinoa|pomme de terre|patate douce|fruit a pain)$/;
const longPrepVegetables = /^(giromon|giraumon|christophine|igname|malanga|madere|manioc)$/;
const batchCookableMeats = /^(poulet|dinde|boeuf|porc|veau|agneau)$/;

export function batchPreparationFor(ingredientKey: string): BatchPreparation | null {
  if (excluded.test(ingredientKey)) return null;
  if (longCookingStarches.test(ingredientKey)) {
    return {
      action: "Cuire",
      duration: 25,
      storage: "Refroidir rapidement, puis conserver au réfrigérateur",
    };
  }
  if (longPrepVegetables.test(ingredientKey)) {
    return {
      action: "Éplucher et découper",
      duration: 20,
      storage: "Conserver dans une boîte fermée au réfrigérateur",
    };
  }
  if (batchCookableMeats.test(ingredientKey)) {
    return {
      action: "Cuire",
      duration: 30,
      storage: "Refroidir rapidement. Garder 3 jours au réfrigérateur et congeler les portions prévues ensuite",
    };
  }
  return null;
}

export function sundayBefore(weekStart: string): string {
  const date = new Date(`${weekStart}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}
