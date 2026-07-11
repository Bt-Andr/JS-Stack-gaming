/*
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  FULLSTACK://QUEST — Les Gardiens de la Stack                      ║
 * ║  Un RPG pédagogique : 9 secteurs, 9 boss, théorie + pratique.     ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  SOMMAIRE                                                          ║
 * ║   1. THÈME / PALETTE          — couleurs du blueprint             ║
 * ║   2. DONNÉES                  — MODULES (boss, lore, questions)   ║
 * ║   3. PROGRESSION              — LEVELS, getLevelInfo, STORAGE_KEY ║
 * ║   4. BADGES & DIALOGUES       — hauts faits, répliques d'ADA      ║
 * ║   5. PRATIQUE                 — exécuteur de code, helpers        ║
 * ║   6. MOTEUR SONORE            — SFX synthétisés (Web Audio)       ║
 * ║   7. ANIMATIONS               — keyframes injectées (FSQ_CSS)     ║
 * ║   8. AVATARS                  — ADA & BOSS (SVG génératifs)       ║
 * ║   9. COMPOSANTS UI            — Frame, HPBar, ComboMeter…         ║
 * ║  10. VUES                     — Codex, Map, Intro, Battle, Result ║
 * ║  11. COMPOSANT PRINCIPAL      — état, combat, routage             ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
import { useState, useEffect, useRef } from "react";
import {
  Braces, Sparkles, Hourglass, ShieldCheck, Atom, Triangle, Server, Zap, Crown,
  Lock, Check, ChevronRight, ArrowLeft, RotateCcw, Skull,
  Volume2, VolumeX, BookOpen, MessageSquareText,
  Terminal, Play, ArrowUp, ArrowDown, ListOrdered, CheckCircle2, XCircle, Hammer,
  GraduationCap, Wrench, RefreshCw, Cloud, Plus, Trash2, Pencil, Database, Swords,
  Menu, X, Download, Upload, Copy, User, LogOut, Smartphone, Unlock, LifeBuoy, Compass
} from "lucide-react";
import {
  BG, PANEL, PANEL_SOFT, LINE, TEXT, TEXT_MUTED, AMBER, SUCCESS, DANGER,
  STORAGE_KEY, BADGES, ADA_LINES, pick, getLevelInfo, deepEqual, show,
  runCode, shuffleIndices, SFX, FSQ_CSS,
  AdaAvatar, BossAvatar, Frame, Hearts, LoadingScreen, HPBar, ComboMeter,
  DialogueBubble, BadgeChip, MarkdownLite,
  rng, deriveSeed, sampleWithRng, initSrsItem, updateSrsItem, getDueItems, migrateSrsKeys,
} from "./harness/src/quest-shared.jsx";
import { InstallPrompt } from "./harness/src/install-prompt.jsx";

/* ---------------------------------------------------------------------- */
/*  DONNÉES — modules & questions                                         */
/* ---------------------------------------------------------------------- */
const MODULES = [
  {
    id: "js-fond",
    num: "01",
    title: "JavaScript — Fondamentaux",
    subtitle: "Variables, types, fonctions, portée",
    accent: "#E8964B",
    Icon: Braces,
    boss: {
      name: "VÖID",
      epithet: "le Spectre Indéfini",
      kind: "ghost",
      taunt: "typeof null… même moi j'ignore ce que je suis. Tu ne me définiras jamais.",
      hit: "Argh… une valeur… DÉFINIE ?!"
    },
    lore: "Fragment 01 — « Au commencement était le Langage. Sans portée ni types, les premiers Sprites erraient, indéfinis, dans le brouillard du Scope global. »",
    intro: "Avant de construire quoi que ce soit, il faut maîtriser le langage lui-même : variables, types, fonctions et portée. Ce module pose les bases indispensables à tout le reste du parcours.",
    questions: [
      {
        prompt: "Quel mot-clé déclare une variable qui ne peut pas être réaffectée ?",
        options: ["var", "let", "const", "static"],
        correct: 2,
        explain: "const empêche la réaffectation de la variable. Attention : un objet ou un tableau déclaré en const reste mutable (on peut modifier son contenu, juste pas réassigner la référence)."
      },
      {
        prompt: "Que renvoie l'expression typeof null ?",
        options: ["\"null\"", "\"undefined\"", "\"object\"", "\"number\""],
        correct: 2,
        explain: "C'est une bizarrerie historique de JavaScript : typeof null vaut \"object\", même si null n'est pas vraiment un objet."
      },
      {
        code: `console.log(1 + "1");\nconsole.log(1 + 1);`,
        prompt: "Que va afficher ce code, dans l'ordre ?",
        options: ["\"11\" puis 2", "2 puis \"11\"", "\"11\" puis \"11\"", "Erreur"],
        correct: 0,
        explain: "Avec l'opérateur +, dès qu'une chaîne est présente, JavaScript convertit l'autre valeur en chaîne (coercion) : 1 + \"1\" devient \"11\". Sans chaîne, c'est une addition classique : 1 + 1 = 2."
      },
      {
        prompt: "Quelle est la vraie différence entre == et === ?",
        options: [
          "Aucune, ils sont strictement identiques",
          "== compare le type ET la valeur, === seulement la valeur",
          "=== compare type et valeur (égalité stricte), == convertit les types avant de comparer",
          "Ils sont interchangeables dans tous les cas"
        ],
        correct: 2,
        explain: "=== (égalité stricte) ne fait aucune conversion : les types doivent déjà correspondre. == tente de convertir les valeurs avant de comparer, ce qui peut produire des surprises (ex : \"5\" == 5 vaut true)."
      },
      {
        prompt: "Quelle portée (scope) a une variable déclarée avec let à l'intérieur d'un bloc { } ?",
        options: ["Portée globale", "Portée de fonction", "Portée de bloc", "Portée de module uniquement"],
        correct: 2,
        explain: "let (et const) sont limités au bloc { } dans lequel ils sont déclarés. C'est une différence majeure avec var, qui ignore les blocs et ne connaît que la portée de fonction."
      },
      {
        code: `function add(a, b) {\n  return a + b;\n}\nconsole.log(add(2));`,
        prompt: "Que va afficher ce code ?",
        options: ["2", "NaN", "undefined", "Une erreur"],
        correct: 1,
        explain: "Le second argument b n'est pas fourni, donc il vaut undefined. 2 + undefined produit NaN (Not a Number), car l'addition ne peut pas convertir undefined en nombre valide."
      },
      {
        prompt: "Quel type de fonction n'a pas son propre this (il hérite de celui du contexte englobant) ?",
        options: ["Une fonction classique (function)", "Une fonction fléchée (=>)", "Une méthode de classe", "Une fonction génératrice"],
        correct: 1,
        explain: "Les arrow functions ne créent pas leur propre this : elles capturent celui du contexte lexical où elles sont définies. C'est très utile dans les callbacks et les composants."
      },
      {
        prompt: "Quelle méthode de tableau applique une fonction à chaque élément et retourne un NOUVEAU tableau de même longueur ?",
        options: ["forEach", "map", "filter", "reduce"],
        correct: 1,
        explain: "map() transforme chaque élément et retourne un nouveau tableau de même taille. forEach ne retourne rien, filter peut réduire la taille, et reduce accumule une seule valeur."
      },
      {
        type: "code",
        technical: true,
        prompt: "Écris une fonction somme(a, b) qui renvoie la somme de deux nombres.",
        starter: "function somme(a, b) {\n  // ton code ici\n}",
        tests: [
          { call: "somme(2, 3)", expect: 5 },
          { call: "somme(-1, 1)", expect: 0 },
          { call: "somme(10, 0)", expect: 10 }
        ],
        explain: "Une fonction prend des paramètres et renvoie une valeur avec return. Ici, return a + b additionne les deux nombres reçus — c'est ta première fonction au clavier !"
      }
    ]
  },
  {
    id: "js-avance",
    num: "02",
    title: "JavaScript Avancé (ES6+)",
    subtitle: "Destructuring, spread, closures, modules",
    accent: "#E2725B",
    Icon: Sparkles,
    boss: {
      name: "MUTABILIS",
      epithet: "le Cloneur",
      kind: "clone",
      taunt: "Crois-tu m'avoir copié ? Tu n'as dupliqué que ma surface… mes références t'appartiennent encore.",
      hit: "Mes références… BRISÉES !"
    },
    lore: "Fragment 02 — « Le spread et la closure furent les premiers sortilèges des Anciens Gardiens : étaler, capturer, se souvenir. »",
    intro: "Le JavaScript moderne (ES6+) apporte des outils puissants — destructuring, spread, closures — qui rendent ton code plus court, plus lisible et plus fiable.",
    questions: [
      {
        prompt: "Que fait l'opérateur spread dans [...arr1, ...arr2] ?",
        options: [
          "Il fusionne deux tableaux en copiant leurs éléments dans un nouveau tableau",
          "Il additionne mathématiquement les deux tableaux",
          "Il crée une référence partagée entre les deux tableaux",
          "C'est une erreur de syntaxe"
        ],
        correct: 0,
        explain: "L'opérateur ... \"étale\" les éléments d'un tableau (ou objet). Combiné avec [ ], il permet de construire un nouveau tableau qui contient une copie superficielle des éléments des tableaux d'origine."
      },
      {
        code: `const { a, b = 10 } = { a: 5 };\nconsole.log(b);`,
        prompt: "Que va afficher console.log(b) ?",
        options: ["undefined", "5", "10", "Erreur"],
        correct: 2,
        explain: "Le destructuring permet de définir une valeur par défaut (b = 10). Comme l'objet source ne contient pas de propriété b, c'est la valeur par défaut qui est utilisée."
      },
      {
        prompt: "À quoi sert Array.prototype.reduce ?",
        options: [
          "Filtrer les éléments d'un tableau",
          "Transformer chaque élément en un autre",
          "Accumuler tous les éléments en une seule valeur finale",
          "Trier le tableau"
        ],
        correct: 2,
        explain: "reduce() parcourt le tableau en accumulant un résultat unique à chaque étape (somme, objet, chaîne...), à partir d'une fonction (accumulateur, élément) et d'une valeur initiale."
      },
      {
        code: `function compteur() {\n  let n = 0;\n  return () => ++n;\n}\nconst c = compteur();\nconsole.log(c(), c(), c());`,
        prompt: "Qu'affiche ce code ?",
        options: ["0 0 0", "1 1 1", "1 2 3", "undefined undefined undefined"],
        correct: 2,
        explain: "C'est une closure : la fonction interne \"se souvient\" de la variable n de son environnement parent, même après que compteur() ait fini de s'exécuter. Chaque appel à c() incrémente ce n persistant."
      },
      {
        prompt: "Dans une méthode d'objet, quelle est la valeur de this dans une fonction fléchée définie à l'intérieur ?",
        options: [
          "L'objet courant, toujours",
          "undefined, toujours",
          "Celui du contexte englobant (this lexical, capturé au moment de la définition)",
          "L'objet global window, toujours"
        ],
        correct: 2,
        explain: "Les arrow functions n'ont pas leur propre this : elles utilisent celui de leur environnement de définition. C'est différent d'une fonction classique, dont le this dépend de la façon dont elle est appelée."
      },
      {
        prompt: "Avec \"type\": \"module\" dans package.json, quel système de modules Node.js utilise-t-il par défaut ?",
        options: ["CommonJS (require/module.exports)", "ES Modules (import/export)", "AMD", "UMD"],
        correct: 1,
        explain: "C'est le système ES Modules natif, basé sur les mots-clés import et export, qui devient le standard moderne — par opposition à l'ancien CommonJS (require/module.exports)."
      },
      {
        prompt: "Quelle est la vraie différence entre une copie \"shallow\" (superficielle) et \"deep\" (profonde) d'un objet ?",
        options: [
          "Aucune différence concrète",
          "La copie shallow ne duplique que le premier niveau ; les objets imbriqués restent des références partagées",
          "La copie deep ne copie que les primitives",
          "La copie shallow copie récursivement tous les niveaux"
        ],
        correct: 1,
        explain: "Une copie superficielle (via spread ou Object.assign par exemple) duplique le premier niveau de propriétés, mais les objets/tableaux imbriqués restent les mêmes références. Une copie profonde duplique tout, à chaque niveau."
      },
      {
        prompt: "Que fait l'optional chaining ( ?. ), par exemple dans user?.address?.city ?",
        options: [
          "Il lance une erreur si une propriété intermédiaire est absente",
          "Il accède à la propriété, et renvoie undefined (sans erreur) si une référence intermédiaire est null ou undefined",
          "Il force la conversion du résultat en booléen",
          "Il clone l'objet avant d'y accéder"
        ],
        correct: 1,
        explain: "L'optional chaining permet de \"descendre\" dans une chaîne de propriétés en toute sécurité : si user ou user.address est null/undefined, l'expression s'arrête et renvoie undefined plutôt que de lever une erreur."
      },
      {
        type: "refactor",
        prompt: "Ce code marche mais il est écrit à l'ancienne. Rends-le idiomatique (ES6+) sans changer son comportement : les tests doivent rester verts.",
        starter: "function pairsDoubles(arr) {\n  var out = [];\n  for (var i = 0; i < arr.length; i++) {\n    if (arr[i] % 2 == 0) {\n      out.push(arr[i] * 2);\n    }\n  }\n  return out;\n}",
        tests: [
          { call: "pairsDoubles([1, 2, 3, 4])", expect: [4, 8] },
          { call: "pairsDoubles([1, 3, 5])", expect: [] },
          { call: "pairsDoubles([2, 4, 6])", expect: [4, 8, 12] },
        ],
        explain: "Une version idiomatique : const pairsDoubles = (arr) => arr.filter((n) => n % 2 === 0).map((n) => n * 2). const au lieu de var, une arrow function, et filter+map qui disent l'intention (« garder les pairs, puis les doubler ») là où la boucle for la cachait.",
      },
      {
        type: "code",
        technical: true,
        prompt: "Écris une fonction pairs(arr) qui renvoie un NOUVEAU tableau avec uniquement les nombres pairs.",
        starter: "function pairs(arr) {\n  // indice : utilise .filter\n}",
        tests: [
          { call: "pairs([1, 2, 3, 4])", expect: [2, 4] },
          { call: "pairs([1, 3, 5])", expect: [] },
          { call: "pairs([2, 4, 6])", expect: [2, 4, 6] }
        ],
        explain: "filter() garde les éléments pour lesquels la fonction renvoie true. arr.filter(n => n % 2 === 0) ne conserve que les pairs, dans un nouveau tableau sans toucher à l'original."
      }
    ]
  },
  {
    id: "async",
    num: "03",
    title: "Asynchrone",
    subtitle: "Callbacks, Promises, async/await, fetch",
    accent: "#8ECAE6",
    Icon: Hourglass,
    boss: {
      name: "CHRONOS",
      epithet: "le Dévoreur de Promesses",
      kind: "dragon",
      taunt: "await… await… tu m'attendras pour l'éternité, petit Sprite. Ton fil principal est déjà à moi.",
      hit: "Résolue ?! Ma Promesse… RÉSOLUE ?!"
    },
    lore: "Fragment 03 — « Le Temps lui-même fut dompté le jour où les Gardiens cessèrent de bloquer le fil principal et apprirent à attendre sans s'arrêter. »",
    intro: "Le web est asynchrone par nature : requêtes réseau, fichiers, timers. Maîtriser les Promises et async/await est indispensable pour tout développeur fullstack.",
    questions: [
      {
        prompt: "Quelle est la vraie différence entre un callback et une Promise ?",
        options: [
          "Aucune différence",
          "Une Promise est un objet représentant un résultat futur (résolu ou rejeté), ce qui évite l'imbrication en cascade des callbacks",
          "Les callbacks sont plus modernes que les Promises",
          "Une Promise est toujours synchrone"
        ],
        correct: 1,
        explain: "Une Promise encapsule un résultat asynchrone dans un objet manipulable (.then/.catch ou async/await), ce qui évite le fameux \"callback hell\" des callbacks imbriqués les uns dans les autres."
      },
      {
        prompt: "Que fait précisément le mot-clé await ?",
        options: [
          "Il transforme automatiquement une fonction normale en fonction async",
          "Il met en pause l'exécution de la fonction async jusqu'à résolution de la Promise, sans bloquer le thread principal du navigateur",
          "Il annule une Promise en cours",
          "Il exécute plusieurs Promises en parallèle automatiquement"
        ],
        correct: 1,
        explain: "await suspend uniquement la fonction async courante en attendant le résultat de la Promise — le reste du programme (et le thread principal) continue de fonctionner normalement pendant ce temps."
      },
      {
        code: `async function f() {\n  console.log(1);\n  await null;\n  console.log(2);\n}\nf();\nconsole.log(3);`,
        prompt: "Dans quel ordre ces nombres s'affichent-ils ?",
        options: ["1, 2, 3", "1, 3, 2", "3, 1, 2", "2, 3, 1"],
        correct: 1,
        explain: "Le code synchrone de f() s'exécute immédiatement (affiche 1), puis await met la suite en file d'attente (microtask) et rend la main : console.log(3) s'exécute, et seulement après, la suite de f() reprend (affiche 2)."
      },
      {
        prompt: "Que fait Promise.all([p1, p2, p3]) ?",
        options: [
          "Elle exécute les promesses en séquence, une par une",
          "Elle attend que toutes les promesses soient résolues et renvoie un tableau des résultats, ou rejette dès la première erreur",
          "Elle renvoie seulement le résultat de la première promesse résolue",
          "Elle ignore silencieusement les erreurs"
        ],
        correct: 1,
        explain: "Promise.all lance toutes les promesses en parallèle et attend qu'elles soient toutes résolues. Si une seule échoue, Promise.all rejette immédiatement avec cette erreur."
      },
      {
        prompt: "Quelle est la différence entre Promise.all et Promise.allSettled ?",
        options: [
          "Aucune différence",
          "Promise.all rejette dès le premier échec, alors que Promise.allSettled attend toutes les promesses et renvoie le statut (succès ou échec) de chacune",
          "Promise.allSettled est plus rapide",
          "Promise.all ignore les rejets"
        ],
        correct: 1,
        explain: "Promise.allSettled ne s'arrête jamais en cas d'erreur : elle attend que toutes les promesses se terminent (résolues ou rejetées) et te donne le détail de chacune, ce qui est utile quand un échec partiel est acceptable."
      },
      {
        prompt: "Que renvoie fetch(url) par défaut ?",
        options: [
          "Directement les données JSON",
          "Une Promise qui se résout en un objet Response, qu'il faut ensuite parser (ex : .json())",
          "Une chaîne de texte brute",
          "Un objet XML uniquement"
        ],
        correct: 1,
        explain: "fetch renvoie une Promise<Response>. La Response contient les en-têtes, le statut, etc. Pour obtenir les données utilisables, il faut appeler une méthode comme response.json() ou response.text(), qui renvoie elle-même une Promise."
      },
      {
        prompt: "Que se passe-t-il si une Promise est rejetée sans aucun .catch ni try/catch ?",
        options: [
          "Rien, l'application continue normalement sans avertissement",
          "Une \"Unhandled Promise Rejection\" est signalée",
          "La Promise devient automatiquement résolue",
          "Le thread principal se bloque"
        ],
        correct: 1,
        explain: "JavaScript signale les rejets de Promise non gérés (Unhandled Promise Rejection), aussi bien dans le navigateur que sous Node.js. C'est pourquoi il faut toujours prévoir un .catch ou un try/catch autour d'un await."
      },
      {
        prompt: "Comment exécuter plusieurs appels asynchrones en parallèle plutôt qu'en série ?",
        options: [
          "Enchaîner plusieurs await l'un après l'autre",
          "Lancer tous les appels d'abord (sans await), puis utiliser Promise.all sur les promesses obtenues",
          "Utiliser une boucle for avec await à chaque itération",
          "Ce n'est pas possible en JavaScript"
        ],
        correct: 1,
        explain: "await successifs exécutent les appels en série (chacun attend le précédent). Pour du parallélisme, il faut démarrer toutes les promesses sans attendre immédiatement, puis les attendre ensemble avec Promise.all."
      },
      {
        type: "order",
        prompt: "Remets dans le bon ordre le corps d'une fonction async qui récupère puis renvoie des données JSON.",
        lines: [
          "const res = await fetch(url);",
          "const data = await res.json();",
          "return data;"
        ],
        explain: "On attend d'abord la réponse réseau (await fetch), PUIS on parse le corps en JSON (res.json() renvoie elle aussi une Promise, d'où le second await), et enfin on renvoie les données."
      },
      {
        type: "code",
        technical: true,
        prompt: "Ce code a un bug : doubleAsync(nums) doit renvoyer une Promise résolue avec les nombres doublés, mais elle renvoie un tableau de Promises non résolues. Corrige-la avec Promise.all.",
        starter: "async function doubleAsync(nums) {\n  // bug : on renvoie les promesses sans les attendre\n  return nums.map(n => Promise.resolve(n * 2));\n}",
        tests: [
          { call: "doubleAsync([1, 2, 3])", expect: [2, 4, 6] },
          { call: "doubleAsync([])", expect: [] },
          { call: "doubleAsync([5])", expect: [10] }
        ],
        explain: "nums.map(n => Promise.resolve(n * 2)) renvoie un tableau de Promises, pas les valeurs elles-mêmes. Promise.all(...) attend que toutes les promesses soient résolues avant de renvoyer le tableau final des résultats."
      }
    ]
  },
  {
    id: "ts",
    num: "04",
    title: "TypeScript",
    subtitle: "Types, interfaces, generics, sécurité",
    accent: "#6C8AE4",
    Icon: ShieldCheck,
    boss: {
      name: "ANYTYPE",
      epithet: "le Sans-Forme",
      kind: "blob",
      taunt: "any, any, any… aucune règle ne me contraint, aucune forme ne me retient. Tu ne peux pas me typer.",
      hit: "unknown… tu m'obliges à RÉVÉLER ma forme !"
    },
    lore: "Fragment 04 — « Donner un Type, c'est donner un Nom. Et nommer une chose, c'est commencer à la maîtriser. »",
    intro: "TypeScript ajoute une couche de types statiques au-dessus de JavaScript, pour détecter des erreurs avant même d'exécuter le code. C'est un standard dans les projets professionnels.",
    questions: [
      {
        prompt: "Quel est l'avantage principal de TypeScript par rapport à JavaScript pur ?",
        options: [
          "Il s'exécute plus vite dans le navigateur",
          "Il ajoute un système de types statiques, vérifié à la compilation, qui détecte des erreurs avant l'exécution",
          "Il remplace totalement JavaScript au runtime",
          "Il supprime le besoin d'écrire des tests"
        ],
        correct: 1,
        explain: "TypeScript se compile (transpile) en JavaScript classique : il n'apporte aucun gain de performance runtime, mais il vérifie la cohérence des types pendant le développement, avant même d'exécuter quoi que ce soit."
      },
      {
        prompt: "Comment typer correctement une fonction qui prend un nombre et retourne une chaîne ?",
        options: [
          "function f(x): number => string",
          "function f(x: number): string",
          "function f(x: string): number",
          "function f(x: any): any"
        ],
        correct: 1,
        explain: "La syntaxe place le type du paramètre après les deux-points (x: number), et le type de retour après les parenthèses, avant les accolades : function f(x: number): string."
      },
      {
        prompt: "Parmi ces affirmations sur interface vs type en TypeScript, laquelle est correcte ?",
        options: [
          "Une interface peut être étendue par plusieurs déclarations (merging), ce qu'un type ne permet pas",
          "Un type peut représenter des unions et des types primitifs, ce qu'une interface ne fait pas directement",
          "Les deux affirmations précédentes sont vraies",
          "Il n'existe absolument aucune différence entre les deux"
        ],
        correct: 2,
        explain: "Pour décrire la forme d'un objet simple, interface et type sont souvent interchangeables. Mais interface bénéficie du \"declaration merging\" (fusion automatique), tandis que type gère plus naturellement les unions (A | B) et les alias de primitifs."
      },
      {
        code: `function identity<T>(x: T): T {\n  return x;\n}`,
        prompt: "Que permet ce \"generic\" <T> ?",
        options: [
          "Forcer x à être de type any",
          "Réutiliser la fonction avec différents types, tout en garantissant que le type d'entrée correspond au type de sortie",
          "Transformer T en chaîne automatiquement",
          "C'est une erreur de syntaxe"
        ],
        correct: 1,
        explain: "Un generic comme <T> est un \"paramètre de type\" : il permet d'écrire une fonction réutilisable pour n'importe quel type, tout en conservant la relation entre les types (ici, le type retourné est toujours identique au type reçu)."
      },
      {
        code: `interface User {\n  name: string;\n  email?: string;\n}`,
        prompt: "Que signifie le ? après email dans cette interface ?",
        options: ["La propriété est obligatoire", "La propriété est optionnelle", "La propriété est en lecture seule", "La propriété est un type union"],
        correct: 1,
        explain: "Le ? marque une propriété optionnelle : un objet User peut être valide avec ou sans la propriété email. Son type effectif devient alors string | undefined."
      },
      {
        prompt: "Comment représente-t-on en TypeScript \"soit une chaîne, soit un nombre\" ?",
        options: ["string & number", "string | number", "string + number", "[string, number]"],
        correct: 1,
        explain: "Le symbole | (pipe) crée un type union : string | number signifie que la valeur peut être l'un OU l'autre. Le & (intersection) signifierait au contraire qu'elle doit satisfaire les deux types à la fois."
      },
      {
        code: `const config = { mode: "dark" } as const;`,
        prompt: "À quoi sert as const ici ?",
        options: [
          "Convertir l'objet en constante au moment de l'exécution",
          "Indiquer au compilateur de typer la valeur de façon la plus précise possible (littéral \"dark\", propriétés readonly)",
          "Supprimer tous les types de l'objet",
          "Transformer l'objet en enum"
        ],
        correct: 1,
        explain: "as const verrouille le typage au niveau le plus précis : mode est typé comme le littéral \"dark\" (et non string), et les propriétés deviennent readonly. C'est très utile pour des constantes ou de la configuration."
      },
      {
        prompt: "Pourquoi préférer unknown à any quand on reçoit une donnée dont le type n'est pas garanti ?",
        options: [
          "Ils sont parfaitement identiques",
          "unknown oblige à vérifier ou affiner le type avant de l'utiliser, ce qui est plus sûr",
          "any est plus sûr que unknown",
          "unknown ne peut pas être utilisé en TypeScript"
        ],
        correct: 1,
        explain: "any désactive complètement la vérification de type (dangereux). unknown accepte aussi n'importe quelle valeur, mais le compilateur t'empêche de l'utiliser tant que tu n'as pas vérifié son type réel (via typeof, instanceof, etc.)."
      },
      {
        type: "code",
        technical: true,
        prompt: "Écris une fonction dernier(arr) qui renvoie le dernier élément d'un tableau (ou undefined s'il est vide).",
        starter: "function dernier(arr) {\n  // ton code ici\n}",
        tests: [
          { call: "dernier([1, 2, 3])", expect: 3 },
          { call: "dernier(['a'])", expect: "a" },
          // On teste le cas vide via une égalité booléenne plutôt qu'avec
          // `expect: undefined` : ainsi la question reste représentable en banque
          // (JSON ne sait pas sérialiser `undefined`) tout en vérifiant le même
          // comportement (renvoyer undefined sur un tableau vide).
          { call: "dernier([]) === undefined", expect: true }
        ],
        explain: "arr[arr.length - 1] accède au dernier index. Sur un tableau vide, length - 1 vaut -1 et arr[-1] est undefined : exactement le comportement attendu, sans cas particulier à écrire."
      }
    ]
  },
  {
    id: "react",
    num: "05",
    title: "React",
    subtitle: "Composants, props, state, hooks",
    accent: "#4FD1B5",
    Icon: Atom,
    boss: {
      name: "RERENDER",
      epithet: "l'Hydre aux mille têtes",
      kind: "hydra",
      taunt: "Coupe une tête, j'en re-render mille. Mon état déborde, mes effets se relancent sans fin.",
      hit: "Ma key… tu as trouvé ma CLÉ unique !"
    },
    lore: "Fragment 05 — « Les composants sont les cellules vivantes de l'Interface : ils naissent, réagissent à leur état, et se rendent encore et encore. »",
    intro: "React est la bibliothèque la plus utilisée pour construire des interfaces. Composants, state et hooks sont les briques de base de toute application moderne.",
    questions: [
      {
        prompt: "Qu'est-ce qu'un composant React, fondamentalement ?",
        options: [
          "Une feuille de style CSS",
          "Une fonction (ou classe) qui retourne du JSX décrivant une partie de l'interface",
          "Un fichier de configuration du projet",
          "Un type de base de données"
        ],
        correct: 1,
        explain: "Un composant React est avant tout une fonction JavaScript qui prend des props en entrée et retourne du JSX (la description de ce qui doit s'afficher). React se charge de transformer ce JSX en éléments du DOM réel."
      },
      {
        prompt: "Que fait le hook useState ?",
        options: [
          "Il exécute un effet de bord après le rendu",
          "Il déclare une variable d'état locale au composant, qui déclenche un re-rendu quand elle change",
          "Il mémorise une fonction pour éviter de la recréer",
          "Il donne un accès direct au DOM"
        ],
        correct: 1,
        explain: "useState renvoie une paire [valeur, fonctionDeMiseÀJour]. Appeler cette fonction met à jour la valeur ET déclenche un nouveau rendu du composant pour refléter ce changement à l'écran."
      },
      {
        code: `useEffect(() => {\n  console.log("monté");\n}, []);`,
        prompt: "Quand ce useEffect s'exécute-t-il, avec un tableau de dépendances vide ?",
        options: ["À chaque rendu", "Jamais", "Une seule fois, juste après le premier rendu (montage)", "Uniquement au démontage du composant"],
        correct: 2,
        explain: "Un tableau de dépendances vide [ ] signifie \"aucune dépendance ne change jamais\" : l'effet ne s'exécute donc qu'une seule fois, immédiatement après le premier rendu du composant (équivalent du montage)."
      },
      {
        prompt: "Quelle règle s'applique aux props reçues par un composant enfant ?",
        options: [
          "L'enfant peut les modifier directement",
          "Elles sont en lecture seule (immuables) du point de vue de l'enfant qui les reçoit",
          "Elles remplacent complètement le state",
          "Elles ne servent qu'à passer des styles"
        ],
        correct: 1,
        explain: "Les props descendent du parent vers l'enfant et sont en lecture seule : un composant enfant ne doit jamais modifier directement une prop reçue. Pour changer une donnée, il faut passer par le state (souvent géré par le parent)."
      },
      {
        code: `items.map(item => <li key={item.id}>{item.label}</li>)`,
        prompt: "Pourquoi utiliser une key unique sur chaque élément d'une liste ?",
        options: [
          "Uniquement pour le style CSS",
          "Pour aider React à identifier efficacement quel élément a changé, a été ajouté ou supprimé lors du diffing",
          "C'est juste une convention sans effet réel",
          "Pour trier automatiquement la liste"
        ],
        correct: 1,
        explain: "La key donne à React une identité stable pour chaque élément de liste. Sans clé fiable (ou avec l'index comme clé sur une liste qui change d'ordre), React peut mal réconcilier le DOM et provoquer des bugs ou des pertes de performance."
      },
      {
        prompt: "Que fait le hook useMemo ?",
        options: [
          "Il mémorise une valeur calculée et ne la recalcule que si ses dépendances changent",
          "Il force un nouveau rendu à chaque appel",
          "Il remplace complètement useState",
          "Il ne sert que pour les appels réseau"
        ],
        correct: 0,
        explain: "useMemo met en cache le résultat d'un calcul coûteux entre les rendus, et ne le recalcule que si une de ses dépendances change. C'est une optimisation de performance, à utiliser quand le calcul est réellement coûteux."
      },
      {
        prompt: "Quelle est la différence entre un input \"contrôlé\" et \"non contrôlé\" en React ?",
        options: [
          "Aucune différence",
          "Contrôlé : la valeur de l'input est pilotée par le state React via value + onChange. Non contrôlé : le DOM gère lui-même sa valeur (accès via une ref)",
          "Un input contrôlé ne peut jamais être modifié par l'utilisateur",
          "Les inputs non contrôlés sont interdits en React"
        ],
        correct: 1,
        explain: "Un input contrôlé synchronise sa valeur avec le state à chaque frappe (value={state}, onChange={...}), ce qui donne un contrôle total. Un input non contrôlé laisse le DOM gérer sa propre valeur, qu'on récupère ponctuellement via une ref."
      },
      {
        prompt: "À quoi sert le Context API de React ?",
        options: [
          "Gérer le CSS global de l'application",
          "Partager des données entre composants sans avoir à les passer manuellement à chaque niveau intermédiaire (éviter le \"prop drilling\")",
          "Remplacer systématiquement tout le state local",
          "Gérer uniquement le routage"
        ],
        correct: 1,
        explain: "Le Context API permet de rendre une donnée (thème, utilisateur connecté...) accessible à n'importe quel composant descendant, sans devoir la transmettre explicitement prop par prop à travers chaque niveau intermédiaire."
      },
      {
        type: "order",
        prompt: "Remets dans l'ordre les lignes d'un composant React à compteur.",
        lines: [
          "function Compteur() {",
          "  const [n, setN] = useState(0);",
          "  return <button onClick={() => setN(n + 1)}>{n}</button>;",
          "}"
        ],
        explain: "Un composant est une fonction : on déclare d'abord l'état avec useState (au sommet, jamais dans une condition), puis on retourne le JSX qui l'utilise, et on ferme la fonction."
      },
      {
        type: "code",
        technical: true,
        prompt: "Ce reducer de compteur a un bug : \"reset\" ne remet pas le compteur à zéro. Corrige counterReducer(state, action).",
        starter: "function counterReducer(state, action) {\n  switch (action.type) {\n    case \"increment\": return { count: state.count + 1 };\n    case \"decrement\": return { count: state.count - 1 };\n    case \"reset\": return state; // bug ici\n    default: return state;\n  }\n}",
        tests: [
          { call: "counterReducer({ count: 5 }, { type: 'increment' })", expect: { count: 6 } },
          { call: "counterReducer({ count: 5 }, { type: 'decrement' })", expect: { count: 4 } },
          { call: "counterReducer({ count: 5 }, { type: 'reset' })", expect: { count: 0 } }
        ],
        explain: "Le cas \"reset\" renvoyait state tel quel au lieu de produire un nouvel état à zéro. Un reducer doit toujours renvoyer un nouvel objet représentant l'état suivant : { count: 0 }, jamais muter ou ignorer l'état reçu."
      }
    ]
  },
  {
    id: "next",
    num: "06",
    title: "Next.js",
    subtitle: "Routing, SSR/SSG, App Router, API routes",
    accent: "#B388FF",
    Icon: Triangle,
    boss: {
      name: "HYDRATUS",
      epithet: "le Golem Serveur",
      kind: "golem",
      taunt: "Mon corps est rendu côté serveur, hors de portée. Ton navigateur ne touchera jamais mon âme.",
      hit: "« use client »… tu m'HYDRATES de force !"
    },
    lore: "Fragment 06 — « La frontière entre le Serveur et le Client est sacrée. Peu de Sprites savent où elle passe — et moins encore comment la franchir. »",
    intro: "Next.js transforme React en framework fullstack complet : routage par fichiers, rendu serveur et API intégrées. C'est l'outil de référence pour des apps React en production.",
    questions: [
      {
        prompt: "Quel est l'avantage principal de Next.js par rapport à une app React \"classique\" (créée avec Vite seul) ?",
        options: [
          "Il ne sert qu'à faire des sites purement statiques",
          "Il offre un framework complet : rendu côté serveur (SSR), génération statique (SSG), routage par fichiers et API routes intégrées",
          "Il remplace totalement le JavaScript par un autre langage",
          "Il nécessite obligatoirement une base de données"
        ],
        correct: 1,
        explain: "Next.js ajoute au-dessus de React tout ce qu'il faut pour une vraie app de production : différentes stratégies de rendu (serveur, statique, client), un routage basé sur la structure de fichiers, et des endpoints d'API intégrés."
      },
      {
        prompt: "Dans l'App Router (dossier app/), comment crée-t-on une nouvelle route /blog ?",
        options: [
          "En créant un fichier blog.js à la racine du projet",
          "En créant un dossier app/blog/ contenant un fichier page.tsx",
          "En modifiant uniquement next.config.js",
          "Ce n'est pas possible avec l'App Router"
        ],
        correct: 1,
        explain: "L'App Router associe chaque route à un dossier dans app/ contenant un fichier page.tsx (ou .jsx). Le chemin du dossier (app/blog/) détermine directement l'URL (/blog)."
      },
      {
        prompt: "Quelle est la vraie différence entre un Server Component et un Client Component dans l'App Router ?",
        options: [
          "Aucune différence",
          "Le Server Component s'exécute côté serveur et ne peut pas utiliser useState/useEffect, sauf à ajouter la directive \"use client\" pour en faire un Client Component",
          "Le Client Component est toujours plus rapide à charger",
          "Les deux ont exactement les mêmes capacités"
        ],
        correct: 1,
        explain: "Par défaut, tout composant de l'App Router est un Server Component : il s'exécute côté serveur, n'envoie pas de JS au navigateur, mais ne peut pas utiliser de hooks d'interactivité. La directive \"use client\" en haut du fichier bascule vers un Client Component classique."
      },
      {
        prompt: "Que permet un fichier route.ts placé dans app/api/utilisateurs/ ?",
        options: [
          "De styliser une page",
          "De définir un endpoint d'API (GET, POST, etc.) exécuté côté serveur",
          "De créer un composant React visuel",
          "De configurer directement une base de données"
        ],
        correct: 1,
        explain: "Un fichier route.ts dans app/api/ exporte des fonctions nommées GET, POST, etc., qui définissent un véritable endpoint d'API REST, exécuté côté serveur — exactement comme une route Express, mais intégrée à Next.js."
      },
      {
        prompt: "Qu'est-ce que le SSG (Static Site Generation) ?",
        options: [
          "Générer le HTML à chaque requête utilisateur",
          "Générer les pages HTML à l'avance, au moment du build, pour un chargement très rapide",
          "Ne jamais générer de HTML",
          "Une technique réservée aux API uniquement"
        ],
        correct: 1,
        explain: "Avec le SSG, les pages sont pré-générées en HTML statique au moment du build, puis servies telles quelles (souvent via un CDN). C'est idéal pour du contenu qui ne change pas à chaque requête (blog, documentation, landing page)."
      },
      {
        prompt: "Comment récupère-t-on des données côté serveur dans un Server Component de l'App Router ?",
        options: [
          "Avec useEffect et fetch, comme dans une app React classique",
          "Simplement avec un appel fetch (ou toute requête asynchrone) directement dans le composant, qui peut être une fonction async",
          "Avec useState uniquement",
          "Il faut obligatoirement utiliser getStaticProps"
        ],
        correct: 1,
        explain: "Un Server Component peut être une fonction async : on peut donc faire directement await fetch(...) (ou interroger une base de données) au cœur du composant, sans passer par useEffect, puisque le code s'exécute côté serveur avant l'envoi au navigateur."
      },
      {
        prompt: "Que fait <Link> (next/link) par rapport à une balise <a> classique ?",
        options: [
          "Rien de particulier, c'est purement cosmétique",
          "Il permet une navigation côté client sans rechargement complet de la page, et précharge la page ciblée",
          "Il bloque complètement le routage",
          "Il ne fonctionne que pour les liens externes"
        ],
        correct: 1,
        explain: "<Link> intercepte la navigation pour la gérer côté client (sans recharger toute la page) et précharge automatiquement la page de destination en arrière-plan, ce qui rend la navigation quasi instantanée."
      },
      {
        prompt: "Quel fichier spécial définit une mise en page partagée (header/footer communs) pour un groupe de routes ?",
        options: ["page.tsx", "layout.tsx", "config.tsx", "index.tsx"],
        correct: 1,
        explain: "layout.tsx enveloppe toutes les pages d'un même dossier (et de ses sous-dossiers) : c'est l'endroit idéal pour un header, une sidebar ou un footer partagés entre plusieurs routes."
      },
      {
        type: "order",
        prompt: "Remets dans l'ordre une route API Next.js (app/api/ping/route.ts) qui répond en JSON.",
        lines: [
          "export async function GET() {",
          "  const data = { message: 'pong' };",
          "  return Response.json(data);",
          "}"
        ],
        explain: "Une route handler exporte une fonction nommée selon la méthode HTTP (GET). On construit la donnée, puis on renvoie une Response — ici Response.json() sérialise l'objet automatiquement."
      },
      {
        type: "code",
        technical: true,
        prompt: "Corrige buildStaticParams(slugs) : pour generateStaticParams (App Router), elle doit renvoyer un tableau d'objets { params: { slug } }, un par slug — pas les slugs bruts.",
        starter: "function buildStaticParams(slugs) {\n  // bug : renvoie les slugs bruts au lieu du format attendu\n  return slugs;\n}",
        tests: [
          { call: "buildStaticParams(['a', 'b'])", expect: [{ params: { slug: "a" } }, { params: { slug: "b" } }] },
          { call: "buildStaticParams([])", expect: [] },
          { call: "buildStaticParams(['only'])", expect: [{ params: { slug: "only" } }] }
        ],
        explain: "generateStaticParams attend un tableau d'objets au format { params: { ... } }. slugs.map(slug => ({ params: { slug } })) transforme chaque slug brut dans la forme exacte attendue par Next.js pour générer les pages statiques."
      }
    ]
  },
  {
    id: "express",
    num: "07",
    title: "Express & API REST",
    subtitle: "Routes, middlewares, statuts HTTP",
    accent: "#79C28C",
    Icon: Server,
    boss: {
      name: "MIDDLEWARE",
      epithet: "le Gardien des Portes",
      kind: "gate",
      taunt: "Aucune requête ne passe sans mon sceau. Ton next() ne sera jamais appelé. Tu resteras à la porte.",
      hit: "Mon jeton… mon token… DÉJOUÉ !"
    },
    lore: "Fragment 07 — « Chaque porte de l'API a son gardien. Connais l'ordre des middlewares, ou reste à jamais bloqué dehors. »",
    intro: "Côté serveur, Express reste le framework Node.js le plus répandu pour exposer des APIs REST robustes et bien structurées.",
    questions: [
      {
        prompt: "Qu'est-ce qu'Express, en une phrase ?",
        options: [
          "Une base de données",
          "Un framework Node.js minimaliste pour créer des serveurs web et des APIs HTTP",
          "Un framework frontend concurrent de React",
          "Un outil de build comme Vite"
        ],
        correct: 1,
        explain: "Express est une couche fine au-dessus du module http de Node.js, qui simplifie énormément la définition de routes, de middlewares et la gestion des requêtes/réponses HTTP."
      },
      {
        code: `app.use(express.json());`,
        prompt: "Que fait précisément cette ligne ?",
        options: [
          "Elle sert des fichiers statiques",
          "Elle active un middleware qui parse automatiquement le corps JSON des requêtes entrantes, le rendant disponible via req.body",
          "Elle crée une nouvelle route",
          "Elle configure la connexion à la base de données"
        ],
        correct: 1,
        explain: "Sans ce middleware, req.body serait undefined pour des requêtes envoyées en JSON. express.json() lit le flux de la requête, le parse, et le place dans req.body pour que les routes suivantes puissent l'utiliser directement."
      },
      {
        prompt: "Dans une API REST, quelle méthode HTTP utilise-t-on typiquement pour créer une nouvelle ressource ?",
        options: ["GET", "POST", "DELETE", "OPTIONS"],
        correct: 1,
        explain: "Par convention REST : GET lit, POST crée, PUT/PATCH met à jour, DELETE supprime. POST /utilisateurs, par exemple, crée un nouvel utilisateur."
      },
      {
        prompt: "Qu'est-ce qu'un middleware en Express ?",
        options: [
          "Une base de données intermédiaire",
          "Une fonction ayant accès à la requête, la réponse, et à la fonction next, exécutée dans la chaîne de traitement d'une requête",
          "Un type de route réservé uniquement à la gestion des erreurs",
          "Un plugin de build"
        ],
        correct: 1,
        explain: "Un middleware reçoit (req, res, next) et peut inspecter/modifier la requête, répondre directement, ou passer la main au middleware/route suivant via next(). C'est la brique de base de tout traitement Express (auth, logs, parsing...)."
      },
      {
        prompt: "Quel code de statut HTTP signifie \"ressource créée avec succès\" ?",
        options: ["200", "201", "404", "500"],
        correct: 1,
        explain: "200 OK est une réussite générique, mais 201 Created indique précisément qu'une nouvelle ressource a bien été créée (typiquement en réponse à un POST réussi)."
      },
      {
        prompt: "Quelle est la signature typique d'un gestionnaire de route Express ?",
        options: ["(req, res, next) => {}", "(props) => {}", "(state, action) => {}", "(event) => {}"],
        correct: 0,
        explain: "Chaque route Express reçoit la requête (req), la réponse (res), et optionnellement la fonction next pour passer au middleware suivant — c'est la signature universelle des handlers Express."
      },
      {
        prompt: "Pourquoi versionne-t-on souvent une API REST (ex : /api/v1/...) ?",
        options: [
          "Pour ralentir volontairement les requêtes",
          "Pour pouvoir faire évoluer l'API sans casser les clients qui utilisent encore une ancienne version",
          "C'est une obligation technique d'Express",
          "Cela n'a aucun intérêt pratique"
        ],
        correct: 1,
        explain: "Le versionnage (v1, v2...) permet d'introduire des changements majeurs dans une nouvelle version, tout en laissant les applications existantes continuer à fonctionner sur l'ancienne, le temps qu'elles migrent."
      },
      {
        prompt: "Quelle est la différence entre req.params, req.query et req.body ?",
        options: [
          "Ils sont identiques",
          "params = segments dynamiques de l'URL (/users/:id), query = paramètres après le ? (?tri=asc), body = données envoyées dans le corps de la requête",
          "params sert uniquement pour le JSON",
          "body est toujours vide en Express"
        ],
        correct: 1,
        explain: "Pour une route GET /users/:id?tri=asc avec un corps JSON : req.params.id vient de l'URL elle-même, req.query.tri vient de la chaîne après le ?, et req.body contient les données envoyées (souvent en POST/PUT)."
      },
      {
        type: "order",
        prompt: "Remets dans l'ordre la mise en place d'un serveur Express minimal. Attention à la place du middleware !",
        lines: [
          "const app = express();",
          "app.use(express.json());",
          "app.get('/', (req, res) => res.json({ ok: true }));",
          "app.listen(3000);"
        ],
        explain: "On crée l'app, on branche les middlewares (express.json) AVANT les routes pour qu'elles en profitent, puis on déclare les routes, et enfin on écoute un port avec listen()."
      },
      {
        type: "code",
        technical: true,
        prompt: "Corrige statusCategory(code) : elle classe un code HTTP par famille, mais confond actuellement les erreurs client (4xx) et serveur (5xx).",
        starter: "function statusCategory(code) {\n  if (code >= 200 && code < 300) return \"success\";\n  if (code >= 400 && code < 600) return \"client-error\"; // bug ici\n  return \"other\";\n}",
        tests: [
          { call: "statusCategory(200)", expect: "success" },
          { call: "statusCategory(404)", expect: "client-error" },
          { call: "statusCategory(500)", expect: "server-error" }
        ],
        explain: "Il faut distinguer deux plages : 400-499 sont des erreurs côté client (client-error, ex : 404), 500-599 des erreurs côté serveur (server-error, ex : 500). Les confondre rend le diagnostic d'une panne bien plus difficile en production."
      }
    ]
  },
  {
    id: "vite",
    num: "08",
    title: "Vite & Outils Build",
    subtitle: "Dev server, bundling, optimisation",
    accent: "#E0D85C",
    Icon: Zap,
    boss: {
      name: "BUNDLOR",
      epithet: "le Mastodonte",
      kind: "mastodon",
      taunt: "Je suis lourd, lent, monolithique. Des mégaoctets de code mort. Tu ne m'allègeras jamais.",
      hit: "Tree-shaking ?! Mon code mort… S'ENVOLE !"
    },
    lore: "Fragment 08 — « La vitesse n'est pas un luxe de Gardien. C'est le respect que l'on doit à chaque utilisateur qui attend. »",
    intro: "Aucune app moderne n'existe sans outillage : Vite gère le développement et la mise en production de ton code de façon rapide et optimisée.",
    questions: [
      {
        prompt: "Quel est le rôle principal d'un outil comme Vite ?",
        options: [
          "Gérer une base de données",
          "Servir de serveur de développement ultra-rapide et bundler le code pour la production",
          "Remplacer entièrement React",
          "Héberger le site directement en production"
        ],
        correct: 1,
        explain: "Vite a deux casquettes : un serveur de développement très rapide grâce aux modules ES natifs, et un bundler (basé sur Rollup) pour produire un build optimisé destiné à la production."
      },
      {
        prompt: "Pourquoi Vite est-il si rapide en développement, comparé à des bundlers plus anciens en mode dev classique ?",
        options: [
          "Il compile l'intégralité du projet avant de le servir",
          "Il s'appuie sur les modules ES natifs du navigateur et ne transforme à la volée que les fichiers réellement demandés",
          "Il n'utilise aucun serveur",
          "Il met uniquement en cache les images"
        ],
        correct: 1,
        explain: "Plutôt que de tout bundler avant de démarrer, Vite sert les fichiers via les imports ES natifs du navigateur et ne transforme que ce qui est effectivement demandé, page par page — d'où un démarrage quasi instantané."
      },
      {
        prompt: "Quelle commande crée typiquement le build de production optimisé avec Vite ?",
        options: ["vite dev", "vite build", "vite serve", "vite start"],
        correct: 1,
        explain: "vite build génère les fichiers statiques optimisés (minifiés, avec hash de cache) dans le dossier de sortie, prêts à être déployés."
      },
      {
        prompt: "Qu'est-ce que le \"tree-shaking\" effectué par les bundlers ?",
        options: [
          "Une animation visuelle",
          "L'élimination du code mort ou non utilisé du bundle final, pour réduire sa taille",
          "Le tri alphabétique des fichiers du projet",
          "Une technique de mise en cache uniquement"
        ],
        correct: 1,
        explain: "Le tree-shaking analyse les imports/exports réellement utilisés et retire du bundle final tout le code qui n'est jamais importé, réduisant ainsi le poids final envoyé au navigateur."
      },
      {
        prompt: "Quel fichier permet de personnaliser la configuration de Vite (plugins, alias, etc.) ?",
        options: ["package.json uniquement", "vite.config.js (ou .ts)", ".babelrc", "webpack.config.js"],
        correct: 1,
        explain: "vite.config.js (ou .ts) centralise la configuration : plugins (React, etc.), alias de chemins, variables d'environnement, configuration du serveur de dev, options de build..."
      },
      {
        prompt: "Pourquoi utilise-t-on des variables d'environnement (fichier .env) dans un projet Vite ?",
        options: [
          "Pour stocker du code JavaScript exécutable",
          "Pour séparer la configuration sensible ou spécifique à l'environnement (clés d'API, URLs) du code source",
          "Elles sont automatiquement chiffrées et totalement invisibles côté client",
          "Elles remplacent npm"
        ],
        correct: 1,
        explain: "Le fichier .env permet d'adapter la config selon l'environnement (dev/prod) sans toucher au code. Attention cependant : seules les variables préfixées VITE_ sont exposées au code client, et elles ne sont jamais vraiment \"secrètes\" une fois dans le bundle navigateur."
      },
      {
        type: "order",
        prompt: "Remets dans l'ordre un fichier vite.config.js minimal avec le plugin React.",
        lines: [
          "import { defineConfig } from 'vite';",
          "import react from '@vitejs/plugin-react';",
          "export default defineConfig({",
          "  plugins: [react()],",
          "});"
        ],
        explain: "Les imports viennent toujours en premier (defineConfig puis le plugin), puis on exporte la configuration en lui passant le tableau de plugins. C'est le squelette de toute config Vite."
      },
      {
        type: "code",
        technical: true,
        prompt: "Corrige resolveApiUrl(env) : elle doit lire env.VITE_API_URL, et se rabattre sur 'http://localhost:3000' dès que la variable est absente OU vide — pas seulement absente.",
        starter: "function resolveApiUrl(env) {\n  // bug : une chaîne vide est traitée comme une URL valide\n  return env.VITE_API_URL !== undefined ? env.VITE_API_URL : 'http://localhost:3000';\n}",
        tests: [
          { call: "resolveApiUrl({ VITE_API_URL: 'https://api.exemple.com' })", expect: "https://api.exemple.com" },
          { call: "resolveApiUrl({})", expect: "http://localhost:3000" },
          { call: "resolveApiUrl({ VITE_API_URL: '' })", expect: "http://localhost:3000" }
        ],
        explain: "env.VITE_API_URL || 'http://localhost:3000' bascule sur la valeur par défaut dès que la variable est absente OU vide (chaîne falsy), contrairement à une simple vérification !== undefined qui laisse passer une chaîne vide comme si elle était valide."
      }
    ]
  },
  {
    id: "boss",
    num: "09",
    title: "Boss Final — Fullstack",
    subtitle: "Mises en situation d'architecture réelle",
    accent: "#E15554",
    Icon: Crown,
    boss: {
      name: "OVERFLOW",
      epithet: "le Corrupteur",
      kind: "overlord",
      taunt: "Tu n'as purifié que des secteurs isolés. MOI, je suis l'architecture entière. CORS, Auth, Monolithe… tout obéit à ma corruption.",
      hit: "Impossible… un simple Sprite… devenu GARDIEN ?!"
    },
    lore: "Fragment 09 — « Et le dernier Sprite se leva, comprit la Stack tout entière — du langage à l'architecture — et devint Gardien. La corruption, enfin, recula. »",
    intro: "Le défi final : des mises en situation qui combinent frontend, backend, types et architecture — exactement ce qu'on rencontre en gérant un vrai projet fullstack.",
    questions: [
      {
        prompt: "Ton frontend Next.js (localhost:3000) appelle une API Express séparée (localhost:3001) en local. Le navigateur bloque la requête. Quel est le problème et comment le résoudre côté serveur ?",
        options: [
          "Aucun problème, ça fonctionne nativement",
          "C'est une erreur CORS : il faut configurer le middleware cors sur le serveur Express pour autoriser l'origine du frontend",
          "C'est un problème de base de données",
          "Il faut désactiver JavaScript dans le navigateur"
        ],
        correct: 1,
        explain: "Le navigateur bloque par défaut les requêtes vers une origine différente (port différent = origine différente). Le middleware cors, configuré côté Express avec la bonne origine autorisée, résout ce problème proprement."
      },
      {
        prompt: "Tu veux protéger une route Express pour qu'elle ne soit accessible qu'aux utilisateurs authentifiés. Quelle approche est appropriée ?",
        options: [
          "Vérifier un mot de passe en clair directement dans l'URL",
          "Utiliser un middleware qui vérifie un token (ex : JWT) dans les en-têtes de la requête avant d'appeler next()",
          "Faire confiance au frontend pour cacher le bouton correspondant",
          "Désactiver totalement la route"
        ],
        correct: 1,
        explain: "La sécurité doit toujours être vérifiée côté serveur : un middleware d'authentification lit le token envoyé (souvent dans l'en-tête Authorization), le valide, et bloque la requête (ou appelle next()) selon le résultat. Cacher un bouton côté frontend n'empêche jamais un appel direct à l'API."
      },
      {
        prompt: "Dans une app Next.js qui affiche le profil privé d'un utilisateur, où vaut-il mieux récupérer ces données sensibles ?",
        options: [
          "Toujours côté client avec useEffect, quel que soit le contexte",
          "Dans un Server Component qui vérifie la session côté serveur avant de renvoyer les données",
          "Dans le fichier next.config.js",
          "Directement dans une feuille de style CSS"
        ],
        correct: 1,
        explain: "Récupérer et vérifier les données sensibles côté serveur (Server Component) évite d'exposer temporairement des données privées dans le navigateur avant qu'une vérification d'authentification client n'ait lieu."
      },
      {
        prompt: "Tu utilises TypeScript à la fois sur ton frontend React et ton backend Express. Quel est l'avantage de partager les types (ex : l'interface User) entre les deux ?",
        options: [
          "Cela ralentit volontairement le projet",
          "Cela garantit la cohérence des données échangées entre frontend et backend, et évite les erreurs de désynchronisation des structures",
          "Cela n'a aucun intérêt pratique",
          "Cela remplace complètement les tests automatisés"
        ],
        correct: 1,
        explain: "Quand le frontend et le backend partagent les mêmes définitions de types (souvent via un package ou dossier commun), une modification de structure côté backend est immédiatement signalée comme erreur de type côté frontend si celui-ci n'est pas mis à jour."
      },
      {
        prompt: "Ton build Vite est lent à charger en production et le bundle final est trop lourd. Quelle action est la plus pertinente ?",
        options: [
          "Ajouter encore plus de dépendances au projet",
          "Analyser le contenu du bundle, activer le code-splitting / lazy loading, et vérifier que les dépendances inutilisées sont bien éliminées (tree-shaking)",
          "Supprimer Vite et tout réécrire en HTML pur",
          "Ignorer le problème, ça n'affecte pas les utilisateurs"
        ],
        correct: 1,
        explain: "Avant d'optimiser à l'aveugle, on analyse ce qui compose réellement le bundle (taille par dépendance), puis on découpe le code par route/fonctionnalité (code-splitting, import() dynamique) pour ne charger que le strict nécessaire à chaque page."
      },
      {
        prompt: "Pour une nouvelle application, comment choisir entre \"monolithe Next.js avec API routes intégrées\" et \"Next.js frontend + Express backend séparé\" ?",
        options: [
          "Selon la couleur du thème choisi",
          "Selon le besoin (ou non) d'un backend réutilisable par plusieurs clients (mobile, autres services) : si oui, séparer simplifie souvent l'architecture ; sinon, le monolithe Next.js réduit la complexité",
          "Selon le nombre de fichiers CSS du projet",
          "Selon la version de Node installée sur la machine du développeur"
        ],
        correct: 1,
        explain: "Si une seule application web consomme l'API, le monolithe Next.js (API routes intégrées) limite la complexité opérationnelle (un seul déploiement). Si plusieurs clients (app mobile, autres services) doivent consommer la même API, un backend Express séparé devient souvent plus pertinent."
      },
      {
        type: "code",
        technical: true,
        prompt: "Épreuve finale du Gardien. Écris slugify(titre) : tout en minuscules, les espaces remplacés par des tirets. \"Mon Article\" → \"mon-article\".",
        starter: "function slugify(titre) {\n  // ton code ici\n}",
        tests: [
          { call: "slugify('Mon Article')", expect: "mon-article" },
          { call: "slugify('HELLO WORLD')", expect: "hello-world" },
          { call: "slugify('deja-ok')", expect: "deja-ok" }
        ],
        explain: "titre.toLowerCase().replaceAll(' ', '-') met d'abord en minuscules, puis remplace chaque espace par un tiret. C'est exactement ainsi qu'on génère des URLs propres (slugs) en production."
      }
    ]
  }
];

/* ---------------------------------------------------------------------- */
/*  CHANTIER — capstone : un vrai projet construit hors de l'app          */
/* ---------------------------------------------------------------------- */
const CHANTIER = {
  id: "todo-fullstack-v1",
  title: "Chantier — Gestionnaire de tâches Fullstack",
  pitch: "Un vrai petit projet à construire toi-même, dans ton éditeur : une API Express qui stocke des tâches, et un front React qui les affiche et les modifie. FSQ ne peut pas lire ton dépôt — chaque jalon coché reste une déclaration sur l'honneur, mais tu peux coller ton code à ADA pour une vraie revue avant de cocher.",
  milestones: [
    {
      id: "setup",
      moduleRef: "js-fond",
      title: "Poser les fondations",
      spec: "Crée un dossier de projet avec deux sous-dossiers : server/ (API) et client/ (front, généré avec Vite + React). Initialise un dépôt git avec un .gitignore (node_modules, .env).",
      acceptance: [
        "npm run dev fonctionne dans client/ sans erreur",
        "Le serveur démarre sans erreur dans server/",
        "git status ne montre aucun node_modules suivi",
      ],
      hint: "npm create vite@latest client -- --template react pour le front ; npm init -y && npm i express pour le serveur.",
    },
    {
      id: "model",
      moduleRef: "js-fond",
      title: "Modéliser une tâche",
      spec: "Dans server/, écris une fonction createTask(title) qui renvoie un objet { id, title, done: false, createdAt }. L'id doit être unique à chaque appel.",
      acceptance: [
        "Deux appels successifs à createTask produisent deux id différents",
        "createTask('') est rejeté ou lève une erreur explicite, pas une tâche vide silencieuse",
      ],
      hint: "Date.now() ou crypto.randomUUID() suffisent largement pour un id unique ici.",
    },
    {
      id: "api-list",
      moduleRef: "express",
      title: "Lister les tâches",
      spec: "Crée la route GET /api/tasks qui renvoie la liste des tâches en JSON.",
      acceptance: [
        "curl localhost:PORT/api/tasks renvoie un tableau JSON avec un statut 200",
        "La liste est vide ([]) au premier démarrage, pas une erreur",
      ],
      hint: "app.use(express.json()) doit être branché avant tes routes, même si celle-ci n'a pas de body.",
    },
    {
      id: "api-create",
      moduleRef: "express",
      title: "Créer une tâche",
      spec: "Crée la route POST /api/tasks qui prend { title } dans le body, crée la tâche et la renvoie.",
      acceptance: [
        "POST avec un title valide renvoie un statut 201 et la tâche créée",
        "POST sans title (ou vide) renvoie un statut 400 avec un message clair, pas un crash serveur",
      ],
      hint: "Valide req.body.title avant d'appeler createTask — un serveur qui plante sur une entrée invalide est un bug, pas une fonctionnalité.",
    },
    {
      id: "api-update-delete",
      moduleRef: "express",
      title: "Modifier et supprimer",
      spec: "Ajoute PATCH /api/tasks/:id (bascule done) et DELETE /api/tasks/:id (supprime la tâche).",
      acceptance: [
        "PATCH sur un id existant bascule done et renvoie la tâche mise à jour",
        "PATCH ou DELETE sur un id inconnu renvoie un statut 404, pas un crash ni un 200 silencieux",
      ],
      hint: "array.findIndex(t => t.id === req.params.id) : si -1, renvoie 404 immédiatement avant d'aller plus loin.",
    },
    {
      id: "persist",
      moduleRef: "async",
      title: "Survivre à un redémarrage",
      spec: "Les tâches ne doivent plus disparaître au redémarrage : sauvegarde-les dans un fichier JSON (fs.readFile/writeFile) à chaque modification, et recharge-les au démarrage.",
      acceptance: [
        "Créer une tâche, arrêter le serveur (Ctrl+C), le relancer : la tâche est toujours là",
        "Le fichier JSON reste valide même après plusieurs écritures successives",
      ],
      hint: "Écris (et attends avec await) le fichier complet à chaque modification plutôt que de gérer un diff — plus simple, largement suffisant à cette échelle.",
    },
    {
      id: "extract-logic",
      moduleRef: "js-avance",
      title: "Séparer la logique métier des routes",
      spec: "Déplace createTask, la validation et la recherche par id dans un fichier tasks-service.js séparé, importé par tes routes Express. Les routes ne doivent plus contenir que de l'orchestration HTTP.",
      acceptance: [
        "Les fonctions de tasks-service.js n'importent rien d'Express (req/res)",
        "Tu peux appeler ces fonctions dans un petit script à part, sans lancer le serveur, et elles fonctionnent",
      ],
      hint: "Un bon test : si tu dois inventer un req factice pour tester une fonction, elle n'est pas encore assez séparée d'Express.",
    },
    {
      id: "front-list",
      moduleRef: "react",
      title: "Afficher la liste",
      spec: "Dans client/, un composant TaskList récupère GET /api/tasks au montage (useEffect) et affiche : un état de chargement, un état d'erreur, puis la liste.",
      acceptance: [
        "Au premier rendu, un message de chargement est visible avant que les données arrivent",
        "Arrêter le serveur et recharger la page affiche un message d'erreur clair, pas un écran blanc",
      ],
      hint: "Trois états suffisent : loading, error, data — un seul objet { status, data, error } fait très bien l'affaire.",
    },
    {
      id: "front-create",
      moduleRef: "react",
      title: "Ajouter une tâche",
      spec: "Ajoute un formulaire contrôlé (input + bouton) qui POST une nouvelle tâche puis met à jour la liste affichée sans recharger la page.",
      acceptance: [
        "Soumettre le formulaire vide ne déclenche pas d'appel réseau inutile",
        "Après ajout, la nouvelle tâche apparaît dans la liste sans reload manuel du navigateur",
      ],
      hint: "Le plus simple : après un POST réussi, refais un fetch de la liste complète plutôt que de bricoler une fusion manuelle d'état.",
    },
    {
      id: "front-update-delete",
      moduleRef: "react",
      title: "Cocher et supprimer",
      spec: "Ajoute une case à cocher (PATCH) et un bouton supprimer (DELETE) par tâche, avec un indicateur de chargement propre à la ligne concernée.",
      acceptance: [
        "Cocher une tâche ne recharge pas visuellement les autres lignes",
        "Un clic rapide sur supprimer ne peut pas déclencher deux DELETE pour la même tâche",
      ],
      hint: "Stocke l'id de la tâche \"en cours de traitement\" dans un state à part (ex : pendingId) pour cibler l'affichage et désactiver le bouton pendant l'appel.",
    },
    {
      id: "error-resilience",
      moduleRef: "async",
      title: "Résister aux pannes réseau",
      spec: "Si l'API est injoignable, l'interface doit afficher un message compréhensible et proposer de réessayer — jamais planter ni rester bloquée sur \"Chargement…\".",
      acceptance: [
        "Couper le serveur pendant que le front tourne : un message d'erreur exploitable apparaît, pas une exception non gérée",
        "Un bouton \"réessayer\" relance la requête sans recharger toute la page",
      ],
      hint: "try/catch autour du fetch, avec un état error distinct de loading — jamais le même flag booléen pour les deux.",
    },
    {
      id: "build-config",
      moduleRef: "vite",
      title: "Configurer les environnements",
      spec: "Le front ne doit jamais avoir l'URL de l'API codée en dur. Utilise une variable d'environnement (VITE_API_URL), avec une valeur par défaut sensée en développement.",
      acceptance: [
        "npm run build (client) produit un bundle sans warning bloquant",
        "Changer VITE_API_URL et relancer npm run dev change l'URL appelée, sans toucher au code",
      ],
      hint: "import.meta.env.VITE_API_URL — et un fichier .env.example committé, jamais le vrai .env.",
    },
    {
      id: "typed-contract",
      moduleRef: "ts",
      title: "Fiabiliser le contrat de données (bonus)",
      spec: "Documente (au minimum en JSDoc, ou en convertissant en TypeScript) la forme exacte d'une tâche partagée entre front et back : { id, title, done, createdAt }.",
      acceptance: [
        "La définition existe à un seul endroit, pas copiée-collée différemment côté front et back",
        "Ajouter un champ à une tâche ne demande de modifier qu'un seul fichier pour que les deux côtés le sachent",
      ],
      hint: "Même sans vrai TypeScript, un fichier types.js avec un commentaire JSDoc @typedef documente déjà la forme attendue et évite les dérives silencieuses.",
    },
    {
      id: "deploy",
      moduleRef: "boss",
      title: "Déployer pour de vrai",
      spec: "Déploie server/ sur Render et client/ sur Vercel — exactement comme pour Fullstack Quest lui-même. Connecte les deux avec une variable d'environnement d'URL, pas une adresse en dur.",
      acceptance: [
        "L'URL Vercel publique affiche la liste de tâches réelle servie par Render, sans erreur CORS",
        "Créer une tâche depuis le site déployé (pas localhost) fonctionne de bout en bout",
      ],
      hint: "Le piège classique : CORS. Le middleware cors côté Express doit explicitement autoriser l'origine Vercel.",
    },
  ],
};

/* ---------------------------------------------------------------------- */
/*  QUALIFICATION — deux paliers d'accès aux épreuves plus techniques     */
/* ---------------------------------------------------------------------- */
// Tronc commun toujours accessible séquentiellement ; au-delà, chaque secteur
// exige en plus d'avoir réussi l'Examen de Qualification (voir plus bas).
const FOUNDATION_TIER = ["js-fond", "js-avance", "async"];
const ADVANCED_TIER = ["ts", "react", "next", "express", "vite", "boss"];
const QUALIFICATION_PASS_PCT = 80;
const QUALIFICATION_SIZE = 10;
// Score minimum sur un secteur pour débloquer son Épreuve Technique (l'exercice
// code/débogage, retiré du combat normal et proposé à part une fois "qualifié").
const TECHNICAL_UNLOCK_PCT = 70;
// Au-dessus de ce record, un secteur réussi est considéré "maîtrisé" : en
// dessous, le parcours adaptatif propose de le consolider.
const MASTERY_PCT = 80;

function getBattleQuestions(mod) {
  return mod.questions.filter((q) => !q.technical);
}
function getTechnicalQuestions(mod) {
  return mod.questions.filter((q) => q.technical);
}
function isTechnicalUnlocked(profile, mod) {
  const r = profile.results[mod.id];
  return !!r?.passed && (r.bestScore || 0) >= TECHNICAL_UNLOCK_PCT;
}
function isTechnicalDone(profile, mod) {
  return !!profile.technical?.[mod.id]?.passed;
}

/* ---------------------------------------------------------------------- */
/*  BANQUE DE QUESTIONS DISTANTE (Postgres via ai-server)                  */
/* ---------------------------------------------------------------------- */
// Identifiants stables : indispensables pour que l'état SRS survive à
// l'arrivée de questions distantes (les anciens index `q-N` se décalaient).
MODULES.forEach((m) => {
  m.questions.forEach((q, i) => { q.qid = `s-${m.id}-${i}`; });
  m.staticQuestions = m.questions;
});

const BANK_CACHE_KEY = "fullstack-quest-remote-bank";

function isUsableRemote(r) {
  if (!r || !r.id || !r.prompt || !MODULES.some((m) => m.id === r.moduleId)) return false;
  if (r.qtype === "qcm") return Array.isArray(r.options) && r.options.length >= 2 && Number.isInteger(r.correct) && r.correct >= 0 && r.correct < r.options.length;
  if (r.qtype === "code" || r.qtype === "refactor") return typeof r.starter === "string" && Array.isArray(r.tests) && r.tests.length > 0;
  if (r.qtype === "order") return Array.isArray(r.lines) && r.lines.length >= 2;
  return false;
}

function mapRemoteQuestion(r) {
  const q = { qid: `r-${r.id}`, technical: !!r.technical, prompt: r.prompt };
  if (r.explain) q.explain = r.explain;
  if (r.qtype === "qcm") {
    q.options = r.options; q.correct = r.correct;
    if (r.code) q.code = r.code;
  } else if (r.qtype === "code" || r.qtype === "refactor") {
    q.type = r.qtype; q.starter = r.starter; q.tests = r.tests;
  } else {
    q.type = "order"; q.lines = r.lines;
  }
  return q;
}

// Convertit une question statique (du bundle) en corps d'API pour la banque
// admin. Prérequis de la « Phase B » : verser les secteurs avancés dans la
// banque avant de pouvoir un jour les retirer du bundle. L'anti-doublon
// (content_hash) côté serveur rend l'import idempotent.
function staticQuestionToBankPayload(q, moduleId) {
  const body = { moduleId, qtype: q.type || "qcm", technical: !!q.technical, prompt: q.prompt };
  if (q.explain) body.explain = q.explain;
  if (!q.type || q.type === "qcm") {
    body.qtype = "qcm";
    body.options = q.options;
    body.correct = q.correct;
    if (q.code) body.code = q.code;
  } else if (q.type === "code" || q.type === "refactor") {
    body.starter = q.starter;
    body.tests = q.tests;
  } else if (q.type === "order") {
    body.lines = q.lines;
  }
  return body;
}

// Reconstruit chaque module = statiques + distantes triées par id (ordre
// déterministe : même banque => même pool => même Défi Quotidien, qui est
// une évaluation commune). Idempotent : repartir de staticQuestions permet
// de ré-appliquer une banque plus fraîche sans dupliquer.
function applyRemoteBank(remoteQuestions) {
  const byModule = new Map();
  for (const r of remoteQuestions || []) {
    if (!isUsableRemote(r)) continue;
    if (!byModule.has(r.moduleId)) byModule.set(r.moduleId, []);
    byModule.get(r.moduleId).push(r);
  }
  let applied = 0;
  for (const mod of MODULES) {
    const remotes = (byModule.get(mod.id) || []).sort((a, b) => (a.id < b.id ? -1 : 1)).map(mapRemoteQuestion);
    // La banque fait autorité : une question statique du bundle dont la banque
    // sert une version (même énoncé) est masquée. Sans ça, l'import des secteurs
    // avancés dans la banque (Phase B) ferait voir chaque question EN DOUBLE aux
    // joueurs à pass actif (statique + copie distante). Effet de bord voulu :
    // une édition admin d'une question déjà dans le bundle prime désormais.
    const remotePrompts = new Set(remotes.map((q) => q.prompt.trim()));
    const statics = mod.staticQuestions.filter((q) => !remotePrompts.has(q.prompt.trim()));
    mod.questions = [...statics, ...remotes];
    applied += remotes.length;
  }
  return applied;
}

// Ordre EXACT de l'ancienne numérotation SRS `q-N` : questions statiques non
// techniques, dans l'ordre des modules — figé ici avant toute fusion distante.
const STATIC_BATTLE_QIDS = MODULES.flatMap((m) => m.staticQuestions.filter((q) => !q.technical).map((q) => q.qid));

function withMigratedSrs(profile) {
  const { srsState, changed } = migrateSrsKeys(profile.srsState, STATIC_BATTLE_QIDS);
  return changed ? { ...profile, srsState } : profile;
}

// Fusion locale/serveur sans perte : toute la progression de ce jeu est
// monotone (un module réussi le reste, l'XP ne baisse jamais, un badge ne se
// retire pas) — donc prendre le max/l'union champ par champ ne peut jamais
// effacer un gain, contrairement à "le blob le plus récent gagne" qui perd
// tout le côté le plus vieux même s'il a des gains exclusifs (typiquement une
// session jouée hors-ligne en PWA pendant que le compte progressait ailleurs).
function mergeProfiles(a, b) {
  a = a || FRESH;
  b = b || FRESH;
  const results = { ...a.results };
  for (const [id, r] of Object.entries(b.results || {})) {
    const cur = results[id];
    results[id] = cur
      ? { passed: !!cur.passed || !!r.passed, bestScore: Math.max(cur.bestScore || 0, r.bestScore || 0), flawless: !!cur.flawless || !!r.flawless }
      : r;
  }
  const milestones = { ...(a.chantier?.milestones || {}) };
  for (const [id, m] of Object.entries(b.chantier?.milestones || {})) {
    const cur = milestones[id];
    milestones[id] = cur
      ? { done: !!cur.done || !!m.done, completedISO: cur.completedISO && m.completedISO ? (cur.completedISO < m.completedISO ? cur.completedISO : m.completedISO) : (cur.completedISO || m.completedISO || null) }
      : m;
  }
  const srsState = { ...(a.srsState || {}) };
  for (const [id, s] of Object.entries(b.srsState || {})) {
    const cur = srsState[id];
    srsState[id] = !cur || (s.reviews?.length || 0) > (cur.reviews?.length || 0) ? s : cur;
  }
  const dailyRuns = { ...(a.dailyRuns || {}) };
  for (const [day, run] of Object.entries(b.dailyRuns || {})) {
    const cur = dailyRuns[day];
    dailyRuns[day] = !cur || (run.score || 0) > (cur.score || 0) ? run : cur;
  }
  // Dossier de compétences : compteurs monotones → max par champ/axe. Jamais
  // additionnés (une même revue synchronisée deux fois ne doit pas doubler).
  const sa = a.skills || {}, sb = b.skills || {};
  const weakAxes = { ...(sa.weakAxes || {}) };
  for (const [axis, n] of Object.entries(sb.weakAxes || {})) {
    weakAxes[axis] = Math.max(weakAxes[axis] || 0, n || 0);
  }
  // Journal : union par horodatage (sans perte, comme badges/lore), borné.
  const logMap = new Map();
  for (const e of [...(sa.log || []), ...(sb.log || [])]) {
    if (e && e.ts != null) logMap.set(e.ts, e);
  }
  const log = [...logMap.values()].sort((x, y) => (x.ts || 0) - (y.ts || 0)).slice(-SKILL_LOG_CAP);
  const skills = {
    reviewed: Math.max(sa.reviewed || 0, sb.reviewed || 0),
    clean: Math.max(sa.clean || 0, sb.clean || 0),
    weakAxes,
    log,
  };
  return {
    ...FRESH,
    ...a,
    ...b,
    xp: Math.max(a.xp || 0, b.xp || 0),
    bestCombo: Math.max(a.bestCombo || 0, b.bestCombo || 0),
    badges: Array.from(new Set([...(a.badges || []), ...(b.badges || [])])),
    lore: Array.from(new Set([...(a.lore || []), ...(b.lore || [])])),
    results,
    technical: { ...(a.technical || {}), ...(b.technical || {}) },
    qualification: {
      passed: !!a.qualification?.passed || !!b.qualification?.passed,
      bestScore: Math.max(a.qualification?.bestScore || 0, b.qualification?.bestScore || 0),
      attempts: Math.max(a.qualification?.attempts || 0, b.qualification?.attempts || 0),
    },
    chantier: { milestones },
    srsState,
    dailyRuns,
    skills,
    updatedISO: new Date().toISOString(),
  };
}

const AI_SETTINGS_KEY = "fullstack-quest-ai-settings";
// URL de ton ai-server déployé, injectée au build (Vercel: variable VITE_AI_SERVER_URL).
const ENV_AI_SERVER_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_AI_SERVER_URL) || "";
// L'utilisateur ne choisit pas son moteur IA : si l'app a été buildée avec un
// serveur FSQ, il est utilisé d'office ; sinon repli sur un Ollama local.
// La console admin (#admin) permet de changer tout ça.
const AI_DEFAULT = ENV_AI_SERVER_URL
  ? { provider: "fsq-server", endpoint: ENV_AI_SERVER_URL, model: "", apiKey: "" }
  : { provider: "ollama", endpoint: "http://localhost:11434", model: "llama3.2", apiKey: "" };
const ADMIN_KEY_STORAGE = "fullstack-quest-admin-key";
const AUTH_TOKEN_KEY = "fullstack-quest-auth-token";
// Dernier /auth/me connu : permet de garder l'accès (pass, quota) hors-ligne.
const AUTH_CACHE_KEY = "fullstack-quest-auth-cache";
// Narration IA du parcours (couche hybride) : cache local, jamais synchronisé,
// clé = signature du parcours + jour → au plus un appel par état distinct/jour.
const PARCOURS_NARRATION_KEY = "fullstack-quest-parcours-narration";
// Résultat de défi joué hors-ligne, en attente d'envoi au serveur (classement).
const PENDING_DAILY_KEY = "fullstack-quest-pending-daily";

// Vérifications automatiques du paiement, espacées : 10s, puis 20s, puis 30s.
// Ensuite on laisse la main à la vérification manuelle (bouton dans la modale).
const PAY_POLL_WINDOWS_MS = [10000, 20000, 30000];
// Statuts finaux : plus rien à attendre (l'un débloque, les autres arrêtent).
const PAY_FINAL_STATUSES = ["PAID", "FAILED", "EXPIRED"];
// Statuts d'attente : la fenêtre d'attente reste affichée tant qu'on y est.
const PAY_WAITING_STATUSES = ["PENDING", "PROCESSING", "TIMEOUT"];

function bankApiBase() {
  return (ENV_AI_SERVER_URL || "http://localhost:8000").replace(/\/$/, "");
}

// Appel générique à l'ai-server ; l'erreur porte le detail FastAPI et le status HTTP.
async function apiJson(path, { token, method = "GET", body } = {}) {
  const res = await fetch(`${bankApiBase()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.detail || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Erreurs affichées au joueur : on ne montre jamais un message technique brut
// (code HTTP, exception réseau, nom de service). Si le serveur a renvoyé un
// détail rédigé pour l'utilisateur (français, sans jargon), on le garde ;
// sinon on retombe sur un message générique clair.
function friendlyError(e, fallback) {
  const msg = String(e?.message || e || "").trim();
  const technical = !msg || /\b(HTTP|http)\b|\b\d{3}\b|fetch|network|Failed to|TypeError|undefined|null|Error:|ECONN|timeout|CORS/i.test(msg);
  return technical ? fallback : msg;
}

async function adminFetch(path, adminKey, opts = {}) {
  const res = await fetch(`${bankApiBase()}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey, ...(opts.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.detail || `HTTP ${res.status}`);
  return body;
}

const CUSTOM_ENDPOINT = "__custom__";

function getEndpointPresets(provider) {
  if (provider === "fsq-server") {
    const presets = [];
    if (ENV_AI_SERVER_URL) presets.push({ label: "Serveur FSQ déployé (Render)", value: ENV_AI_SERVER_URL });
    presets.push({ label: "Serveur FSQ (local)", value: "http://localhost:8000" });
    return presets;
  }
  if (provider === "openai") {
    return [{ label: "OpenAI-compatible (local)", value: "http://localhost:1234/v1" }];
  }
  return [{ label: "Ollama (local)", value: "http://localhost:11434" }];
}
/* ---------------------------------------------------------------------- */
/*  COMPOSANT PRINCIPAL                                                    */
/* ---------------------------------------------------------------------- */
const FRESH = {
  xp: 0,
  results: {},
  badges: [],
  lore: [],
  bestCombo: 0,
  meta: { version: 4, features: { daily: true, srs: true, chantier: true, qualification: true } },
  dailyRuns: {},
  srsState: {},
  chantier: { milestones: {} },
  qualification: { passed: false, bestScore: 0, attempts: 0 },
  technical: {},
  // Dossier de compétences : cumul des verdicts de revue de code. Monotone
  // (les compteurs ne font que croître), donc fusionnable par max sans perte.
  // weakAxes = cumul (où tu pèches). log = journal daté des revues (borné), d'où
  // l'on tire la faiblesse RÉCENTE et son ÉVOLUTION dans le temps.
  skills: { reviewed: 0, clean: 0, weakAxes: {}, log: [] },
};

/* Enregistre une revue dans le dossier de compétences. Pur : renvoie un nouveau
   profil. reviewed/clean comptent les revues ; weakAxes cumule les axes signalés
   faibles (verdict « à polir »). */
// Journal de revues borné : garde les ~200 dernières pour lire la faiblesse
// récente et son évolution, sans faire grossir le profil indéfiniment.
const SKILL_LOG_CAP = 200;

function withReviewRecorded(profile, result) {
  if (!result || !result.ok || !result.verdict) return profile;
  const prev = profile.skills || { reviewed: 0, clean: 0, weakAxes: {} };
  const weakAxes = { ...(prev.weakAxes || {}) };
  for (const axis of result.axes || []) weakAxes[axis] = (weakAxes[axis] || 0) + 1;
  const entry = { ts: Date.now(), verdict: result.verdict, axes: [...(result.axes || [])] };
  const log = [...(prev.log || []), entry].slice(-SKILL_LOG_CAP);
  return {
    ...profile,
    skills: {
      reviewed: (prev.reviewed || 0) + 1,
      clean: (prev.clean || 0) + (result.verdict === "propre" ? 1 : 0),
      weakAxes,
      log,
    },
  };
}

// Évolution par axe : compare la fenêtre récente à ce qui précède. Pur.
// Renvoie, pour chaque axe du vocabulaire, son taux de signalement récent et
// la tendance (improving = moins signalé qu'avant → en progrès).
function computeSkillTrends(log, recentWindow = 20) {
  const entries = (Array.isArray(log) ? log : []).slice().sort((a, b) => (a.ts || 0) - (b.ts || 0));
  const n = entries.length;
  const recent = entries.slice(Math.max(0, n - recentWindow));
  const earlier = entries.slice(0, Math.max(0, n - recentWindow));
  const rate = (list, axis) => (list.length ? list.filter((e) => (e.axes || []).includes(axis)).length / list.length : 0);
  const axes = Object.keys(REVIEW_AXES).map((a) => {
    const recentRate = rate(recent, a);
    const earlierRate = earlier.length ? rate(earlier, a) : null;
    let trend = "stable";
    if (earlierRate !== null) {
      if (recentRate < earlierRate - 0.08) trend = "improving";
      else if (recentRate > earlierRate + 0.08) trend = "worsening";
    }
    return { id: a, label: REVIEW_AXES[a], recentRate, earlierRate, trend, recentCount: recent.filter((e) => (e.axes || []).includes(a)).length };
  });
  return { axes, recentN: recent.length, hasHistory: earlier.length > 0, total: n };
}

/* Daily Challenge & SRS Helpers */
function getTodaysSeed() {
  const today = new Date();
  const dateStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;
  return deriveSeed([dateStr, "daily", "v1"]);
}

function getDailyReference() {
  const today = new Date();
  return `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;
}

// Le Défi Quotidien et l'Examen ne savent afficher que des QCM (pas d'éditeur
// de code ni de réordonnancement) : on ne tire que ces questions-là.
function isQcm(q) {
  return !q.type || q.type === "qcm";
}

// Le Défi est chronométré, sans aide IA : un aperçu du niveau réel sous stress.
// Un compte à rebours par question ; à zéro, la question est comptée ratée.
const DAILY_SECONDS_PER_Q = 45;

// Empreinte de contenu d'une question — MIROIR EXACT de `_content_hash` côté
// serveur (ai-server/main.py) : sha256("moduleId|qtype|prompt-normalisé"), où
// la normalisation est minuscule + espaces compactés. Sert à faire noter le
// Défi côté serveur : le client envoie ses réponses (hash + option choisie),
// le serveur retrouve la question en banque et corrige lui-même le score.
async function contentHash(moduleId, qtype, prompt) {
  const normalized = String(prompt).toLowerCase().split(/\s+/).filter(Boolean).join(" ");
  const data = new TextEncoder().encode(`${moduleId}|${qtype}|${normalized}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateDailyRun(seed, modules) {
  const r = rng(seed);
  const picked = [];
  for (const mod of modules) {
    const pool = getBattleQuestions(mod).filter(isQcm);
    if (pool.length === 0) continue;
    const qIdx = Math.floor(r() * pool.length);
    const q = pool[qIdx];
    picked.push({ ...q, moduleId: mod.id, moduleName: mod.title });
  }
  return picked;
}

// Marque le défi du jour comme fait localement (clé datée), sans écraser un vrai
// résultat déjà présent. Sert à refléter dans le gate un défi passé sur un AUTRE
// appareil (serveur : access.dailyDoneToday) — sans jamais faire confiance à un
// cache d'access qui pourrait être périmé d'un jour à l'autre.
function markDailyDoneLocally(profile) {
  const ref = getDailyReference();
  if (profile?.dailyRuns?.[ref]) return profile;
  return {
    ...profile,
    dailyRuns: { ...(profile?.dailyRuns || {}), [ref]: { doneElsewhere: true, completedISO: new Date().toISOString() } },
  };
}

function collectAllQuestions(modules) {
  const all = [];
  for (const mod of modules) {
    for (const q of getBattleQuestions(mod)) {
      all.push({ ...q, moduleId: mod.id });
    }
  }
  return all;
}

/* ---------------------------------------------------------------------- */
/*  PARCOURS ADAPTATIF — moteur déterministe                              */
/* ---------------------------------------------------------------------- */
// À partir des seuls signaux déjà présents dans le profil (records par
// secteur, cartes SRS dues, axes faibles des revues d'ADA, qualification,
// chantier), on classe les actions possibles par valeur pédagogique et on
// désigne LA prochaine étape. Fonction pure, testable, hors-ligne : aucun
// appel IA. Chaque étape porte un `action` sérialisable (type + params) que
// l'app traduit en navigation via `runParcoursAction`.
function moduleAccessibleFor(profile, idx, hasPass) {
  if (idx <= 0) return true;
  if (!profile.results?.[MODULES[idx - 1].id]?.passed) return false;
  const mod = MODULES[idx];
  if (ADVANCED_TIER.includes(mod.id) && (!hasPass || !profile.qualification?.passed)) return false;
  return true;
}

function computeParcours(profile, hasPass) {
  const results = profile.results || {};
  const steps = [];
  const dueCount = getDueItems(profile.srsState || {}).length;
  const completedCount = MODULES.filter((m) => results[m.id]?.passed).length;
  const foundationDone = FOUNDATION_TIER.every((id) => results[id]?.passed);
  const qualified = !!profile.qualification?.passed;

  // 1) Révisions espacées dues — consolider avant d'empiler du neuf. La
  //    priorité grimpe avec le retard accumulé et finit par passer devant la
  //    progression quand le backlog devient lourd.
  if (dueCount > 0) {
    steps.push({
      id: "srs",
      kind: "srs",
      priority: 50 + Math.min(dueCount, 10) * 3,
      title: `Réviser ${dueCount} carte${dueCount > 1 ? "s" : ""}`,
      rationale: "Des notions déjà vues arrivent à échéance. Les revoir maintenant les ancre pour de bon avant d'avancer.",
      cta: "Lancer les révisions",
      accent: SUCCESS,
      action: { type: "srs" },
    });
  }

  // 2) Progression — le premier secteur non encore réussi. Selon l'accès, ça
  //    devient soit le duel lui-même, soit le verrou qui le précède
  //    (qualification ou pass) — jamais une impasse.
  const frontIdx = MODULES.findIndex((m) => !results[m.id]?.passed);
  if (frontIdx !== -1 && moduleAccessibleFor(profile, frontIdx, hasPass)) {
    const mod = MODULES[frontIdx];
    const started = !!results[mod.id];
    steps.push({
      id: `module-${mod.id}`,
      kind: "module",
      priority: 72,
      title: `${started ? "Reprendre" : "Affronter"} ${mod.title}`,
      rationale: started
        ? `Duel déjà entamé (record ${results[mod.id]?.bestScore || 0}%). Termine-le pour ouvrir la suite.`
        : `Prochain secteur de ta progression. ${mod.boss?.name || "Un boss"} t'y attend.`,
      cta: started ? "Reprendre le duel" : "Entrer dans le secteur",
      accent: mod.accent,
      action: { type: "module", idx: frontIdx },
    });
  } else if (frontIdx !== -1 && foundationDone && !qualified) {
    // Bloqué par la qualification (front avancé, tronc commun bouclé).
    steps.push({
      id: "qualification",
      kind: "qualification",
      priority: 70,
      title: "Passer l'Examen de Qualification",
      rationale: `Tu as bouclé le tronc commun. L'examen (seuil ${QUALIFICATION_PASS_PCT}%) ouvre les 6 secteurs avancés et le Chantier.`,
      cta: hasPass ? "Passer l'examen" : "Débloquer et passer l'examen",
      accent: AMBER,
      locked: !hasPass,
      action: hasPass ? { type: "qualification" } : { type: "pay" },
    });
  } else if (frontIdx !== -1 && !hasPass) {
    // Bloqué par le pass (secteur avancé, qualifié mais pass expiré/absent).
    steps.push({
      id: "unlock",
      kind: "unlock",
      priority: 66,
      title: "Débloquer l'accès complet",
      rationale: "La suite du parcours — secteurs avancés, Chantier, coach IA — demande le pass d'accès.",
      cta: "Voir l'accès complet",
      accent: AMBER,
      locked: true,
      action: { type: "pay" },
    });
  }

  // 3) Chantier en cours — capstone, forte valeur une fois débloqué.
  const chantierUnlocked = hasPass && qualified && completedCount >= Math.ceil(MODULES.length / 2);
  const chantierTotal = CHANTIER.milestones.length;
  const chantierDone = CHANTIER.milestones.filter((m) => profile.chantier?.milestones?.[m.id]?.done).length;
  if (chantierUnlocked && chantierDone < chantierTotal) {
    steps.push({
      id: "chantier",
      kind: "chantier",
      priority: 62,
      title: chantierDone === 0 ? "Démarrer le Chantier" : `Continuer le Chantier — ${chantierDone}/${chantierTotal}`,
      rationale: "Le projet fil rouge : c'est là que tu assembles tout ce que tu as appris en une vraie application.",
      cta: "Ouvrir le Chantier",
      accent: AMBER,
      action: { type: "chantier" },
    });
  }

  // 4) Épreuve technique disponible (secteur maîtrisé à 70 %+, pas encore
  //    réussie) — c'est là qu'ADA relit du vrai code et nourrit le dossier.
  if (hasPass) {
    const techIdx = MODULES.findIndex((m) => isTechnicalUnlocked(profile, m) && !isTechnicalDone(profile, m));
    if (techIdx !== -1) {
      const mod = MODULES[techIdx];
      steps.push({
        id: `technical-${mod.id}`,
        kind: "technical",
        priority: 46,
        title: `Épreuve technique — ${mod.title}`,
        rationale: "Un exercice de code réel t'attend dans ce secteur. ADA le relit et en tire ton dossier de compétences.",
        cta: "Ouvrir l'épreuve",
        accent: mod.accent,
        action: { type: "technical", idx: techIdx },
      });
    }
  }

  // 5) Consolider un secteur réussi de justesse (record < maîtrise).
  const fragile = MODULES
    .filter((m) => results[m.id]?.passed && (results[m.id]?.bestScore || 0) < MASTERY_PCT)
    .sort((a, b) => (results[a.id].bestScore || 0) - (results[b.id].bestScore || 0))[0];
  if (fragile) {
    steps.push({
      id: `consolidate-${fragile.id}`,
      kind: "consolidate",
      priority: 44,
      title: `Consolider ${fragile.title}`,
      rationale: `Réussi de justesse (${results[fragile.id].bestScore || 0}%). Le rejouer vise la maîtrise (${MASTERY_PCT}%+) et solidifie ta qualification.`,
      cta: "Rejouer le secteur",
      accent: fragile.accent,
      action: { type: "module", idx: MODULES.indexOf(fragile) },
    });
  }

  // 6) Axe qualité dominant — l'axe qui revient le plus dans les relectures.
  const weak = profile.skills?.weakAxes || {};
  const topAxis = Object.entries(weak).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])[0];
  if (topAxis) {
    steps.push({
      id: "axis",
      kind: "axis",
      priority: 42,
      title: `Travailler ton axe « ${REVIEW_AXES[topAxis[0]] || topAxis[0]} »`,
      rationale: `C'est l'axe le plus signalé par ADA (${topAxis[1]}×). Vise-le au prochain exercice de code, puis redemande une revue.`,
      cta: "Voir mon dossier",
      accent: "#8ECAE6",
      action: { type: "skills" },
    });
  }

  steps.sort((a, b) => b.priority - a.priority);
  return {
    steps,
    primary: steps[0] || null,
    dueCount,
    completedCount,
    allPassed: frontIdx === -1,
  };
}

// Couche hybride : le moteur ci-dessus reste la colonne vertébrale (gratuite,
// hors-ligne) ; par-dessus, ADA peut commenter le plan en une poignée de
// phrases. Prompt compact (peu de tokens) et borné à la liste calculée — le
// modèle n'invente pas d'étapes, il ne fait que motiver et donner du sens.
function buildParcoursPrompt(parcours) {
  const steps = parcours.steps.slice(0, 4)
    .map((s, i) => `${i + 1}. ${s.title} — ${s.rationale}`)
    .join("\n");
  return [
    "Tu es ADA, la mentore du jeu Fullstack Quest : bienveillante, concise, tutoiement, zéro jargon inutile.",
    "Voici le plan d'apprentissage calculé pour l'apprenti aujourd'hui, de la plus haute priorité à la plus basse :",
    steps,
    "",
    "En 2 à 3 phrases MAXIMUM, encourage-le et explique pourquoi commencer par la première étape est le bon choix maintenant. Aucune réponse technique, aucune correction : seulement de la motivation et du sens. N'invente aucune étape absente de la liste.",
  ].join("\n");
}

/* Appel générique au coach IA — serveur FSQ (authentifié par compte) ou
   serveur local (Ollama / OpenAI-compatible) pour le dev. Partagé entre
   l'indice de question et l'indice de jalon de Chantier. */
async function callAi(prompt, aiSettings, authToken) {
  const endpoint = String(aiSettings.endpoint || "").replace(/\/$/, "");
  try {
    let text = "";
    if (aiSettings.provider === "fsq-server") {
      const res = await fetch(`${endpoint}/api/v1/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          ...(aiSettings.apiKey ? { "X-API-Key": aiSettings.apiKey } : {}),
        },
        body: JSON.stringify({ prompt, max_tokens: 300 }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // 402 = pass requis, 429 = quota du jour : messages serveur affichés tels quels
        return { ok: false, error: body?.detail || "Le coach n'est pas disponible pour l'instant. Réessaie dans un instant." };
      }
      const data = await res.json();
      text = data?.answer || "";
    } else if (aiSettings.provider === "openai") {
      const res = await fetch(`${endpoint}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: aiSettings.model,
          messages: [
            { role: "system", content: "Tu es un coach de révision concis et prudent. Ne donne jamais la réponse brute." },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          stream: false,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      text = data?.choices?.[0]?.message?.content || "";
    } else {
      const res = await fetch(`${endpoint}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: aiSettings.model,
          prompt,
          stream: false,
          options: { temperature: 0.2 },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      text = data?.response || "";
    }
    const cleaned = String(text).trim();
    if (!cleaned) throw new Error("Réponse vide");
    return { ok: true, text: cleaned };
  } catch {
    return { ok: false, error: "Le coach n'est pas disponible pour l'instant. Réessaie dans un instant." };
  }
}

/* Axes de qualité — vocabulaire FERMÉ, en miroir de REVIEW_AXES côté serveur
   (ai-server/main.py). Chaque revue « à polir » nomme le(s) axe(s) concerné(s) ;
   le cumul par axe compose le « dossier de compétences » du joueur. */
const REVIEW_AXES = {
  nommage: "Nommage",
  "lisibilité": "Lisibilité",
  "simplicité": "Simplicité",
  "robustesse": "Robustesse",
  idiomes: "Idiomes JS",
  structure: "Structure",
};

function normalizeAxes(list) {
  const seen = new Set();
  const out = [];
  for (const raw of list || []) {
    const a = String(raw).trim().toLowerCase();
    if (REVIEW_AXES[a] && !seen.has(a)) { seen.add(a); out.push(a); }
  }
  return out.slice(0, 3);
}

/* Revue de code — après que les tests passent, ADA relit la solution et rend
   un verdict qualité ("propre" | "a_polir") + un commentaire + les axes faibles.
   Le serveur FSQ assemble le prompt et parse tout lui-même ; pour les moteurs de
   dev locaux (Ollama / OpenAI-compatible) on reproduit le même contrat ici. */
function parseReviewText(text) {
  const lines = String(text).trim().split("\n");
  const m = lines[0]?.match(/^\s*VERDICT\s*:\s*(PROPRE|[AÀ][_ ]?POLIR)\b/i);
  if (!m) return { verdict: null, comment: String(text).trim(), axes: [] };
  const verdict = m[1].toUpperCase() === "PROPRE" ? "propre" : "a_polir";
  const rest = [];
  let axes = [];
  for (const line of lines.slice(1)) {
    const am = line.match(/^\s*AXES\s*:\s*(.+)$/i);
    if (am && axes.length === 0) axes = normalizeAxes(am[1].split(/[,;/]| et /));
    else rest.push(line);
  }
  return { verdict, comment: rest.join("\n").trim(), axes: verdict === "a_polir" ? axes : [] };
}

async function callAiReview(q, code, aiSettings, authToken, mode = "exercise") {
  // "exercise" : q.tests = [{call, expect}] exécutés et verts ;
  // "chantier" : q.tests = critères d'acceptation (texte), rien n'est exécuté.
  const testLabels = (q.tests || []).map((t) => (t && typeof t === "object" ? t.call : String(t)));
  if (aiSettings.provider === "fsq-server") {
    const endpoint = String(aiSettings.endpoint || "").replace(/\/$/, "");
    try {
      const res = await fetch(`${endpoint}/api/v1/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          ...(aiSettings.apiKey ? { "X-API-Key": aiSettings.apiKey } : {}),
        },
        body: JSON.stringify({
          prompt: q.prompt,
          starter: q.starter || null,
          code,
          tests: testLabels,
          mode,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { ok: false, error: body?.detail || "La relecture n'est pas disponible pour l'instant. Réessaie dans un instant." };
      }
      const data = await res.json();
      return { ok: true, verdict: data?.verdict || null, comment: String(data?.comment || "").trim(), axes: normalizeAxes(data?.axes) };
    } catch {
      return { ok: false, error: "La relecture n'est pas disponible pour l'instant. Réessaie dans un instant." };
    }
  }
  // Moteur local (dev) : on embarque les consignes de revue dans le prompt et on parse ici.
  const prompt = [
    mode === "chantier"
      ? "L'apprenant construit un vrai projet hors de l'app et colle le code d'un jalon. Tu ne peux pas l'exécuter : juge sur lecture si les critères d'acceptation semblent remplis ET si le code est propre (nommage, lisibilité, gestion d'erreurs)."
      : "Le code ci-dessous passe déjà tous ses tests : juge uniquement sa QUALITÉ (nommage, lisibilité, simplicité, idiomes JS modernes).",
    "Réponds en français. Ligne 1 exactement « VERDICT: PROPRE » ou « VERDICT: A_POLIR », puis 2 à 4 phrases : ce qui est bien, et si A_POLIR, LE point le plus important à corriger, concret.",
    `Énoncé: ${q.prompt}`,
    q.starter ? `Code de départ: ${q.starter}` : "",
    testLabels.length ? `${mode === "chantier" ? "Critères d'acceptation" : "Tests (verts)"}: ${testLabels.join(" | ")}` : "",
    `Code soumis:\n${code}`,
  ].filter(Boolean).join("\n");
  const r = await callAi(prompt, aiSettings, authToken);
  if (!r.ok) return r;
  const { verdict, comment, axes } = parseReviewText(r.text);
  return { ok: true, verdict, comment: comment || r.text, axes };
}

function ReviewVerdictBadge({ verdict }) {
  const badge = verdict === "propre"
    ? { label: "✓ PROPRE", color: SUCCESS }
    : verdict === "a_polir"
    ? { label: "À POLIR", color: AMBER }
    : null;
  if (!badge) return null;
  return (
    <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold" style={{ backgroundColor: `${badge.color}22`, color: badge.color, border: `1px solid ${badge.color}` }}>
      {badge.label}
    </span>
  );
}

/* Puces des axes de qualité à travailler, telles que nommées par la revue. */
function AxisChips({ axes }) {
  const list = (axes || []).filter((a) => REVIEW_AXES[a]);
  if (list.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {list.map((a) => (
        <span key={a} className="px-2 py-0.5 rounded-full font-mono text-[10px]" style={{ backgroundColor: `${AMBER}18`, color: AMBER, border: `1px solid ${AMBER}55` }}>
          {REVIEW_AXES[a]}
        </span>
      ))}
    </div>
  );
}

/* Panneau de revue de code ADA — partagé entre les duels (BattleView) et les
   Épreuves Techniques. S'affiche une fois les tests verts. */
function CodeReviewPanel({ review, locked, onAsk, onUnlock, onResubmit }) {
  const accent = review?.verdict === "propre" ? SUCCESS : review?.verdict === "a_polir" ? AMBER : "#8ECAE6";
  return (
    <div className="mt-3 p-3 rounded-md fsq-rise" style={{ backgroundColor: PANEL_SOFT, borderLeft: `3px solid ${accent}` }}>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <p className="font-mono text-[11px] tracking-widest" style={{ color: TEXT_MUTED }}>🔍 REVUE DE CODE — ADA</p>
        {review?.verdict ? (
          <ReviewVerdictBadge verdict={review.verdict} />
        ) : locked ? (
          <button onClick={onUnlock} className="px-2 py-1 rounded-md font-mono text-[11px] flex items-center gap-1" style={{ backgroundColor: AMBER, color: BG }}>
            <Unlock size={11} /> Débloquer
          </button>
        ) : (
          <button onClick={onAsk} disabled={review?.busy} className="px-2 py-1 rounded-md font-mono text-[11px] disabled:opacity-50" style={{ border: `1px solid ${LINE}`, color: TEXT }}>
            {review?.busy ? "ADA relit…" : "Faire relire mon code"}
          </button>
        )}
      </div>
      {!review?.comment && !review?.error && (
        <p className="text-xs leading-relaxed" style={{ color: TEXT_MUTED }}>
          {locked
            ? "Tes tests passent — mais un pro relirait-il ton code sans tiquer ? ADA relit comme en vraie revue de code : nommage, lisibilité, idiomes. Inclus dans l'accès complet."
            : "Tes tests passent — reste à savoir si le code est propre. ADA le relit comme un senior en revue : verdict + l'amélioration qui compte. (Coûte un indice du quota.)"}
        </p>
      )}
      {review?.error && <p className="text-xs" style={{ color: DANGER }}>{review.error}</p>}
      {review?.comment && (
        <MarkdownLite text={review.comment} className="text-xs leading-relaxed pr-1" style={{ color: TEXT, maxHeight: 180, overflowY: "auto" }} />
      )}
      {review?.verdict === "a_polir" && <AxisChips axes={review.axes} />}
      {review?.verdict === "a_polir" && onResubmit && (
        <div className="mt-2">
          <button onClick={onResubmit} disabled={review?.busy} className="px-2 py-1 rounded-md font-mono text-[11px] disabled:opacity-50" style={{ backgroundColor: AMBER, color: BG }}>
            {review?.busy ? "ADA relit…" : "↺ Corriger et resoumettre"}
          </button>
          <span className="ml-2 text-[11px]" style={{ color: TEXT_MUTED }}>Modifie ton code ci-dessus, les tests seront re-vérifiés avant la relecture.</span>
        </div>
      )}
    </div>
  );
}

/* ====================================================================== */
/*  VUES — chaque écran est un composant pur piloté par `ctx`             */
/* ====================================================================== */

/* --- Examen de Qualification ------------------------------------------ */
function QualificationView({ ctx }) {
  const { qualRun, qualQIdx, setQualQIdx, qualScore, setQualScore, setView, finishQualificationExam } = ctx;
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState(null);

  if (!qualRun || qualQIdx >= qualRun.length) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG, color: TEXT }}>
        <div className="text-center px-4 max-w-sm">
          <GraduationCap size={40} className="mx-auto mb-4" style={{ color: result?.passed ? SUCCESS : AMBER }} />
          <h2 className="text-2xl sm:text-3xl font-mono font-bold mb-4">
            {result?.passed ? "Qualification obtenue !" : "Examen terminé"}
          </h2>
          <div className="mb-6">
            <Frame accent={result?.passed ? SUCCESS : AMBER} className="inline-block p-4">
              <div style={{ backgroundColor: PANEL }} className="p-4 -m-4 rounded-sm">
                <p className="font-mono text-xs tracking-widest mb-2" style={{ color: TEXT_MUTED }}>SCORE</p>
                <p className="text-xl font-bold" style={{ color: result?.passed ? SUCCESS : AMBER }}>{qualScore} / {qualRun?.length || 0} · {result?.pct ?? 0}%</p>
                <p className="text-xs mt-2" style={{ color: TEXT_MUTED }}>Seuil requis : {QUALIFICATION_PASS_PCT}%</p>
              </div>
            </Frame>
          </div>
          {!result?.passed && (
            <p className="text-xs mb-4 font-mono leading-relaxed" style={{ color: TEXT_MUTED }}>
              Retente quand tu veux — révise les secteurs fondamentaux (JS, JS Avancé, Async) puis reviens.
            </p>
          )}
          <button onClick={() => setView("map")} className="px-4 py-2 rounded-lg font-mono" style={{ backgroundColor: AMBER, color: BG }}>
            Retour à la Carte
          </button>
        </div>
      </div>
    );
  }

  const q = qualRun[qualQIdx];
  function handleAnswer() {
    if (selected === null) return;
    if (selected === q.correct) { setQualScore((s) => s + 1); SFX.correct(1); } else { SFX.wrong(); }
    setAnswered(true);
  }
  function handleNext() {
    const isLast = qualQIdx + 1 >= qualRun.length;
    if (isLast) setResult(finishQualificationExam());
    setQualQIdx((i) => i + 1);
    setSelected(null);
    setAnswered(false);
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: BG, color: TEXT }}>
      <div className="max-w-xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h3 className="font-mono text-sm font-bold flex items-center gap-1.5" style={{ color: AMBER }}>
            <GraduationCap size={16} /> EXAMEN DE QUALIFICATION
          </h3>
          <span className="font-mono text-xs" style={{ color: TEXT_MUTED }}>{qualQIdx + 1} / {qualRun.length}</span>
        </div>
        <div className="mb-4">
          <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: LINE }}>
            <div className="h-full rounded-full" style={{ width: `${((qualQIdx + 1) / qualRun.length) * 100}%`, backgroundColor: AMBER, transition: "width 300ms ease" }} />
          </div>
        </div>
        <Frame accent={AMBER} className="p-4">
          <div style={{ backgroundColor: PANEL }} className="p-4 -m-4 rounded-sm">
            <h4 className="font-mono font-bold mb-4">{q.prompt}</h4>
            <div className="space-y-2">
              {q.options?.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => !answered && setSelected(idx)}
                  className="w-full p-3 rounded-lg text-left transition-colors"
                  style={{
                    backgroundColor: selected === idx ? `${q.correct === idx ? SUCCESS : DANGER}22` : PANEL_SOFT,
                    border: `1px solid ${selected === idx ? (q.correct === idx ? SUCCESS : DANGER) : LINE}`,
                    color: TEXT,
                  }}
                  disabled={answered}
                >
                  {opt}
                </button>
              ))}
            </div>
            {!answered ? (
              <button onClick={handleAnswer} disabled={selected === null} className="w-full mt-4 py-2 rounded-lg font-mono text-sm" style={{ backgroundColor: selected === null ? LINE : AMBER, color: selected === null ? TEXT_MUTED : BG }}>
                Valider
              </button>
            ) : (
              <>
                {selected === q.correct ? (
                  <p className="text-sm mt-3 font-mono" style={{ color: SUCCESS }}>✓ Correct!</p>
                ) : (
                  <>
                    <p className="text-sm mt-3 font-mono" style={{ color: DANGER }}>✗ Incorrect</p>
                    <p className="text-xs mt-1 font-mono" style={{ color: TEXT_MUTED }}>Réponse: {q.options[q.correct]}</p>
                  </>
                )}
                {q.explain && <p className="text-xs mt-2 leading-relaxed" style={{ color: TEXT_MUTED }}>{q.explain}</p>}
                <button onClick={handleNext} className="w-full mt-4 py-2 rounded-lg font-mono text-sm" style={{ backgroundColor: AMBER, color: BG }}>
                  {qualQIdx + 1 < qualRun.length ? "Suivant →" : "Terminer"}
                </button>
              </>
            )}
          </div>
        </Frame>
      </div>
    </div>
  );
}

/* --- Épreuve Technique (par secteur) ---------------------------------- */
function TechnicalView({ ctx }) {
  const { profile, activeIdx, setView, techCodeInput, setTechCodeInput, techResults, runTechnicalTests,
    review, askCodeReview, resubmitForReview, aiSettings, hasPass, authToken, openModal } = ctx;
  const mod = MODULES[activeIdx];
  const q = mod ? getTechnicalQuestions(mod)[0] : null;
  const [running, setRunning] = useState(false);

  if (!mod || !q) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG, color: TEXT }}>
        <button onClick={() => setView("map")} className="px-4 py-2 rounded-lg font-mono" style={{ backgroundColor: AMBER, color: BG }}>
          Retour à la Carte
        </button>
      </div>
    );
  }

  const done = isTechnicalDone(profile, mod);
  const allPass = techResults.length > 0 && techResults.every((r) => r.pass);

  async function handleRun() {
    setRunning(true);
    await runTechnicalTests();
    setRunning(false);
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: BG, color: TEXT }}>
      <div className="max-w-xl mx-auto">
        <button onClick={() => setView("map")} className="flex items-center gap-1 text-xs font-mono mb-6" style={{ color: TEXT_MUTED }}>
          <ArrowLeft size={14} /> Retour à la carte
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Wrench size={20} style={{ color: mod.accent }} />
          <h2 className="font-mono font-bold text-lg">Épreuve Technique — {mod.title}</h2>
          {done && <CheckCircle2 size={18} style={{ color: SUCCESS }} />}
        </div>

        <Frame accent={mod.accent} className="p-4">
          <div style={{ backgroundColor: PANEL }} className="p-4 -m-4 rounded-sm">
            <p className="text-sm mb-3 leading-relaxed" style={{ color: TEXT }}>{q.prompt}</p>
            <textarea
              value={techCodeInput}
              onChange={(e) => setTechCodeInput(e.target.value)}
              spellCheck={false}
              className="w-full h-40 p-3 rounded-lg font-mono text-xs"
              style={{ backgroundColor: "#081B33", color: TEXT, border: `1px solid ${LINE}` }}
            />
            <button
              onClick={handleRun}
              disabled={running}
              className="w-full mt-3 py-2 rounded-lg font-mono text-sm flex items-center justify-center gap-2"
              style={{ backgroundColor: mod.accent, color: BG }}
            >
              <Play size={14} /> {running ? "Exécution…" : "Lancer les tests"}
            </button>

            {techResults.length > 0 && (
              <div className="mt-4 space-y-1.5">
                {techResults.map((r, i) => (
                  <div key={i} className="flex items-start gap-1.5 font-mono text-xs" style={{ color: r.pass ? SUCCESS : DANGER }}>
                    {r.pass ? <CheckCircle2 size={14} className="shrink-0 mt-0.5" /> : <XCircle size={14} className="shrink-0 mt-0.5" />}
                    <span>{r.call} → {r.error ? r.got : show(r.got)} {r.pass ? "" : `(attendu ${show(r.expect)})`}</span>
                  </div>
                ))}
              </div>
            )}

            {allPass && (
              <p className="text-sm mt-3 font-mono" style={{ color: SUCCESS }}>
                ✓ Épreuve technique validée{done ? "" : " — +40 XP"} !
              </p>
            )}
            {q.explain && allPass && <p className="text-xs mt-2 leading-relaxed" style={{ color: TEXT_MUTED }}>{q.explain}</p>}

            {/* Visible dès que les tests passent, et maintenu si une resoumission
                fait repasser un test au rouge (le garde-fou s'affiche dedans). */}
            {(allPass || review?.verdict) && (
              <CodeReviewPanel
                review={review}
                locked={aiSettings.provider === "fsq-server" && !hasPass}
                onAsk={() => askCodeReview(q, techCodeInput)}
                onUnlock={() => openModal(authToken ? "pay" : "account")}
                onResubmit={() => resubmitForReview(q, techCodeInput)}
              />
            )}
          </div>
        </Frame>
      </div>
    </div>
  );
}

/* --- Daily Seeded Challenge ----------------------------------------- */
// Écran-gate obligatoire : barre l'accès au reste tant que le Défi du Jour
// n'est pas fait. L'invité peut s'authentifier (on vérifie alors côté serveur
// s'il l'a déjà fait ailleurs) ; abandonner déconnecte mais ne libère pas le gate.
function DailyGateView({ ctx }) {
  const { startDailyChallenge, authUser, accountLogout, openModal } = ctx;
  const loggedIn = !!authUser;
  return (
    <div className="min-h-screen w-full flex items-center justify-center font-sans px-4" style={{ backgroundColor: BG, color: TEXT }}>
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-4"><Swords size={40} style={{ color: AMBER }} /></div>
        <p className="font-mono text-[11px] tracking-[0.2em] mb-1" style={{ color: TEXT_MUTED }}>DÉFI DU JOUR — OBLIGATOIRE</p>
        <h1 className="font-mono font-bold text-2xl mb-3">Le même examen pour tous</h1>
        <p className="text-sm leading-relaxed mb-2" style={{ color: TEXT_MUTED }}>
          Chaque jour, tout le monde affronte les mêmes questions. <strong style={{ color: TEXT }}>Chronométré, sans aide</strong> : un aperçu honnête de ton niveau réel, sous pression.
        </p>
        <p className="text-sm leading-relaxed mb-6" style={{ color: TEXT_MUTED }}>
          Tu dois le relever pour accéder au reste aujourd'hui.
        </p>
        <button onClick={() => startDailyChallenge()} className="w-full py-3 rounded-lg font-mono text-sm mb-3 flex items-center justify-center gap-2" style={{ backgroundColor: AMBER, color: BG }}>
          <Play size={16} /> Commencer le défi
        </button>
        {!loggedIn ? (
          <>
            <button onClick={() => openModal("account")} className="w-full py-2 rounded-lg font-mono text-xs" style={{ border: `1px solid ${LINE}`, color: TEXT_MUTED }}>
              J'ai déjà un compte — me connecter
            </button>
            <p className="text-[11px] font-mono mt-2" style={{ color: TEXT_MUTED }}>Déjà fait sur un autre appareil ? Connecte-toi pour le vérifier.</p>
          </>
        ) : (
          <>
            <button onClick={() => accountLogout()} className="w-full py-2 rounded-lg font-mono text-xs" style={{ border: `1px solid ${LINE}`, color: TEXT_MUTED }}>
              Abandonner (me déconnecter)
            </button>
            <p className="text-[11px] font-mono mt-2" style={{ color: TEXT_MUTED }}>Abandonner te déconnecte — et le défi reste obligatoire.</p>
          </>
        )}
      </div>
    </div>
  );
}

function DailyView({ ctx }) {
  const { dailyRun, dailyQIdx, setDailyQIdx, dailyScore, setDailyScore, setView, profile, persist, submitDailyResult, authToken, openModal } = ctx;
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DAILY_SECONDS_PER_Q);
  // Réponses réellement jouées (hors cartes d'abonnement), envoyées au serveur
  // pour notation. On ne stocke que le choix : le serveur détient les corrigés.
  const [answers, setAnswers] = useState([]);

  // Seules les questions jouables (secteurs accessibles) comptent : une question
  // d'un secteur réservé au pass est remplacée par une invitation à l'abonnement
  // et exclue du score — le total du jour est donc le nombre de questions jouables.
  const scorableTotal = (dailyRun || []).filter((x) => !x.locked).length;
  const done = !dailyRun || dailyQIdx >= dailyRun.length;
  const q = done ? null : dailyRun[dailyQIdx];
  const isLocked = !done && !!q?.locked;

  // Chrono par question : remis à zéro à chaque question, gelé dès qu'on a
  // répondu ou sur une carte d'abonnement.
  useEffect(() => {
    if (done || answered || isLocked) return;
    setTimeLeft(DAILY_SECONDS_PER_Q);
    const t = setInterval(() => setTimeLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [dailyQIdx, answered, isLocked, done]);

  // À zéro : la question est comptée ratée (on révèle la bonne réponse sans
  // créditer de point). Effet séparé pour ne pas faire d'effet de bord dans un updater.
  useEffect(() => {
    if (!done && !answered && !isLocked && timeLeft === 0) { setAnswered(true); SFX.wrong(); }
  }, [timeLeft, answered, isLocked, done]);

  function advance() {
    const cur = dailyRun[dailyQIdx];
    // On accumule la réponse jouée (les cartes d'abonnement verrouillées ne
    // comptent pas). `selected` vaut null si le temps a été écoulé = raté.
    let nextAnswers = answers;
    if (cur && !cur.locked) {
      nextAnswers = [...answers, { moduleId: cur.moduleId, prompt: cur.prompt, selected }];
      setAnswers(nextAnswers);
    }
    const isLast = dailyQIdx + 1 >= dailyRun.length;
    if (isLast) {
      const ref = getDailyReference();
      persist({
        ...profile,
        dailyRuns: { ...(profile.dailyRuns || {}), [ref]: { score: dailyScore, total: scorableTotal, completedISO: new Date().toISOString() } },
      });
      submitDailyResult?.(ref, nextAnswers);
    }
    setDailyQIdx((i) => i + 1);
    setSelected(null);
    setAnswered(false);
  }

  if (done) {
    const pct = scorableTotal > 0 ? Math.round((dailyScore / scorableTotal) * 100) : 0;
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG, color: TEXT }}>
        <div className="text-center px-4">
          <h2 className="text-2xl sm:text-3xl font-mono font-bold mb-4">Défi Quotidien Complété!</h2>
          <div className="mb-6">
            <Frame accent={AMBER} className="inline-block p-4">
              <div style={{ backgroundColor: PANEL }} className="p-4 -m-4 rounded-sm">
                <p className="font-mono text-xs tracking-widest mb-2" style={{ color: TEXT_MUTED }}>SCORE</p>
                <p className="text-xl font-bold" style={{ color: AMBER }}>{dailyScore} / {scorableTotal} · {pct}%</p>
                <p className="text-xs mt-2" style={{ color: TEXT_MUTED }}>Reviens demain pour le prochain défi.</p>
              </div>
            </Frame>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setView("leaderboard")} className="px-4 py-2 rounded-lg font-mono text-sm flex items-center gap-1.5" style={{ border: `1px solid ${AMBER}`, color: AMBER }}>
              <Crown size={15} /> Classement
            </button>
            <button onClick={() => setView("map")} className="px-4 py-2 rounded-lg font-mono" style={{ backgroundColor: AMBER, color: BG }}>
              Continuer
            </button>
          </div>
        </div>
      </div>
    );
  }

  function handleAnswer() {
    if (selected === null) return;
    if (selected === q.correct) { setDailyScore((s) => s + 1); SFX.correct(1); }
    else SFX.wrong();
    setAnswered(true);
  }

  const timeColor = timeLeft <= 10 ? DANGER : timeLeft <= 20 ? AMBER : SUCCESS;

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: BG, color: TEXT }}>
      <div className="max-w-xl mx-auto">
        <div className="mb-3 flex justify-between items-center">
          <h3 className="font-mono text-sm font-bold" style={{ color: AMBER }}>DÉFI QUOTIDIEN</h3>
          <span className="font-mono text-xs" style={{ color: TEXT_MUTED }}>{dailyQIdx + 1} / {dailyRun.length}</span>
        </div>
        <div className="mb-4">
          <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: LINE }}>
            <div className="h-full rounded-full" style={{ width: `${((dailyQIdx + 1) / dailyRun.length) * 100}%`, backgroundColor: AMBER, transition: "width 300ms ease" }} />
          </div>
        </div>

        {isLocked ? (
          <Frame accent={AMBER} className="p-4">
            <div style={{ backgroundColor: PANEL }} className="p-4 -m-4 rounded-sm text-center">
              <div className="flex justify-center mb-2"><Lock size={26} style={{ color: AMBER }} /></div>
              <p className="font-mono text-xs tracking-widest mb-1" style={{ color: AMBER }}>SECTEUR RÉSERVÉ</p>
              <h4 className="font-mono font-bold mb-2">Question d'un secteur avancé</h4>
              <p className="text-xs leading-relaxed mb-4" style={{ color: TEXT_MUTED }}>
                Elle fait partie de l'accès complet. Débloque-le pour l'affronter — elle ne compte pas contre ton score aujourd'hui.
              </p>
              <button onClick={() => openModal(authToken ? "pay" : "account")} className="w-full py-2 rounded-lg font-mono text-sm mb-2 flex items-center justify-center gap-1.5" style={{ backgroundColor: AMBER, color: BG }}>
                <Unlock size={15} /> Débloquer l'accès
              </button>
              <button onClick={advance} className="w-full py-2 rounded-lg font-mono text-xs" style={{ border: `1px solid ${LINE}`, color: TEXT_MUTED }}>
                Continuer →
              </button>
            </div>
          </Frame>
        ) : (
          <Frame accent={AMBER} className="p-4">
            <div style={{ backgroundColor: PANEL }} className="p-4 -m-4 rounded-sm">
              {/* Chrono */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: LINE }}>
                  <div className="h-full rounded-full" style={{ width: `${(timeLeft / DAILY_SECONDS_PER_Q) * 100}%`, backgroundColor: timeColor, transition: "width 1s linear" }} />
                </div>
                <span className="font-mono text-xs tabular-nums w-8 text-right" style={{ color: timeColor }}>{timeLeft}s</span>
              </div>
              <h4 className="font-mono font-bold mb-4">{q.prompt}</h4>
              <div className="space-y-2">
                {q.options?.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => !answered && setSelected(idx)}
                    className="w-full p-3 rounded-lg text-left transition-colors"
                    style={{
                      backgroundColor: (answered ? idx === q.correct : selected === idx) ? `${answered && idx === q.correct ? SUCCESS : selected === idx && idx !== q.correct ? DANGER : SUCCESS}22` : PANEL_SOFT,
                      border: `1px solid ${answered ? (idx === q.correct ? SUCCESS : selected === idx ? DANGER : LINE) : selected === idx ? AMBER : LINE}`,
                      color: TEXT,
                    }}
                    disabled={answered}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {!answered ? (
                <button onClick={handleAnswer} disabled={selected === null} className="w-full mt-4 py-2 rounded-lg font-mono text-sm" style={{ backgroundColor: selected === null ? LINE : AMBER, color: selected === null ? TEXT_MUTED : BG }}>
                  Valider
                </button>
              ) : (
                <>
                  {selected === q.correct ? (
                    <p className="text-sm mt-3 font-mono" style={{ color: SUCCESS }}>✓ Correct!</p>
                  ) : (
                    <>
                      <p className="text-sm mt-3 font-mono" style={{ color: DANGER }}>{selected === null ? "⏱ Temps écoulé" : "✗ Incorrect"}</p>
                      <p className="text-xs mt-1 font-mono" style={{ color: TEXT_MUTED }}>Réponse: {q.options[q.correct]}</p>
                    </>
                  )}
                  {q.explain && <p className="text-xs mt-2 leading-relaxed" style={{ color: TEXT_MUTED }}>{q.explain}</p>}
                  <button onClick={advance} className="w-full mt-4 py-2 rounded-lg font-mono text-sm" style={{ backgroundColor: AMBER, color: BG }}>
                    {dailyQIdx + 1 < dailyRun.length ? "Suivant →" : "Terminer"}
                  </button>
                </>
              )}
            </div>
          </Frame>
        )}
      </div>
    </div>
  );
}

/* --- SRS Spaced Repetition Session ---------------------------------- */
function SrsView({ ctx }) {
  const { srsSessionItems, srsSessionIdx, setSrsSessionIdx, setView, profile, persist } = ctx;
  const [rating, setRating] = useState(null);
  const [showRating, setShowRating] = useState(false);

  if (!srsSessionItems || srsSessionIdx >= srsSessionItems.length) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG, color: TEXT }}>
        <div className="text-center px-4">
          <h2 className="text-2xl sm:text-3xl font-mono font-bold mb-4">Session Révision Terminée!</h2>
          <p className="text-lg mb-6" style={{ color: TEXT_MUTED }}>Incroyable travail d'apprentissage!</p>
          <button onClick={() => setView("map")} className="px-4 py-2 rounded-lg font-mono" style={{ backgroundColor: AMBER, color: BG }}>
            Retour à la Carte
          </button>
        </div>
      </div>
    );
  }

  const item = srsSessionItems[srsSessionIdx];
  const item_idx = item.moduleId ? MODULES.findIndex(m => m.id === item.moduleId) : 0;
  const mod = MODULES[item_idx] || MODULES[0];
  const q = item;

  function handleSubmitRating() {
    if (rating === null) return;
    const updated = updateSrsItem(item, rating);
    const newSrsState = { ...profile.srsState };
    newSrsState[item.qId] = updated;
    persist({ ...profile, srsState: newSrsState });
    setSrsSessionIdx(i => i + 1);
    setRating(null);
    setShowRating(false);
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: BG, color: TEXT }}>
      <div className="max-w-xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h3 className="font-mono text-sm font-bold" style={{ color: SUCCESS }}>RÉVISIONS (SRS)</h3>
          <span className="font-mono text-xs" style={{ color: TEXT_MUTED }}>{srsSessionIdx + 1} / {srsSessionItems.length}</span>
        </div>
        <div className="mb-4">
          <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: LINE }}>
            <div className="h-full rounded-full" style={{ width: `${((srsSessionIdx + 1) / srsSessionItems.length) * 100}%`, backgroundColor: SUCCESS, transition: "width 300ms ease" }} />
          </div>
        </div>
        <Frame accent={SUCCESS} className="p-4">
          <div style={{ backgroundColor: PANEL }} className="p-4 -m-4 rounded-sm">
            <p className="text-xs font-mono mb-2" style={{ color: mod.accent }}>{mod.title}</p>
            <h4 className="font-mono font-bold mb-4">{q.prompt}</h4>
            <div className="space-y-2 mb-4">
              {q.options?.map((opt, idx) => (
                <div key={idx} className="p-3 rounded-lg" style={{ backgroundColor: PANEL_SOFT, border: `1px solid ${LINE}`, color: TEXT }}>
                  {opt}
                </div>
              ))}
            </div>
            {!showRating ? (
              <button onClick={() => setShowRating(true)} className="w-full py-2 rounded-lg font-mono text-sm" style={{ backgroundColor: SUCCESS, color: BG }}>
                J'ai terminé → Noter ma réponse
              </button>
            ) : (
              <>
                <p className="text-xs mb-3 text-center" style={{ color: TEXT_MUTED }}>Comment as-tu trouvé cette question?</p>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {[
                    { val: 5, label: "Facile ✓", color: SUCCESS },
                    { val: 4, label: "OK ✓", color: AMBER },
                    { val: 3, label: "Moyen", color: TEXT_MUTED },
                    { val: 2, label: "Dur", color: DANGER },
                    { val: 1, label: "Très dur", color: DANGER },
                  ].map(({ val, label, color }) => (
                    <button
                      key={val}
                      onClick={() => setRating(val)}
                      className="p-2 rounded-lg text-xs font-mono transition-colors"
                      style={{
                        backgroundColor: rating === val ? `${color}44` : PANEL_SOFT,
                        border: `1px solid ${rating === val ? color : LINE}`,
                        color: rating === val ? color : TEXT_MUTED,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button onClick={handleSubmitRating} disabled={rating === null} className="w-full py-2 rounded-lg font-mono text-sm" style={{ backgroundColor: rating === null ? LINE : AMBER, color: rating === null ? TEXT_MUTED : BG }}>
                  Valider
                </button>
              </>
            )}
          </div>
        </Frame>
      </div>
    </div>
  );
}

/* --- Chantier : capstone construit hors de l'app, suivi ici ---------- */
function ChantierView({ ctx }) {
  const { profile, setView, aiSettings, authToken, toggleMilestone, recordChantierReview } = ctx;
  const [openId, setOpenId] = useState(null);
  const [hints, setHints] = useState({}); // { [milestoneId]: { busy, text, error } }
  // Revue par jalon : le joueur colle le code de SON projet, ADA juge sur
  // lecture (critères + propreté). Non persisté : la revue éclaire le joueur
  // avant qu'il coche, elle ne coche pas à sa place.
  const [reviews, setReviews] = useState({}); // { [milestoneId]: { code, busy, verdict, comment, error } }

  const doneCount = CHANTIER.milestones.filter((m) => profile.chantier?.milestones?.[m.id]?.done).length;

  async function requestReview(m) {
    const cur = reviews[m.id] || {};
    const code = (cur.code || "").trim();
    if (!code) {
      setReviews((r) => ({ ...r, [m.id]: { ...cur, error: "Colle d'abord le code du jalon dans la zone ci-dessus." } }));
      return;
    }
    setReviews((r) => ({ ...r, [m.id]: { ...cur, busy: true, error: "" } }));
    const result = await callAiReview(
      { prompt: `${m.title} — ${m.spec}`, tests: m.acceptance },
      code, aiSettings, authToken, "chantier"
    );
    setReviews((r) => ({
      ...r,
      [m.id]: result.ok
        ? { ...r[m.id], busy: false, verdict: result.verdict, comment: result.comment, axes: result.axes || [], error: "" }
        : { ...r[m.id], busy: false, error: result.error },
    }));
    if (result.ok) recordChantierReview(result);
  }

  async function requestHint(m) {
    setHints((h) => ({ ...h, [m.id]: { busy: true, text: "", error: "" } }));
    const prompt = [
      "Tu es un mentor technique concis pour un apprenant qui construit un vrai petit projet fullstack seul, hors de cette app.",
      "Ne donne jamais le code complet de la solution, seulement une piste concrète en 2 à 4 phrases.",
      `Jalon: ${m.title}`,
      `Spécification: ${m.spec}`,
      `Critères d'acceptation: ${m.acceptance.join(" | ")}`,
      "Réponds en français, ton direct, sans préambule, sans markdown lourd.",
    ].join("\n");
    const result = await callAi(prompt, aiSettings, authToken);
    setHints((h) => ({
      ...h,
      [m.id]: result.ok ? { busy: false, text: result.text, error: "" } : { busy: false, text: "", error: result.error },
    }));
  }

  return (
    <div className="min-h-screen w-full font-sans" style={{ backgroundColor: BG, color: TEXT }}>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <button onClick={() => setView("map")} className="flex items-center gap-1 text-xs font-mono mb-6" style={{ color: TEXT_MUTED }}>
          <ArrowLeft size={14} /> Retour à la carte
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Hammer size={20} style={{ color: AMBER }} />
          <h2 className="font-mono font-bold text-xl">{CHANTIER.title}</h2>
        </div>
        <p className="text-sm mb-3 leading-relaxed" style={{ color: TEXT_MUTED }}>{CHANTIER.pitch}</p>
        <p className="font-mono text-[11px] tracking-widest mb-6" style={{ color: AMBER }}>
          {doneCount}/{CHANTIER.milestones.length} JALONS · CONSTRUIT DANS TON PROPRE ÉDITEUR
        </p>

        <div className="flex flex-col gap-2">
          {CHANTIER.milestones.map((m, idx) => {
            const mod = MODULES.find((x) => x.id === m.moduleRef);
            const done = !!profile.chantier?.milestones?.[m.id]?.done;
            const open = openId === m.id;
            const hint = hints[m.id];
            return (
              <Frame key={m.id} accent={done ? SUCCESS : (mod?.accent || LINE)} className="p-3.5">
                <div style={{ backgroundColor: PANEL }} className="p-3.5 -m-3.5 rounded-sm">
                  <button className="w-full flex items-center gap-3 text-left" onClick={() => setOpenId(open ? null : m.id)}>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0" style={{ color: mod?.accent || TEXT_MUTED, border: `1px solid ${mod?.accent || LINE}` }}>
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 font-mono text-sm font-bold" style={{ color: done ? SUCCESS : TEXT }}>
                      {m.title}
                    </span>
                    {done && <CheckCircle2 size={16} className="shrink-0" style={{ color: SUCCESS }} />}
                  </button>

                  {open && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: LINE }}>
                      <p className="text-xs leading-relaxed mb-2" style={{ color: TEXT }}>{m.spec}</p>
                      <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: TEXT_MUTED }}>CRITÈRES D'ACCEPTATION</p>
                      <ul className="mb-3 space-y-1">
                        {m.acceptance.map((a, i) => (
                          <li key={i} className="text-xs flex gap-1.5" style={{ color: TEXT_MUTED }}>
                            <span>·</span><span>{a}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex flex-wrap gap-2 mb-2">
                        <button
                          onClick={() => toggleMilestone(m.id)}
                          className="px-3 py-1.5 rounded-lg font-mono text-xs"
                          style={{ backgroundColor: done ? `${SUCCESS}22` : AMBER, color: done ? SUCCESS : BG, border: `1px solid ${done ? SUCCESS : AMBER}` }}
                        >
                          {done ? "✓ Déclaré terminé" : "Je déclare avoir terminé ce jalon"}
                        </button>
                        <button
                          onClick={() => requestHint(m)}
                          disabled={hint?.busy}
                          className="px-3 py-1.5 rounded-lg font-mono text-xs"
                          style={{ backgroundColor: PANEL_SOFT, color: TEXT, border: `1px solid ${LINE}` }}
                        >
                          {hint?.busy ? "…" : "💡 Indice (IA locale)"}
                        </button>
                      </div>

                      {hint?.text && (
                        <MarkdownLite
                          text={hint.text}
                          className="text-xs leading-relaxed p-2 rounded"
                          style={{ backgroundColor: PANEL_SOFT, color: TEXT, maxHeight: 220, overflowY: "auto" }}
                        />
                      )}
                      {hint?.error && <p className="text-xs leading-relaxed p-2 rounded" style={{ backgroundColor: PANEL_SOFT, color: DANGER }}>{hint.error}</p>}
                      {!hint?.text && !hint?.error && (
                        <p className="text-xs italic" style={{ color: TEXT_MUTED }}>Indice de secours : {m.hint}</p>
                      )}

                      {/* Revue de code du jalon : coller le fichier concerné, ADA relit */}
                      {(() => {
                        const rev = reviews[m.id];
                        return (
                          <div className="mt-3 pt-3 border-t" style={{ borderColor: LINE }}>
                            <div className="flex items-center justify-between gap-3 mb-1.5">
                              <p className="font-mono text-[10px] tracking-widest" style={{ color: TEXT_MUTED }}>🔍 REVUE DE CODE — ADA</p>
                              {rev?.verdict && <ReviewVerdictBadge verdict={rev.verdict} />}
                            </div>
                            {!rev?.comment && (
                              <p className="text-xs leading-relaxed mb-2" style={{ color: TEXT_MUTED }}>
                                Colle le fichier principal du jalon : ADA vérifie les critères et la propreté, comme un senior en revue.
                                Le verdict ne coche pas la case à ta place — mais tu sauras si tu peux la cocher fièrement. (Coûte un indice du quota.)
                              </p>
                            )}
                            <textarea
                              value={rev?.code || ""}
                              onChange={(e) => setReviews((r) => ({ ...r, [m.id]: { ...(r[m.id] || {}), code: e.target.value } }))}
                              spellCheck={false}
                              rows={5}
                              placeholder="Colle ici le code du jalon (le fichier concerné suffit)"
                              className="w-full font-mono text-xs p-2.5 rounded-md resize-y focus:outline-none"
                              style={{ backgroundColor: "#081B33", border: `1px solid ${LINE}`, color: "#C9E2F5", lineHeight: 1.5 }}
                            />
                            <button
                              onClick={() => requestReview(m)}
                              disabled={rev?.busy}
                              className="mt-2 px-3 py-1.5 rounded-lg font-mono text-xs disabled:opacity-50"
                              style={{ backgroundColor: PANEL_SOFT, color: TEXT, border: `1px solid ${LINE}` }}
                            >
                              {rev?.busy ? "ADA relit…" : rev?.verdict ? "↺ Resoumettre à ADA" : "Envoyer à ADA"}
                            </button>
                            {rev?.error && <p className="text-xs mt-2" style={{ color: DANGER }}>{rev.error}</p>}
                            {rev?.comment && (
                              <MarkdownLite
                                text={rev.comment}
                                className="text-xs leading-relaxed p-2 rounded mt-2"
                                style={{ backgroundColor: PANEL_SOFT, color: TEXT, maxHeight: 220, overflowY: "auto" }}
                              />
                            )}
                            {rev?.verdict === "a_polir" && <AxisChips axes={rev.axes} />}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </Frame>
            );
          })}
        </div>

        <p className="mt-6 text-[11px] font-mono text-center" style={{ color: TEXT_MUTED }}>
          FSQ ne peut pas lire ton dépôt : chaque case cochée reste une déclaration sur l'honneur — la revue d'ADA t'aide à cocher en connaissance de cause.
        </p>
      </div>
    </div>
  );
}

/* --- Admin : enrichir la banque de questions centrale ----------------- */
const EMPTY_FORM = {
  moduleId: "js-fond", qtype: "qcm", technical: false,
  prompt: "", explain: "", code: "",
  options: ["", ""], correct: 0,
  starter: "", tests: [{ call: "", expect: "" }],
  lines: ["", ""],
};

function AdminView({ ctx }) {
  const {
    adminKey, setAdminKey, refreshBank, exitAdmin, bankCount,
    aiSettings, setAiSettings, aiReady, aiStatus,
  } = ctx;
  const [tab, setTab] = useState("list"); // list | form | settings

  // Réglages produit (tarifs, quota IA) et config PayMe — chargés du serveur
  // à l'ouverture de l'onglet, enregistrés à la demande.
  const [monet, setMonet] = useState(null); // { passPriceXaf, passDays, aiDailyHints }
  const [paygate, setPaygate] = useState(null); // config masquée + session
  const [paygatePassword, setPaygatePassword] = useState("");
  const [settingsMsg, setSettingsMsg] = useState("");
  const [settingsBusy, setSettingsBusy] = useState(false);

  // Paiements : traçabilité pour instruire une plainte ("j'ai payé mais rien ne s'est débloqué").
  const [payments, setPayments] = useState([]);
  const [paymentsBusy, setPaymentsBusy] = useState(false);
  const [paymentFilterEmail, setPaymentFilterEmail] = useState("");
  const [paymentFilterStatus, setPaymentFilterStatus] = useState("");
  const [paymentDetail, setPaymentDetail] = useState(null);

  async function loadPayments() {
    setPaymentsBusy(true);
    try {
      const qs = new URLSearchParams();
      if (paymentFilterEmail.trim()) qs.set("email", paymentFilterEmail.trim());
      if (paymentFilterStatus) qs.set("status", paymentFilterStatus);
      const q = qs.toString();
      const data = await adminFetch(`/api/v1/admin/payments${q ? `?${q}` : ""}`, adminKey);
      setPayments(data.payments || []);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setPaymentsBusy(false);
    }
  }

  async function loadPaymentDetail(id) {
    setPaymentDetail(null);
    try {
      setPaymentDetail(await adminFetch(`/api/v1/admin/payments/${id}`, adminKey));
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  // Offrir un pass : geste commercial, litige ("payé chez PayMe mais rien débloqué"),
  // ou compte de test. Cumulable comme un achat, tracé source='admin'.
  const [grantEmail, setGrantEmail] = useState("");
  const [grantDays, setGrantDays] = useState("");
  const [grantTier, setGrantTier] = useState("integral");
  const [grantBusy, setGrantBusy] = useState(false);
  const [grantResult, setGrantResult] = useState(null);

  async function grantPass() {
    const email = grantEmail.trim();
    if (!email) return;
    setGrantBusy(true);
    setGrantResult(null);
    try {
      const body = { email, tier: grantTier };
      if (grantDays.trim()) body.days = parseInt(grantDays.trim(), 10);
      const res = await adminFetch("/api/v1/admin/passes", adminKey, { method: "POST", body: JSON.stringify(body) });
      setGrantResult(res);
      loadPayments();
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setGrantBusy(false);
    }
  }

  // Support : plaintes des joueurs, potentiellement liées à un paiement ci-dessus.
  const [tickets, setTickets] = useState([]);
  const [ticketsBusy, setTicketsBusy] = useState(false);
  const [ticketFilterStatus, setTicketFilterStatus] = useState("open");
  const [ticketDrafts, setTicketDrafts] = useState({});

  async function loadTickets() {
    setTicketsBusy(true);
    try {
      const q = ticketFilterStatus ? `?status=${ticketFilterStatus}` : "";
      const data = await adminFetch(`/api/v1/admin/support/tickets${q}`, adminKey);
      setTickets(data.tickets || []);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setTicketsBusy(false);
    }
  }

  async function saveTicket(id, patch) {
    try {
      await adminFetch(`/api/v1/admin/support/tickets/${id}`, adminKey, { method: "PATCH", body: JSON.stringify(patch) });
      loadTickets();
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  useEffect(() => {
    if (tab === "payments") loadPayments();
    if (tab === "support") loadTickets();
  }, [tab]);
  // Le badge "Support (N)" du bandeau d'onglets doit rester à jour même sans
  // avoir ouvert l'onglet — un admin doit voir qu'il y a des plaintes en attente.
  useEffect(() => { loadTickets(); }, []);

  useEffect(() => {
    if (tab !== "settings") return;
    (async () => {
      try {
        setMonet(await adminFetch("/api/v1/admin/settings", adminKey));
      } catch (e) {
        setSettingsMsg(`Réglages indisponibles: ${String(e?.message || e)}`);
      }
      try {
        setPaygate(await adminFetch("/api/v1/admin/paygate", adminKey));
      } catch { /* paiement pas encore configuré côté serveur */ }
    })();
  }, [tab]);

  async function saveMonet() {
    setSettingsBusy(true);
    setSettingsMsg("");
    try {
      const saved = await adminFetch("/api/v1/admin/settings", adminKey, {
        method: "PATCH",
        body: JSON.stringify({
          passPriceXaf: Number(monet.passPriceXaf),
          passDays: Number(monet.passDays),
          aiDailyHints: Number(monet.aiDailyHints),
          premiumPriceXaf: Number(monet.premiumPriceXaf),
          premiumPassDays: Number(monet.premiumPassDays),
          premiumGenDailyCap: Number(monet.premiumGenDailyCap),
        }),
      });
      setMonet(saved);
      setSettingsMsg("Tarifs enregistrés — appliqués immédiatement.");
    } catch (e) {
      setSettingsMsg(`Échec: ${String(e?.message || e)}`);
    } finally {
      setSettingsBusy(false);
    }
  }

  async function savePaygate(patch) {
    setSettingsBusy(true);
    setSettingsMsg("");
    try {
      const saved = await adminFetch("/api/v1/admin/paygate", adminKey, { method: "PATCH", body: JSON.stringify(patch) });
      setPaygate(saved);
      setPaygatePassword("");
      setSettingsMsg("Config PayMe enregistrée.");
    } catch (e) {
      setSettingsMsg(`Échec: ${String(e?.message || e)}`);
    } finally {
      setSettingsBusy(false);
    }
  }

  async function testPaygate() {
    setSettingsBusy(true);
    setSettingsMsg("");
    try {
      const saved = await adminFetch("/api/v1/admin/paygate/connect", adminKey, { method: "POST" });
      setPaygate(saved);
      setSettingsMsg(saved?.session?.status === "CONNECTED" ? "Connexion PayMe OK." : `Connexion: ${saved?.session?.status || "?"}`);
    } catch (e) {
      setSettingsMsg(`Connexion PayMe échouée: ${String(e?.message || e)}`);
    } finally {
      setSettingsBusy(false);
    }
  }
  const [editingId, setEditingId] = useState(null);
  const [list, setList] = useState([]);
  const [listBusy, setListBusy] = useState(false);
  const [filterModule, setFilterModule] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saveBusy, setSaveBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  // Vérification de cohérence des exercices code : une solution de référence
  // doit passer les tests avant de pouvoir publier.
  const [solution, setSolution] = useState("");
  const [solResults, setSolResults] = useState(null);
  // Import en masse des secteurs avancés dans la banque (prérequis Phase B).
  const [seedBusy, setSeedBusy] = useState(false);
  const [seedReport, setSeedReport] = useState(null); // { added, skipped, unrepresentable, failed, errors:[] }

  const f = (patch) => { setForm((s) => ({ ...s, ...patch })); setSolResults(null); };

  // Verse les questions statiques des secteurs avancés dans la banque Neon.
  // Idempotent : le serveur renvoie 409 sur un quasi-doublon (compté "déjà
  // présent"), donc relancer ne crée aucune duplication.
  async function seedAdvancedBank() {
    if (seedBusy) return;
    setSeedBusy(true);
    setError("");
    setNotice("");
    const report = { added: 0, skipped: 0, unrepresentable: 0, failed: 0, errors: [] };
    try {
      // TOUS les secteurs, fondation comprise : le serveur doit connaître chaque
      // question du Défi pour pouvoir le noter lui-même (intégrité du classement).
      // Idempotent (409 = déjà présent), donc relancer ne duplique rien.
      for (const mod of MODULES) {
        for (const q of mod.staticQuestions) {
          // Un test dont l'attendu est undefined ne survit pas à JSON (la clé
          // disparaît) : la banque ne peut pas le représenter fidèlement. On
          // le laisse dans le bundle plutôt que de l'importer cassé.
          if ((q.type === "code" || q.type === "refactor") && (q.tests || []).some((t) => t.expect === undefined)) {
            report.unrepresentable += 1;
            if (report.errors.length < 8) report.errors.push(`non migrable · ${mod.id} · ${q.prompt.slice(0, 40)} (un test attend undefined)`);
            continue;
          }
          try {
            await adminFetch("/api/v1/admin/questions", adminKey, {
              method: "POST",
              body: JSON.stringify(staticQuestionToBankPayload(q, mod.id)),
            });
            report.added += 1;
          } catch (e) {
            const msg = String(e?.message || e);
            if (/existe déjà|409/.test(msg)) report.skipped += 1;
            else { report.failed += 1; if (report.errors.length < 5) report.errors.push(`${mod.id} · ${q.prompt.slice(0, 40)} → ${msg}`); }
          }
        }
      }
      setSeedReport(report);
      await refreshBank();
      await loadList();
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setSeedBusy(false);
    }
  }

  async function loadList() {
    setListBusy(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterModule) params.set("module", filterModule);
      if (filterStatus) params.set("status", filterStatus);
      const qs = params.toString();
      const data = await adminFetch(`/api/v1/admin/questions${qs ? `?${qs}` : ""}`, adminKey);
      setList(data.questions || []);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setListBusy(false);
    }
  }

  useEffect(() => { loadList(); }, [filterModule, filterStatus]);

  function parsedTests() {
    // expect est saisi en JSON (4, "abc", [2,4], {"a":1}) pour distinguer types et structures.
    return form.tests.map((t) => ({ call: t.call, expect: JSON.parse(t.expect) }));
  }

  async function testSolution() {
    setError("");
    try {
      const res = await runCode(solution, parsedTests());
      setSolResults(res);
    } catch (e) {
      setError(`Tests illisibles: ${String(e?.message || e)} — chaque "attendu" doit être du JSON valide.`);
    }
  }

  const isCodeLike = form.qtype === "code" || form.qtype === "refactor";
  const solutionOk = !isCodeLike || (solResults && solResults.length > 0 && solResults.every((r) => r.pass));

  function buildBody() {
    const body = { moduleId: form.moduleId, qtype: form.qtype, technical: isCodeLike ? form.technical : false, prompt: form.prompt, explain: form.explain };
    if (form.qtype === "qcm") {
      body.options = form.options; body.correct = form.correct;
      if (form.code.trim()) body.code = form.code;
    } else if (isCodeLike) {
      body.starter = form.starter; body.tests = parsedTests();
    } else {
      body.lines = form.lines;
    }
    return body;
  }

  async function save() {
    setSaveBusy(true);
    setError("");
    setNotice("");
    try {
      const body = buildBody();
      if (editingId) {
        await adminFetch(`/api/v1/admin/questions/${editingId}`, adminKey, { method: "PUT", body: JSON.stringify(body) });
        setNotice("Question mise à jour.");
      } else {
        await adminFetch("/api/v1/admin/questions", adminKey, { method: "POST", body: JSON.stringify(body) });
        setNotice("Question publiée dans la banque.");
      }
      setForm(EMPTY_FORM);
      setSolution("");
      setSolResults(null);
      setEditingId(null);
      setTab("list");
      loadList();
      refreshBank();
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setSaveBusy(false);
    }
  }

  async function toggleStatus(q) {
    setError("");
    try {
      await adminFetch(`/api/v1/admin/questions/${q.id}/status`, adminKey, {
        method: "PATCH",
        body: JSON.stringify({ status: q.status === "active" ? "disabled" : "active" }),
      });
      loadList();
      refreshBank();
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  function editQuestion(q) {
    setEditingId(q.id);
    setForm({
      moduleId: q.moduleId, qtype: q.qtype, technical: !!q.technical,
      prompt: q.prompt || "", explain: q.explain || "", code: q.code || "",
      options: q.options || ["", ""], correct: q.correct ?? 0,
      starter: q.starter || "",
      tests: (q.tests || [{ call: "", expect: "" }]).map((t) => ({ call: t.call, expect: JSON.stringify(t.expect) })),
      lines: q.lines || ["", ""],
    });
    setSolution("");
    setSolResults(null);
    setTab("form");
  }

  const inputStyle = { border: `1px solid ${LINE}`, color: TEXT, backgroundColor: "#081B33" };
  const selectStyle = { border: `1px solid ${LINE}`, color: TEXT, backgroundColor: PANEL_SOFT };
  const optStyle = { backgroundColor: PANEL_SOFT, color: TEXT };
  const label = (txt) => <span className="text-[10px] font-mono tracking-widest" style={{ color: TEXT_MUTED }}>{txt}</span>;

  return (
    <div className="min-h-screen w-full font-sans" style={{ backgroundColor: BG, color: TEXT }}>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <button onClick={exitAdmin} className="flex items-center gap-1 text-xs font-mono mb-6" style={{ color: TEXT_MUTED }}>
          <ArrowLeft size={14} /> Retour à la carte
        </button>

        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Database size={20} style={{ color: AMBER }} />
            <h2 className="font-mono font-bold text-xl">Console d'administration</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTab("list")} className="px-3 py-1.5 rounded-lg font-mono text-xs" style={{ backgroundColor: tab === "list" ? AMBER : PANEL_SOFT, color: tab === "list" ? BG : TEXT, border: `1px solid ${tab === "list" ? AMBER : LINE}` }}>Liste</button>
            <button onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setSolution(""); setSolResults(null); setTab("form"); }} className="px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1" style={{ backgroundColor: tab === "form" ? AMBER : PANEL_SOFT, color: tab === "form" ? BG : TEXT, border: `1px solid ${tab === "form" ? AMBER : LINE}` }}>
              <Plus size={12} /> Nouvelle
            </button>
            <button onClick={() => setTab("settings")} className="px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1" style={{ backgroundColor: tab === "settings" ? AMBER : PANEL_SOFT, color: tab === "settings" ? BG : TEXT, border: `1px solid ${tab === "settings" ? AMBER : LINE}` }}>
              <Wrench size={12} /> Réglages
            </button>
            <button onClick={() => setTab("payments")} className="px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1" style={{ backgroundColor: tab === "payments" ? AMBER : PANEL_SOFT, color: tab === "payments" ? BG : TEXT, border: `1px solid ${tab === "payments" ? AMBER : LINE}` }}>
              <Smartphone size={12} /> Paiements
            </button>
            <button onClick={() => setTab("support")} className="px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1" style={{ backgroundColor: tab === "support" ? AMBER : PANEL_SOFT, color: tab === "support" ? BG : TEXT, border: `1px solid ${tab === "support" ? AMBER : LINE}` }}>
              <LifeBuoy size={12} /> Support{tickets.filter((t) => t.status === "open").length > 0 ? ` (${tickets.filter((t) => t.status === "open").length})` : ""}
            </button>
          </div>
        </div>

        {error && <p className="text-xs font-mono mb-3 p-2 rounded" style={{ color: DANGER, backgroundColor: `${DANGER}18`, border: `1px solid ${DANGER}55` }}>{error}</p>}
        {notice && <p className="text-xs font-mono mb-3 p-2 rounded" style={{ color: SUCCESS, backgroundColor: `${SUCCESS}18`, border: `1px solid ${SUCCESS}55` }}>{notice}</p>}

        {tab === "list" ? (
          <>
            {/* Import en masse : verse TOUS les secteurs du bundle dans la banque.
                Requis pour que le serveur note le Défi (intégrité du classement)
                et prérequis pour un jour retirer les questions du bundle. */}
            <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: PANEL, border: `1px solid ${LINE}` }}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] tracking-widest" style={{ color: "#8ECAE6" }}>📥 IMPORTER TOUS LES SECTEURS</p>
                  <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: TEXT_MUTED }}>
                    Copie les questions statiques des 9 secteurs (fondation + avancés) dans la banque. Requis pour que le serveur note le Défi Quotidien. Sans risque : relançable, les doublons sont ignorés.
                  </p>
                </div>
                <button onClick={seedAdvancedBank} disabled={seedBusy} className="px-3 py-1.5 rounded-lg font-mono text-xs shrink-0 disabled:opacity-50" style={{ backgroundColor: "#8ECAE6", color: BG }}>
                  {seedBusy ? "Import…" : "Importer"}
                </button>
              </div>
              {seedReport && (
                <div className="mt-2 text-[11px] font-mono" style={{ color: TEXT }}>
                  <span style={{ color: SUCCESS }}>{seedReport.added} ajoutée(s)</span>
                  {" · "}<span style={{ color: TEXT_MUTED }}>{seedReport.skipped} déjà en banque</span>
                  {seedReport.unrepresentable > 0 && <>{" · "}<span style={{ color: AMBER }}>{seedReport.unrepresentable} non migrable(s)</span></>}
                  {seedReport.failed > 0 && <>{" · "}<span style={{ color: DANGER }}>{seedReport.failed} échec(s)</span></>}
                  {seedReport.errors.map((err, i) => (
                    <p key={i} className="mt-1" style={{ color: DANGER }}>{err}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 mb-3">
              <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)} className="px-2 py-1.5 rounded-md font-mono text-xs focus:outline-none" style={selectStyle}>
                <option style={optStyle} value="">Tous les modules</option>
                {MODULES.map((m) => <option style={optStyle} key={m.id} value={m.id}>{m.title}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-2 py-1.5 rounded-md font-mono text-xs focus:outline-none" style={selectStyle}>
                <option style={optStyle} value="">Tous statuts</option>
                <option style={optStyle} value="active">Actives</option>
                <option style={optStyle} value="disabled">Désactivées</option>
              </select>
              <button onClick={loadList} className="px-2 py-1.5 rounded-md font-mono text-xs" style={{ border: `1px solid ${LINE}`, color: TEXT }}>
                <RefreshCw size={12} className={listBusy ? "animate-spin" : ""} />
              </button>
            </div>

            {list.length === 0 && !listBusy && (
              <p className="text-xs font-mono" style={{ color: TEXT_MUTED }}>Aucune question en banque{filterModule || filterStatus ? " pour ces filtres" : ""} — utilise « Nouvelle » pour en publier.</p>
            )}
            <div className="flex flex-col gap-2">
              {list.map((q) => {
                const mod = MODULES.find((m) => m.id === q.moduleId);
                return (
                  <div key={q.id} className="p-3 rounded-lg flex items-start gap-3" style={{ backgroundColor: PANEL, border: `1px solid ${q.status === "active" ? LINE : `${DANGER}66`}`, opacity: q.status === "active" ? 1 : 0.6 }}>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded shrink-0 mt-0.5" style={{ color: mod?.accent || TEXT_MUTED, border: `1px solid ${mod?.accent || LINE}` }}>
                      {q.moduleId} · {q.qtype}{q.technical ? " · tech" : ""}
                    </span>
                    <p className="flex-1 text-xs leading-snug min-w-0" style={{ color: TEXT }}>{q.prompt}</p>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => editQuestion(q)} title="Éditer" className="p-1.5 rounded" style={{ border: `1px solid ${LINE}` }}><Pencil size={12} style={{ color: TEXT_MUTED }} /></button>
                      <button onClick={() => toggleStatus(q)} title={q.status === "active" ? "Désactiver" : "Réactiver"} className="p-1.5 rounded" style={{ border: `1px solid ${LINE}` }}>
                        {q.status === "active" ? <XCircle size={12} style={{ color: DANGER }} /> : <CheckCircle2 size={12} style={{ color: SUCCESS }} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : tab === "settings" ? (
          <div className="flex flex-col gap-4">
            <Frame accent="#8ECAE6" className="p-4">
              <div style={{ backgroundColor: PANEL }} className="p-4 -m-4 rounded-sm">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquareText size={14} style={{ color: "#8ECAE6" }} />
                  <p className="font-mono text-[11px] tracking-widest" style={{ color: TEXT_MUTED }}>MOTEUR IA (INDICES)</p>
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: TEXT_MUTED }}>
                  Moteur utilisé par le coach pour générer les indices : serveur FSQ déployé, serveur local (Ollama),
                  ou serveur OpenAI-compatible. Ce réglage vaut pour cet appareil.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1 text-[10px] font-mono" style={{ color: TEXT_MUTED }}>
                    Moteur
                    <select
                      value={aiSettings.provider}
                      onChange={(e) => {
                        const provider = e.target.value;
                        const presets = getEndpointPresets(provider);
                        setAiSettings((s) => ({ ...s, provider, endpoint: presets[0]?.value || s.endpoint }));
                      }}
                      className="px-2 py-2 rounded-md focus:outline-none"
                      style={{ border: `1px solid ${LINE}`, color: TEXT, backgroundColor: PANEL_SOFT }}
                    >
                      <option style={{ backgroundColor: PANEL_SOFT, color: TEXT }} value="ollama">Ollama</option>
                      <option style={{ backgroundColor: PANEL_SOFT, color: TEXT }} value="openai">OpenAI-compatible</option>
                      <option style={{ backgroundColor: PANEL_SOFT, color: TEXT }} value="fsq-server">Serveur FSQ (ai-server / Render)</option>
                    </select>
                  </label>
                  {(() => {
                    const presets = getEndpointPresets(aiSettings.provider);
                    const matched = presets.find((p) => p.value === aiSettings.endpoint);
                    const isCustom = !matched;
                    return (
                      <label className="flex flex-col gap-1 text-[10px] font-mono" style={{ color: TEXT_MUTED }}>
                        Endpoint
                        <select
                          value={isCustom ? CUSTOM_ENDPOINT : matched.value}
                          onChange={(e) => {
                            if (e.target.value === CUSTOM_ENDPOINT) return;
                            setAiSettings((s) => ({ ...s, endpoint: e.target.value }));
                          }}
                          className="px-2 py-2 rounded-md focus:outline-none"
                          style={{ border: `1px solid ${LINE}`, color: TEXT, backgroundColor: PANEL_SOFT }}
                        >
                          {presets.map((p) => (
                            <option key={p.value} style={{ backgroundColor: PANEL_SOFT, color: TEXT }} value={p.value}>{p.label}</option>
                          ))}
                          <option style={{ backgroundColor: PANEL_SOFT, color: TEXT }} value={CUSTOM_ENDPOINT}>Personnalisé…</option>
                        </select>
                        {isCustom && (
                          <input
                            value={aiSettings.endpoint}
                            onChange={(e) => setAiSettings((s) => ({ ...s, endpoint: e.target.value }))}
                            placeholder="https://..."
                            className="mt-1 px-2 py-2 rounded-md bg-transparent focus:outline-none"
                            style={{ border: `1px solid ${LINE}`, color: TEXT }}
                          />
                        )}
                      </label>
                    );
                  })()}
                  <label className="flex flex-col gap-1 text-[10px] font-mono" style={{ color: TEXT_MUTED }}>
                    Modèle
                    <input
                      value={aiSettings.model}
                      onChange={(e) => setAiSettings((s) => ({ ...s, model: e.target.value }))}
                      className="px-2 py-2 rounded-md bg-transparent focus:outline-none"
                      style={{ border: `1px solid ${LINE}`, color: TEXT }}
                    />
                  </label>
                  {aiSettings.provider === "fsq-server" && (
                    <label className="flex flex-col gap-1 text-[10px] font-mono" style={{ color: TEXT_MUTED }}>
                      Clé API (si AI_API_KEY est définie côté serveur)
                      <input
                        type="password"
                        value={aiSettings.apiKey || ""}
                        onChange={(e) => setAiSettings((s) => ({ ...s, apiKey: e.target.value }))}
                        className="px-2 py-2 rounded-md bg-transparent focus:outline-none"
                        style={{ border: `1px solid ${LINE}`, color: TEXT }}
                      />
                    </label>
                  )}
                </div>
                <div className="mt-2 text-[11px] font-mono" style={{ color: aiReady ? SUCCESS : TEXT_MUTED }}>
                  {aiStatus}
                </div>
              </div>
            </Frame>

            <Frame accent={AMBER} className="p-4">
              <div style={{ backgroundColor: PANEL }} className="p-4 -m-4 rounded-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Unlock size={14} style={{ color: AMBER }} />
                  <p className="font-mono text-[11px] tracking-widest" style={{ color: TEXT_MUTED }}>MONÉTISATION — PASS D'ACCÈS</p>
                </div>
                {!monet ? (
                  <p className="text-xs font-mono" style={{ color: TEXT_MUTED }}>Chargement des réglages…</p>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {[
                        ["passPriceXaf", "Intégral — Prix (FCFA)"],
                        ["passDays", "Intégral — Durée (j)"],
                        ["aiDailyHints", "Indices IA / jour"],
                        ["premiumPriceXaf", "Mentorat — Prix (FCFA)"],
                        ["premiumPassDays", "Mentorat — Durée (j)"],
                        ["premiumGenDailyCap", "Mentorat — Exos/jour"],
                      ].map(([key, label]) => (
                        <label key={key} className="flex flex-col gap-1 text-[10px] font-mono" style={{ color: TEXT_MUTED }}>
                          {label}
                          <input
                            type="number"
                            min="1"
                            value={monet[key]}
                            onChange={(e) => setMonet((s) => ({ ...s, [key]: e.target.value }))}
                            className="px-2 py-2 rounded-md bg-transparent focus:outline-none"
                            style={{ border: `1px solid ${LINE}`, color: TEXT }}
                          />
                        </label>
                      ))}
                    </div>
                    <button onClick={saveMonet} disabled={settingsBusy} className="px-3 py-2 rounded-lg font-mono text-xs disabled:opacity-50" style={{ backgroundColor: AMBER, color: BG }}>
                      Enregistrer les tarifs
                    </button>
                  </>
                )}
              </div>
            </Frame>

            <Frame accent="#8ECAE6" className="p-4">
              <div style={{ backgroundColor: PANEL }} className="p-4 -m-4 rounded-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone size={14} style={{ color: "#8ECAE6" }} />
                  <p className="font-mono text-[11px] tracking-widest" style={{ color: TEXT_MUTED }}>PAIEMENT — PAYME (MOBILE MONEY)</p>
                  {paygate?.sandbox && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: AMBER, border: `1px solid ${AMBER}` }}>BAC À SABLE</span>
                  )}
                </div>
                {!paygate ? (
                  <p className="text-xs font-mono" style={{ color: TEXT_MUTED }}>
                    Config indisponible (base non configurée côté serveur, ou secret de chiffrement manquant).
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                      <label className="flex flex-col gap-1 text-[10px] font-mono" style={{ color: TEXT_MUTED }}>
                        URL de l'API PayMe
                        <input
                          value={paygate.baseUrl || ""}
                          onChange={(e) => setPaygate((s) => ({ ...s, baseUrl: e.target.value }))}
                          placeholder="https://api.payme..."
                          className="px-2 py-2 rounded-md bg-transparent focus:outline-none"
                          style={{ border: `1px solid ${LINE}`, color: TEXT }}
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-[10px] font-mono" style={{ color: TEXT_MUTED }}>
                        Identifiant marchand
                        <input
                          value={paygate.username || ""}
                          onChange={(e) => setPaygate((s) => ({ ...s, username: e.target.value }))}
                          className="px-2 py-2 rounded-md bg-transparent focus:outline-none"
                          style={{ border: `1px solid ${LINE}`, color: TEXT }}
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-[10px] font-mono" style={{ color: TEXT_MUTED }}>
                        Mot de passe {paygate.hasPassword ? "(défini — laisser vide pour conserver)" : "(requis)"}
                        <input
                          type="password"
                          value={paygatePassword}
                          onChange={(e) => setPaygatePassword(e.target.value)}
                          className="px-2 py-2 rounded-md bg-transparent focus:outline-none"
                          style={{ border: `1px solid ${LINE}`, color: TEXT }}
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-[10px] font-mono" style={{ color: TEXT_MUTED }}>
                        Frais refacturés au client (%)
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={paygate.clientFeesRate ?? 100}
                          onChange={(e) => setPaygate((s) => ({ ...s, clientFeesRate: e.target.value }))}
                          className="px-2 py-2 rounded-md bg-transparent focus:outline-none"
                          style={{ border: `1px solid ${LINE}`, color: TEXT }}
                        />
                      </label>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-mono mb-3" style={{ color: TEXT }}>
                      <input
                        type="checkbox"
                        checked={!!paygate.isActive}
                        onChange={(e) => setPaygate((s) => ({ ...s, isActive: e.target.checked }))}
                      />
                      Paiement activé pour les joueurs
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => savePaygate({
                          baseUrl: paygate.baseUrl || "",
                          username: paygate.username || "",
                          ...(paygatePassword ? { password: paygatePassword } : {}),
                          clientFeesRate: Number(paygate.clientFeesRate ?? 100),
                          isActive: !!paygate.isActive,
                        })}
                        disabled={settingsBusy}
                        className="px-3 py-2 rounded-lg font-mono text-xs disabled:opacity-50"
                        style={{ backgroundColor: AMBER, color: BG }}
                      >
                        Enregistrer la config
                      </button>
                      <button onClick={testPaygate} disabled={settingsBusy} className="px-3 py-2 rounded-lg font-mono text-xs disabled:opacity-50" style={{ border: `1px solid ${LINE}`, color: TEXT }}>
                        Tester la connexion
                      </button>
                    </div>
                    <p className="mt-2 text-[11px] font-mono" style={{ color: paygate.session?.status === "CONNECTED" ? SUCCESS : TEXT_MUTED }}>
                      Session : {paygate.session?.status || "—"}
                      {paygate.session?.tokenExpiresAt ? ` · token jusqu'à ${new Date(paygate.session.tokenExpiresAt).toLocaleTimeString("fr-FR")}` : ""}
                      {paygate.session?.lastLoginError ? ` · ${paygate.session.lastLoginError}` : ""}
                    </p>
                  </>
                )}
              </div>
            </Frame>

            {settingsMsg && (
              <p className="text-xs font-mono p-2 rounded" style={{ color: TEXT, backgroundColor: PANEL_SOFT, border: `1px solid ${LINE}` }}>{settingsMsg}</p>
            )}

            <Frame accent={AMBER} className="p-4">
              <div style={{ backgroundColor: PANEL }} className="p-4 -m-4 rounded-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Database size={14} style={{ color: AMBER }} />
                  <p className="font-mono text-[11px] tracking-widest" style={{ color: TEXT_MUTED }}>SESSION ADMIN</p>
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: TEXT_MUTED }}>
                  Console accessible via le lien direct <span className="font-mono" style={{ color: TEXT }}>…/#admin</span>.
                  La clé est vérifiée par le serveur à chaque action.
                  {bankCount > 0 && ` Banque actuelle : ${bankCount} question${bankCount > 1 ? "s" : ""} distante${bankCount > 1 ? "s" : ""}.`}
                </p>
                <button
                  onClick={() => { setAdminKey(""); exitAdmin(); }}
                  className="px-3 py-2 rounded-lg font-mono text-xs"
                  style={{ border: `1px solid ${DANGER}66`, color: DANGER }}
                >
                  Fermer la session admin sur cet appareil
                </button>
              </div>
            </Frame>
          </div>
        ) : tab === "payments" ? (
          <div className="flex flex-col gap-4">
            {/* Offrir un pass : litige ("payé mais rien débloqué"), geste commercial, ou compte de test. */}
            <div className="p-3 rounded-lg" style={{ backgroundColor: PANEL, border: `1px solid ${LINE}` }}>
              <p className="font-mono text-[11px] tracking-widest mb-2" style={{ color: "#8ECAE6" }}>🎁 OFFRIR UN PASS</p>
              <div className="flex gap-2 flex-wrap items-center">
                <input value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)} placeholder="Email du compte" className="flex-1 min-w-[160px] px-2 py-1.5 rounded-md font-mono text-xs focus:outline-none" style={inputStyle} />
                <select value={grantTier} onChange={(e) => setGrantTier(e.target.value)} title="Palier du pass" className="px-2 py-1.5 rounded-md font-mono text-xs focus:outline-none" style={selectStyle}>
                  <option style={optStyle} value="integral">Intégral</option>
                  <option style={optStyle} value="mentorat">Mentorat</option>
                </select>
                <input value={grantDays} onChange={(e) => setGrantDays(e.target.value)} placeholder="jours" title="Durée en jours (défaut : la durée du palier configurée)" className="w-20 px-2 py-1.5 rounded-md font-mono text-xs focus:outline-none" style={inputStyle} />
                <button onClick={grantPass} disabled={grantBusy || !grantEmail.trim()} className="px-3 py-1.5 rounded-md font-mono text-xs" style={{ backgroundColor: grantBusy || !grantEmail.trim() ? PANEL_SOFT : AMBER, color: grantBusy || !grantEmail.trim() ? TEXT_MUTED : BG, border: `1px solid ${AMBER}` }}>
                  {grantBusy ? "…" : "Créditer"}
                </button>
              </div>
              {grantResult && (
                <p className="text-[11px] font-mono mt-2" style={{ color: SUCCESS }}>
                  ✓ {grantResult.email} · {grantResult.tier || "integral"} · +{grantResult.days} j{grantResult.stacked ? " (cumulé)" : ""} · actif jusqu'au {new Date(grantResult.expiresAt).toLocaleDateString("fr-FR")}
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <input value={paymentFilterEmail} onChange={(e) => setPaymentFilterEmail(e.target.value)} placeholder="Filtrer par email" className="flex-1 min-w-[160px] px-2 py-1.5 rounded-md font-mono text-xs focus:outline-none" style={inputStyle} />
              <select value={paymentFilterStatus} onChange={(e) => setPaymentFilterStatus(e.target.value)} className="px-2 py-1.5 rounded-md font-mono text-xs focus:outline-none" style={selectStyle}>
                <option style={optStyle} value="">Tous statuts</option>
                {["PENDING", "PAID", "FAILED", "EXPIRED"].map((s) => <option style={optStyle} key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={loadPayments} className="px-2 py-1.5 rounded-md font-mono text-xs" style={{ border: `1px solid ${LINE}`, color: TEXT }}>
                <RefreshCw size={12} className={paymentsBusy ? "animate-spin" : ""} />
              </button>
            </div>

            {payments.length === 0 && !paymentsBusy && (
              <p className="text-xs font-mono" style={{ color: TEXT_MUTED }}>Aucun paiement pour ces filtres.</p>
            )}
            <div className="flex flex-col gap-2">
              {payments.map((p) => (
                <button key={p.id} onClick={() => loadPaymentDetail(p.id)} className="p-3 rounded-lg flex items-center gap-3 text-left hover:opacity-90" style={{ backgroundColor: PANEL, border: `1px solid ${LINE}` }}>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded shrink-0" style={{ color: p.status === "PAID" ? SUCCESS : p.status === "PENDING" ? AMBER : DANGER, border: `1px solid ${p.status === "PAID" ? SUCCESS : p.status === "PENDING" ? AMBER : DANGER}` }}>
                    {p.status}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate" style={{ color: TEXT }}>{p.email} · {p.displayName}</p>
                    <p className="text-[10px] font-mono" style={{ color: TEXT_MUTED }}>{p.amount} {p.currency} · {p.phone || "—"} · {new Date(p.createdAt).toLocaleString("fr-FR")}</p>
                  </div>
                  <ChevronRight size={14} style={{ color: TEXT_MUTED }} />
                </button>
              ))}
            </div>

            {paymentDetail && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(3,12,24,0.78)" }} onClick={() => setPaymentDetail(null)}>
                <div className="w-full max-w-md rounded-xl p-5 max-h-[85vh] overflow-y-auto" style={{ backgroundColor: PANEL, border: `1px solid ${LINE}` }} onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-mono text-xs font-bold" style={{ color: TEXT }}>{paymentDetail.email}</p>
                    <button onClick={() => setPaymentDetail(null)} className="w-7 h-7 rounded-md flex items-center justify-center" style={{ border: `1px solid ${LINE}`, color: TEXT_MUTED }}><X size={13} /></button>
                  </div>
                  <p className="text-xs font-mono mb-1" style={{ color: TEXT_MUTED }}>{paymentDetail.amount} {paymentDetail.currency} · {paymentDetail.phone || "—"} · réf {paymentDetail.providerRef || "—"}</p>
                  <p className="text-[10px] font-mono mb-3" style={{ color: TEXT_MUTED }}>id {paymentDetail.id}</p>

                  <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: TEXT_MUTED }}>HISTORIQUE</p>
                  <div className="flex flex-col gap-1.5 mb-4">
                    {paymentDetail.events.map((e, i) => (
                      <div key={i} className="text-xs p-2 rounded" style={{ border: `1px solid ${LINE}` }}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px]" style={{ color: AMBER }}>{e.status}</span>
                          <span className="font-mono text-[9px]" style={{ color: TEXT_MUTED }}>{new Date(e.createdAt).toLocaleString("fr-FR")}</span>
                        </div>
                        {e.detail && <p className="mt-0.5" style={{ color: TEXT_MUTED }}>{e.detail}</p>}
                      </div>
                    ))}
                  </div>

                  {paymentDetail.gatewayTransaction && (
                    <>
                      <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: TEXT_MUTED }}>PASSERELLE</p>
                      <div className="text-xs p-2 rounded" style={{ border: `1px solid ${LINE}`, color: TEXT_MUTED }}>
                        <p>ref {paymentDetail.gatewayTransaction.gatewayReference || "—"} · statut provider {paymentDetail.gatewayTransaction.providerStatus || "—"}</p>
                        {paymentDetail.gatewayTransaction.failureReason && <p className="mt-1" style={{ color: DANGER }}>{paymentDetail.gatewayTransaction.failureReason}</p>}
                        {paymentDetail.gatewayTransaction.lastPolledAt && <p className="mt-1">dernier sondage {new Date(paymentDetail.gatewayTransaction.lastPolledAt).toLocaleString("fr-FR")}</p>}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : tab === "support" ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <select value={ticketFilterStatus} onChange={(e) => setTicketFilterStatus(e.target.value)} className="px-2 py-1.5 rounded-md font-mono text-xs focus:outline-none" style={selectStyle}>
                <option style={optStyle} value="">Tous statuts</option>
                {["open", "in_progress", "resolved", "closed"].map((s) => <option style={optStyle} key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={loadTickets} className="px-2 py-1.5 rounded-md font-mono text-xs" style={{ border: `1px solid ${LINE}`, color: TEXT }}>
                <RefreshCw size={12} className={ticketsBusy ? "animate-spin" : ""} />
              </button>
            </div>

            {tickets.length === 0 && !ticketsBusy && (
              <p className="text-xs font-mono" style={{ color: TEXT_MUTED }}>Aucun ticket pour ce filtre.</p>
            )}
            {tickets.map((t) => {
              const draft = ticketDrafts[t.id] || { status: t.status, adminNote: t.adminNote || "" };
              const setDraft = (patch) => setTicketDrafts((d) => ({ ...d, [t.id]: { ...draft, ...patch } }));
              return (
                <div key={t.id} className="p-3 rounded-lg" style={{ backgroundColor: PANEL, border: `1px solid ${t.status === "open" ? AMBER : LINE}` }}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs" style={{ color: TEXT }}>{t.email} · <span style={{ color: TEXT_MUTED }}>{t.category}</span></p>
                    <span className="font-mono text-[9px]" style={{ color: TEXT_MUTED }}>{new Date(t.createdAt).toLocaleString("fr-FR")}</span>
                  </div>
                  <p className="text-xs mb-2" style={{ color: TEXT }}>{t.message}</p>
                  {t.paymentId && (
                    <button onClick={() => { setTab("payments"); loadPaymentDetail(t.paymentId); }} className="text-[10px] font-mono underline mb-2" style={{ color: "#8ECAE6" }}>
                      Voir le paiement lié →
                    </button>
                  )}
                  <div className="flex gap-2 items-center">
                    <select value={draft.status} onChange={(e) => setDraft({ status: e.target.value })} className="px-2 py-1.5 rounded-md font-mono text-xs focus:outline-none" style={selectStyle}>
                      {["open", "in_progress", "resolved", "closed"].map((s) => <option style={optStyle} key={s} value={s}>{s}</option>)}
                    </select>
                    <input value={draft.adminNote} onChange={(e) => setDraft({ adminNote: e.target.value })} placeholder="Note interne / réponse" className="flex-1 px-2 py-1.5 rounded-md font-mono text-xs focus:outline-none" style={inputStyle} />
                    <button onClick={() => saveTicket(t.id, draft)} className="px-2 py-1.5 rounded-md font-mono text-xs" style={{ backgroundColor: AMBER, color: BG }}>
                      OK
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Frame accent={AMBER} className="p-4">
            <div style={{ backgroundColor: PANEL }} className="p-4 -m-4 rounded-sm flex flex-col gap-3">
              {editingId && <p className="text-[10px] font-mono" style={{ color: AMBER }}>ÉDITION — {editingId}</p>}

              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">{label("MODULE")}
                  <select value={form.moduleId} onChange={(e) => f({ moduleId: e.target.value })} className="px-2 py-2 rounded-md text-sm focus:outline-none" style={selectStyle}>
                    {MODULES.map((m) => <option style={optStyle} key={m.id} value={m.id}>{m.num} · {m.title}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1">{label("TYPE")}
                  <select value={form.qtype} onChange={(e) => f({ qtype: e.target.value })} className="px-2 py-2 rounded-md text-sm focus:outline-none" style={selectStyle}>
                    <option style={optStyle} value="qcm">QCM</option>
                    <option style={optStyle} value="code">Exercice code</option>
                    <option style={optStyle} value="refactor">Refactor (code à assainir)</option>
                    <option style={optStyle} value="order">Remise en ordre</option>
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-1">{label("ÉNONCÉ")}
                <textarea value={form.prompt} onChange={(e) => f({ prompt: e.target.value })} rows={2} className="px-2 py-2 rounded-md text-sm resize-y focus:outline-none" style={inputStyle} />
              </label>

              {form.qtype === "qcm" && (
                <>
                  <label className="flex flex-col gap-1">{label("EXTRAIT DE CODE AFFICHÉ (OPTIONNEL)")}
                    <textarea value={form.code} onChange={(e) => f({ code: e.target.value })} rows={3} spellCheck={false} className="px-2 py-2 rounded-md font-mono text-xs resize-y focus:outline-none" style={inputStyle} />
                  </label>
                  {label("OPTIONS — coche la bonne réponse")}
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="radio" name="correct" checked={form.correct === i} onChange={() => f({ correct: i })} />
                      <input value={opt} onChange={(e) => f({ options: form.options.map((o, j) => (j === i ? e.target.value : o)) })} className="flex-1 px-2 py-1.5 rounded-md text-sm focus:outline-none" style={inputStyle} />
                      {form.options.length > 2 && (
                        <button onClick={() => f({ options: form.options.filter((_, j) => j !== i), correct: form.correct >= i && form.correct > 0 ? form.correct - 1 : form.correct })} className="p-1.5"><Trash2 size={13} style={{ color: DANGER }} /></button>
                      )}
                    </div>
                  ))}
                  {form.options.length < 6 && (
                    <button onClick={() => f({ options: [...form.options, ""] })} className="self-start flex items-center gap-1 text-xs font-mono" style={{ color: TEXT_MUTED }}><Plus size={12} /> Ajouter une option</button>
                  )}
                </>
              )}

              {isCodeLike && (
                <>
                  <label className="flex items-center gap-2 text-xs font-mono" style={{ color: TEXT_MUTED }}>
                    <input type="checkbox" checked={form.technical} onChange={(e) => f({ technical: e.target.checked })} />
                    Épreuve Technique (hors combat normal)
                  </label>
                  {form.qtype === "refactor" && (
                    <p className="text-[11px] leading-relaxed p-2 rounded" style={{ backgroundColor: `${AMBER}14`, color: TEXT_MUTED }}>
                      Refactor : le <b>starter</b> est un code qui marche déjà mais qui reste à améliorer (nommage confus, duplication, imbrication…). Les tests doivent passer AVEC le starter tel quel — la solution de référence ci-dessous sert à le prouver (colle simplement le starter).
                    </p>
                  )}
                  <label className="flex flex-col gap-1">{label(form.qtype === "refactor" ? "CODE À ASSAINIR (STARTER — doit déjà passer les tests)" : "CODE DE DÉPART (STARTER)")}
                    <textarea value={form.starter} onChange={(e) => f({ starter: e.target.value })} rows={4} spellCheck={false} className="px-2 py-2 rounded-md font-mono text-xs resize-y focus:outline-none" style={inputStyle} />
                  </label>
                  {label("TESTS — attendu en JSON (4, \"abc\", [2,4]…)")}
                  {form.tests.map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={t.call} placeholder="appel — ex: somme(2, 3)" onChange={(e) => f({ tests: form.tests.map((x, j) => (j === i ? { ...x, call: e.target.value } : x)) })} className="flex-1 px-2 py-1.5 rounded-md font-mono text-xs focus:outline-none" style={inputStyle} />
                      <input value={t.expect} placeholder="attendu — ex: 5" onChange={(e) => f({ tests: form.tests.map((x, j) => (j === i ? { ...x, expect: e.target.value } : x)) })} className="w-32 px-2 py-1.5 rounded-md font-mono text-xs focus:outline-none" style={inputStyle} />
                      {form.tests.length > 1 && (
                        <button onClick={() => f({ tests: form.tests.filter((_, j) => j !== i) })} className="p-1.5"><Trash2 size={13} style={{ color: DANGER }} /></button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => f({ tests: [...form.tests, { call: "", expect: "" }] })} className="self-start flex items-center gap-1 text-xs font-mono" style={{ color: TEXT_MUTED }}><Plus size={12} /> Ajouter un test</button>

                  <div className="p-3 rounded-lg" style={{ backgroundColor: PANEL_SOFT, border: `1px solid ${solutionOk ? SUCCESS : LINE}` }}>
                    <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: solutionOk ? SUCCESS : TEXT_MUTED }}>
                      {solutionOk ? "✓ SOLUTION VALIDÉE — PUBLICATION AUTORISÉE" : "SOLUTION DE RÉFÉRENCE — obligatoire avant publication"}
                    </p>
                    <textarea value={solution} onChange={(e) => { setSolution(e.target.value); setSolResults(null); }} rows={4} spellCheck={false} placeholder="Colle ici une solution qui doit passer tous les tests" className="w-full px-2 py-2 rounded-md font-mono text-xs resize-y focus:outline-none mb-2" style={inputStyle} />
                    <button onClick={testSolution} className="px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1" style={{ backgroundColor: PANEL, color: TEXT, border: `1px solid ${LINE}` }}>
                      <Play size={12} /> Lancer les tests
                    </button>
                    {solResults && (
                      <div className="mt-2 flex flex-col gap-1">
                        {solResults.map((r, i) => (
                          <p key={i} className="text-[11px] font-mono" style={{ color: r.pass ? SUCCESS : DANGER }}>
                            {r.pass ? "✓" : "✗"} {r.call} → {show(r.got)}{!r.pass && ` (attendu ${show(r.expect)})`}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {form.qtype === "order" && (
                <>
                  {label("LIGNES — dans le BON ordre (le jeu les mélangera)")}
                  {form.lines.map((line, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="font-mono text-[10px] w-4" style={{ color: TEXT_MUTED }}>{i + 1}</span>
                      <input value={line} onChange={(e) => f({ lines: form.lines.map((l, j) => (j === i ? e.target.value : l)) })} className="flex-1 px-2 py-1.5 rounded-md font-mono text-xs focus:outline-none" style={inputStyle} />
                      {form.lines.length > 2 && (
                        <button onClick={() => f({ lines: form.lines.filter((_, j) => j !== i) })} className="p-1.5"><Trash2 size={13} style={{ color: DANGER }} /></button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => f({ lines: [...form.lines, ""] })} className="self-start flex items-center gap-1 text-xs font-mono" style={{ color: TEXT_MUTED }}><Plus size={12} /> Ajouter une ligne</button>
                </>
              )}

              <label className="flex flex-col gap-1">{label("EXPLICATION (AFFICHÉE APRÈS LA RÉPONSE)")}
                <textarea value={form.explain} onChange={(e) => f({ explain: e.target.value })} rows={2} className="px-2 py-2 rounded-md text-sm resize-y focus:outline-none" style={inputStyle} />
              </label>

              <button
                onClick={save}
                disabled={saveBusy || !form.prompt.trim() || !solutionOk}
                className="w-full py-2.5 rounded-lg font-mono text-sm font-bold disabled:opacity-40"
                style={{ backgroundColor: AMBER, color: BG }}
              >
                {saveBusy ? "Publication…" : editingId ? "Mettre à jour" : "Publier dans la banque"}
              </button>
              {isCodeLike && !solutionOk && (
                <p className="text-[10px] font-mono text-center" style={{ color: TEXT_MUTED }}>
                  Publication bloquée tant qu'une solution de référence ne passe pas tous les tests.
                </p>
              )}
            </div>
          </Frame>
        )}
      </div>
    </div>
  );
}

/* --- Codex : fragments de lore + hauts faits ------------------------- */
function CodexView({ ctx }) {
  const { profile, setView, badgeCount } = ctx;
  return (
    <div className="min-h-screen w-full font-sans" style={{ backgroundColor: BG, color: TEXT }}>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <button onClick={() => setView("map")} className="flex items-center gap-1 text-xs font-mono mb-6" style={{ color: TEXT_MUTED }}>
          <ArrowLeft size={14} /> Retour à la carte
        </button>

        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={20} style={{ color: AMBER }} />
          <h2 className="font-mono font-bold text-xl">Codex de la Stack</h2>
        </div>

        <p className="font-mono text-[11px] tracking-widest mb-3" style={{ color: TEXT_MUTED }}>FRAGMENTS DE CODE ANCIEN — {(profile.lore || []).length}/{MODULES.length}</p>
        <div className="flex flex-col gap-2 mb-8">
          {MODULES.map((mod) => {
            const got = (profile.lore || []).includes(mod.id);
            return (
              <Frame key={mod.id} accent={got ? mod.accent : LINE} className="p-3.5">
                <div style={{ backgroundColor: PANEL }} className="p-3.5 -m-3.5 rounded-sm">
                  {got ? (
                    <p className="text-sm leading-relaxed" style={{ color: TEXT }}>{mod.lore}</p>
                  ) : (
                    <p className="text-sm font-mono flex items-center gap-2" style={{ color: TEXT_MUTED }}>
                      <Lock size={13} /> Fragment scellé — purifie le secteur {mod.num}.
                    </p>
                  )}
                </div>
              </Frame>
            );
          })}
        </div>

        <p className="font-mono text-[11px] tracking-widest mb-3" style={{ color: TEXT_MUTED }}>HAUTS FAITS — {badgeCount}/{Object.keys(BADGES).length}</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {Object.keys(BADGES).map((id) => (
            <BadgeChip key={id} id={id} earned={(profile.badges || []).includes(id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* --- Dossier de compétences : forces/faiblesses tirées des revues de code -- */
function SkillProfileView({ ctx }) {
  const { profile, setView, authUser } = ctx;
  const [shared, setShared] = useState(false);
  function shareProfile() {
    const id = authUser?.user?.id;
    if (!id) return;
    const url = `${window.location.origin}${window.location.pathname}#profile/${id}`;
    navigator.clipboard?.writeText(url).then(() => { setShared(true); window.setTimeout(() => setShared(false), 2500); }, () => {});
  }
  const skills = profile.skills || { reviewed: 0, clean: 0, weakAxes: {} };
  const trends = computeSkillTrends(skills.log || []);
  const evolAxes = trends.axes.filter((a) => a.recentCount > 0 || a.trend !== "stable");
  const reviewed = skills.reviewed || 0;
  const clean = skills.clean || 0;
  const weak = skills.weakAxes || {};
  const cleanPct = reviewed > 0 ? Math.round((clean / reviewed) * 100) : 0;

  // Tous les axes du vocabulaire, triés par nombre de signalements décroissant.
  const axes = Object.keys(REVIEW_AXES).map((a) => ({ id: a, label: REVIEW_AXES[a], count: weak[a] || 0 }));
  axes.sort((x, y) => y.count - x.count);
  const maxCount = Math.max(1, ...axes.map((a) => a.count));
  const flaggedCount = axes.filter((a) => a.count > 0).length;
  const topWeak = axes[0]?.count > 0 ? axes[0] : null;
  const strengths = axes.filter((a) => a.count === 0);

  const adaLine = reviewed === 0
    ? "Je n'ai encore relu aucun de tes codes. Termine un exercice de code ou un jalon du Chantier, puis demande-moi une relecture : je tiendrai ici le compte de ce que tu maîtrises et de ce qui mérite du travail."
    : topWeak
    ? `Sur ${reviewed} relecture${reviewed > 1 ? "s" : ""}, l'axe « ${topWeak.label} » est celui qui revient le plus souvent. Ce n'est pas un défaut — c'est ta prochaine marche. Vise-le au prochain duel.`
    : `${reviewed} relecture${reviewed > 1 ? "s" : ""}, aucun axe qui traîne : ton code est régulier. Continue à demander des relectures pour garder la main.`;

  return (
    <div className="min-h-screen w-full font-sans" style={{ backgroundColor: BG, color: TEXT }}>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <button onClick={() => setView("map")} className="flex items-center gap-1 text-xs font-mono mb-6" style={{ color: TEXT_MUTED }}>
          <ArrowLeft size={14} /> Retour à la carte
        </button>

        <div className="flex items-center gap-2 mb-1">
          <GraduationCap size={20} style={{ color: "#8ECAE6" }} />
          <h2 className="font-mono font-bold text-xl">Dossier de compétences</h2>
        </div>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: TEXT_MUTED }}>
          Construit à partir des relectures d'ADA : ce que ton code réussit, et les axes qui reviennent quand il reste à polir.
        </p>

        <div className="mb-5">
          <DialogueBubble name="ADA" text={adaLine} accent="#8ECAE6" avatar={<AdaAvatar mood={reviewed === 0 ? "idle" : topWeak ? "worried" : "happy"} size={44} />} />
        </div>

        {authUser && (
          <button onClick={shareProfile} className="w-full py-2 rounded-lg font-mono text-xs mb-5 flex items-center justify-center gap-1.5" style={{ border: `1px solid #8ECAE6`, color: "#8ECAE6" }}>
            <Copy size={13} /> {shared ? "Lien copié !" : "Partager mon profil public"}
          </button>
        )}

        {reviewed > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Frame accent="#8ECAE6" className="p-3">
                <div style={{ backgroundColor: PANEL }} className="p-3 -m-3 rounded-sm text-center">
                  <p className="font-mono text-2xl font-bold" style={{ color: TEXT }}>{reviewed}</p>
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: TEXT_MUTED }}>RELECTURES</p>
                </div>
              </Frame>
              <Frame accent={cleanPct >= 50 ? SUCCESS : AMBER} className="p-3">
                <div style={{ backgroundColor: PANEL }} className="p-3 -m-3 rounded-sm text-center">
                  <p className="font-mono text-2xl font-bold" style={{ color: cleanPct >= 50 ? SUCCESS : AMBER }}>{cleanPct}%</p>
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: TEXT_MUTED }}>PROPRES DU 1ᵉ COUP</p>
                </div>
              </Frame>
            </div>

            <p className="font-mono text-[11px] tracking-widest mb-2" style={{ color: TEXT_MUTED }}>
              AXES À TRAVAILLER {flaggedCount === 0 && "— aucun pour l'instant"}
            </p>
            <div className="flex flex-col gap-2 mb-6">
              {axes.map((a) => (
                <div key={a.id} className="flex items-center gap-3">
                  <span className="font-mono text-xs w-24 shrink-0" style={{ color: a.count > 0 ? TEXT : TEXT_MUTED }}>{a.label}</span>
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: PANEL_SOFT }}>
                    <div className="h-full rounded-full" style={{ width: `${(a.count / maxCount) * 100}%`, backgroundColor: a === topWeak ? AMBER : a.count > 0 ? `${AMBER}99` : "transparent", transition: "width 300ms ease" }} />
                  </div>
                  <span className="font-mono text-[11px] w-6 text-right shrink-0" style={{ color: a.count > 0 ? AMBER : TEXT_MUTED }}>{a.count}</span>
                </div>
              ))}
            </div>

            {trends.hasHistory && evolAxes.length > 0 && (
              <>
                <p className="font-mono text-[11px] tracking-widest mb-2" style={{ color: "#8ECAE6" }}>
                  ÉVOLUTION — sur tes {trends.recentN} dernières revues
                </p>
                <div className="flex flex-col gap-2 mb-6">
                  {evolAxes.map((a) => {
                    const pct = Math.round(a.recentRate * 100);
                    const improving = a.trend === "improving";
                    const worsening = a.trend === "worsening";
                    const chipColor = improving ? SUCCESS : worsening ? DANGER : TEXT_MUTED;
                    const chipText = improving ? "↓ en progrès" : worsening ? "↑ à surveiller" : "— stable";
                    return (
                      <div key={a.id} className="flex items-center gap-3">
                        <span className="font-mono text-xs w-24 shrink-0" style={{ color: TEXT }}>{a.label}</span>
                        <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: PANEL_SOFT }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: worsening ? DANGER : improving ? SUCCESS : `${AMBER}99`, transition: "width 300ms ease" }} />
                        </div>
                        <span className="font-mono text-[10px] shrink-0 text-right" style={{ color: chipColor, width: 82 }}>{chipText}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {strengths.length > 0 && (
              <>
                <p className="font-mono text-[11px] tracking-widest mb-2" style={{ color: TEXT_MUTED }}>POINTS FORTS — jamais signalés</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {strengths.map((a) => (
                    <span key={a.id} className="px-2 py-0.5 rounded-full font-mono text-[10px]" style={{ backgroundColor: `${SUCCESS}18`, color: SUCCESS, border: `1px solid ${SUCCESS}55` }}>
                      ✓ {a.label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* --- Admin : porte d'entrée (lien direct …/#admin) --------------------- */
function AdminGateView({ ctx }) {
  const { setAdminKey, exitAdmin } = ctx;
  const [key, setKey] = useState("");
  return (
    <div className="min-h-screen w-full font-sans flex items-center justify-center px-4" style={{ backgroundColor: BG, color: TEXT }}>
      <Frame accent={AMBER} className="p-5 w-full max-w-sm">
        <div style={{ backgroundColor: PANEL }} className="p-5 -m-5 rounded-sm">
          <div className="flex items-center gap-2 mb-2">
            <Database size={16} style={{ color: AMBER }} />
            <p className="font-mono text-[11px] tracking-widest" style={{ color: TEXT_MUTED }}>CONSOLE D'ADMINISTRATION</p>
          </div>
          <p className="text-xs leading-relaxed mb-3" style={{ color: TEXT_MUTED }}>
            Accès réservé au gestionnaire de la banque de questions. La clé est vérifiée par le
            serveur à chaque action — la saisir ici ne fait qu'afficher l'interface.
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); if (key.trim()) setAdminKey(key.trim()); }}
            className="flex flex-col gap-2"
          >
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Clé admin"
              autoFocus
              className="px-3 py-2 rounded-md font-mono text-sm bg-transparent focus:outline-none"
              style={{ border: `1px solid ${LINE}`, color: TEXT }}
            />
            <button type="submit" disabled={!key.trim()} className="px-3 py-2 rounded-lg font-mono text-sm disabled:opacity-40" style={{ backgroundColor: AMBER, color: BG }}>
              Entrer
            </button>
            <button type="button" onClick={exitAdmin} className="text-[11px] font-mono underline self-center mt-1" style={{ color: TEXT_MUTED }}>
              Retour au jeu
            </button>
          </form>
        </div>
      </Frame>
    </div>
  );
}

/* --- Connexion / inscription (contenu de la modale Compte) ------------- */
function AccountAuthForm({ ctx }) {
  const { accountAuth } = ctx;
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await accountAuth(mode, mode === "login" ? { email, password } : { email, password, displayName });
    } catch (err) {
      setError(friendlyError(err, "Connexion impossible pour l'instant. Réessaie dans un instant."));
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = { border: `1px solid ${LINE}`, color: TEXT };
  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <p className="text-xs leading-relaxed mb-1" style={{ color: TEXT_MUTED }}>
        Ton compte garde ta progression en sécurité et te suit sur tous tes appareils. Gratuit, en 30 secondes.
      </p>
      <div className="grid grid-cols-2 gap-2 mb-1">
        {[["login", "Connexion"], ["register", "Inscription"]].map(([id, label]) => (
          <button key={id} type="button" onClick={() => { setMode(id); setError(""); }}
            className="px-3 py-1.5 rounded-lg font-mono text-xs"
            style={{ backgroundColor: mode === id ? AMBER : PANEL_SOFT, color: mode === id ? BG : TEXT, border: `1px solid ${mode === id ? AMBER : LINE}` }}>
            {label}
          </button>
        ))}
      </div>
      {mode === "register" && (
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nom d'affichage (ex: Alice)"
          className="px-3 py-2 rounded-md font-mono text-sm bg-transparent focus:outline-none" style={inputStyle} />
      )}
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
        className="px-3 py-2 rounded-md font-mono text-sm bg-transparent focus:outline-none" style={inputStyle} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
        placeholder={mode === "register" ? "Mot de passe (6 caractères min.)" : "Mot de passe"}
        className="px-3 py-2 rounded-md font-mono text-sm bg-transparent focus:outline-none" style={inputStyle} />
      <button type="submit" disabled={busy || !email.trim() || !password || (mode === "register" && !displayName.trim())}
        className="px-3 py-2 rounded-lg font-mono text-sm disabled:opacity-40" style={{ backgroundColor: AMBER, color: BG }}>
        {busy ? "Un instant…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
      </button>
      {error && <p className="text-[11px] font-mono" style={{ color: DANGER }}>{error}</p>}
    </form>
  );
}

/* --- Modales globales : sauvegarde, restauration, compte, paiement ------ */
/* Rendues par-dessus la vue courante (carte, duel, chantier…), pour que le
   déblocage soit accessible partout où un verrou est visible. */
function ModalsHost({ ctx }) {
  const {
    modal, openModal, closeModal,
    exportProgress, copySave, copied,
    importText, setImportText, handleRestoreText, handleRestoreFile, restoreError,
    authToken, authUser, access, hasPass, accountLogout, accountSyncNow, syncStatus, syncBusy,
    payPhone, setPayPhone, payBusy, payChecking, payError, payment, startCheckout, recheckPayment, paymentHistory,
    supportCategory, setSupportCategory, supportMessage, setSupportMessage, supportPaymentId,
    supportBusy, supportError, supportSent, supportTickets, openSupport, submitSupportTicket,
  } = ctx;
  const [payTier, setPayTier] = useState("integral");
  if (!modal) return null;

  const passPrice = access?.passPriceXaf ?? 1500;
  const passDays = access?.passDays ?? 30;
  const premiumPrice = access?.premiumPriceXaf ?? 5000;
  const premiumDays = access?.premiumPassDays ?? 30;
  const fmtDate = (iso) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const fmtDateTime = (iso) => new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const titles = { save: "SAUVEGARDER", restore: "RESTAURER", account: "COMPTE", pay: "CHOISIR UN PALIER", support: "SUPPORT" };
  const payDeclined = payment && ["FAILED", "EXPIRED"].includes(payment.status);
  const payWaiting = payment && PAY_WAITING_STATUSES.includes(payment.status);
  const payStalled = payment && payment.status === "TIMEOUT"; // fenêtres auto épuisées
  const TICKET_STATUS_LABEL = { open: "Ouvert", in_progress: "En cours", resolved: "Résolu", closed: "Fermé" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(3,12,24,0.78)" }} onClick={closeModal}>
      <div className="w-full max-w-md rounded-xl p-5 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: PANEL, border: `1px solid ${LINE}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {modal === "save" && <Download size={14} style={{ color: AMBER }} />}
            {modal === "restore" && <Upload size={14} style={{ color: AMBER }} />}
            {modal === "account" && <User size={14} style={{ color: "#8ECAE6" }} />}
            {modal === "pay" && <Unlock size={14} style={{ color: AMBER }} />}
            {modal === "support" && <LifeBuoy size={14} style={{ color: "#8ECAE6" }} />}
            <p className="font-mono text-[11px] tracking-widest" style={{ color: TEXT_MUTED }}>{titles[modal]}</p>
          </div>
          <button onClick={closeModal} title="Fermer" className="w-7 h-7 rounded-md flex items-center justify-center" style={{ border: `1px solid ${LINE}`, color: TEXT_MUTED }}>
            <X size={13} />
          </button>
        </div>

        {modal === "save" && (
          <div className="flex flex-col gap-2">
            <p className="text-xs leading-relaxed mb-1" style={{ color: TEXT_MUTED }}>
              Mets ta progression à l'abri dans un fichier. Tu pourras la restaurer plus tard, ou sur un autre appareil.
            </p>
            <button onClick={() => { exportProgress(); closeModal(); }} className="px-3 py-2 rounded-lg font-mono text-sm flex items-center justify-center gap-2" style={{ backgroundColor: AMBER, color: BG }}>
              <Download size={14} /> Télécharger la sauvegarde
            </button>
            <button onClick={copySave} className="px-3 py-2 rounded-lg font-mono text-sm flex items-center justify-center gap-2" style={{ border: `1px solid ${LINE}`, color: copied ? SUCCESS : TEXT }}>
              <Copy size={14} /> {copied ? "Copié dans le presse-papiers ✓" : "Copier dans le presse-papiers"}
            </button>
          </div>
        )}

        {modal === "restore" && (
          <div className="flex flex-col gap-2">
            <p className="text-xs leading-relaxed mb-1" style={{ color: TEXT_MUTED }}>
              Recharge une sauvegarde depuis un fichier, ou colle son contenu. Ta progression actuelle sera remplacée.
            </p>
            <label className="px-3 py-2 rounded-lg font-mono text-sm flex items-center justify-center gap-2 cursor-pointer" style={{ backgroundColor: AMBER, color: BG }}>
              <Upload size={14} /> Choisir un fichier…
              <input type="file" accept=".json,application/json" onChange={handleRestoreFile} className="hidden" />
            </label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="…ou coller ici une sauvegarde"
              rows={4}
              spellCheck={false}
              className="w-full font-mono text-xs p-3 rounded-md resize-y focus:outline-none"
              style={{ backgroundColor: "#081B33", border: `1px solid ${LINE}`, color: TEXT }}
            />
            <button onClick={handleRestoreText} disabled={!importText.trim()} className="px-3 py-2 rounded-lg font-mono text-sm disabled:opacity-40" style={{ border: `1px solid ${LINE}`, color: TEXT }}>
              Restaurer le contenu collé
            </button>
            {restoreError && <p className="text-[11px] font-mono" style={{ color: DANGER }}>{restoreError}</p>}
          </div>
        )}

        {modal === "account" && (
          authToken && authUser ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs" style={{ color: TEXT_MUTED }}>
                Connecté : <span style={{ color: TEXT }} className="font-semibold">{authUser.user.displayName}</span> · {authUser.user.email}
              </p>
              <div className="p-3 rounded-lg" style={{ border: `1px solid ${hasPass ? SUCCESS : LINE}`, backgroundColor: hasPass ? `${SUCCESS}0D` : "transparent" }}>
                {hasPass ? (
                  <>
                    <p className="font-mono text-[11px] tracking-widest mb-1" style={{ color: SUCCESS }}>ACCÈS COMPLET ACTIF</p>
                    <p className="text-xs" style={{ color: TEXT }}>Jusqu'au {fmtDate(access.passExpiresAt)}</p>
                    <p className="text-[11px] font-mono mt-1" style={{ color: TEXT_MUTED }}>
                      Coach IA : {access.aiUsedToday}/{access.aiDailyLimit} indices utilisés aujourd'hui
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-mono text-[11px] tracking-widest mb-1" style={{ color: TEXT_MUTED }}>ACCÈS FONDATION (GRATUIT)</p>
                    <p className="text-xs" style={{ color: TEXT_MUTED }}>JS, JS Avancé et Async. Le reste de la Stack t'attend.</p>
                  </>
                )}
              </div>
              <button onClick={() => openModal("pay")} className="px-3 py-2 rounded-lg font-mono text-sm flex items-center justify-center gap-2" style={{ backgroundColor: AMBER, color: BG }}>
                <Unlock size={14} /> {hasPass ? `Prolonger — ${passPrice.toLocaleString("fr-FR")} FCFA / ${passDays} j` : `Débloquer l'accès complet — ${passPrice.toLocaleString("fr-FR")} FCFA`}
              </button>
              <button onClick={accountSyncNow} disabled={syncBusy} className="px-3 py-2 rounded-lg font-mono text-sm flex items-center justify-center gap-2 disabled:opacity-50" style={{ border: `1px solid ${LINE}`, color: TEXT }}>
                <RefreshCw size={14} className={syncBusy ? "animate-spin" : ""} /> {syncBusy ? "Synchro…" : "Synchroniser maintenant"}
              </button>
              {syncStatus && <p className="text-[11px] font-mono" style={{ color: TEXT_MUTED }}>{syncStatus}</p>}
              <button onClick={accountLogout} className="mt-1 px-3 py-2 rounded-lg font-mono text-xs flex items-center justify-center gap-2" style={{ border: `1px solid ${DANGER}66`, color: DANGER }}>
                <LogOut size={13} /> Se déconnecter de cet appareil
              </button>

              {paymentHistory.length > 0 && (
                <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${LINE}` }}>
                  <p className="font-mono text-[10px] tracking-widest mb-1.5" style={{ color: TEXT_MUTED }}>HISTORIQUE DES PAIEMENTS</p>
                  <div className="flex flex-col gap-1.5">
                    {paymentHistory.map((p) => {
                      const color = p.status === "PAID" ? SUCCESS : ["PENDING", "PROCESSING"].includes(p.status) ? AMBER : DANGER;
                      const label = { PAID: "Réussi", PENDING: "En cours", PROCESSING: "En cours", FAILED: "Échoué", EXPIRED: "Expiré" }[p.status] || p.status;
                      return (
                        <div key={p.id} className="flex items-center justify-between gap-2 p-2 rounded-md text-xs" style={{ border: `1px solid ${LINE}` }}>
                          <div className="min-w-0">
                            <p style={{ color: TEXT }}>{p.amount.toLocaleString("fr-FR")} FCFA</p>
                            <p className="text-[10px] font-mono" style={{ color: TEXT_MUTED }}>
                              {new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ color, border: `1px solid ${color}` }}>{label}</span>
                            {["FAILED", "EXPIRED"].includes(p.status) && (
                              <button onClick={() => openSupport("paiement", p.id)} title="Signaler ce paiement" className="p-1 rounded" style={{ border: `1px solid ${LINE}` }}>
                                <LifeBuoy size={11} style={{ color: TEXT_MUTED }} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <AccountAuthForm ctx={ctx} />
          )
        )}

        {modal === "pay" && (
          !authToken ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs leading-relaxed mb-1" style={{ color: TEXT_MUTED }}>
                L'accès complet est lié à ton compte : crée-le d'abord (gratuit), ta progression te suivra partout.
              </p>
              <button onClick={() => openModal("account")} className="px-3 py-2 rounded-lg font-mono text-sm flex items-center justify-center gap-2" style={{ backgroundColor: AMBER, color: BG }}>
                <User size={14} /> Créer mon compte / Me connecter
              </button>
            </div>
          ) : payment && payment.status === "PAID" ? (
            <div className="flex flex-col gap-2 text-center py-2">
              <p className="text-2xl">🎉</p>
              <p className="font-mono text-sm font-bold" style={{ color: SUCCESS }}>Paiement confirmé — accès complet activé !</p>
              {payment.passExpiresAt && (
                <p className="text-xs" style={{ color: TEXT_MUTED }}>Valable jusqu'au {fmtDate(payment.passExpiresAt)}.</p>
              )}
              <button onClick={closeModal} className="mt-2 px-3 py-2 rounded-lg font-mono text-sm" style={{ backgroundColor: SUCCESS, color: BG }}>
                Retourner purifier la Stack
              </button>
            </div>
          ) : payWaiting ? (
            <div className="flex flex-col gap-3 text-center py-3">
              {payStalled
                ? <Hourglass size={26} className="mx-auto" style={{ color: AMBER }} />
                : <RefreshCw size={26} className="animate-spin mx-auto" style={{ color: AMBER }} />}
              <p className="font-mono text-sm font-bold">
                {payStalled ? "Toujours en attente de confirmation" : "Valide le paiement sur ton téléphone"}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: TEXT_MUTED }}>
                {payStalled
                  ? "La confirmation n'est pas encore arrivée. Si tu viens de valider sur ton téléphone, appuie sur « Vérifier maintenant ». Tu peux aussi fermer cette fenêtre : ton accès s'activera tout seul dès que le paiement est confirmé."
                  : `Une demande de paiement a été envoyée au ${payPhone}. Ouvre-la sur ton téléphone et compose ton code secret pour confirmer — ton accès s'active ici tout seul dès que c'est validé.`}
              </p>
              <div className="flex gap-2">
                <button onClick={recheckPayment} disabled={payChecking} className="flex-1 px-3 py-2 rounded-lg font-mono text-xs flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: AMBER, color: BG }}>
                  <RefreshCw size={13} className={payChecking ? "animate-spin" : ""} /> {payChecking ? "Vérification…" : "Vérifier maintenant"}
                </button>
                <button onClick={() => openSupport("paiement", payment.paymentId)} className="flex-1 px-3 py-2 rounded-lg font-mono text-xs flex items-center justify-center gap-2" style={{ border: `1px solid ${LINE}`, color: TEXT }}>
                  <LifeBuoy size={13} /> Un souci ?
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Choix du palier */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "integral", name: "Intégral", price: passPrice, days: passDays, desc: "Tout le contenu + coach IA", accent: AMBER },
                  { id: "mentorat", name: "Mentorat", price: premiumPrice, days: premiumDays, desc: "+ exercices générés sur mesure", accent: SUCCESS },
                ].map((p) => {
                  const sel = payTier === p.id;
                  return (
                    <button key={p.id} onClick={() => setPayTier(p.id)} className="p-2.5 rounded-lg text-left transition-colors"
                      style={{ border: `1px solid ${sel ? p.accent : LINE}`, backgroundColor: sel ? `${p.accent}14` : PANEL_SOFT }}>
                      <p className="font-mono text-xs font-bold" style={{ color: p.accent }}>{p.name}</p>
                      <p className="font-mono text-[13px] font-bold" style={{ color: TEXT }}>{p.price.toLocaleString("fr-FR")} F<span className="text-[9px] font-normal" style={{ color: TEXT_MUTED }}>/{p.days}j</span></p>
                      <p className="text-[10px] leading-tight mt-0.5" style={{ color: TEXT_MUTED }}>{p.desc}</p>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: TEXT_MUTED }}>
                {payTier === "mentorat"
                  ? "Mentorat inclut tout l'Intégral, plus des exercices générés sur mesure ciblés sur tes faiblesses (auto-validés), sur un modèle IA plus puissant."
                  : `Intégral : les 6 secteurs avancés, la Qualification, les Épreuves, le Chantier et le coach IA (${access?.aiDailyLimit ?? 20} indices/jour).`}
              </p>
              <label className="flex flex-col gap-1 text-[10px] font-mono" style={{ color: TEXT_MUTED }}>
                Numéro Mobile Money (MTN MoMo / Orange Money)
                <input
                  value={payPhone}
                  onChange={(e) => setPayPhone(e.target.value)}
                  placeholder="6XX XX XX XX"
                  inputMode="tel"
                  className="px-3 py-2 rounded-md font-mono text-sm bg-transparent focus:outline-none"
                  style={{ border: `1px solid ${LINE}`, color: TEXT }}
                />
              </label>
              <button onClick={() => startCheckout(payTier)} disabled={payBusy || !payPhone.trim()} className="px-3 py-2 rounded-lg font-mono text-sm flex items-center justify-center gap-2 disabled:opacity-40" style={{ backgroundColor: payTier === "mentorat" ? SUCCESS : AMBER, color: BG }}>
                <Smartphone size={14} /> {payBusy ? "Initialisation…" : `Payer ${(payTier === "mentorat" ? premiumPrice : passPrice).toLocaleString("fr-FR")} F par Mobile Money`}
              </button>
              {payDeclined && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-mono" style={{ color: DANGER }}>
                    {payment.status === "FAILED" ? "Paiement refusé ou annulé — vérifie ton solde et réessaie." : "La demande a expiré sans confirmation — réessaie."}
                  </p>
                  <button onClick={() => openSupport("paiement", payment.paymentId)} className="self-start text-[11px] font-mono underline flex items-center gap-1" style={{ color: TEXT_MUTED }}>
                    <LifeBuoy size={11} /> L'argent a été débité chez toi ? Signale-le au support
                  </button>
                </div>
              )}
              {payError && <p className="text-[11px] font-mono" style={{ color: DANGER }}>{payError}</p>}
            </div>
          )
        )}

        {modal === "support" && (
          <div className="flex flex-col gap-3">
            {supportSent && (
              <p className="text-xs font-mono p-2 rounded" style={{ color: SUCCESS, backgroundColor: `${SUCCESS}14`, border: `1px solid ${SUCCESS}` }}>
                Ticket envoyé — on te répond ici même dès que possible.
              </p>
            )}
            <div className="flex flex-col gap-2">
              <label className="flex flex-col gap-1 text-[10px] font-mono" style={{ color: TEXT_MUTED }}>
                Catégorie
                <select
                  value={supportCategory}
                  onChange={(e) => setSupportCategory(e.target.value)}
                  className="px-2 py-2 rounded-md bg-transparent focus:outline-none"
                  style={{ border: `1px solid ${LINE}`, color: TEXT }}
                >
                  <option value="paiement" style={{ color: BG }}>Paiement / abonnement</option>
                  <option value="compte" style={{ color: BG }}>Compte</option>
                  <option value="bug" style={{ color: BG }}>Bug</option>
                  <option value="autre" style={{ color: BG }}>Autre</option>
                </select>
              </label>
              {supportPaymentId && (
                <p className="text-[10px] font-mono" style={{ color: TEXT_MUTED }}>Lié au paiement <span className="font-bold">{supportPaymentId.slice(0, 8)}</span>.</p>
              )}
              <label className="flex flex-col gap-1 text-[10px] font-mono" style={{ color: TEXT_MUTED }}>
                Décris le problème
                <textarea
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  rows={4}
                  placeholder="J'ai payé mais l'accès complet ne s'est pas débloqué…"
                  className="px-3 py-2 rounded-md font-mono text-sm bg-transparent focus:outline-none resize-none"
                  style={{ border: `1px solid ${LINE}`, color: TEXT }}
                />
              </label>
              <button onClick={submitSupportTicket} disabled={supportBusy || !supportMessage.trim() || !authToken} className="px-3 py-2 rounded-lg font-mono text-sm flex items-center justify-center gap-2 disabled:opacity-40" style={{ backgroundColor: AMBER, color: BG }}>
                <LifeBuoy size={14} /> {supportBusy ? "Envoi…" : "Envoyer au support"}
              </button>
              {!authToken && <p className="text-[11px] font-mono" style={{ color: TEXT_MUTED }}>Connecte-toi pour envoyer un ticket suivi.</p>}
              {supportError && <p className="text-[11px] font-mono" style={{ color: DANGER }}>{supportError}</p>}
            </div>

            {supportTickets.length > 0 && (
              <div className="flex flex-col gap-2 pt-2" style={{ borderTop: `1px solid ${LINE}` }}>
                <p className="font-mono text-[10px] tracking-widest" style={{ color: TEXT_MUTED }}>TES TICKETS</p>
                {supportTickets.map((t) => (
                  <div key={t.id} className="p-2 rounded-md text-xs" style={{ border: `1px solid ${LINE}` }}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-[10px]" style={{ color: TEXT_MUTED }}>{fmtDateTime(t.createdAt)} · {t.category}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ color: t.status === "resolved" || t.status === "closed" ? SUCCESS : AMBER, border: `1px solid ${t.status === "resolved" || t.status === "closed" ? SUCCESS : AMBER}` }}>
                        {TICKET_STATUS_LABEL[t.status] || t.status}
                      </span>
                    </div>
                    <p style={{ color: TEXT }}>{t.message}</p>
                    {t.adminNote && (
                      <p className="mt-1 pt-1 text-[11px]" style={{ color: TEXT_MUTED, borderTop: `1px solid ${LINE}` }}>↳ {t.adminNote}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Parcours adaptatif : la prochaine étape, puis la file priorisée --- */
function StepCard({ step, onRun, primary }) {
  const locked = !!step.locked;
  return (
    <Frame accent={step.accent} className={primary ? "p-4" : "p-3"}>
      <div style={{ backgroundColor: PANEL }} className={`${primary ? "p-4 -m-4" : "p-3 -m-3"} rounded-sm`}>
        <div className="flex items-start gap-2 mb-1">
          {locked && <Lock size={13} style={{ color: step.accent }} className="mt-0.5 shrink-0" />}
          <h4 className="font-mono font-bold leading-snug" style={{ color: step.accent, fontSize: primary ? "1rem" : "0.85rem" }}>
            {step.title}
          </h4>
        </div>
        <p className="text-[12px] leading-relaxed mb-3" style={{ color: TEXT_MUTED }}>{step.rationale}</p>
        <button
          onClick={onRun}
          className="w-full py-2 rounded-lg font-mono text-xs transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5"
          style={{ backgroundColor: step.accent, color: BG }}
        >
          {step.cta} <ChevronRight size={14} />
        </button>
      </div>
    </Frame>
  );
}

function ParcoursView({ ctx }) {
  const { setView, parcours, runParcoursAction, hasPass, aiSettings, authToken } = ctx;
  const { steps, primary, allPassed } = parcours;

  // Signature de l'état courant : jour + suite ordonnée des étapes. Tant qu'elle
  // ne change pas, la narration IA reste en cache (au plus un appel/jour/état).
  const sig = `${getDailyReference()}|${steps.map((s) => s.id).join(",")}`;
  const [narration, setNarration] = useState(() => {
    try {
      const raw = window.localStorage.getItem(PARCOURS_NARRATION_KEY);
      const cached = raw ? JSON.parse(raw) : null;
      return { text: cached && cached.sig === sig ? cached.text : "", busy: false, error: "" };
    } catch { return { text: "", busy: false, error: "" }; }
  });

  async function askNarration() {
    setNarration((n) => ({ ...n, busy: true, error: "" }));
    const res = await callAi(buildParcoursPrompt(parcours), aiSettings, authToken);
    if (res.ok) {
      setNarration({ text: res.text, busy: false, error: "" });
      try { window.localStorage.setItem(PARCOURS_NARRATION_KEY, JSON.stringify({ sig, text: res.text })); } catch { /* cache best-effort */ }
    } else {
      setNarration((n) => ({ ...n, busy: false, error: res.error }));
    }
  }

  const adaLine = !primary
    ? allPassed
      ? "Tout est à jour, Gardien : chaque secteur est purifié et rien n'attend en révision. Reviens quand une carte redevient due — je veillerai."
      : "Rien d'urgent pour l'instant. Continue à explorer la carte quand tu veux."
    : primary.kind === "srs"
    ? "Avant d'attaquer du neuf, revoyons ce qui commence à s'effacer. C'est le meilleur retour sur ton temps aujourd'hui."
    : primary.kind === "qualification"
    ? "Tu es prêt pour l'étape qui ouvre tout le reste. Concentre-toi là-dessus."
    : primary.kind === "chantier"
    ? "Place à la construction. C'est là que tout ce que tu sais prend forme."
    : "Voici où porter ton effort maintenant. Une étape à la fois — je t'accompagne.";

  return (
    <div className="min-h-screen w-full font-sans" style={{ backgroundColor: BG, color: TEXT }}>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <button onClick={() => setView("map")} className="flex items-center gap-1 text-xs font-mono mb-6" style={{ color: TEXT_MUTED }}>
          <ArrowLeft size={14} /> Retour à la carte
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Compass size={20} style={{ color: AMBER }} />
          <h2 className="font-mono font-bold text-xl">Ton parcours</h2>
        </div>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: TEXT_MUTED }}>
          Bâti à partir de tes résultats, tes révisions dues et les relectures d'ADA : la prochaine étape à plus forte valeur, puis la suite.
        </p>

        <div className="mb-5">
          <DialogueBubble name="ADA" text={adaLine} accent="#8ECAE6" avatar={<AdaAvatar mood={primary ? "happy" : "proud"} size={44} />} />
        </div>

        {primary && (
          <>
            <p className="font-mono text-[11px] tracking-widest mb-2" style={{ color: AMBER }}>▸ MAINTENANT</p>
            <div className="mb-4">
              <StepCard step={primary} primary onRun={() => runParcoursAction(primary.action)} />
            </div>
          </>
        )}

        {/* Couche hybride : le plan ci-dessus est déterministe ; ADA peut le
            commenter à la demande (perk du pass, une fois par état/jour, caché). */}
        {primary && hasPass && (
          <div className="mb-6">
            {narration.text ? (
              <DialogueBubble name="ADA — ton coach" text={narration.text} accent={SUCCESS} avatar={<AdaAvatar mood="proud" size={40} />} />
            ) : (
              <button
                onClick={askNarration}
                disabled={narration.busy}
                className="w-full py-2.5 rounded-lg font-mono text-xs transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-60"
                style={{ border: `1px solid ${SUCCESS}`, color: SUCCESS, backgroundColor: `${SUCCESS}14` }}
              >
                <Sparkles size={13} /> {narration.busy ? "ADA réfléchit…" : "Demande à ADA de commenter ton parcours"}
              </button>
            )}
            {narration.error && (
              <p className="text-[11px] font-mono mt-2 text-center" style={{ color: DANGER }}>{narration.error}</p>
            )}
          </div>
        )}

        {steps.length > 1 && (
          <>
            <p className="font-mono text-[11px] tracking-widest mb-2" style={{ color: TEXT_MUTED }}>ENSUITE</p>
            <div className="flex flex-col gap-3">
              {steps.slice(1).map((step) => (
                <StepCard key={step.id} step={step} onRun={() => runParcoursAction(step.action)} />
              ))}
            </div>
          </>
        )}

        {!primary && (
          <div className="text-center py-8">
            <p className="font-mono text-sm" style={{ color: TEXT_MUTED }}>Aucune étape en attente.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Classement plateforme : les meilleurs au Défi Quotidien --------- */
/* --- Paliers : Découverte (gratuit) · Intégral (accès complet) · Mentorat (premium sur mesure) --- */
const TIERS = [
  {
    id: "decouverte", name: "Découverte", accent: "#8ECAE6",
    price: () => "Gratuit",
    lines: ["Fondation : JavaScript, ES6+, Asynchrone", "Défi quotidien + classement", "1 revue de code d'ADA par semaine"],
  },
  {
    id: "integral", name: "Intégral", accent: AMBER,
    price: (a) => `${(a?.passPriceXaf ?? 1500).toLocaleString("fr-FR")} XAF / ${a?.passDays ?? 30} j`,
    lines: ["Tout Découverte, plus…", "6 secteurs avancés · Qualification · Épreuves · Chantier", "Coach IA : indices + revues (quota/jour)", "Parcours qui cible tes faiblesses"],
  },
  {
    id: "mentorat", name: "Mentorat", accent: SUCCESS, soon: true,
    price: (a) => `${(a?.premiumPriceXaf ?? 5000).toLocaleString("fr-FR")} XAF / ${a?.premiumPassDays ?? 30} j`,
    lines: ["Tout Intégral, plus…", "ADA génère tes exercices sur mesure, ciblés sur tes faiblesses", "Modèle IA plus puissant, exercices auto-validés"],
  },
];

function TierLadder({ access, currentTier }) {
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      {TIERS.map((t) => {
        const active = currentTier === t.id;
        return (
          <Frame key={t.id} accent={t.accent} className="p-4">
            <div style={{ backgroundColor: PANEL }} className="p-4 -m-4 rounded-sm h-full flex flex-col">
              <div className="flex items-center justify-between mb-1 gap-2">
                <h3 className="font-mono font-bold text-sm" style={{ color: t.accent }}>{t.name}</h3>
                {active
                  ? <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full shrink-0" style={{ color: BG, backgroundColor: t.accent }}>TON PALIER</span>
                  : t.soon && <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full shrink-0" style={{ color: t.accent, border: `1px solid ${t.accent}55` }}>BIENTÔT</span>}
              </div>
              <p className="font-mono text-xs mb-3" style={{ color: TEXT }}>{t.price(access)}</p>
              <ul className="flex flex-col gap-1.5">
                {t.lines.map((l, i) => (
                  <li key={i} className="text-[11.5px] leading-snug flex gap-1.5" style={{ color: TEXT_MUTED }}>
                    <span className="shrink-0" style={{ color: t.accent }}>▸</span>{l}
                  </li>
                ))}
              </ul>
            </div>
          </Frame>
        );
      })}
    </div>
  );
}

/* --- Accueil : vitrine éducative, affichée une fois avant le premier défi --- */
// Ancre de valeur de la landing : ce que « vaut » une formation pratique
// encadrée de ce niveau, exprimée dans la devise probable du visiteur (déduite
// de la langue du navigateur). Montants indicatifs par marché — un repère
// honnête « l'équivalent de… », pas une conversion de change ni un prix facturé.
const TRAINING_VALUE_BY_CURRENCY = {
  XAF: { amount: 250000, locale: "fr-CM" },
  XOF: { amount: 250000, locale: "fr-SN" },
  EUR: { amount: 2500, locale: "fr-FR" },
  USD: { amount: 3000, locale: "en-US" },
  MAD: { amount: 20000, locale: "fr-MA" },
  NGN: { amount: 1500000, locale: "en-NG" },
};
const REGION_CURRENCY = {
  CM: "XAF", GA: "XAF", TD: "XAF", CF: "XAF", CG: "XAF", GQ: "XAF",
  SN: "XOF", CI: "XOF", BJ: "XOF", BF: "XOF", ML: "XOF", NE: "XOF", TG: "XOF", GW: "XOF",
  FR: "EUR", BE: "EUR", LU: "EUR", DE: "EUR", ES: "EUR", IT: "EUR",
  MA: "MAD", NG: "NGN", US: "USD", GB: "USD", CA: "USD",
};
function localizedTrainingValue() {
  let region = "CM";
  try {
    const lang = (typeof navigator !== "undefined" && ((navigator.languages && navigator.languages[0]) || navigator.language)) || "fr-CM";
    const part = lang.split("-")[1];
    if (part) region = part.toUpperCase();
  } catch { /* défaut CEMAC */ }
  const currency = REGION_CURRENCY[region] || "XAF";
  const { amount, locale } = TRAINING_VALUE_BY_CURRENCY[currency] || TRAINING_VALUE_BY_CURRENCY.XAF;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount.toLocaleString("fr-FR")} ${currency}`;
  }
}

function LandingView({ ctx }) {
  const { enterGame, openModal, authUser, access } = ctx;
  const trainingValue = localizedTrainingValue();
  const stack = ["JavaScript", "ES6+", "Asynchrone", "TypeScript", "React", "Next.js", "Express", "Vite"];
  const steps = [
    { Icon: GraduationCap, title: "ADA repère tes faiblesses", text: "À chaque exercice, ta mentore IA relit ton code comme un pair et nomme précisément ce qui pèche — nommage, lisibilité, robustesse, structure. Pas une note : un diagnostic." },
    { Icon: Compass, title: "Ton parcours cible ces lacunes", text: "Tes révisions et ta prochaine étape sont choisies pour te faire travailler exactement là où tu es faible. Pas un programme figé — le tien, qui évolue avec toi." },
    { Icon: Zap, title: "Tu progresses vite, pour de bon", text: "Plus tu reviens, plus tôt tes défauts sont corrigés. La répétition espacée ancre ce que tu apprends au lieu de le laisser s'oublier." },
  ];
  return (
    <div className="min-h-screen w-full font-sans" style={{ backgroundColor: BG, color: TEXT }}>
      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
        {/* Hero — l'objectif d'abord : le niveau visé */}
        <div className="text-center mb-8">
          <p className="font-mono text-[11px] tracking-[0.25em] mb-2" style={{ color: TEXT_MUTED }}>LES GARDIENS DE LA STACK</p>
          <h1 className="font-mono uppercase tracking-wide text-3xl sm:text-4xl font-bold mb-4">Fullstack://Quest</h1>
          <p className="text-base sm:text-lg leading-relaxed mx-auto" style={{ color: TEXT, maxWidth: "36rem" }}>
            Atteins un <strong style={{ color: AMBER }}>niveau avancé en JavaScript</strong> et ses frameworks — par la pratique, avec une formation qui s'adapte à <em>toi</em>.
          </p>
        </div>

        <div className="mb-10">
          <DialogueBubble
            name="ADA — ta mentore"
            text="Je ne te donne pas des vidéos à regarder. Tu écris du vrai code, je le relis comme le ferait un pair, je repère tes faiblesses — et je bâtis ta suite autour d'elles. C'est ça, se former pour de bon."
            accent="#8ECAE6"
            avatar={<AdaAvatar mood="idle" size={54} />}
          />
        </div>

        {/* Objectif concret : le niveau + les frameworks nommés */}
        <section className="mb-10">
          <p className="font-mono text-[11px] tracking-[0.2em] mb-2" style={{ color: AMBER }}>TON OBJECTIF</p>
          <h2 className="font-mono font-bold text-xl mb-2">Un niveau pro, sur toute la stack</h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: TEXT_MUTED }}>
            Du langage lui-même jusqu'à l'architecture d'une vraie application : les bases solides, puis TypeScript et les frameworks les plus demandés. Tu finis par <strong style={{ color: TEXT }}>construire un projet complet</strong> — pas par cocher des quiz.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {stack.map((s) => (
              <span key={s} className="px-2.5 py-1 rounded-full font-mono text-[11px]" style={{ backgroundColor: `${AMBER}14`, color: AMBER, border: `1px solid ${AMBER}55` }}>{s}</span>
            ))}
          </div>
        </section>

        {/* La formation sur mesure : la boucle faiblesses → correction */}
        <section className="mb-10">
          <p className="font-mono text-[11px] tracking-[0.2em] mb-2" style={{ color: AMBER }}>UNE FORMATION SUR MESURE</p>
          <h2 className="font-mono font-bold text-xl mb-4">Elle s'adapte à toi, pas l'inverse</h2>
          <div className="flex flex-col gap-3">
            {steps.map(({ Icon, title, text }, i) => (
              <Frame key={title} accent={AMBER} className="p-4">
                <div style={{ backgroundColor: PANEL }} className="p-4 -m-4 rounded-sm flex gap-3">
                  <div className="flex flex-col items-center gap-1 shrink-0" style={{ width: 34 }}>
                    <span className="font-mono text-[11px]" style={{ color: TEXT_MUTED }}>{`0${i + 1}`}</span>
                    <Icon size={18} style={{ color: AMBER }} />
                  </div>
                  <div>
                    <h3 className="font-mono font-bold text-sm mb-1">{title}</h3>
                    <p className="text-[12.5px] leading-relaxed" style={{ color: TEXT_MUTED }}>{text}</p>
                  </div>
                </div>
              </Frame>
            ))}
          </div>
        </section>

        {/* Ce que ça vaut : ancre de valeur (devise locale) vs. ce qu'on paie */}
        <section className="mb-10">
          <p className="font-mono text-[11px] tracking-[0.2em] mb-2" style={{ color: AMBER }}>CE QUE ÇA VAUT</p>
          <Frame accent={SUCCESS} className="p-5">
            <div style={{ backgroundColor: PANEL }} className="p-5 -m-5 rounded-sm">
              <p className="text-sm leading-relaxed mb-3" style={{ color: TEXT }}>
                Une formation pratique encadrée de ce niveau — l'équivalent d'un <strong>stage professionnel</strong> doublé d'un <strong>accompagnement sur mesure</strong> — vaut facilement <strong style={{ color: SUCCESS }}>{trainingValue}</strong>.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: TEXT_MUTED }}>
                Ici, tu l'as pour une fraction de ce prix. Et le tronc commun — JavaScript, ES6+, Asynchrone — est <strong style={{ color: TEXT }}>libre d'accès</strong> : tu peux commencer maintenant, sans rien payer.
              </p>
            </div>
          </Frame>
        </section>

        {/* Les 3 paliers — présentation (l'achat du Mentorat arrive après). */}
        <section className="mb-10">
          <p className="font-mono text-[11px] tracking-[0.2em] mb-3" style={{ color: AMBER }}>LES TROIS PALIERS</p>
          <TierLadder access={access} currentTier={access?.tier} />
        </section>

        <button onClick={() => enterGame()} className="w-full py-3 rounded-lg font-mono text-sm mb-2 flex items-center justify-center gap-2" style={{ backgroundColor: AMBER, color: BG }}>
          <Play size={16} /> Entrer dans le jeu
        </button>
        <p className="text-[11px] font-mono text-center mb-3" style={{ color: TEXT_MUTED }}>
          Le Défi du jour t'attend juste après — chronométré, le même pour tous.
        </p>
        {!authUser && (
          <button onClick={() => openModal("account")} className="w-full py-2 rounded-lg font-mono text-xs" style={{ border: `1px solid ${LINE}`, color: TEXT_MUTED }}>
            J'ai déjà un compte — me connecter
          </button>
        )}
      </div>
    </div>
  );
}

/* --- Profil public : lecture seule, ouvrable par lien (référence PIP) ------ */
function ProfileView({ ctx }) {
  const { profileUserId, setView, authUser, closeProfile } = ctx;
  const [state, setState] = useState({ busy: true, error: "", data: null });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiJson(`/api/v1/profile/${encodeURIComponent(profileUserId)}`);
        // Réponse sans nom = forme inattendue (endpoint indisponible) → traité
        // comme introuvable plutôt que d'afficher un profil vide/incohérent.
        // Erreur sans message : friendlyError retombe sur le libellé fr par défaut.
        if (!data || !data.displayName) throw new Error();
        if (alive) setState({ busy: false, error: "", data });
      } catch (e) {
        if (alive) setState({ busy: false, error: friendlyError(e, "Ce profil n'est pas disponible."), data: null });
      }
    })();
    return () => { alive = false; };
  }, [profileUserId]);

  const p = state.data;
  const level = p ? getLevelInfo(p.xp || 0) : null;
  const skills = p?.skills || { reviewed: 0, clean: 0, weakAxes: {} };
  const cleanPct = skills.reviewed > 0 ? Math.round((skills.clean / skills.reviewed) * 100) : 0;
  const weak = skills.weakAxes || {};
  const axes = Object.keys(REVIEW_AXES).map((a) => ({ id: a, label: REVIEW_AXES[a], count: weak[a] || 0 })).sort((x, y) => y.count - x.count);
  const maxCount = Math.max(1, ...axes.map((a) => a.count));
  const strengths = axes.filter((a) => a.count === 0);
  const isMine = authUser?.user?.id && authUser.user.id === profileUserId;

  return (
    <div className="min-h-screen w-full font-sans" style={{ backgroundColor: BG, color: TEXT }}>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <button onClick={() => closeProfile()} className="flex items-center gap-1 text-xs font-mono mb-6" style={{ color: TEXT_MUTED }}>
          <ArrowLeft size={14} /> {isMine ? "Retour" : "Découvrir Fullstack Quest"}
        </button>

        {state.busy && <p className="font-mono text-sm text-center py-16" style={{ color: TEXT_MUTED }}>Chargement du profil…</p>}
        {!state.busy && state.error && <p className="font-mono text-sm text-center py-16" style={{ color: DANGER }}>{state.error}</p>}

        {p && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap size={20} style={{ color: "#8ECAE6" }} />
              <h2 className="font-mono font-bold text-xl">{p.displayName}</h2>
            </div>
            <p className="text-xs font-mono mb-6" style={{ color: TEXT_MUTED }}>
              {level?.label} · membre depuis {new Date(p.memberSince).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { v: `${p.sectorsCompleted}/${MODULES.length}`, k: "SECTEURS" },
                { v: p.daily?.rank ? `#${p.daily.rank}` : "—", k: "RANG DÉFI" },
                { v: `${p.daily?.streak || 0}🔥`, k: "SÉRIE (JOURS)" },
              ].map(({ v, k }) => (
                <Frame key={k} accent={AMBER} className="p-3">
                  <div style={{ backgroundColor: PANEL }} className="p-3 -m-3 rounded-sm text-center">
                    <p className="font-mono text-lg font-bold" style={{ color: AMBER }}>{v}</p>
                    <p className="font-mono text-[9px] tracking-widest" style={{ color: TEXT_MUTED }}>{k}</p>
                  </div>
                </Frame>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { v: p.qualificationPassed ? "✓" : "—", k: "QUALIFIÉ", c: p.qualificationPassed ? SUCCESS : TEXT_MUTED },
                { v: skills.reviewed, k: "RELECTURES", c: TEXT },
                { v: `${cleanPct}%`, k: "PROPRES 1ᵉ COUP", c: cleanPct >= 50 ? SUCCESS : AMBER },
              ].map(({ v, k, c }) => (
                <Frame key={k} accent={LINE} className="p-3">
                  <div style={{ backgroundColor: PANEL }} className="p-3 -m-3 rounded-sm text-center">
                    <p className="font-mono text-lg font-bold" style={{ color: c }}>{v}</p>
                    <p className="font-mono text-[9px] tracking-widest" style={{ color: TEXT_MUTED }}>{k}</p>
                  </div>
                </Frame>
              ))}
            </div>

            {skills.reviewed > 0 && (
              <>
                <p className="font-mono text-[11px] tracking-widest mb-2" style={{ color: TEXT_MUTED }}>AXES DE QUALITÉ</p>
                <div className="flex flex-col gap-2 mb-4">
                  {axes.map((a) => (
                    <div key={a.id} className="flex items-center gap-3">
                      <span className="font-mono text-xs w-24 shrink-0" style={{ color: a.count > 0 ? TEXT : TEXT_MUTED }}>{a.label}</span>
                      <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: PANEL_SOFT }}>
                        <div className="h-full rounded-full" style={{ width: `${(a.count / maxCount) * 100}%`, backgroundColor: a.count > 0 ? `${AMBER}99` : "transparent" }} />
                      </div>
                      <span className="font-mono text-[11px] w-6 text-right shrink-0" style={{ color: a.count > 0 ? AMBER : TEXT_MUTED }}>{a.count}</span>
                    </div>
                  ))}
                </div>
                {strengths.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {strengths.map((a) => (
                      <span key={a.id} className="px-2 py-0.5 rounded-full font-mono text-[10px]" style={{ backgroundColor: `${SUCCESS}18`, color: SUCCESS, border: `1px solid ${SUCCESS}55` }}>{a.label}</span>
                    ))}
                  </div>
                )}
              </>
            )}

            <p className="text-[11px] font-mono mt-6 text-center" style={{ color: TEXT_MUTED }}>
              Profil vérifié — les scores du Défi sont calculés par le serveur, pas déclarés par le joueur.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const LEADERBOARD_PERIODS = [
  { id: "today", label: "Aujourd'hui" },
  { id: "week", label: "7 jours" },
  { id: "all", label: "Toujours" },
];

function LeaderboardView({ ctx }) {
  const { setView, authToken, authUser, openModal, openProfile } = ctx;
  const [period, setPeriod] = useState("today");
  const [state, setState] = useState({ busy: true, error: "", entries: [], me: null });

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, busy: true }));
    (async () => {
      try {
        const data = await apiJson(`/api/v1/leaderboard?period=${period}`, { token: authToken || undefined });
        if (alive) setState({ busy: false, error: "", entries: data.entries || [], me: data.me || null });
      } catch (e) {
        if (alive) setState({ busy: false, error: friendlyError(e, "Le classement n'est pas disponible pour l'instant."), entries: [], me: null });
      }
    })();
    return () => { alive = false; };
  }, [authToken, period]);

  const myName = authUser?.user?.displayName;
  const medal = (r) => (r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : `#${r}`);
  const inTop = state.me && state.entries.some((e) => e.rank === state.me.rank);
  const periodNote = period === "today" ? "aujourd'hui" : period === "week" ? "ces 7 derniers jours" : "au cumul";

  return (
    <div className="min-h-screen w-full font-sans" style={{ backgroundColor: BG, color: TEXT }}>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <button onClick={() => setView("map")} className="flex items-center gap-1 text-xs font-mono mb-6" style={{ color: TEXT_MUTED }}>
          <ArrowLeft size={14} /> Retour à la carte
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Crown size={20} style={{ color: AMBER }} />
          <h2 className="font-mono font-bold text-xl">Classement</h2>
        </div>
        <p className="text-sm mb-4 leading-relaxed" style={{ color: TEXT_MUTED }}>
          Les meilleurs au Défi Quotidien — le même examen pour tous, chaque jour. Classé aux bonnes réponses {periodNote}, départagé par la précision.
        </p>

        {/* Fenêtres : « qui est bon en ce moment » en plus du all-time, pour que
            les nouveaux puissent rivaliser sans rattraper tout un historique. */}
        <div className="flex gap-1.5 mb-6">
          {LEADERBOARD_PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className="flex-1 py-2 rounded-lg font-mono text-xs transition-colors"
              style={{
                backgroundColor: period === p.id ? AMBER : PANEL,
                color: period === p.id ? BG : TEXT_MUTED,
                border: `1px solid ${period === p.id ? AMBER : LINE}`,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {state.busy && <p className="font-mono text-sm text-center py-8" style={{ color: TEXT_MUTED }}>Chargement…</p>}
        {!state.busy && state.error && <p className="font-mono text-sm text-center py-8" style={{ color: DANGER }}>{state.error}</p>}
        {!state.busy && !state.error && state.entries.length === 0 && (
          <p className="font-mono text-sm text-center py-8" style={{ color: TEXT_MUTED }}>Aucun défi enregistré pour l'instant. Sois le premier à marquer le classement.</p>
        )}

        {!state.busy && !state.error && state.entries.length > 0 && (
          <>
            <div className="grid grid-cols-[2.5rem_1fr_auto] gap-2 px-3 mb-2 font-mono text-[10px] tracking-widest" style={{ color: TEXT_MUTED }}>
              <span>RANG</span><span>JOUEUR</span><span className="text-right">PTS · JOURS · PRÉC.</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {state.entries.map((e) => {
                const isMe = myName && e.displayName === myName;
                return (
                  <button key={`${e.rank}-${e.userId || e.displayName}`} onClick={() => e.userId && openProfile(e.userId)}
                    className="grid grid-cols-[2.5rem_1fr_auto] gap-2 items-center px-3 py-2 rounded-lg text-left transition-opacity hover:opacity-80"
                    style={{ backgroundColor: isMe ? `${AMBER}18` : PANEL, border: `1px solid ${isMe ? AMBER : LINE}` }}>
                    <span className="font-mono text-sm font-bold" style={{ color: e.rank <= 3 ? AMBER : TEXT_MUTED }}>{medal(e.rank)}</span>
                    <span className="font-mono text-sm truncate" style={{ color: TEXT }}>{e.displayName}{isMe && <span style={{ color: AMBER }}> · toi</span>}</span>
                    <span className="font-mono text-xs text-right" style={{ color: TEXT_MUTED }}>
                      <strong style={{ color: TEXT }}>{e.points}</strong> · {e.days}j · {Math.round((e.accuracy || 0) * 100)}%
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Rang de l'appelant s'il est hors du top affiché */}
            {state.me && !inTop && (
              <div className="mt-3 grid grid-cols-[2.5rem_1fr_auto] gap-2 items-center px-3 py-2 rounded-lg" style={{ backgroundColor: `${AMBER}18`, border: `1px solid ${AMBER}` }}>
                <span className="font-mono text-sm font-bold" style={{ color: AMBER }}>#{state.me.rank}</span>
                <span className="font-mono text-sm truncate" style={{ color: TEXT }}>{myName || "Toi"}<span style={{ color: AMBER }}> · toi</span></span>
                <span className="font-mono text-xs text-right" style={{ color: TEXT_MUTED }}>
                  <strong style={{ color: TEXT }}>{state.me.points}</strong> · {state.me.days}j · {Math.round((state.me.accuracy || 0) * 100)}%
                </span>
              </div>
            )}
          </>
        )}

        {!authToken && !state.busy && (
          <div className="mt-6 text-center">
            <p className="font-mono text-[11px] mb-2" style={{ color: TEXT_MUTED }}>Crée un compte pour apparaître au classement.</p>
            <button
              onClick={() => openModal("account")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-mono text-xs"
              style={{ backgroundColor: AMBER, color: BG }}
            >
              <User size={14} /> Se connecter / S'inscrire
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Carte du monde : parcours des secteurs -------------------------- */
function MapView({ ctx }) {
  const {
    profile, soundOn, setSoundOn, setView, adaGreet, completedCount, levelInfo,
    badgeCount, isUnlocked, nextIdx, startModule, confirmReset, setConfirmReset, resetProgress,
    startDailyChallenge, startSrsSession, startQualificationExam, startTechnicalTrial,
    authToken, authUser, access, hasPass, openModal, openSupport,
    parcours, runParcoursAction,
  } = ctx;
  const primaryStep = parcours?.primary || null;
  const qualified = !!profile.qualification?.passed;
  const chantierUnlocked = hasPass && qualified && completedCount >= Math.ceil(MODULES.length / 2);
  const foundationDone = FOUNDATION_TIER.every((id) => profile.results[id]?.passed);
  const passPrice = access?.passPriceXaf ?? 1500;
  const passDays = access?.passDays ?? 30;
  // Vers la modale de paiement — en passant par la création de compte si besoin.
  const unlockTarget = authToken ? "pay" : "account";

  const [menuOpen, setMenuOpen] = useState(false);
  function openFromMenu(id) {
    setMenuOpen(false);
    if (id === "support") openSupport("autre", null);
    else openModal(id);
  }
  return (
    <div className="min-h-screen w-full font-sans" style={{ backgroundColor: BG, color: TEXT }}>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <Frame accent={AMBER} className="p-5 mb-3">
          <div style={{ backgroundColor: PANEL }} className="p-5 -m-5 rounded-sm">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="font-mono text-[11px] tracking-[0.2em] mb-1" style={{ color: TEXT_MUTED }}>
                  LES GARDIENS DE LA STACK
                </p>
                <h1 className="font-mono uppercase tracking-wide text-2xl sm:text-3xl font-bold">
                  Fullstack://Quest
                </h1>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => setSoundOn((s) => !s)} title="Son" className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${LINE}`, color: soundOn ? AMBER : TEXT_MUTED }}>
                  {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button onClick={() => setView("codex")} title="Codex" className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${LINE}`, color: AMBER }}>
                  <BookOpen size={16} />
                </button>
                <div className="relative">
                  <button onClick={() => setMenuOpen((o) => !o)} title="Menu" className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${LINE}`, color: menuOpen ? AMBER : TEXT_MUTED }}>
                    <Menu size={16} />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 z-40 w-52 rounded-lg py-1" style={{ backgroundColor: PANEL_SOFT, border: `1px solid ${LINE}`, boxShadow: "0 10px 28px rgba(0,0,0,0.5)" }}>
                      {[
                        { id: "account", Icon: User, label: authUser ? authUser.user.displayName : "Compte" },
                        { id: "save", Icon: Download, label: "Sauvegarder" },
                        { id: "restore", Icon: Upload, label: "Restaurer" },
                        { id: "support", Icon: LifeBuoy, label: "Support" },
                      ].map(({ id, Icon, label }) => (
                        <button key={id} onClick={() => openFromMenu(id)} className="w-full flex items-center gap-2 px-3 py-2 font-mono text-xs text-left hover:opacity-80" style={{ color: TEXT }}>
                          <Icon size={13} style={{ color: id === "account" && hasPass ? SUCCESS : TEXT_MUTED }} /> <span className="truncate">{label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ada parle */}
            <div className="mb-4">
              <DialogueBubble name="ADA — Gardienne" text={adaGreet} accent="#8ECAE6" avatar={<AdaAvatar mood={completedCount === MODULES.length ? "proud" : "idle"} size={54} />} />
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono">
              <div>
                <p className="text-[10px] tracking-widest" style={{ color: TEXT_MUTED }}>RANG</p>
                <p className="text-xs sm:text-sm font-bold" style={{ color: AMBER }}>{levelInfo.label}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-widest" style={{ color: TEXT_MUTED }}>XP</p>
                <p className="text-xs sm:text-sm font-bold">{profile.xp}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-widest" style={{ color: TEXT_MUTED }}>SECTEURS</p>
                <p className="text-xs sm:text-sm font-bold" style={{ color: SUCCESS }}>{completedCount} / {MODULES.length}</p>
              </div>
            </div>

            {(access?.dailyStreak || 0) > 0 && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px]" style={{ backgroundColor: `${AMBER}18`, border: `1px solid ${AMBER}55`, color: AMBER }}>
                🔥 {access.dailyStreak} jour{access.dailyStreak > 1 ? "s" : ""} d'affilée au Défi
              </div>
            )}

            {levelInfo.next && (
              <div className="mt-3">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: LINE }}>
                  <div className="h-full rounded-full" style={{ width: `${levelInfo.pct}%`, backgroundColor: AMBER, transition: "width 500ms ease" }} />
                </div>
                <p className="text-[10px] font-mono mt-1" style={{ color: TEXT_MUTED }}>
                  {levelInfo.pct}% vers {levelInfo.next.label} · {badgeCount} haut{badgeCount > 1 ? "s" : ""} fait{badgeCount > 1 ? "s" : ""} · meilleur combo ×{profile.bestCombo || 0}
                </p>
              </div>
            )}
          </div>
        </Frame>

        {/* Bannière accès complet (les joueurs fondation voient l'offre en un coup d'œil) */}
        {!hasPass && (
          <button
            onClick={() => openModal(unlockTarget)}
            className="w-full mt-6 p-4 rounded-lg text-left flex items-center gap-3 hover:opacity-90 transition-opacity"
            style={{ background: `linear-gradient(90deg, ${AMBER}26, transparent 70%)`, border: `1px solid ${AMBER}` }}
          >
            <Unlock size={20} style={{ color: AMBER }} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs tracking-widest mb-0.5" style={{ color: AMBER }}>
                PASSER À L'INTÉGRAL — {passPrice.toLocaleString("fr-FR")} FCFA / {passDays} JOURS
              </p>
              <p className="text-[11px] font-mono" style={{ color: TEXT_MUTED }}>
                6 secteurs avancés · Qualification · Épreuves · Chantier · Coach IA · puis le palier Mentorat sur mesure
              </p>
            </div>
            <ChevronRight size={16} style={{ color: AMBER }} className="shrink-0" />
          </button>
        )}

        {/* Continuer mon parcours — la prochaine étape à plus forte valeur,
            calculée depuis les résultats/SRS/revues. Point d'entrée principal. */}
        <div className="mt-6">
          <div className="flex items-center gap-1.5 mb-2">
            <Compass size={14} style={{ color: AMBER }} />
            <p className="font-mono text-[11px] tracking-widest" style={{ color: AMBER }}>CONTINUER MON PARCOURS</p>
          </div>
          {primaryStep ? (
            <Frame accent={primaryStep.accent} className="p-4">
              <div style={{ backgroundColor: PANEL }} className="p-4 -m-4 rounded-sm">
                <div className="flex items-start gap-2 mb-1">
                  {primaryStep.locked && <Lock size={14} style={{ color: primaryStep.accent }} className="mt-0.5 shrink-0" />}
                  <h3 className="font-mono font-bold text-base leading-snug" style={{ color: primaryStep.accent }}>{primaryStep.title}</h3>
                </div>
                <p className="text-[12px] leading-relaxed mb-3" style={{ color: TEXT_MUTED }}>{primaryStep.rationale}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => runParcoursAction(primaryStep.action)}
                    className="flex-1 py-2 rounded-lg font-mono text-xs transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: primaryStep.accent, color: BG }}
                  >
                    {primaryStep.cta} <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => setView("parcours")}
                    className="px-3 py-2 rounded-lg font-mono text-[11px] transition-opacity hover:opacity-90"
                    style={{ border: `1px solid ${LINE}`, color: TEXT_MUTED }}
                  >
                    Tout voir
                  </button>
                </div>
              </div>
            </Frame>
          ) : (
            <button
              onClick={() => setView("parcours")}
              className="w-full p-4 rounded-lg text-left flex items-center gap-3 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: `${SUCCESS}14`, border: `1px solid ${SUCCESS}` }}
            >
              <Compass size={18} style={{ color: SUCCESS }} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs" style={{ color: SUCCESS }}>Parcours à jour</p>
                <p className="text-[11px] font-mono" style={{ color: TEXT_MUTED }}>Rien n'attend — reviens quand une révision redevient due</p>
              </div>
              <ChevronRight size={16} style={{ color: TEXT_MUTED }} className="shrink-0" />
            </button>
          )}
        </div>

        {/* Révisions espacées. Le Défi du Jour (obligatoire) est relevé avant
            d'atteindre la carte, et le Classement n'a d'autre porte que l'écran
            de fin de défi — pas de raccourci ici, volontairement. */}
        <div className="mt-6 mb-3">
          <button
            onClick={() => ctx.startSrsSession?.()}
            className="w-full p-4 rounded-lg text-center transition-colors hover:opacity-80"
            style={{ backgroundColor: `${SUCCESS}22`, border: `1px solid ${SUCCESS}` }}
          >
            <p className="font-mono text-xs tracking-widest mb-1" style={{ color: SUCCESS }}>🧠 RÉVISIONS</p>
            <p className="text-xs" style={{ color: TEXT }}>Répétition espacée — consolide ce que tu as appris</p>
          </button>
        </div>

        {/* Dossier de compétences : forces/faiblesses tirées des revues de code d'ADA */}
        <button
          onClick={() => setView("skills")}
          className="w-full p-3 rounded-lg text-left transition-colors hover:opacity-80 mb-3 flex items-center gap-3"
          style={{ backgroundColor: "#8ECAE614", border: "1px solid #8ECAE6" }}
        >
          <GraduationCap size={18} style={{ color: "#8ECAE6" }} />
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs tracking-widest" style={{ color: "#8ECAE6" }}>📊 DOSSIER DE COMPÉTENCES</p>
            <p className="text-[11px] font-mono" style={{ color: TEXT_MUTED }}>
              {(profile.skills?.reviewed || 0) > 0
                ? `${profile.skills.reviewed} relecture${profile.skills.reviewed > 1 ? "s" : ""} — vois tes forces et l'axe à travailler`
                : "Fais relire ton code par ADA pour bâtir ton profil de qualité"}
            </p>
          </div>
          <ChevronRight size={16} style={{ color: TEXT_MUTED }} />
        </button>

        {/* Examen de Qualification : condition d'accès aux secteurs avancés + au Chantier.
            Réservé à l'accès complet — le bouton devient le point de conversion. */}
        <button
          onClick={() => foundationDone && (hasPass ? startQualificationExam() : openModal(unlockTarget))}
          disabled={!foundationDone}
          className="w-full p-4 rounded-lg text-left transition-colors hover:opacity-80 mb-8 flex items-center gap-3 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: qualified ? `${SUCCESS}14` : `${AMBER}14`, border: `1px solid ${qualified ? SUCCESS : AMBER}` }}
        >
          <GraduationCap size={22} style={{ color: qualified ? SUCCESS : AMBER }} />
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs tracking-widest mb-0.5" style={{ color: qualified ? SUCCESS : AMBER }}>
              🎓 EXAMEN DE QUALIFICATION {qualified ? "— OBTENU" : ""}
            </p>
            <p className="text-[11px] font-mono" style={{ color: TEXT_MUTED }}>
              {!foundationDone
                ? "Termine JS, JS Avancé et Async pour pouvoir le tenter"
                : qualified
                ? `Débloque les secteurs avancés et le Chantier · meilleur score ${profile.qualification?.bestScore || 0}%`
                : !hasPass
                ? "Prêt à te qualifier ? Débloque l'accès complet pour passer l'examen"
                : `Requis pour les secteurs avancés et le Chantier · seuil ${QUALIFICATION_PASS_PCT}% · meilleur score ${profile.qualification?.bestScore || 0}%`}
            </p>
          </div>
          {foundationDone && <ChevronRight size={18} style={{ color: qualified ? SUCCESS : AMBER }} />}
        </button>

        {/* Chantier : capstone construit hors de l'app */}
        <button
          onClick={() => chantierUnlocked && setView("chantier")}
          disabled={!chantierUnlocked}
          className="w-full p-4 rounded-lg text-left transition-colors hover:opacity-80 mb-8 flex items-center gap-3 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: `${AMBER}14`, border: `1px solid ${AMBER}` }}
        >
          {chantierUnlocked ? <Hammer size={22} style={{ color: AMBER }} /> : <Lock size={22} style={{ color: AMBER }} />}
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs tracking-widest mb-0.5" style={{ color: AMBER }}>🛠 CHANTIER — CONSTRUIS UN VRAI PROJET</p>
            <p className="text-[11px] font-mono" style={{ color: TEXT_MUTED }}>
              {chantierUnlocked
                ? `${CHANTIER.milestones.filter((m) => profile.chantier?.milestones?.[m.id]?.done).length}/${CHANTIER.milestones.length} jalons · dans ton propre éditeur`
                : `Accès complet + Qualification + ${Math.ceil(MODULES.length / 2)} secteurs purifiés`}
            </p>
          </div>
          {chantierUnlocked && <ChevronRight size={18} style={{ color: AMBER }} />}
        </button>

        {/* Chemin des secteurs */}
        <div className="mt-8">
          {MODULES.map((mod, idx) => {
            const unlocked = isUnlocked(idx);
            const result = profile.results[mod.id];
            const passed = !!result?.passed;
            const best = result?.bestScore;
            const isNext = unlocked && !passed && idx === nextIdx;
            const prevPassed = idx === 0 || !!profile.results[MODULES[idx - 1].id]?.passed;
            // Le verrou pass prime sur le verrou qualification dans l'affichage.
            const blockedByPass = !unlocked && prevPassed && ADVANCED_TIER.includes(mod.id) && !hasPass;
            const blockedByQualification = !unlocked && prevPassed && !blockedByPass && ADVANCED_TIER.includes(mod.id) && !qualified;
            const techUnlocked = isTechnicalUnlocked(profile, mod);
            const techDone = isTechnicalDone(profile, mod);

            return (
              <div key={mod.id}>
                {idx > 0 && (
                  <div className="ml-8 w-0.5 h-6" style={{ backgroundImage: `repeating-linear-gradient(to bottom, ${unlocked ? mod.accent : LINE} 0, ${unlocked ? mod.accent : LINE} 4px, transparent 4px, transparent 9px)` }} />
                )}
                <button
                  disabled={!unlocked && !blockedByPass}
                  onClick={() => (unlocked ? startModule(idx) : blockedByPass ? openModal(unlockTarget) : undefined)}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed group"
                  style={{ backgroundColor: unlocked ? PANEL : "transparent", opacity: unlocked ? 1 : blockedByPass ? 0.75 : 0.5, border: isNext ? `1px solid ${AMBER}` : "1px solid transparent" }}
                >
                  <div className="relative shrink-0 w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: unlocked ? `${mod.accent}18` : PANEL_SOFT, border: `1px solid ${unlocked ? mod.accent : LINE}` }}>
                    {unlocked ? (
                      <BossAvatar kind={mod.boss.kind} accent={mod.accent} state={passed ? "defeated" : "idle"} size={54} />
                    ) : blockedByPass ? (
                      <Unlock size={20} style={{ color: AMBER }} />
                    ) : blockedByQualification ? (
                      <GraduationCap size={20} style={{ color: TEXT_MUTED }} />
                    ) : (
                      <Lock size={20} style={{ color: TEXT_MUTED }} />
                    )}
                    <span className="absolute -bottom-1.5 -right-1.5 text-[10px] font-mono px-1 rounded" style={{ backgroundColor: BG, color: passed ? SUCCESS : TEXT_MUTED, border: `1px solid ${LINE}` }}>
                      {passed ? "✓" : mod.num}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-bold text-sm sm:text-base truncate" style={{ color: unlocked ? TEXT : TEXT_MUTED }}>{mod.title}</p>
                    <p className="text-[11px] font-mono truncate" style={{ color: unlocked ? mod.accent : blockedByPass ? AMBER : TEXT_MUTED }}>
                      {unlocked ? `${mod.boss.name} — ${mod.boss.epithet}` : blockedByPass ? "Réservé à l'accès complet" : blockedByQualification ? "Nécessite l'Examen de Qualification" : "Secteur scellé"}
                    </p>
                    <p className="text-[11px] font-mono mt-0.5" style={{ color: passed ? SUCCESS : isNext ? AMBER : TEXT_MUTED }}>
                      {!unlocked ? (blockedByPass ? `Débloquer — ${passPrice.toLocaleString("fr-FR")} FCFA / ${passDays} j` : "Verrouillé") : passed ? `Purifié — record ${best}%${result?.flawless ? " · sans dégât" : ""}` : isNext ? "▶ PROCHAIN DUEL" : best ? `Échec — dernier ${best}%` : "Prêt au combat"}
                    </p>
                  </div>

                  {unlocked && <ChevronRight size={20} className="shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: mod.accent }} />}
                </button>

                {passed && (
                  techDone ? (
                    <div className="ml-[76px] mt-1 flex items-center gap-1.5 font-mono text-[10px]" style={{ color: SUCCESS }}>
                      <Wrench size={11} /> Épreuve Technique certifiée
                    </div>
                  ) : techUnlocked && !hasPass ? (
                    <button
                      onClick={() => openModal(unlockTarget)}
                      className="ml-[76px] mt-1 flex items-center gap-1.5 font-mono text-[10px] hover:opacity-80"
                      style={{ color: AMBER }}
                    >
                      <Wrench size={11} /> Épreuve Technique — réservée à l'accès complet →
                    </button>
                  ) : techUnlocked ? (
                    <button
                      onClick={() => startTechnicalTrial(idx)}
                      className="ml-[76px] mt-1 flex items-center gap-1.5 font-mono text-[10px] hover:opacity-80"
                      style={{ color: mod.accent }}
                    >
                      <Wrench size={11} /> Épreuve Technique disponible →
                    </button>
                  ) : (
                    <div className="ml-[76px] mt-1 flex items-center gap-1.5 font-mono text-[10px]" style={{ color: TEXT_MUTED }}>
                      <Wrench size={11} /> Épreuve Technique dès {TECHNICAL_UNLOCK_PCT}% de record (actuel {best}%)
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 pt-4 border-t font-mono text-[10px] tracking-widest text-center" style={{ borderColor: LINE, color: TEXT_MUTED }}>
          {MODULES.reduce((s, m) => s + getBattleQuestions(m).length, 0)} DÉFIS · 9 BOSS · SURVIS À CHAQUE DUEL POUR PURIFIER LA STACK
        </div>

        <div className="mt-6 text-center">
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} className="text-[11px] font-mono underline" style={{ color: TEXT_MUTED }}>
              Réinitialiser la progression
            </button>
          ) : (
            <div className="inline-flex items-center gap-3 text-[11px] font-mono">
              <span style={{ color: TEXT_MUTED }}>Effacer toute la progression ?</span>
              <button onClick={resetProgress} className="px-2 py-1 rounded" style={{ backgroundColor: DANGER, color: "#fff" }}>Confirmer</button>
              <button onClick={() => setConfirmReset(false)} className="px-2 py-1 rounded" style={{ border: `1px solid ${LINE}`, color: TEXT_MUTED }}>Annuler</button>
            </div>
          )}
        </div>

        {/* Clic hors du menu ☰ : referme */}
        {menuOpen && <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />}
      </div>
    </div>
  );
}

/* --- Intro : révélation du boss avant le duel ------------------------ */
function IntroView({ ctx }) {
  const { activeIdx, backToMap, engage } = ctx;
  const mod = MODULES[activeIdx];
  return (
    <div className="min-h-screen w-full font-sans flex items-center" style={{ backgroundColor: BG, color: TEXT, background: `radial-gradient(circle at 50% 35%, ${mod.accent}1A, ${BG} 60%)` }}>
      <div className="max-w-2xl mx-auto px-4 py-12 w-full">
        <button onClick={backToMap} className="flex items-center gap-1 text-xs font-mono mb-6" style={{ color: TEXT_MUTED }}>
          <ArrowLeft size={14} /> Battre en retraite
        </button>

        <div className="text-center mb-5">
          <p className="font-mono text-[11px] tracking-[0.25em] mb-1" style={{ color: TEXT_MUTED }}>SECTEUR {mod.num} — {mod.title.toUpperCase()}</p>
          <p className="font-mono text-[11px] tracking-widest" style={{ color: mod.accent }}>⚠ SIGNATURE DE BUG DÉTECTÉE</p>
        </div>

        <div className="flex justify-center mb-3">
          <BossAvatar kind={mod.boss.kind} accent={mod.accent} state="idle" size={150} />
        </div>
        <h2 className="text-center font-mono font-extrabold text-2xl sm:text-3xl tracking-wide" style={{ color: mod.accent }}>{mod.boss.name}</h2>
        <p className="text-center font-mono text-sm mb-6" style={{ color: TEXT_MUTED }}>{mod.boss.epithet}</p>

        <div className="flex flex-col gap-3 mb-6">
          <DialogueBubble name={mod.boss.name} text={`« ${mod.boss.taunt} »`} accent={mod.accent} side="right"
            avatar={<div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${mod.accent}` }}><Skull size={20} style={{ color: mod.accent }} /></div>} />
          <DialogueBubble name="ADA" text={`${mod.intro} Survis à ce duel — 3 cœurs, ${getBattleQuestions(mod).length} assauts — et le secteur sera purifié.`} accent="#8ECAE6"
            avatar={<AdaAvatar mood="idle" size={48} />} />
        </div>

        <button onClick={engage} className="w-full py-3.5 rounded-lg font-mono font-bold text-sm flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2"
          style={{ backgroundColor: mod.accent, color: "#0B2545" }}>
          <Swords size={17} /> ENGAGER LE DUEL
        </button>
      </div>
    </div>
  );
}

/* --- Duel : l'écran de combat (QCM / code / ordre) ------------------- */
function BattleView({ ctx }) {
  const {
    activeIdx, qIdx, selected, answered, shake, flash, backToMap, combo, lives,
    soundOn, setSoundOn, floaters, bossState, bossHP, adaLine, adaMood, runXP,
    codeInput, setCodeInput, runTests, codeAttempts, testResults,
    orderWork, moveLine, validateOrder, selectAnswer, dead, nextQuestion,
    askLocalHint, aiHint, aiBusy, aiError, clearAiHint,
    review, askCodeReview, resubmitForReview,
    aiSettings, authToken, access, hasPass, openModal,
  } = ctx;
  const mod = MODULES[activeIdx];
  const battleQuestions = getBattleQuestions(mod);
  const q = battleQuestions[qIdx];
  const isLast = qIdx === battleQuestions.length - 1;
  const critical = bossHP <= 0.5;
  const success =
    q.type === "code" || q.type === "refactor" ? selected === q.type
    : q.type === "order" ? (answered && orderWork.every((v, idx) => v === idx))
    : selected === q.correct;

  return (
    <div className={`min-h-screen w-full font-sans ${shake ? "fsq-shake" : ""}`} style={{ backgroundColor: BG, color: TEXT }}>
      {/* flash plein écran */}
      {flash && (
        <div className="fixed inset-0 pointer-events-none" style={{ backgroundColor: flash === "green" ? SUCCESS : DANGER, opacity: 0.16, transition: "opacity 200ms ease", zIndex: 40 }} />
      )}

      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        {/* barre du haut */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={backToMap} className="flex items-center gap-1 text-xs font-mono" style={{ color: TEXT_MUTED }}>
            <ArrowLeft size={14} /> Fuir
          </button>
          <div className="flex items-center gap-3">
            <ComboMeter combo={combo} />
            <Hearts lives={lives} />
            <button onClick={() => setSoundOn((s) => !s)} className="opacity-70" style={{ color: soundOn ? AMBER : TEXT_MUTED }}>
              {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
          </div>
        </div>

        {/* arène du boss */}
        <Frame accent={mod.accent} className="p-4 mb-4">
          <div style={{ backgroundColor: PANEL, background: `radial-gradient(circle at 50% 40%, ${mod.accent}14, ${PANEL} 70%)` }} className="p-4 -m-4 rounded-sm relative overflow-hidden">
            {/* floaters */}
            {floaters.map((f) => (
              <span key={f.id} className="fsq-float font-mono text-base sm:text-lg" style={{ left: `${f.x}%`, top: "38%", color: f.kind === "hurt" ? DANGER : f.text.startsWith("CRIT") ? AMBER : SUCCESS, zIndex: 30, textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>
                {f.text}
              </span>
            ))}

            <div className="flex flex-col items-center">
              <div className="mb-2">
                <BossAvatar kind={mod.boss.kind} accent={mod.accent} state={bossState} size={108} />
              </div>
              <p className="font-mono font-bold text-sm tracking-wide mb-0.5" style={{ color: mod.accent }}>
                {mod.boss.name} {critical && <span style={{ color: DANGER }}>· CRITIQUE</span>}
              </p>
              <div className="w-full max-w-xs mt-1">
                <HPBar value={bossHP} max={100} color={critical ? DANGER : mod.accent} label="INTÉGRITÉ DU BUG" Icon={Skull} flash={bossState === "hit"} />
              </div>
            </div>
          </div>
        </Frame>

        {/* Ada commente */}
        {adaLine && (
          <div className="mb-4">
            <DialogueBubble name="ADA" text={adaLine} accent="#8ECAE6" avatar={<AdaAvatar mood={adaMood} size={44} />} />
          </div>
        )}

        {/* Coach ADA — indice IA (réservé à l'accès complet sur le serveur FSQ) */}
        {(() => {
          const coachLocked = aiSettings.provider === "fsq-server" && !hasPass;
          const hintsLeft = access ? Math.max(0, (access.aiDailyLimit || 0) - (access.aiUsedToday || 0)) : null;
          return (
            <Frame accent="#8ECAE6" className="p-4 mb-4">
              <div style={{ backgroundColor: PANEL }} className="p-4 -m-4 rounded-sm">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="font-mono text-[11px] tracking-widest" style={{ color: TEXT_MUTED }}>⚡ COACH ADA — INDICE TACTIQUE</p>
                  {coachLocked ? (
                    <button onClick={() => openModal(authToken ? "pay" : "account")} className="px-2 py-1 rounded-md font-mono text-[11px] flex items-center gap-1" style={{ backgroundColor: AMBER, color: BG }}>
                      <Unlock size={11} /> Débloquer
                    </button>
                  ) : (
                    <button onClick={askLocalHint} disabled={aiBusy || answered} className="px-2 py-1 rounded-md font-mono text-[11px] disabled:opacity-50" style={{ border: `1px solid ${LINE}`, color: TEXT }}>
                      {aiBusy ? "ADA analyse…" : "Demander un indice"}
                    </button>
                  )}
                </div>
                <p className="text-xs leading-relaxed mb-2" style={{ color: TEXT_MUTED }}>
                  {coachLocked
                    ? "Bloqué face au boss ? ADA analyse l'assaut en cours et te souffle la piste qui débloque — jamais la réponse toute faite. Inclus dans l'accès complet."
                    : "ADA lit l'assaut en cours et te guide vers la solution sans jamais te la donner — tu gardes le mérite du coup final."}
                  {!coachLocked && hasPass && hintsLeft !== null && (
                    <span style={{ color: hintsLeft > 0 ? SUCCESS : DANGER }}> {hintsLeft > 0 ? `${hintsLeft} indice${hintsLeft > 1 ? "s" : ""} restant${hintsLeft > 1 ? "s" : ""} aujourd'hui.` : "Quota du jour épuisé — recharge demain."}</span>
                  )}
                </p>
                {aiError && <p className="text-xs mb-2" style={{ color: DANGER }}>{aiError}</p>}
                {aiHint && (
                  <MarkdownLite
                    text={aiHint}
                    className="text-xs leading-relaxed pr-1"
                    style={{ color: TEXT, maxHeight: 180, overflowY: "auto" }}
                  />
                )}
                {aiHint && !aiBusy && (
                  <button onClick={clearAiHint} className="mt-2 text-[11px] font-mono underline" style={{ color: TEXT_MUTED }}>Effacer l'indice</button>
                )}
              </div>
            </Frame>
          );
        })()}

        {/* progression assauts */}
        <div className="flex items-center justify-between font-mono text-[11px] mb-2" style={{ color: TEXT_MUTED }}>
          <span>ASSAUT {qIdx + 1} / {battleQuestions.length}</span>
          <span style={{ color: AMBER }}>+{runXP} XP</span>
        </div>

        {/* carte question */}
        <Frame accent={mod.accent} className="p-5">
          <div style={{ backgroundColor: PANEL }} className="p-5 -m-5 rounded-sm">
            {/* badge de type */}
            {q.type === "code" && (
              <p className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest mb-2 px-2 py-0.5 rounded" style={{ color: SUCCESS, border: `1px solid ${SUCCESS}55` }}>
                <Terminal size={11} /> PRATIQUE · ÉCRIS LE CODE
              </p>
            )}
            {q.type === "order" && (
              <p className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest mb-2 px-2 py-0.5 rounded" style={{ color: AMBER, border: `1px solid ${AMBER}55` }}>
                <ListOrdered size={11} /> PRATIQUE · ORDONNE LE CODE
              </p>
            )}

            <p className="font-mono text-sm sm:text-base font-semibold mb-4 leading-relaxed">{q.prompt}</p>

            {q.code && (
              <pre className="font-mono text-xs sm:text-sm p-3 rounded-md mb-4 overflow-x-auto whitespace-pre" style={{ backgroundColor: "#081B33", borderLeft: `3px solid ${mod.accent}`, color: "#C9E2F5" }}>
                {q.code}
              </pre>
            )}

            {/* ----- QCM ----- */}
            {(!q.type || q.type === "qcm") && (
              <div className="flex flex-col gap-2">
                {q.options.map((opt, i) => {
                  let bg = PANEL_SOFT, border = LINE, textColor = TEXT;
                  if (answered) {
                    if (i === q.correct) { bg = `${SUCCESS}22`; border = SUCCESS; textColor = SUCCESS; }
                    else if (i === selected) { bg = `${DANGER}22`; border = DANGER; textColor = DANGER; }
                  }
                  return (
                    <button key={i} onClick={() => selectAnswer(i)} disabled={answered}
                      className="text-left font-mono text-xs sm:text-sm px-3 py-2.5 rounded-md border transition-colors flex items-start gap-2 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-default"
                      style={{ backgroundColor: bg, borderColor: border, color: textColor }}>
                      <span className="font-bold shrink-0">{String.fromCharCode(65 + i)}.</span>
                      <span>{opt}</span>
                      {answered && i === q.correct && <Check size={14} className="ml-auto shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ----- DÉFI CODE / REFACTOR ----- */}
            {(q.type === "code" || q.type === "refactor") && (
              <div>
                {q.type === "refactor" && (
                  <div className="mb-3 p-2.5 rounded-md text-xs leading-relaxed" style={{ backgroundColor: `${AMBER}14`, border: `1px solid ${AMBER}55`, color: TEXT }}>
                    <span className="font-mono font-bold" style={{ color: AMBER }}>♻ REFACTOR — </span>
                    ce code fonctionne déjà (les tests passent). Ta mission : le rendre plus propre et lisible <span style={{ color: AMBER }}>sans casser un seul test</span>. Puis fais-le relire par ADA — le verdict « propre » est la vraie victoire.
                  </div>
                )}
                <textarea
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  disabled={answered && review?.verdict !== "a_polir"}
                  spellCheck={false}
                  rows={Math.max(5, (q.starter || "").split("\n").length + 1)}
                  className="w-full font-mono text-xs sm:text-sm p-3 rounded-md resize-y focus:outline-none"
                  style={{ backgroundColor: "#081B33", border: `1px solid ${LINE}`, color: "#C9E2F5", lineHeight: 1.5 }}
                />
                {!answered && (
                  <button onClick={runTests}
                    className="w-full mt-3 py-2.5 rounded-md font-mono font-bold text-sm flex items-center justify-center gap-2"
                    style={{ backgroundColor: SUCCESS, color: "#0B2545" }}>
                    <Play size={15} /> {q.type === "refactor" ? "Vérifier que rien n'est cassé" : "Lancer les tests"} {codeAttempts > 0 && `· essai ${codeAttempts + 1}`}
                  </button>
                )}
                {testResults.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5">
                    {testResults.map((r, i) => (
                      <div key={i} className="font-mono text-[11px] sm:text-xs px-2.5 py-1.5 rounded flex items-start gap-2" style={{ backgroundColor: "#081B33", border: `1px solid ${r.pass ? SUCCESS : DANGER}55` }}>
                        {r.pass ? <CheckCircle2 size={13} className="shrink-0 mt-0.5" style={{ color: SUCCESS }} /> : <XCircle size={13} className="shrink-0 mt-0.5" style={{ color: DANGER }} />}
                        <span style={{ color: "#C9E2F5" }}>{r.call}</span>
                        {!r.pass && (
                          <span className="ml-auto text-right" style={{ color: TEXT_MUTED }}>
                            obtenu {show(r.got)} · attendu {show(r.expect)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Revue de code ADA — les tests sont verts, mais le code est-il propre ? */}
                {answered && success && (
                  <CodeReviewPanel
                    review={review}
                    locked={aiSettings.provider === "fsq-server" && !hasPass}
                    onAsk={() => askCodeReview(q, codeInput)}
                    onUnlock={() => openModal(authToken ? "pay" : "account")}
                    onResubmit={() => resubmitForReview(q, codeInput)}
                  />
                )}
              </div>
            )}

            {/* ----- DÉFI ORDRE ----- */}
            {q.type === "order" && (
              <div>
                <div className="flex flex-col gap-1.5">
                  {orderWork.map((origIdx, pos) => {
                    let border = LINE;
                    if (answered) border = origIdx === pos ? SUCCESS : DANGER;
                    return (
                      <div key={origIdx} className="flex items-stretch gap-2">
                        <pre className="flex-1 font-mono text-xs sm:text-sm px-3 py-2 rounded-md overflow-x-auto whitespace-pre" style={{ backgroundColor: "#081B33", border: `1px solid ${border}`, color: "#C9E2F5" }}>
                          {q.lines[origIdx]}
                        </pre>
                        {!answered && (
                          <div className="flex flex-col gap-1">
                            <button onClick={() => moveLine(pos, -1)} disabled={pos === 0} className="w-7 h-6 rounded flex items-center justify-center disabled:opacity-30" style={{ border: `1px solid ${LINE}`, color: AMBER }}><ArrowUp size={13} /></button>
                            <button onClick={() => moveLine(pos, 1)} disabled={pos === orderWork.length - 1} className="w-7 h-6 rounded flex items-center justify-center disabled:opacity-30" style={{ border: `1px solid ${LINE}`, color: AMBER }}><ArrowDown size={13} /></button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {!answered && (
                  <button onClick={validateOrder}
                    className="w-full mt-3 py-2.5 rounded-md font-mono font-bold text-sm flex items-center justify-center gap-2"
                    style={{ backgroundColor: AMBER, color: "#0B2545" }}>
                    <Check size={15} /> Valider l'ordre
                  </button>
                )}
              </div>
            )}

            {answered && (
              <div className="mt-4 p-3 rounded-md text-xs sm:text-sm leading-relaxed fsq-rise" style={{ backgroundColor: PANEL_SOFT, color: TEXT_MUTED, borderLeft: `3px solid ${success ? SUCCESS : DANGER}` }}>
                <span className="font-mono font-bold" style={{ color: success ? SUCCESS : DANGER }}>
                  {success ? "✓ COUP AU BUT — " : "✗ LE BUG RIPOSTE — "}
                </span>
                {q.explain}
                {q.type === "order" && !success && (
                  <pre className="font-mono text-[11px] mt-2 p-2 rounded overflow-x-auto whitespace-pre" style={{ backgroundColor: "#081B33", color: SUCCESS }}>
                    {q.lines.join("\n")}
                  </pre>
                )}
              </div>
            )}

            {answered && (
              <button onClick={nextQuestion}
                className="w-full mt-4 py-3 rounded-md font-mono font-bold text-sm flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2"
                style={{ backgroundColor: dead ? DANGER : mod.accent, color: "#0B2545" }}>
                {dead ? "Subir la déconnexion" : isLast ? "Porter le coup final" : "Assaut suivant"} <ChevronRight size={16} />
              </button>
            )}
          </div>
        </Frame>
      </div>
    </div>
  );
}

/* --- Résultat : victoire ou défaite ---------------------------------- */
function ResultView({ ctx }) {
  const { activeIdx, lastRun, startModule, backToMap } = ctx;
  const mod = MODULES[activeIdx];
  const r = lastRun || {};
  const passed = !!r.passed;
  const isFinal = mod.id === "boss";
  const hasNext = passed && activeIdx + 1 < MODULES.length;
  const accentCol = passed ? SUCCESS : DANGER;

  return (
    <div className="min-h-screen w-full font-sans flex items-center" style={{ backgroundColor: BG, color: TEXT, background: `radial-gradient(circle at 50% 30%, ${accentCol}18, ${BG} 65%)` }}>
      <div className="max-w-2xl mx-auto px-4 py-10 w-full">
        {/* level up banner */}
        {r.leveledTo && (
          <div className="text-center mb-4 fsq-rise">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold text-sm" style={{ backgroundColor: `${AMBER}22`, border: `1px solid ${AMBER}`, color: AMBER }}>
              <Sparkles size={16} /> NOUVEAU RANG : {r.leveledTo} !
            </span>
          </div>
        )}

        <Frame accent={accentCol} className="p-6 sm:p-8">
          <div style={{ backgroundColor: PANEL }} className="p-6 sm:p-8 -m-6 sm:-m-8 rounded-sm text-center">
            <div className="flex justify-center mb-3 fsq-rise">
              <BossAvatar kind={mod.boss.kind} accent={mod.accent} state={passed ? "defeated" : "idle"} size={120} />
            </div>

            <p className="font-mono text-[11px] tracking-[0.25em] mb-1" style={{ color: accentCol }}>
              {passed ? (isFinal ? "LA STACK EST SAUVÉE" : "SECTEUR PURIFIÉ") : "DÉCONNEXION"}
            </p>
            <h2 className="font-mono font-extrabold text-2xl mb-1" style={{ color: passed ? TEXT : DANGER }}>
              {passed ? `${mod.boss.name} terrassé` : `${mod.boss.name} t'a vaincu`}
            </h2>
            <p className="font-mono text-xs mb-5" style={{ color: TEXT_MUTED }}>{mod.title}</p>

            {/* stats du duel */}
            <div className="grid grid-cols-3 gap-2 mb-5 font-mono">
              <div className="rounded-lg py-2" style={{ backgroundColor: PANEL_SOFT }}>
                <p className="text-[10px] tracking-widest" style={{ color: TEXT_MUTED }}>PRÉCISION</p>
                <p className="text-lg font-bold" style={{ color: accentCol }}>{r.pct ?? 0}%</p>
              </div>
              <div className="rounded-lg py-2" style={{ backgroundColor: PANEL_SOFT }}>
                <p className="text-[10px] tracking-widest" style={{ color: TEXT_MUTED }}>COMBO MAX</p>
                <p className="text-lg font-bold" style={{ color: AMBER }}>×{r.comboMax ?? 0}</p>
              </div>
              <div className="rounded-lg py-2" style={{ backgroundColor: PANEL_SOFT }}>
                <p className="text-[10px] tracking-widest" style={{ color: TEXT_MUTED }}>XP GAGNÉ</p>
                <p className="text-lg font-bold" style={{ color: SUCCESS }}>+{r.xpGain ?? 0}</p>
              </div>
            </div>

            {/* badges débloqués */}
            {r.newBadges && r.newBadges.length > 0 && (
              <div className="mb-5">
                <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: AMBER }}>HAUT FAIT DÉBLOQUÉ</p>
                <div className="flex justify-center gap-4">
                  {r.newBadges.map((id) => <BadgeChip key={id} id={id} earned />)}
                </div>
              </div>
            )}

            {/* lore via Ada */}
            {r.loreUnlocked && (
              <div className="mb-5 text-left">
                <DialogueBubble name="ADA — fragment retrouvé" text={r.loreUnlocked} accent="#8ECAE6" avatar={<AdaAvatar mood="proud" size={48} />} />
              </div>
            )}

            {!passed && (
              <p className="text-xs mb-5 leading-relaxed" style={{ color: TEXT_MUTED }}>
                « {mod.boss.name} » a profité de tes failles. Relis les explications, puis reviens : un Gardien tombe, se relève, et apprend.
              </p>
            )}
            {isFinal && passed && (
              <p className="text-sm mb-5 leading-relaxed" style={{ color: TEXT }}>
                Du langage à l'architecture, tu as tout traversé. La corruption recule. Tu es désormais <strong style={{ color: AMBER }}>Gardien de la Stack</strong>.
              </p>
            )}

            <div className="flex flex-col gap-2">
              {!passed && (
                <button onClick={() => startModule(activeIdx)} className="w-full py-3 rounded-lg font-mono font-bold text-sm flex items-center justify-center gap-2" style={{ backgroundColor: mod.accent, color: "#0B2545" }}>
                  <RotateCcw size={16} /> Reprendre le duel
                </button>
              )}
              {hasNext && (
                <button onClick={() => startModule(activeIdx + 1)} className="w-full py-3 rounded-lg font-mono font-bold text-sm flex items-center justify-center gap-2" style={{ backgroundColor: MODULES[activeIdx + 1].accent, color: "#0B2545" }}>
                  Secteur suivant : {MODULES[activeIdx + 1].boss.name} <ChevronRight size={16} />
                </button>
              )}
              <button onClick={backToMap} className="w-full py-3 rounded-lg font-mono font-bold text-sm" style={{ border: `1px solid ${LINE}`, color: TEXT }}>
                Retour à la carte
              </button>
            </div>
          </div>
        </Frame>
      </div>
    </div>
  );
}

/* ====================================================================== */
/*  COMPOSANT PRINCIPAL — état, logique de combat, routage                */
/* ====================================================================== */
// Exports nommés pour les tests (le harness n'importe que le défaut).
export { MODULES, applyRemoteBank, isUsableRemote, STATIC_BATTLE_QIDS, collectAllQuestions, getBattleQuestions, staticQuestionToBankPayload, ADVANCED_TIER };

export default function FullstackQuest() {
  const [profile, setProfile] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const [view, setView] = useState("map"); // map | intro | battle | result | codex
  const [activeIdx, setActiveIdx] = useState(null);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);

  // combat
  const [runCorrect, setRunCorrect] = useState(0);
  const [runXP, setRunXP] = useState(0);
  const [lives, setLives] = useState(3);
  const [bossHP, setBossHP] = useState(100);
  const [combo, setCombo] = useState(0);
  const [comboMax, setComboMax] = useState(0);
  const [bossState, setBossState] = useState("idle"); // idle | hit | angry | defeated
  const [dead, setDead] = useState(false);
  const [floaters, setFloaters] = useState([]);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(null); // green | red
  const [adaLine, setAdaLine] = useState("");
  const [adaMood, setAdaMood] = useState("idle");

  // défis pratiques
  const [codeInput, setCodeInput] = useState("");
  const [testResults, setTestResults] = useState([]);
  const [codeAttempts, setCodeAttempts] = useState(0);
  const [orderWork, setOrderWork] = useState([]);

  const [lastRun, setLastRun] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importText, setImportText] = useState("");
  const [aiSettings, setAiSettings] = useState(() => {
    if (typeof window === "undefined") return AI_DEFAULT;
    try {
      const raw = window.localStorage.getItem(AI_SETTINGS_KEY);
      return raw ? { ...AI_DEFAULT, ...JSON.parse(raw) } : AI_DEFAULT;
    } catch {
      return AI_DEFAULT;
    }
  });
  const [aiStatus, setAiStatus] = useState("Aucun indice demandé pour l'instant.");
  const [aiReady, setAiReady] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiHint, setAiHint] = useState("");
  const [aiError, setAiError] = useState("");
  // Revue de code post-tests-verts : null tant que rien n'est demandé.
  const [review, setReview] = useState(null); // { busy, verdict, comment, error, rewarded }

  // Compte joueur : JWT + dernier /auth/me connu (accès conservé hors-ligne).
  const [authToken, setAuthToken] = useState(() => {
    if (typeof window === "undefined") return "";
    try { return window.localStorage.getItem(AUTH_TOKEN_KEY) || ""; } catch { return ""; }
  });
  const [authUser, setAuthUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(AUTH_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [syncStatus, setSyncStatus] = useState("");
  const [syncBusy, setSyncBusy] = useState(false);

  // Modales globales (menu ☰, compte, paiement) — au niveau racine pour être
  // ouvrables depuis n'importe quelle vue, y compris en plein duel.
  const [modal, setModal] = useState(null); // null | save | restore | account | pay | support
  const [restoreError, setRestoreError] = useState("");
  const [copied, setCopied] = useState(false);

  // Paiement Mobile Money en cours (checkout + polling)
  const [payPhone, setPayPhone] = useState("");
  const [payBusy, setPayBusy] = useState(false);
  const [payChecking, setPayChecking] = useState(false); // vérification manuelle en cours
  const [payError, setPayError] = useState("");
  const [payment, setPayment] = useState(null); // { paymentId, status, passExpiresAt? }
  const payPollRef = useRef(0);
  const [paymentHistory, setPaymentHistory] = useState([]);

  async function loadPaymentHistory() {
    if (!authToken) return;
    try {
      const res = await apiJson("/api/v1/pay/history", { token: authToken });
      setPaymentHistory(res.payments || []);
    } catch { /* liste best-effort */ }
  }

  // Support joueur (plaintes de paiement, bugs…) — voir aussi la console admin.
  const [supportCategory, setSupportCategory] = useState("paiement");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportPaymentId, setSupportPaymentId] = useState(null);
  const [supportBusy, setSupportBusy] = useState(false);
  const [supportError, setSupportError] = useState("");
  const [supportSent, setSupportSent] = useState(false);
  const [supportTickets, setSupportTickets] = useState([]);

  // Daily Seeded Challenge
  const [dailySeed, setDailySeed] = useState(getTodaysSeed());
  const [dailyRun, setDailyRun] = useState(null);
  const [dailyQIdx, setDailyQIdx] = useState(0);
  const [dailyScore, setDailyScore] = useState(0);
  const [dailyStartMs, setDailyStartMs] = useState(0);

  // Accueil : porte d'entrée affichée à CHAQUE arrivée sur l'app (état de
  // session, non persisté). On n'entre dans le jeu — et donc dans le gate défi —
  // qu'en la quittant volontairement. Profil public : identifiant ciblé par un
  // lien #profile/<id> (consultable sans compte, hors accueil/gate).
  const [entered, setEntered] = useState(false);
  const [profileUserId, setProfileUserId] = useState("");

  // SRS Spaced Repetition
  const [srsSessionItems, setSrsSessionItems] = useState([]);
  const [srsSessionIdx, setSrsSessionIdx] = useState(0);

  // Examen de Qualification (tronc commun -> paliers avancés)
  const [qualRun, setQualRun] = useState(null);
  const [qualQIdx, setQualQIdx] = useState(0);
  const [qualScore, setQualScore] = useState(0);

  // Épreuve Technique (par secteur)
  const [techCodeInput, setTechCodeInput] = useState("");
  const [techResults, setTechResults] = useState([]);

  const floatId = useRef(0);

  SFX.on = soundOn;

  useEffect(() => {
    (async () => {
      let local = null;
      try {
        const res = await window.storage.get(STORAGE_KEY);
        local = res ? { ...FRESH, ...JSON.parse(res.value) } : null;
      } catch {
        local = null;
      }

      let dailyDoneServer = false;
      if (authToken) {
        setSyncStatus("Synchronisation du compte…");
        try {
          const me = await apiJson("/api/v1/auth/me", { token: authToken });
          setAuthUser(me);
          dailyDoneServer = !!me?.access?.dailyDoneToday;
          const remote = await apiJson("/api/v1/me/profile", { token: authToken });
          if (remote?.profile) {
            local = withMigratedSrs(mergeProfiles(local, remote.profile));
            try { await window.storage.set(STORAGE_KEY, JSON.stringify(local)); } catch { /* le cache local est best-effort */ }
            // Renvoie la fusion au serveur : si la session hors-ligne avait de
            // l'avance, le compte doit en hériter, pas seulement cet appareil.
            apiJson("/api/v1/me/profile", { token: authToken, method: "PUT", body: { profile: local } }).catch(() => {});
          }
          setSyncStatus(`Compte synchronisé · ${me.user.displayName}`);
        } catch (e) {
          if (e?.status === 401) {
            setAuthToken("");
            setAuthUser(null);
            setSyncStatus("Session expirée — reconnecte-toi.");
          } else {
            setSyncStatus("Hors ligne — ta progression est gardée sur cet appareil et se synchronisera au retour du réseau.");
          }
        }
      }

      // Défi déjà fait sur un autre appareil (serveur frais) → on le reflète
      // dans l'état daté local, seule source du gate (jamais le cache d'access).
      let base = local || { ...FRESH };
      if (dailyDoneServer) base = markDailyDoneLocally(base);
      setProfile(withMigratedSrs(base));
    })();
  }, []);

  // Banque de questions distante : cache d'abord (offline-first), réseau ensuite.
  const [bankCount, setBankCount] = useState(0);
  const [adminKey, setAdminKey] = useState(() => {
    if (typeof window === "undefined") return "";
    try { return window.localStorage.getItem(ADMIN_KEY_STORAGE) || ""; } catch { return ""; }
  });

  // Rafraîchit la banque depuis le serveur ; réutilisé au montage, après chaque
  // action admin, et quand le compte change (le serveur ne sert les questions
  // des secteurs avancés qu'aux comptes dont le pass est actif).
  async function refreshBank() {
    try {
      const res = await fetch(`${bankApiBase()}/api/v1/questions`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (!Array.isArray(data.questions)) return false;
      setBankCount(applyRemoteBank(data.questions));
      try {
        window.localStorage.setItem(BANK_CACHE_KEY, JSON.stringify({ questions: data.questions, fetchedISO: new Date().toISOString() }));
      } catch { /* stockage plein : la banque restera celle de cette session */ }
      return true;
    } catch { return false; /* hors-ligne : cache ou statique */ }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(BANK_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        setBankCount(applyRemoteBank(cached.questions));
      }
    } catch { /* cache corrompu : on reste sur le statique */ }
    refreshBank();
  }, [authToken]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (adminKey) window.localStorage.setItem(ADMIN_KEY_STORAGE, adminKey);
      else window.localStorage.removeItem(ADMIN_KEY_STORAGE);
    } catch { /* ignore */ }
  }, [adminKey]);

  // La console admin (#admin) et les profils publics (#profile/<id>) n'ont
  // aucun point d'entrée dans le jeu : uniquement le lien direct. Le profil
  // public contourne l'accueil et le gate défi (un recruteur doit pouvoir l'ouvrir).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const applyHash = () => {
      const h = window.location.hash;
      if (h === "#admin") setView("admin");
      else if (h.startsWith("#profile/")) { setProfileUserId(h.slice("#profile/".length)); setView("profile"); }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  function enterGame() { setEntered(true); }

  function openProfile(userId) {
    setProfileUserId(userId);
    if (typeof window !== "undefined") { try { window.location.hash = `#profile/${userId}`; } catch { /* ignore */ } }
    setView("profile");
  }

  function closeProfile() {
    if (typeof window !== "undefined" && window.location.hash.startsWith("#profile/")) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    setProfileUserId("");
    setView("map");
  }

  function exitAdmin() {
    if (typeof window !== "undefined" && window.location.hash === "#admin") {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    setView("map");
  }

  useEffect(() => {
    if (typeof document === "undefined" || document.getElementById("fsq-styles")) return;
    const el = document.createElement("style");
    el.id = "fsq-styles";
    el.textContent = FSQ_CSS;
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(aiSettings));
    } catch {
      /* ignore */
    }
  }, [aiSettings]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (authToken) window.localStorage.setItem(AUTH_TOKEN_KEY, authToken);
      else window.localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch { /* ignore */ }
  }, [authToken]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (authUser) window.localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(authUser));
      else window.localStorage.removeItem(AUTH_CACHE_KEY);
    } catch { /* ignore */ }
  }, [authUser]);

  // Initialise l'état d'un défi pratique quand on arrive dessus
  useEffect(() => {
    if (view !== "battle" || activeIdx == null) return;
    const q = getBattleQuestions(MODULES[activeIdx] || { questions: [] })[qIdx];
    if (!q) return;
    if (q.type === "code" || q.type === "refactor") { setCodeInput(q.starter || ""); setTestResults([]); setCodeAttempts(0); setReview(null); }
    else if (q.type === "order") { setOrderWork(shuffleIndices(q.lines.length)); }
  }, [view, activeIdx, qIdx]);

  async function persist(next) {
    const stamped = { ...next, updatedISO: new Date().toISOString() };
    setProfile(stamped);
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(stamped));
    } catch {
      /* la progression reste en mémoire pour cette session même si la sauvegarde échoue */
    }
    if (authToken) {
      apiJson("/api/v1/me/profile", { token: authToken, method: "PUT", body: { profile: stamped } })
        .then(() => setSyncStatus(authUser ? `Compte synchronisé · ${authUser.user.displayName}` : "Progression synchronisée."))
        .catch(() => setSyncStatus("Synchro impossible pour l'instant — ta progression est gardée sur cet appareil."));
    }
  }

  /* --- Compte joueur --------------------------------------------------- */

  async function refreshMe() {
    if (!authToken) return null;
    try {
      const me = await apiJson("/api/v1/auth/me", { token: authToken });
      setAuthUser(me);
      if (profile && me?.access?.dailyDoneToday) {
        const marked = markDailyDoneLocally(profile);
        if (marked !== profile) persist(marked);
      }
      return me;
    } catch (e) {
      if (e?.status === 401) { setAuthToken(""); setAuthUser(null); }
      return null;
    }
  }

  // mode: "login" | "register". Après connexion, adopte le profil le plus
  // récent des deux côtés (même logique que l'ancien sync).
  async function accountAuth(mode, fields) {
    const path = mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";
    const data = await apiJson(path, { method: "POST", body: fields });
    setAuthToken(data.token);
    setAuthUser({ user: data.user, access: data.access });
    try {
      const remote = await apiJson("/api/v1/me/profile", { token: data.token });
      let merged = withMigratedSrs(mergeProfiles(profile, remote?.profile));
      // S'authentifier vérifie le défi : s'il est déjà fait (ici ou ailleurs),
      // le gate se lève immédiatement via l'état daté local.
      if (data.access?.dailyDoneToday) merged = markDailyDoneLocally(merged);
      setProfile(merged);
      try { await window.storage.set(STORAGE_KEY, JSON.stringify(merged)); } catch { /* best-effort */ }
      await apiJson("/api/v1/me/profile", { token: data.token, method: "PUT", body: { profile: merged } });
      setSyncStatus(`Compte synchronisé · ${data.user.displayName}`);
    } catch { /* la progression locale reste valable hors-ligne */ }
    return data;
  }

  function accountLogout() {
    setAuthToken("");
    setAuthUser(null);
    setSyncStatus("");
  }

  async function accountSyncNow() {
    if (!authToken) return;
    setSyncBusy(true);
    try {
      const remote = await apiJson("/api/v1/me/profile", { token: authToken });
      const merged = withMigratedSrs(mergeProfiles(profile, remote?.profile));
      await persist(merged);
      setSyncStatus("Progression fusionnée avec le compte.");
      await refreshMe();
    } catch {
      setSyncStatus("Synchro impossible pour l'instant — ta progression est gardée sur cet appareil.");
    } finally {
      setSyncBusy(false);
    }
  }

  // Retour de connexion (PWA hors-ligne puis réseau qui revient) : refait la
  // même fusion sans perte, pour que rien de joué hors-ligne ne soit écrasé.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOnline = () => { accountSyncNow(); flushPendingDaily(); };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [authToken, profile]);

  // Au montage et à chaque (re)connexion : tente d'envoyer un défi resté en file.
  useEffect(() => { flushPendingDaily(); }, [authToken]);

  /* --- Paiement du pass (PayMe : checkout puis polling) ------------------ */

  async function startCheckout(tier = "integral") {
    setPayBusy(true);
    setPayError("");
    try {
      const res = await apiJson("/api/v1/pay/checkout", { token: authToken, method: "POST", body: { phone: payPhone, tier } });
      setPayment({ paymentId: res.paymentId, status: res.status });
      const pollId = ++payPollRef.current;
      scheduleNextCheck(res.paymentId, pollId, 0);
    } catch (e) {
      setPayError(friendlyError(e, "La demande n'a pas pu être envoyée. Vérifie le numéro et réessaie."));
    } finally {
      setPayBusy(false);
    }
  }

  // Une seule vérification du statut. Renvoie le statut reçu ("STALE" si un
  // nouveau paiement a pris la main, null en cas de coupure réseau).
  async function checkPaymentOnce(id, pollId) {
    try {
      const res = await apiJson(`/api/v1/pay/${id}`, { token: authToken });
      if (payPollRef.current !== pollId) return "STALE";
      setPayment({ paymentId: id, status: res.status, passExpiresAt: res.passExpiresAt });
      if (res.status === "PAID") {
        try { SFX.victory(); } catch { /* silencieux */ }
        await refreshMe();
        refreshBank(); // les secteurs avancés arrivent avec le pass
      }
      return res.status;
    } catch {
      return null; // réseau : on retentera à la fenêtre suivante
    }
  }

  // Vérifications automatiques espacées : une fenêtre de 10s, puis 20s, puis
  // 30s. Le timer de la fenêtre suivante ne démarre QU'APRÈS la réponse de la
  // précédente (jamais deux appels en vol). Les fenêtres épuisées, on bascule
  // en attente de vérification manuelle (statut TIMEOUT) sans jamais quitter la
  // fenêtre d'attente : l'accès s'activera dès la confirmation.
  function scheduleNextCheck(id, pollId, windowIndex) {
    if (payPollRef.current !== pollId) return;
    if (windowIndex >= PAY_POLL_WINDOWS_MS.length) {
      setPayment((p) => (p && p.paymentId === id ? { ...p, status: "TIMEOUT" } : p));
      return;
    }
    window.setTimeout(async () => {
      if (payPollRef.current !== pollId) return;
      const status = await checkPaymentOnce(id, pollId);
      if (status === "STALE") return;
      if (PAY_FINAL_STATUSES.includes(status)) return;
      scheduleNextCheck(id, pollId, windowIndex + 1);
    }, PAY_POLL_WINDOWS_MS[windowIndex]);
  }

  // Vérification manuelle : contrôle immédiat, puis on réamorce le cycle de
  // fenêtres — le timer repart à la réponse de cette vérification.
  async function recheckPayment() {
    if (!payment || payChecking) return;
    const id = payment.paymentId;
    const pollId = ++payPollRef.current;
    setPayChecking(true);
    setPayment((p) => (p && p.paymentId === id ? { ...p, status: "PROCESSING" } : p));
    const status = await checkPaymentOnce(id, pollId);
    setPayChecking(false);
    if (status === "STALE") return;
    if (PAY_FINAL_STATUSES.includes(status)) return;
    scheduleNextCheck(id, pollId, 0);
  }

  /* --- Support (plaintes de paiement, bugs…) ------------------------------ */

  async function loadSupportTickets() {
    if (!authToken) return;
    try {
      const res = await apiJson("/api/v1/support/tickets", { token: authToken });
      setSupportTickets(res.tickets || []);
    } catch { /* liste best-effort */ }
  }

  function openSupport(category, paymentId) {
    setSupportCategory(category || "paiement");
    setSupportPaymentId(paymentId || null);
    setSupportMessage("");
    setSupportError("");
    setSupportSent(false);
    setModal("support");
    loadSupportTickets();
  }

  async function submitSupportTicket() {
    if (!supportMessage.trim()) return;
    setSupportBusy(true);
    setSupportError("");
    try {
      await apiJson("/api/v1/support/tickets", {
        token: authToken,
        method: "POST",
        body: { category: supportCategory, message: supportMessage.trim(), paymentId: supportPaymentId || undefined },
      });
      setSupportMessage("");
      setSupportSent(true);
      await loadSupportTickets();
    } catch (e) {
      setSupportError(friendlyError(e, "Ton message n'a pas pu être envoyé. Réessaie dans un instant."));
    } finally {
      setSupportBusy(false);
    }
  }

  /* --- Modales globales --------------------------------------------------- */

  function openModal(id) {
    setRestoreError("");
    setCopied(false);
    setPayError("");
    setModal(id);
    if (id === "account") loadPaymentHistory();
  }
  const closeModal = () => setModal(null);

  async function handleRestoreText() {
    const ok = await importProgress();
    if (ok) closeModal();
    else setRestoreError("Sauvegarde invalide — vérifie le contenu collé.");
  }

  async function handleRestoreFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const ok = await importProgress(await file.text());
    if (ok) closeModal();
    else setRestoreError("Sauvegarde invalide — vérifie le fichier choisi.");
  }

  function copySave() {
    navigator.clipboard?.writeText(JSON.stringify(profile, null, 2)).then(
      () => setCopied(true),
      () => setCopied(false)
    );
  }

  if (!profile) return <LoadingScreen />;

  // Pass d'accès : source serveur (/auth/me), avec vérification locale de
  // l'expiration pour que le verrou tienne aussi hors-ligne.
  const access = authUser?.access || null;
  const hasPass = !!(access?.hasPass && access?.passExpiresAt && new Date(access.passExpiresAt).getTime() > Date.now());

  function isUnlocked(idx) {
    if (idx === 0) return true;
    if (!profile.results[MODULES[idx - 1].id]?.passed) return false;
    const mod = MODULES[idx];
    if (ADVANCED_TIER.includes(mod.id) && (!hasPass || !profile.qualification?.passed)) return false;
    return true;
  }

  function setAda(line, mood) { setAdaLine(line); setAdaMood(mood); }

  function addFloater(kind, text) {
    const id = ++floatId.current;
    const x = 16 + Math.random() * 58;
    setFloaters((f) => [...f, { id, kind, text, x }]);
    window.setTimeout(() => setFloaters((f) => f.filter((it) => it.id !== id)), 880);
  }

  function startModule(idx) {
    setActiveIdx(idx);
    setQIdx(0);
    setSelected(null);
    setAnswered(false);
    setRunCorrect(0);
    setRunXP(0);
    setLives(3);
    setBossHP(100);
    setCombo(0);
    setComboMax(0);
    setBossState("idle");
    setDead(false);
    setFloaters([]);
    setShake(false);
    setFlash(null);
    setAda("", "idle");
    setView("intro");
  }

  function startDailyChallenge() {
    const todayRef = getDailyReference();
    if (profile.dailyRuns?.[todayRef]) {
      setAda("Tu as déjà relevé le défi d'aujourd'hui! Reviens demain.", "idle");
      return;
    }
    // Une question tirée d'un secteur réservé au pass devient une carte
    // d'invitation à l'abonnement (non jouable, hors score) — voir DailyView.
    const run = generateDailyRun(dailySeed, MODULES).map((item) => ({
      ...item,
      locked: ADVANCED_TIER.includes(item.moduleId) && !hasPass,
    }));
    setDailyRun(run);
    setDailyQIdx(0);
    setDailyScore(0);
    setDailyStartMs(Date.now());
    setView("daily");
  }

  /* --- Défi Quotidien : envoi serveur (classement) + file offline -------- */
  async function postDaily(payload) {
    try {
      await apiJson("/api/v1/daily/submit", { token: authToken, method: "POST", body: payload });
      return true;
    } catch (e) {
      // 409 = ce n'est plus le défi d'aujourd'hui : inutile de garder en file.
      return e?.status === 409;
    }
  }

  // answers: [{ moduleId, prompt, selected }] pour les questions RÉELLEMENT
  // jouées (hors cartes d'abonnement). On n'envoie jamais de score : le serveur
  // corrige lui-même (voir contentHash / POST /daily/submit). Intégrité du
  // classement : un client ne peut pas s'auto-attribuer un score.
  async function submitDailyResult(ref, answers) {
    if (!authToken) return; // invité : joué localement, hors classement
    const graded = await Promise.all((answers || []).map(async (a) => ({
      hash: await contentHash(a.moduleId, "qcm", a.prompt),
      selected: a.selected,
    })));
    const payload = { reference: ref, answers: graded, durationMs: dailyStartMs ? Date.now() - dailyStartMs : 0 };
    const ok = await postDaily(payload);
    try {
      if (ok) window.localStorage.removeItem(PENDING_DAILY_KEY);
      else window.localStorage.setItem(PENDING_DAILY_KEY, JSON.stringify(payload));
    } catch { /* best-effort */ }
    if (ok) refreshMe();
  }

  // Rejoue un résultat de défi resté en file (soumis hors-ligne).
  async function flushPendingDaily() {
    if (!authToken) return;
    let payload = null;
    try {
      const raw = window.localStorage.getItem(PENDING_DAILY_KEY);
      payload = raw ? JSON.parse(raw) : null;
    } catch { payload = null; }
    if (!payload) return;
    if (payload.reference !== getDailyReference()) {
      try { window.localStorage.removeItem(PENDING_DAILY_KEY); } catch { /* ignore */ }
      return;
    }
    const ok = await postDaily(payload);
    if (ok) { try { window.localStorage.removeItem(PENDING_DAILY_KEY); } catch { /* ignore */ } refreshMe(); }
  }

  function startSrsSession() {
    const allQ = collectAllQuestions(MODULES);
    const byQid = new Map(allQ.map((q) => [q.qid, q]));
    const withQuestions = (dueList) => dueList
      .map((d) => {
        const q = byQid.get(d.qId);
        return q ? { ...d, ...q } : null;
      })
      .filter(Boolean);
    const srsState = profile.srsState || {};
    // Les questions encore inconnues du SRS (nouveaux ajouts statiques ou
    // banque distante) sont enrôlées à chaque lancement, pas seulement au
    // tout premier — la banque grandit en continu désormais.
    const missing = allQ.filter((q) => !srsState[q.qid]);
    let effectiveState = srsState;
    if (missing.length > 0) {
      effectiveState = { ...srsState };
      missing.forEach((q) => { effectiveState[q.qid] = initSrsItem(); });
      persist({ ...profile, srsState: effectiveState });
    }
    const due = getDueItems(effectiveState);
    if (due.length === 0) {
      setAda("Aucune révision à faire pour l'instant. Tu progresses bien!", "proud");
      return;
    }
    setSrsSessionItems(withQuestions(due).slice(0, 20)); // Max 20 due items per session
    setSrsSessionIdx(0);
    setView("srs");
  }

  // Examen de Qualification : condition d'accès aux secteurs avancés + au Chantier.
  function startQualificationExam() {
    const foundationModules = MODULES.filter((m) => FOUNDATION_TIER.includes(m.id));
    const pool = collectAllQuestions(foundationModules).filter(isQcm);
    const seed = Math.floor(Math.random() * 2 ** 31);
    const run = sampleWithRng(pool, Math.min(QUALIFICATION_SIZE, pool.length), seed);
    setQualRun(run);
    setQualQIdx(0);
    setQualScore(0);
    setView("qualification");
  }

  function finishQualificationExam() {
    const total = qualRun?.length || 1;
    const pct = Math.round((qualScore / total) * 100);
    const passed = pct >= QUALIFICATION_PASS_PCT;
    persist({
      ...profile,
      qualification: {
        passed: passed || !!profile.qualification?.passed,
        bestScore: Math.max(profile.qualification?.bestScore || 0, pct),
        attempts: (profile.qualification?.attempts || 0) + 1,
      },
    });
    return { pct, passed };
  }

  // Épreuve Technique : exercice code/débogage d'un secteur, débloqué séparément.
  // Réservée à l'accès complet (certification = valeur payante).
  function startTechnicalTrial(idx) {
    const mod = MODULES[idx];
    if (!hasPass || !mod || !isTechnicalUnlocked(profile, mod)) return;
    setActiveIdx(idx);
    const q = getTechnicalQuestions(mod)[0];
    setTechCodeInput(q?.starter || "");
    setTechResults([]);
    setReview(null);
    setView("technical");
  }

  async function runTechnicalTests() {
    const mod = MODULES[activeIdx];
    const q = getTechnicalQuestions(mod)[0];
    if (!q) return;
    const res = await runCode(techCodeInput, q.tests);
    setTechResults(res);
    const allPass = res.length > 0 && res.every((r) => r.pass);
    if (allPass && !isTechnicalDone(profile, mod)) {
      const nextTechnical = { ...(profile.technical || {}), [mod.id]: { passed: true, completedISO: new Date().toISOString() } };
      const earned = new Set(profile.badges || []);
      const allDone = MODULES.every((m) => nextTechnical[m.id]?.passed);
      if (allDone) earned.add("technical_master");
      persist({ ...profile, xp: profile.xp + 40, badges: [...earned], technical: nextTechnical });
    }
  }

  function engage() {
    setAda("À toi de jouer — vise juste, j'assure tes arrières.", "idle");
    setView("battle");
  }

  // Coup réussi (QCM correct, tests au vert, ordre juste)
  function landHit() {
    const len = getBattleQuestions(MODULES[activeIdx]).length;
    const nc = combo + 1;
    setCombo(nc);
    setComboMax((m) => Math.max(m, nc));
    setRunCorrect((c) => c + 1);
    setBossHP((h) => Math.max(0, h - 100 / len));
    const mult = 1 + (nc - 1) * 0.5;
    const dmg = Math.round((100 / len) * mult);
    addFloater("dmg", `${nc >= 3 ? "CRIT " : ""}-${dmg}`);
    setRunXP((x) => x + 10 + nc * 5);
    setBossState("hit"); window.setTimeout(() => setBossState("idle"), 420);
    setFlash("green"); window.setTimeout(() => setFlash(null), 200);
    setAda(nc >= 3 ? pick(ADA_LINES.combo) : pick(ADA_LINES.correct), nc >= 3 ? "proud" : "happy");
    SFX.correct(nc);
  }

  // Riposte du boss (QCM faux, ordre faux)
  function hurt() {
    setCombo(0);
    const nl = Math.max(0, lives - 1);
    setLives(nl);
    setBossState("angry"); window.setTimeout(() => setBossState("idle"), 520);
    setShake(true); window.setTimeout(() => setShake(false), 420);
    setFlash("red"); window.setTimeout(() => setFlash(null), 260);
    addFloater("hurt", "−1 ♥");
    setAda(nl <= 0 ? "Notre connexion lâche…" : nl === 1 ? pick(ADA_LINES.low) : pick(ADA_LINES.wrong), "worried");
    SFX.wrong();
    if (nl <= 0) setDead(true);
  }

  function selectAnswer(i) {
    if (answered) return;
    const q = getBattleQuestions(MODULES[activeIdx])[qIdx];
    setSelected(i);
    setAnswered(true);
    if (i === q.correct) landHit(); else hurt();
  }

  // Défi CODE / REFACTOR : exécute les tests ; tout au vert = coup porté
  // (itération libre, pas de perte de cœur). En refactor le starter passe déjà :
  // pas de bonus « sans faute » (trivial), la récompense est la revue propre.
  async function runTests() {
    if (answered) return;
    const q = getBattleQuestions(MODULES[activeIdx])[qIdx];
    const res = await runCode(codeInput, q.tests);
    setTestResults(res);
    const allPass = res.length > 0 && res.every((r) => r.pass);
    if (allPass) {
      const firstTry = codeAttempts === 0;
      setSelected(q.type);
      setAnswered(true);
      landHit();
      if (firstTry && q.type === "code") { setRunXP((x) => x + 20); addFloater("dmg", "SANS FAUTE +20"); }
    } else {
      setCodeAttempts((a) => a + 1);
      setAda(q.type === "refactor" ? "Un test a cassé — ton refactor a changé le comportement. Reviens en arrière et retente." : "Presque — un test reste rouge. Ajuste ton code et relance.", "worried");
      SFX.hit();
    }
  }

  // Défi ORDRE : validation unique comme un QCM
  function moveLine(p, dir) {
    if (answered) return;
    setOrderWork((w) => {
      const a = [...w];
      const np = p + dir;
      if (np < 0 || np >= a.length) return a;
      [a[p], a[np]] = [a[np], a[p]];
      return a;
    });
  }
  function validateOrder() {
    if (answered) return;
    setSelected("order");
    setAnswered(true);
    if (orderWork.every((v, idx) => v === idx)) landHit(); else hurt();
  }

  function nextQuestion() {
    if (dead) { finishBattle(false); return; }
    const mod = MODULES[activeIdx];
    if (qIdx + 1 < getBattleQuestions(mod).length) {
      setQIdx((q) => q + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      finishBattle(true);
    }
  }

  function finishBattle(survived) {
    const mod = MODULES[activeIdx];
    const len = getBattleQuestions(mod).length;
    const pct = Math.round((runCorrect / len) * 100);
    const passed = survived;
    const flawless = passed && lives === 3;
    const perfect = passed && pct === 100;

    const earned = new Set(profile.badges || []);
    const newly = [];
    const add = (id) => { if (!earned.has(id)) { earned.add(id); newly.push(id); } };
    if (passed) {
      add("first_blood");
      if (flawless) add("flawless");
      if (comboMax >= 6) add("combo_master");
      if (perfect) add("perfectionist");
      if (mod.id === "boss") add("guardian");
    }

    const prev = profile.results[mod.id] || {};
    const results = {
      ...profile.results,
      [mod.id]: {
        bestScore: Math.max(prev.bestScore || 0, pct),
        passed: passed || prev.passed || false,
        flawless: flawless || prev.flawless || false,
      },
    };
    const completedNow = MODULES.filter((m) => results[m.id]?.passed).length;
    if (passed && completedNow >= Math.ceil(MODULES.length / 2)) add("half_way");

    const lore = [...(profile.lore || [])];
    let loreUnlocked = null;
    if (passed && !lore.includes(mod.id)) { lore.push(mod.id); loreUnlocked = mod.lore; }

    const xpGain = passed ? runXP + (flawless ? 50 : 0) + (perfect ? 50 : 0) : Math.round(runXP * 0.5);
    const oldLabel = getLevelInfo(profile.xp).label;
    const newXP = profile.xp + xpGain;
    const leveledTo = getLevelInfo(newXP).label !== oldLabel ? getLevelInfo(newXP).label : null;
    const bestCombo = Math.max(profile.bestCombo || 0, comboMax);

    persist({ ...profile, xp: newXP, results, badges: [...earned], lore, bestCombo });

    setLastRun({ passed, pct, xpGain, comboMax, livesLeft: lives, flawless, perfect, newBadges: newly, loreUnlocked, leveledTo });
    if (passed) { SFX.victory(); if (leveledTo) window.setTimeout(() => SFX.levelup(), 550); }
    else SFX.defeat();
    setBossState(passed ? "defeated" : "idle");
    setView("result");
  }

  function backToMap() {
    setView("map");
    setActiveIdx(null);
  }

  async function resetProgress() {
    await persist({ ...FRESH });
    setConfirmReset(false);
    setView("map");
  }

  // Coche/décoche un jalon du Chantier. Le XP n'est accordé qu'une seule fois par
  // jalon (via completedISO conservé) pour ne pas pouvoir le farmer en décochant/recochant.
  function toggleMilestone(id) {
    const current = profile.chantier?.milestones || {};
    const prevEntry = current[id] || {};
    const nowDone = !prevEntry.done;
    const firstTimeEver = nowDone && !prevEntry.completedISO;
    const nextMilestones = {
      ...current,
      [id]: { done: nowDone, completedISO: nowDone ? (prevEntry.completedISO || new Date().toISOString()) : (prevEntry.completedISO || null) },
    };

    const earned = new Set(profile.badges || []);
    let xpGain = 0;
    if (firstTimeEver) {
      xpGain += 30;
      const totalDone = CHANTIER.milestones.filter((m) => nextMilestones[m.id]?.done).length;
      if (totalDone === CHANTIER.milestones.length && !earned.has("chantier_done")) {
        earned.add("chantier_done");
        xpGain += 150;
      }
    }

    persist({
      ...profile,
      xp: profile.xp + xpGain,
      badges: [...earned],
      chantier: { milestones: nextMilestones },
    });
  }

  function exportProgress() {
    const payload = JSON.stringify(profile, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fullstack-quest-save.json";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // textOverride : contenu d'un fichier choisi dans la modale Restaurer.
  // Renvoie true/false pour que la modale sache fermer ou afficher l'erreur.
  async function importProgress(textOverride) {
    const text = String(textOverride ?? importText).trim();
    if (!text) return false;
    try {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object") throw new Error("invalid");
      const next = withMigratedSrs({ ...FRESH, ...parsed });
      await persist(next);
      setImportText("");
      setView("map");
      setAda("Sauvegarde restaurée — la Stack se souvient de toi.", "happy");
      return true;
    } catch {
      return false;
    }
  }

  function clearAiHint() {
    setAiHint("");
    setAiError("");
  }

  function buildLocalAIPrompt() {
    const mod = MODULES[activeIdx];
    const q = mod ? getBattleQuestions(mod)[qIdx] : null;
    if (!mod || !q) return "";
    const kind = q.type || "qcm";
    const parts = [
      "Tu es un coach pédagogique ultra concis pour une app de révision.",
      "Tu ne dois jamais donner la réponse brute ni copier-coller la solution complète.",
      "Tu dois donner un indice utile en 1 à 3 phrases, orienté compréhension.",
      `Module: ${mod.title}`,
      `Type d'exercice: ${kind}`,
      `Question: ${q.prompt}`,
    ];
    if (q.code) parts.push(`Code affiché: ${q.code}`);
    if (q.options) parts.push(`Choix possibles: ${q.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join(" | ")}`);
    if (q.starter) parts.push(`Départ du code: ${q.starter}`);
    if (q.lines) parts.push(`Lignes à ordonner: ${q.lines.join(" || ")}`);
    parts.push("Réponds en français, ton direct, sans préambule, sans markdown lourd.");
    return parts.join("\n");
  }

  // Revue de code : disponible une fois les tests verts, une revue par question.
  // Consomme le même quota journalier que les indices (une revue = un indice).
  // Le bonus XP n'existe qu'en duel (mécanique runXP + floaters) ; en Épreuve
  // Technique le verdict est la récompense.
  async function askCodeReview(q, code) {
    if (!q || (q.type !== "code" && q.type !== "refactor")) return;
    setReview((r) => ({ ...(r || {}), busy: true, error: "" }));
    const result = await callAiReview(q, code, aiSettings, authToken);
    if (!result.ok) {
      setReview((r) => ({ ...(r || {}), busy: false, error: result.error }));
      return;
    }
    const firstCleanVerdict = result.verdict === "propre" && !review?.rewarded;
    if (firstCleanVerdict && view === "battle") {
      setRunXP((x) => x + 25);
      addFloater("dmg", "CODE PROPRE +25");
    }
    setReview({
      busy: false,
      verdict: result.verdict,
      comment: result.comment,
      axes: result.axes || [],
      error: "",
      rewarded: review?.rewarded || result.verdict === "propre",
    });
    // Alimente le dossier de compétences (persisté + synchronisé au compte).
    persist(withReviewRecorded(profile, result));
    // Reflète le quota consommé sans attendre le prochain /auth/me.
    if (aiSettings.provider === "fsq-server" && authToken) {
      setAuthUser((u) => (u?.access ? { ...u, access: { ...u.access, aiUsedToday: (u.access.aiUsedToday || 0) + 1 } } : u));
    }
  }

  // Enregistrement d'une revue de Chantier dans le dossier (le composant
  // ChantierView gère l'UI mais la persistance du profil vit ici).
  function recordChantierReview(result) {
    persist(withReviewRecorded(profile, result));
  }

  // Boucle « corrige et resoumets » : re-vérifie les tests avant de redemander
  // une revue — ADA ne relit que du code vert. Le résultat des tests est
  // réaffiché dans la vue d'origine (duel ou épreuve technique).
  async function resubmitForReview(q, code) {
    const res = await runCode(code, q.tests);
    if (view === "battle") setTestResults(res); else setTechResults(res);
    const allPass = res.length > 0 && res.every((r) => r.pass);
    if (!allPass) {
      setReview((r) => ({ ...(r || {}), busy: false, error: "Un test est repassé au rouge — corrige d'abord, ADA ne relit que du code vert." }));
      return;
    }
    await askCodeReview(q, code);
  }

  async function askLocalHint() {
    if (activeIdx == null) return;
    const mod = MODULES[activeIdx];
    const q = mod ? getBattleQuestions(mod)[qIdx] : null;
    if (!q) return;
    setAiBusy(true);
    setAiError("");
    setAiHint("");

    const prompt = buildLocalAIPrompt();
    const result = await callAi(prompt, aiSettings, authToken);
    if (result.ok) {
      setAiHint(result.text);
      setAiReady(true);
      setAiStatus(`Connecté à ${aiSettings.provider} · ${aiSettings.model}`);
      // Reflète le quota consommé sans attendre le prochain /auth/me.
      if (aiSettings.provider === "fsq-server" && authToken) {
        setAuthUser((u) => (u?.access ? { ...u, access: { ...u.access, aiUsedToday: (u.access.aiUsedToday || 0) + 1 } } : u));
      }
    } else {
      setAiReady(false);
      setAiStatus("Serveur local non joignable.");
      setAiError(result.error);
    }
    setAiBusy(false);
  }

  const completedCount = MODULES.filter((m) => profile.results[m.id]?.passed).length;
  const levelInfo = getLevelInfo(profile.xp);

  const badgeCount = (profile.badges || []).length;
  const nextIdx = MODULES.findIndex((m) => !profile.results[m.id]?.passed);
  const adaGreet =
    completedCount === 0
      ? "Bienvenue, Sprite. Je suis ADA, la dernière Gardienne. La Stack est corrompue par les Bugs — ensemble, purifions-la secteur par secteur."
      : completedCount === MODULES.length
      ? "Tu as purifié toute la Stack. Tu n'es plus un simple Sprite : tu es un Gardien. Merci, pour nous tous."
      : `Secteur ${completedCount}/${MODULES.length} purifié. ${MODULES[nextIdx]?.boss.name ?? "Un boss"} rôde dans le prochain duel…`;

  // Parcours adaptatif : la file d'étapes priorisées, recalculée à chaque
  // render depuis le profil courant. Le dispatcher traduit l'action
  // sérialisable d'une étape en navigation concrète.
  const parcours = computeParcours(profile, hasPass);
  function runParcoursAction(action) {
    if (!action) return;
    switch (action.type) {
      case "srs": return startSrsSession();
      case "module": return startModule(action.idx);
      case "technical": return startTechnicalTrial(action.idx);
      case "qualification": return startQualificationExam();
      case "chantier": return setView("chantier");
      case "skills": return setView("skills");
      case "pay": return openModal(authToken ? "pay" : "account");
      default: return;
    }
  }

  // Tout ce dont les vues ont besoin, regroupé en un seul objet.
  const ctx = {
    profile,
    activeIdx, qIdx, selected, answered,
    lives, bossHP, combo, runXP, bossState, dead, floaters, shake, flash, adaLine, adaMood,
    soundOn, setSoundOn, setView, confirmReset, setConfirmReset, codeInput, setCodeInput,
    testResults, codeAttempts, orderWork, lastRun,
    importText, setImportText, exportProgress, importProgress,
    aiSettings, setAiSettings, aiReady, aiStatus,
    aiHint, aiBusy, aiError, askLocalHint, clearAiHint,
    review, askCodeReview, resubmitForReview, recordChantierReview,
    levelInfo, completedCount, badgeCount, nextIdx, adaGreet,
    parcours, runParcoursAction,
    isUnlocked, startModule, engage, backToMap, resetProgress,
    selectAnswer, runTests, moveLine, validateOrder, nextQuestion,
    dailyRun, dailyQIdx, setDailyQIdx, dailyScore, setDailyScore, startDailyChallenge, submitDailyResult,
    srsSessionItems, srsSessionIdx, setSrsSessionIdx, startSrsSession, persist,
    toggleMilestone,
    qualRun, qualQIdx, setQualQIdx, qualScore, setQualScore, startQualificationExam, finishQualificationExam,
    techCodeInput, setTechCodeInput, techResults, startTechnicalTrial, runTechnicalTests,
    authToken, authUser, access, hasPass, accountAuth, accountLogout, accountSyncNow, refreshMe,
    syncStatus, syncBusy,
    modal, openModal, closeModal, restoreError, copied, copySave, handleRestoreText, handleRestoreFile,
    payPhone, setPayPhone, payBusy, payChecking, payError, payment, startCheckout, recheckPayment, paymentHistory,
    supportCategory, setSupportCategory, supportMessage, setSupportMessage, supportPaymentId,
    supportBusy, supportError, supportSent, supportTickets, openSupport, submitSupportTicket,
    adminKey, setAdminKey, refreshBank, bankCount, exitAdmin,
    entered, enterGame, profileUserId, openProfile, closeProfile,
  };

  /* ------------------------------ ROUTAGE ------------------------------ */
  // ModalsHost rend les modales globales (sauvegarde, compte, paiement…)
  // par-dessus la vue courante, quelle qu'elle soit.
  const chrome = <><ModalsHost ctx={ctx} /><InstallPrompt /></>;

  // Profil public et console admin : accès par lien direct, hors accueil/gate.
  if (view === "profile") return <><ProfileView ctx={ctx} />{chrome}</>;
  if (view === "admin") return <>{adminKey ? <AdminView ctx={ctx} /> : <AdminGateView ctx={ctx} />}{chrome}</>;

  // Accueil : porte d'entrée, à chaque arrivée. Le Défi ne s'intercale qu'ensuite,
  // au moment d'entrer dans le jeu — jamais avant l'accueil.
  if (!entered) return <><LandingView ctx={ctx} />{chrome}</>;

  // Gate obligatoire : tant que le Défi du Jour n'est pas fait, il barre l'accès
  // au reste (anti-fuite). Exception : le défi lui-même. Le gate ne lit que
  // l'état daté local (dailyRuns[jour]), alimenté aussi par le serveur (cross-appareil).
  const dailyRef = getDailyReference();
  const dailyDone = !!profile.dailyRuns?.[dailyRef];
  if (!dailyDone && view !== "daily") {
    return <><DailyGateView ctx={ctx} />{chrome}</>;
  }
  if (view === "codex") return <><CodexView ctx={ctx} />{chrome}</>;
  if (view === "intro") return <><IntroView ctx={ctx} />{chrome}</>;
  if (view === "battle") return <><BattleView ctx={ctx} />{chrome}</>;
  if (view === "result") return <><ResultView ctx={ctx} />{chrome}</>;
  if (view === "daily") return <><DailyView ctx={ctx} />{chrome}</>;
  if (view === "srs") return <><SrsView ctx={ctx} />{chrome}</>;
  if (view === "chantier") return <><ChantierView ctx={ctx} />{chrome}</>;
  if (view === "qualification") return <><QualificationView ctx={ctx} />{chrome}</>;
  if (view === "technical") return <><TechnicalView ctx={ctx} />{chrome}</>;
  if (view === "skills") return <><SkillProfileView ctx={ctx} />{chrome}</>;
  if (view === "parcours") return <><ParcoursView ctx={ctx} />{chrome}</>;
  if (view === "leaderboard") return <><LeaderboardView ctx={ctx} />{chrome}</>;
  return <><MapView ctx={ctx} />{chrome}</>;
}


