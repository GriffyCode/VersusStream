# 📖 VersusStream - Documentation Technique Globale

Bienvenue dans la documentation officielle de **VersusStream** (projet *DualBattleTwitch*). 
Ce document, rédigé à l'attention des développeurs, offre une vue d'ensemble de l'architecture, de la stratégie de gestion des données, de la sécurité et des prérequis techniques du projet.

---

### 🏗️ 1. ARCHITECTURE GLOBALE ET SYSTÈME

L'application repose sur un modèle architectural en **"3 écrans"**, conçu pour séparer strictement l'administration, l'affichage et la consultation publique :

1. **Le Dashboard du Streamer (La télécommande d'administration privée)**
   - Il s'agit de l'espace privé, accessible uniquement après authentification via Twitch OAuth2.
   - Construit en React (Next.js), il permet au streamer de configurer le match, de déclarer l'adversaire, de corriger manuellement les scores (+100 / -100) et de gérer le timer (déclenchement du Time Over).
   - Les commandes sont envoyées via des événements WebSocket sécurisés au backend Node.js.

2. **L'Overlay OBS (L'interface visuelle)**
   - Intégrée sur le stream via une source navigateur (Browser Source) dans OBS Studio.
   - C'est un client WebSocket en **lecture seule** (Read-Only) et avec fond transparent. Il écoute passivement les événements du serveur et met à jour l'interface visuelle de manière ultra-réactive.
   - Il affiche en temps réel les scores, le compte à rebours, les logs d'action et les alertes visuelles.

3. **Le Hub Public & Pages de Statistiques**
   - La vitrine du projet accessible aux viewers.
   - Permet de lister les matchs en cours (Active Rooms) récupérés depuis Redis, ainsi que de consulter l'historique complet des matchs terminés persistés dans la base de données relationnelle.

---

### 🔄 2. STRATÉGIE DE RECONCILIATION ET FLUX DE DONNÉES (DATA ARCHITECTURE)

Afin de gérer les pics de charge liés à l'interactivité d'un chat Twitch tout en garantissant un archivage pérenne, le système emploie une **architecture hybride** :

- **Pendant le match (Flux intense - In-Memory avec Redis)**
  - La source de vérité absolue durant un duel est **Redis**. Les scores et le timer peuvent changer plusieurs fois par seconde (notamment via des votes `!duel` depuis le chat Twitch).
  - *Set anti-doublon* : Redis stocke l'ID des votants dans un `Set` (ex: `room:{id}:voters`) afin d'interdire le double vote d'un viewer avec une latence quasi nulle ($O(1)$).
  - *Logs circulaires* : Les actions sont stockées dans une `List` Redis subissant un découpage régulier (`LTRIM`) pour ne conserver que les 50 dernières entrées, optimisant ainsi l'empreinte mémoire.

- **Au coup de sifflet final (Persistance avec PostgreSQL)**
  - Lorsque le **"Time Over"** (00:00) est déclenché depuis le Dashboard, la Room Redis passe au statut "terminé", figeant toutes les interactions.
  - Le pipeline d'archivage s'enclenche : le backend extrait la photographie finale de Redis et réalise un **unique `INSERT` asynchrone** dans PostgreSQL (via Prisma et Supabase).
  - *Garbage Collection* : Une fois le match sauvegardé, le système enclenche un TTL (Time To Live) de 5 minutes sur la Room Redis. Après ce délai, la Room s'autodétruit pour libérer la mémoire vive (RAM).

---

### 🛠️ 3. LE MODÈLE DE DONNÉES (SCHEMA PRISMA)

Le modèle de base de données relationnelle PostgreSQL s'articule autour des entités immuables (historique) et des configurations persistantes des streamers :

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id // Twitch ID
  username    String   @unique
  displayName String
  avatarUrl   String?
  createdAt   DateTime @default(now())
  
  settings    StreamerSettings?
}

model StreamerSettings {
  id             String  @id @default(uuid())
  userId         String  @unique
  user           User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  primaryColor   String  @default("#00f0ff")
  secondaryColor String  @default("#ff007f")
  customLogoUrl  String?
}

model MatchHistory {
  id           String   @id @default(uuid())
  streamerAId  String
  streamerBId  String
  scoreFinalA  Int
  scoreFinalB  Int
  vainqueurId  String
  date         DateTime @default(now())
}
```

**Explications des modèles :**
- **`User`** : Gère l'identité du streamer (reliée directement à l'ID Twitch obtenu via OAuth).
- **`StreamerSettings`** : Relié en `1:1` avec `User`. Contient les personnalisations visuelles (couleurs néons, logo) appliquées sur l'Overlay OBS.
- **`MatchHistory`** : Représente la trace immuable d'un affrontement générée par le pipeline d'archivage post-Time Over. Indépendant, il stocke la conclusion de l'événement et sert aux pages de statistiques.

---

### 🛡️ 4. SÉCURITÉ, ROBUSTESSE ET ANTI-TRICHE

Le système met en place plusieurs barrières pour garantir un déroulement de duel intègre et transparent :

1. **Vérification du propriétaire du salon** : Le gestionnaire WebSocket vérifie systématiquement si la session (`userId`) de l'émetteur d'un événement manuel (ex: correction) correspond à l'ID du propriétaire (`ownerId`) de la Room ciblée.
2. **Règle de conversion mathématique stricte** : Pour chaque vote ou don pris en compte, le backend applique la règle fixe : **1 € = 100 points**. Une sécurité empêche mathématiquement un score d'être inférieur à `0`.
3. **Mécanisme de transparence publique (Anti-Tricherie)** : Si le streamer utilise la télécommande pour injecter ou retirer un score (Correction d'Admin), un événement WebSocket **`ADMIN_CORRECTION`** est émis vers l'Overlay OBS. Un bandeau d'alerte visuel temporaire apparaît à l'écran, signifiant l'action de modération manuelle devant tous les spectateurs. Il n'y a pas de triche invisible possible.
4. **Approche Fail-Fast post Time Over** : À 00:00, la Room passe en statut clôturé. Dès cet instant, le serveur rejette catégoriquement toutes les tentatives de modification (votes en retard, commandes d'ajustement) afin d'assurer l'intégrité du score en route vers l'archivage SQL.

---

### 🔌 5. CONTEXTE DE FONCTIONNEMENT ET VARIABLES D'ENVIRONNEMENT

L'application communique avec plusieurs services externes (Twitch, Supabase, Redis). Il est crucial d'utiliser le **Session Pooler de Supabase** (port 5432) dans l'URL de connexion Prisma pour contourner les potentiels blocages réseaux liés à l'IPv6 sous environnement Windows.

**Exemple de fichier `backend/.env` :**

```env
# Serveur & Clients
PORT=3001
FRONTEND_URL=http://localhost:3000

# Twitch OAuth2 App Credentials
TWITCH_CLIENT_ID=votre_client_id_twitch
TWITCH_CLIENT_SECRET=votre_client_secret_twitch
TWITCH_CALLBACK_URL=http://localhost:3001/api/auth/twitch/callback

# Session
SESSION_SECRET=un_secret_tres_complexe_pour_la_session

# Cache & Temps Réel (Redis)
REDIS_URL=redis://127.0.0.1:6379

# Base de données PostgreSQL (via Supabase Session Pooler pour contournement IPv6 Windows)
DATABASE_URL="postgresql://postgres.[ID]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
```

**Exemple de fichier `frontend/.env.local` :**

```env
# Endpoints de l'API Node.js
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

---
*Fin de la documentation technique.*
