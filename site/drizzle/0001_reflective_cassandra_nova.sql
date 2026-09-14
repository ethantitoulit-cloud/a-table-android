CREATE TABLE `meal_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`meal` text NOT NULL,
	`people` integer DEFAULT 3 NOT NULL,
	`eaten_at` text NOT NULL,
	`rating` integer DEFAULT 0 NOT NULL,
	`note` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_meal_history_eaten_at` ON `meal_history` (`eaten_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shopping` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`quantity` text DEFAULT '1' NOT NULL,
	`checked` integer DEFAULT false NOT NULL
);
