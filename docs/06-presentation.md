---
marp: true
title: EnergieSI — Consommation énergétique des systèmes informatiques
theme: default
paginate: true
---

# ⚡ Étude comparative de la consommation énergétique des systèmes informatiques

### Ordinateurs fixes · portables · environnements virtualisés

*Projet d'initiation à la recherche*

> Astuce : ce fichier est compatible **Marp** et **Pandoc** → export direct en PowerPoint/PDF.
> `marp docs/06-presentation.md -o presentation.pptx`

---

## 1. Contexte

- Explosion de l'usage du numérique → hausse de la consommation électrique.
- Enjeux **environnementaux** et **économiques**.
- Virtualisation omniprésente (cloud, data centers, labos) : quel coût énergétique ?

---

## 2. Problématique

> Quel est l'impact du **type d'équipement** (fixe vs portable) et de la **virtualisation** sur la consommation énergétique ?

**Questions :** portable < fixe ? · impact de la virtualisation ? · effet du nombre de VM ?

---

## 3. Hypothèses

- **H1** — Le portable consomme moins que le fixe.
- **H2** — La virtualisation augmente la consommation de l'hôte.
- **H3** — La consommation croît avec le nombre de VM.

---

## 4. Concepts clés

- **Puissance (W)** vs **Énergie (Wh)** — `1 Wh = 3600 J`.
- **Efficacité énergétique** = perf / watt.
- **Modèle de puissance** : `P = P_idle + (P_max − P_idle) × charge_CPU`.

---

## 5. État de l'art — mesurer l'énergie

1. **Wattmètre matériel** — le plus fiable.
2. **RAPL / batterie** — compteurs intégrés (Intel/AMD, portables).
3. **Modèle d'estimation** — régression sur la charge CPU.

→ Notre outil combine les trois avec **repli automatique**.

---

## 6. Méthodologie

- 3 machines : **fixe**, **portable**, **hôte de virtualisation**.
- 9 scénarios : repos, web, vidéo, charge CPU (×2 cas).
- Mesures à 1 Hz : **W, CPU%, RAM%, °C**.
- Stockage SQLite, analyse statistique automatique.

---

## 7. Architecture (full-stack TypeScript)

- **NestJS** : collecte capteurs, scénarios, statistiques, exports.
- **Next.js + Tailwind/shadcn** : dashboard temps réel.
- **Prisma + SQLite** : 5 tables (machines, scenarios, tests, measurements, results).
- **Socket.IO** : suivi en direct.

---

## 8. Démonstration 🔴

- Vue d'ensemble & KPIs
- **Mesure en temps réel** (jauges + courbe live)
- Comparaisons fixe/portable & hyperviseurs
- Validation automatique des hypothèses
- Export PDF/Excel/CSV

---

## 9. Résultats — par type de machine

| Type | Puissance moyenne |
|------|------------------:|
| Fixe | ≈ 90 W |
| Hôte | ≈ 37 W |
| Portable | ≈ 21 W |

---

## 10. Validation des hypothèses

- ✅ **H1** confirmée — portable ≈ **76 % de moins**.
- ✅ **H2** confirmée — la VM augmente la consommation de l'hôte.
- ✅ **H3** confirmée — corrélation quasi parfaite avec le nombre de VM.

---

## 11. Recommandations

- Privilégier les **portables** en bureautique.
- **Consolider** les VM, éteindre les VM inactives.
- Intégrer le critère énergétique dans le choix de l'hyperviseur.

---

## 12. Conclusion & perspectives

- Outil **complet, réutilisable, extensible**.
- Perspectives : wattmètre connecté, modèle GPU/écran, hyperviseurs type 1, cloud.

---

# Merci 🙏

### Questions ?
