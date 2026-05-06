# Spec : Landing page + Auth flow + Renommage Fluxo

Date : 2026-05-05

## Objectif

Remplacer l'affichage direct de la page Login par un site public avec landing page,
renommer l'app "Fluxo", et s'assurer que le flux signup → onboarding → dashboard
fonctionne sans intervention manuelle côté Supabase.

## Périmètre

1. Renommer "Budget" → "Fluxo" partout (i18n, index.html, manifest, meta)
2. Landing page publique à `/`
3. Page auth à `/login` (signin + signup via `?mode=`)
4. Routing `!user` mis à jour dans `App.tsx`
5. SEO : meta tags, OG, structured data minimal

## 1. Renommage "Fluxo"

Fichiers à modifier :
- `index.html` : `<title>`, `apple-mobile-web-app-title`
- `public/manifest.json` (si existant) : `name`, `short_name`
- `src/locales/fr.json` + `en.json` : clé `nav.appName`
- `src/pages/Login.tsx` : logo/titre (utilise déjà `t("nav.appName")`)

## 2. Landing page — `src/pages/Landing.tsx`

Contenu :
- Header : logo (icône Wallet) + "Fluxo"
- Hero : tagline FR = "Gérez votre budget, simplement." / EN = "Budget management, made simple."
- 3 arguments en ligne d'icônes : "Tout en un" / "Accessible" / "Sécurisé"
- 2 CTA primaires : "Créer un compte" → `/login?mode=signup` | "Se connecter" → `/login?mode=signin`
- Footer : © 2026 Fluxo — lien Aide

Style : sobre, Tailwind, mode sombre auto, responsive mobile-first.
Pas de carousel, pas d'animation complexe.

## 3. Page Auth — `src/pages/Login.tsx`

Modification minimale :
- Lire `useSearchParams()` pour initialiser `mode` depuis `?mode=signin|signup`
- Comportement existant (toggle signin/signup) conservé

Flux post-signup :
- Supabase signUp → session immédiate si email confirm désactivé → `profile.onboardingCompleted = false` → redirect `/onboarding` automatique via `App.tsx`
- Si email confirm activé → message toast "Vérifie tes mails" (comportement actuel conservé)

## 4. Routing App.tsx — état `!user`

```
/          → <Landing />
/login     → <LoginPage />
*          → <Navigate to="/" />
```

## 5. SEO — index.html

Ajouter :
- `<meta name="description" content="Fluxo – gérez votre budget personnel simplement. Suivi des comptes, dépenses récurrentes, épargne." />`
- `<meta property="og:title" content="Fluxo" />`
- `<meta property="og:description" content="..." />`
- `<meta property="og:type" content="website" />`
- `<link rel="canonical" href="https://fluxo.fr" />` (à adapter selon domaine final)
- `<meta name="robots" content="index, follow" />`

## Prérequis Supabase (action manuelle)

Pour auto-login sans mail de confirmation :
Dashboard Supabase → Authentication → Email → désactiver "Enable email confirmations"

## Hors périmètre

- SSR / prerendering (ajouté plus tard si SEO insuffisant)
- Reset password
- Auth sociale (Google, etc.)
- Sitemap.xml / robots.txt (ajouté lors du déploiement)
