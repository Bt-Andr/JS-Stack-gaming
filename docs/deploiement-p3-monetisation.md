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
- Étape suivante (« phase B », non faite) : sortir du bundle JS les questions
  statiques des secteurs avancés pour que même le contenu embarqué ne soit
  plus accessible sans payer.

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
