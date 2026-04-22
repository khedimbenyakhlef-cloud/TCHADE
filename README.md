# 🛡️ SAHEL SENTINEL — نظام المراقبة والكشف متعدد المجالات

**Système de Surveillance & Détection Multidomaine**  
**Dédié au Peuple du Tchad & du Sahel**  
**Fondé & Conçu par : KHEDIM BENYAKHLEF dit BENY-JOE**

---

## 📋 Description

SAHEL SENTINEL est une plateforme de commandement et contrôle (C2) multidomaine dédiée à la surveillance sécuritaire du Tchad et de la région du Sahel. Elle permet la détection, le suivi et la génération de rapports pour toutes les menaces sécuritaires :

- 💣 Terrorisme
- 💊 Narcotrafic  
- 👤 Trafic d'êtres humains
- 🔫 Trafic d'armes
- 💰 Blanchiment d'argent
- 🦁 Trafic d'animaux
- 🦠 Épidémies
- ⚖️ Corruption judiciaire
- 📋 Corruption bureaucratique
- 📦 Contrebande
- 🕵️ Activités clandestines
- 💻 Cybermenaces

---

## 🚀 Installation

### Prérequis
- Node.js v18+
- npm v9+

### Étapes

```bash
# 1. Extraire le ZIP
unzip sahel-sentinel.zip
cd sahel-sentinel

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Modifier .env selon votre configuration

# 4. Démarrer le serveur
npm start

# En développement (avec rechargement automatique)
npm run dev
```

Le système sera accessible sur : **http://localhost:3000**

---

## 🗺️ Pages

| URL | Description |
|-----|-------------|
| `/` | Page d'accueil — Vue globale du système |
| `/dashboard` | Centre de Commandement C2 — Opérationnel |

---

## ⚙️ Architecture

```
sahel-sentinel/
├── server.js          # Serveur Node.js principal (Express + Socket.IO)
├── package.json       # Dépendances
├── .env.example       # Configuration environnement
├── public/
│   ├── index.html     # Page d'accueil
│   └── dashboard.html # Centre de commandement C2
├── routes/            # Routes API (extensible)
├── middleware/        # Middleware (auth, logs)
├── config/            # Configuration
└── reports/           # Rapports générés
```

---

## 🔌 APIs Disponibles

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/detections` | GET | Liste des détections |
| `/api/detections` | POST | Créer une détection manuelle |
| `/api/alerts` | GET | Alertes actives |
| `/api/assets` | GET | Actifs opérationnels |
| `/api/threat-zones` | GET | Zones de menace |
| `/api/stats` | GET | Statistiques globales |
| `/api/reports/generate` | POST | Générer un rapport |
| `/api/reports` | GET | Liste des rapports |
| `/api/threat-types` | GET | Types de menaces |

---

## 🌐 Connexion Mode Réel

Pour passer du mode simulation au mode réel :

1. Modifier `.env` : `SIMULATION_MODE=false`
2. Connecter vos APIs :
   - **Satellite** : Ajouter endpoint dans `SATELLITE_API_ENDPOINT`
   - **Drones** : Configurer `DRONE_API_ENDPOINT`
   - **Radar** : Configurer `RADAR_API_ENDPOINT`
   - **INTERPOL** : Ajouter clé `INTERPOL_API_KEY`
3. Dans `server.js`, remplacer `generateSimulatedDetection()` par vos flux réels

---

## 🔄 Temps Réel (WebSocket)

Le système utilise Socket.IO pour la communication en temps réel :

| Événement | Direction | Description |
|-----------|-----------|-------------|
| `init_data` | Serveur→Client | Données initiales au chargement |
| `new_detection` | Serveur→Client | Nouvelle détection |
| `critical_alert` | Serveur→Client | Alerte critique |
| `assets_update` | Serveur→Client | Mise à jour positions actifs |
| `manual_detection` | Client→Serveur | Saisie manuelle d'une détection |
| `toggle_simulation` | Client→Serveur | Activer/désactiver simulation |
| `resolve_alert` | Client→Serveur | Résoudre une alerte |

---

## 📄 Rapports

Le système génère des rapports officiels complets incluant :
- En-tête officiel avec mention du fondateur
- Résumé exécutif
- Recommandations opérationnelles
- Détail cas par cas de chaque détection
- Coordonnées GPS, source, niveau de confiance, priorité

---

## 🛡️ Sécurité

- Helmet.js pour les en-têtes HTTP sécurisés
- JWT pour l'authentification (extensible)
- CORS configuré
- Rate limiting recommandé en production

---

## 📞 Contact & Crédits

**Fondateur & Concepteur :** KHEDIM BENYAKHLEF dit BENY-JOE  
**Dédié au :** Peuple du Tchad & de toute la région du Sahel  
**Mission :** Renforcer la sécurité en zone de risque — Sahel

---

*SAHEL SENTINEL © 2025 — USAGE OFFICIEL UNIQUEMENT*  
*نظام المراقبة والكشف متعدد المجالات — جمهورية تشاد والساحل*
