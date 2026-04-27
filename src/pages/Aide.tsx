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
          "1. Va dans « Mes comptes » et saisis ton solde actuel.\n2. Va dans « Récurrents » et ajoute ton salaire + tes charges fixes (loyer, abonnements).\n3. Note tes premières transactions ponctuelles dans « Transactions ».",
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
          "Va dans « Mes comptes » → entre le montant exact lu sur ton appli bancaire → clique « Mettre à jour ». L'app additionne/soustrait toutes les transactions et récurrents passés pour retrouver le bon point de départ.",
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
          "Onglet « Transactions » → bouton « Ajouter ». Renseigne date, type (revenu/dépense), montant, catégorie et le compte courant rattaché.",
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
    titre: "Charges et revenus récurrents",
    categorie: "Récurrents",
    motsCles: ["récurrent", "loyer", "salaire", "abonnement", "mensuel", "automatique"],
    contenu: [
      {
        texte:
          "Un récurrent = un mouvement qui tombe le même jour chaque mois (loyer le 5, salaire le 28, abonnement Netflix le 15…). Tu le saisis UNE FOIS et l'app l'ajoute automatiquement chaque mois dans tes calculs.",
      },
      {
        sous: "Créer un récurrent",
        texte:
          "Onglet « Récurrents » → « Ajouter ». Choisis libellé, montant, type, jour du mois (1-28), mois de début, et éventuellement un mois de fin (utile pour un crédit qui se termine).",
      },
      {
        sous: "Important",
        texte:
          "Les récurrents ne créent PAS de transactions individuelles : ils sont calculés à la volée. Tu n'as donc rien à faire chaque mois — juste à les modifier si le montant change.",
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
          "« Épargne » → « Nouveau compte ». Renseigne nom, solde initial et taux annuel (en %). Ex : Livret A à 3 %.",
      },
      {
        sous: "Mouvements",
        texte:
          "Sur chaque compte, ajoute des « versements » (de ton compte courant vers l'épargne) ou « retraits ». L'app projette le capital avec capitalisation mensuelle pour estimer les intérêts à venir.",
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
          "Onglet « Simulation d'épargne » → joue avec les valeurs (cible, apport, versement, taux). Le résultat se met à jour en direct. Tu peux enregistrer le projet pour le retrouver plus tard.",
      },
      {
        sous: "Projet avec achats",
        texte:
          "Onglet « Projets & achats » → ouvre un projet → bouton « Gérer les achats ». Pour chaque devis ou achat (cuisine, électroménager, billets…), saisis libellé, montant, date prévue, et coche « Effectué » quand c'est payé. Le cumul des achats te donne le coût RÉEL du projet.",
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
          "Va dans l'onglet Épargne, section Objectifs → « Ajouter ». Si tu rattaches l'objectif à un compte épargne, la barre de progression utilise le solde de ce compte.",
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
    motsCles: ["dashboard", "tableau", "statistique", "reste à vivre", "graphique"],
    contenu: [
      {
        texte:
          "Le tableau de bord affiche par mois : revenus, dépenses, reste à vivre (revenus − dépenses), solde des comptes, répartition par catégorie. Tu peux changer le mois affiché.",
      },
      {
        sous: "Reste à vivre",
        texte:
          "C'est ce qui te reste après avoir payé toutes tes charges (récurrentes + transactions du mois). Si négatif, tu dépenses plus que tu ne gagnes ce mois-ci.",
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
