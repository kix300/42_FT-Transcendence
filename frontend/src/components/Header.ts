import { escapeHtml, sanitizeUrl } from "../utils/sanitize";
import { AuthManager } from "../utils/auth";
import { PROFILE_API } from "../utils/apiConfig";

// Interface pour les données utilisateur
interface UserProfile {
  id: number;
  username: string;
  email: string;
  photo: string;
  created_at?: string;
  last_login?: string;
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
  };
  matches: Match[];
  level?: number;
  achievements?: string[];
}

interface Match {
  id: number;
  player1_id: number;
  player2_id: number;
  winner_id: number;
  player1_score?: number;
  player2_score?: number;
  is_tournament: boolean;
  date: string;
}

// Interface pour la configuration du header
interface HeaderConfig {
  title: string;
  command: string;
  showProfile?: boolean;
  showNavigation?: boolean;
  activeRoute?: string;
  isGuest?: boolean;
}

export class Header {
  private userProfile: UserProfile | null = null;
  private config: HeaderConfig;

  constructor(config: HeaderConfig) {
    this.config = config;
  }

  async render(): Promise<string> {
    // Récupérer les informations utilisateur si nécessaire
    if (this.config.showProfile !== false) {
      await this.loadUserProfile();
    }

    return `
      <!-- Header style terminal -->
      <header class="border-b border-green-400/30 p-4">
        <div class="flex items-center justify-between max-w-6xl mx-auto">
          <div class="flex items-center">
            <span class="text-green-400 mr-2">[root@transcendence]$</span>
            <span id="header-command" class="text-green-300 font-bold">${this.config.command}</span>
            <span id="header-cursor" class="text-green-300 animate-pulse">_</span>
          </div>

          <!-- Profile Info -->
          <div class="flex items-center space-x-6">
            ${this.config.showProfile !== false ? this.renderProfile() : ""}
            ${this.config.showNavigation !== false ? this.renderNavigation() : ""}
          </div>
        </div>
      </header>
    `;
  }
  // ${this.renderDebugInfo()}

  private renderNavigation(): string {
    if (this.config.isGuest) {
      return `
        <!-- Navigation Menu -->
        <div class="flex space-x-6" id="nav-menu" style="opacity: 0;">
          <a id="route-home" href="#" data-route="/home" class="hover:text-green-300 transition-colors ${this.config.activeRoute === "/home" ? "text-green-300 font-bold" : "text-green-400"}">> home</a>
          <a id="route-game" href="#" data-route="/game" class="hover:text-green-300 transition-colors ${this.config.activeRoute === "/game" ? "text-green-300 font-bold" : "text-green-400"}">> game</a>
          <a id="route-tournament" href="#" data-route="/tournament" class="hover:text-green-300 transition-colors ${this.config.activeRoute === "/tournament" ? "text-green-300 font-bold" : "text-green-400"}">> tournament</a>
          <a id="route-login" href="#" data-route="/login" class="hover:text-green-300 transition-colors ${this.config.activeRoute === "/login" ? "text-green-300 font-bold" : "text-green-400"}">> login</a>
          <a id="route-register" href="#" data-route="/register" class="hover:text-green-300 transition-colors ${this.config.activeRoute === "/register" ? "text-green-300 font-bold" : "text-green-400"}">> register</a>
        </div>
      `;
    }
    return `
      <!-- Navigation Menu -->
      <div class="flex space-x-6" id="nav-menu" style="opacity: 0;">
        <a id="route-home" href="#" data-route="/home" class="hover:text-green-300 transition-colors ${this.config.activeRoute === "/home" ? "text-green-300 font-bold" : "text-green-400"}">> home</a>
        <a id="route-game" href="#" data-route="/game" class="hover:text-green-300 transition-colors ${this.config.activeRoute === "/game" ? "text-green-300 font-bold" : "text-green-400"}">> game</a>
        <a id="route-tournament" href="#" data-route="/tournament" class="hover:text-green-300 transition-colors ${this.config.activeRoute === "/tournament" ? "text-green-300 font-bold" : "text-green-400"}">> tournament</a>
        <button id="logout-btn" class="hover:text-red-400 transition-colors text-left text-green-400">> logout</button>
      </div>
    `;
  }

  private renderProfile(): string {
    return `
      <!-- User Profile Avatar -->
      <div class="flex items-center space-x-3" id="user-profile" style="opacity: 0;">
        <button data-route="/profile" class="flex items-center space-x-3 bg-gray-900 border border-green-400/30 px-3 py-2 rounded hover:bg-green-400/10 transition-colors">
          <div class="w-8 h-8 rounded-full bg-green-400/20 border border-green-400/50 flex items-center justify-center">
            ${
              this.userProfile?.photo
                ? `<img src="${sanitizeUrl(this.userProfile.photo)}" alt="${escapeHtml(this.userProfile.username)}" class="w-full h-full object-cover rounded-full" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                   <span class="text-green-400 text-3xl font-bold hidden">${escapeHtml(
                     this.userProfile?.username || "U",
                   )
                     .charAt(0)
                     .toUpperCase()}</span>`
                : `<span class="text-green-400 text-3xl font-bold">${escapeHtml((this.userProfile?.username || "U").charAt(0).toUpperCase())}</span>`
            }
          </div>
          <div class="text-left">
            <div class="text-green-400 text-sm font-medium">${escapeHtml(this.userProfile?.username || "Unknown")}</div>
          </div>
        </buttonhome>
      </div>
    `;
  }

  private async loadUserProfile(): Promise<void> {
    try {
      const response = await AuthManager.fetchWithAuth(PROFILE_API.GET_ME);
      if (response.ok) {
        const data = await response.json();
        this.userProfile = {
          ...data.user,
          stats: data.stats,
          matches: data.matches,
        };
        console.log("✅ Ok, userProfile is set!");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error);
    }
  }

  // Méthode statique pour initialiser les event listeners du header
  static setupEventListeners(): void {
    // Toujours re-setup les event listeners car le DOM peut avoir changé

    // Logout
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        console.log("Déconnexion en cours...");
        AuthManager.logout();
      });
    }

    // Profile button navigation
    const profileBtn = document.querySelector('[data-route="/profile"]');
    if (profileBtn) {
      profileBtn.addEventListener("click", (e) => {
        e.preventDefault();
        import("../router").then(({ getRouter }) => {
          const router = getRouter();
          if (router) {
            router.navigate("/profile");
          }
        });
      });
    }
  }
}

// Fonction utilitaire pour créer rapidement un header
export function createHeader(config: HeaderConfig): Header {
  return new Header(config);
}

// Configuration par défaut pour différents types de pages
export const HeaderConfigs = {
  home: {
    title: "Accueil",
    command: "./home.sh",
    activeRoute: "/home",
  },
  game: {
    title: "Jeu",
    command: "./pong_game.sh",
    activeRoute: "/game",
  },
  tournament: {
    title: "Tournoi",
    command: "./tournament.sh",
    activeRoute: "/tournament",
  },
  profile: {
    title: "Profil",
    command: "./profile.sh",
    activeRoute: "/profile",
  },
  users: {
    title: "Utilisateurs",
    command: "./users_management.sh",
    activeRoute: "/users",
  },
  login: {
    title: "Connexion",
    command: "./login.sh",
    showProfile: false,
    showNavigation: false,
  },
  register: {
    title: "Inscription",
    command: "./register.sh",
    showProfile: false,
    showNavigation: false,
  },
  guest: {
    title: "Mode Guest",
    command: "./guest.sh",
    showProfile: false, //<- pk pas faire un profil qui affiche juste guest et quand tu clique ca tenvois sur login
    showNavigation: true,
    isGuest: true,
  },
};
