import type { MenuCourse, Recipe } from "../lib/app-types";

export const CORE_RECIPES: Recipe[] = [
  { name: "Quiche au saumon", time: 35, ingredients: ["œufs", "saumon fumé", "crème fraîche", "pâte brisée"], tags: ["rapide", "leger"], steps: ["Préchauffer le four à 190 °C.", "Dérouler la pâte dans un moule avec son papier cuisson, puis piquer le fond à la fourchette.", "Couper le saumon fumé en lanières et les répartir régulièrement sur la pâte.", "Battre 4 œufs avec 20 cl de crème, du poivre et une petite pincée de muscade. Ne pas trop saler : le saumon l’est déjà.", "Verser l’appareil sur le saumon puis enfourner 28 à 32 minutes dans le bas du four.", "Sortir la quiche lorsque le dessus est doré et que le centre ne tremble presque plus. Laisser reposer 5 minutes avant de couper."] },
  { name: "Poulet créole, riz et giromon", time: 42, ingredients: ["poulet", "riz", "giromon", "citron vert"], tags: ["budget", "reconfort"], steps: ["Couper le poulet en morceaux réguliers. Le saler, le poivrer et le masser avec du thym et un filet de citron vert.", "Faire chauffer un filet d’huile dans une cocotte et dorer le poulet 6 à 8 minutes sur toutes les faces, puis le réserver.", "Éplucher le giromon, retirer les graines et le couper en cubes de 2 cm. Le faire revenir 3 minutes dans la cocotte.", "Remettre le poulet, ajouter 15 cl d’eau, couvrir à moitié et laisser mijoter 20 minutes à feu doux. Le giromon doit être fondant sans être complètement défait.", "Pendant ce temps, rincer le riz et le cuire selon les indications du paquet. Ajouter le jus de citron vert dans la cocotte hors du feu."] },
  { name: "Dombrés aux pois rouges", time: 55, ingredients: ["pois rouges", "farine", "lardons"], tags: ["budget", "reconfort"], steps: ["Préparer de petites boules de pâte.", "Faire mijoter les pois rouges avec les lardons.", "Ajouter les dombrés et cuire jusqu’à tendreté."] },
  { name: "Galettes moelleuses aux lentilles", time: 25, ingredients: ["lentilles", "œufs", "fromage râpé", "carotte"], hidden: ["lentilles"], tags: ["rapide", "budget"], steps: ["Mixer les lentilles avec l’œuf et la carotte.", "Ajouter le fromage et former des galettes.", "Dorer 4 minutes de chaque côté."] },
  { name: "Croque-monsieur et salade", time: 18, ingredients: ["pain de mie", "jambon", "fromage", "salade"], tags: ["rapide", "budget"], steps: ["Garnir le pain de jambon et fromage.", "Faire dorer à la poêle ou au four.", "Servir avec la salade."] },
  { name: "Omelette giromon-fromage", time: 20, ingredients: ["œufs", "giromon", "fromage"], tags: ["rapide", "budget", "leger"], steps: ["Râper et faire revenir le giromon.", "Ajouter les œufs battus.", "Parsemer de fromage puis plier."] },
  { name: "Salade complète au poulet", time: 15, ingredients: ["poulet", "salade", "tomates", "avocat"], tags: ["rapide", "leger", "sans-cuisson"], steps: ["Découper les légumes.", "Ajouter le poulet déjà cuit.", "Assaisonner et servir frais."] },
  { name: "Gratin de pâtes anti-gaspi", time: 35, ingredients: ["pâtes", "crème fraîche", "fromage", "jambon"], tags: ["budget", "reconfort"], steps: ["Mélanger les pâtes cuites, la crème et le jambon.", "Couvrir de fromage.", "Gratiner 20 minutes."] },
  { name: "Poisson citron vert et légumes rôtis", time: 30, ingredients: ["poisson", "courgette", "poivron", "citron vert"], tags: ["leger", "rapide"], steps: ["Déposer le poisson et les légumes sur une plaque.", "Assaisonner avec citron vert, ail, thym et un filet d’huile.", "Cuire 20 minutes à 190 °C."] },
  { name: "Colombo de poulet léger", time: 40, ingredients: ["poulet", "courgette", "aubergine", "épices colombo"], tags: ["leger", "reconfort"], steps: ["Faire revenir le poulet avec les épices.", "Ajouter les légumes et un fond d’eau.", "Laisser mijoter jusqu’à ce que la sauce soit parfumée."] },
  { name: "Bowl créole avocat et crevettes", time: 20, ingredients: ["crevettes", "avocat", "concombre", "riz"], tags: ["leger", "rapide"], steps: ["Cuire une petite quantité de riz.", "Poêler les crevettes avec ail et citron.", "Composer le bowl avec les crudités et une sauce citronnée."] },
  { name: "Poulet grillé, patate douce et crudités", time: 35, ingredients: ["poulet", "patate douce", "salade", "tomates"], tags: ["leger"], steps: ["Rôtir la patate douce en cubes.", "Griller le poulet avec paprika et thym.", "Servir avec une grande portion de crudités."] },
  { name: "Velouté de giromon et tartine gratinée", time: 30, ingredients: ["giromon", "oignon", "pain", "fromage"], tags: ["leger", "budget", "reconfort"], steps: ["Cuire le giromon avec l’oignon et mixer.", "Assaisonner avec curcuma et poivre.", "Servir avec une petite tartine gratinée."] },
];

export const STARTERS: MenuCourse[] = [
  { name: "Concombre au yaourt citronné", ingredients: ["concombre", "yaourt", "citron vert"] },
  { name: "Carottes râpées créoles", ingredients: ["carotte", "citron vert"] },
  { name: "Tomates et avocat", ingredients: ["tomates", "avocat"] },
  { name: "Velouté léger de giromon", ingredients: ["giromon", "oignon"] },
  { name: "Petite salade de pois rouges", ingredients: ["pois rouges", "tomates"] },
  { name: "Œufs mimosa légers", ingredients: ["œufs", "yaourt"] },
  { name: "Crudités croquantes", ingredients: ["concombre", "carotte"] },
  { name: "Salade verte aux champignons", ingredients: ["salade", "champignons"] },
  { name: "Petit velouté poireaux-pomme de terre", ingredients: ["poireaux", "pommes de terre"] },
];

export const DESSERTS: MenuCourse[] = [
  { name: "Fruit frais", ingredients: ["fruits"] },
  { name: "Yaourt et fruits", ingredients: ["yaourts", "fruits"] },
  { name: "Banane au chocolat", ingredients: ["banane", "chocolat"] },
  { name: "Salade de fruits", ingredients: ["fruits"] },
  { name: "Pomme rôtie à la cannelle", ingredients: ["pomme", "cannelle"] },
  { name: "Crème légère au chocolat", ingredients: ["lait", "chocolat"] },
  { name: "Compote maison", ingredients: ["pomme"] },
  { name: "Yaourt cacao-cacahuètes", ingredients: ["yaourt", "chocolat", "cacahuètes"] },
];
