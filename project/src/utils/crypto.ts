export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface Identity {
  keyPair: KeyPair;
  userHandle: string;
}

export interface ProofOfWork {
  hash: string;
  nonce: number;
  data: string;
}

const STORAGE_KEY = 'anonymous_identity';

export async function generateKeyPair(): Promise<KeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'Ed25519',
      namedCurve: 'Ed25519'
    },
    true,
    ['sign', 'verify']
  );

  const publicKeyBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicKey = bufferToHex(publicKeyBuffer);
  const privateKey = bufferToHex(privateKeyBuffer);

  return { publicKey, privateKey };
}

export function deriveUserHandle(publicKey: string): string {
  let hash = 0;
  for (let i = 0; i < publicKey.length; i++) {
    const char = publicKey.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const userId = Math.abs(hash) % 10000;
  return `User_${userId.toString().padStart(4, '0')}`;
}

export function saveIdentity(identity: Identity): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}

export function loadIdentity(): Identity | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export async function getOrCreateIdentity(): Promise<Identity> {
  let identity = loadIdentity();

  if (!identity) {
    const keyPair = await generateKeyPair();
    const userHandle = deriveUserHandle(keyPair.publicKey);
    identity = { keyPair, userHandle };
    saveIdentity(identity);
  }

  return identity;
}

async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return bufferToHex(hashBuffer);
}

export async function mineProofOfWork(
  data: string,
  difficulty: number = 3,
  onProgress?: (nonce: number) => void
): Promise<ProofOfWork> {
  const prefix = '0'.repeat(difficulty);
  let nonce = 0;

  while (true) {
    const input = `${data}:${nonce}`;
    const hash = await sha256(input);

    if (hash.startsWith(prefix)) {
      return { hash, nonce, data };
    }

    nonce++;

    if (onProgress && nonce % 1000 === 0) {
      onProgress(nonce);
    }

    if (nonce % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}

export async function verifyProofOfWork(
  pow: ProofOfWork,
  difficulty: number = 3
): Promise<boolean> {
  const prefix = '0'.repeat(difficulty);
  const input = `${pow.data}:${pow.nonce}`;
  const hash = await sha256(input);
  return hash === pow.hash && hash.startsWith(prefix);
}

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
