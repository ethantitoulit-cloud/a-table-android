DELETE FROM `inventory`
WHERE lower(`name`) IN (
  'conserves de poisson',
  'poisson',
  'saumon',
  'saumon fumé',
  'thon',
  'sardines',
  'maquereau',
  'morue',
  'cabillaud'
);
