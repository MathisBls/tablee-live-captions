/** Ce qu'émet une connexion WebSocket réactive, reconnexions comprises. */
export type SocketSignal =
  | { readonly type: 'open' }
  | { readonly type: 'message'; readonly data: unknown }
  /** Fermeture inattendue : une reconnexion suit après un délai. */
  | { readonly type: 'closed'; readonly code: number }
  /** Fermeture définitive (session introuvable, terminée, origine refusée) : le flux se termine. */
  | { readonly type: 'ended'; readonly code: number };
