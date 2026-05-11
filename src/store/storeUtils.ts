import { supabase } from '@/lib/supabase';

export function strip<T extends object>(row: Record<string, unknown>): T {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user_id, created_at, ...rest } = row;
  return rest as T;
}

export async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Non connecté');
  return data.user.id;
}
