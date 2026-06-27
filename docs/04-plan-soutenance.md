# Plan de soutenance — EnergieSI

**Durée cible :** 15 min de présentation + 5–10 min de questions.

## Déroulé minuté

| Temps | Partie | Contenu | Support |
|------:|--------|---------|---------|
| 0–1 min | Introduction | Contexte énergétique du numérique, enjeu environnemental/économique. | Slide 1–2 |
| 1–3 min | Problématique & objectifs | Problématique, Q1/Q2/Q3, objectifs, hypothèses H1/H2/H3. | Slide 3–4 |
| 3–5 min | Concepts | Puissance vs énergie, virtualisation, modèle de puissance. | Slide 5 |
| 5–6 min | État de l'art | 3 approches de mesure (matériel, RAPL/batterie, modèle). | Slide 6 |
| 6–8 min | Méthodologie | Protocole, scénarios, métriques, machines. | Slide 7–8 |
| 8–11 min | **Démonstration live** | Lancer une mesure temps réel, montrer le dashboard. | Application |
| 11–13 min | Résultats | Comparaisons, validation H1/H2/H3. | Slide 9–11 |
| 13–14 min | Architecture technique | Stack TS, backends énergie, BD. | Slide 12 |
| 14–15 min | Conclusion | Bilan, recommandations, perspectives. | Slide 13 |

## Démonstration (script)

1. Page **Vue d'ensemble** : KPIs + état des hypothèses.
2. Page **Temps réel** : sélectionner portable + « Charge CPU », durée 20 s, **Démarrer** → commenter la montée des jauges et de la courbe (backend affiché : RAPL/batterie/modèle).
3. Page **Comparaisons** : fixe vs portable, montée en charge VM.
4. Page **Hypothèses** : lire les verdicts générés automatiquement.
5. Page **Rapport** : télécharger le PDF en direct.

## Questions probables & réponses

| Question | Réponse |
|----------|---------|
| Comment mesurez-vous l'énergie sans wattmètre ? | RAPL (compteur CPU), batterie (`power_now`), sinon modèle calibré P_idle/P_max ; le backend est tracé. |
| Vos chiffres sont-ils fiables ? | Mesures réelles via capteurs ; chaque mesure indique son backend et son incertitude. Calibration possible avec un wattmètre. |
| Pourquoi NestJS/Next plutôt que Python ? | Choix d'ingénierie : dashboard temps réel professionnel, une seule techno, déploiement simple ; les capteurs Linux restent accessibles. |
| H2 : pourquoi un tel surcoût ? | La VM ajoute une couche logicielle et de l'activité CPU ; le surcoût croît avec la charge des invités. |
| Reproductibilité ? | Données de démonstration déterministes (`db:seed`) ; protocole et code fournis. |

## Checklist matérielle (jour J)

- [ ] `npm run setup` exécuté à l'avance.
- [ ] API + dashboard lancés (`npm run dev`).
- [ ] Navigateur sur `http://localhost:3000`.
- [ ] (Option) API lancée en `sudo` pour activer RAPL.
- [ ] PDF d'export ouvert en secours.
