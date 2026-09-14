import {index,integer,sqliteTable,text,uniqueIndex} from "drizzle-orm/sqlite-core";
export const inventory=sqliteTable("inventory",{id:integer("id").primaryKey({autoIncrement:true}),name:text("name").notNull(),quantity:text("quantity").notNull().default("1"),zone:text("zone",{enum:["frigo","congelateur","garde-manger","epices"]}).notNull().default("garde-manger"),expires:text("expires")});
export const settings=sqliteTable("settings",{key:text("key").primaryKey(),value:text("value").notNull()});
export const mealHistory=sqliteTable("meal_history",{id:integer("id").primaryKey({autoIncrement:true}),meal:text("meal").notNull(),people:integer("people").notNull().default(3),eatenAt:text("eaten_at").notNull(),rating:integer("rating").notNull().default(0),note:text("note").notNull().default("")},t=>[index("idx_meal_history_eaten_at").on(t.eatenAt)]);
export const shopping=sqliteTable("shopping",{id:integer("id").primaryKey({autoIncrement:true}),name:text("name").notNull(),quantity:text("quantity").notNull().default("1"),checked:integer("checked",{mode:"boolean"}).notNull().default(false)});

export const recipes=sqliteTable("recipes",{
  id:text("id").primaryKey(),
  name:text("name").notNull(),
  normalizedName:text("normalized_name").notNull(),
  dedupeKey:text("dedupe_key").notNull(),
  course:text("course",{enum:["entrée","plat","dessert","autre"]}).notNull().default("plat"),
  source:text("source"),
  sourceCollection:text("source_collection").notNull().default("legacy"),
  servings:integer("servings").notNull().default(1),
  timeMinutes:integer("time_minutes").notNull().default(0),
  image:text("image"),
  payload:text("payload").notNull(),
  status:text("status").notNull().default("active"),
  createdAt:text("created_at").notNull(),
  updatedAt:text("updated_at").notNull(),
},t=>[
  uniqueIndex("uq_recipes_dedupe_key").on(t.dedupeKey),
  index("idx_recipes_course_status").on(t.course,t.status),
  index("idx_recipes_normalized_name").on(t.normalizedName),
]);

export const recipeIngredients=sqliteTable("recipe_ingredients",{
  id:integer("id").primaryKey({autoIncrement:true}),
  recipeId:text("recipe_id").notNull().references(()=>recipes.id,{onDelete:"cascade"}),
  name:text("name").notNull(),
  normalizedName:text("normalized_name").notNull(),
  quantity:text("quantity"),
  position:integer("position").notNull().default(0),
},t=>[
  index("idx_recipe_ingredients_recipe").on(t.recipeId,t.position),
  index("idx_recipe_ingredients_name").on(t.normalizedName),
]);

export const recipeSteps=sqliteTable("recipe_steps",{
  id:integer("id").primaryKey({autoIncrement:true}),
  recipeId:text("recipe_id").notNull().references(()=>recipes.id,{onDelete:"cascade"}),
  instruction:text("instruction").notNull(),
  position:integer("position").notNull().default(0),
},t=>[index("idx_recipe_steps_recipe").on(t.recipeId,t.position)]);

export const recipeTags=sqliteTable("recipe_tags",{
  id:integer("id").primaryKey({autoIncrement:true}),
  recipeId:text("recipe_id").notNull().references(()=>recipes.id,{onDelete:"cascade"}),
  tag:text("tag").notNull(),
},t=>[
  uniqueIndex("uq_recipe_tags_recipe_tag").on(t.recipeId,t.tag),
  index("idx_recipe_tags_tag").on(t.tag),
]);

export const simpleFoods=sqliteTable("simple_foods",{
  id:text("id").primaryKey(),
  name:text("name").notNull(),
  normalizedName:text("normalized_name").notNull(),
  course:text("course",{enum:["entrée","plat","dessert"]}).notNull(),
  quantityPerPerson:text("quantity_per_person").notNull(),
  nutritionGroup:text("nutrition_group").notNull(),
  optionalSeasoning:text("optional_seasoning"),
  status:text("status").notNull().default("active"),
  createdAt:text("created_at").notNull(),
  updatedAt:text("updated_at").notNull(),
},t=>[
  uniqueIndex("uq_simple_foods_normalized_name").on(t.normalizedName),
  index("idx_simple_foods_course_status").on(t.course,t.status),
]);

export const recipeMigrationRuns=sqliteTable("recipe_migration_runs",{
  id:integer("id").primaryKey({autoIncrement:true}),
  version:integer("version").notNull(),
  status:text("status").notNull(),
  report:text("report").notNull(),
  startedAt:text("started_at").notNull(),
  completedAt:text("completed_at"),
},t=>[index("idx_recipe_migration_version").on(t.version,t.status)]);
