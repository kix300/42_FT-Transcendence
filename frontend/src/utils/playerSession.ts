/**
 * PlayerSessionManager
 * Gère les sessions des joueurs connectés pour éviter de devoir se reconnecter
 * à chaque fois, particulièrement utile pour les tournois avec jusqu'à 8 joueurs.
 */

export interface ConnectedPlayer {
  slotNumber: number; // 1-8 pour les tournois, 1-2 pour les parties normales
  id?: number; // ID de l'utilisateur si authentifié
  username: string;
  avatar?: string;
  isGuest: boolean;
  connectedAt: number; // Timestamp de connexion
}

export class PlayerSessionManager {
  private static readonly STORAGE_KEY = "connected_players";
  private static readonly MAX_PLAYERS = 8;

  /**
   * Sauvegarde un joueur connecté
   */
  static savePlayer(player: ConnectedPlayer): void {
    const players = this.getAllPlayers();

    // Supprimer l'ancien slot si le joueur était déjà connecté ailleurs
    const existingIndex = players.findIndex(
      (p) => p.slotNumber === player.slotNumber,
    );

    if (existingIndex !== -1) {
      players[existingIndex] = player;
    } else {
      players.push(player);
    }

    // Limiter au nombre maximum de joueurs
    if (players.length > this.MAX_PLAYERS) {
      players.splice(0, players.length - this.MAX_PLAYERS);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(players));
  }

  /**
   * Récupère un joueur par son numéro de slot
   */
  static getPlayer(slotNumber: number): ConnectedPlayer | null {
    const players = this.getAllPlayers();
    return players.find((p) => p.slotNumber === slotNumber) || null;
  }

  /**
   * Récupère tous les joueurs connectés
   */
  static getAllPlayers(): ConnectedPlayer[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as ConnectedPlayer[];
    } catch (error) {
      console.error("Error parsing connected players:", error);
      return [];
    }
  }

  /**
   * Déconnecte un joueur d'un slot spécifique
   */
  static disconnectPlayer(slotNumber: number): void {
    const players = this.getAllPlayers();
    const filtered = players.filter((p) => p.slotNumber !== slotNumber);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  /**
   * Déconnecte tous les joueurs
   */
  static disconnectAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Récupère les joueurs pour la page de jeu (slots 1 et 2)
   */
  static getGamePlayers(): {
    player1: ConnectedPlayer | null;
    player2: ConnectedPlayer | null;
  } {
    return {
      player1: this.getPlayer(1),
      player2: this.getPlayer(2),
    };
  }
}
