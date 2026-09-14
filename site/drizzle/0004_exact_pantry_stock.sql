UPDATE `inventory` SET `quantity`='1,250 kg', `zone`='garde-manger' WHERE lower(`name`)='riz';
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Riz','1,250 kg','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='riz');
--> statement-breakpoint
UPDATE `inventory` SET `quantity`='250 g', `zone`='garde-manger' WHERE lower(`name`) IN ('haricots rouges','pois rouges');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Haricots rouges','250 g','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`) IN ('haricots rouges','pois rouges'));
--> statement-breakpoint
UPDATE `inventory` SET `quantity`='250 g', `zone`='garde-manger' WHERE lower(`name`)='lentilles';
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Lentilles','250 g','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='lentilles');
