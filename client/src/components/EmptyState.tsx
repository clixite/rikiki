interface Props {
  /** Pictogramme du vide : une image vaut mieux qu'une phrase pour dire « rien ici ». */
  glyph: string;
  /** Ce qui manque, dit sans reproche. */
  message: string;
  /** Ce qu'on peut faire pour le remplir, quand il y a quelque chose à faire. */
  action?: React.ReactNode;
  testId?: string;
}

/**
 * L'écran vide.
 *
 * Une liste vide affichait une ligne de texte gris en haut, puis mille trois
 * cents pixels de feutre. Le conteneur était en `flex-1` : il s'étirait pour
 * occuper toute la hauteur même quand son contenu tenait sur une ligne, et
 * repoussait du même coup le bouton d'action tout en bas de l'écran, à mille
 * pixels du message qu'il était censé résoudre. Le résultat ne se lisait pas
 * comme « il n'y a rien », mais comme « quelque chose ne s'est pas chargé ».
 *
 * Ici, le contenu est centré dans l'espace disponible et l'action se tient
 * juste sous le message : un vide assumé plutôt qu'un vide subi. C'est un
 * moment de marque, pas une erreur.
 */
export default function EmptyState({ glyph, message, action, testId }: Props) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 py-8 text-center"
      data-testid={testId}
    >
      <span className="text-5xl opacity-40" aria-hidden="true">
        {glyph}
      </span>
      <p className="max-w-64 text-sm leading-snug text-paper-50/55">{message}</p>
      {action}
    </div>
  );
}
