# ⚡ EnergieSI — Étude comparative de la consommation énergétique des systèmes informatiques

> Projet d'initiation à la recherche — comparaison de la consommation énergétique des **ordinateurs fixes**, **portables** et **environnements virtualisés** (machines virtuelles).

Application complète **full-stack TypeScript** :

- **Backend** : [NestJS](https://nestjs.com/) — collecte des capteurs (CPU, RAM, température, énergie), exécution des scénarios, analyse statistique, exports.
- **Frontend** : [Next.js](https://nextjs.org/) (App Router) + **Tailwind CSS** + composants type **shadcn/ui** — tableau de bord temps réel, historique, comparaisons, validation des hypothèses.
- **Base de données** : SQLite via **Prisma** (5 tables : `machines`, `scenarios`, `tests`, `measurements`, `results`).
- **Temps réel** : WebSocket (Socket.IO).

---

## 🎯 Objectif scientifique

| Hypothèse | Énoncé |
|-----------|--------|
| **H1** | Un ordinateur portable consomme moins d'énergie qu'un ordinateur fixe. |
| **H2** | L'utilisation d'une machine virtuelle augmente la consommation de l'hôte. |
| **H3** | La consommation augmente avec le nombre de machines virtuelles. |

L'application **mesure**, **stocke**, **analyse** puis **valide automatiquement** ces hypothèses.

---

## 🏗️ Architecture

```
energie-si/  (monorepo npm workspaces)
├── apps/
│   ├── api/     → NestJS (port 3001) : collecte, scénarios, stats, exports, WebSocket
│   └── web/     → Next.js (port 3000) : dashboard Tailwind + shadcn/ui
├── packages/
│   └── shared/  → types & enums TypeScript partagés
└── docs/        → cahier des charges, UML, ERD, manuel, plan de soutenance
```

### ⚡ Mesure de l'énergie — backends interchangeables

Au démarrage, l'API sélectionne automatiquement le backend le plus précis disponible (avec repli) :

1. **RAPL** (`/sys/class/powercap/intel-rapl`) — énergie CPU réelle (Intel/AMD, **nécessite root**).
2. **Battery** (`/sys/class/power_supply/BAT*/power_now`) — puissance réelle au fil de la décharge (portable).
3. **Model** — estimation `P = P_idle + (P_max − P_idle) × charge_CPU`, calibrable par machine (repli universel).

> Chaque mesure enregistre **quel backend** a été utilisé → transparence scientifique.

---

## 🚀 Démarrage rapide

```bash
# 1. Tout installer + préparer la base + données de démonstration
npm run setup

# 2. Lancer l'API + le dashboard ensemble
npm run dev
```

- Dashboard : http://localhost:3100
- API : http://localhost:3001/api

### Commandes utiles

| Commande | Effet |
|----------|-------|
| `npm run setup` | install + génération Prisma + migration + seed |
| `npm run dev` | API + Web en mode développement |
| `npm run db:seed` | (re)charge les scénarios + données de démonstration |
| `npm run build` | build de production (shared → api → web) |

---

## 📊 Fonctionnalités du dashboard

- **Vue d'ensemble** : KPIs énergie/CPU/température, dernières campagnes.
- **Temps réel** : lancement d'un scénario et suivi live (WebSocket) des jauges W/CPU/RAM/°C.
- **Historique** : toutes les campagnes, filtrables par machine/scénario.
- **Comparaison** : fixe vs portable, et VirtualBox vs VMware.
- **Hypothèses** : validation automatique de H1, H2, H3 avec verdict statistique.
- **Rapport** : export CSV / Excel / PDF.

---

## 🧪 Stack technique

`TypeScript` · `NestJS` · `Next.js 14` · `Prisma` · `SQLite` · `Socket.IO` · `Tailwind CSS` · `Recharts` · `simple-statistics` · `systeminformation` · `ExcelJS` · `PDFKit`

Voir [`docs/`](./docs) pour le cahier des charges, les diagrammes UML, le modèle de données et le plan de soutenance.
# pi_s4
