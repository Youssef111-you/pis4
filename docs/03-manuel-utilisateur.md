# Manuel utilisateur — EnergieSI

## 1. Prérequis

- **Node.js ≥ 20** et **npm** installés.
- Système **Linux** recommandé (RAPL, batterie, capteurs thermiques).
- Optionnel pour la mesure RAPL réelle : lancer l'API avec `sudo` (sinon repli automatique sur batterie/modèle).

## 2. Installation

```bash
cd energie-si
npm run setup     # installe, génère Prisma, crée la base et charge les données de démo
```

`npm run setup` enchaîne : `npm install` → build du package partagé → `prisma db push` → seed.

## 3. Lancer l'application

```bash
npm run dev       # démarre l'API (:3001) ET le dashboard (:3000)
```

Ouvrir **http://localhost:3100** (le dashboard tourne sur le port **3100** ; l'API sur **3001**).

Pour lancer séparément :
```bash
npm run dev:api   # API seule
npm run dev:web   # dashboard seul
```

## 4. Utilisation du dashboard

| Page | Description |
|------|-------------|
| **Vue d'ensemble** | KPIs globaux, puissance par type de machine, état des hypothèses. |
| **Temps réel** | Choisir une machine + un scénario, fixer la durée, cliquer **Démarrer**. Les jauges (W, CPU, RAM, °C) et la courbe se mettent à jour en direct via WebSocket. |
| **Historique** | Tableau de toutes les campagnes et de leurs résultats. |
| **Comparaisons** | Fixe vs portable (par scénario), VirtualBox vs VMware, consommation selon le nombre de VM. |
| **Hypothèses** | Verdict automatique de H1, H2, H3 avec conclusions et preuves chiffrées. |
| **Rapport** | Téléchargement des exports PDF, Excel et CSV. |

## 5. Lancer une mesure réelle

1. Aller sur **Temps réel**.
2. Sélectionner la machine (ou en créer une via l'API `POST /machines/auto-detect`).
3. Choisir un scénario (repos, web, vidéo, charge CPU).
4. Régler la durée (ex. 20 s pour une démo, 600 s pour le protocole complet).
5. Cliquer **Démarrer la mesure**. La charge CPU est appliquée automatiquement pour les scénarios « charge CPU ».

> La mesure utilise le meilleur backend disponible : **RAPL** (si root), sinon **batterie** (si sur batterie), sinon le **modèle d'estimation**. Le backend actif est affiché.

## 6. Calibrer le modèle d'estimation

Si aucun capteur n'est disponible, le modèle utilise `pIdleW` et `pMaxW` de la machine.
Mesurez ces deux valeurs avec une prise wattmètre (repos et pleine charge) puis renseignez-les
lors de la création de la machine pour des estimations précises.

## 7. Exports

- **PDF** : `http://localhost:3001/api/reporting/report.pdf`
- **Excel** : `http://localhost:3001/api/reporting/results.xlsx`
- **CSV (résultats)** : `http://localhost:3001/api/reporting/results.csv`
- **CSV (mesures d'un test)** : `http://localhost:3001/api/reporting/measurements/{id}.csv`

## 8. Réinitialiser les données

```bash
npm run db:seed   # recharge les scénarios + données de démonstration
```

## 9. Dépannage

| Symptôme | Solution |
|----------|----------|
| Dashboard vide | Vérifier que l'API tourne (`npm run dev:api`) et lancer `npm run db:seed`. |
| Backend = MODEL au lieu de RAPL | RAPL nécessite root : lancer l'API avec `sudo`, ou rester sur batterie/modèle. |
| Température `—` | Le capteur n'est pas exposé ; sans incidence sur l'énergie. |
| Port déjà utilisé | Modifier `PORT` dans `apps/api/.env` ou le port Next dans `apps/web/package.json`. |
