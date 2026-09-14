CREATE TABLE `inventory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`quantity` text DEFAULT '1' NOT NULL,
	`zone` text DEFAULT 'garde-manger' NOT NULL,
	`expires` text
);
