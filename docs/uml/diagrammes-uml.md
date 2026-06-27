# Diagrammes UML — EnergieSI

> Diagrammes en syntaxe Mermaid (rendus directement sur GitHub / VS Code avec l'extension Mermaid).

## 1. Diagramme de cas d'utilisation

```mermaid
flowchart TB
    user((Chercheur / Étudiant))
    subgraph EnergieSI
        uc1[Configurer une machine]
        uc2[Lancer une campagne de mesure]
        uc3[Suivre la mesure en temps réel]
        uc4[Consulter l'historique]
        uc5[Comparer fixe / portable]
        uc6[Comparer les hyperviseurs]
        uc7[Valider les hypothèses H1/H2/H3]
        uc8[Exporter CSV / Excel / PDF]
    end
    user --- uc1 & uc2 & uc3 & uc4 & uc5 & uc6 & uc7 & uc8
    uc2 -.inclut.-> uc3
    uc5 -.étend.-> uc7
    uc6 -.étend.-> uc7
```

## 2. Diagramme de classes (backend NestJS)

```mermaid
classDiagram
    class PowerBackendStrategy {
        <<interface>>
        +backend: PowerBackend
        +priority: number
        +isAvailable() Promise~boolean~
        +read(ctx) Promise~number~
        +reset()
    }
    class RaplBackend
    class BatteryBackend
    class ModelBackend
    class PowerService {
        -active: PowerBackendStrategy
        +selectBackend() Promise~PowerBackend~
        +read(ctx) Promise~number~
        +describe()
    }
    class CollectorService {
        +sample() Promise~SystemSample~
        +detectSpecs() Promise~MachineSpecs~
    }
    class RunnerService {
        +run(dto) Promise~Test~
        +stop()
        -loop(...)
    }
    class AnalysisService {
        +computeAndStoreResult(testId)
        +compareHardware()
        +compareHypervisors()
        +hypotheses() HypothesisResult[]
    }
    class ReportingService {
        +csvResults()
        +excelResults() Buffer
        +pdfReport() Buffer
    }

    PowerBackendStrategy <|.. RaplBackend
    PowerBackendStrategy <|.. BatteryBackend
    PowerBackendStrategy <|.. ModelBackend
    PowerService o-- PowerBackendStrategy
    RunnerService --> CollectorService
    RunnerService --> PowerService
    RunnerService --> AnalysisService
    ReportingService --> AnalysisService
```

## 3. Diagramme d'entités (modèle de données)

Voir [../02-modele-donnees.md](../02-modele-donnees.md) pour l'ERD complet.

## 4. Diagramme de séquence — exécution d'un test

Voir [../01-architecture.md](../01-architecture.md#3-cycle-dune-campagne-de-mesure).

## 5. Diagramme de déploiement

```mermaid
flowchart LR
    subgraph Poste de mesure (Linux)
        direction TB
        B[Navigateur<br/>localhost:3000]
        N[Next.js<br/>:3000]
        A[NestJS API<br/>:3001]
        DB[(SQLite<br/>dev.db)]
        S[/sys : RAPL, batterie, thermal/]
        B --> N
        N -->|REST + WebSocket| A
        A --> DB
        A -->|lecture capteurs| S
    end
```

## 6. Diagramme d'activité — sélection du backend énergie

```mermaid
flowchart TD
    start([Démarrage]) --> r{RAPL lisible ?}
    r -- oui --> useR[Utiliser RAPL]
    r -- non --> b{Batterie en décharge ?}
    b -- oui --> useB[Utiliser Batterie]
    b -- non --> useM[Utiliser Modèle]
    useR --> done([Backend actif])
    useB --> done
    useM --> done
```
