export type Mood = "rapide" | "leger" | "reconfort" | "budget" | "sans-cuisson" | "tout";

export type Recipe = {
  name: string;
  time: number;
  ingredients: string[];
  tags: Mood[];
  steps: string[];
  hidden?: string[];
  image?: string;
  source?: string;
  custom?: boolean;
  servings?: number;
  ingredientQuantities?: Record<string, string>;
  course?: "entrée" | "plat" | "dessert" | "autre";
  courseManuallySet?: boolean;
  seasonings?: string[];
  calories?: number;
  fatGrams?: number;
  collection?: "poisson";
  themes?: Array<"local" | "rapide" | "léger" | "monde" | "original">;
  themesManuallySet?: boolean;
  needsReview?: boolean;
  notes?: string;
  occasional?: boolean;
  simpleFood?: boolean;
  optionalSeasoning?: string;
};

export type MenuCourse = {
  name: string;
  ingredients: string[];
  simpleFood?: boolean;
  ingredientQuantities?: Record<string, string>;
  servings?: number;
  course?: "entrée" | "plat" | "dessert" | "autre";
  optionalSeasoning?: string;
};
