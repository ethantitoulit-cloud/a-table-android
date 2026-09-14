const normalize = (value: string) => value.toLocaleLowerCase("fr-FR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const recipeHasIngredientConcordance = (ingredients: string[], steps: string[]) => {
  const preparation = normalize(steps.join(" "));
  const pantry = /^(huile|sel|poivre|beurre|eau|epice|herbe|thym|persil|curry|paprika|muscade)/;
  const meaningful = ingredients.filter((ingredient) => !pantry.test(normalize(ingredient)));
  const mentioned = meaningful.filter((ingredient) => {
    const normalized = normalize(ingredient);
    if (/\blegumes?\b/.test(preparation) && /(pommes? de terre|aubergine|courgette|carotte|poivron|christophine|chouchou|giromon|giraumon|navet|poireau|brocoli|chou fleur|haricot vert|patate douce|igname|manioc)/.test(normalized)) return true;
    const words = normalized.match(/[a-z]{4,}/g) || [];
    return words.some((word) => preparation.includes(word.replace(/s$/, "")));
  });
  return meaningful.length === 0 || mentioned.length / meaningful.length >= 0.75;
};
