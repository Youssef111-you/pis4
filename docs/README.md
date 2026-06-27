# 📚 Documentation — EnergieSI

| Document | Contenu |
|----------|---------|
| [00 — Cahier des charges](./00-cahier-des-charges.md) | Contexte, objectifs, exigences, livrables, critères d'acceptation. |
| [01 — Architecture technique](./01-architecture.md) | Couches, backends énergie, séquences, stack, extensibilité. |
| [02 — Modèle de données](./02-modele-donnees.md) | Diagramme ERD, description des tables. |
| [schema.sql](./schema.sql) | Script SQL complet (DDL). |
| [03 — Manuel utilisateur](./03-manuel-utilisateur.md) | Installation, utilisation, mesures, exports, dépannage. |
| [04 — Plan de soutenance](./04-plan-soutenance.md) | Déroulé minuté, script de démo, Q/R. |
| [05 — Rapport de recherche](./05-rapport-recherche.md) | Document académique complet. |
| [06 — Présentation](./06-presentation.md) | Trame de slides (Marp/Pandoc → PowerPoint). |
| [UML](./uml/diagrammes-uml.md) | Cas d'usage, classes, déploiement, activité. |

## Générer la présentation PowerPoint

```bash
npx @marp-team/marp-cli docs/06-presentation.md -o presentation.pptx
# ou en PDF :
npx @marp-team/marp-cli docs/06-presentation.md --pdf
```
