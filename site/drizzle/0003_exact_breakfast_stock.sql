UPDATE `inventory` SET `quantity`='11' WHERE lower(`name`) IN ('œufs','oeufs');
--> statement-breakpoint
UPDATE `inventory` SET `quantity`='6' WHERE lower(`name`)='tortillas';
