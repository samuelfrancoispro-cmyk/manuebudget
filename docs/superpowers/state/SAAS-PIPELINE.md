# Pipeline SaaS — Budget app

**Dernière mise à jour** : 2026-05-02

## Chantiers

| # | Chantier | Statut | Provider/Stack | Spec |
|---|---|---|---|---|
| 0 | Décisions transverses (i18n, profiles) | Spécifié ✓ | react-i18next, Supabase | `specs/2026-05-02-onboarding-wizard-design.md` §1 |
| 1 | Onboarding wizard | **En cours de planification** | — | `specs/2026-05-02-onboarding-wizard-design.md` §2 |
| 2 | Open Banking sync | En attente | GoCardless Bank Account Data | — |
| 3 | Billing & abonnements | En attente | Stripe Subscriptions + Tax | — |
| 4 | Feature gating / paywall | En attente | Supabase RLS + edge functions | — |
| 5 | Rebranding (nom, logo, identité) | En attente | skill frontend-design | — |

## Décisions post-MVP (hors pipeline actuel)

- Social login (Google/Apple)
- MFA TOTP
- Audit log (`audit_events`)
- Suppression de compte RGPD (page Paramètres)
- Analytics (Plausible ou Umami)
- Email transactionnel (Resend)

## Tiers pricing (hypothèses à valider)

| Tier | Prix mensuel | Prix annuel | Features clés |
|---|---|---|---|
| Gratuit | 0€ | 0€ | Saisie manuelle, 1-2 comptes, dashboard de base |
| Plus | ~1,99€ | ~19€ | 1 banque connectée, comptes illimités, objectifs, rapports CSV |
| Pro | ~3,99€ | ~39€ | Multi-banques, export Excel, rapports avancés |

Moins cher que tous les concurrents (Linxo ~2,99€, Bankin' ~5-7€, YNAB ~14,99$).
