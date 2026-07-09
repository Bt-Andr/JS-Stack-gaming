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
  Menu, X, Download, Upload, Copy
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
          { call: "dernier([])", expect: undefined }
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
  pitch: "Un vrai petit projet à construire toi-même, dans ton éditeur : une API Express qui stocke des tâches, et un front React qui les affiche et les modifie. FSQ ne peut pas lire ton dépôt — chaque jalon coché est une déclaration sur l'honneur, à toi de vérifier les critères avant de cocher.",
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
  if (r.qtype === "code") return typeof r.starter === "string" && Array.isArray(r.tests) && r.tests.length > 0;
  if (r.qtype === "order") return Array.isArray(r.lines) && r.lines.length >= 2;
  return false;
}

function mapRemoteQuestion(r) {
  const q = { qid: `r-${r.id}`, technical: !!r.technical, prompt: r.prompt };
  if (r.explain) q.explain = r.explain;
  if (r.qtype === "qcm") {
    q.options = r.options; q.correct = r.correct;
    if (r.code) q.code = r.code;
  } else if (r.qtype === "code") {
    q.type = "code"; q.starter = r.starter; q.tests = r.tests;
  } else {
    q.type = "order"; q.lines = r.lines;
  }
  return q;
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
    mod.questions = [...mod.staticQuestions, ...remotes];
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
const SYNC_SETTINGS_KEY = "fullstack-quest-sync-settings";
const SYNC_DEFAULT = { serverUrl: "", account: "", pin: "" };
const ADMIN_KEY_STORAGE = "fullstack-quest-admin-key";

// Le serveur de synchro n'est jamais demandé à l'utilisateur : celui du build,
// sauf override posé dans la console admin.
function withSyncServer(s) {
  return { ...(s || {}), serverUrl: String(s?.serverUrl || ENV_AI_SERVER_URL || "").trim() };
}

function bankApiBase() {
  return (ENV_AI_SERVER_URL || "http://localhost:8000").replace(/\/$/, "");
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
};

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

function generateDailyRun(seed, modules) {
  const r = rng(seed);
  const picked = [];
  for (const mod of modules) {
    const pool = getBattleQuestions(mod);
    const qIdx = Math.floor(r() * pool.length);
    const q = pool[qIdx];
    picked.push({ ...q, moduleId: mod.id, moduleName: mod.title });
  }
  return picked;
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

/* Appel générique à un serveur IA local (Ollama ou compatible OpenAI) — partagé
   entre l'indice de question et l'indice de jalon de Chantier. */
async function callAi(prompt, aiSettings) {
  const endpoint = String(aiSettings.endpoint || "").replace(/\/$/, "");
  try {
    let text = "";
    if (aiSettings.provider === "fsq-server") {
      const res = await fetch(`${endpoint}/api/v1/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(aiSettings.apiKey ? { "X-API-Key": aiSettings.apiKey } : {}),
        },
        body: JSON.stringify({ prompt, max_tokens: 300 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
  } catch (e) {
    return { ok: false, error: `IA locale indisponible: ${String(e?.message || e)}. Lance ton serveur local puis réessaie.` };
  }
}

/* Synchronisation multi-appareils : un blob JSON par compte, via les routes
   /api/v1/profile/{compte} de ton ai-server (relais vers Upstash Redis).
   Pas de vraie authentification : un nom de compte + PIN optionnel suffisent
   pour un usage personnel/partagé, pas pour héberger des données sensibles. */
function isSyncConfigured(syncSettings) {
  return !!(syncSettings?.serverUrl && syncSettings?.account);
}

async function syncProfileGet(syncSettings) {
  const base = String(syncSettings.serverUrl || "").replace(/\/$/, "");
  const res = await fetch(`${base}/api/v1/profile/${encodeURIComponent(syncSettings.account)}`, {
    headers: syncSettings.pin ? { "X-Profile-PIN": syncSettings.pin } : {},
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.detail || `HTTP ${res.status}`);
  return body; // { profile, updatedISO }
}

async function syncProfilePut(syncSettings, profileObj) {
  const base = String(syncSettings.serverUrl || "").replace(/\/$/, "");
  const res = await fetch(`${base}/api/v1/profile/${encodeURIComponent(syncSettings.account)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(syncSettings.pin ? { "X-Profile-PIN": syncSettings.pin } : {}),
    },
    body: JSON.stringify({ profile: profileObj, pin: syncSettings.pin || undefined }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.detail || `HTTP ${res.status}`);
  return body;
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
  const { profile, activeIdx, setView, techCodeInput, setTechCodeInput, techResults, runTechnicalTests } = ctx;
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
          </div>
        </Frame>
      </div>
    </div>
  );
}

/* --- Daily Seeded Challenge ----------------------------------------- */
function DailyView({ ctx }) {
  const { dailyRun, dailyQIdx, setDailyQIdx, dailyScore, setDailyScore, setView, profile, persist } = ctx;
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);

  if (!dailyRun || dailyQIdx >= dailyRun.length) {
    const todayRef = getDailyReference();
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG, color: TEXT }}>
        <div className="text-center px-4">
          <h2 className="text-2xl sm:text-3xl font-mono font-bold mb-4">Défi Quotidien Complété!</h2>
          <div className="mb-6">
            <Frame accent={AMBER} className="inline-block p-4">
              <div style={{ backgroundColor: PANEL }} className="p-4 -m-4 rounded-sm">
                <p className="font-mono text-xs tracking-widest mb-2" style={{ color: TEXT_MUTED }}>SCORE</p>
                <p className="text-xl font-bold" style={{ color: AMBER }}>{dailyScore} / {dailyRun.length}</p>
                <p className="text-xs mt-2" style={{ color: TEXT_MUTED }}>Graine: {getTodaysSeed().toString().slice(0, 8)}</p>
              </div>
            </Frame>
          </div>
          <button onClick={() => setView("map")} className="px-4 py-2 rounded-lg font-mono" style={{ backgroundColor: AMBER, color: BG }}>
            Retour à la Carte
          </button>
        </div>
      </div>
    );
  }

  const q = dailyRun[dailyQIdx];
  function handleAnswer() {
    if (selected === null) return;
    const correct = selected === q.correct;
    if (correct) {
      setDailyScore(s => s + 1);
      SFX.correct(1);
    } else {
      SFX.wrong();
    }
    setAnswered(true);
  }
  function handleNext() {
    const isLast = dailyQIdx + 1 >= dailyRun.length;
    if (isLast) {
      const todayRef = getDailyReference();
      persist({
        ...profile,
        dailyRuns: {
          ...(profile.dailyRuns || {}),
          [todayRef]: { score: dailyScore, total: dailyRun.length, completedISO: new Date().toISOString() },
        },
      });
    }
    setDailyQIdx(i => i + 1);
    setSelected(null);
    setAnswered(false);
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: BG, color: TEXT }}>
      <div className="max-w-xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h3 className="font-mono text-sm font-bold" style={{ color: AMBER }}>DÉFI QUOTIDIEN</h3>
          <span className="font-mono text-xs" style={{ color: TEXT_MUTED }}>{dailyQIdx + 1} / {dailyRun.length}</span>
        </div>
        <div className="mb-4">
          <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: LINE }}>
            <div className="h-full rounded-full" style={{ width: `${((dailyQIdx + 1) / dailyRun.length) * 100}%`, backgroundColor: AMBER, transition: "width 300ms ease" }} />
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
                  {dailyQIdx + 1 < dailyRun.length ? "Suivant →" : "Terminer"}
                </button>
              </>
            )}
          </div>
        </Frame>
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
  const { profile, setView, aiSettings, toggleMilestone } = ctx;
  const [openId, setOpenId] = useState(null);
  const [hints, setHints] = useState({}); // { [milestoneId]: { busy, text, error } }

  const doneCount = CHANTIER.milestones.filter((m) => profile.chantier?.milestones?.[m.id]?.done).length;

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
    const result = await callAi(prompt, aiSettings);
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
                    </div>
                  )}
                </div>
              </Frame>
            );
          })}
        </div>

        <p className="mt-6 text-[11px] font-mono text-center" style={{ color: TEXT_MUTED }}>
          FSQ ne peut pas lire ton dépôt : chaque case cochée est une déclaration sur l'honneur.
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
    syncSettings, setSyncSettings,
  } = ctx;
  const [tab, setTab] = useState("list"); // list | form | settings
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

  const f = (patch) => { setForm((s) => ({ ...s, ...patch })); setSolResults(null); };

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

  const solutionOk = form.qtype !== "code" || (solResults && solResults.length > 0 && solResults.every((r) => r.pass));

  function buildBody() {
    const body = { moduleId: form.moduleId, qtype: form.qtype, technical: form.qtype === "code" ? form.technical : false, prompt: form.prompt, explain: form.explain };
    if (form.qtype === "qcm") {
      body.options = form.options; body.correct = form.correct;
      if (form.code.trim()) body.code = form.code;
    } else if (form.qtype === "code") {
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
          </div>
        </div>

        {error && <p className="text-xs font-mono mb-3 p-2 rounded" style={{ color: DANGER, backgroundColor: `${DANGER}18`, border: `1px solid ${DANGER}55` }}>{error}</p>}
        {notice && <p className="text-xs font-mono mb-3 p-2 rounded" style={{ color: SUCCESS, backgroundColor: `${SUCCESS}18`, border: `1px solid ${SUCCESS}55` }}>{notice}</p>}

        {tab === "list" ? (
          <>
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

            <Frame accent="#8ECAE6" className="p-4">
              <div style={{ backgroundColor: PANEL }} className="p-4 -m-4 rounded-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Cloud size={14} style={{ color: "#8ECAE6" }} />
                  <p className="font-mono text-[11px] tracking-widest" style={{ color: TEXT_MUTED }}>SERVEUR DE SYNCHRO</p>
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: TEXT_MUTED }}>
                  Les joueurs ne voient que compte + PIN — le serveur utilisé est celui du build
                  {ENV_AI_SERVER_URL ? ` (${ENV_AI_SERVER_URL})` : " (aucun défini au build)"}. Renseigne une URL ici pour le forcer sur cet appareil.
                </p>
                <input
                  value={syncSettings.serverUrl}
                  onChange={(e) => setSyncSettings((s) => ({ ...s, serverUrl: e.target.value }))}
                  placeholder="https://mon-ai-service.onrender.com"
                  className="w-full px-2 py-2 rounded-md font-mono text-xs bg-transparent focus:outline-none"
                  style={{ border: `1px solid ${LINE}`, color: TEXT }}
                />
              </div>
            </Frame>

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

              {form.qtype === "code" && (
                <>
                  <label className="flex items-center gap-2 text-xs font-mono" style={{ color: TEXT_MUTED }}>
                    <input type="checkbox" checked={form.technical} onChange={(e) => f({ technical: e.target.checked })} />
                    Épreuve Technique (hors combat normal)
                  </label>
                  <label className="flex flex-col gap-1">{label("CODE DE DÉPART (STARTER)")}
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
              {form.qtype === "code" && !solutionOk && (
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

/* --- Carte du monde : parcours des secteurs -------------------------- */
function MapView({ ctx }) {
  const {
    profile, soundOn, setSoundOn, setView, adaGreet, completedCount, levelInfo,
    badgeCount, isUnlocked, nextIdx, startModule, confirmReset, setConfirmReset, resetProgress,
    importText, setImportText, exportProgress, importProgress,
    startDailyChallenge, startSrsSession, startQualificationExam, startTechnicalTrial,
    syncSettings, setSyncSettings, syncStatus, syncBusy, syncNow, syncServerAvailable,
  } = ctx;
  const qualified = !!profile.qualification?.passed;
  const chantierUnlocked = qualified && completedCount >= Math.ceil(MODULES.length / 2);
  const foundationDone = FOUNDATION_TIER.every((id) => profile.results[id]?.passed);

  // Menu ☰ et modales Sauvegarder / Restaurer / Synchronisation.
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState(null); // null | save | restore | sync
  const [restoreError, setRestoreError] = useState("");
  const [copied, setCopied] = useState(false);

  function openModal(id) {
    setMenuOpen(false);
    setRestoreError("");
    setCopied(false);
    setModal(id);
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
                        { id: "save", Icon: Download, label: "Sauvegarder" },
                        { id: "restore", Icon: Upload, label: "Restaurer" },
                        { id: "sync", Icon: Cloud, label: "Synchronisation" },
                      ].map(({ id, Icon, label }) => (
                        <button key={id} onClick={() => openModal(id)} className="w-full flex items-center gap-2 px-3 py-2 font-mono text-xs text-left hover:opacity-80" style={{ color: TEXT }}>
                          <Icon size={13} style={{ color: TEXT_MUTED }} /> {label}
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

        {/* Daily Challenge & SRS Quick Access */}
        <div className="mt-8 grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={() => ctx.startDailyChallenge?.()}
            className="p-4 rounded-lg text-center transition-colors hover:opacity-80"
            style={{ backgroundColor: `${AMBER}22`, border: `1px solid ${AMBER}` }}
          >
            <p className="font-mono text-xs tracking-widest mb-1" style={{ color: AMBER }}>⭐ DÉFI</p>
            <p className="text-xs" style={{ color: TEXT }}>Graine: {getTodaysSeed().toString().slice(0, 6)}</p>
          </button>
          <button
            onClick={() => ctx.startSrsSession?.()}
            className="p-4 rounded-lg text-center transition-colors hover:opacity-80"
            style={{ backgroundColor: `${SUCCESS}22`, border: `1px solid ${SUCCESS}` }}
          >
            <p className="font-mono text-xs tracking-widest mb-1" style={{ color: SUCCESS }}>🧠 RÉVISIONS</p>
            <p className="text-xs" style={{ color: TEXT }}>Espacé</p>
          </button>
        </div>

        {/* Examen de Qualification : condition d'accès aux secteurs avancés + au Chantier */}
        <button
          onClick={() => foundationDone && startQualificationExam()}
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
                : `Débloqué avec la Qualification + ${Math.ceil(MODULES.length / 2)} secteurs purifiés`}
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
            const blockedByQualification = !unlocked && prevPassed && ADVANCED_TIER.includes(mod.id) && !qualified;
            const techUnlocked = isTechnicalUnlocked(profile, mod);
            const techDone = isTechnicalDone(profile, mod);

            return (
              <div key={mod.id}>
                {idx > 0 && (
                  <div className="ml-8 w-0.5 h-6" style={{ backgroundImage: `repeating-linear-gradient(to bottom, ${unlocked ? mod.accent : LINE} 0, ${unlocked ? mod.accent : LINE} 4px, transparent 4px, transparent 9px)` }} />
                )}
                <button
                  disabled={!unlocked}
                  onClick={() => unlocked && startModule(idx)}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed group"
                  style={{ backgroundColor: unlocked ? PANEL : "transparent", opacity: unlocked ? 1 : 0.5, border: isNext ? `1px solid ${AMBER}` : "1px solid transparent" }}
                >
                  <div className="relative shrink-0 w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: unlocked ? `${mod.accent}18` : PANEL_SOFT, border: `1px solid ${unlocked ? mod.accent : LINE}` }}>
                    {unlocked ? (
                      <BossAvatar kind={mod.boss.kind} accent={mod.accent} state={passed ? "defeated" : "idle"} size={54} />
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
                    <p className="text-[11px] font-mono truncate" style={{ color: unlocked ? mod.accent : TEXT_MUTED }}>
                      {unlocked ? `${mod.boss.name} — ${mod.boss.epithet}` : blockedByQualification ? "Nécessite l'Examen de Qualification" : "Secteur scellé"}
                    </p>
                    <p className="text-[11px] font-mono mt-0.5" style={{ color: passed ? SUCCESS : isNext ? AMBER : TEXT_MUTED }}>
                      {!unlocked ? "Verrouillé" : passed ? `Purifié — record ${best}%${result?.flawless ? " · sans dégât" : ""}` : isNext ? "▶ PROCHAIN DUEL" : best ? `Échec — dernier ${best}%` : "Prêt au combat"}
                    </p>
                  </div>

                  {unlocked && <ChevronRight size={20} className="shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: mod.accent }} />}
                </button>

                {passed && (
                  techDone ? (
                    <div className="ml-[76px] mt-1 flex items-center gap-1.5 font-mono text-[10px]" style={{ color: SUCCESS }}>
                      <Wrench size={11} /> Épreuve Technique certifiée
                    </div>
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

        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(3,12,24,0.78)" }} onClick={closeModal}>
            <div className="w-full max-w-md rounded-xl p-5" style={{ backgroundColor: PANEL, border: `1px solid ${LINE}` }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  {modal === "save" && <Download size={14} style={{ color: AMBER }} />}
                  {modal === "restore" && <Upload size={14} style={{ color: AMBER }} />}
                  {modal === "sync" && <Cloud size={14} style={{ color: "#8ECAE6" }} />}
                  <p className="font-mono text-[11px] tracking-widest" style={{ color: TEXT_MUTED }}>
                    {modal === "save" ? "SAUVEGARDER" : modal === "restore" ? "RESTAURER" : "SYNCHRONISATION"}
                  </p>
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

              {modal === "sync" && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs leading-relaxed mb-1" style={{ color: TEXT_MUTED }}>
                    Retrouve ta progression sur tous tes appareils : choisis un nom de compte et un PIN,
                    puis renseigne les mêmes sur l'autre appareil.
                  </p>
                  {!syncServerAvailable ? (
                    <p className="text-[11px] font-mono p-2 rounded" style={{ color: TEXT_MUTED, border: `1px solid ${LINE}` }}>
                      La synchronisation n'est pas activée sur cette installation.
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex flex-col gap-1 text-[10px] font-mono" style={{ color: TEXT_MUTED }}>
                          Compte
                          <input
                            value={syncSettings.account}
                            onChange={(e) => setSyncSettings((s) => ({ ...s, account: e.target.value }))}
                            placeholder="ex: alice"
                            className="px-2 py-2 rounded-md bg-transparent focus:outline-none"
                            style={{ border: `1px solid ${LINE}`, color: TEXT }}
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-[10px] font-mono" style={{ color: TEXT_MUTED }}>
                          PIN (optionnel)
                          <input
                            type="password"
                            value={syncSettings.pin}
                            onChange={(e) => setSyncSettings((s) => ({ ...s, pin: e.target.value }))}
                            className="px-2 py-2 rounded-md bg-transparent focus:outline-none"
                            style={{ border: `1px solid ${LINE}`, color: TEXT }}
                          />
                        </label>
                      </div>
                      <button
                        onClick={syncNow}
                        disabled={syncBusy || !syncSettings.account}
                        className="px-3 py-2 rounded-lg font-mono text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                        style={{ backgroundColor: AMBER, color: BG }}
                      >
                        <RefreshCw size={14} className={syncBusy ? "animate-spin" : ""} /> {syncBusy ? "Synchro…" : "Synchroniser maintenant"}
                      </button>
                      <p className="text-[11px] font-mono" style={{ color: TEXT_MUTED }}>{syncStatus}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

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
  } = ctx;
  const mod = MODULES[activeIdx];
  const battleQuestions = getBattleQuestions(mod);
  const q = battleQuestions[qIdx];
  const isLast = qIdx === battleQuestions.length - 1;
  const critical = bossHP <= 0.5;
  const success =
    q.type === "code" ? selected === "code"
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

        {/* Coach IA local */}
        <Frame accent="#8ECAE6" className="p-4 mb-4">
          <div style={{ backgroundColor: PANEL }} className="p-4 -m-4 rounded-sm">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="font-mono text-[11px] tracking-widest" style={{ color: TEXT_MUTED }}>COACH IA LOCAL</p>
              <button onClick={askLocalHint} disabled={aiBusy || answered} className="px-2 py-1 rounded-md font-mono text-[11px] disabled:opacity-50" style={{ border: `1px solid ${LINE}`, color: TEXT }}>
                {aiBusy ? "Analyse…" : "Demander un indice"}
              </button>
            </div>
            <p className="text-xs leading-relaxed mb-2" style={{ color: TEXT_MUTED }}>
              Indice progressif, sans donner la solution brute. Le modèle tourne sur ta machine.
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

            {/* ----- DÉFI CODE ----- */}
            {q.type === "code" && (
              <div>
                <textarea
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  disabled={answered}
                  spellCheck={false}
                  rows={Math.max(5, (q.starter || "").split("\n").length + 1)}
                  className="w-full font-mono text-xs sm:text-sm p-3 rounded-md resize-y focus:outline-none"
                  style={{ backgroundColor: "#081B33", border: `1px solid ${LINE}`, color: "#C9E2F5", lineHeight: 1.5 }}
                />
                {!answered && (
                  <button onClick={runTests}
                    className="w-full mt-3 py-2.5 rounded-md font-mono font-bold text-sm flex items-center justify-center gap-2"
                    style={{ backgroundColor: SUCCESS, color: "#0B2545" }}>
                    <Play size={15} /> Lancer les tests {codeAttempts > 0 && `· essai ${codeAttempts + 1}`}
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
export { MODULES, applyRemoteBank, isUsableRemote, STATIC_BATTLE_QIDS, collectAllQuestions, getBattleQuestions };

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
  const [aiStatus, setAiStatus] = useState("En attente d'un serveur local.");
  const [aiReady, setAiReady] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiHint, setAiHint] = useState("");
  const [aiError, setAiError] = useState("");

  const [syncSettings, setSyncSettings] = useState(() => {
    if (typeof window === "undefined") return SYNC_DEFAULT;
    try {
      const raw = window.localStorage.getItem(SYNC_SETTINGS_KEY);
      return raw ? { ...SYNC_DEFAULT, ...JSON.parse(raw) } : SYNC_DEFAULT;
    } catch {
      return SYNC_DEFAULT;
    }
  });
  const [syncStatus, setSyncStatus] = useState("Synchro non configurée.");
  const [syncBusy, setSyncBusy] = useState(false);

  // Daily Seeded Challenge
  const [dailySeed, setDailySeed] = useState(getTodaysSeed());
  const [dailyRun, setDailyRun] = useState(null);
  const [dailyQIdx, setDailyQIdx] = useState(0);
  const [dailyScore, setDailyScore] = useState(0);

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

      const sync = withSyncServer(syncSettings);
      if (isSyncConfigured(sync)) {
        setSyncStatus("Synchronisation…");
        try {
          const remote = await syncProfileGet(sync);
          const localTime = local?.updatedISO ? new Date(local.updatedISO).getTime() : 0;
          const remoteTime = remote?.updatedISO ? new Date(remote.updatedISO).getTime() : 0;
          if (remote?.profile && remoteTime > localTime) {
            local = { ...FRESH, ...remote.profile };
            try { await window.storage.set(STORAGE_KEY, JSON.stringify(local)); } catch { /* le cache local est best-effort */ }
          }
          setSyncStatus(`Synchronisé · compte "${syncSettings.account}"`);
        } catch (e) {
          setSyncStatus(`Sync indisponible: ${String(e?.message || e)}`);
        }
      }

      setProfile(withMigratedSrs(local || { ...FRESH }));
    })();
  }, []);

  // Banque de questions distante : cache d'abord (offline-first), réseau ensuite.
  const [bankCount, setBankCount] = useState(0);
  const [adminKey, setAdminKey] = useState(() => {
    if (typeof window === "undefined") return "";
    try { return window.localStorage.getItem(ADMIN_KEY_STORAGE) || ""; } catch { return ""; }
  });

  // Rafraîchit la banque depuis le serveur ; réutilisé au montage et après
  // chaque action admin, pour voir les changements en jeu immédiatement.
  async function refreshBank() {
    try {
      const res = await fetch(`${bankApiBase()}/api/v1/questions`);
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
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (adminKey) window.localStorage.setItem(ADMIN_KEY_STORAGE, adminKey);
      else window.localStorage.removeItem(ADMIN_KEY_STORAGE);
    } catch { /* ignore */ }
  }, [adminKey]);

  // La console admin n'a aucun point d'entrée dans le jeu : uniquement le lien direct …/#admin.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const applyHash = () => { if (window.location.hash === "#admin") setView("admin"); };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

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
      window.localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(syncSettings));
    } catch {
      /* ignore */
    }
  }, [syncSettings]);

  // Initialise l'état d'un défi pratique quand on arrive dessus
  useEffect(() => {
    if (view !== "battle" || activeIdx == null) return;
    const q = getBattleQuestions(MODULES[activeIdx] || { questions: [] })[qIdx];
    if (!q) return;
    if (q.type === "code") { setCodeInput(q.starter || ""); setTestResults([]); setCodeAttempts(0); }
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
    const sync = withSyncServer(syncSettings);
    if (isSyncConfigured(sync)) {
      syncProfilePut(sync, stamped)
        .then(() => setSyncStatus(`Synchronisé · compte "${sync.account}"`))
        .catch((e) => setSyncStatus(`Échec de synchro: ${String(e?.message || e)}`));
    }
  }

  async function syncNow() {
    const sync = withSyncServer(syncSettings);
    if (!isSyncConfigured(sync)) {
      setSyncStatus("Choisis d'abord un nom de compte.");
      return;
    }
    setSyncBusy(true);
    try {
      const remote = await syncProfileGet(sync);
      const localTime = profile?.updatedISO ? new Date(profile.updatedISO).getTime() : 0;
      const remoteTime = remote?.updatedISO ? new Date(remote.updatedISO).getTime() : 0;
      if (remote?.profile && remoteTime > localTime) {
        await persist(withMigratedSrs({ ...FRESH, ...remote.profile }));
        setSyncStatus(`Version distante plus récente adoptée · compte "${sync.account}"`);
      } else {
        await syncProfilePut(sync, profile);
        setSyncStatus(`Poussé vers le serveur · compte "${sync.account}"`);
      }
    } catch (e) {
      setSyncStatus(`Échec de synchro: ${String(e?.message || e)}`);
    } finally {
      setSyncBusy(false);
    }
  }

  if (!profile) return <LoadingScreen />;

  function isUnlocked(idx) {
    if (idx === 0) return true;
    if (!profile.results[MODULES[idx - 1].id]?.passed) return false;
    const mod = MODULES[idx];
    if (ADVANCED_TIER.includes(mod.id) && !profile.qualification?.passed) return false;
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
    const run = generateDailyRun(dailySeed, MODULES);
    setDailyRun(run);
    setDailyQIdx(0);
    setDailyScore(0);
    setView("daily");
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
    const pool = collectAllQuestions(foundationModules).filter((q) => q.type !== "code" && q.type !== "order");
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
  function startTechnicalTrial(idx) {
    const mod = MODULES[idx];
    if (!mod || !isTechnicalUnlocked(profile, mod)) return;
    setActiveIdx(idx);
    const q = getTechnicalQuestions(mod)[0];
    setTechCodeInput(q?.starter || "");
    setTechResults([]);
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

  // Défi CODE : exécute les tests ; tout au vert = coup porté (itération libre, pas de perte de cœur)
  async function runTests() {
    if (answered) return;
    const q = getBattleQuestions(MODULES[activeIdx])[qIdx];
    const res = await runCode(codeInput, q.tests);
    setTestResults(res);
    const allPass = res.length > 0 && res.every((r) => r.pass);
    if (allPass) {
      const firstTry = codeAttempts === 0;
      setSelected("code");
      setAnswered(true);
      landHit();
      if (firstTry) { setRunXP((x) => x + 20); addFloater("dmg", "PROPRE +20"); }
    } else {
      setCodeAttempts((a) => a + 1);
      setAda("Presque — un test reste rouge. Ajuste ton code et relance.", "worried");
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

  async function askLocalHint() {
    if (activeIdx == null) return;
    const mod = MODULES[activeIdx];
    const q = mod ? getBattleQuestions(mod)[qIdx] : null;
    if (!q) return;
    setAiBusy(true);
    setAiError("");
    setAiHint("");

    const prompt = buildLocalAIPrompt();
    const result = await callAi(prompt, aiSettings);
    if (result.ok) {
      setAiHint(result.text);
      setAiReady(true);
      setAiStatus(`Connecté à ${aiSettings.provider} · ${aiSettings.model}`);
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
    levelInfo, completedCount, badgeCount, nextIdx, adaGreet,
    isUnlocked, startModule, engage, backToMap, resetProgress,
    selectAnswer, runTests, moveLine, validateOrder, nextQuestion,
    dailyRun, dailyQIdx, setDailyQIdx, dailyScore, setDailyScore, startDailyChallenge,
    srsSessionItems, srsSessionIdx, setSrsSessionIdx, startSrsSession, persist,
    toggleMilestone,
    qualRun, qualQIdx, setQualQIdx, qualScore, setQualScore, startQualificationExam, finishQualificationExam,
    techCodeInput, setTechCodeInput, techResults, startTechnicalTrial, runTechnicalTests,
    syncSettings, setSyncSettings, syncStatus, syncBusy, syncNow,
    syncServerAvailable: !!withSyncServer(syncSettings).serverUrl,
    adminKey, setAdminKey, refreshBank, bankCount, exitAdmin,
  };

  /* ------------------------------ ROUTAGE ------------------------------ */
  if (view === "admin") return <>{adminKey ? <AdminView ctx={ctx} /> : <AdminGateView ctx={ctx} />}<InstallPrompt /></>;
  if (view === "codex") return <><CodexView ctx={ctx} /><InstallPrompt /></>;
  if (view === "intro") return <><IntroView ctx={ctx} /><InstallPrompt /></>;
  if (view === "battle") return <><BattleView ctx={ctx} /><InstallPrompt /></>;
  if (view === "result") return <><ResultView ctx={ctx} /><InstallPrompt /></>;
  if (view === "daily") return <><DailyView ctx={ctx} /><InstallPrompt /></>;
  if (view === "srs") return <><SrsView ctx={ctx} /><InstallPrompt /></>;
  if (view === "chantier") return <><ChantierView ctx={ctx} /><InstallPrompt /></>;
  if (view === "qualification") return <><QualificationView ctx={ctx} /><InstallPrompt /></>;
  if (view === "technical") return <><TechnicalView ctx={ctx} /><InstallPrompt /></>;
  return <><MapView ctx={ctx} /><InstallPrompt /></>;
}


