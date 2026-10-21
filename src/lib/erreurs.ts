/** Erreur renvoyée par l'API (ou le mode démonstration), avec son code HTTP (0 = réseau). */
export class ErreurApi extends Error {
  statut: number;
  constructor(statut: number, message: string) {
    super(message);
    this.statut = statut;
  }
}
