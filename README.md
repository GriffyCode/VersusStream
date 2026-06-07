<div align="center">
  <h1>⚔️ VersusStream (Twitch Versus)</h1>
  <p>Une application web SaaS interactive permettant à des streamers Twitch de s'affronter lors de duels chronométrés en direct, propulsés par leurs communautés.</p>
</div>

---

## 🎯 Le But du Projet
**VersusStream** a pour objectif de dynamiser les lives Twitch en créant des affrontements en temps réel entre streamers. Les communautés peuvent faire monter le score de leur streamer favori via des interactions directes sur Twitch (Chat, Bits, Subs).

**Règle d'or :** Aucune perte d'audience pour le streamer. L'interaction et le visuel se passent à 100% sur le live Twitch grâce à des widgets OBS ultra-modulaires et fluides. Aucune installation logicielle n'est requise.

---

## ✨ Fonctionnalités

- **🕹️ Matchs en Temps Réel** : Synchronisation parfaite des scores et du temps via WebSockets.
- **🛡️ Système de Points Intelligent** :
  - **Vote Chat (`!duel`)** : +10 points (limité à 1 par spectateur par match).
  - **Bits** : 1 Bit = +1 point (ex: 100 Bits = 100 points).
  - **Abonnements (Subs)** : Tier 1 (+500 pts), Tier 2 (+800 pts), Tier 3 (+2000 pts). Indexé sur les prix réels.
- **🎨 Widgets OBS Modulaires** : Affichages dynamiques inspirés des jeux de combat, 100% web.
- **⚡ Haute Performance** : Utilisation de Redis pour supporter les pics de trafic sans délai.

---

## 🚀 Installation (Développement Local)

### Prérequis
- Node.js (v18+)
- PostgreSQL (Base de données)
- Redis (En local ou via Docker)
- Un compte développeur Twitch (pour les identifiants OAuth et EventSub)

### 1. Configuration du Backend
```bash
cd backend
npm install
```
Copiez le fichier `.env.example` en `.env` et remplissez les informations :
```bash
cp .env.example .env
```
Générez les schémas Prisma et lancez le serveur :
```bash
npx prisma db push
npm run dev
```

### 2. Configuration du Frontend
```bash
cd frontend
npm install
```
Copiez le fichier `.env.example` en `.env.local` et remplissez vos URLs :
```bash
cp .env.example .env.local
```
Lancez le serveur frontend :
```bash
npm run dev
```
L'application sera accessible sur `http://localhost:3000`.

---

## 🎮 Comment utiliser l'application ?

1. **Connexion** : Connectez-vous sur le tableau de bord web avec votre compte Twitch.
2. **Création d'un duel** : Cliquez sur "Créer un Duel", définissez la durée et saisissez le pseudo de votre adversaire.
3. **Invitation** : L'adversaire se connecte sur son tableau de bord et accepte le duel.
4. **Intégration** : Récupérez vos liens de widgets générés et placez-les sur OBS (voir ci-dessous).
5. **C'est parti !** : Cliquez sur "Lancer le Duel", le chrono démarre, et à vous de jouer !

---

## 📺 Intégration sur OBS (Widgets)

L'application génère des URLs de "Source Navigateur" à intégrer directement dans OBS Studio. Les widgets sont transparents et s'animent tout seuls !

### Étapes d'ajout sur OBS :
1. Dans la section **Sources**, cliquez sur le bouton `+`.
2. Choisissez **Source Navigateur** (Browser Source).
3. Nommez-la (ex: "VersusStream Timer").
4. Collez l'**URL du widget** fournie par le tableau de bord.
5. Définissez la résolution (Généralement `1920` en largeur et `150` en hauteur pour le widget complet).
6. Cochez la case *"Actualiser le cache de la page courante"*.

### Les URLs Disponibles
*(Remplacez `[roomId]` par l'ID de votre match)*

- 🔗 **Widget Complet (Recommandé)** : `https://votresite.com/overlay/[roomId]`
  *Affiche la barre de score des deux joueurs, ainsi que le timer au centre. Parfait pour une configuration rapide en 1920x150.*

- 🔗 **Mode Modulaire** *(À venir selon configuration)* : 
  - `/overlay/score-self` : Uniquement votre jauge de score.
  - `/overlay/score-opponent` : Uniquement la jauge de l'adversaire.
  - `/overlay/timer` : Uniquement le chronomètre central.

*À la fin du temps imparti, les barres déclenchent automatiquement une animation lumineuse annonçant le vainqueur !*
