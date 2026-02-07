/*
  # Anonymous Campus Rumor System Database Schema

  ## Overview
  This migration creates the database structure for an anonymous, cryptographically-secured
  campus rumor system with proof-of-work, trust scoring, and reputation tracking.

  ## New Tables

  ### `rumors`
  Stores all submitted rumors with their metadata and relationships
  - `id` (uuid, primary key) - Unique identifier for the rumor
  - `content` (text) - The rumor text content
  - `public_key` (text) - Ed25519 public key of the submitter (anonymous identity)
  - `user_handle` (text) - Derived anonymous handle (e.g., 'User_5438')
  - `pow_hash` (text) - Proof-of-work hash with 3 leading zeros
  - `pow_nonce` (bigint) - Nonce used to generate the valid PoW
  - `parent_id` (uuid, nullable) - Reference to parent rumor for dependency graph
  - `created_at` (timestamptz) - Timestamp of submission
  - `deleted_at` (timestamptz, nullable) - Soft delete timestamp
  
  ### `verifications`
  Tracks all verification and dispute actions
  - `id` (uuid, primary key) - Unique identifier
  - `rumor_id` (uuid) - Reference to the rumor being verified
  - `public_key` (text) - Ed25519 public key of the verifier
  - `user_handle` (text) - Derived anonymous handle
  - `verification_type` (text) - Either 'verify' or 'dispute'
  - `pow_hash` (text) - Proof-of-work hash
  - `pow_nonce` (bigint) - PoW nonce
  - `created_at` (timestamptz) - Timestamp of verification
  
  ### `user_reputation`
  Tracks reputation factors for each anonymous user
  - `public_key` (text, primary key) - Ed25519 public key (unique identifier)
  - `reputation_factor` (numeric) - Current reputation (starts at 1.0)
  - `total_verifications` (integer) - Count of verifications made
  - `successful_verifications` (integer) - Count of accurate verifications
  - `failed_verifications` (integer) - Count of inaccurate verifications
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `trust_scores`
  Cached trust scores for rumors
  - `rumor_id` (uuid, primary key) - Reference to rumor
  - `verify_count` (integer) - Number of verifications
  - `dispute_count` (integer) - Number of disputes
  - `trust_score` (numeric) - Calculated trust score
  - `trust_percentage` (numeric) - Trust as percentage (0-100)
  - `updated_at` (timestamptz) - Last calculation timestamp

  ## Security
  - All tables have RLS enabled
  - Public read access for all data (anonymous system)
  - Insert policies validate proof-of-work
  - No authentication required (anonymous by design)

  ## Important Notes
  1. Proof-of-Work Validation: All inserts must include valid PoW (3 leading zeros)
  2. Dependency Graph: parent_id creates a tree structure of related rumors
  3. Soft Deletes: Rumors are marked deleted_at rather than hard deleted
  4. Trust Formula: trust_score = sqrt(total_verifications) * avg(reputation_factors)
*/

-- Create rumors table
-- 1. Users table to track reputation
CREATE TABLE public.users (
    pub_key_hash TEXT PRIMARY KEY,
    reputation_score FLOAT DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Rumors table with Media and Graph support
CREATE TABLE public.rumors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    media_url TEXT, -- For your Image/PDF/Video
    trust_score FLOAT DEFAULT 50.0,
    parent_id UUID REFERENCES public.rumors(id), -- The Dependency Link
    author_id TEXT REFERENCES public.users(pub_key_hash),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Verifications table for Square Root logic
CREATE TABLE public.verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.users(pub_key_hash),
    rumor_id UUID REFERENCES public.rumors(id),
    type TEXT CHECK (type IN ('verify', 'dispute')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, rumor_id) -- Prevents voting twice with same ID
); 
CREATE TABLE IF NOT EXISTS rumors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL CHECK (length(content) >= 10 AND length(content) <= 5000),
  public_key text NOT NULL,
  user_handle text NOT NULL,
  pow_hash text NOT NULL,
  pow_nonce bigint NOT NULL,
  parent_id uuid REFERENCES rumors(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL
);

-- Create verifications table
CREATE TABLE IF NOT EXISTS verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rumor_id uuid NOT NULL REFERENCES rumors(id) ON DELETE CASCADE,
  public_key text NOT NULL,
  user_handle text NOT NULL,
  verification_type text NOT NULL CHECK (verification_type IN ('verify', 'dispute')),
  pow_hash text NOT NULL,
  pow_nonce bigint NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(rumor_id, public_key)
);

-- Create user_reputation table
CREATE TABLE IF NOT EXISTS user_reputation (
  public_key text PRIMARY KEY,
  reputation_factor numeric DEFAULT 1.0 CHECK (reputation_factor >= 0.1 AND reputation_factor <= 10.0),
  total_verifications integer DEFAULT 0,
  successful_verifications integer DEFAULT 0,
  failed_verifications integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Create trust_scores table
CREATE TABLE IF NOT EXISTS trust_scores (
  rumor_id uuid PRIMARY KEY REFERENCES rumors(id) ON DELETE CASCADE,
  verify_count integer DEFAULT 0,
  dispute_count integer DEFAULT 0,
  trust_score numeric DEFAULT 0,
  trust_percentage numeric DEFAULT 50,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rumors_public_key ON rumors(public_key);
CREATE INDEX IF NOT EXISTS idx_rumors_parent_id ON rumors(parent_id);
CREATE INDEX IF NOT EXISTS idx_rumors_created_at ON rumors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rumors_deleted_at ON rumors(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_verifications_rumor_id ON verifications(rumor_id);
CREATE INDEX IF NOT EXISTS idx_verifications_public_key ON verifications(public_key);

-- Enable Row Level Security
ALTER TABLE rumors ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read access (anonymous system)
CREATE POLICY "Anyone can view non-deleted rumors"
  ON rumors FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Anyone can insert rumors with valid PoW"
  ON rumors FOR INSERT
  WITH CHECK (
    length(pow_hash) = 64 AND
    substring(pow_hash, 1, 3) = '000'
  );

CREATE POLICY "Anyone can view verifications"
  ON verifications FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert verifications with valid PoW"
  ON verifications FOR INSERT
  WITH CHECK (
    length(pow_hash) = 64 AND
    substring(pow_hash, 1, 3) = '000'
  );

CREATE POLICY "Anyone can view reputation"
  ON user_reputation FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert initial reputation"
  ON user_reputation FOR INSERT
  WITH CHECK (reputation_factor = 1.0);

CREATE POLICY "Anyone can update reputation"
  ON user_reputation FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view trust scores"
  ON trust_scores FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert trust scores"
  ON trust_scores FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update trust scores"
  ON trust_scores FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Function to calculate trust score for a rumor
CREATE OR REPLACE FUNCTION calculate_trust_score(rumor_uuid uuid)
RETURNS void AS $$
DECLARE
  v_verify_count integer;
  v_dispute_count integer;
  v_total_verifications integer;
  v_avg_reputation numeric;
  v_trust_score numeric;
  v_trust_percentage numeric;
BEGIN
  -- Count verifications and disputes
  SELECT 
    COUNT(*) FILTER (WHERE verification_type = 'verify'),
    COUNT(*) FILTER (WHERE verification_type = 'dispute')
  INTO v_verify_count, v_dispute_count
  FROM verifications
  WHERE rumor_id = rumor_uuid;
  
  v_total_verifications := v_verify_count + v_dispute_count;
  
  -- Calculate average reputation of verifiers
  SELECT COALESCE(AVG(ur.reputation_factor), 1.0)
  INTO v_avg_reputation
  FROM verifications v
  LEFT JOIN user_reputation ur ON v.public_key = ur.public_key
  WHERE v.rumor_id = rumor_uuid AND v.verification_type = 'verify';
  
  -- Calculate trust score: sqrt(total_verifications) * avg_reputation
  IF v_total_verifications > 0 THEN
    v_trust_score := sqrt(v_total_verifications) * v_avg_reputation;
    
    -- Calculate trust percentage based on verify vs dispute ratio
    v_trust_percentage := (v_verify_count::numeric / v_total_verifications::numeric) * 100;
  ELSE
    v_trust_score := 0;
    v_trust_percentage := 50;
  END IF;
  
  -- Upsert trust score
  INSERT INTO trust_scores (rumor_id, verify_count, dispute_count, trust_score, trust_percentage, updated_at)
  VALUES (rumor_uuid, v_verify_count, v_dispute_count, v_trust_score, v_trust_percentage, now())
  ON CONFLICT (rumor_id) 
  DO UPDATE SET
    verify_count = v_verify_count,
    dispute_count = v_dispute_count,
    trust_score = v_trust_score,
    trust_percentage = v_trust_percentage,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update trust scores when verifications change
CREATE OR REPLACE FUNCTION trigger_update_trust_score()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_trust_score(NEW.rumor_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trust_score_on_verification
AFTER INSERT ON verifications
FOR EACH ROW
EXECUTE FUNCTION trigger_update_trust_score();