# Déploiement P3 — comptes, pass d'accès et paiement PayMe

Ce que le déploiement de la P3 change : les joueurs jouent gratuitement la
fondation (JS, JS Avancé, Async) ; tout le reste (6 secteurs avancés,
Qualification, Épreuves Techniques, Chantier, coach IA) exige un **pass
d'accès** payé par Mobile Money (PayMe), rattaché à un **compte joueur**.

## 1. Variables d'environnement à ajouter (Render → ai-server)

| Variable | Rôle | Obligatoire |
|---|---|---|
| `AUTH_JWT_SECRET` | Signe les JWT des comptes joueurs. Sans elle : routes compte en 503 et **la banque ne sert que la fondation à tout le monde**. | Oui |
| `PAYMENT_GATEWAY_ENCRYPTION_SECRET` | Chiffre (AES-256-GCM) le mot de passe PayMe et le token de session stockés en base. Ne jamais la changer sans re-saisir le mot de passe PayMe dans l'admin. | Oui pour le paiement |
| `PAYGATE_SANDBOX` | `1` = les checkouts réussissent tout seuls après ~8 s, sans appeler PayMe. Pour tester le flux de bout en bout. **Ne jamais laisser à 1 en production.** | Non |
| `AI_API_KEY` | Clé partagée de la voie admin/tests vers `/generate` et `/review`. Les joueurs n'en ont pas besoin (ils passent par leur compte + pass). Depuis le durcissement *fail-safe* : en mode produit (comptes + base configurés), un appel IA **sans compte à pass actif** est refusé, et cette clé est la seule autre voie — la poser permet à l'admin de tester le coach depuis la console. Sans elle, la voie admin/tests est simplement fermée (les joueurs, eux, fonctionnent). | Recommandée |

Déjà en place : `DATABASE_URL` (Neon — héberge désormais aussi users, passes,
payments, ai_usage), `ADMIN_API_KEY`, `AI_PROVIDER`/clés IA, `AI_ALLOWED_ORIGINS`.

Générer les secrets : `python -c "import secrets; print(secrets.token_urlsafe(48))"` (un par variable).

Le schéma SQL se crée tout seul à la première connexion (comme la banque).

## 2. Mise en route PayMe (console admin → …/#admin → Réglages)

1. Bloc **PAIEMENT — PAYME** : renseigner l'URL de l'API, l'identifiant
   marchand et le mot de passe (les credentials K-Beauty fonctionnent — même
   agrégateur, voir `docs/export-contexte-paiement-payme.md`).
2. « Tester la connexion » → la session doit passer `CONNECTED`.
3. Cocher « Paiement activé pour les joueurs » et enregistrer.
4. Bloc **MONÉTISATION** : prix (défaut 1 500 FCFA), durée (30 j), quota
   d'indices IA/jour (20). Modifiables à chaud, sans redéploiement.

## 3. Le flux de paiement (rappel)

`POST /api/v1/pay/checkout` (compte requis) → push USSD sur le téléphone →
le front poll `GET /api/v1/pay/{id}` toutes les 3 s → à `SUCCESS` le serveur
crée le pass (30 j, cumulable) et le front se rafraîchit. Filet de sécurité :
une boucle de réconciliation re-vérifie toutes les 60 s les transactions en
cours et expire les paiements de plus de 30 min. Aucun statut n'est cru sur
parole côté client : seul le `payment_status` re-vérifié chez PayMe crédite.

## 4. Quota IA et marge

`/api/v1/generate` exige désormais un compte + pass actif + quota journalier
(la clé partagée `AI_API_KEY` reste une porte admin/tests). Entrée plafonnée à
4 000 caractères, sortie à 500 tokens → coût max ≈ 0,3 FCFA/indice (gpt-4o-mini).
Pire cas d'un pass : 20 indices × 30 j ≈ 180 FCFA de coût pour 1 500 FCFA payés.
La consommation réelle (indices + tokens amont) est journalisée par compte
dans `ai_usage`.

## 5. Verrous côté serveur (ce qui rend le paiement incontournable)

- `/api/v1/questions` ne sert les questions des modules avancés qu'avec un
  Bearer de compte au pass actif (`fullAccess: true` dans la réponse).
- `/api/v1/generate` : compte + pass + quota.
- Progression par compte : `GET/PUT /api/v1/me/profile` (remplace le sync
  nom+PIN ; les anciennes routes `/api/v1/profile/{account}` restent pour les
  vieux clients, à retirer plus tard).
- Phase B (durcissement du bundle) — **vérifiée en prod, verrou fonctionnel** :
  l'outil d'import (console admin → onglet Liste → « 📥 Importer les secteurs
  avancés ») verse les 6 secteurs payants dans la banque Neon, idempotent
  (doublons ignorés via content_hash). **Fait et vérifié contre Render** :
  (1) import lancé (53 questions ajoutées, 1 non migrable) ; (2) gating prouvé —
  `GET /api/v1/questions` renvoie 0 des 53 sans pass et les 53 (`fullAccess:true`)
  avec un Bearer à pass actif ; (3) fidélité de rendu prouvée — les 53 passent
  `isUsableRemote` et le round-trip `staticQuestionToBankPayload → banque →
  mapRemoteQuestion` rend chaque question **à l'identique** de sa version bundle.
  - **Dédoublonnage (commit dédié)** : comme l'import a copié les statiques du
    bundle en base, `applyRemoteBank` aurait affiché chaque question avancée EN
    DOUBLE aux joueurs à pass (statique + copie distante). Corrigé : la banque
    fait autorité — une statique dont la banque sert une version (même énoncé)
    est masquée. Conséquence : une **édition admin** d'une question déjà dans le
    bundle prime désormais, et le retrait physique ci-dessous devient un no-op
    comportemental.
  - **Retrait physique du bundle (optionnel, non fait)** : supprimer les
    questions avancées du tableau `MODULES` du fichier source. N'apporte plus que
    « pas lisible via DevTools » (la correction et le gating étant déjà assurés) ;
    par ailleurs le source est déjà dans le dépôt Git et le bundle Vercel, donc
    gain marginal. À faire un jour pour l'hygiène de source, sans urgence.
  Note : 1 question de l'Épreuve TS (`dernier([])`, dont un test attend
  `undefined`) n'est pas migrable telle quelle (JSON ne transporte pas
  `undefined`) — l'outil la signale « non migrable » et la laisse au bundle
  (elle reste servie depuis le bundle, sans doublon puisque absente de la banque).
  Il faudrait réécrire son test (ex. `dernier([]) === undefined` → `true`) pour la migrer.

- Outil support **« 🎁 Offrir un pass »** (console admin → Paiements) : crédite
  manuellement un pass à un compte par email (`POST /api/v1/admin/passes`),
  cumulable comme un achat, tracé `source='admin'`. Sert aux litiges (« payé chez
  PayMe mais rien débloqué »), aux gestes commerciaux/codes promo, et aux tests.

## 6. Vérification après déploiement

```bash
# 1. Compte
curl -s -X POST https://<ai-server>/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.cm","password":"secret1","displayName":"Testeur"}'
# → { token, user, access: { hasPass: false, passPriceXaf: 1500, ... } }

# 2. Gating banque : sans token → uniquement js-fond/js-avance/async
curl -s https://<ai-server>/api/v1/questions | jq '[.questions[].moduleId] | unique'

# 3. Coach IA sans pass → 402
curl -s -X POST https://<ai-server>/api/v1/generate \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"prompt":"test"}'
```

Côté Vercel, rien de nouveau : `VITE_AI_SERVER_URL` suffit (déjà en place).
