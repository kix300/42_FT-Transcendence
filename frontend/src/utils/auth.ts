import { getRouter } from "../router";

export class AuthManager {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly USER_KEY = 'user_data';
  private static readonly REMEMBER_KEY = 'remember_login';


  // Stocker le token
  static setToken(token: string, remember: boolean = false): void {
    if (remember) {
      // Stocker dans localStorage (persistant)
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.REMEMBER_KEY, 'true');
    } else {
      // Stocker dans sessionStorage (supprimé à la fermeture)
      sessionStorage.setItem(this.TOKEN_KEY, token);
      localStorage.removeItem(this.REMEMBER_KEY);
    }
  }

  // Récupérer le token (chercher dans localStorage ET sessionStorage)
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
  }

  // Vérifier si "Remember Me" était activé
  static isRemembered(): boolean {
    return localStorage.getItem(this.REMEMBER_KEY) === 'true';
  }

  // Vérifier si l'utilisateur est connecté
  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Optionnel: vérifier l'expiration du token
    return !this.isTokenExpired(token);
  }

   // Déconnecter l'utilisateur
  static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.REMEMBER_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
      const router = getRouter();
    if (router) {
      router.navigate("/login");
    } else {
      // Fallback si le router n'est pas disponible
      window.location.href = "/login";
    }
  }

  // Stocker les données utilisateur
  static setUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // Vérifier l'expiration du token (si JWT)
  private static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  // Ajouter automatiquement le token aux requêtes
  static async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken();
    
    const headers = new Headers(options.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Si 401, rediriger vers login
    if (response.status === 401) {
      this.logout();
    }

    return response;
  }
    static async validateToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      const response = await fetch('/api/validate-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401 || response.status === 403) {
        this.logout();
        return false;
      }

      return response.ok;
    } catch (error) {
      console.error('Erreur lors de la validation du token:', error);
      return false;
    }
  }

  // Méthode de login qui stocke le token
  static async login(credentials: { username: string; password: string; remember?: boolean }): Promise<boolean> {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      // Stocker le token avec l'option remember
      this.setToken(data.token, credentials.remember || false);
      if (data.user) {
        this.setUser(data.user);
      }

      return true;
    } catch (error) {
      console.error('Erreur lors du login:', error);
      return false;
    }
  }

  // Vérification complète (token local + validation backend)
  static async isValidAuthenticated(): Promise<boolean> {
    // D'abord vérifier localement
    if (!this.isAuthenticated()) {
      return false;
    }

    // Puis valider avec le backend
    return await this.validateToken();
  }
}
