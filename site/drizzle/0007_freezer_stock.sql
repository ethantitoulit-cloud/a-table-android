INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Nems au poulet','9','congelateur' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='nems au poulet');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Épinards en branches','1 kg','congelateur' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='épinards en branches');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Giraumon','500 g','congelateur' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`) IN ('giraumon','giromon') AND `zone`='congelateur');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Lard','300 g','congelateur' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='lard');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Poireaux surgelés','200 g','congelateur' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='poireaux surgelés');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Poulets entiers locaux','2 sachets de 2 kg','congelateur' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='poulets entiers locaux');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Hauts de cuisse de poulet','1 kg','congelateur' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='hauts de cuisse de poulet');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Palourdes','500 g','congelateur' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='palourdes');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Pâte brisée','1 rouleau','congelateur' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='pâte brisée' AND `zone`='congelateur');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Pâte à pizza','1 rouleau','congelateur' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='pâte à pizza');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Poulet','500 g','congelateur' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='poulet' AND `quantity`='500 g');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Roulé de dinde','800 g','congelateur' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='roulé de dinde');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Champignons noirs réhydratés','200 g','congelateur' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='champignons noirs réhydratés');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Champignons noirs secs','100 g','garde-manger' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='champignons noirs secs');
