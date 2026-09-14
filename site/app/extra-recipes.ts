import type { Recipe } from "../lib/app-types";

type Entry = [string, number, string[], Recipe["tags"], string];

const featuredSteps = (name: string, ingredients: string[], cooking: string): string[] => {
  const n = name.toLowerCase();
  const main = ingredients[0];
  if (/(quiche|tarte)/.test(n)) return [
    "Préchauffer le four à 190 °C.",
    n.includes("poireaux")
      ? "Fendre les poireaux, les rincer soigneusement puis les émincer. Les faire fondre 12 minutes à feu moyen avec un filet d’huile, jusqu’à ce qu’ils soient tendres et que leur eau soit évaporée."
      : "Couper les tomates en rondelles, les saler légèrement et les laisser égoutter 10 minutes sur du papier absorbant pour qu’elles ne détrempent pas la pâte.",
    n.includes("lard")
      ? "Faire revenir le lard 4 à 5 minutes dans une poêle sans ajouter de matière grasse, puis l’égoutter."
      : "Couper la mozzarella en tranches fines et les éponger avec du papier absorbant.",
    "Dérouler la pâte dans un moule avec son papier cuisson, puis piquer le fond à la fourchette. Pour une tarte à la tomate, étaler ensuite une fine couche de moutarde.",
    n.includes("quiche")
      ? "Battre les œufs avec la crème, une pincée de sel, du poivre et un peu de muscade. Répartir les poireaux et le lard sur la pâte, puis verser l’appareil."
      : "Disposer les tomates et la mozzarella en les alternant sur le fond de tarte. Poivrer et parsemer d’herbes de Provence.",
    "Enfourner dans le bas du four pendant 30 à 35 minutes. La pâte doit être dorée et le centre ne doit plus trembler lorsque l’on bouge légèrement le moule.",
    "Laisser reposer 5 minutes hors du four avant de démouler et de couper.",
  ];
  if (/(gratin|lasagne|cannelloni)/.test(n)) return [
    "Préchauffer le four à 190 °C.",
    `Cuire ${main} et la garniture à la poêle pendant 10 à 15 minutes.`,
    "Répartir les éléments dans le plat en couches régulières et ajouter la sauce prévue.",
    "Couvrir de fromage puis enfourner 25 à 30 minutes, jusqu’à obtenir une surface bien dorée.",
  ];
  if (/(soupe|veloute)/.test(n)) return [
    "Éplucher si nécessaire puis couper les légumes en morceaux de taille régulière.",
    "Faire revenir l’oignon 3 minutes dans une casserole avec un peu d’huile.",
    "Ajouter les autres légumes, couvrir d’eau à hauteur et laisser cuire à petits bouillons 20 minutes.",
    "Mixer jusqu’à la texture souhaitée, puis ajouter la crème ou le lait de coco hors du feu.",
  ];
  if (/(omelette|oeufs|œufs)/.test(n)) return [
    "Cuire la garniture dans une poêle jusqu’à ce qu’elle soit tendre et que son eau soit évaporée.",
    "Battre les œufs dans un bol avec l’assaisonnement.",
    "Verser les œufs sur la garniture et cuire à feu doux 5 à 8 minutes, sans dessécher l’omelette.",
  ];
  if (/(salade|bowl)/.test(n)) return [
    "Laver puis sécher les légumes. Les couper en morceaux réguliers afin que chaque bouchée contienne plusieurs ingrédients.",
    n.includes("œufs") ? "Plonger les œufs dans l’eau frémissante pendant 9 minutes, les refroidir sous l’eau puis les écaler et les couper en quartiers." : `Couper ${main} déjà cuit en lamelles. S’il est cru, le cuire à cœur dans une poêle légèrement huilée puis le laisser tiédir.`,
    "Préparer la vinaigrette dans un saladier avec huile, citron ou vinaigre, sel et poivre, puis émulsionner à la fourchette.",
    "Ajouter les légumes et la garniture dans le saladier. Mélanger délicatement au dernier moment pour conserver le croquant.",
  ];
  if (/(wrap|tortilla)/.test(n)) return [
    "Émincer la garniture et couper les crudités en fines lamelles. Réchauffer la garniture cuite 3 à 4 minutes à la poêle.",
    "Réchauffer les tortillas 20 secondes par face dans une poêle sèche pour les assouplir.",
    "Déposer la garniture au centre de chaque tortilla en laissant 3 cm libres sur les bords. Ajouter les crudités et la sauce.",
    "Rabattre les côtés, rouler bien serré puis faire dorer la jointure 1 à 2 minutes dans la poêle.",
  ];
  if (/pizza/.test(n)) return [
    "Préchauffer le four à 230 °C avec la plaque à l’intérieur pour qu’elle soit bien chaude.",
    "Émincer les légumes et les faire revenir 6 à 8 minutes afin qu’ils rendent leur eau. Si du poulet est prévu, le couper en dés et le cuire complètement.",
    "Étaler la pâte sur du papier cuisson. Répartir une fine couche de tomate en laissant 1 cm de bord libre.",
    "Ajouter la garniture puis la mozzarella ou le fromage sans surcharger le centre.",
    "Faire glisser la pizza sur la plaque chaude et cuire 10 à 14 minutes, jusqu’à ce que les bords soient gonflés et bien dorés.",
  ];
  if (/(pâtes|spaghettis|carbonara)/.test(n)) return [
    "Porter une grande casserole d’eau salée à ébullition et cuire les pâtes al dente selon le temps indiqué sur le paquet. Garder une petite louche d’eau de cuisson avant d’égoutter.",
    n.includes("champignons") ? "Émincer les champignons et les saisir 7 à 8 minutes à feu vif avec l’ail, jusqu’à évaporation complète de leur eau." : n.includes("palourdes") ? "Rincer soigneusement les palourdes. Les faire ouvrir 5 à 7 minutes à couvert avec l’ail ; jeter celles qui restent fermées." : "Faire dorer les lardons 5 minutes dans une poêle, puis retirer l’excédent de graisse.",
    n.includes("carbonara") ? "Battre les œufs avec le fromage et beaucoup de poivre dans un bol. Hors du feu, ajouter les pâtes très chaudes et mélanger vivement." : "Verser les pâtes dans la poêle avec la garniture et mélanger pendant 1 à 2 minutes.",
    "Ajouter un peu d’eau de cuisson pour lier la sauce : elle doit napper les pâtes sans former une flaque au fond de la poêle.",
  ];
  if (/(curry|colombo|chili|soupe|velouté|pois rouges)/.test(n)) return [
    "Émincer l’oignon et couper les légumes en morceaux réguliers. Rincer et égoutter les légumineuses si elles sont déjà cuites.",
    "Faire revenir l’oignon 3 minutes dans une cocotte avec un filet d’huile. Ajouter les épices et les chauffer 30 secondes en remuant pour développer leurs arômes.",
    `Ajouter ${ingredients.slice(0, 3).join(", ")} et mélanger pendant 2 minutes pour bien les enrober.`,
    "Verser le liquide prévu ou de l’eau juste à hauteur. Couvrir à moitié et laisser mijoter 20 à 25 minutes à feu doux, en remuant de temps en temps.",
    "La préparation est prête lorsque les légumes sont tendres et que la sauce nappe la cuillère. Ajouter un peu d’eau si elle épaissit trop pendant la cuisson.",
  ];
  return [
    `Couper ${ingredients.join(", ")} en morceaux réguliers et séparer les ingrédients crus des ingrédients déjà cuits.`,
    cooking,
    "Poursuivre la cuisson à feu moyen jusqu’à ce que les légumes soient tendres et que la viande ou le poisson soit cuit à cœur.",
    "Retirer du feu et laisser reposer 2 minutes avant de répartir dans les assiettes.",
  ];
};

const proteinSteps = (style: string, ingredient: string): string[] => {
  if (style.includes("rôti")) return ["Préchauffer le four à 200 °C.", `Déposer ${ingredient}, pommes de terre et ail dans un plat puis ajouter les herbes et un filet d’huile.`, "Enfourner 30 à 40 minutes selon la taille des morceaux, en retournant à mi-cuisson.", "Vérifier que la viande est cuite à cœur avant de servir."];
  if (style.includes("express")) return [`Couper ${ingredient} et les légumes en morceaux de taille régulière.`, `Saisir ${ingredient} 4 à 6 minutes dans une poêle très chaude.`, "Ajouter les légumes et poursuivre la cuisson 6 à 8 minutes en remuant : ils doivent rester légèrement croquants."];
  if (style.includes("bowl")) return ["Rincer le riz puis le cuire selon les indications du paquet.", `Cuire ${ingredient} à cœur dans une poêle légèrement huilée.`, "Couper concombre et tomates, puis répartir le riz dans les bols.", `Ajouter ${ingredient} et les crudités sans les mélanger pour composer le bowl.`];
  return [
    `Couper ${ingredient} en morceaux de même taille, les éponger puis les saler légèrement.`,
    `Faire chauffer un filet d’huile dans une cocotte et faire dorer ${ingredient} 5 à 7 minutes en retournant les morceaux. Les réserver sur une assiette.`,
    "Faire revenir l’oignon 3 minutes dans la même cocotte. Ajouter les aromates et les épices, puis remuer 30 secondes.",
    style.includes("coco") ? "Remettre les morceaux dans la cocotte, verser le lait de coco et mélanger. Couvrir à moitié et laisser mijoter 18 à 20 minutes à feu doux." : "Remettre les morceaux avec les légumes et 15 cl d’eau. Couvrir à moitié et laisser mijoter 20 à 25 minutes à feu doux.",
    `Couper le morceau le plus épais pour vérifier que ${ingredient} est cuit à cœur. La sauce doit napper la cuillère ; la faire réduire 2 à 3 minutes sans couvercle si nécessaire.`,
  ];
};

const vegetableSteps = (format: string, ingredient: string): string[] => {
  if (format.includes("gratin")) return ["Préchauffer le four à 190 °C.", `Couper ${ingredient} puis le précuire 10 à 15 minutes jusqu’à ce qu’il soit tendre.`, "Égoutter soigneusement, mélanger avec la crème et répartir dans un plat.", "Couvrir de fromage et faire gratiner 20 minutes au four."];
  if (format.includes("velouté")) return [`Couper ${ingredient} et l’oignon en morceaux.`, "Faire revenir l’oignon 3 minutes, ajouter le légume puis couvrir d’eau à hauteur.", "Laisser cuire à petits bouillons 20 minutes.", "Ajouter le lait de coco et mixer finement hors du feu."];
  if (format.includes("tarte")) return ["Préchauffer le four à 190 °C.", `Couper ${ingredient} puis le cuire à la poêle 10 à 12 minutes pour retirer l’excès d’eau.`, "Dérouler la pâte dans un moule et piquer le fond.", "Battre les œufs, incorporer le légume cuit et verser sur la pâte.", "Enfourner 30 à 35 minutes jusqu’à ce que la garniture soit prise."];
  if (format.includes("sautés")) return ["Cuire le riz puis l’étaler quelques minutes pour qu’il perde sa vapeur.", `Couper ${ingredient} en petits morceaux et le saisir 5 à 8 minutes dans une grande poêle.`, "Ajouter le riz et la sauce soja, puis faire sauter 3 à 4 minutes à feu vif."];
  if (format.includes("galettes")) return [`Cuire ${ingredient} jusqu’à tendreté puis l’écraser grossièrement.`, "Ajouter les œufs et le fromage, puis mélanger jusqu’à obtenir une préparation qui se tient.", "Former des galettes de même épaisseur.", "Les faire dorer 4 à 5 minutes par face dans une poêle légèrement huilée."];
  return ["Préchauffer le four à 190 °C.", `Évider ou ouvrir ${ingredient} selon sa forme et hacher finement la chair récupérée.`, "Mélanger cette chair avec le riz cuit, la tomate et les épices.", "Garnir, déposer dans un plat avec un fond d’eau et cuire 30 minutes au four."];
};

const entries: Entry[] = [
  ["Poulet coco au citron vert",35,["poulet","lait de coco","citron vert","oignon"],["reconfort"],"Faire mijoter le poulet doré avec l’oignon, le lait de coco et le citron vert."],
  ["Poulet à la moutarde et poireaux",35,["poulet","poireaux","moutarde","crème fraîche"],["reconfort"],"Faire fondre les poireaux puis cuire le poulet dans une sauce légère à la moutarde."],
  ["Wok de poulet aux légumes",25,["poulet","poivron","carotte","sauce soja"],["rapide","leger"],"Saisir vivement le poulet et les légumes émincés avec un peu de sauce soja."],
  ["Wraps de poulet croquant",20,["tortillas","poulet","salade","tomates"],["rapide"],"Garnir les tortillas de poulet chaud, de crudités et d’une sauce au yaourt."],
  ["Poulet à l’ananas léger",30,["poulet","ananas","poivron","riz"],["leger"],"Poêler le poulet et le poivron puis ajouter l’ananas avant de servir avec le riz."],
  ["Boulettes de dinde sauce tomate",35,["dinde hachée","tomates","oignon","herbes"],["leger","budget"],"Former les boulettes, les dorer puis les laisser cuire dans la sauce tomate."],
  ["Colombo de porc",50,["porc","aubergine","courgette","épices colombo"],["reconfort"],"Faire revenir le porc aux épices puis laisser mijoter doucement avec les légumes."],
  ["Porc au caramel et riz",40,["porc","sucre roux","sauce soja","riz"],["reconfort"],"Caraméliser légèrement le porc, ajouter la sauce soja et servir avec du riz."],
  ["Quiche poireaux et lard",40,["pâte brisée","poireaux","lard","œufs"],["reconfort"],"Garnir la pâte de poireaux fondants et de lard, ajouter les œufs battus puis enfourner."],
  ["Tortillas jambon fromage",15,["tortillas","jambon","fromage","tomates"],["rapide","budget"],"Garnir, plier et faire dorer les tortillas à la poêle."],
  ["Chili doux aux pois rouges",35,["pois rouges","tomates","poivron","riz"],["budget","leger"],"Mijoter les pois rouges avec tomate et poivron puis servir avec une petite portion de riz."],
  ["Galettes de pois rouges",25,["pois rouges","œufs","oignon","épices"],["budget","rapide"],"Écraser les pois rouges, former des galettes et les faire dorer à la poêle."],
  ["Curry de lentilles au coco",35,["lentilles","lait de coco","tomates","curcuma"],["budget","leger"],"Cuire les lentilles dans une sauce tomate, coco et curcuma jusqu’à ce qu’elles soient fondantes."],
  ["Parmentier de lentilles",45,["lentilles","pommes de terre","carotte","fromage"],["budget","reconfort"],"Couvrir les lentilles mijotées d’une purée puis faire gratiner."],
  ["Lasagnes épinards ricotta",50,["lasagnes","épinards","ricotta","tomates"],["reconfort"],"Alterner pâtes, épinards, ricotta et tomate puis cuire au four."],
  ["Omelette roulée aux épinards",20,["œufs","épinards","fromage","ail"],["rapide","leger"],"Cuire une omelette fine garnie d’épinards et de fromage puis la rouler."],
  ["Gratin de giromon",40,["giromon","crème fraîche","fromage","ail"],["reconfort","budget"],"Écraser le giromon cuit, assaisonner, couvrir de fromage et gratiner."],
  ["Risotto crémeux au giromon",40,["riz","giromon","oignon","fromage"],["reconfort"],"Cuire le riz progressivement avec le giromon jusqu’à obtenir un risotto crémeux."],
  ["Soupe poireaux pommes de terre",30,["poireaux","pommes de terre","oignon","crème fraîche"],["budget","leger"],"Cuire les légumes, mixer finement et terminer avec une touche de crème."],
  ["Gratin de poulet aux poireaux",40,["poulet","poireaux","crème fraîche","fromage"],["reconfort"],"Mélanger poulet et poireaux fondants, napper légèrement puis gratiner."],
  ["Pâtes crémeuses aux champignons",25,["pâtes","champignons","crème fraîche","ail"],["rapide","reconfort"],"Poêler les champignons à l’ail et les mélanger aux pâtes avec un peu de crème."],
  ["Omelette aux champignons",18,["œufs","champignons","fromage","persil"],["rapide","budget"],"Faire revenir les champignons puis verser les œufs battus et cuire doucement."],
  ["Cannelloni aux légumes",45,["cannelloni","courgette","tomates","fromage"],["reconfort"],"Farcir les cannelloni de légumes, couvrir de sauce tomate et enfourner."],
  ["Cannelloni jambon fromage",40,["cannelloni","jambon","fromage","crème fraîche"],["reconfort"],"Farcir les cannelloni, napper d’une sauce légère et gratiner."],
  ["Riz au chorizo et poivron",30,["riz","chorizo","poivron","tomates"],["budget","reconfort"],"Cuire le riz avec le chorizo, le poivron et la tomate dans la même sauteuse."],
  ["Tortilla espagnole",35,["œufs","pommes de terre","oignon","huile"],["budget"],"Cuire doucement pommes de terre et oignon puis ajouter les œufs et retourner la tortilla."],
  ["Riz sauté à l’œuf",20,["riz","œufs","carotte","sauce soja"],["rapide","budget"],"Sauter le riz avec les légumes puis incorporer les œufs brouillés."],
  ["Riz coco aux légumes",30,["riz","lait de coco","carotte","poivron"],["leger","budget"],"Cuire le riz au lait de coco et ajouter les légumes légèrement croquants."],
  ["Pâtes au pesto et tomates",18,["pâtes","pesto","tomates","fromage"],["rapide"],"Mélanger les pâtes chaudes avec pesto, tomates et un peu de fromage."],
  ["Carbonara légère",25,["pâtes","lardons","œufs","fromage"],["rapide","reconfort"],"Mélanger les pâtes avec lardons dorés, œuf et fromage hors du feu."],
  ["Tarte tomate mozzarella",35,["pâte brisée","tomates","mozzarella","moutarde"],["leger"],"Étaler une fine couche de moutarde, ajouter tomate et mozzarella puis enfourner."],
  ["Pizza aux légumes",35,["pâte à pizza","tomates","poivron","mozzarella"],["reconfort"],"Garnir la pâte de tomate, légumes et mozzarella puis cuire à four très chaud."],
  ["Pizza poulet et poivron",35,["pâte à pizza","poulet","poivron","fromage"],["reconfort"],"Répartir poulet et poivron sur la pâte, ajouter le fromage et enfourner."],
  ["Bowl de nems au riz",20,["nems poulet","riz","carotte","concombre"],["rapide"],"Servir les nems croustillants sur le riz avec des crudités assaisonnées."],
  ["Spaghettis aux palourdes",30,["pâtes","palourdes","ail","persil"],["leger"],"Ouvrir les palourdes avec ail et persil puis les mélanger aux pâtes."],
  ["Palourdes au lait de coco",30,["palourdes","lait de coco","citron vert","riz"],["leger"],"Cuire les palourdes dans une sauce coco citronnée et servir avec le riz."],
  ["Riz sauté aux crevettes",22,["riz","crevettes","œufs","carotte"],["rapide","leger"],"Sauter le riz avec crevettes, carotte et œuf dans une grande poêle."],
  ["Galettes de thon",20,["thon","œufs","pommes de terre","herbes"],["rapide","budget"],"Mélanger les ingrédients, former des galettes et les dorer sans excès d’huile."],
  ["Poisson au four créole",30,["poisson","citron vert","tomates","oignon"],["leger","rapide"],"Assaisonner le poisson, couvrir de tomate et oignon puis cuire au four."],
  ["Salade avocat et œufs",15,["avocat","œufs","salade","tomates"],["rapide","leger","sans-cuisson"],"Assembler les crudités avec les œufs et une vinaigrette citronnée."],
  ["Salade grecque au poulet",18,["poulet","concombre","tomates","feta"],["rapide","leger","sans-cuisson"],"Mélanger poulet, légumes frais et feta avec une vinaigrette légère."],
  ["Soupe créole de pois rouges",35,["pois rouges","giromon","carotte","épices"],["budget","leger"],"Mijoter les légumes et les pois rouges puis mixer seulement une petite partie."],
  ["Soupe de légumes maison",30,["carotte","poireaux","pommes de terre","oignon"],["budget","leger"],"Cuire tous les légumes dans un bouillon puis mixer selon la texture souhaitée."],
  ["Curry de pois chiches",30,["pois chiches","tomates","lait de coco","curcuma"],["budget","leger"],"Faire mijoter les pois chiches dans la sauce tomate coco épicée."],
  ["Œufs à la tomate façon chakchouka",25,["œufs","tomates","poivron","oignon"],["budget","leger"],"Mijoter tomate, poivron et oignon puis cuire les œufs directement dans la sauce."],
  ["Œufs cocotte aux épinards",25,["œufs","épinards","crème fraîche","fromage"],["rapide","leger"],"Répartir les épinards et les œufs dans des ramequins puis cuire au bain-marie."],
  ["Velouté de patate douce",30,["patate douce","oignon","lait de coco","curcuma"],["leger","reconfort"],"Cuire la patate douce avec l’oignon, mixer et parfumer au coco et curcuma."],
];

const FEATURED_RECIPES: Recipe[] = entries.map(
  ([name, time, ingredients, tags, cooking]) => ({
    name,
    time,
    ingredients,
    tags,
    steps: featuredSteps(name, ingredients, cooking),
  }),
);

const proteins = [
  ["Poulet", "poulet"],
  ["Dinde", "dinde"],
  ["Porc", "porc"],
  ["Bœuf", "bœuf"],
  ["Poisson blanc", "poisson"],
  ["Crevettes", "crevettes"],
  ["Œufs", "œufs"],
  ["Pois rouges", "pois rouges"],
  ["Lentilles", "lentilles"],
  ["Pois chiches", "pois chiches"],
] as const;

const styles = [
  ["créole au giromon", ["giromon", "oignon", "thym"], "Faire mijoter avec le giromon, l’oignon et les aromates créoles.", ["reconfort"]],
  ["léger au citron vert", ["citron vert", "courgette", "ail"], "Cuire doucement avec courgette, ail et citron vert.", ["leger"]],
  ["express aux légumes", ["poivron", "carotte", "tomates"], "Saisir rapidement avec les légumes pour les garder légèrement croquants.", ["rapide"]],
  ["coco et curcuma", ["lait de coco", "curcuma", "oignon"], "Laisser mijoter dans une sauce coco parfumée au curcuma.", ["reconfort"]],
  ["rôti aux herbes", ["pommes de terre", "ail", "herbes"], "Rôtir avec les pommes de terre, l’ail et les herbes jusqu’à belle coloration.", ["budget"]],
  ["en bowl coloré", ["riz", "concombre", "tomates"], "Cuire l’élément principal puis composer un bowl frais avec riz et crudités.", ["leger","rapide"]],
] as const;

const proteinRecipes: Recipe[] = proteins.flatMap(([label, ingredient]) =>
  styles.map(([style, additions, , tags]) => ({
    name: `${label} ${style}`,
    time: style.includes("express") ? 22 : style.includes("bowl") ? 25 : 38,
    ingredients: [ingredient, ...additions],
    tags: [...tags] as Recipe["tags"],
    steps: proteinSteps(style, ingredient),
  })),
);

const vegetables = [
  ["Giromon", "giromon"],
  ["Poireaux", "poireaux"],
  ["Épinards", "épinards"],
  ["Champignons", "champignons"],
  ["Patate douce", "patate douce"],
  ["Courgettes", "courgette"],
  ["Aubergines", "aubergine"],
  ["Tomates", "tomates"],
  ["Carottes", "carotte"],
  ["Poivrons", "poivron"],
] as const;

const formats = [
  ["en gratin familial", ["fromage", "crème fraîche"], "Couvrir de fromage et faire gratiner au four.", ["reconfort"]],
  ["en velouté parfumé", ["oignon", "lait de coco"], "Cuire jusqu’à tendreté puis mixer en velouté lisse.", ["leger","budget"]],
  ["en tarte croustillante", ["pâte brisée", "œufs"], "Garnir la pâte, ajouter les œufs battus et cuire au four.", ["reconfort"]],
  ["sautés au riz", ["riz", "sauce soja"], "Sauter vivement avec le riz cuit et une touche de sauce soja.", ["rapide","budget"]],
  ["en galettes dorées", ["œufs", "fromage"], "Former des galettes et les faire dorer sur les deux faces.", ["rapide","budget"]],
  ["farcis façon créole", ["riz", "tomates", "épices"], "Farcir avec le mélange assaisonné puis cuire doucement au four.", ["leger"]],
] as const;

const vegetableRecipes: Recipe[] = vegetables.flatMap(([label, ingredient]) =>
  formats.map(([format, additions, , tags]) => ({
    name: `${label} ${format}`,
    time: format.includes("sautés") || format.includes("galettes") ? 25 : 40,
    ingredients: [ingredient, ...additions],
    tags: [...tags] as Recipe["tags"],
    steps: vegetableSteps(format, ingredient),
  })),
);

export const EXTRA_RECIPES: Recipe[] = [
  ...FEATURED_RECIPES,
  ...proteinRecipes,
  ...vegetableRecipes,
];
