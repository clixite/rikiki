/**
 * Adresse du serveur de jeu.
 *
 * Sur le web, le client est servi par le serveur lui-même : les chemins
 * relatifs suffisent et restent valables quel que soit le domaine. Dans
 * l'application iOS, les fichiers sont embarqués et la page vit sous
 * `capacitor://localhost` : il faut alors une adresse absolue, injectée à la
 * compilation par `VITE_API_BASE`.
 */
export const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');

/** L'application tourne-t-elle dans le conteneur natif ? */
export const IS_NATIVE = API_BASE !== '';
