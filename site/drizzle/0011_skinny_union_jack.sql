CREATE TABLE `recipe_ingredients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` text NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`quantity` text,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_recipe_ingredients_recipe` ON `recipe_ingredients` (`recipe_id`,`position`);--> statement-breakpoint
CREATE INDEX `idx_recipe_ingredients_name` ON `recipe_ingredients` (`normalized_name`);--> statement-breakpoint
CREATE TABLE `recipe_migration_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`version` integer NOT NULL,
	`status` text NOT NULL,
	`report` text NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_recipe_migration_version` ON `recipe_migration_runs` (`version`,`status`);--> statement-breakpoint
CREATE TABLE `recipe_steps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` text NOT NULL,
	`instruction` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_recipe_steps_recipe` ON `recipe_steps` (`recipe_id`,`position`);--> statement-breakpoint
CREATE TABLE `recipe_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` text NOT NULL,
	`tag` text NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_recipe_tags_recipe_tag` ON `recipe_tags` (`recipe_id`,`tag`);--> statement-breakpoint
CREATE INDEX `idx_recipe_tags_tag` ON `recipe_tags` (`tag`);--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`dedupe_key` text NOT NULL,
	`course` text DEFAULT 'plat' NOT NULL,
	`source` text,
	`source_collection` text DEFAULT 'legacy' NOT NULL,
	`servings` integer DEFAULT 1 NOT NULL,
	`time_minutes` integer DEFAULT 0 NOT NULL,
	`image` text,
	`payload` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_recipes_dedupe_key` ON `recipes` (`dedupe_key`);--> statement-breakpoint
CREATE INDEX `idx_recipes_course_status` ON `recipes` (`course`,`status`);--> statement-breakpoint
CREATE INDEX `idx_recipes_normalized_name` ON `recipes` (`normalized_name`);--> statement-breakpoint
CREATE TABLE `simple_foods` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`course` text NOT NULL,
	`quantity_per_person` text NOT NULL,
	`nutrition_group` text NOT NULL,
	`optional_seasoning` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_simple_foods_normalized_name` ON `simple_foods` (`normalized_name`);--> statement-breakpoint
CREATE INDEX `idx_simple_foods_course_status` ON `simple_foods` (`course`,`status`);