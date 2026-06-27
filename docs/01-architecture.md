# Architecture technique — EnergieSI

## 1. Vue d'ensemble (couches)

```mermaid
flowchart TB
    subgraph Présentation["🖥️ Présentation — Next.js (port 3000)"]
        UI[Dashboard Tailwind + shadcn/ui]
        RT[Temps réel WebSocket]
        EX[Exports CSV/Excel/PDF]
    end
    subgraph Métier["⚙️ Métier — NestJS (port 3001)"]
        RUN[RunnerService<br/>orchestration scénarios]
        COL[CollectorService<br/>systeminformation]
        POW[PowerService<br/>backends énergie]
        ANA[AnalysisService<br/>statistiques + hypothèses]
        REP[ReportingService<br/>CSV/Excel/PDF]
    end
    subgraph Persistance["🗄️ Persistance"]
        DAO[Prisma ORM]
        DB[(SQLite)]
    end
    UI -->|REST| ANA
    RT <-->|Socket.IO| RUN
    EX -->|REST| REP
    RUN --> COL & POW & ANA
    ANA --> DAO
    REP --> DAO
    RUN --> DAO
    DAO --> DB
```

## 2. Sélection du backend énergétique (Strategy + fallback)

```mermaid
flowchart LR
    A[Démarrage API] --> B{RAPL dispo ?<br/>/sys/.../energy_uj}
    B -- oui --> R[RAPL ⚡ priorité 90]
    B -- non --> C{Batterie en décharge ?<br/>power_now}
    C -- oui --> BAT[Battery 🔋 priorité 70]
    C -- non --> M[Model 📐 priorité 10<br/>P = P_idle + ΔP·u]
```

Chaque mesure enregistre le backend réellement utilisé (`powerBackend`) pour la transparence scientifique.

## 3. Cycle d'une campagne de mesure

```mermaid
sequenceDiagram
    participant W as Dashboard (Next.js)
    participant API as RunnerController
    participant R as RunnerService
    participant C as CollectorService
    participant P as PowerService
    participant DB as Prisma/SQLite
    W->>API: POST /runner/run {machine, scénario, durée}
    API->>R: run(dto)
    R->>DB: crée Test (RUNNING)
    R-->>W: Test (WebSocket: test:started)
    loop chaque seconde
        R->>C: sample() → CPU, RAM, °C
        R->>P: read(ctx) → puissance (W)
        R->>DB: enregistre Measurement
        R-->>W: test:sample (live)
    end
    R->>DB: Test (COMPLETED) + calcul Result
    R-->>W: test:completed
```

## 4. Stack et choix techniques

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Frontend | Next.js 14 (App Router) | Rendu serveur, routage moderne, DX. |
| UI | Tailwind CSS + shadcn/ui | Design professionnel, cohérent, rapide. |
| Graphiques | Recharts | Graphiques React déclaratifs. |
| Temps réel | Socket.IO | Diffusion live des échantillons. |
| Backend | NestJS | Architecture modulaire (DI, modules). |
| Capteurs | systeminformation + sysfs | CPU/RAM/°C multiplateforme. |
| Énergie | RAPL / batterie / modèle | Mesure réelle ou estimation, avec repli. |
| Stats | simple-statistics | Moyenne, écart-type, corrélation, test t. |
| ORM/BD | Prisma + SQLite | Zéro configuration, portable. |
| Exports | ExcelJS + PDFKit | Excel et PDF natifs. |

## 5. Organisation du code (monorepo)

```
apps/api    NestJS — 1 module par responsabilité (power, collector, runner,
            analysis, reporting, machines, scenarios, tests)
apps/web    Next.js — pages (overview, realtime, history, compare, hypotheses,
            report) + composants UI réutilisables
packages/shared  Types & enums partagés (contrat unique front/back)
```

## 6. Extensibilité

- **Nouveau backend énergie** (ex : wattmètre Shelly) : implémenter `PowerBackendStrategy` et l'ajouter au `PowerModule`.
- **Nouveau scénario** : ajouter une ligne dans le seed + (option) une charge dédiée.
- **Nouvelle hypothèse** : ajouter une méthode dans `AnalysisService.hypotheses()`.
