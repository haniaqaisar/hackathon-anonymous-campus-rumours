import { supabase, Rumor, Verification, TrustScore, UserReputation } from '../lib/supabase';

export interface RumorWithTrust extends Rumor {
  trust?: TrustScore;
  children_count?: number;
}

export async function createRumor(
  content: string,
  publicKey: string,
  userHandle: string,
  powHash: string,
  powNonce: number,
  parentId?: string
): Promise<Rumor | null> {
  const { data, error } = await supabase
    .from('rumors')
    .insert({
      content,
      public_key: publicKey,
      user_handle: userHandle,
      pow_hash: powHash,
      pow_nonce: powNonce,
      parent_id: parentId || null
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating rumor:', error);
    return null;
  }

  return data;
}

export async function getRumors(): Promise<RumorWithTrust[]> {
  const { data: rumors, error: rumorsError } = await supabase
    .from('rumors')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (rumorsError) {
    console.error('Error fetching rumors:', rumorsError);
    return [];
  }

  const { data: trustScores } = await supabase
    .from('trust_scores')
    .select('*');

  const rumorsWithTrust: RumorWithTrust[] = rumors.map(rumor => ({
    ...rumor,
    trust: trustScores?.find(ts => ts.rumor_id === rumor.id)
  }));

  for (const rumor of rumorsWithTrust) {
    const { count } = await supabase
      .from('rumors')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', rumor.id)
      .is('deleted_at', null);

    rumor.children_count = count || 0;
  }

  return rumorsWithTrust;
}

export async function createVerification(
  rumorId: string,
  publicKey: string,
  userHandle: string,
  verificationType: 'verify' | 'dispute',
  powHash: string,
  powNonce: number
): Promise<Verification | null> {
  await ensureUserReputation(publicKey);

  const { data, error } = await supabase
    .from('verifications')
    .insert({
      rumor_id: rumorId,
      public_key: publicKey,
      user_handle: userHandle,
      verification_type: verificationType,
      pow_hash: powHash,
      pow_nonce: powNonce
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating verification:', error);
    return null;
  }

  return data;
}

export async function getUserVerification(
  rumorId: string,
  publicKey: string
): Promise<Verification | null> {
  const { data } = await supabase
    .from('verifications')
    .select('*')
    .eq('rumor_id', rumorId)
    .eq('public_key', publicKey)
    .maybeSingle();

  return data;
}

export async function ensureUserReputation(publicKey: string): Promise<void> {
  const { data: existing } = await supabase
    .from('user_reputation')
    .select('*')
    .eq('public_key', publicKey)
    .maybeSingle();

  if (!existing) {
    await supabase
      .from('user_reputation')
      .insert({
        public_key: publicKey,
        reputation_factor: 1.0,
        total_verifications: 0,
        successful_verifications: 0,
        failed_verifications: 0
      });
  }
}

export async function getUserReputation(publicKey: string): Promise<UserReputation | null> {
  const { data } = await supabase
    .from('user_reputation')
    .select('*')
    .eq('public_key', publicKey)
    .maybeSingle();

  return data;
}

export async function updateUserReputation(
  publicKey: string,
  reputationFactor: number,
  totalVerifications: number,
  successfulVerifications: number,
  failedVerifications: number
): Promise<void> {
  await supabase
    .from('user_reputation')
    .update({
      reputation_factor: reputationFactor,
      total_verifications: totalVerifications,
      successful_verifications: successfulVerifications,
      failed_verifications: failedVerifications,
      updated_at: new Date().toISOString()
    })
    .eq('public_key', publicKey);
}
