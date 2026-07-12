"""Applique les tags `concept` (Phase 5, taxonomie de concepts) aux questions
DEJA PRESENTES dans la banque Neon (prod), en s'appuyant sur la même table de
correspondance que celle utilisée pour tagger le tableau statique MODULES de
fullstack-quest.jsx.

Pourquoi un script à part plutôt qu'une migration serveur : la banque Neon a
été importée depuis MODULES (import admin "IMPORTER TOUS LES SECTEURS") avant
que le champ `concept` existe, donc les questions déjà en base n'ont pas de
tag. Ce script fait le lien : il retrouve chaque question en base par le même
hash de contenu que le serveur (module_id|qtype|prompt normalisé), et lui
applique le concept correspondant via PUT /api/v1/admin/questions/{id}.

Usage :
    ADMIN_API_KEY=... FSQ_API_URL=https://ton-serveur.onrender.com \
        python tag_bank_concepts.py            # dry-run : affiche ce qui serait fait
    ADMIN_API_KEY=... FSQ_API_URL=https://ton-serveur.onrender.com \
        python tag_bank_concepts.py --apply    # applique réellement les tags

Idempotent : une question déjà taguée avec le bon concept est ignorée ; on
peut relancer le script sans risque. N'utilise que la bibliothèque standard
(urllib) — aucune dépendance à installer.
"""

import hashlib
import json
import os
import sys
import urllib.error
import urllib.request

# Evite les caractères accentués mal affichés sur une console Windows en
# cp1252 (le flux reste UTF-8 quoi qu'il arrive côté fichier/réseau).
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")

# Table de correspondance : (moduleId, qtype, prompt EXACT) -> concept.
# Copiée du tagging appliqué au tableau statique MODULES de fullstack-quest.jsx
# (mêmes questions, importées telles quelles dans la banque). qtype par défaut
# "qcm" — seuls code/order sont explicites ci-dessous.
TAGS = [
    # js-fond
    ("js-fond", "qcm", "Quel mot-clé déclare une variable qui ne peut pas être réaffectée ?", "variables"),
    ("js-fond", "qcm", "Que renvoie l'expression typeof null ?", "types"),
    ("js-fond", "qcm", "Que va afficher ce code, dans l'ordre ?", "types"),
    ("js-fond", "qcm", "Quelle est la vraie différence entre == et === ?", "types"),
    ("js-fond", "qcm", "Quelle portée (scope) a une variable déclarée avec let à l'intérieur d'un bloc { } ?", "variables"),
    ("js-fond", "qcm", "Que va afficher ce code ?", "fonctions"),
    ("js-fond", "qcm", "Quel type de fonction n'a pas son propre this (il hérite de celui du contexte englobant) ?", "fonctions"),
    ("js-fond", "qcm", "Quelle méthode de tableau applique une fonction à chaque élément et retourne un NOUVEAU tableau de même longueur ?", "tableaux"),
    ("js-fond", "code", "Écris une fonction somme(a, b) qui renvoie la somme de deux nombres.", "fonctions"),

    # js-avance
    ("js-avance", "qcm", "Que fait l'opérateur spread dans [...arr1, ...arr2] ?", "spread-rest"),
    ("js-avance", "qcm", "Que va afficher console.log(b) ?", "destructuring"),
    ("js-avance", "qcm", "Qu'affiche ce code ?", "closures"),
    ("js-avance", "qcm", "Dans une méthode d'objet, quelle est la valeur de this dans une fonction fléchée définie à l'intérieur ?", "this"),
    ("js-avance", "qcm", "Avec \"type\": \"module\" dans package.json, quel système de modules Node.js utilise-t-il par défaut ?", "modules-es6"),
    ("js-avance", "qcm", "Quelle est la vraie différence entre une copie \"shallow\" (superficielle) et \"deep\" (profonde) d'un objet ?", "spread-rest"),
    ("js-avance", "code", "Écris une fonction pairs(arr) qui renvoie un NOUVEAU tableau avec uniquement les nombres pairs.", "tableaux"),
    ("js-avance", "qcm", "À quoi sert Array.prototype.reduce ?", "reduce"),
    ("js-avance", "qcm", "Que fait l'optional chaining ( ?. ), par exemple dans user?.address?.city ?", "optional-chaining"),

    # async
    ("async", "qcm", "Quelle est la vraie différence entre un callback et une Promise ?", "promises"),
    ("async", "qcm", "Que fait précisément le mot-clé await ?", "async-await"),
    ("async", "qcm", "Dans quel ordre ces nombres s'affichent-ils ?", "event-loop"),
    ("async", "qcm", "Que fait Promise.all([p1, p2, p3]) ?", "promises"),
    ("async", "qcm", "Quelle est la différence entre Promise.all et Promise.allSettled ?", "promises"),
    ("async", "qcm", "Que renvoie fetch(url) par défaut ?", "fetch"),
    ("async", "qcm", "Que se passe-t-il si une Promise est rejetée sans aucun .catch ni try/catch ?", "promises"),
    ("async", "qcm", "Comment exécuter plusieurs appels asynchrones en parallèle plutôt qu'en série ?", "promises"),
    ("async", "order", "Remets dans le bon ordre le corps d'une fonction async qui récupère puis renvoie des données JSON.", "fetch"),
    ("async", "code", "Ce code a un bug : doubleAsync(nums) doit renvoyer une Promise résolue avec les nombres doublés, mais elle renvoie un tableau de Promises non résolues. Corrige-la avec Promise.all.", "promises"),

    # ts
    ("ts", "qcm", "Quel est l'avantage principal de TypeScript par rapport à JavaScript pur ?", "types-ts"),
    ("ts", "qcm", "Comment typer correctement une fonction qui prend un nombre et retourne une chaîne ?", "types-ts"),
    ("ts", "qcm", "Parmi ces affirmations sur interface vs type en TypeScript, laquelle est correcte ?", "interfaces"),
    ("ts", "qcm", "Que permet ce \"generic\" <T> ?", "generiques"),
    ("ts", "qcm", "Que signifie le ? après email dans cette interface ?", "interfaces"),
    ("ts", "qcm", "Comment représente-t-on en TypeScript \"soit une chaîne, soit un nombre\" ?", "types-ts"),
    ("ts", "qcm", "À quoi sert as const ici ?", "types-ts"),
    ("ts", "qcm", "Pourquoi préférer unknown à any quand on reçoit une donnée dont le type n'est pas garanti ?", "types-ts"),

    # react
    ("react", "qcm", "Qu'est-ce qu'un composant React, fondamentalement ?", "composants"),
    ("react", "qcm", "Que fait le hook useState ?", "state"),
    ("react", "qcm", "Quand ce useEffect s'exécute-t-il, avec un tableau de dépendances vide ?", "effets"),
    ("react", "qcm", "Quelle règle s'applique aux props reçues par un composant enfant ?", "props"),
    ("react", "qcm", "Pourquoi utiliser une key unique sur chaque élément d'une liste ?", "composants"),
    ("react", "qcm", "Que fait le hook useMemo ?", "hooks"),
    ("react", "qcm", "Quelle est la différence entre un input \"contrôlé\" et \"non contrôlé\" en React ?", "state"),
    ("react", "qcm", "À quoi sert le Context API de React ?", "props"),
    ("react", "order", "Remets dans l'ordre les lignes d'un composant React à compteur.", "state"),
    ("react", "code", "Ce reducer de compteur a un bug : \"reset\" ne remet pas le compteur à zéro. Corrige counterReducer(state, action).", "hooks"),

    # next
    ("next", "qcm", "Quel est l'avantage principal de Next.js par rapport à une app React \"classique\" (créée avec Vite seul) ?", "ssr-ssg"),
    ("next", "qcm", "Dans l'App Router (dossier app/), comment crée-t-on une nouvelle route /blog ?", "routing"),
    ("next", "qcm", "Quelle est la vraie différence entre un Server Component et un Client Component dans l'App Router ?", "ssr-ssg"),
    ("next", "qcm", "Que permet un fichier route.ts placé dans app/api/utilisateurs/ ?", "api-routes"),
    ("next", "qcm", "Qu'est-ce que le SSG (Static Site Generation) ?", "ssr-ssg"),
    ("next", "qcm", "Comment récupère-t-on des données côté serveur dans un Server Component de l'App Router ?", "ssr-ssg"),
    ("next", "qcm", "Que fait <Link> (next/link) par rapport à une balise <a> classique ?", "routing"),
    ("next", "qcm", "Quel fichier spécial définit une mise en page partagée (header/footer communs) pour un groupe de routes ?", "routing"),
    ("next", "order", "Remets dans l'ordre une route API Next.js (app/api/ping/route.ts) qui répond en JSON.", "api-routes"),
    ("next", "code", "Corrige buildStaticParams(slugs) : pour generateStaticParams (App Router), elle doit renvoyer un tableau d'objets { params: { slug } }, un par slug — pas les slugs bruts.", "routing"),

    # express
    ("express", "qcm", "Qu'est-ce qu'Express, en une phrase ?", "routes-express"),
    ("express", "qcm", "Que fait précisément cette ligne ?", "middlewares"),
    ("express", "qcm", "Dans une API REST, quelle méthode HTTP utilise-t-on typiquement pour créer une nouvelle ressource ?", "rest"),
    ("express", "qcm", "Qu'est-ce qu'un middleware en Express ?", "middlewares"),
    ("express", "qcm", "Quel code de statut HTTP signifie \"ressource créée avec succès\" ?", "rest"),
    ("express", "qcm", "Quelle est la signature typique d'un gestionnaire de route Express ?", "routes-express"),
    ("express", "qcm", "Pourquoi versionne-t-on souvent une API REST (ex : /api/v1/...) ?", "rest"),
    ("express", "qcm", "Quelle est la différence entre req.params, req.query et req.body ?", "routes-express"),
    ("express", "order", "Remets dans l'ordre la mise en place d'un serveur Express minimal. Attention à la place du middleware !", "middlewares"),
    ("express", "code", "Corrige statusCategory(code) : elle classe un code HTTP par famille, mais confond actuellement les erreurs client (4xx) et serveur (5xx).", "rest"),

    # vite
    ("vite", "qcm", "Quel est le rôle principal d'un outil comme Vite ?", "build"),
    ("vite", "qcm", "Pourquoi Vite est-il si rapide en développement, comparé à des bundlers plus anciens en mode dev classique ?", "build"),
    ("vite", "qcm", "Quelle commande crée typiquement le build de production optimisé avec Vite ?", "build"),
    ("vite", "qcm", "Qu'est-ce que le \"tree-shaking\" effectué par les bundlers ?", "build"),
    ("vite", "qcm", "Quel fichier permet de personnaliser la configuration de Vite (plugins, alias, etc.) ?", "build"),
    ("vite", "qcm", "Pourquoi utilise-t-on des variables d'environnement (fichier .env) dans un projet Vite ?", "env-vite"),
    ("vite", "order", "Remets dans l'ordre un fichier vite.config.js minimal avec le plugin React.", "build"),
    ("vite", "code", "Corrige resolveApiUrl(env) : elle doit lire env.VITE_API_URL, et se rabattre sur 'http://localhost:3000' dès que la variable est absente OU vide — pas seulement absente.", "env-vite"),

    # boss
    ("boss", "qcm", "Ton frontend Next.js (localhost:3000) appelle une API Express séparée (localhost:3001) en local. Le navigateur bloque la requête. Quel est le problème et comment le résoudre côté serveur ?", "middlewares"),
    ("boss", "qcm", "Tu veux protéger une route Express pour qu'elle ne soit accessible qu'aux utilisateurs authentifiés. Quelle approche est appropriée ?", "middlewares"),
    ("boss", "qcm", "Dans une app Next.js qui affiche le profil privé d'un utilisateur, où vaut-il mieux récupérer ces données sensibles ?", "ssr-ssg"),
    ("boss", "qcm", "Tu utilises TypeScript à la fois sur ton frontend React et ton backend Express. Quel est l'avantage de partager les types (ex : l'interface User) entre les deux ?", "types-ts"),
    ("boss", "qcm", "Ton build Vite est lent à charger en production et le bundle final est trop lourd. Quelle action est la plus pertinente ?", "build"),
    ("boss", "qcm", "Pour une nouvelle application, comment choisir entre \"monolithe Next.js avec API routes intégrées\" et \"Next.js frontend + Express backend séparé\" ?", "api-routes"),
]


def content_hash(module_id: str, qtype: str, prompt: str) -> str:
    """Même formule que `_content_hash` dans ai-server/main.py."""
    normalized = " ".join(prompt.lower().split())
    return hashlib.sha256(f"{module_id}|{qtype}|{normalized}".encode("utf-8")).hexdigest()


def _request(method: str, url: str, admin_key: str, body: dict = None) -> dict:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Content-Type": "application/json",
        "x-admin-key": admin_key,
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            return json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {url} -> {e.code}: {detail}") from e


def main() -> None:
    apply_changes = "--apply" in sys.argv[1:]
    admin_key = os.getenv("ADMIN_API_KEY", "").strip()
    base_url = os.getenv("FSQ_API_URL", "").strip().rstrip("/")
    if not admin_key or not base_url:
        print("Requis : ADMIN_API_KEY et FSQ_API_URL en variables d'environnement.", file=sys.stderr)
        print("Exemple : ADMIN_API_KEY=xxx FSQ_API_URL=https://ton-serveur.onrender.com python tag_bank_concepts.py", file=sys.stderr)
        sys.exit(1)

    by_hash = {content_hash(m, q, p): c for (m, q, p, c) in TAGS}
    print(f"{len(by_hash)} questions connues dans la table de correspondance.")
    if not apply_changes:
        print("Mode DRY-RUN (aucune écriture) — relance avec --apply pour appliquer réellement.\n")

    questions = _request("GET", f"{base_url}/api/v1/admin/questions", admin_key)["questions"]
    print(f"{len(questions)} questions dans la banque distante.\n")

    matched = updated = already_ok = skipped_no_match = 0
    for row in questions:
        h = content_hash(row["moduleId"], row["qtype"], row["prompt"])
        concept = by_hash.get(h)
        if concept is None:
            skipped_no_match += 1
            continue
        matched += 1
        if row.get("concept") == concept:
            already_ok += 1
            continue
        print(f"  [{row['moduleId']:<10}] {row['prompt'][:60]!r:<63} -> concept={concept!r}")
        if apply_changes:
            body = {
                "moduleId": row["moduleId"],
                "qtype": row["qtype"],
                "technical": row.get("technical", False),
                "prompt": row["prompt"],
                "explain": row.get("explain"),
                "concept": concept,
                "code": row.get("code"),
                "options": row.get("options"),
                "correct": row.get("correct"),
                "starter": row.get("starter"),
                "tests": row.get("tests"),
                "lines": row.get("lines"),
            }
            _request("PUT", f"{base_url}/api/v1/admin/questions/{row['id']}", admin_key, body)
        updated += 1

    print(f"\nRésumé : {matched} question(s) reconnue(s) dans la banque, "
          f"{already_ok} déjà à jour, {updated} {'mise(s) à jour' if apply_changes else 'à mettre à jour (dry-run)'}, "
          f"{skipped_no_match} sans correspondance (bank plus large ou question non taguée localement).")


if __name__ == "__main__":
    main()
