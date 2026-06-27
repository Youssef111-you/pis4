# Modèle de données — EnergieSI

## 1. Diagramme entité-association (ERD)

```mermaid
erDiagram
    MACHINE ||--o{ TEST : "exécute"
    SCENARIO ||--o{ TEST : "définit"
    TEST ||--o{ MEASUREMENT : "produit"
    TEST ||--o| RESULT : "agrège"

    MACHINE {
        int id PK
        string name
        string type "DESKTOP|LAPTOP|HOST|VM"
        string cpuModel
        int cpuCores
        float ramGo
        string os
        float pIdleW
        float pMaxW
    }
    SCENARIO {
        int id PK
        string code UK
        string name
        string description
        int durationS
        string workload "IDLE|WEB|VIDEO|CPU"
        string studyCase "HARDWARE|VIRTUALIZATION"
    }
    TEST {
        int id PK
        int machineId FK
        int scenarioId FK
        string hypervisor "NONE|VIRTUALBOX|VMWARE"
        int vmCount
        string powerBackend
        string status
        datetime startedAt
        datetime endedAt
    }
    MEASUREMENT {
        int id PK
        int testId FK
        datetime timestamp
        float cpuPct
        float ramPct
        float ramMo
        float cpuTempC
        float powerW
        float energyJ
    }
    RESULT {
        int id PK
        int testId FK_UK
        int samples
        float powerMeanW
        float powerMedianW
        float powerStdW
        float powerVarW
        float cpuMeanPct
        float ramMeanPct
        float tempMeanC
        float energyWh
        float corrPowerCpu
    }
```

## 2. Description des tables

| Table | Rôle | Cardinalité |
|-------|------|-------------|
| `machines` | Équipements étudiés (fixe, portable, hôte, VM) + paramètres du modèle de puissance. | 1 machine → N tests |
| `scenarios` | Scénarios normalisés (repos, web, vidéo, CPU…). | 1 scénario → N tests |
| `tests` | Campagne = un scénario exécuté sur une machine (avec hyperviseur/nb VM). | 1 test → N mesures |
| `measurements` | Échantillon mesuré à l'instant t (1 ligne/seconde). | — |
| `results` | Agrégats statistiques d'un test (relation 1‑1). | 1 test → 1 résultat |

## 3. Script SQL

Le DDL complet généré est disponible dans [`schema.sql`](./schema.sql).
Il est appliqué automatiquement par Prisma (`npm run db:setup`).

> **Note SQLite :** les énumérations sont stockées en `TEXT` ; les valeurs valides
> proviennent des énumérations TypeScript de `@energie-si/shared`.
