declare const process: { env: Record<string, string | undefined> };

const supabaseUrl = process?.env?.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process?.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabaseMock = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};
