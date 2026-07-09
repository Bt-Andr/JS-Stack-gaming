# Export — Contexte de paiement PayMe (réutilisation dans un autre projet)

> Document d'export autonome. Il décrit l'intégration complète de l'agrégateur de paiement
> **PayMe** (mobile money Cameroun, devise XAF) telle qu'implémentée dans K-Beauty, afin de
> pouvoir réutiliser le même agrégateur dans un autre projet sans dépendre de ce dépôt.

---

## 1. Vue d'ensemble

- **Agrégateur** : PayMe — API REST JSON, authentification par login/mot de passe qui retourne un **JWT Bearer**.
- **Modèle d'intégration** : *initiation + polling*. On initie un paiement (push mobile money sur le téléphone du client), puis on interroge le statut jusqu'à un état terminal. Un endpoint webhook interne existe côté K-Beauty mais le mécanisme principal de finalisation est le **polling** (client + cron de réconciliation).
- **Configuration** : stockée **en base de données** (pas en variables d'environnement), modifiable à chaud par un admin via API. Seul le **secret de chiffrement** des credentials est en variable d'environnement.
- **Devise** : XAF. **Téléphone** : format `237XXXXXXXXX` (indicatif Cameroun + 9 chiffres, sans `+`).

## 2. Contrat de l'API PayMe (côté provider)

Base URL configurable (champ `baseUrl` de la config). Tous les appels sont des `POST` JSON
(`Content-Type: application/json`, `Accept: application/json`).

Toutes les réponses suivent une enveloppe commune :

```json
{ "success": true, "message": "...", "data": { ... }, "status": 200 }
```

`success === false` ⇒ requête rejetée par le provider (traiter comme erreur 502 côté backend).

### 2.1 Login — `POST {baseUrl}/api/auth/login`

Requête :
```json
{ "user_name": "<username>", "password": "<password>" }
```
Réponse `data` :
```json
{
  "token": "<JWT>",
  "user": { "id": 123, "name": "...", "user_name": "...", "partner_id": 45, "email": "..." }
}
```
- Le `token` est un **JWT** : on peut décoder `iat`/`exp` (sans vérification de signature) pour connaître sa durée de vie.

### 2.2 Initiation de paiement — `POST {baseUrl}/api/transaction/init_payment`

Header : `Authorization: Bearer <token>`.

Requête :
```json
{
  "amount": 5000,
  "phone": "2376XXXXXXXX",
  "external_reference": "<UUID généré localement>",
  "client_fees_rate": 100
}
```
- `external_reference` : référence locale **unique** (K-Beauty utilise `randomUUID()`), clé d'idempotence/rapprochement.
- `client_fees_rate` : part des frais agrégateur facturée au client (entier, défaut **100** = 100 % des frais à la charge du client).

Réponse `data` :
```json
{ "status": "PAYMENT_IN_PROGRESS", "gateway_reference": "<réf PayMe>", "external_reference": "<réf locale>" }
```
Les trois champs sont obligatoires — sinon considérer la réponse comme invalide (502).

### 2.3 Statut de paiement — `POST {baseUrl}/api/clients/transaction/payment_status`

Header : `Authorization: Bearer <token>`.

Requête :
```json
{ "gateway_reference": "<réf PayMe>" }
```
Réponse `data` :
```json
{ "status": "SUCCESS", "gateway_reference": "<réf>" }
```
(le champ peut aussi s'appeler `reference` selon les cas — accepter les deux).

### 2.4 Mapping des statuts provider → statuts internes

| Statuts PayMe (insensible à la casse) | Statut interne |
|---|---|
| `SUCCESS`, `SUCCESSFUL`, `SUCCEEDED`, `PAID`, `PAYMENT_SUCCESS`, `PAYMENT_COMPLETED` | `SUCCEEDED` |
| `FAILED`, `PAYMENT_FAILED`, `ERROR` | `FAILED` |
| `EXPIRED`, `PAYMENT_EXPIRED` | `EXPIRED` |
| `CANCELLED`, `CANCELED` | `CANCELLED` |
| `PAYMENT_IN_PROGRESS`, `PENDING`, `INITIATED`, `PROCESSING` | `PROCESSING` |
| autre | `UNKNOWN` |

États terminaux : `SUCCEEDED`, `FAILED`, `EXPIRED`, `CANCELLED` (on fige `finalizedAt` et on arrête le polling).

### 2.5 Gestion d'erreurs HTTP côté client PayMe

- Réseau injoignable ⇒ `PAYMENT_PROVIDER_UNREACHABLE` (502).
- HTTP non-2xx ⇒ `PAYMENT_PROVIDER_HTTP_ERROR` (502), message repris du body si présent.
- Enveloppe `success: false` ⇒ `PAYMENT_PROVIDER_REJECTED_REQUEST` (502).
- Body non-objet ou champs attendus absents ⇒ `PAYMENT_PROVIDER_INVALID_RESPONSE` (502).
- ⚠️ Le `fetch` actuel n'a **pas de timeout** explicite — à ajouter dans le nouveau projet (`AbortSignal.timeout(...)`).

## 3. Gestion de session (token PayMe)

- **Login paresseux** : avant chaque appel provider, on récupère un token valide (`getValidPaymeToken`).
  - Session réutilisée si `lastLoginStatus = CONNECTED` **et** `tokenExpiresAt - now > 5 min` (marge de rafraîchissement `TOKEN_REFRESH_MARGIN_MS`).
  - Sinon re-login avec les credentials déchiffrés, puis persistance de la nouvelle session.
- Le token est stocké **chiffré** en base ; `iat`/`exp` extraits par `jwt.decode` (lib `jsonwebtoken`).
- Statuts de session : `CONNECTED` / `DISCONNECTED` / `ERROR` (+ `lastLoginError`).
- Endpoints admin pour forcer la connexion, lire ou **surcharger manuellement** le token (utile si PayMe fournit un token hors-bande).

## 4. Modèle de données (Prisma / PostgreSQL)

Trois tables dédiées à l'agrégateur + la table `payments` métier. Enums :

```prisma
enum PaymentGatewayProvider { PAYME }
enum PaymentGatewaySessionStatus { CONNECTED DISCONNECTED ERROR }
enum PaymentGatewayTransactionStatus {
  INITIATION_PENDING PROCESSING SUCCEEDED FAILED EXPIRED CANCELLED UNKNOWN
}
```

### `payment_gateway_configs` (une ligne par provider, `provider` unique)
| Champ | Rôle |
|---|---|
| `baseUrl` | URL de l'API PayMe |
| `username` | identifiant marchand |
| `passwordEncrypted` | mot de passe chiffré AES-256-GCM |
| `clientFeesRate` (int, défaut 100) | frais refacturés au client, transmis à chaque initiation |
| `isActive` (bool, défaut false) | interrupteur global ; si inactif ⇒ 503 `PAYMENT_PROVIDER_NOT_CONFIGURED` |

### `payment_gateway_sessions` (1–1 avec la config)
`accessTokenEncrypted`, `authenticatedUserId`, `authenticatedUserName`, `partnerId`,
`tokenIssuedAt`, `tokenExpiresAt`, `lastLoginAt`, `lastLoginStatus`, `lastLoginError`, `rawLoginResponse` (Json).

### `payment_gateway_transactions` (journal d'audit complet, 1 ligne par tentative)
`provider`, `configId`, `bookingId`, `paymentId`, **`localReference` (unique)**, **`gatewayReference` (unique, nullable)**,
`customerPhone`, `amount` Decimal(12,2), `currency` (défaut XAF), `clientFeesRate`, `providerStatus` (statut brut),
`status` (statut interne), `initiationRequestedAt`, `initiationSucceededAt`, `lastPolledAt`, `finalizedAt`,
`failureReason`, `rawInitiatePayload` / `rawInitiateResponse` / `rawStatusResponse` (Json — payloads bruts conservés pour l'audit).

### `payments` (métier, découplée de l'agrégateur)
`bookingId`, `amount`, `currency`, `paymentMethod` (ex. `"PAYME"`), `providerTransactionRef`
(= `gatewayReference`), `status` (`PENDING|PAID|FAILED|EXPIRED|REFUNDED`), `paidAt`, `expiresAt`.

> Principe clé : la table métier `payments` ne connaît de PayMe que `paymentMethod` et
> `providerTransactionRef`. Tout le détail provider vit dans `payment_gateway_transactions`.
> C'est ce découplage qui rend l'agrégateur portable.

## 5. Sécurité — chiffrement des secrets

Fichier : `backend/src/common/security/encryption.ts`.

- **AES-256-GCM**, IV 12 octets aléatoire, clé = `SHA-256(PAYMENT_GATEWAY_ENCRYPTION_SECRET)`.
- Format stocké : `base64(iv).base64(authTag).base64(ciphertext)`.
- **Variable d'environnement requise** : `PAYMENT_GATEWAY_ENCRYPTION_SECRET` (seule dépendance env de tout le module).
- Sont chiffrés : le mot de passe PayMe et le token de session. Les réponses admin ne renvoient que des valeurs **masquées**.

## 6. Normalisation du téléphone (Cameroun)

Fichier : `backend/src/common/phone/cameroon-phone.ts`.

- Supprime tout ce qui n'est pas chiffre, retire les préfixes `237` répétés et le `0` initial.
- Exige exactement **9 chiffres** locaux, sinon 400 `INVALID_CUSTOMER_PHONE`.
- Renvoie `237` + 9 chiffres — c'est ce format qui est envoyé à PayMe dans `phone`.

## 7. Flux métier complet (checkout)

1. **Initiation** (`POST /api/v1/bookings/:id/payment/initiate`, rôle CLIENT, body `{ paymentMethod: "PAYME", customerPhone? }`) :
   - garde-fous : réservation payable (`PAYMENT_PENDING` ou retry après `PAYMENT_FAILED`), fenêtre de paiement ouverte (deadline 15 ou 30 min selon proximité du créneau), pas de paiement déjà `PAID`/`REFUNDED` ;
   - normalisation du téléphone ; calcul du montant (config plateforme + éventuel crédit plateforme déduit — si le crédit couvre tout, PayMe n'est **pas** appelé) ;
   - création/mise à jour du `Payment` en `PENDING` (transaction DB), puis appel PayMe `init_payment` avec un `localReference = randomUUID()` ;
   - la ligne `payment_gateway_transactions` est créée **avant** l'appel provider (`INITIATION_PENDING`), puis mise à jour avec la réponse (ou `FAILED` + `failureReason`) ;
   - `payments.providerTransactionRef` ← `gatewayReference`.
2. **Le client paie sur son téléphone** (push USSD mobile money déclenché par PayMe).
3. **Finalisation**, trois chemins complémentaires :
   - **Polling client** : le front poll `GET /bookings/:id/payment` (~3 s, backoff) jusqu'à statut ≠ pending ;
   - **Confirmation manuelle** : `POST /bookings/:id/payment/confirm` `{ providerTransactionRef }` — le backend re-vérifie le statut auprès de PayMe (jamais de confiance dans le client) et vérifie que la transaction provider correspond bien au paiement attendu ;
   - **Cron de réconciliation** (voir §8) : rattrape les transactions restées en cours.
4. **Effet du succès** (`applyGatewayOutcome`) : `Payment` → `PAID`, réservation → validation offreur (ou confirmation auto), création du payout + crédit wallet réservé, notifications/emails. *(Spécifique K-Beauty — à remplacer par la logique métier du nouveau projet.)*
5. **Échec / expiration** : `Payment` → `FAILED`/`EXPIRED`, retry possible qui recalcule une nouvelle deadline et vérifie que le créneau est toujours disponible.

## 8. Jobs d'arrière-plan (réconciliation)

Fichier : `backend/src/jobs/background-jobs.ts` — exécutés au démarrage puis **toutes les 60 s** :

- `expire-due-payments` : passe en `EXPIRED` les paiements dont la deadline est dépassée ;
- `reconcile-pending-gateway-transactions` : liste les transactions gateway non terminales avec `gatewayReference`, re-poll PayMe et applique le résultat métier (résumé `scanned/reconciled/skipped/failed`, erreurs loggées sans interrompre la boucle).

C'est le filet de sécurité indispensable dans un modèle sans webhook fiable : **à reproduire dans le nouveau projet**.

## 9. Endpoints REST exposés par le backend

### Côté client (authentifié)
| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/v1/bookings/:id/payment` | état du paiement (cible du polling front) |
| POST | `/api/v1/bookings/:id/payment/initiate` | initie le paiement PayMe |
| POST | `/api/v1/bookings/:id/payment/confirm` | déclaration « j'ai payé » → vérification serveur |
| GET | `/api/v1/bookings/:id/payment/receipt.pdf` | reçu PDF |
| POST | `/api/v1/payments/webhook` | notification de paiement (usage interne) |

### Côté admin (rôle ADMIN)
| Méthode | Route | Rôle |
|---|---|---|
| GET / PATCH | `/api/v1/admin/payment-gateway/payme` | lire / modifier la config (baseUrl, username, password, clientFeesRate, isActive) |
| POST | `/api/v1/admin/payment-gateway/payme/connect` | forcer un login PayMe |
| GET / PATCH | `/api/v1/admin/payment-gateway/payme/token` | lire / surcharger le token de session |
| GET | `/api/v1/admin/payment-gateway/payme/transactions` | lister les transactions (filtres statut/booking/références, pagination) |
| GET | `/api/v1/admin/payment-gateway/payme/transactions/:id` | détail d'une transaction |
| POST | `/api/v1/admin/payment-gateway/payme/transactions/:id/poll` | re-poll manuel + application du résultat métier |

### Côté front (référence d'usage)
- Web : `web_client_refonte/kbeauty-africa-web/src/lib/api/payments.api.ts` (`getState` / `initiate` / `confirm` / `downloadReceipt`).
- Mobile : `mobile/src/lib/api/payments.ts` (mêmes endpoints).

## 10. Fichiers à copier dans le nouveau projet

**Cœur portable (quasi aucune dépendance métier) :**
- `backend/src/modules/payments/client/payme.client.ts` — client HTTP PayMe pur (seule dépendance : une classe `ApiError(status, code, message, details?)`).
- `backend/src/modules/payments/service/payment-gateway.service.ts` — config, session/token, initiation, polling, endpoints admin (dépend du repository + encryption + `jsonwebtoken`).
- `backend/src/modules/payments/repository/payment-gateway.repository.ts` — accès Prisma aux 3 tables gateway.
- `backend/src/common/security/encryption.ts` — chiffrement AES-256-GCM.
- `backend/src/common/phone/cameroon-phone.ts` — normalisation téléphone.
- `backend/src/modules/payments/{controller,dto,validator}/payment-gateway.*` — endpoints admin.
- Schéma Prisma : les 3 enums + 3 modèles du §4.

**À adapter (couplé au métier K-Beauty, à réécrire pour le nouveau domaine) :**
- `backend/src/modules/payments/service/payment.service.ts` — orchestration réservation/paiement (deadlines, crédits plateforme, payout, wallet, notifications, reçu PDF). À reprendre comme **modèle de flux**, pas à copier tel quel.

**Dépendances npm** : `jsonwebtoken` (décodage `exp` du token), `@prisma/client` (ou tout autre stockage équivalent). Le client PayMe utilise le `fetch` natif de Node ≥ 18.

## 11. Checklist de mise en route dans le nouveau projet

1. Définir `PAYMENT_GATEWAY_ENCRYPTION_SECRET` (secret fort, ne jamais le faire tourner sans re-chiffrer les valeurs existantes).
2. Migrer les 3 tables + enums (§4).
3. Copier le cœur portable (§10), brancher `ApiError`, le routeur HTTP et l'auth admin locaux.
4. Configurer le provider via `PATCH /admin/payment-gateway/payme` : `baseUrl`, `username`, `password`, `clientFeesRate`, puis `isActive: true`.
5. Tester la connexion : `POST /admin/payment-gateway/payme/connect` (vérifier `lastLoginStatus: CONNECTED` et `tokenExpiresAt`).
6. Implémenter le flux métier : génération d'un `localReference` unique, appel `initiatePaymePayment`, puis polling (`pollPaymePaymentStatus`) + application du résultat au domaine métier.
7. Mettre en place le **cron de réconciliation 60 s** (§8) + l'expiration des paiements en attente.
8. Ajouter un timeout sur les appels `fetch` du client PayMe (amélioration recommandée, absente de l'implémentation actuelle).
9. Ne jamais faire confiance au front pour le statut : toute confirmation repasse par `payment_status` côté serveur.

---

*Généré le 2026-07-09 à partir du code de `backend/src/modules/payments/` (K-Beauty). Second exemple d'usage du même agrégateur dans ce repo : `backend/src/modules/featured-subscriptions/` (abonnements mis en avant payés via la même gateway — champ `FeaturedSubscriptionPayment.configId`).*
