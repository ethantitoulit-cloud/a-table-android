INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Conserves de poisson','5 boîtes','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='conserves de poisson');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Conserves de légumes','3 boîtes','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='conserves de légumes');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Pâtés et terrines','4 boîtes','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='pâtés et terrines');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Cornichons','1 bocal','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='cornichons');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Moutarde','1 flacon','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='moutarde');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Mayonnaise','1 flacon','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='mayonnaise');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Sauce soja','1 bouteille','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='sauce soja');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Sauce burger','1 flacon','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='sauce burger');
