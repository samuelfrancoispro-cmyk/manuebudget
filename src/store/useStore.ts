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
  BankProfile,
  VirementRecurrent,
  ActifBoursier,
  Profile,
} from "@/types";
import type { DashboardPage, DashboardWidget, WidgetType, WidgetColSpan, WidgetRowSpan } from "@/types";

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
  bankProfiles: BankProfile[];
  virementsRecurrents: VirementRecurrent[];
  actifs: ActifBoursier[];

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

  /** Profils CSV banques sauvegardés (un par fingerprint d'en-têtes). Upsert si même fingerprint. */
  saveBankProfile: (p: Omit<BankProfile, "id">) => Promise<BankProfile>;
  deleteBankProfile: (id: string) => Promise<void>;

  addVirementRecurrent: (v: Omit<VirementRecurrent, "id">) => Promise<void>;
  updateVirementRecurrent: (id: string, v: Partial<VirementRecurrent>) => Promise<void>;
  deleteVirementRecurrent: (id: string) => Promise<void>;

  addActif: (a: Omit<ActifBoursier, "id">) => Promise<void>;
  updateActif: (id: string, a: Partial<ActifBoursier>) => Promise<void>;
  deleteActif: (id: string) => Promise<void>;

  profile: Profile | null;
  loadProfile: (userId: string) => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  setOnboardingStep: (step: number) => Promise<void>;
  completeOnboarding: () => Promise<void>;

  // === Workspace ===
  dashboardPages: DashboardPage[];
  dashboardWidgets: DashboardWidget[];

  loadWorkspace: (userId: string) => Promise<void>;
  seedDefaultWorkspace: (userId: string) => Promise<void>;

  addPage: (name: string) => Promise<DashboardPage>;
  renamePage: (id: string, name: string) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  reorderPages: (ids: string[]) => Promise<void>;

  addWidget: (pageId: string, widgetType: WidgetType, colSpan?: WidgetColSpan, rowSpan?: WidgetRowSpan) => Promise<DashboardWidget>;
  removeWidget: (id: string) => Promise<void>;
  reorderWidgets: (pageId: string, orderedIds: string[]) => Promise<void>;
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
  bankProfiles: [],
  virementsRecurrents: [],
  actifs: [],
  profile: null,
  dashboardPages: [],
  dashboardWidgets: [],

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
      bankProfiles: [],
      virementsRecurrents: [],
      actifs: [],
      profile: null,
      dashboardPages: [],
      dashboardWidgets: [],
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
      bankProfiles: [],
      virementsRecurrents: [],
      actifs: [],
      dashboardPages: [],
      dashboardWidgets: [],
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
        bps,
        virs,
        acts,
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
        supabase.from("bank_profiles").select("*").order("nom"),
        supabase.from("virements_recurrents").select("*").order("libelle"),
        supabase.from("actifs_boursier").select("*").order("nom"),
      ]);

      const errs = [cats, ccs, txs, recs, cs, mvts, objs, projs, achs, raps, rapls, bps, virs, acts]
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
      // Charger ou créer le profil
      let profile: Profile | null = null;
      const { data: profRow } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profRow) {
        profile = strip<Profile>(profRow);
      } else {
        const { data: newProf } = await supabase
          .from("profiles")
          .insert({ user_id: userId })
          .select("*")
          .single();
        profile = newProf ? strip<Profile>(newProf) : null;
      }

      // Migration : utilisateurs existants (ont déjà des comptes) → onboarding auto-complété
      if (profile && !profile.onboardingCompleted && comptesCourants.length > 0) {
        await supabase
          .from("profiles")
          .update({ "onboardingCompleted": true, "onboardingStep": 6 })
          .eq("user_id", userId);
        profile = { ...profile, onboardingCompleted: true, onboardingStep: 6 };
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
        bankProfiles: (bps.data ?? []).map((r: any) => strip<BankProfile>(r)),
        virementsRecurrents: (virs.data ?? []).map((r: any) => strip<VirementRecurrent>(r)),
        actifs: (acts.data ?? []).map((r: any) => strip<ActifBoursier>(r)),
        profile,
      });

      // Charger le workspace (pages + widgets), seed si vide
      await get().loadWorkspace(userId);
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
    // Supprime les virements automatiques rattachés à ce compte courant
    await supabase.from("virements_recurrents").delete().eq("compteCourantId", id);
    // Détache localement les transactions et récurrentes orphelines, retire les virements
    set((s) => ({
      comptesCourants: s.comptesCourants.filter((x) => x.id !== id),
      transactions: s.transactions.map((t) =>
        t.compteCourantId === id ? { ...t, compteCourantId: undefined } : t
      ),
      recurrentes: s.recurrentes.map((r) =>
        r.compteCourantId === id ? { ...r, compteCourantId: undefined } : r
      ),
      virementsRecurrents: s.virementsRecurrents.filter((v) => v.compteCourantId !== id),
    }));
  },
  setSoldeActuelCompte: async (id, soldeActuel) => {
    const s = get();
    const compte = s.comptesCourants.find((c) => c.id === id);
    if (!compte) return;
    const auj = new Date().toISOString().slice(0, 10);
    // Principe simple : on fixe dateReference = aujourd'hui + soldeInitial = soldeActuel.
    // Tout ce qui est <= aujourd'hui devient historique, tout ce qui est > impacte le solde.
    await get().updateCompteCourant(id, {
      soldeInitial: soldeActuel,
      dateReference: auj,
    });
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
    // Supprime virements automatiques visant ce compte épargne + actifs boursiers liés
    await supabase.from("virements_recurrents").delete().eq("compteEpargneId", id);
    await supabase.from("actifs_boursier").delete().eq("compteId", id);
    set((s) => ({
      comptes: s.comptes.filter((x) => x.id !== id),
      mouvements: s.mouvements.filter((m) => m.compteId !== id),
      virementsRecurrents: s.virementsRecurrents.filter((v) => v.compteEpargneId !== id),
      actifs: s.actifs.filter((a) => a.compteId !== id),
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

  // ---------- Profils CSV banques ----------
  saveBankProfile: async (p) => {
    const userId = await getUserId();
    // upsert sur (user_id, fingerprint) — un format CSV donné = un seul profil par user
    const { data, error } = await supabase
      .from("bank_profiles")
      .upsert(
        { ...p, user_id: userId },
        { onConflict: "user_id,fingerprint" }
      )
      .select("*")
      .single();
    if (error || !data) throw error ?? new Error("Sauvegarde profil échouée");
    const profile = strip<BankProfile>(data);
    set((s) => {
      const existing = s.bankProfiles.findIndex((x) => x.fingerprint === profile.fingerprint);
      const next = [...s.bankProfiles];
      if (existing >= 0) next[existing] = profile;
      else next.push(profile);
      return { bankProfiles: next };
    });
    return profile;
  },

  deleteBankProfile: async (id) => {
    const { error } = await supabase.from("bank_profiles").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ bankProfiles: s.bankProfiles.filter((p) => p.id !== id) }));
  },

  // ---------- Virements récurrents ----------
  addVirementRecurrent: async (v) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from("virements_recurrents")
      .insert({ ...v, user_id: userId })
      .select("*")
      .single();
    if (error || !data) throw error;
    set((s) => ({
      virementsRecurrents: [...s.virementsRecurrents, strip<VirementRecurrent>(data)],
    }));
  },
  updateVirementRecurrent: async (id, v) => {
    const { error } = await supabase.from("virements_recurrents").update(v).eq("id", id);
    if (error) throw error;
    set((s) => ({
      virementsRecurrents: s.virementsRecurrents.map((x) =>
        x.id === id ? { ...x, ...v } : x
      ),
    }));
  },
  deleteVirementRecurrent: async (id) => {
    const { error } = await supabase.from("virements_recurrents").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({
      virementsRecurrents: s.virementsRecurrents.filter((x) => x.id !== id),
    }));
  },

  // ---------- Actifs boursiers ----------
  addActif: async (a) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from("actifs_boursier")
      .insert({ ...a, user_id: userId })
      .select("*")
      .single();
    if (error || !data) throw error;
    set((s) => ({ actifs: [...s.actifs, strip<ActifBoursier>(data)] }));
  },
  updateActif: async (id, a) => {
    const { error } = await supabase.from("actifs_boursier").update(a).eq("id", id);
    if (error) throw error;
    set((s) => ({
      actifs: s.actifs.map((x) => (x.id === id ? { ...x, ...a } : x)),
    }));
  },
  deleteActif: async (id) => {
    const { error } = await supabase.from("actifs_boursier").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ actifs: s.actifs.filter((x) => x.id !== id) }));
  },

  // ---------- Profil utilisateur ----------
  loadProfile: async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) set((s) => ({ ...s, profile: strip<Profile>(data) }));
  },

  updateProfile: async (data: Partial<Profile>) => {
    const userId = await getUserId();
    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("user_id", userId);
    if (error) throw error;
    set((s) => ({ ...s, profile: s.profile ? { ...s.profile, ...data } : null }));
  },

  setOnboardingStep: async (step: number) => {
    const userId = await getUserId();
    await supabase
      .from("profiles")
      .update({ "onboardingStep": step })
      .eq("user_id", userId);
    set((s) => ({ ...s, profile: s.profile ? { ...s.profile, onboardingStep: step } : null }));
  },

  completeOnboarding: async () => {
    const userId = await getUserId();
    await supabase
      .from("profiles")
      .update({ "onboardingCompleted": true, "onboardingStep": 7 })
      .eq("user_id", userId);
    set((s) => ({
      ...s,
      profile: s.profile ? { ...s.profile, onboardingCompleted: true, onboardingStep: 7 } : null,
    }));
  },

  // ---------- Workspace ----------
  loadWorkspace: async (userId) => {
    const [pages, widgets] = await Promise.all([
      supabase.from("dashboard_pages").select("*").eq("user_id", userId).order('"order"'),
      supabase.from("dashboard_widgets").select("*").eq("user_id", userId).order('"order"'),
    ]);
    const parsedPages: DashboardPage[] = (pages.data ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      order: r.order,
      isDefault: r.is_default,
    }));
    const parsedWidgets: DashboardWidget[] = (widgets.data ?? []).map((r: any) => ({
      id: r.id,
      pageId: r.page_id,
      widgetType: r.widget_type as WidgetType,
      colSpan: r.col_span as WidgetColSpan,
      rowSpan: r.row_span as WidgetRowSpan,
      order: r.order,
      config: r.config ?? {},
    }));
    set({ dashboardPages: parsedPages, dashboardWidgets: parsedWidgets });
    if (parsedPages.length === 0) {
      await get().seedDefaultWorkspace(userId);
    }
  },

  seedDefaultWorkspace: async (userId) => {
    const { data: pageData, error: pageErr } = await supabase
      .from("dashboard_pages")
      .insert({ user_id: userId, name: "Accueil", order: 0, is_default: true })
      .select("*")
      .single();
    if (pageErr || !pageData) return;
    const pageId = pageData.id;

    const defaultWidgets: Array<{ widget_type: WidgetType; col_span: number; row_span: number; order: number }> = [
      { widget_type: "kpi_solde", col_span: 2, row_span: 1, order: 0 },
      { widget_type: "kpi_epargne", col_span: 2, row_span: 1, order: 1 },
      { widget_type: "kpi_previsionnel", col_span: 2, row_span: 1, order: 2 },
      { widget_type: "kpi_mensuel", col_span: 2, row_span: 1, order: 3 },
      { widget_type: "chart_evolution", col_span: 2, row_span: 2, order: 4 },
      { widget_type: "chart_forecast", col_span: 2, row_span: 2, order: 5 },
      { widget_type: "list_prochaines", col_span: 2, row_span: 1, order: 6 },
      { widget_type: "chart_categories", col_span: 2, row_span: 1, order: 7 },
      { widget_type: "list_objectifs", col_span: 4, row_span: 1, order: 8 },
    ];

    const inserts = defaultWidgets.map((w) => ({
      ...w,
      page_id: pageId,
      user_id: userId,
      config: {},
    }));

    const { data: wData } = await supabase
      .from("dashboard_widgets")
      .insert(inserts)
      .select("*");

    const parsedPage: DashboardPage = {
      id: pageData.id,
      name: pageData.name,
      order: pageData.order,
      isDefault: pageData.is_default,
    };
    const parsedWidgets: DashboardWidget[] = (wData ?? []).map((r: any) => ({
      id: r.id,
      pageId: r.page_id,
      widgetType: r.widget_type as WidgetType,
      colSpan: r.col_span as WidgetColSpan,
      rowSpan: r.row_span as WidgetRowSpan,
      order: r.order,
      config: r.config ?? {},
    }));

    set({ dashboardPages: [parsedPage], dashboardWidgets: parsedWidgets });
  },

  addPage: async (name) => {
    const userId = await getUserId();
    const { dashboardPages } = get();
    const nextOrder = dashboardPages.length;
    const { data, error } = await supabase
      .from("dashboard_pages")
      .insert({ user_id: userId, name, order: nextOrder, is_default: false })
      .select("*")
      .single();
    if (error || !data) throw error;
    const page: DashboardPage = { id: data.id, name: data.name, order: data.order, isDefault: data.is_default };
    set((s) => ({ dashboardPages: [...s.dashboardPages, page] }));
    return page;
  },

  renamePage: async (id, name) => {
    const { error } = await supabase.from("dashboard_pages").update({ name }).eq("id", id);
    if (error) throw error;
    set((s) => ({ dashboardPages: s.dashboardPages.map((p) => (p.id === id ? { ...p, name } : p)) }));
  },

  deletePage: async (id) => {
    const { error } = await supabase.from("dashboard_pages").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({
      dashboardPages: s.dashboardPages.filter((p) => p.id !== id),
      dashboardWidgets: s.dashboardWidgets.filter((w) => w.pageId !== id),
    }));
  },

  reorderPages: async (ids) => {
    const updates = ids.map((id, idx) =>
      supabase.from("dashboard_pages").update({ order: idx }).eq("id", id)
    );
    await Promise.all(updates);
    set((s) => ({
      dashboardPages: [...s.dashboardPages]
        .map((p) => ({ ...p, order: ids.indexOf(p.id) }))
        .sort((a, b) => a.order - b.order),
    }));
  },

  addWidget: async (pageId, widgetType, colSpan = 1, rowSpan = 1) => {
    const userId = await getUserId();
    const { dashboardWidgets } = get();
    const pageWidgets = dashboardWidgets.filter((w) => w.pageId === pageId);
    const nextOrder = pageWidgets.length;
    const { data, error } = await supabase
      .from("dashboard_widgets")
      .insert({ page_id: pageId, user_id: userId, widget_type: widgetType, col_span: colSpan, row_span: rowSpan, order: nextOrder, config: {} })
      .select("*")
      .single();
    if (error || !data) throw error;
    const widget: DashboardWidget = {
      id: data.id,
      pageId: data.page_id,
      widgetType: data.widget_type as WidgetType,
      colSpan: data.col_span as WidgetColSpan,
      rowSpan: data.row_span as WidgetRowSpan,
      order: data.order,
      config: data.config ?? {},
    };
    set((s) => ({ dashboardWidgets: [...s.dashboardWidgets, widget] }));
    return widget;
  },

  removeWidget: async (id) => {
    const { error } = await supabase.from("dashboard_widgets").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ dashboardWidgets: s.dashboardWidgets.filter((w) => w.id !== id) }));
  },

  reorderWidgets: async (pageId, orderedIds) => {
    const updates = orderedIds.map((id, idx) =>
      supabase.from("dashboard_widgets").update({ order: idx }).eq("id", id)
    );
    await Promise.all(updates);
    set((s) => ({
      dashboardWidgets: s.dashboardWidgets.map((w) =>
        w.pageId === pageId ? { ...w, order: orderedIds.indexOf(w.id) } : w
      ),
    }));
  },
}));

// Évite TS warning
void uid;
