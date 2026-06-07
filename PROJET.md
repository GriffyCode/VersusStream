# CAHIER DES CHARGES : APPLICATION DE DUELS EN TEMPS RÉEL POUR STREAMERS TWITCH ("TWITCH VERSUS")

## 🎯 1. OBJECTIF DU PROJET & PHILOSOPHIE
Créer une application web (SaaS) permettant à deux (ou plusieurs) streamers Twitch de s'affronter lors d'un duel chronométré en direct. Les communautés font monter le score de leur streamer en temps réel via des actions directes sur Twitch (Chat, Bits, Subs).
Règle d'or de l'application : Aucune perte d'audience pour le streamer. L'interaction et le visuel se passent à 100% sur Twitch grâce à un système d'overlays OBS ultra-modulaires inspirés des jeux de combat (Street Fighter, Tekken). L'installation doit être instantanée, sans logiciel à télécharger, via de simples URL de sources navigateurs OBS.

## 🛠️ 2. STACK TECHNIQUE DU PROJET
- **Frontend (Dashboard Streamer & Overlays OBS)** : Next.js ou React, stylisé avec Tailwind CSS (design épuré, dégradés néons, aucune image ou asset lourd, tout est généré par le code).
- **Backend (Moteur de jeu & Temps réel)** : Node.js (TypeScript) avec Express.
- **Gestion du Temps Réel** : WebSockets via Socket.io.
- **Base de Données / Cache** : Redis (impératif pour gérer l'afflux massif de requêtes par seconde, stocker les scores éphémères de manière atomique et vérifier les doublons de votes).
- **Intégration API Twitch** : Twitch OAuth (connexion) et Twitch EventSub (via WebSockets ou Webhooks) pour écouter les événements de chaque chaîne en temps réel.

## 📊 3. SYSTÈME DE POINTS (INDEXÉ SUR LE PRIX RÉEL)
La logique interne du calcul des points est basée de manière stricte sur le ratio : 1 € dépensé par le viewer = 100 points.
- **Le Vote Chat (Commande !duel)** : +10 points
  - Sécurité stricte : Maximum 1 unique vote par utilisateur Twitch et par match. Géré en mémoire via Redis pour une vérification instantanée.
- **Les Bits (Micro-dons)** : 1 Bit = +1 point (Exemple : un Cheer de 100 Bits = +100 points).
- **Abonnement Tier 1 / Sub Prime** : +500 points (Indexé sur le prix réel de 4,99 €).
- **Abonnement Tier 2** : +800 points (Indexé sur le prix réel de 7,99 €).
- **Abonnement Tier 3** : +2000 points (Indexé sur le prix réel de 19,99 €).
- **Abonnements Offerts (Community Gifts)** : Nombre de subs offerts × Points du Tier correspondant (Exemple : 5 Subs T1 offerts d'un coup = +2500 points).

## 🎨 4. ARCHITECTURE DES OVERLAYS (CONCEPT MODULAIRE "FIGHTING GAME")
Plutôt que d'imposer un affichage figé, l'application génère pour chaque salon de duel 4 URL de sources navigateurs OBS indépendantes. Le streamer compose sa scène comme il le souhaite :
- `.../overlay/score-self` (Barre Personnelle) : Une jauge horizontale fluide aux couleurs du streamer (ex: Bleu Néon). Elle se remplit ou se vide proportionnellement à son score.
- `.../overlay/score-opponent` (Barre Adversaire) : Une jauge miroir (remplissage inversé) aux couleurs de l'adversaire (ex: Rose Néon), affichant son score en temps réel.
- `.../overlay/timer` (Le Composant Central) : Un bloc discret affichant le compte à rebours central ($05:00$), l'icône "VS" et les alertes d'état (ex: l'affichage "SPEED BONUS x2").
- `.../overlay/full-bar` (Le Tout-en-un) : Un bandeau horizontal classique unique (1920x150) regroupant les deux barres et le timer pour les streamers voulant une configuration rapide.

**Animations graphiques (100% Code CSS/Tailwind)** :
- Les jauges bougent avec une transition ultra-fluide (`transition-all duration-300 ease-out`).
- À la fin du match ($0:00$), le serveur émet l'événement `MATCH_ENDED`. Tous les composants OBS déclenchent l'animation finale en même temps : la barre du perdant clignote en rouge et subit un effet de transparence (`opacity-40`), tandis que les barres du gagnant s'illuminent avec un effet de brillance néon et un texte "VICTOIRE".

## 🔄 5. WORKFLOW DE L'APPLICATION (USER FLOW)
1. **Connexion** : Le Streamer A se connecte sur la plateforme via Twitch OAuth.
2. **Création** : Sur son Dashboard, il clique sur "Créer un Duel", sélectionne la durée (ex: 5 minutes) et saisit le pseudo Twitch du Streamer B.
3. **Invitation** : Le système génère le salon. Le Streamer B se connecte à son tour sur le site et accepte le duel depuis son tableau de bord.
4. **Intégration OBS** : L'application fournit les liens de widgets correspondants à chacun. Les streamers les intègrent dans OBS.
5. **Lancement** : Le Streamer A clique sur "LANCER LE DUEL". Le serveur Node.js commence à écouter simultanément les API Twitch EventSub des deux chaînes et synchronise le Timer WebSocket.
6. **Verdict** : Le temps s'écoule, le serveur fige les scores, et envoie l'état du gagnant aux overlays pour afficher l'animation de fin.

## 🪜 6. FEUILLE DE ROUTE ÉTAPE PAR ÉTAPE (ROADMAP)
- **🔹 ÉTAPE 1 : Initialisation de l'architecture & Authentification Twitch OAuth**
- **🔹 ÉTAPE 2 : Moteur de Salon (Rooms) et WebSockets (Socket.io)**
- **🔹 ÉTAPE 3 : Connexion à Twitch EventSub & Distribution des Points**
- **🔹 ÉTAPE 4 : Développement des Widgets Écrans OBS (Frontend)**
- **🔹 ÉTAPE 5 : Interface de Contrôle (Dashboard Streamer)**
- **🔹 ÉTAPE 6 : Gestion des Fins de Match, Sécurité & Phase de Recette**
