INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Sauce créole','1 pot','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='sauce créole');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Foie gras de canard','1 boîte de 200 g','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='foie gras de canard');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Margarine au tournesol','1 barquette','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='margarine au tournesol');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Beurre de cacahuète','1 pot','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='beurre de cacahuète');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Crème semi-épaisse','1 brique','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='crème semi-épaisse');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Saucisses','1 paquet','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='saucisses');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Yaourts nature Danone','5 pots','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='yaourts nature danone');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Yaourt grec passion','1 pot','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='yaourt grec passion');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Mascarpone','1 pot','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='mascarpone');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Mozzarella en tranches','1 paquet de 160 g','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='mozzarella en tranches');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Maasdam en tranches','1 paquet','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='maasdam en tranches');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Kiri','12 portions','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='kiri');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Emmental en tranches','2 paquets','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='emmental en tranches');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Jambon d’Aveyron','1 paquet','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='jambon d’aveyron');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Coppa','10 tranches','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='coppa');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Jambon de Bayonne','6 tranches','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='jambon de bayonne');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Jambon Serrano','6 tranches','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='jambon serrano');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Chorizo extra-fort','1 paquet','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='chorizo extra-fort');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Pommes','4','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='pommes');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Oranges','2','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='oranges');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Citron','1','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='citron');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Bananes','quelques-unes','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='bananes');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Œufs','en stock','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`) IN ('œufs','oeufs'));
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Tortillas','en stock','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='tortillas');
--> statement-breakpoint
INSERT INTO `inventory` (`name`,`quantity`,`zone`) SELECT 'Poivron','1','frigo' WHERE NOT EXISTS (SELECT 1 FROM `inventory` WHERE lower(`name`)='poivron');
