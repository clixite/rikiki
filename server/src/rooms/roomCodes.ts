import crypto from 'node:crypto';

/** Alphabet sans I, L, O pour éviter les confusions à la lecture. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ';

export function randomCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return code;
}

export function normalizeCode(input: string): string {
  return input.trim().toUpperCase();
}

export function isValidCodeFormat(code: string): boolean {
  return /^[A-Z]{4}$/.test(code);
}
