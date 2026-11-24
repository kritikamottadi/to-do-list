import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import schemaSql from '../../supabase/schema.sql?raw';

const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const envAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? '';

function isValidConfig(url: string, anonKey: string): boolean {
  if (!url || !anonKey) return false;
  if (url.includes('your-project-id') || anonKey.includes('your-supabase-anon')) return false;
  return /^https?:\/\//i.test(url);
}

let activeSupabaseClient: SupabaseClient | null = isValidConfig(envUrl, envAnonKey)
  ? createClient(envUrl, envAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// In-memory Bearer token for Local Preview Mode when Supabase is not configured
let localPreviewToken: string | null = null;

export function setLocalAuthToken(token: string | null): void {
  localPreviewToken = token;
}

export function getLocalAuthToken(): string | null {
  return localPreviewToken;
}

export function getSupabaseClient(): SupabaseClient | null {
  return activeSupabaseClient;
}

export function isSupabaseConnected(): boolean {
  return activeSupabaseClient !== null;
}

export async function initSupabaseFromServerConfig(): Promise<boolean> {
  if (activeSupabaseClient) return true;
  try {
    const res = await fetch('/api/config');
    if (!res.ok) return false;
    const data = (await res.json()) as {
      supabaseConfigured?: boolean;
      supabaseUrl?: string | null;
      supabaseAnonKey?: string | null;
    };
    if (
      data.supabaseConfigured &&
      data.supabaseUrl &&
      data.supabaseAnonKey &&
      isValidConfig(data.supabaseUrl, data.supabaseAnonKey)
    ) {
      activeSupabaseClient = createClient(data.supabaseUrl, data.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return true;
    }
  } catch {
    // Ignore network error during initial config probe
  }
  return false;
}

export const SUPABASE_SCHEMA_SQL = schemaSql;
