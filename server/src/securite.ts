// Mots de passe (scrypt), jetons de session signés (HMAC-SHA256) et limitation des tentatives.

import { Buffer } from 'node:buffer';
import { createHmac, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';

import type { Secrets } from '../../shared/service.ts';

function scryptAsync(secret: string, sel: Buffer): Promise<Buffer> {
  return new Promise((ok, ko) => scrypt(secret, sel, 32, { N: 16384, r: 8, p: 1 }, (e, cle) => (e ? ko(e) : ok(cle))));
}

export const secretsServeur: Secrets = {
  async hacher(secret) {
    const sel = randomBytes(16);
    const cle = await scryptAsync(secret, sel);
    return `scrypt$${sel.toString('base64url')}$${cle.toString('base64url')}`;
  },
  async verifier(secret, hash) {
    const [algo, sel, attendu] = String(hash).split('$');
    if (algo !== 'scrypt' || !sel || !attendu) return false;
    const cle = await scryptAsync(secret, Buffer.from(sel, 'base64url'));
    const ref = Buffer.from(attendu, 'base64url');
    return ref.length === cle.length && timingSafeEqual(ref, cle);
  },
  identifiant: () => randomUUID(),
};

export type Jeton = { sub: string; role: 'membre' | 'admin'; exp: number };

export function creerJetons(cleSecrete: string) {
  const signer = (donnees: string) => createHmac('sha256', cleSecrete).update(donnees).digest('base64url');
  return {
    emettre(sub: string, role: Jeton['role'], dureeSecondes: number): string {
      const corps = Buffer.from(JSON.stringify({ sub, role, exp: Math.floor(Date.now() / 1000) + dureeSecondes })).toString('base64url');
      return `${corps}.${signer(corps)}`;
    },
    lire(jeton: string | undefined): Jeton | null {
      if (!jeton) return null;
      const [corps, signature] = jeton.split('.');
      if (!corps || !signature) return null;
      const attendue = Buffer.from(signer(corps));
      const recue = Buffer.from(signature);
      if (attendue.length !== recue.length || !timingSafeEqual(attendue, recue)) return null;
      try {
        const j = JSON.parse(Buffer.from(corps, 'base64url').toString()) as Jeton;
        return j.exp > Date.now() / 1000 ? j : null;
      } catch {
        return null;
      }
    },
  };
}

/** Au plus `max` tentatives par clé (IP + identifiant) sur la fenêtre donnée. */
export function creerLimiteur(max = 10, fenetreMs = 15 * 60 * 1000) {
  const essais = new Map<string, number[]>();
  return {
    autorise(cle: string): boolean {
      const maintenant = Date.now();
      const recents = (essais.get(cle) ?? []).filter((t) => maintenant - t < fenetreMs);
      recents.push(maintenant);
      essais.set(cle, recents);
      if (essais.size > 10_000) essais.clear();
      return recents.length <= max;
    },
    reinitialiser(cle: string) {
      essais.delete(cle);
    },
  };
}
