/**
 * Photo de profil.
 *
 * Une photo prise au téléphone pèse plusieurs mégaoctets et fait 4000 pixels
 * de côté, pour un rond de 44 pixels à l'écran. On la réduit donc sur
 * l'appareil, avant tout envoi : le serveur ne reçoit que quelques
 * kilo-octets, rien de lourd ne transite, et rien d'exploitable au-delà de
 * l'usage prévu n'est conservé.
 */

/** Côté de la vignette finale, en pixels. Deux fois la taille d'affichage maximale. */
const SIZE = 192;
const QUALITY = 0.82;
/** Refus au-delà : une vignette normale pèse 5 à 12 ko. */
export const MAX_PHOTO_BYTES = 60_000;

/**
 * Réduit une image en vignette carrée, recadrée au centre.
 *
 * Le recadrage central est le bon défaut pour un portrait tenu à bout de bras :
 * le visage y est presque toujours. Le format JPEG évite de transporter une
 * couche alpha inutile sur une photo.
 */
export async function toAvatarPhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas indisponible');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, SIZE, SIZE);

    const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
    if (dataUrl.length > MAX_PHOTO_BYTES) {
      // Une photo très détaillée peut dépasser : on redescend d'un cran plutôt
      // que de refuser l'envoi à l'utilisateur, qui n'y peut rien.
      return canvas.toDataURL('image/jpeg', 0.6);
    }
    return dataUrl;
  } finally {
    bitmap.close();
  }
}

/** Une chaîne est-elle une vignette JPEG plausible ? */
export function isPhotoDataUrl(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.startsWith('data:image/jpeg;base64,');
}
