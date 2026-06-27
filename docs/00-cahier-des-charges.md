# Cahier des charges — EnergieSI

**Projet :** Étude comparative de la consommation énergétique des systèmes informatiques (ordinateurs fixes, portables et environnements virtualisés)
**Type :** Initiation à la recherche
**Version :** 1.0

---

## 1. Contexte et justification

L'usage massif du numérique accroît la consommation électrique des équipements informatiques. La virtualisation, omniprésente dans le cloud et les laboratoires pédagogiques, optimise l'usage matériel mais son coût énergétique réel reste à quantifier. Ce projet conçoit un **outil de mesure et d'analyse** permettant de comparer objectivement la consommation de différents systèmes et configurations.

## 2. Problématique

> Quel est l'impact du type d'équipement (fixe vs portable) et de la virtualisation sur la consommation énergétique d'un système informatique ?

## 3. Objectifs

### Objectif général
Mesurer, stocker, analyser et comparer la consommation énergétique de systèmes informatiques dans différents scénarios d'utilisation.

### Objectifs spécifiques
- O1 — Mesurer la consommation d'un ordinateur fixe.
- O2 — Mesurer la consommation d'un ordinateur portable.
- O3 — Évaluer l'impact de la virtualisation sur la consommation de l'hôte.
- O4 — Analyser la relation entre usage des ressources (CPU/RAM) et puissance.
- O5 — Formuler des recommandations d'efficacité énergétique.

## 4. Hypothèses de recherche

| ID | Hypothèse | Critère de validation |
|----|-----------|----------------------|
| **H1** | Le portable consomme moins que le fixe. | Puissance moyenne portable < fixe (test t significatif). |
| **H2** | La virtualisation augmente la consommation de l'hôte. | Puissance hôte+VM > hôte seul (test t significatif). |
| **H3** | La consommation croît avec le nombre de VM. | Corrélation positive forte (r > 0,7) et croissance monotone. |

## 5. Périmètre fonctionnel

### Exigences fonctionnelles
- **EF1** Collecter automatiquement CPU (%), RAM (%), température (°C) et puissance (W).
- **EF2** Estimer/mesurer l'énergie via plusieurs backends (RAPL, batterie, modèle).
- **EF3** Exécuter des scénarios paramétrés (repos, web, vidéo, charge CPU).
- **EF4** Persister machines, scénarios, tests, mesures et résultats.
- **EF5** Calculer des statistiques (moyenne, médiane, écart-type, variance, corrélation).
- **EF6** Valider automatiquement H1, H2, H3.
- **EF7** Visualiser en temps réel et historiquement (dashboard web).
- **EF8** Exporter en CSV, Excel et PDF.

### Exigences non fonctionnelles
- **ENF1** Portabilité Linux (et dégradé gracieux sans matériel de mesure).
- **ENF2** Architecture modulaire et extensible (nouveaux backends, scénarios).
- **ENF3** Traçabilité scientifique : chaque mesure indique le backend utilisé.
- **ENF4** Interface professionnelle, lisible, prête pour soutenance.
- **ENF5** Reproductibilité (données de démonstration déterministes).

## 6. Contraintes techniques

- Stack **full-stack TypeScript** : NestJS (API) + Next.js (dashboard).
- Base **SQLite** via Prisma (portable, zéro configuration).
- Pas de wattmètre matériel requis → mesure via RAPL/batterie/modèle.

## 7. Livrables

Cahier des charges · Architecture technique · Diagrammes UML · Modèle de données (ERD + SQL) · Code source complet · Manuel utilisateur · Rapport de recherche · Présentation · Plan de soutenance.

## 8. Critères d'acceptation

- L'outil collecte et enregistre des mesures réelles sur la machine hôte.
- Les 9 scénarios du sujet sont représentés.
- H1/H2/H3 sont évaluées automatiquement avec un verdict justifié.
- Les exports CSV/Excel/PDF sont fonctionnels.
- Le dashboard affiche temps réel, historique, comparaisons et hypothèses.
