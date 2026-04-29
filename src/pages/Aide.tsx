import { useMemo, useState } from "react";
import { Search, ChevronDown, BookOpen } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Article = {
  id: string;
  titre: string;
  categorie: string;
  motsCles: string[];
  contenu: { sous?: string; texte: string }[];
};

const articles: Article[] = [
  {
    id: "nouvelle-structure",
    titre: "Nouvelle structure : 6 sections au lieu de 9",
    categorie: "Nouveautés",
    motsCles: ["structure", "navigation", "argent", "épargne", "menu", "regroupement"],
    contenu: [
      {
        texte:
          "L'app a été réorganisée pour aller plus vite : 6 sections principales au lieu de 9 anciennes pages éclatées.",
      },
      {
        sous: "Les 6 sections",
        texte:
          "1. Tableau de bord — vue d'ensemble interactive\n2. Argent — comptes courants, transactions ponctuelles, charges récurrentes (3 onglets)\n3. Épargne & projets — comptes d'épargne, virements automatiques, simulateur (3 onglets)\n4. Rapports CSV — import relevé bancaire\n5. Paramètres — comptes, catégories, sauvegarde\n6. Aide",
      },
      {
        sous: "Anciens liens",
        texte:
          "Les anciennes URL (/comptes, /transactions, /recurrents, /simulateur) redirigent automatiquement vers le bon onglet — tes favoris continuent de fonctionner.",
      },
    ],
  },
  {
    id: "premiers-pas",
    titre: "Premiers pas",
    categorie: "Démarrage",
    motsCles: ["début", "compte", "inscription", "login", "connexion"],
    contenu: [
      {
        texte:
          "À la première connexion, l'application crée automatiquement un compte courant nommé « Compte courant » et un jeu de catégories par défaut (Salaire, Loyer, Courses, Loisirs…). Tu peux les modifier dans Paramètres.",
      },
      {
        sous: "Étapes recommandées",
        texte:
          "1. Onglet Argent → Comptes courants : saisis ton solde actuel.\n2. Onglet Argent → Récurrents : ajoute ton salaire + tes charges fixes (loyer, abonnements).\n3. Onglet Argent → Transactions : note tes premières transactions ponctuelles.\n4. Onglet Épargne & projets → Virements automatiques : programme un virement mensuel vers ton livret.",
      },
    ],
  },
  {
    id: "comptes-courants",
    titre: "Gérer plusieurs comptes courants",
    categorie: "Comptes",
    motsCles: ["compte", "perso", "joint", "couple", "supprimer", "ajouter"],
    contenu: [
      {
        texte:
          "Tu peux avoir autant de comptes que tu veux : un perso, un joint avec ton/ta partenaire, un compte d'appoint…",
      },
      {
        sous: "Créer un compte",
        texte:
          "Ouvre Paramètres → bloc « Comptes courants » → bouton « Ajouter ». Choisis un nom, le type (Perso ou Joint) et un solde initial (laisse 0 si tu vas le saisir plus tard via « Mes comptes »).",
      },
      {
        sous: "Supprimer",
        texte:
          "L'icône poubelle supprime le compte. Les transactions et récurrents qui y étaient rattachés deviennent « non rattachés » mais ne sont pas supprimés.",
      },
    ],
  },
  {
    id: "solde-actuel",
    titre: "Saisir mon solde actuel",
    categorie: "Comptes",
    motsCles: ["solde", "actuel", "synchroniser", "banque", "réel"],
    contenu: [
      {
        texte:
          "L'onglet « Mes comptes » sert à dire à l'app combien tu as RÉELLEMENT en banque maintenant. L'app recalcule alors le solde initial pour que toutes les statistiques soient cohérentes.",
      },
      {
        sous: "Comment l'utiliser",
        texte:
          "Va dans Argent → Comptes courants → entre le montant exact lu sur ton appli bancaire → clique « Mettre à jour ». L'app additionne/soustrait toutes les transactions, récurrents et virements automatiques passés pour retrouver le bon point de départ.",
      },
    ],
  },
  {
    id: "transactions",
    titre: "Ajouter et gérer les transactions",
    categorie: "Transactions",
    motsCles: ["dépense", "revenu", "achat", "ponctuel", "ajouter"],
    contenu: [
      {
        texte:
          "Une transaction = un mouvement ponctuel (course au supermarché, restaurant, vente, prime…). Pour les mouvements qui se répètent chaque mois, utilise plutôt « Récurrents ».",
      },
      {
        sous: "Ajouter",
        texte:
          "Onglet Argent → Transactions → bouton « Ajouter ». Renseigne date, type (revenu/dépense), montant, catégorie et le compte courant rattaché.",
      },
      {
        sous: "Filtrer",
        texte:
          "Tu peux filtrer par mois, par compte ou par catégorie. La liste est triée du plus récent au plus ancien.",
      },
    ],
  },
  {
    id: "recurrents",
    titre: "Charges et revenus récurrents (fréquences flexibles)",
    categorie: "Récurrents",
    motsCles: [
      "récurrent",
      "loyer",
      "salaire",
      "abonnement",
      "mensuel",
      "hebdomadaire",
      "annuel",
      "fréquence",
      "automatique",
    ],
    contenu: [
      {
        texte:
          "Un récurrent = un mouvement qui se répète à intervalle régulier. Depuis la dernière mise à jour, tu choisis librement la fréquence : tous les jours, toutes les X semaines, tous les X mois ou tous les X ans.",
      },
      {
        sous: "Exemples concrets",
        texte:
          "• Loyer le 5 de chaque mois → fréquence Mois, intervalle 1, date début 2025-01-05\n• Salaire le 28 → fréquence Mois, intervalle 1, date début 2025-01-28\n• Courses hebdo le samedi → fréquence Semaine, intervalle 1\n• Abonnement annuel (assurance) → fréquence Année, intervalle 1\n• Cotisation tous les 2 mois → fréquence Mois, intervalle 2",
      },
      {
        sous: "Créer un récurrent",
        texte:
          "Onglet Argent → Récurrents → « Ajouter ». Renseigne libellé, montant, type, fréquence + intervalle, date de début et (optionnel) date de fin pour les crédits ou abonnements à durée limitée.",
      },
      {
        sous: "Important",
        texte:
          "Les récurrents ne créent PAS de transactions individuelles : ils sont calculés à la volée et apparaissent partout (dashboard, soldes, rapports). Si le montant change, modifie le récurrent — pas besoin de retoucher chaque mois.",
      },
      {
        sous: "Migration v2",
        texte:
          "Les anciens récurrents (jour du mois + mois de début/fin) ont été automatiquement convertis vers le nouveau format. Tu n'as rien à faire.",
      },
    ],
  },
  {
    id: "virements-auto",
    titre: "Virements automatiques vers l'épargne",
    categorie: "Récurrents",
    motsCles: [
      "virement",
      "épargne",
      "automatique",
      "livret",
      "transfert",
      "compte courant",
      "récurrent",
    ],
    contenu: [
      {
        texte:
          "Un virement automatique simule un transfert régulier de l'un de tes comptes courants vers un compte épargne. L'app le déduit automatiquement du compte source et l'ajoute au compte épargne, à la fréquence choisie.",
      },
      {
        sous: "Cas d'usage",
        texte:
          "• 100 €/mois du compte courant vers le Livret A le 1er\n• 50 €/semaine vers une cagnotte vacances\n• Versement annuel sur l'assurance vie en début d'année",
      },
      {
        sous: "Créer un virement automatique",
        texte:
          "Onglet Épargne & projets → « Virements automatiques » → « Ajouter ». Renseigne libellé, compte courant source, compte épargne destinataire, montant, fréquence, intervalle et date de début.",
      },
      {
        sous: "Effet sur les calculs",
        texte:
          "Le virement apparaît comme une dépense sur le compte courant (réduisant son solde et le reste à vivre du mois) ET comme un versement sur le compte épargne (augmentant le solde épargne). Le total reste cohérent : ton patrimoine global ne change pas, seule la répartition courant ↔ épargne évolue.",
      },
    ],
  },
  {
    id: "epargne",
    titre: "Comptes d'épargne et intérêts",
    categorie: "Épargne",
    motsCles: ["épargne", "livret", "intérêt", "versement", "retrait"],
    contenu: [
      {
        texte:
          "L'onglet « Épargne » te permet de suivre Livret A, LDDS, assurance vie… avec leur taux annuel pour estimer les intérêts.",
      },
      {
        sous: "Créer un compte épargne",
        texte:
          "Épargne & projets → onglet « Comptes & objectifs » → « Nouveau compte ». Renseigne nom, solde initial et taux annuel (en %). Ex : Livret A à 3 %.",
      },
      {
        sous: "Mouvements",
        texte:
          "Sur chaque compte, ajoute des « versements » manuels ou « retraits ». L'app projette le capital avec capitalisation mensuelle pour estimer les intérêts à venir.",
      },
      {
        sous: "Et les virements automatiques ?",
        texte:
          "Pour des transferts réguliers (ex : 100 €/mois vers le Livret A), utilise l'onglet « Virements automatiques » plutôt que de saisir un mouvement manuel chaque mois. Voir l'article dédié.",
      },
    ],
  },
  {
    id: "simulateur",
    titre: "Simulateur de projet (achats par achats)",
    categorie: "Projets",
    motsCles: ["projet", "simulation", "achat", "devis", "voyage", "voiture", "cuisine"],
    contenu: [
      {
        texte:
          "Le simulateur a deux modes : une simulation d'épargne rapide (combien de temps pour atteindre 20 000 € en versant 300 €/mois ?) et un mode « projet enregistré » où tu listes chaque achat un par un.",
      },
      {
        sous: "Simulation rapide",
        texte:
          "Épargne & projets → onglet « Simulateur & projets » → sous-onglet « Simulation d'épargne ». Joue avec les valeurs (cible, apport, versement, taux). Le résultat se met à jour en direct. Tu peux enregistrer le projet pour le retrouver plus tard.",
      },
      {
        sous: "Projet avec achats",
        texte:
          "Sous-onglet « Projets & achats » → ouvre un projet → bouton « Gérer les achats ». Pour chaque devis ou achat (cuisine, électroménager, billets…), saisis libellé, montant, date prévue, et coche « Effectué » quand c'est payé. Le cumul des achats te donne le coût RÉEL du projet.",
      },
    ],
  },
  {
    id: "rapports-csv",
    titre: "Importer un relevé bancaire (CSV)",
    categorie: "Rapports CSV",
    motsCles: ["csv", "import", "relevé", "banque", "rapport", "analyse", "camembert"],
    contenu: [
      {
        texte:
          "L'onglet « Rapports » permet d'importer le CSV de relevé téléchargé depuis ton appli bancaire et d'obtenir une analyse automatique : camembert par catégorie, top dépenses, abonnements détectés et pistes d'économies.",
      },
      {
        sous: "Banques compatibles",
        texte:
          "TOUTES les banques. L'import détecte automatiquement le séparateur (; , tab |), l'encodage (UTF-8 / Windows-1252), le format des dates (JJ/MM/AAAA, AAAA-MM-JJ…), le format des montants (FR « 1 234,56 » ou US « 1,234.56 ») et identifie les colonnes Date / Libellé / Montant par mots-clés FR + EN.",
      },
      {
        sous: "Comment importer",
        texte:
          "Onglet « Rapports » → bouton « Importer CSV » → choisis ton fichier. Si l'app reconnaît le format (confiance ≥ 80 %), elle te montre directement l'aperçu. Sinon une fenêtre d'ajustement s'ouvre pour mapper manuellement les colonnes.",
      },
      {
        sous: "Si la détection se trompe",
        texte:
          "Dans la fenêtre d'aperçu, clique « Ajuster le mapping » : tu peux corriger la colonne Date, Libellé, Montant (ou Débit/Crédit séparés), changer le format de date, le séparateur, etc. L'aperçu se met à jour en direct.",
      },
    ],
  },
  {
    id: "rapports-profils",
    titre: "Profils de banque (mapping mémorisé)",
    categorie: "Rapports CSV",
    motsCles: ["profil", "banque", "mapping", "mémoriser", "automatique", "fingerprint"],
    contenu: [
      {
        texte:
          "Dès qu'un format CSV a été ajusté manuellement une fois, tu peux le sauvegarder comme « profil de banque ». Les imports suivants avec les mêmes colonnes seront alors reconnus et importés automatiquement.",
      },
      {
        sous: "Sauvegarder un profil",
        texte:
          "Dans la fenêtre d'ajustement du mapping, coche « Sauvegarder ce mapping comme profil » et donne-lui un nom (ex : « BNP Paribas perso », « Boursorama »). Les profils sont stockés sur ton compte Supabase — vider le cache navigateur ne les efface pas, et ils sont disponibles depuis tous tes appareils.",
      },
      {
        sous: "Gérer les profils",
        texte:
          "Onglet « Rapports » → bouton « Profils ». Tu vois la liste de tes profils sauvegardés avec un résumé (stratégie montant, format date, séparateur). Le bouton poubelle supprime un profil.",
      },
      {
        sous: "Astuce",
        texte:
          "Un profil = une empreinte des en-têtes du CSV. Si ta banque change le nom d'une colonne dans son export, l'empreinte change et le profil ne sera plus reconnu — il faudra le ré-ajuster une fois et le sauvegarder à nouveau.",
      },
    ],
  },
  {
    id: "objectifs",
    titre: "Objectifs d'épargne",
    categorie: "Épargne",
    motsCles: ["objectif", "but", "cible", "atteindre"],
    contenu: [
      {
        texte:
          "Un objectif = un montant cible avec une date optionnelle, rattaché ou non à un compte épargne précis. Sert à visualiser une progression (« 5 000 € pour les vacances en juillet »).",
      },
      {
        sous: "Créer",
        texte:
          "Épargne & projets → onglet « Comptes & objectifs » → section Objectifs → « Ajouter ». Si tu rattaches l'objectif à un compte épargne, la barre de progression utilise le solde du compte (incluant les virements automatiques).",
      },
    ],
  },
  {
    id: "categories",
    titre: "Personnaliser les catégories",
    categorie: "Paramètres",
    motsCles: ["catégorie", "couleur", "modifier", "supprimer"],
    contenu: [
      {
        texte:
          "Les catégories servent à classer revenus et dépenses. Chaque catégorie a un type (revenu/dépense) et une couleur (utilisée dans les graphiques du tableau de bord).",
      },
      {
        sous: "Ajouter / supprimer",
        texte:
          "Paramètres → bloc « Catégories ». Tu ne peux pas supprimer une catégorie utilisée par des transactions ou des récurrents : il faut d'abord les rattacher à une autre catégorie.",
      },
    ],
  },
  {
    id: "tableau-bord",
    titre: "Lire le tableau de bord",
    categorie: "Démarrage",
    motsCles: [
      "dashboard",
      "tableau",
      "statistique",
      "reste à vivre",
      "graphique",
      "prévisions",
      "sparkline",
      "comparaison",
    ],
    contenu: [
      {
        texte:
          "Le tableau de bord est la vue centrale de l'app. Filtre par compte et par mois en haut à droite. Toutes les valeurs reflètent : transactions ponctuelles + récurrentes + virements automatiques.",
      },
      {
        sous: "KPI cliquables (4 cartes du haut)",
        texte:
          "Revenus / Dépenses / Reste à vivre / Solde compte. Chaque carte affiche en plus une comparaison avec le mois précédent (vs N-1 ±%). Cliquer sur Revenus ou Dépenses ouvre les transactions, cliquer sur Solde compte ouvre la liste des comptes.",
      },
      {
        sous: "Évolution 6 mois",
        texte:
          "Courbe du solde des comptes courants sur les 6 derniers mois (mois sélectionné inclus). Permet de voir la tendance : tu épargnes ou tu grignotes ?",
      },
      {
        sous: "Prévisions 3 mois",
        texte:
          "Bar chart des 3 prochains mois basé sur les récurrentes + virements automatiques (les transactions ponctuelles ne sont pas extrapolées). Indique si tu vas être positif ou négatif.",
      },
      {
        sous: "Prochaines échéances",
        texte:
          "Les 5 prochaines occurrences (récurrentes + virements) classées par date. Indique combien de jours te séparent de chacune et le compte concerné. Cliquer sur une ligne ouvre l'écran de gestion correspondant.",
      },
      {
        sous: "Reste à vivre",
        texte:
          "Revenus − Dépenses du mois (incluant virements automatiques considérés comme dépenses du compte courant). Si négatif, tu dépenses plus que tu ne gagnes ce mois.",
      },
    ],
  },
  {
    id: "connectivite",
    titre: "Comment tout est connecté",
    categorie: "Nouveautés",
    motsCles: [
      "synchronisation",
      "connectivité",
      "harmonie",
      "cohérent",
      "lien",
      "cumul",
    ],
    contenu: [
      {
        texte:
          "Toutes les données circulent : aucune saisie n'est isolée. Comprends une fois, profite partout.",
      },
      {
        sous: "Une transaction ponctuelle…",
        texte:
          "…apparaît sur Argent > Transactions, modifie le solde du compte courant rattaché, change le KPI Dépenses/Revenus du dashboard, alimente le camembert par catégorie et l'export CSV.",
      },
      {
        sous: "Un récurrent…",
        texte:
          "…n'est saisi qu'une fois. Il génère des transactions virtuelles à la volée pour le bon mois, modifiant Reste à vivre, soldes, prévisions, prochaines échéances, total mensuel par catégorie.",
      },
      {
        sous: "Un virement automatique…",
        texte:
          "…sort du compte courant choisi (impact dépenses + solde courant) ET entre sur le compte épargne (impact total épargne + barre d'objectif). Visible dans Argent > Récurrents (côté courant) ET dans Épargne > Virements (côté config).",
      },
      {
        sous: "Saisie de solde réel",
        texte:
          "Quand tu ajustes le solde réel d'un compte (Argent > Comptes courants), l'app recalcule le solde initial pour que toutes les statistiques passées et futures restent cohérentes — sans rien perdre.",
      },
    ],
  },
  {
    id: "export",
    titre: "Exporter mes données",
    categorie: "Paramètres",
    motsCles: ["export", "sauvegarde", "json", "backup"],
    contenu: [
      {
        texte:
          "Tes données sont synchronisées dans le cloud (Supabase) et accessibles depuis tous tes appareils en te connectant avec tes identifiants. Tu peux quand même télécharger une copie locale.",
      },
      {
        sous: "Exporter",
        texte:
          "Paramètres → bloc « Sauvegarde des données » → « Exporter en JSON ». Un fichier `budget-export-AAAA-MM-JJ.json` est téléchargé. Garde-le dans un dossier sécurisé.",
      },
    ],
  },
  {
    id: "theme",
    titre: "Mode sombre / mode clair",
    categorie: "Astuces",
    motsCles: ["thème", "dark", "light", "sombre", "clair", "couleur"],
    contenu: [
      {
        texte:
          "L'icône soleil/lune en bas de la barre latérale (ou en haut sur mobile) bascule entre clair et sombre. Le choix est mémorisé.",
      },
    ],
  },
  {
    id: "mobile",
    titre: "Utilisation sur téléphone",
    categorie: "Astuces",
    motsCles: ["mobile", "téléphone", "smartphone", "tablette", "responsive"],
    contenu: [
      {
        texte:
          "L'application est responsive : sur mobile, tu as une barre du haut avec un bouton menu (☰) qui ouvre le menu latéral. Toutes les fonctions sont identiques.",
      },
      {
        sous: "Astuce",
        texte:
          "Tu peux ajouter le site à ton écran d'accueil (Safari → Partager → « Sur l'écran d'accueil » / Chrome → ⋮ → « Ajouter à l'écran d'accueil »). Il s'ouvrira comme une vraie app.",
      },
    ],
  },
  {
    id: "synchro",
    titre: "Synchronisation entre appareils",
    categorie: "Astuces",
    motsCles: ["synchro", "cloud", "appareil", "ordinateur", "mobile", "partager"],
    contenu: [
      {
        texte:
          "Tes données sont stockées dans le cloud sécurisé (Supabase). Connecte-toi avec le même email/mot de passe sur autant d'appareils que tu veux : tu retrouves les mêmes infos partout.",
      },
      {
        sous: "Sécurité",
        texte:
          "Personne d'autre ne peut voir tes données : chaque utilisateur ne peut lire QUE ses propres lignes (Row Level Security côté base).",
      },
    ],
  },
  {
    id: "deconnexion",
    titre: "Se déconnecter",
    categorie: "Démarrage",
    motsCles: ["déconnexion", "logout", "fermer", "session"],
    contenu: [
      {
        texte:
          "En bas de la barre latérale (ou dans le menu mobile), bouton « Se déconnecter ». La prochaine connexion te ramènera sur la page de login.",
      },
    ],
  },
];

export default function AidePage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const filtres = useMemo(() => {
    const r = q.trim().toLowerCase();
    if (!r) return articles;
    return articles.filter((a) => {
      const blob = [
        a.titre,
        a.categorie,
        ...a.motsCles,
        ...a.contenu.flatMap((c) => [c.sous ?? "", c.texte]),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(r);
    });
  }, [q]);

  const groupes = useMemo(() => {
    const m = new Map<string, Article[]>();
    for (const a of filtres) {
      if (!m.has(a.categorie)) m.set(a.categorie, []);
      m.get(a.categorie)!.push(a);
    }
    return [...m.entries()];
  }, [filtres]);

  return (
    <>
      <PageHeader
        title="Aide"
        description="Tutoriels et explications sur toutes les fonctionnalités de l'application."
      />

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher dans l'aide (ex : loyer, épargne, supprimer un compte…)"
          className="pl-9"
        />
      </div>

      {filtres.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            <BookOpen className="mx-auto mb-2 h-6 w-6 opacity-50" />
            Aucun article ne correspond à « {q} ». Essaie un autre mot-clé.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupes.map(([cat, list]) => (
            <section key={cat}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {cat}
              </h2>
              <div className="space-y-2">
                {list.map((a) => {
                  const ouvert = open === a.id || q.trim().length > 0;
                  return (
                    <Card key={a.id} className="overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setOpen(open === a.id ? null : a.id)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-accent/50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{a.titre}</span>
                          <Badge variant="outline" className="hidden sm:inline-flex">
                            {a.categorie}
                          </Badge>
                        </div>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                            ouvert && "rotate-180"
                          )}
                        />
                      </button>
                      {ouvert && (
                        <CardContent className="space-y-3 border-t pt-3 text-sm">
                          {a.contenu.map((bloc, i) => (
                            <div key={i}>
                              {bloc.sous && (
                                <div className="mb-1 font-medium">{bloc.sous}</div>
                              )}
                              <p className="whitespace-pre-line text-muted-foreground">
                                {bloc.texte}
                              </p>
                            </div>
                          ))}
                          {a.motsCles.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {a.motsCles.map((mc) => (
                                <Badge key={mc} variant="secondary" className="text-[10px]">
                                  {mc}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
