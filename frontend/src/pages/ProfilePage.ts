import { getRouter } from "../router";
import { AuthManager } from "../utils/auth";

// Interface pour les données utilisateur étendues
interface UserProfile {
  id: number;
  username: string;
  email?: string;
  photo?: string;
  created_at?: string;
  last_login?: string;
  games_played?: number;
  games_won?: number;
  level?: number;
  achievements?: string[];
}

// Variable globale pour contrôler la vitesse d'écriture des animations
const ANIMATION_SPEED = {
  TYPEWRITER_FAST: 0,
  TYPEWRITER_NORMAL: 15,
  TYPEWRITER_SLOW: 20,
  DELAY_SHORT: 0,
  DELAY_MEDIUM: 100,
  DELAY_LONG: 150,
  TRANSITION_FAST: 0,
  TRANSITION_NORMAL: 0.5,
};

export async function ProfilePage(): Promise<void> {
  // Vérifier l'authentification AVANT d'afficher la page
  if (!AuthManager.isAuthenticated()) {
    console.log('Utilisateur non authentifié, redirection vers login');
    const router = getRouter();
    if (router) {
      router.navigate("/login");
    }
    return;
  }

  const appDiv = document.querySelector<HTMLDivElement>("#app");
  if (!appDiv) return;

  // Récupérer les informations utilisateur depuis le backend
  let userProfile: UserProfile | null = null;
  try {
    const response = await AuthManager.fetchWithAuth('/api/me');
    if (response.ok) {
      userProfile = await response.json();
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
  }

  // Classes CSS pour le body
  const body = document.querySelector("body");
  if (body) {
    body.className = "bg-black min-h-screen font-mono text-green-400";
  }

  // HTML de la page profil
  const profilePageHtml = `
    <div class="min-h-screen flex flex-col bg-black text-green-400 font-mono">
      <!-- Header style terminal -->
      <header class="border-b border-green-400/30 p-4">
        <div class="flex items-center justify-between max-w-6xl mx-auto">
          <div class="flex items-center">
            <span class="text-green-400 mr-2">[root@transcendence]$</span>
            <span id="header-command" class="text-green-300 font-bold"></span>
            <span id="header-cursor" class="text-green-300 animate-pulse">_</span>
          </div>
          
          <!-- Navigation Menu -->
          <div class="flex items-center space-x-6">
            <div class="flex space-x-6" id="nav-menu" style="opacity: 0;">
              <a href="#" data-route="/home" class="hover:text-green-300 transition-colors">> home</a>
              <a href="#" data-route="/game" class="hover:text-green-300 transition-colors">> game</a>
              <a href="#" data-route="/tournament" class="hover:text-green-300 transition-colors">> tournament</a>
              <a href="#" data-route="/profile" class="hover:text-green-300 transition-colors text-green-300">> profile</a>
              <button id="logout-btn" class="hover:text-red-400 transition-colors text-left">> logout</button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main content -->
      <main class="flex-1 p-6">
        <div class="max-w-4xl mx-auto">
          <!-- Profile Header -->
          <div class="mb-8" id="profile-header" style="opacity: 0;">
            <div class="flex items-center space-x-6 bg-gray-900 border border-green-400/30 p-6 rounded">
              <!-- Avatar -->
              <div class="w-24 h-24 rounded-full bg-green-400/20 border-2 border-green-400/50 flex items-center justify-center">
                <span class="text-green-400 text-3xl font-bold">${(userProfile?.username || 'U').charAt(0).toUpperCase()}</span>
              </div>
              
              <!-- User Info -->
              <div class="flex-1">
                <h1 class="text-2xl font-bold text-green-300 mb-2">${userProfile?.username || 'Unknown User'}</h1>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-green-500">User ID:</span> 
                    <span class="text-green-400">#${userProfile?.id || 'N/A'}</span>
                  </div>
                  <div>
                    <span class="text-green-500">Email:</span> 
                    <span class="text-green-400">${userProfile?.email || 'Not provided'}</span>
                  </div>
                  <div>
                    <span class="text-green-500">Level:</span> 
                    <span class="text-green-400">${userProfile?.level || '1'}</span>
                  </div>
                  <div>
                    <span class="text-green-500">Member since:</span> 
                    <span class="text-green-400">${userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Recently'}</span>
                  </div>
                </div>
              </div>
              
              <!-- Edit Button -->
              <div>
                <button id="edit-profile-btn" class="bg-green-400/10 border border-green-400/30 px-4 py-2 rounded hover:bg-green-400/20 transition-colors">
                  <span class="text-green-400">Edit Profile</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Stats Section -->
          <div class="grid md:grid-cols-2 gap-6 mb-8">
            <!-- Game Stats -->
            <div class="bg-gray-900 border border-green-400/30 p-6 rounded" id="game-stats" style="opacity: 0;">
              <h2 class="text-green-300 font-bold mb-4 text-xl">[GAME STATISTICS]</h2>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-green-500">Games Played:</span>
                  <span class="text-green-400 font-mono">${userProfile?.games_played || '0'}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-green-500">Games Won:</span>
                  <span class="text-green-400 font-mono">${userProfile?.games_won || '0'}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-green-500">Win Rate:</span>
                  <span class="text-green-400 font-mono">${userProfile?.games_played ? Math.round((userProfile.games_won || 0) / userProfile.games_played * 100) : 0}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-green-500">Current Level:</span>
                  <span class="text-green-400 font-mono">Level ${userProfile?.level || '1'}</span>
                </div>
              </div>
            </div>

            <!-- Recent Activity -->
            <div class="bg-gray-900 border border-green-400/30 p-6 rounded" id="recent-activity" style="opacity: 0;">
              <h2 class="text-green-300 font-bold mb-4 text-xl">[RECENT ACTIVITY]</h2>
              <div class="space-y-3 text-sm">
                <div class="flex items-center space-x-2">
                  <span class="text-green-500">●</span>
                  <span class="text-green-400">Last login: ${userProfile?.last_login ? new Date(userProfile.last_login).toLocaleString() : 'Now'}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-green-500">●</span>
                  <span class="text-green-400">Profile updated: Recently</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-green-500">●</span>
                  <span class="text-green-400">Tournament participation: Coming soon</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Achievements Section -->
          <div class="bg-gray-900 border border-green-400/30 p-6 rounded mb-8" id="achievements" style="opacity: 0;">
            <h2 class="text-green-300 font-bold mb-4 text-xl">[ACHIEVEMENTS]</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-black border border-green-400/20 p-4 rounded">
                <div class="text-green-400 font-bold">🏆 First Victory</div>
                <div class="text-green-500 text-sm">Win your first game</div>
              </div>
              <div class="bg-black border border-green-400/20 p-4 rounded opacity-50">
                <div class="text-green-400 font-bold">🚀 Speed Demon</div>
                <div class="text-green-500 text-sm">Win 10 games in a row</div>
              </div>
              <div class="bg-black border border-green-400/20 p-4 rounded opacity-50">
                <div class="text-green-400 font-bold">👑 Tournament Champion</div>
                <div class="text-green-500 text-sm">Win a tournament</div>
              </div>
            </div>
          </div>

          <!-- Settings Section -->
          <div class="bg-gray-900 border border-green-400/30 p-6 rounded" id="settings" style="opacity: 0;">
            <h2 class="text-green-300 font-bold mb-4 text-xl">[ACCOUNT SETTINGS]</h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-3 bg-black border border-green-400/20 rounded">
                <div>
                  <div class="text-green-400 font-medium">Change Password</div>
                  <div class="text-green-500 text-sm">Update your account password</div>
                </div>
                <button class="text-green-300 hover:text-green-400 transition-colors">
                  <span class="text-sm">[EDIT]</span>
                </button>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-black border border-green-400/20 rounded">
                <div>
                  <div class="text-green-400 font-medium">Two-Factor Authentication</div>
                  <div class="text-green-500 text-sm">Secure your account with 2FA</div>
                </div>
                <button class="text-green-300 hover:text-green-400 transition-colors">
                  <span class="text-sm">[ENABLE]</span>
                </button>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-black border border-green-400/20 rounded">
                <div>
                  <div class="text-green-400 font-medium">Privacy Settings</div>
                  <div class="text-green-500 text-sm">Control your profile visibility</div>
                </div>
                <button class="text-green-300 hover:text-green-400 transition-colors">
                  <span class="text-sm">[CONFIGURE]</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="border-t border-green-400/30 p-4">
        <div class="max-w-6xl mx-auto text-center text-green-500 text-sm">
          <span class="text-green-400">[Profile Page]</span> Transcendence v1.0.0 | User: ${userProfile?.username || 'Unknown'}
        </div>
      </footer>
    </div>
  `;

  // Injecter le HTML
  appDiv.innerHTML = profilePageHtml;

  // Démarrer les animations
  startProfileAnimations();

  // Setup event listeners
  setupNavigationListeners();
  setupProfileListeners();
}

// Animation typewriter
async function typeWriter(
  elementId: string,
  text: string,
  speed: number = ANIMATION_SPEED.TYPEWRITER_FAST,
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = "";

  for (let i = 0; i < text.length; i++) {
    element.textContent += text.charAt(i);
    await new Promise((resolve) => setTimeout(resolve, speed));
  }
}

// Animations de la page profil
async function startProfileAnimations(): Promise<void> {
  // 1. Header command
  await typeWriter("header-command", "cat user_profile.txt", ANIMATION_SPEED.TYPEWRITER_FAST);
  await new Promise((resolve) => setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT));

  // 2. Cacher le curseur et afficher le menu nav
  const headerCursor = document.getElementById("header-cursor");
  const navMenu = document.getElementById("nav-menu");
  
  if (headerCursor) headerCursor.style.display = "none";
  if (navMenu) {
    navMenu.style.opacity = "1";
    navMenu.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }

  // 3. Afficher les sections une par une
  const sections = [
    "profile-header",
    "game-stats", 
    "recent-activity",
    "achievements",
    "settings"
  ];

  for (const sectionId of sections) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.opacity = "1";
      section.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
      await new Promise((resolve) => setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT));
    }
  }
}

function setupNavigationListeners(): void {
  const router = getRouter();
  if (!router) return;

  // Gérer les clics sur les boutons avec data-route
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest("[data-route]");

    if (button) {
      event.preventDefault();
      const route = button.getAttribute("data-route");
      if (route) {
        router.navigate(route);
      }
    }
  });

  // Logout
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      console.log('Déconnexion en cours...');
      AuthManager.logout();
    });
  }
}

function setupProfileListeners(): void {
  // Edit profile button
  const editProfileBtn = document.getElementById("edit-profile-btn");
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      // TODO: Implémenter la modal d'édition du profil
      console.log("Edit profile clicked");
    });
  }

  // Settings buttons
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    
    if (target.textContent?.includes("[EDIT]")) {
      console.log("Change password clicked");
      // TODO: Implémenter le changement de mot de passe
    }
    
    if (target.textContent?.includes("[ENABLE]")) {
      console.log("Enable 2FA clicked");
      // TODO: Implémenter l'activation 2FA
    }
    
    if (target.textContent?.includes("[CONFIGURE]")) {
      console.log("Configure privacy clicked");
      // TODO: Implémenter les paramètres de confidentialité
    }
  });
}
