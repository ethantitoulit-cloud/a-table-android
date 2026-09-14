INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Pop-corn','150 g','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='pop-corn');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Cacahuètes salées','200 g','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='cacahuètes salées');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Cannelloni','250 g','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='cannelloni');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Olives vertes','1 sachet','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='olives vertes');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Farine','1 kg','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='farine');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Farine de coco','1 sachet','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='farine de coco');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Chocolat en poudre','1 boîte','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='chocolat en poudre');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Farine de maïs','1 kg','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='farine de maïs');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Thé et infusions','3 boîtes','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='thé et infusions');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Lait sans lactose','4 L','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='lait sans lactose');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Vinaigre blanc','2 L','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='vinaigre blanc');
