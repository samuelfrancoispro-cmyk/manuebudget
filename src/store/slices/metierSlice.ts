import type { StateCreator } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Categorie, Transaction, TransactionRecurrente, CompteCourant, CompteEpargne, MouvementEpargne, Objectif } from '@/types';
import { strip, getUserId } from '../storeUtils';

const CATEGORIES_DEFAUT: Omit<Categorie, 'id' | 'userId'>[] = [
  { nom: 'Salaire',        type: 'revenu',  couleur: '#10b981' },
  { nom: 'Autres revenus', type: 'revenu',  couleur: '#22c55e' },
  { nom: 'Loyer / Crédit', type: 'depense', couleur: '#ef4444' },
  { nom: 'Courses',        type: 'depense', couleur: '#f97316' },
  { nom: 'Transport',      type: 'depense', couleur: '#f59e0b' },
  { nom: 'Loisirs',        type: 'depense', couleur: '#8b5cf6' },
  { nom: 'Santé',          type: 'depense', couleur: '#06b6d4' },
  { nom: 'Abonnements',    type: 'depense', couleur: '#6366f1' },
  { nom: 'Divers',         type: 'depense', couleur: '#64748b' },
];

export type MetierSlice = {
  categories: Categorie[];
  transactions: Transaction[];
  recurrentes: TransactionRecurrente[];
  comptesCourants: CompteCourant[];
  comptes: CompteEpargne[];
  mouvements: MouvementEpargne[];
  objectifs: Objectif[];
  loadMetier: (userId: string) => Promise<void>;
  addCategorie: (c: Omit<Categorie, 'id'>) => Promise<void>;
  updateCategorie: (id: string, c: Partial<Categorie>) => Promise<void>;
  deleteCategorie: (id: string) => Promise<void>;
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, t: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addRecurrente: (r: Omit<TransactionRecurrente, 'id'>) => Promise<void>;
  updateRecurrente: (id: string, r: Partial<TransactionRecurrente>) => Promise<void>;
  deleteRecurrente: (id: string) => Promise<void>;
  addCompteCourant: (c: Omit<CompteCourant, 'id'>) => Promise<void>;
  updateCompteCourant: (id: string, c: Partial<CompteCourant>) => Promise<void>;
  deleteCompteCourant: (id: string) => Promise<void>;
  addCompte: (c: Omit<CompteEpargne, 'id'>) => Promise<void>;
  updateCompte: (id: string, c: Partial<CompteEpargne>) => Promise<void>;
  deleteCompte: (id: string) => Promise<void>;
  addMouvement: (m: Omit<MouvementEpargne, 'id'>) => Promise<void>;
  updateMouvement: (id: string, m: Partial<MouvementEpargne>) => Promise<void>;
  deleteMouvement: (id: string) => Promise<void>;
  addObjectif: (o: Omit<Objectif, 'id'>) => Promise<void>;
  updateObjectif: (id: string, o: Partial<Objectif>) => Promise<void>;
  deleteObjectif: (id: string) => Promise<void>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createMetierSlice: StateCreator<any, [], [], MetierSlice> = (set) => ({
  categories: [], transactions: [], recurrentes: [], comptesCourants: [], comptes: [], mouvements: [], objectifs: [],

  loadMetier: async (userId) => {
    const [cats, ccs, txs, recs, cs, mvts, objs] = await Promise.all([
      supabase.from('categories').select('*').order('nom'),
      supabase.from('comptesCourants').select('*').order('nom'),
      supabase.from('transactions').select('*').order('date', { ascending: false }),
      supabase.from('transactionsRecurrentes').select('*').order('libelle'),
      supabase.from('comptes').select('*').order('nom'),
      supabase.from('mouvements').select('*').order('date', { ascending: false }),
      supabase.from('objectifs').select('*').order('nom'),
    ]);
    let categories = (cats.data ?? []).map((r: Record<string, unknown>) => strip<Categorie>(r));
    if (categories.length === 0) {
      const { data } = await supabase.from('categories').insert(CATEGORIES_DEFAUT.map((c) => ({ ...c, user_id: userId }))).select('*');
      categories = (data ?? []).map((r: Record<string, unknown>) => strip<Categorie>(r));
    }
    set({
      categories,
      comptesCourants: (ccs.data ?? []).map((r: Record<string, unknown>) => strip<CompteCourant>(r)),
      transactions: (txs.data ?? []).map((r: Record<string, unknown>) => strip<Transaction>(r)),
      recurrentes: (recs.data ?? []).map((r: Record<string, unknown>) => strip<TransactionRecurrente>(r)),
      comptes: (cs.data ?? []).map((r: Record<string, unknown>) => strip<CompteEpargne>(r)),
      mouvements: (mvts.data ?? []).map((r: Record<string, unknown>) => strip<MouvementEpargne>(r)),
      objectifs: (objs.data ?? []).map((r: Record<string, unknown>) => strip<Objectif>(r)),
    });
  },

  addCategorie: async (c) => { const uid = await getUserId(); const { data, error } = await supabase.from('categories').insert({ ...c, user_id: uid }).select('*').single(); if (error || !data) throw error; set((s: MetierSlice) => ({ categories: [...s.categories, strip<Categorie>(data)] })); },
  updateCategorie: async (id, c) => { await supabase.from('categories').update(c).eq('id', id); set((s: MetierSlice) => ({ categories: s.categories.map((x) => (x.id === id ? { ...x, ...c } : x)) })); },
  deleteCategorie: async (id) => { await supabase.from('categories').delete().eq('id', id); set((s: MetierSlice) => ({ categories: s.categories.filter((x) => x.id !== id) })); },

  addTransaction: async (t) => { const uid = await getUserId(); const { data, error } = await supabase.from('transactions').insert({ ...t, user_id: uid }).select('*').single(); if (error || !data) throw error; set((s: MetierSlice) => ({ transactions: [strip<Transaction>(data), ...s.transactions] })); },
  updateTransaction: async (id, t) => { await supabase.from('transactions').update(t).eq('id', id); set((s: MetierSlice) => ({ transactions: s.transactions.map((x) => (x.id === id ? { ...x, ...t } : x)) })); },
  deleteTransaction: async (id) => { await supabase.from('transactions').delete().eq('id', id); set((s: MetierSlice) => ({ transactions: s.transactions.filter((x) => x.id !== id) })); },

  addRecurrente: async (r) => { const uid = await getUserId(); const { data, error } = await supabase.from('transactionsRecurrentes').insert({ ...r, user_id: uid }).select('*').single(); if (error || !data) throw error; set((s: MetierSlice) => ({ recurrentes: [...s.recurrentes, strip<TransactionRecurrente>(data)] })); },
  updateRecurrente: async (id, r) => { await supabase.from('transactionsRecurrentes').update(r).eq('id', id); set((s: MetierSlice) => ({ recurrentes: s.recurrentes.map((x) => (x.id === id ? { ...x, ...r } : x)) })); },
  deleteRecurrente: async (id) => { await supabase.from('transactionsRecurrentes').delete().eq('id', id); set((s: MetierSlice) => ({ recurrentes: s.recurrentes.filter((x) => x.id !== id) })); },

  addCompteCourant: async (c) => { const uid = await getUserId(); const { data, error } = await supabase.from('comptesCourants').insert({ ...c, user_id: uid }).select('*').single(); if (error || !data) throw error; set((s: MetierSlice) => ({ comptesCourants: [...s.comptesCourants, strip<CompteCourant>(data)] })); },
  updateCompteCourant: async (id, c) => { await supabase.from('comptesCourants').update(c).eq('id', id); set((s: MetierSlice) => ({ comptesCourants: s.comptesCourants.map((x) => (x.id === id ? { ...x, ...c } : x)) })); },
  deleteCompteCourant: async (id) => {
    await supabase.from('comptesCourants').delete().eq('id', id);
    set((s: MetierSlice) => ({
      comptesCourants: s.comptesCourants.filter((x) => x.id !== id),
      transactions: s.transactions.filter((t) => t.compteCourantId !== id),
      recurrentes: s.recurrentes.map((r) => r.compteCourantId === id ? { ...r, compteCourantId: undefined } : r),
    }));
  },

  addCompte: async (c) => { const uid = await getUserId(); const { data, error } = await supabase.from('comptes').insert({ ...c, user_id: uid }).select('*').single(); if (error || !data) throw error; set((s: MetierSlice) => ({ comptes: [...s.comptes, strip<CompteEpargne>(data)] })); },
  updateCompte: async (id, c) => { await supabase.from('comptes').update(c).eq('id', id); set((s: MetierSlice) => ({ comptes: s.comptes.map((x) => (x.id === id ? { ...x, ...c } : x)) })); },
  deleteCompte: async (id) => { await supabase.from('comptes').delete().eq('id', id); set((s: MetierSlice) => ({ comptes: s.comptes.filter((x) => x.id !== id), mouvements: s.mouvements.filter((m) => m.compteId !== id) })); },

  addMouvement: async (m) => { const uid = await getUserId(); const { data, error } = await supabase.from('mouvements').insert({ ...m, user_id: uid }).select('*').single(); if (error || !data) throw error; set((s: MetierSlice) => ({ mouvements: [strip<MouvementEpargne>(data), ...s.mouvements] })); },
  updateMouvement: async (id, m) => { await supabase.from('mouvements').update(m).eq('id', id); set((s: MetierSlice) => ({ mouvements: s.mouvements.map((x) => (x.id === id ? { ...x, ...m } : x)) })); },
  deleteMouvement: async (id) => { await supabase.from('mouvements').delete().eq('id', id); set((s: MetierSlice) => ({ mouvements: s.mouvements.filter((x) => x.id !== id) })); },

  addObjectif: async (o) => { const uid = await getUserId(); const { data, error } = await supabase.from('objectifs').insert({ ...o, user_id: uid }).select('*').single(); if (error || !data) throw error; set((s: MetierSlice) => ({ objectifs: [...s.objectifs, strip<Objectif>(data)] })); },
  updateObjectif: async (id, o) => { await supabase.from('objectifs').update(o).eq('id', id); set((s: MetierSlice) => ({ objectifs: s.objectifs.map((x) => (x.id === id ? { ...x, ...o } : x)) })); },
  deleteObjectif: async (id) => { await supabase.from('objectifs').delete().eq('id', id); set((s: MetierSlice) => ({ objectifs: s.objectifs.filter((x) => x.id !== id) })); },
});
