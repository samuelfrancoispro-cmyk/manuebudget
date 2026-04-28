import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type {
  Categorie,
  Transaction,
  TransactionRecurrente,
  CompteEpargne,
  CompteCourant,
  MouvementEpargne,
  Objectif,
  Projet,
  AchatProjet,
  RapportCSV,
  RapportLigne,
} from "@/types";

interface State {
  loaded: boolean;
  loading: boolean;
  loadedUserId: string | null;

  categories: Categorie[];
  transactions: Transaction[];
  recurrentes: TransactionRecurrente[];
  comptesCourants: CompteCourant[];
  comptes: CompteEpargne[];
  mouvements: MouvementEpargne[];
  objectifs: Objectif[];
  projets: Projet[];
  achatsProjet: AchatProjet[];
  rapports: RapportCSV[];
  rapportLignes: RapportLigne[];

  loadAll: (userId: string) => Promise<void>;
  clearLocal: () => void;

  addCategorie: (c: Omit<Categorie, "id">) => Promise<void>;
  updateCategorie: (id: string, c: Partial<Categorie>) => Promise<void>;
  deleteCategorie: (id: string) => Promise<void>;

  addTransaction: (t: Omit<Transaction, "id">) => Promise<void>;
  updateTransaction: (id: string, t: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addRecurrente: (r: Omit<TransactionRecurrente, "id">) => Promise<void>;
  updateRecurrente: (id: string, r: Partial<TransactionRecurrente>) => Promise<void>;
  deleteRecurrente: (id: string) => Promise<void>;

  addCompteCourant: (c: Omit<CompteCourant, "id">) => Promise<void>;
  updateCompteCourant: (id: string, c: Partial<CompteCourant>) => Promise<void>;
  deleteCompteCourant: (id: string) => Promise<void>;
  setSoldeActuelCompte: (id: string, soldeActuel: number) => Promise<void>;

  addCompte: (c: Omit<CompteEpargne, "id">) => Promise<void>;
  updateCompte: (id: string, c: Partial<CompteEpargne>) => Promise<void>;
  deleteCompte: (id: string) => Promise<void>;

  addMouvement: (m: Omit<MouvementEpargne, "id">) => Promise<void>;
  updateMouvement: (id: string, m: Partial<MouvementEpargne>) => Promise<void>;
  deleteMouvement: (id: string) => Promise<void>;

  addObjectif: (o: Omit<Objectif, "id">) => Promise<void>;
  updateObjectif: (id: string, o: Partial<Objectif>) => Promise<void>;
  deleteObjectif: (id: string) => Promise<void>;

  addProjet: (p: Omit<Projet, "id">) => Promise<void>;
  updateProjet: (id: string, p: Partial<Projet>) => Promise<void>;
  deleteProjet: (id: string) => Promise<void>;

  addAchatProjet: (projetId: string, a: Omit<AchatProjet, "id" | "projetId">) => Promise<void>;
  updateAchatProjet: (id: string, a: Partial<AchatProjet>) => Promise<void>;
  deleteAchatProjet: (id: string) => Promise<void>;
  toggleAchatValide: (id: string) => Promise<void>;

  addRapport: (
    rapport: Omit<RapportCSV, "id" | "dateImport" | "totalDebit" | "totalCredit" | "nbLignes">,
    lignes: Omit<RapportLigne, "id" | "rapportId">[]
  ) => Promise<RapportCSV>;
  deleteRapport: (id: string) => Promise<void>;
}

const categoriesDefaut: Omit<Categorie, "id">[] = [
  { nom: "Salaire", type: "revenu", couleur: "#10b981" },
  { nom: "Autres revenus", type: "revenu", couleur: "#22c55e" },
  { nom: "Loyer / Crédit", type: "depense", couleur: "#ef4444" },
  { nom: "Courses", type: "depense", couleur: "#f97316" },
  { nom: "Transport", type: "depense", couleur: "#f59e0b" },
  { nom: "Loisirs", type: "depense", couleur: "#8b5cf6" },
  { nom: "Santé", type: "depense", couleur: "#06b6d4" },
  { nom: "Abonnements", type: "depense", couleur: "#6366f1" },
  { nom: "Divers", type: "depense", couleur: "#64748b" },
];

function uid(): string {
  // utilisé seulement pour l'id local "optimiste" — remplacé par l'id Supabase au retour
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Non connecté");
  return data.user.id;
}

/** Map row Supabase → type front. Comme on a utilisé des colonnes en camelCase entre quotes,
 *  les champs ont déjà les bons noms. On ignore juste user_id / created_at. */
function strip<T extends object>(row: any): T {
  const { user_id, created_at, ...rest } = row;
  return rest as T;
}

export const useStore = create<State>()((set, get) => ({
  loaded: false,
  loading: false,
  loadedUserId: null,
  categories: [],
  transactions: [],
  recurrentes: [],
  comptesCourants: [],
  comptes: [],
  mouvements: [],
  objectifs: [],
  projets: [],
  achatsProjet: [],
  rapports: [],
  rapportLignes: [],

  clearLocal: () =>
    set({
      loaded: false,
      loadedUserId: null,
      categories: [],
      transactions: [],
      recurrentes: [],
      comptesCourants: [],
      comptes: [],
      mouvements: [],
      objectifs: [],
      projets: [],
      achatsProjet: [],
      rapports: [],
      rapportLignes: [],
    }),

  loadAll: async (userId) => {
    // Reset complet avant de recharger : évite d'afficher les données du précédent user
    set({
      loading: true,
      loaded: false,
      loadedUserId: null,
      categories: [],
      transactions: [],
      recurrentes: [],
      comptesCourants: [],
      comptes: [],
      mouvements: [],
      objectifs: [],
      projets: [],
      achatsProjet: [],
      rapports: [],
      rapportLignes: [],
    });
    try {
      const [
        cats,
        ccs,
        txs,
        recs,
        cs,
        mvts,
        objs,
        projs,
        achs,
        raps,
        rapls,
      ] = await Promise.all([
        supabase.from("categories").select("*").order("nom"),
        supabase.from("comptes_courants").select("*").order("nom"),
        supabase.from("transactions").select("*").order("date", { ascending: false }),
        supabase.from("recurrentes").select("*").order("libelle"),
        supabase.from("comptes_epargne").select("*").order("nom"),
        supabase.from("mouvements").select("*").order("date", { ascending: false }),
        supabase.from("objectifs").select("*").order("nom"),
        supabase.from("projets").select("*").order("nom"),
        supabase.from("achats_projet").select("*").order("date"),
        supabase.from("rapports_csv").select("*").order("dateImport", { ascending: false }),
        supabase.from("rapport_lignes").select("*").order("date", { ascending: false }),
      ]);

      const errs = [cats, ccs, txs, recs, cs, mvts, objs, projs, achs, raps, rapls]
        .map((r) => r.error)
        .filter(Boolean);
      if (errs.length) {
        console.error("Erreurs Supabase :", errs);
      }

      let categories = (cats.data ?? []).map((r: any) => strip<Categorie>(r));
      let comptesCourants = (ccs.data ?? []).map((r: any) => strip<CompteCourant>(r));

      // Seed initial : si aucune catégorie / aucun compte courant, on crée les défauts
      if (categories.length === 0) {
        const inserts = categoriesDefaut.map((c) => ({ ...c, user_id: userId }));
        const { data, error } = await supabase
          .from("categories")
          .insert(inserts)
          .select("*");
        if (!error && data) {
          categories = data.map((r: any) => strip<Categorie>(r));
        }
      }
      if (comptesCourants.length === 0) {
        const { data, error } = await supabase
          .from("comptes_courants")
          .insert({
            user_id: userId,
            nom: "Compte courant",
            type: "perso",
            soldeInitial: 0,
            description: "Compte courant principal",
          })
          .select("*")
          .single();
        if (!error && data) {
          comptesCourants = [strip<CompteCourant>(data)];
        }
      }

      set({
        loaded: true,
        loading: false,
        loadedUserId: userId,
        categories,
        comptesCourants,
        transactions: (txs.data ?? []).map((r: any) => strip<Transaction>(r)),
        recurrentes: (recs.data ?? []).map((r: any) => strip<TransactionRecurrente>(r)),
        comptes: (cs.data ?? []).map((r: any) => strip<CompteEpargne>(r)),
        mouvements: (mvts.data ?? []).map((r: any) => strip<MouvementEpargne>(r)),
        objectifs: (objs.data ?? []).map((r: any) => strip<Objectif>(r)),
        projets: (projs.data ?? []).map((r: any) => strip<Projet>(r)),
        achatsProjet: (achs.data ?? []).map((r: any) => strip<AchatProjet>(r)),
        rapports: (raps.data ?? []).map((r: any) => strip<RapportCSV>(r)),
        rapportLignes: (rapls.data ?? []).map((r: any) => strip<RapportLigne>(r)),
      });
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },

  // ---------- Catégories ----------
  addCategorie: async (c) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from("categories")
      .insert({ ...c, user_id: userId })
      .select("*")
      .single();
    if (error || !data) throw error;
    set((s) => ({ categories: [...s.categories, strip<Categorie>(data)] }));
  },
  updateCategorie: async (id, c) => {
    const { error } = await supabase.from("categories").update(c).eq("id", id);
    if (error) throw error;
    set((s) => ({
      categories: s.categories.map((x) => (x.id === id ? { ...x, ...c } : x)),
    }));
  },
  deleteCategorie: async (id) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ categories: s.categories.filter((x) => x.id !== id) }));
  },

  // ---------- Transactions ----------
  addTransaction: async (t) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from("transactions")
      .insert({ ...t, user_id: userId })
      .select("*")
      .single();
    if (error || !data) throw error;
    set((s) => ({ transactions: [...s.transactions, strip<Transaction>(data)] }));
  },
  updateTransaction: async (id, t) => {
    const { error } = await supabase.from("transactions").update(t).eq("id", id);
    if (error) throw error;
    set((s) => ({
      transactions: s.transactions.map((x) => (x.id === id ? { ...x, ...t } : x)),
    }));
  },
  deleteTransaction: async (id) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ transactions: s.transactions.filter((x) => x.id !== id) }));
  },

  // ---------- Récurrentes ----------
  addRecurrente: async (r) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from("recurrentes")
      .insert({ ...r, user_id: userId })
      .select("*")
      .single();
    if (error || !data) throw error;
    set((s) => ({ recurrentes: [...s.recurrentes, strip<TransactionRecurrente>(data)] }));
  },
  updateRecurrente: async (id, r) => {
    const { error } = await supabase.from("recurrentes").update(r).eq("id", id);
    if (error) throw error;
    set((s) => ({
      recurrentes: s.recurrentes.map((x) => (x.id === id ? { ...x, ...r } : x)),
    }));
  },
  deleteRecurrente: async (id) => {
    const { error } = await supabase.from("recurrentes").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ recurrentes: s.recurrentes.filter((x) => x.id !== id) }));
  },

  // ---------- Comptes courants ----------
  addCompteCourant: async (c) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from("comptes_courants")
      .insert({ ...c, user_id: userId })
      .select("*")
      .single();
    if (error || !data) throw error;
    set((s) => ({ comptesCourants: [...s.comptesCourants, strip<CompteCourant>(data)] }));
  },
  updateCompteCourant: async (id, c) => {
    const { error } = await supabase.from("comptes_courants").update(c).eq("id", id);
    if (error) throw error;
    set((s) => ({
      comptesCourants: s.comptesCourants.map((x) => (x.id === id ? { ...x, ...c } : x)),
    }));
  },
  deleteCompteCourant: async (id) => {
    const { error } = await supabase.from("comptes_courants").delete().eq("id", id);
    if (error) throw error;
    // Détache localement les transactions et récurrentes orphelines
    set((s) => ({
      comptesCourants: s.comptesCourants.filter((x) => x.id !== id),
      transactions: s.transactions.map((t) =>
        t.compteCourantId === id ? { ...t, compteCourantId: undefined } : t
      ),
      recurrentes: s.recurrentes.map((r) =>
        r.compteCourantId === id ? { ...r, compteCourantId: undefined } : r
      ),
    }));
  },
  setSoldeActuelCompte: async (id, soldeActuel) => {
    const s = get();
    const compte = s.comptesCourants.find((c) => c.id === id);
    if (!compte) return;
    const auj = new Date().toISOString().slice(0, 10);
    let cumul = 0;
    for (const t of s.transactions) {
      if (t.compteCourantId !== id) continue;
      if (t.date > auj) continue;
      cumul += t.type === "revenu" ? t.montant : -t.montant;
    }
    const moisLimite = auj.slice(0, 7);
    for (const r of s.recurrentes.filter((x) => x.compteCourantId === id)) {
      const finBoucle = r.moisFin && r.moisFin < moisLimite ? r.moisFin : moisLimite;
      if (r.moisDebut > finBoucle) continue;
      let [y, m] = r.moisDebut.split("-").map(Number);
      const [yf, mf] = finBoucle.split("-").map(Number);
      const j = Math.min(Math.max(r.jourMois, 1), 28);
      while (y < yf || (y === yf && m <= mf)) {
        const date = `${y.toString().padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(j).padStart(2, "0")}`;
        if (date <= auj) cumul += r.type === "revenu" ? r.montant : -r.montant;
        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
      }
    }
    const nouveauSoldeInitial = soldeActuel - cumul;
    await get().updateCompteCourant(id, { soldeInitial: nouveauSoldeInitial });
  },

  // ---------- Comptes épargne ----------
  addCompte: async (c) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from("comptes_epargne")
      .insert({ ...c, user_id: userId })
      .select("*")
      .single();
    if (error || !data) throw error;
    set((s) => ({ comptes: [...s.comptes, strip<CompteEpargne>(data)] }));
  },
  updateCompte: async (id, c) => {
    const { error } = await supabase.from("comptes_epargne").update(c).eq("id", id);
    if (error) throw error;
    set((s) => ({
      comptes: s.comptes.map((x) => (x.id === id ? { ...x, ...c } : x)),
    }));
  },
  deleteCompte: async (id) => {
    const { error } = await supabase.from("comptes_epargne").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({
      comptes: s.comptes.filter((x) => x.id !== id),
      mouvements: s.mouvements.filter((m) => m.compteId !== id),
    }));
  },

  // ---------- Mouvements ----------
  addMouvement: async (m) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from("mouvements")
      .insert({ ...m, user_id: userId })
      .select("*")
      .single();
    if (error || !data) throw error;
    set((s) => ({ mouvements: [...s.mouvements, strip<MouvementEpargne>(data)] }));
  },
  updateMouvement: async (id, m) => {
    const { error } = await supabase.from("mouvements").update(m).eq("id", id);
    if (error) throw error;
    set((s) => ({
      mouvements: s.mouvements.map((x) => (x.id === id ? { ...x, ...m } : x)),
    }));
  },
  deleteMouvement: async (id) => {
    const { error } = await supabase.from("mouvements").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ mouvements: s.mouvements.filter((x) => x.id !== id) }));
  },

  // ---------- Objectifs ----------
  addObjectif: async (o) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from("objectifs")
      .insert({ ...o, user_id: userId })
      .select("*")
      .single();
    if (error || !data) throw error;
    set((s) => ({ objectifs: [...s.objectifs, strip<Objectif>(data)] }));
  },
  updateObjectif: async (id, o) => {
    const { error } = await supabase.from("objectifs").update(o).eq("id", id);
    if (error) throw error;
    set((s) => ({
      objectifs: s.objectifs.map((x) => (x.id === id ? { ...x, ...o } : x)),
    }));
  },
  deleteObjectif: async (id) => {
    const { error } = await supabase.from("objectifs").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ objectifs: s.objectifs.filter((x) => x.id !== id) }));
  },

  // ---------- Projets ----------
  addProjet: async (p) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from("projets")
      .insert({ ...p, user_id: userId })
      .select("*")
      .single();
    if (error || !data) throw error;
    set((s) => ({ projets: [...s.projets, strip<Projet>(data)] }));
  },
  updateProjet: async (id, p) => {
    const { error } = await supabase.from("projets").update(p).eq("id", id);
    if (error) throw error;
    set((s) => ({
      projets: s.projets.map((x) => (x.id === id ? { ...x, ...p } : x)),
    }));
  },
  deleteProjet: async (id) => {
    const { error } = await supabase.from("projets").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({
      projets: s.projets.filter((x) => x.id !== id),
      achatsProjet: s.achatsProjet.filter((a) => a.projetId !== id),
    }));
  },

  // ---------- Achats projet ----------
  addAchatProjet: async (projetId, a) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from("achats_projet")
      .insert({ ...a, projetId, user_id: userId })
      .select("*")
      .single();
    if (error || !data) throw error;
    set((s) => ({ achatsProjet: [...s.achatsProjet, strip<AchatProjet>(data)] }));
  },
  updateAchatProjet: async (id, a) => {
    const { error } = await supabase.from("achats_projet").update(a).eq("id", id);
    if (error) throw error;
    set((s) => ({
      achatsProjet: s.achatsProjet.map((x) => (x.id === id ? { ...x, ...a } : x)),
    }));
  },
  deleteAchatProjet: async (id) => {
    const { error } = await supabase.from("achats_projet").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ achatsProjet: s.achatsProjet.filter((x) => x.id !== id) }));
  },
  toggleAchatValide: async (id) => {
    const s = get();
    const a = s.achatsProjet.find((x) => x.id === id);
    if (!a) return;
    await get().updateAchatProjet(id, { valide: !a.valide });
  },

  // ---------- Rapports CSV ----------
  addRapport: async (rapport, lignes) => {
    const userId = await getUserId();
    let totalDebit = 0;
    let totalCredit = 0;
    for (const l of lignes) {
      if (l.montant < 0) totalDebit += -l.montant;
      else totalCredit += l.montant;
    }
    const { data: rapData, error: rapErr } = await supabase
      .from("rapports_csv")
      .insert({
        ...rapport,
        user_id: userId,
        totalDebit,
        totalCredit,
        nbLignes: lignes.length,
      })
      .select("*")
      .single();
    if (rapErr || !rapData) throw rapErr ?? new Error("Création rapport échouée");
    const newRap = strip<RapportCSV>(rapData);

    if (lignes.length > 0) {
      const inserts = lignes.map((l) => ({ ...l, rapportId: newRap.id, user_id: userId }));
      const { data: ligData, error: ligErr } = await supabase
        .from("rapport_lignes")
        .insert(inserts)
        .select("*");
      if (ligErr) {
        await supabase.from("rapports_csv").delete().eq("id", newRap.id);
        throw ligErr;
      }
      const newLignes = (ligData ?? []).map((r: any) => strip<RapportLigne>(r));
      set((s) => ({
        rapports: [newRap, ...s.rapports],
        rapportLignes: [...newLignes, ...s.rapportLignes],
      }));
    } else {
      set((s) => ({ rapports: [newRap, ...s.rapports] }));
    }
    return newRap;
  },

  deleteRapport: async (id) => {
    const { error } = await supabase.from("rapports_csv").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({
      rapports: s.rapports.filter((r) => r.id !== id),
      rapportLignes: s.rapportLignes.filter((l) => l.rapportId !== id),
    }));
  },
}));

// Évite TS warning
void uid;
