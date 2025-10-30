import { getRouter } from "../router";
import { AUTH_API } from "./apiConfig";
import { connectWebSocket, disconnectWebSocket } from './ws';

export class AuthManager {
  private static readonly TOKEN_KEY = "auth_token";
  private static readonly USER_KEY = "user_data";
  private static readonly REMEMBER_KEY = "remember_login";
  private static readonly GUEST_MODE_KEY = "guest_mode";

  // Stocker le token
  static setToken(token: string, remember: boolean = false): void {
    if (remember) {
      // Stocker dans localStorage (persistant)
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.REMEMBER_KEY, "true");
    } else {
      // Stocker dans sessionStorage (supprimé à la fermeture)
      sessionStorage.setItem(this.TOKEN_KEY, token);
      localStorage.removeItem(this.REMEMBER_KEY);
    }
  }

  static isGuest(): boolean {
    return (
      !this.getToken() || localStorage.getItem(this.GUEST_MODE_KEY) === "true"
    );
  }

  // Activer le mode guest
  static enableGuestMode(): void {
    localStorage.setItem(this.GUEST_MODE_KEY, "true");
  }

  // Désactiver le mode guest
  static disableGuestMode(): void {
    localStorage.removeItem(this.GUEST_MODE_KEY);
  }

  // Récupérer le token (chercher dans localStorage ET sessionStorage)
  static getToken(): string | null {
    return (
      localStorage.getItem(this.TOKEN_KEY) ||
      sessionStorage.getItem(this.TOKEN_KEY)
    );
  }

  // Vérifier si "Remember Me" était activé
  static isRemembered(): boolean {
    return localStorage.getItem(this.REMEMBER_KEY) === "true";
  }

  // Vérifier si l'utilisateur est connecté
  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    return true;
  }

  // Déconnecter l'utilisateur
  static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.REMEMBER_KEY);
    localStorage.removeItem(this.GUEST_MODE_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
	  disconnectWebSocket();
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

  // Ajouter automatiquement le token aux requêtes
  static async fetchWithAuth(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const token = this.getToken();

    const headers = new Headers(options.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
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
      const response = await fetch(AUTH_API.VALIDATE_TOKEN, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401 || response.status === 403) {
        this.logout();
        return false;
      }

      return response.ok;
    } catch (error) {
      console.error("Erreur lors de la validation du token:", error);
      return false;
    }
  }

  // Méthode de login qui stocke le token
  static async login(credentials: {
    username: string;
    password: string;
    remember?: boolean;
  }): Promise<boolean> {
    try {
      const response = await fetch(AUTH_API.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();

      // Stocker le token avec l'option remember
      this.setToken(data.token, credentials.remember || false);
      if (data.user) {
        this.setUser(data.user);
      }

	  //connexion websocket
	  connectWebSocket(data.token);

      //desactive le mode guest
      this.disableGuestMode();

      return true;
    } catch (error) {
      console.error("Erreur lors du login:", error);
      return false;
    }
  }
  // Vérifier si une route nécessite une authentification
  static requiresAuth(path: string): boolean {
    const protectedRoutes = ["/profile", "/users"];
    return protectedRoutes.includes(path);
  }

  // Vérifier si une route est accessible en mode guest
  static isPublicRoute(path: string): boolean {
    const publicRoutes = [
      "/",
      "/home",
      "/game",
      "/tournament",
      "/login",
      "/register",
    ];
    return publicRoutes.includes(path);
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
