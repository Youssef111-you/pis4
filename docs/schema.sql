-- ============================================================================
-- EnergieSI — Script SQL complet (dialecte SQLite)
-- Équivalent du schéma Prisma. Appliqué automatiquement par `npm run db:setup`.
-- Les énumérations sont stockées en TEXT (valeurs définies dans @energie-si/shared).
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- Table : machines  (équipements étudiés)
-- ----------------------------------------------------------------------------
CREATE TABLE machines (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL,
    type      TEXT    NOT NULL,            -- DESKTOP | LAPTOP | HOST | VM
    cpuModel  TEXT,
    cpuCores  INTEGER,
    ramGo     REAL,
    os        TEXT,
    pIdleW    REAL    NOT NULL DEFAULT 15, -- puissance de repos (modèle)
    pMaxW     REAL    NOT NULL DEFAULT 65, -- puissance maximale (modèle)
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- Table : scenarios  (scénarios de mesure)
-- ----------------------------------------------------------------------------
CREATE TABLE scenarios (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    code        TEXT    NOT NULL UNIQUE,   -- ex : C1-S1-REPOS
    name        TEXT    NOT NULL,
    description TEXT,
    durationS   INTEGER NOT NULL DEFAULT 600,
    workload    TEXT    NOT NULL,          -- IDLE | WEB | VIDEO | CPU
    studyCase   TEXT    NOT NULL           -- HARDWARE | VIRTUALIZATION
);

-- ----------------------------------------------------------------------------
-- Table : tests  (campagnes de mesure)
-- ----------------------------------------------------------------------------
CREATE TABLE tests (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    machineId    INTEGER NOT NULL,
    scenarioId   INTEGER NOT NULL,
    hypervisor   TEXT    NOT NULL DEFAULT 'NONE',  -- NONE | VIRTUALBOX | VMWARE
    vmCount      INTEGER NOT NULL DEFAULT 0,
    powerBackend TEXT    NOT NULL DEFAULT 'MODEL', -- RAPL | BATTERY | MODEL | WATTMETER
    status       TEXT    NOT NULL DEFAULT 'RUNNING',
    startedAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    endedAt      DATETIME,
    notes        TEXT,
    FOREIGN KEY (machineId)  REFERENCES machines (id)  ON DELETE CASCADE,
    FOREIGN KEY (scenarioId) REFERENCES scenarios (id) ON DELETE CASCADE
);
CREATE INDEX idx_tests_machine  ON tests (machineId);
CREATE INDEX idx_tests_scenario ON tests (scenarioId);

-- ----------------------------------------------------------------------------
-- Table : measurements  (échantillons à 1 Hz)
-- ----------------------------------------------------------------------------
CREATE TABLE measurements (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    testId    INTEGER NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cpuPct    REAL    NOT NULL,
    ramPct    REAL    NOT NULL,
    ramMo     REAL    NOT NULL,
    cpuTempC  REAL,
    powerW    REAL    NOT NULL,
    energyJ   REAL    NOT NULL,            -- énergie cumulée depuis le début du test
    FOREIGN KEY (testId) REFERENCES tests (id) ON DELETE CASCADE
);
CREATE INDEX idx_measurements_test ON measurements (testId);

-- ----------------------------------------------------------------------------
-- Table : results  (agrégats statistiques, relation 1-1 avec tests)
-- ----------------------------------------------------------------------------
CREATE TABLE results (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    testId       INTEGER NOT NULL UNIQUE,
    samples      INTEGER NOT NULL,
    powerMeanW   REAL    NOT NULL,
    powerMedianW REAL    NOT NULL,
    powerStdW    REAL    NOT NULL,
    powerVarW    REAL    NOT NULL,
    powerMinW    REAL    NOT NULL,
    powerMaxW    REAL    NOT NULL,
    cpuMeanPct   REAL    NOT NULL,
    ramMeanPct   REAL    NOT NULL,
    tempMeanC    REAL,
    energyWh     REAL    NOT NULL,
    corrPowerCpu REAL    NOT NULL,         -- corrélation de Pearson puissance ↔ CPU%
    FOREIGN KEY (testId) REFERENCES tests (id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- Exemple de requête d'analyse : puissance moyenne par type de machine
-- ----------------------------------------------------------------------------
-- SELECT m.type, AVG(r.powerMeanW) AS puissance_moyenne_w
-- FROM results r
-- JOIN tests t   ON t.id = r.testId
-- JOIN machines m ON m.id = t.machineId
-- GROUP BY m.type;
