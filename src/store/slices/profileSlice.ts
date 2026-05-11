import type { StateCreator } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import { getUserId } from '../storeUtils';

export type ProfileSlice = {
  profile: Profile | null;
  loadProfile: (userId: string) => Promise<void>;
  updateProfile: (data: Partial<Omit<Profile, 'id'>>) => Promise<void>;
  setOnboardingStep: (step: number) => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createProfileSlice: StateCreator<any, [], [], ProfileSlice> = (set) => ({
  profile: null,

  loadProfile: async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if (data) {
      const step: number = data.onboardingCompleted ? 7 : (data.onboardingStep ?? 0);
      set({ profile: { id: data.id, userId, tier: data.tier ?? 'free', firstName: data.firstName ?? null, lastName: data.lastName ?? null, country: data.country ?? null, onboardingStep: step } });
    } else {
      const { data: newProf } = await supabase.from('profiles').insert({ user_id: userId }).select('*').single();
      if (newProf) set({ profile: { id: newProf.id, userId, tier: 'free', firstName: null, lastName: null, country: null, onboardingStep: 0 } });
    }
  },

  updateProfile: async (data) => {
    const userId = await getUserId();
    await supabase.from('profiles').update(data).eq('user_id', userId);
    set((s: { profile: Profile | null }) => ({ profile: s.profile ? { ...s.profile, ...data } : null }));
  },

  setOnboardingStep: async (step) => {
    const userId = await getUserId();
    await supabase.from('profiles').update({ onboardingStep: step }).eq('user_id', userId);
    set((s: { profile: Profile | null }) => ({ profile: s.profile ? { ...s.profile, onboardingStep: step } : null }));
  },

  completeOnboarding: async () => {
    const userId = await getUserId();
    await supabase.from('profiles').update({ onboardingStep: 7 }).eq('user_id', userId);
    set((s: { profile: Profile | null }) => ({ profile: s.profile ? { ...s.profile, onboardingStep: 7 } : null }));
  },
});
