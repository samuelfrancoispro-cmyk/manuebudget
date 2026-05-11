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
  Profile,
  ModuleKey,
} from "@/types";

// ── Local inline types (removed from @/types W1, kept alive for store internals) ──
type DashboardPage = { id: string; name: string; order: number; isDefault: boolean };
type DashboardWidget = { id: string; pageId: string; widgetType: string; colSpan: number; rowSpan: number; order: number; config: Record<string, unknown> };

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

  addCompte: (c: Omit<CompteEpargne, "id">) => Promise<void>;
  updateCompte: (id: string, c: Partial<CompteEpargne>) => Promise<void>;
  deleteCompte: (id: string) => Promise<void>;

  addMouvement: (m: Omit<MouvementEpargne, "id">) => Promise<void>;
  updateMouvement: (id: string, m: Partial<MouvementEpargne>) => Promise<void>;
  deleteMouvement: (id: string) => Promise<void>;

  addObjectif: (o: Omit<Objectif, "id">) => Promise<void>;
  updateObjectif: (id: string, o: Partial<Objectif>) => Promise<void>;
  deleteObjectif: (id: string) => Promise<void>;

  profile: Profile | null;
  loadProfile: (userId: string) => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  setOnboardingStep: (step: number) => Promise<void>;
  completeOnboarding: () => Promise<void>;

  // === Workspace (D1 legacy — kept for Dashboard page) ===
  dashboardPages: DashboardPage[];
  dashboardWidgets: DashboardWidget[];
  loadWorkspace: (userId: string) => Promise<void>;
  seedDefaultWorkspace: (userId: string) => Promise<void>;
  addPage: (name: string) => Promise<DashboardPage>;
  renamePage: (id: string, name: string) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  reorderPages: (ids: string[]) => Promise<void>;
  addWidget: (pageId: string, widgetType: string, colSpan?: number, rowSpan?: number) => Promise<DashboardWidget>;
  removeWidget: (id: string) => Promise<void>;
  reorderWidgets: (pageId: string, orderedIds: string[]) => Promise<void>;

  // === Modules ===
  modules: Record<string, boolean>;
  modulesLoaded: boolean;
  loadModules: (userId: string) => Promise<void>;
  toggleModule: (key: ModuleKey) => Promise<void>;
  isModuleActive: (key: ModuleKey) => boolean;
  seedDefaultModules: (userId: string) => Promise<void>;
}

const categoriesDefaut: Array<{ nom: string; type: 'revenu' | 'depense'; couleur: string }> = [
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

// Default active modules (no ModuleRegistry dependency)
const DEFAULT_MODULES: ModuleKey[] = ['solde', 'depenses', 'recurrentes'];

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Non connecté");
  return data.user.id;
}

/** Map row Supabase → type front (ignores user_id / created_at). */
function strip<T extends object>(row: Record<string, unknown>): T {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  profile: null,
  dashboardPages: [],
  dashboardWidgets: [],
  modules: {},
  modulesLoaded: false,

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
      profile: null,
      dashboardPages: [],
      dashboardWidgets: [],
      modules: {},
      modulesLoaded: false,
    }),

  loadAll: async (userId) => {
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
      dashboardPages: [],
      dashboardWidgets: [],
      modules: {},
      modulesLoaded: false,
    });
    try {
      const [cats, ccs, txs, recs, cs, mvts, objs] = await Promise.all([
        supabase.from("categories").select("*").order("nom"),
        supabase.from("comptes_courants").select("*").order("nom"),
        supabase.from("transactions").select("*").order("date", { ascending: false }),
        supabase.from("recurrentes").select("*").order("libelle"),
        supabase.from("comptes_epargne").select("*").order("nom"),
        supabase.from("mouvements").select("*").order("date", { ascending: false }),
        supabase.from("objectifs").select("*").order("nom"),
      ]);

      const errs = [cats, ccs, txs, recs, cs, mvts, objs].map((r) => r.error).filter(Boolean);
      if (errs.length) console.error("Erreurs Supabase :", errs);

      let categories = (cats.data ?? []).map((r: Record<string, unknown>) => strip<Categorie>(r));
      const comptesCourants = (ccs.data ?? []).map((r: Record<string, unknown>) => strip<CompteCourant>(r));

      // Seed initial categories
      if (categories.length === 0) {
        const inserts = categoriesDefaut.map((c) => ({ ...c, user_id: userId }));
        const { data, error } = await supabase.from("categories").insert(inserts).select("*");
        if (!error && data) {
          categories = data.map((r: Record<string, unknown>) => strip<Categorie>(r));
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
        profile = strip<Profile>(profRow as Record<string, unknown>);
      } else {
        const { data: newProf } = await supabase
          .from("profiles")
          .insert({ user_id: userId })
          .select("*")
          .single();
        profile = newProf ? strip<Profile>(newProf as Record<string, unknown>) : null;
      }

      // Migration : utilisateurs existants → onboardingStep auto-complété
      if (profile && (profile.onboardingStep ?? 0) === 0 && comptesCourants.length > 0) {
        await supabase.from("profiles").update({ onboardingStep: 7 }).eq("user_id", userId);
        profile = { ...profile, onboardingStep: 7 };
      }

      set({
        loaded: true,
        loading: false,
        loadedUserId: userId,
        categories,
        comptesCourants,
        transactions: (txs.data ?? []).map((r: Record<string, unknown>) => strip<Transaction>(r)),
        recurrentes: (recs.data ?? []).map((r: Record<string, unknown>) => strip<TransactionRecurrente>(r)),
        comptes: (cs.data ?? []).map((r: Record<string, unknown>) => strip<CompteEpargne>(r)),
        mouvements: (mvts.data ?? []).map((r: Record<string, unknown>) => strip<MouvementEpargne>(r)),
        objectifs: (objs.data ?? []).map((r: Record<string, unknown>) => strip<Objectif>(r)),
        profile,
      });

      await get().loadWorkspace(userId);
      await get().loadModules(userId);
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
    set((s) => ({ categories: [...s.categories, strip<Categorie>(data as Record<string, unknown>)] }));
  },
  updateCategorie: async (id, c) => {
    const { error } = await supabase.from("categories").update(c).eq("id", id);
    if (error) throw error;
    set((s) => ({ categories: s.categories.map((x) => (x.id === id ? { ...x, ...c } : x)) }));
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
    set((s) => ({ transactions: [...s.transactions, strip<Transaction>(data as Record<string, unknown>)] }));
  },
  updateTransaction: async (id, t) => {
    const { error } = await supabase.from("transactions").update(t).eq("id", id);
    if (error) throw error;
    set((s) => ({ transactions: s.transactions.map((x) => (x.id === id ? { ...x, ...t } : x)) }));
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
    set((s) => ({ recurrentes: [...s.recurrentes, strip<TransactionRecurrente>(data as Record<string, unknown>)] }));
  },
  updateRecurrente: async (id, r) => {
    const { error } = await supabase.from("recurrentes").update(r).eq("id", id);
    if (error) throw error;
    set((s) => ({ recurrentes: s.recurrentes.map((x) => (x.id === id ? { ...x, ...r } : x)) }));
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
    set((s) => ({ comptesCourants: [...s.comptesCourants, strip<CompteCourant>(data as Record<string, unknown>)] }));
  },
  updateCompteCourant: async (id, c) => {
    const { error } = await supabase.from("comptes_courants").update(c).eq("id", id);
    if (error) throw error;
    set((s) => ({ comptesCourants: s.comptesCourants.map((x) => (x.id === id ? { ...x, ...c } : x)) }));
  },
  deleteCompteCourant: async (id) => {
    const { error } = await supabase.from("comptes_courants").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({
      comptesCourants: s.comptesCourants.filter((x) => x.id !== id),
    }));
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
    set((s) => ({ comptes: [...s.comptes, strip<CompteEpargne>(data as Record<string, unknown>)] }));
  },
  updateCompte: async (id, c) => {
    const { error } = await supabase.from("comptes_epargne").update(c).eq("id", id);
    if (error) throw error;
    set((s) => ({ comptes: s.comptes.map((x) => (x.id === id ? { ...x, ...c } : x)) }));
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
    set((s) => ({ mouvements: [...s.mouvements, strip<MouvementEpargne>(data as Record<string, unknown>)] }));
  },
  updateMouvement: async (id, m) => {
    const { error } = await supabase.from("mouvements").update(m).eq("id", id);
    if (error) throw error;
    set((s) => ({ mouvements: s.mouvements.map((x) => (x.id === id ? { ...x, ...m } : x)) }));
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
    set((s) => ({ objectifs: [...s.objectifs, strip<Objectif>(data as Record<string, unknown>)] }));
  },
  updateObjectif: async (id, o) => {
    const { error } = await supabase.from("objectifs").update(o).eq("id", id);
    if (error) throw error;
    set((s) => ({ objectifs: s.objectifs.map((x) => (x.id === id ? { ...x, ...o } : x)) }));
  },
  deleteObjectif: async (id) => {
    const { error } = await supabase.from("objectifs").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ objectifs: s.objectifs.filter((x) => x.id !== id) }));
  },

  // ---------- Profil utilisateur ----------
  loadProfile: async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) set((s) => ({ ...s, profile: strip<Profile>(data as Record<string, unknown>) }));
  },

  updateProfile: async (data: Partial<Profile>) => {
    const userId = await getUserId();
    const { error } = await supabase.from("profiles").update(data).eq("user_id", userId);
    if (error) throw error;
    set((s) => ({ ...s, profile: s.profile ? { ...s.profile, ...data } : null }));
  },

  setOnboardingStep: async (step: number) => {
    const userId = await getUserId();
    await supabase.from("profiles").update({ onboardingStep: step }).eq("user_id", userId);
    set((s) => ({ ...s, profile: s.profile ? { ...s.profile, onboardingStep: step } : null }));
  },

  completeOnboarding: async () => {
    const userId = await getUserId();
    await supabase.from("profiles").update({ onboardingStep: 7 }).eq("user_id", userId);
    set((s) => ({
      ...s,
      profile: s.profile ? { ...s.profile, onboardingStep: 7 } : null,
    }));
  },

  // ---------- Workspace (D1 legacy) ----------
  loadWorkspace: async (userId) => {
    const [pages, widgets] = await Promise.all([
      supabase.from("dashboard_pages").select("*").eq("user_id", userId).order('"order"'),
      supabase.from("dashboard_widgets").select("*").eq("user_id", userId).order('"order"'),
    ]);
    const parsedPages: DashboardPage[] = (pages.data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      name: r.name as string,
      order: r.order as number,
      isDefault: r.is_default as boolean,
    }));
    const parsedWidgets: DashboardWidget[] = (widgets.data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      pageId: r.page_id as string,
      widgetType: r.widget_type as string,
      colSpan: r.col_span as number,
      rowSpan: r.row_span as number,
      order: r.order as number,
      config: (r.config as Record<string, unknown>) ?? {},
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
    const pageId = pageData.id as string;

    const defaultWidgets = [
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

    const inserts = defaultWidgets.map((w) => ({ ...w, page_id: pageId, user_id: userId, config: {} }));
    const { data: wData } = await supabase.from("dashboard_widgets").insert(inserts).select("*");

    const parsedPage: DashboardPage = {
      id: pageData.id as string,
      name: pageData.name as string,
      order: pageData.order as number,
      isDefault: pageData.is_default as boolean,
    };
    const parsedWidgets: DashboardWidget[] = (wData ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      pageId: r.page_id as string,
      widgetType: r.widget_type as string,
      colSpan: r.col_span as number,
      rowSpan: r.row_span as number,
      order: r.order as number,
      config: (r.config as Record<string, unknown>) ?? {},
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
    const page: DashboardPage = {
      id: data.id as string,
      name: data.name as string,
      order: data.order as number,
      isDefault: data.is_default as boolean,
    };
    set((s) => ({ dashboardPages: [...s.dashboardPages, page] }));
    return page;
  },

  renamePage: async (id, name) => {
    const { error } = await supabase.from("dashboard_pages").update({ name }).eq("id", id);
    if (error) throw error;
    set((s) => ({ dashboardPages: s.dashboardPages.map((p) => (p.id === id ? { ...p, name } : p)) }));
  },

  deletePage: async (id) => {
    const page = get().dashboardPages.find((p) => p.id === id);
    if (!page || page.isDefault) throw new Error("Impossible de supprimer la page par défaut");
    const { error } = await supabase.from("dashboard_pages").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({
      dashboardPages: s.dashboardPages.filter((p) => p.id !== id),
      dashboardWidgets: s.dashboardWidgets.filter((w) => w.pageId !== id),
    }));
  },

  reorderPages: async (ids) => {
    const updates = ids.map((id, idx) => supabase.from("dashboard_pages").update({ order: idx }).eq("id", id));
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
      id: data.id as string,
      pageId: data.page_id as string,
      widgetType: data.widget_type as string,
      colSpan: data.col_span as number,
      rowSpan: data.row_span as number,
      order: data.order as number,
      config: (data.config as Record<string, unknown>) ?? {},
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
    const updates = orderedIds.map((id, idx) => supabase.from("dashboard_widgets").update({ order: idx }).eq("id", id));
    await Promise.all(updates);
    set((s) => ({
      dashboardWidgets: s.dashboardWidgets.map((w) =>
        w.pageId === pageId ? { ...w, order: orderedIds.indexOf(w.id) } : w
      ),
    }));
  },

  // ---------- Modules ----------
  loadModules: async (userId) => {
    const { data } = await supabase.from("user_modules").select("module_key, active").eq("user_id", userId);
    if (!data || data.length === 0) {
      await get().seedDefaultModules(userId);
      return;
    }
    const record: Record<string, boolean> = {};
    for (const row of data) {
      record[row.module_key as string] = row.active as boolean;
    }
    // Seed missing default modules
    for (const key of DEFAULT_MODULES) {
      if (!(key in record)) record[key] = true;
    }
    set({ modules: record, modulesLoaded: true });
  },

  seedDefaultModules: async (userId) => {
    const inserts = DEFAULT_MODULES.map((key) => ({
      user_id: userId,
      module_key: key,
      active: true,
      activated_at: new Date().toISOString(),
    }));
    await supabase.from("user_modules").upsert(inserts, { onConflict: "user_id,module_key" });
    const record: Record<string, boolean> = {};
    for (const key of DEFAULT_MODULES) record[key] = true;
    set({ modules: record, modulesLoaded: true });
  },

  toggleModule: async (key) => {
    const prev = get().modules[key] ?? false;
    const next = !prev;
    set((s) => ({ modules: { ...s.modules, [key]: next } }));
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id ?? "";
    const { error } = await supabase.from("user_modules").upsert(
      { user_id: userId, module_key: key, active: next, activated_at: next ? new Date().toISOString() : null },
      { onConflict: "user_id,module_key" }
    );
    if (error) {
      set((s) => ({ modules: { ...s.modules, [key]: prev } }));
    }
  },

  isModuleActive: (key) => {
    const { modules } = get();
    return modules[key] ?? DEFAULT_MODULES.includes(key);
  },
}));
