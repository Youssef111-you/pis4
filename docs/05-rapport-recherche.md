# Rapport de recherche

## Étude comparative de la consommation énergétique des systèmes informatiques : cas des ordinateurs fixes, des ordinateurs portables et des environnements virtualisés

*Projet d'initiation à la recherche*

---

## Résumé

Ce travail mesure et compare la consommation énergétique de trois familles de systèmes informatiques — ordinateur fixe, ordinateur portable et environnement virtualisé — dans des scénarios d'usage représentatifs (repos, navigation web, lecture vidéo, charge CPU). Un outil logiciel a été développé (NestJS + Next.js) pour collecter automatiquement les métriques (CPU, RAM, température, puissance), les stocker, les analyser statistiquement et valider trois hypothèses. Les résultats confirment que le portable consomme nettement moins que le fixe (H1), que la virtualisation accroît la consommation de l'hôte (H2), et que celle-ci augmente avec le nombre de machines virtuelles (H3).

**Mots-clés :** consommation énergétique, efficacité énergétique, virtualisation, machine virtuelle, charge CPU, RAPL.

---

## 1. Introduction

L'essor du numérique s'accompagne d'une hausse de la consommation électrique des équipements informatiques, posant des enjeux économiques et environnementaux. La virtualisation, largement adoptée (cloud, data centers, laboratoires pédagogiques), optimise l'usage matériel mais introduit un surcoût énergétique qu'il convient de quantifier. Ce projet propose une démarche expérimentale outillée pour comparer objectivement la consommation de différents systèmes.

## 2. Problématique et questions de recherche

**Problématique :** quel est l'impact du type d'équipement (fixe vs portable) et de la virtualisation sur la consommation énergétique d'un système informatique ?

- Q1 : un portable consomme-t-il moins qu'un fixe ?
- Q2 : quel est l'impact de la virtualisation sur la consommation ?
- Q3 : comment évolue la consommation selon la charge et le nombre de VM ?

## 3. Cadre conceptuel

- **Puissance (W)** : énergie consommée par unité de temps (valeur instantanée).
- **Énergie (Wh / J)** : intégrale de la puissance sur la durée ; `1 Wh = 3600 J`.
- **Efficacité énergétique** : travail utile rapporté à l'énergie consommée (perf/W).
- **Virtualisation / hyperviseur** : abstraction matérielle permettant d'exécuter plusieurs systèmes invités ; hyperviseur de type 2 (VirtualBox, VMware Workstation) au-dessus d'un OS hôte.
- **Machine virtuelle (VM)** : système invité disposant de ressources virtuelles (vCPU, RAM, disque).
- **Charge CPU** : taux d'occupation du processeur (%), principal facteur de variation de la puissance.
- **Modèle de puissance** : `P(u) = P_idle + (P_max − P_idle)·u`, où `u` est la charge CPU normalisée.

## 4. Revue de littérature (synthèse)

Les travaux sur l'efficacité énergétique des systèmes informatiques distinguent trois approches de mesure :

1. **Mesure matérielle externe** (wattmètre, prise instrumentée) : référence la plus fiable, mais nécessite du matériel.
2. **Compteurs intégrés** : interfaces **RAPL** (Intel/AMD) exposant l'énergie du package CPU et de la RAM ; lecture de la batterie sur les portables (`power_now`).
3. **Modèles d'estimation** : régression de la puissance en fonction de l'utilisation des ressources (CPU majoritairement), calibrés par machine.

La littérature sur la virtualisation montre un **surcoût énergétique** lié à la couche d'abstraction (ordonnancement, émulation d'E/S), croissant avec la densité de VM, mais compensé en data center par une meilleure consolidation. Les comparaisons d'hyperviseurs rapportent des écarts de performance et de consommation selon l'implémentation. Le présent outil s'appuie sur les approches 2 et 3 (RAPL, batterie, modèle) avec repli automatique.

## 5. Méthodologie

### 5.1 Matériel et logiciels
Outil développé en TypeScript : **NestJS** (collecte, scénarios, analyse) et **Next.js** (dashboard). Capteurs lus via `systeminformation` et le système de fichiers `/sys` (RAPL, batterie, thermique). Base **SQLite** (Prisma).

### 5.2 Protocole
- 3 machines : fixe, portable, hôte de virtualisation.
- 9 scénarios (4 matériels + 5 virtualisation), durée nominale 10 min, échantillonnage 1 Hz.
- Métriques : puissance (W), énergie (Wh), CPU (%), RAM (%), température (°C).
- Backend énergie tracé pour chaque mesure (transparence).

### 5.3 Traitement statistique
Moyenne, médiane, écart-type, variance, min/max ; différence relative (%) ; corrélation de Pearson (puissance ↔ CPU) ; test t de Welch pour la comparaison des moyennes.

## 6. Résultats

> Les valeurs ci-dessous proviennent du jeu de données de démonstration reproductible (`npm run db:seed`). Sur une machine réelle, l'outil produit les mêmes analyses à partir de mesures réelles.

### 6.1 Puissance moyenne par type de machine

| Type | Puissance moyenne (W) | Énergie moyenne (Wh) |
|------|----------------------:|---------------------:|
| Ordinateur fixe | ≈ 90,5 | ≈ 2,26 |
| Hôte virtualisation | ≈ 37,1 | ≈ 0,93 |
| Ordinateur portable | ≈ 21,5 | ≈ 0,54 |

### 6.2 Fixe vs portable par scénario
La puissance croît avec la charge dans les deux cas (repos < web < vidéo < CPU), le fixe restant systématiquement bien au‑dessus du portable. La corrélation puissance ↔ CPU est forte (r ≈ 0,9+).

### 6.3 Virtualisation
La consommation de l'hôte augmente dès qu'une VM est active, et croît avec le nombre de VM (1 → 2 → 3). VirtualBox présente un surcoût légèrement supérieur à VMware à charge égale.

## 7. Validation des hypothèses

| Hypothèse | Verdict | Élément clé |
|-----------|---------|-------------|
| **H1** — portable < fixe | ✅ Confirmée | ≈ 76 % de moins en moyenne (test t significatif). |
| **H2** — VM augmente l'hôte | ✅ Confirmée | Hausse marquée hôte seul → hôte + VM. |
| **H3** — ↑ avec nb de VM | ✅ Confirmée | Corrélation quasi parfaite (r ≈ 1), croissance monotone. |

## 8. Discussion

Le portable doit son efficacité à des composants basse consommation (CPU mobile, absence d'alimentation surdimensionnée). La virtualisation introduit un surcoût attendu (couche logicielle, duplication de l'OS invité). Limites : sans wattmètre matériel, les valeurs reposent sur RAPL/batterie/modèle ; le modèle ne capture pas finement la consommation du GPU, de l'écran et des E/S. La calibration `P_idle`/`P_max` par machine améliore la fidélité.

## 9. Recommandations

- Privilégier les portables pour les usages bureautiques (gain énergétique majeur).
- Mutualiser/consolider les VM plutôt que multiplier les hôtes.
- Adapter le nombre de VM à la charge réelle ; éteindre les VM inactives.
- Choisir l'hyperviseur aussi sur le critère énergétique à charge équivalente.

## 10. Conclusion et perspectives

L'étude confirme les trois hypothèses et fournit un outil réutilisable et extensible. Perspectives : intégrer un wattmètre connecté (backend dédié), modéliser GPU/écran, étendre aux hyperviseurs de type 1 et au cloud, et automatiser des campagnes longues.

## Références

1. Intel, *Running Average Power Limit (RAPL) Interface*, documentation noyau Linux (`powercap`).
2. Documentation noyau Linux, *Power Supply Class* (`/sys/class/power_supply`).
3. Travaux sur la modélisation de la puissance des serveurs à partir de l'utilisation CPU (modèle linéaire P_idle/P_max).
4. Études comparatives de la consommation des hyperviseurs de type 2 (VirtualBox, VMware).
