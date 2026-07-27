import crypto from 'node:crypto';

/** Alphabet sans I, L, O pour éviter les confusions à la lecture. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ';

/** Longueur d'un code de partie. */
export const ROOM_CODE_LENGTH = 4;
/** Longueur d'un code de groupe : plus long, pour ne pas confondre les deux. */
export const GROUP_CODE_LENGTH = 6;

export function randomCode(length: number = ROOM_CODE_LENGTH): string {
  let code = '';
  for (let i = 0; i < length; i++) {
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

/** Un code de groupe : 6 lettres de l'alphabet lisible (ni I, ni L, ni O). */
export function isValidGroupCodeFormat(code: string): boolean {
  return new RegExp(`^[${ALPHABET}]{${GROUP_CODE_LENGTH}}$`).test(code);
}
