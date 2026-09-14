UPDATE `inventory`
SET `name` = 'Dosettes Nespresso', `quantity` = '30', `zone` = 'garde-manger'
WHERE lower(`name`) IN ('café', 'cafe', 'café nespresso', 'cafe nespresso', 'dosettes nespresso');
--> statement-breakpoint
INSERT INTO `inventory` (`name`, `quantity`, `zone`)
SELECT 'Dosettes Nespresso', '30', 'garde-manger'
WHERE NOT EXISTS (
  SELECT 1 FROM `inventory`
  WHERE lower(`name`) IN ('café', 'cafe', 'café nespresso', 'cafe nespresso', 'dosettes nespresso')
);
