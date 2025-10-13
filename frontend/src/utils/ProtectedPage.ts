import { AuthManager } from './auth';

export abstract class ProtectedPage {
  protected isInitialized = false;

  constructor() {
    this.checkAuth();
  }

  private async checkAuth(): Promise<void> {
    const isValid = await AuthManager.isValidAuthenticated();
    
    if (!isValid) {
      // Rediriger vers login si token invalide
      window.location.href = '/login';
      return;
    }

    // Si l'auth est valide, initialiser la page
    await this.init();
    this.isInitialized = true;
  }

  // Méthode abstraite que chaque page doit implémenter
  protected abstract init(): Promise<void>;

  // Méthode utilitaire pour les requêtes authentifiées
  protected async fetchAuth(url: string, options: RequestInit = {}): Promise<Response> {
    return AuthManager.fetchWithAuth(url, options);
  }
}