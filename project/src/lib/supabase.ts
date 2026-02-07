import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Rumor {
  id: string;
  content: string;
  public_key: string;
  user_handle: string;
  pow_hash: string;
  pow_nonce: number;
  parent_id: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface Verification {
  id: string;
  rumor_id: string;
  public_key: string;
  user_handle: string;
  verification_type: 'verify' | 'dispute';
  pow_hash: string;
  pow_nonce: number;
  created_at: string;
}

export interface UserReputation {
  public_key: string;
  reputation_factor: number;
  total_verifications: number;
  successful_verifications: number;
  failed_verifications: number;
  updated_at: string;
}

export interface TrustScore {
  rumor_id: string;
  verify_count: number;
  dispute_count: number;
  trust_score: number;
  trust_percentage: number;
  updated_at: string;
}
