# ⚡ EnergieSI

### Étude comparative de la consommation énergétique des systèmes informatiques
**Ordinateurs fixes · ordinateurs portables · environnements virtualisés**

> Projet d'initiation à la recherche. Une application **full-stack TypeScript** qui **mesure**, **enregistre**, **analyse** et **valide automatiquement** des hypothèses sur la consommation électrique des ordinateurs.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)

---

## 📑 Sommaire
1. [À quoi sert ce projet ?](#-1--à-quoi-sert-ce-projet-)
2. [Problématique et hypothèses](#-2--problématique-et-hypothèses)
3. [Concepts clés](#-3--concepts-clés)
4. [Ce que fait l'application](#-4--ce-que-fait-lapplication)
5. [Architecture](#-5--architecture)
6. [La mesure de l'énergie (le point fort)](#-6--la-mesure-de-lénergie-le-point-fort)
7. [Installation et lancement](#-7--installation-et-lancement)
8. [🧪 Scénario de test complet](#-8--scénario-de-test-complet)
9. [Résultats et validation des hypothèses](#-9--résultats-et-validation-des-hypothèses)
10. [Structure du projet](#-10--structure-du-projet)
11. [Documentation](#-11--documentation)

---

## 🎯 1 — À quoi sert ce projet ?

L'usage du numérique augmente fortement la **consommation électrique** des équipements informatiques, avec des enjeux **environnementaux** et **économiques**. Par ailleurs, la **virtualisation** (machines virtuelles) est partout (cloud, data centers, laboratoires), mais son coût énergétique réel est mal connu.

Ce projet répond à une question simple :

> **Quel type de machine et quel usage consomment le plus d'énergie ?**

Pour y répondre, j'ai développé un **outil de mesure et d'analyse** qui :
- lit en direct la **consommation réelle** (Watts), le **CPU**, la **RAM** et la **température** ;
- exécute des **scénarios** (repos, navigation web, vidéo, charge CPU…) ;
- enregistre tout dans une **base de données** ;
- calcule des **statistiques** et **valide automatiquement** 3 hypothèses ;
- affiche le tout dans un **tableau de bord web** + exporte en **PDF/Excel/CSV**.

---

## 🔬 2 — Problématique et hypothèses

**Problématique :** quel est l'impact du **type d'équipement** (fixe vs portable) et de la **virtualisation** sur la consommation énergétique ?

| Hypothèse | Énoncé | Vérifiée par l'app |
|:--:|---|:--:|
| **H1** | Un portable consomme **moins** qu'un fixe | ✅ |
| **H2** | Une machine virtuelle **augmente** la consommation de l'hôte | ✅ |
| **H3** | La consommation **augmente** avec le nombre de VM | ✅ |

L'application calcule les moyennes, applique un **test statistique** et écrit elle-même la **conclusion** (confirmée / rejetée).

---

## 📚 3 — Concepts clés

| Terme | Définition simple |
|---|---|
| **Puissance (W)** | Énergie consommée à un instant T (comme la vitesse). |
| **Énergie (Wh)** | Puissance × durée (comme la distance). `1 Wh = 3600 J`. |
| **Efficacité énergétique** | Travail utile pour chaque watt consommé. |
| **Virtualisation / hyperviseur** | Faire tourner un OS « invité » dans une fenêtre (VirtualBox, VMware). |
| **Machine virtuelle (VM)** | Ordinateur simulé avec ses ressources (vCPU, RAM, disque). |
| **Charge CPU (%)** | Niveau d'occupation du processeur — principal facteur de consommation. |
| **Modèle de puissance** | `P = P_repos + (P_max − P_repos) × charge_CPU` |

---

## 🧩 4 — Ce que fait l'application

- 📡 **Collecte temps réel** : CPU, RAM, température, puissance (1 mesure/seconde).
- 🧪 **9 scénarios** : 4 matériels (repos, web, vidéo, charge CPU) + 5 virtualisation (VM repos/web/CPU, plusieurs VM, VirtualBox vs VMware).
- 💾 **Stockage** : base SQLite (5 tables).
- 📊 **Analyse** : moyenne, médiane, écart-type, variance, corrélation, test t.
- ✅ **Validation auto** des hypothèses H1, H2, H3 avec conclusions rédigées.
- 📈 **Dashboard** : vue d'ensemble, temps réel, historique, comparaisons, hypothèses.
- 📄 **Exports** : PDF, Excel, CSV.

---

## 🏗️ 5 — Architecture

```
energie-si/  (monorepo npm workspaces)
├── apps/
│   ├── api/     → NestJS  (port 3001) : capteurs, scénarios, stats, exports, WebSocket
│   └── web/     → Next.js (port 3100) : dashboard Tailwind + shadcn/ui
├── packages/
│   └── shared/  → types & enums TypeScript partagés (contrat unique front ↔ back)
└── docs/        → cahier des charges, UML, ERD, manuel, rapport, plan de soutenance
```

```
┌──────────────────────────────┐
│  DASHBOARD (Next.js) :3100    │  ← ce que tu vois dans le navigateur
└──────────────┬───────────────┘
               │ REST + WebSocket (temps réel)
┌──────────────┴───────────────┐
│  API (NestJS) :3001          │  ← le cerveau : mesure, calcul, analyse
└──────────────┬───────────────┘
               │ Prisma
┌──────────────┴───────────────┐
│  BASE SQLite                 │  ← la mémoire : machines, scénarios, mesures…
└──────────────────────────────┘
```

---

## 🔋 6 — La mesure de l'énergie (le point fort)

La plupart des étudiants n'ont **pas de wattmètre**. Ce projet règle le problème avec **3 méthodes de mesure** et un **repli automatique** (du plus précis au plus universel) :

1. **RAPL** — compteur d'énergie intégré au processeur Intel/AMD (`/sys/class/powercap/intel-rapl`). Le plus précis (nécessite les droits root).
2. **Batterie** — vitesse de décharge réelle du portable (`/sys/class/power_supply/BAT*/power_now`).
3. **Modèle** — estimation à partir de la charge CPU (`P = P_repos + (P_max − P_repos) × charge`). Toujours disponible.

> 🔎 Au démarrage, l'API choisit toute seule la meilleure méthode disponible et **note dans chaque mesure laquelle a été utilisée** → c'est **honnête scientifiquement**.

---

## 🚀 7 — Installation et lancement

**Prérequis :** Node.js ≥ 20, npm. Linux recommandé.

```bash
# 1) Installer + créer la base + charger les données de démonstration
npm run setup

# 2) Démarrer l'API et le dashboard ensemble
npm run dev
```

| Adresse | Service |
|---|---|
| **http://localhost:3100** | 🖥️ Dashboard (interface) |
| http://localhost:3001/api | ⚙️ API |

| Commande | Effet |
|---|---|
| `npm run setup` | install + Prisma + base + seed |
| `npm run dev` | API + dashboard (développement) |
| `npm run db:seed` | recharge les données de démonstration |
| `npm run build` | build de production complet |

---

## 🧪 8 — Scénario de test complet

> Objectif : **prouver, en 3 minutes, que l'application mesure réellement** la consommation et qu'elle valide les hypothèses. C'est le scénario à présenter en soutenance.

### Préparation
```bash
npm run setup   # une seule fois
npm run dev     # laisse tourner
```
Ouvre **http://localhost:3100**.

### Étape 1 — Vérifier les données (page « Vue d'ensemble »)
- ✅ On voit **3 machines**, **17 campagnes**, **1530 mesures**.
- ✅ Le badge affiche le **backend énergie actif** (ex. `BATTERY`).
- ✅ Les cartes **H1 / H2 / H3** affichent **CONFIRMED**.

### Étape 2 — Mesure RÉELLE au repos (page « Temps réel »)
1. **Machine** = `Ordinateur portable`
2. **Scénario** = `Système au repos`
3. **Durée** = `15` → clique **Démarrer la mesure**
4. ✅ Les jauges (Puissance / CPU / RAM / °C) bougent et la **courbe se trace en direct**.
5. 📝 Note la **puissance au repos** (≈ 8–9 W).

### Étape 3 — Mesure RÉELLE en charge CPU (la démonstration clé)
1. Attends la fin (badge « En attente »).
2. **Scénario** = `Charge CPU maximale`, **Durée** = `15` → **Démarrer**.
3. ✅ Tu dois **voir augmenter** : la puissance, le CPU (~90 %), la température.

📊 **Résultat réel obtenu pendant les tests** (portable, backend batterie) :

| Mesure | Puissance | CPU | Température |
|---|--:|--:|--:|
| Repos | **8,5 W** | 4,7 % | 39,8 °C |
| Charge CPU | **10,0 W** | 90,2 % | 48,3 °C |
| **Écart** | **+17 %** | — | **+8,5 °C** |

➡️ La consommation et la température **augmentent réellement** avec la charge → cela démontre le principe même de l'étude.

### Étape 4 — Explorer les analyses
- **Historique** → ✅ tes 2 mesures apparaissent dans le tableau.
- **Comparaisons** → ✅ graphiques *Fixe vs Portable*, *VirtualBox vs VMware*, *montée en charge VM*.
- **Hypothèses** → ✅ les 3 verdicts avec leurs conclusions automatiques.
- **Rapport** → ✅ clique **Rapport PDF** : un PDF se télécharge.

### ✅ Test réussi si
- la courbe bouge en temps réel pendant une mesure,
- « Charge CPU » consomme plus que « Repos »,
- les 3 hypothèses sont confirmées,
- le PDF se télécharge.

### (Option) Test rapide en ligne de commande
```bash
# état des backends de mesure
curl http://localhost:3001/api/power/backends
# une mesure réelle instantanée
curl http://localhost:3001/api/collector/sample
# verdicts des hypothèses
curl http://localhost:3001/api/analysis/hypotheses
```

---

## 📈 9 — Résultats et validation des hypothèses

| Hypothèse | Verdict | Élément clé |
|---|:--:|---|
| **H1** — portable < fixe | ✅ Confirmée | le portable consomme ≈ **76 % de moins** |
| **H2** — VM augmente l'hôte | ✅ Confirmée | la consommation de l'hôte grimpe avec une VM active |
| **H3** — ↑ avec le nombre de VM | ✅ Confirmée | corrélation quasi parfaite (1 → 2 → 3 VM) |

**Recommandations :** privilégier les portables en bureautique ; regrouper les VM et éteindre celles qui sont inutiles ; intégrer le critère énergétique au choix de l'hyperviseur.

---

## 📂 10 — Structure du projet

```
apps/api/src/
├── power/        ⚡ backends énergie (rapl, batterie, modèle) + sélecteur
├── collector/    📡 lecture CPU / RAM / température
├── runner/       ▶️ exécution des scénarios + stress CPU + WebSocket
├── analysis/     📊 statistiques + validation H1/H2/H3
├── reporting/    📄 exports CSV / Excel / PDF
├── machines/ scenarios/ tests/   🗃️ CRUD
└── prisma/       🗄️ accès base de données

apps/web/src/
├── app/          📄 pages (vue d'ensemble, temps réel, historique, comparaisons, hypothèses, rapport)
├── components/   🧱 UI (cartes, graphiques, barre latérale…)
└── lib/          🔌 client API + utilitaires
```

---

## 📖 11 — Documentation

Tout est dans le dossier [`docs/`](./docs) :

| Document | Contenu |
|---|---|
| [Cahier des charges](./docs/00-cahier-des-charges.md) | Objectifs, exigences, livrables. |
| [Architecture](./docs/01-architecture.md) | Schémas, séquences, choix techniques. |
| [Modèle de données](./docs/02-modele-donnees.md) + [SQL](./docs/schema.sql) | ERD + script SQL complet. |
| [Manuel utilisateur](./docs/03-manuel-utilisateur.md) | Installation, utilisation, dépannage. |
| [Plan de soutenance](./docs/04-plan-soutenance.md) | Déroulé minuté + Q/R. |
| [Rapport de recherche](./docs/05-rapport-recherche.md) | Document académique complet. |
| [Présentation](./docs/06-presentation.md) | Slides (Marp → PowerPoint). |
| [Diagrammes UML](./docs/uml/diagrammes-uml.md) | Cas d'usage, classes, déploiement. |

---

<div align="center">

**Projet d'initiation à la recherche — Full-stack TypeScript (NestJS + Next.js)**

</div>
