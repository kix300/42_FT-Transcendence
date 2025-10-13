import { AuthManager } from "../utils/auth";

// Interface pour les données utilisateur
interface UserProfile {
  id: number;
  username: string;
  email?: string;
  photo?: string;
}

// Interface pour la configuration du header
interface HeaderConfig {
  title: string;
  command: string;
  showProfile?: boolean;
  showNavigation?: boolean;
  activeRoute?: string;
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
      <header class="border-b border-green-400/30 p-6 bg-gray-900/20">
        <div class="flex items-center justify-between max-w-7xl mx-auto">
          <div class="flex items-center">
            <span class="text-green-400 mr-2">[root@transcendence]$</span>
            <span class="text-green-300 font-bold">${this.config.command}</span>
          </div>
          
          ${this.config.showNavigation !== false ? this.renderNavigation() : ''}
          ${this.config.showProfile !== false ? this.renderProfile() : ''}
        </div>
      </header>
    `;
  }

  private renderNavigation(): string {
    const routes = [
      { path: '/home', label: 'home' },
      { path: '/game', label: 'game' },
      { path: '/tournament', label: 'tournament' },
      { path: '/profile', label: 'profile' },
      { path: '/users', label: 'users' }
    ];

    return `
      <div class="flex items-center space-x-8">
        ${routes.map(route => `
          <a href="#" 
             data-route="${route.path}" 
             class="hover:text-green-300 transition-colors ${this.config.activeRoute === route.path ? 'text-green-300 font-bold' : 'text-green-400'}"
          >
            > ${route.label}
          </a>
        `).join('')}
        <button id="logout-btn" class="hover:text-red-400 transition-colors text-left text-green-400">
          > logout
        </button>
      </div>
    `;
  }

  private renderProfile(): string {
    if (!this.userProfile) {
      return `
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-full bg-green-400/20 border border-green-400/50 flex items-center justify-center">
            <span class="text-green-400 text-sm font-bold">?</span>
          </div>
          <div class="text-green-500 text-sm">Chargement...</div>
        </div>
      `;
    }

    return `
      <div class="flex items-center space-x-4">
        <button data-route="/profile" class="flex items-center space-x-3 bg-gray-900/50 border border-green-400/30 px-4 py-2 rounded hover:bg-green-400/10 transition-colors">
          <div class="w-10 h-10 rounded-full bg-green-400/20 border border-green-400/50 flex items-center justify-center overflow-hidden">
            ${this.userProfile.photo ? 
              `<img src="${this.userProfile.photo}" alt="${this.userProfile.username}" class="w-full h-full object-cover rounded-full" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
               <span class="text-green-400 text-sm font-bold hidden">${(this.userProfile.username || 'U').charAt(0).toUpperCase()}</span>` :
              `<span class="text-green-400 text-sm font-bold">${(this.userProfile.username || 'U').charAt(0).toUpperCase()}</span>`
            }
          </div>
          <div class="text-left">
            <div class="text-green-400 text-sm font-medium">${this.userProfile.username}</div>
            <div class="text-green-500 text-xs">Profile</div>
          </div>
        </button>
      </div>
    `;
  }

  

  private async loadUserProfile(): Promise<void> {
    try {
      const response = await AuthManager.fetchWithAuth('/api/me');
      if (response.ok) {
        this.userProfile = await response.json();
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    }
  }

  // Variable statique pour éviter les event listeners multiples
  private static eventListenersSetup: boolean = false;

  // Méthode statique pour initialiser les event listeners du header
  static setupEventListeners(): void {
    // Éviter de configurer les event listeners plusieurs fois
    if (Header.eventListenersSetup) {
      return;
    }
    Header.eventListenersSetup = true;

    // Logout
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        console.log('Déconnexion en cours...');
        AuthManager.logout();
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
    activeRoute: "/home"
  },
  game: {
    title: "Jeu",
    command: "./pong_game.sh",
    activeRoute: "/game"
  },
  tournament: {
    title: "Tournoi",
    command: "./tournament.sh",
    activeRoute: "/tournament"
  },
  profile: {
    title: "Profil",
    command: "./profile.sh",
    activeRoute: "/profile"
  },
  users: {
    title: "Utilisateurs",
    command: "./users_management.sh",
    activeRoute: "/users"
  },
  login: {
    title: "Connexion",
    command: "./login.sh",
    showProfile: false,
    showNavigation: false
  },
  register: {
    title: "Inscription",
    command: "./register.sh",
    showProfile: false,
    showNavigation: false
  }
};
