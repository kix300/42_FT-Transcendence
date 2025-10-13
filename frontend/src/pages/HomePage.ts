import { getRouter } from "../router";
import { AuthManager } from "../utils/auth";

// Interface pour les données utilisateur
interface UserProfile {
  id: number;
  username: string;
  email?: string;
  photo?: string;
}

// Variable globale pour contrôler la vitesse d'écriture des animations
const ANIMATION_SPEED = {
  TYPEWRITER_FAST: 0,    // Vitesse rapide pour les commandes
  TYPEWRITER_NORMAL: 15,  // Vitesse normale pour les textes
  TYPEWRITER_SLOW: 20,    // Vitesse lente pour les titres
  DELAY_SHORT: 0,        // Délai court entre les animations
  DELAY_MEDIUM: 100,      // Délai moyen
  DELAY_LONG: 150,        // Délai long
  TRANSITION_FAST: 0,   // Transition rapide
  TRANSITION_NORMAL: 0.5, // Transition normale
};

export async function HomePage(): Promise<void> {
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

  // Classes CSS pour le body et conteneur principal
  const body = document.querySelector("body");
  if (body) {
    body.className = "bg-black min-h-screen font-mono text-green-400";
  }

  // HTML de la page d'accueil
  const homePageHtml = `
    <div class="min-h-screen flex flex-col bg-black text-green-400 font-mono">
      <!-- Header style terminal -->
      <header class="border-b border-green-400/30 p-4">
        <div class="flex items-center justify-between max-w-6xl mx-auto">
          <div class="flex items-center">
            <span class="text-green-400 mr-2">[root@transcendence]$</span>
            <span id="header-command" class="text-green-300 font-bold"></span>
            <span id="header-cursor" class="text-green-300 animate-pulse">_</span>
          </div>
          
          <!-- Profile Info -->
          <div class="flex items-center space-x-6">
            <!-- User Profile Avatar -->
            <div class="flex items-center space-x-3" id="user-profile" style="opacity: 0;">
              <button data-route="/profile" class="flex items-center space-x-3 bg-gray-900 border border-green-400/30 px-3 py-2 rounded hover:bg-green-400/10 transition-colors">
                <div class="w-8 h-8 rounded-full bg-green-400/20 border border-green-400/50 flex items-center justify-center overflow-hidden">
                  ${userProfile?.photo ? 
                    `<img src="${userProfile.photo}" alt="${userProfile.username}" class="w-full h-full object-cover rounded-full" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                     <span class="text-green-400 text-sm font-bold hidden">${(userProfile?.username || 'U').charAt(0).toUpperCase()}</span>` :
                    `<span class="text-green-400 text-sm font-bold">${(userProfile?.username || 'U').charAt(0).toUpperCase()}</span>`
                  }
                </div>
                <div class="text-left">
                  <div class="text-green-400 text-sm font-medium">${userProfile?.username || 'Unknown'}</div>
                  <div class="text-green-500 text-xs">Click to view profile</div>
                </div>
              </button>
            </div>
            
            <!-- Debug Info (Optional - can be hidden in production) -->
            <div class="flex items-center space-x-4" id="debug-info" style="opacity: 0; display: none;">
              <div class="bg-gray-900 border border-green-400/30 px-3 py-1 rounded">
                <div class="text-green-300 text-xs">Debug Info:</div>
                <div class="text-green-400 text-sm">
                  <span class="text-green-300">ID:</span> ${userProfile?.id || 'N/A'} | 
                  <span class="text-green-300">Email:</span> ${userProfile?.email || 'N/A'}
                </div>
              </div>
              <div class="bg-gray-900 border border-green-400/30 px-3 py-1 rounded">
                <div class="text-green-300 text-xs">Token:</div>
                <div class="text-green-400 text-sm font-mono">${AuthManager.getToken()?.substring(0, 20) || 'N/A'}...</div>
              </div>
            </div>
            
            <!-- Navigation Menu -->
            <div class="flex space-x-6" id="nav-menu" style="opacity: 0;">
              <a href="#" data-route="/home" class="hover:text-green-300 transition-colors">> home</a>
              <a href="#" data-route="/game" class="hover:text-green-300 transition-colors">> game</a>
              <a href="#" data-route="/tournament" class="hover:text-green-300 transition-colors">> tournament</a>
              <a href="#" data-route="/profile" class="hover:text-green-300 transition-colors">> profile</a>
              <a href="#" data-route="/users" class="hover:text-green-300 transition-colors">> users</a>
              <button id="logout-btn" class="hover:text-red-400 transition-colors text-left">> logout</button>
            </div>
          </div>
        </div>
      </header>

      <!-- Terminal content -->
      <main class="flex-1 p-6">
        <div class="max-w-6xl mx-auto">
          <!-- ASCII Art Header -->
          <div class="mb-8">
            <pre id="ascii-art" class="text-green-400 text-sm md:text-base leading-tight opacity-0">
 ████████ ██████   █████  ███    ██ ███████  ██████ ███████ ███    ██ ██████  ███████ ███    ██  ██████ ███████
    ██    ██   ██ ██   ██ ████   ██ ██      ██      ██      ████   ██ ██   ██ ██      ████   ██ ██      ██
    ██    ██████  ███████ ██ ██  ██ ███████ ██      █████   ██ ██  ██ ██   ██ █████   ██ ██  ██ ██      █████
    ██    ██   ██ ██   ██ ██  ██ ██      ██ ██      ██      ██  ██ ██ ██   ██ ██      ██  ██ ██ ██      ██
    ██    ██   ██ ██   ██ ██   ████ ███████  ██████ ███████ ██   ████ ██████  ███████ ██   ████  ██████ ███████
            </pre>
            <div class="mt-4" id="terminal-prompt" style="opacity: 0;">
              <span class="text-green-500">user@42school:~$</span>
              <span id="cat-command" class="text-green-300"></span>
              <span id="cat-cursor" class="text-green-300 animate-pulse">_</span>
            </div>
            <div class="mt-2 text-green-400" id="welcome-messages" style="opacity: 0;">
              <div id="msg-1">> </div>
              <div id="msg-2">> </div>
              <div id="msg-3">> </div>
              <div id="msg-4">> </div>
            </div>
          </div>

          <!-- Command menu -->
          <div class="bg-gray-900 border border-green-400/30 p-6 mb-8" id="command-menu" style="opacity: 0;">
            <div class="text-green-300 mb-4" id="available-commands"></div>
            <div class="grid md:grid-cols-2 gap-4">
              <button data-route="/game" class="text-left p-3 border border-green-400/30 hover:bg-green-400/10 transition-colors">
                <div class="text-green-300">./start_game.sh</div>
                <div class="text-green-500 text-sm">Launch a new Pong match</div>
              </button>
              <button data-route="/tournament" class="text-left p-3 border border-green-400/30 hover:bg-green-400/10 transition-colors">
                <div class="text-green-300">./tournament.sh</div>
                <div class="text-green-500 text-sm">Join competitive tournaments</div>
              </button>
              <button data-route="/dashboard" class="text-left p-3 border border-green-400/30 hover:bg-green-400/10 transition-colors">
                <div class="text-green-300">./stats.sh</div>
                <div class="text-green-500 text-sm">View player statistics</div>
              </button>
              <div class="text-left p-3 border border-green-400/30">
                <div class="text-green-300">./help.sh</div>
                <div class="text-green-500 text-sm">Display help documentation</div>
              </div>
            </div>
          </div>

          <!-- System info -->
          <div class="grid md:grid-cols-3 gap-6 mb-8" id="system-info" style="opacity: 0;">
            <div class="bg-gray-900 border border-green-400/30 p-4">
              <div class="text-green-300 font-bold mb-2">[SYSTEM STATUS]</div>
              <div class="text-green-400 text-sm space-y-1">
                <div>Players online: <span class="text-green-300">42</span></div>
                <div>Active games: <span class="text-green-300">13</span></div>
                <div>Server load: <span class="text-green-300">optimal</span></div>
                <div>Ping: <span class="text-green-300">12ms</span></div>
              </div>
            </div>

            <div class="bg-gray-900 border border-green-400/30 p-4">
              <div class="text-green-300 font-bold mb-2">[TOURNAMENT INFO]</div>
              <div class="text-green-400 text-sm space-y-1">
                <div>Next tournament: <span class="text-green-300">15:30</span></div>
                <div>Prize pool: <span class="text-green-300">1000 pts</span></div>
                <div>Participants: <span class="text-green-300">8/16</span></div>
                <div>Status: <span class="text-green-300">registration open</span></div>
              </div>
            </div>

            <div class="bg-gray-900 border border-green-400/30 p-4">
              <div class="text-green-300 font-bold mb-2">[LEADERBOARD]</div>
              <div class="text-green-400 text-sm space-y-1">
                <div>1. <span class="text-green-300">h4ck3r42</span> - 2847 pts</div>
                <div>2. <span class="text-green-300">pingpong_master</span> - 2634 pts</div>
                <div>3. <span class="text-green-300">coder_elite</span> - 2421 pts</div>
                <div class="text-green-500">...</div>
              </div>
            </div>
          </div>

          <!-- Quick start -->
          <div class="bg-gray-900 border border-green-400/30 p-6" id="quick-start" style="opacity: 0;">
            <div class="text-green-300 mb-4" id="quick-start-title"></div>
            <div class="text-green-400 space-y-2">
              <div><span class="text-green-500">$</span> Ready to play? Execute the game launcher:</div>
              <button data-route="/game" class="block bg-black border border-green-400/50 p-3 hover:bg-green-400/10 transition-colors w-full text-left">
                <span class="text-green-300">./transcendence --mode=quickplay --difficulty=normal</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer terminal style -->
      <footer class="border-t border-green-400/30 p-4">
        <div class="max-w-6xl mx-auto text-center text-green-500 text-sm">
          <span class="text-green-400">[System Info]</span> Transcendence v1.0.0 | École 42 | Build ${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, "0")}.${String(new Date().getDate()).padStart(2, "0")}
        </div>
      </footer>
    </div>
  `;

  // Injecter le HTML dans le conteneur
  appDiv.innerHTML = homePageHtml;

  // Démarrer les animations
  startTypewriterAnimations();

  // Ajouter les event listeners pour la navigation
  setupNavigationListeners();
  setupLogoutListener();
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

// Animation de ligne par ligne
async function typeLines(
  lines: { id: string; text: string; speed?: number }[],
): Promise<void> {
  for (const line of lines) {
    await typeWriter(line.id, line.text, line.speed || ANIMATION_SPEED.TYPEWRITER_FAST);
    await new Promise((resolve) => setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT));
  }
}

// Démarrer toutes les animations en séquence
async function startTypewriterAnimations(): Promise<void> {
  // 1. Header command
  await typeWriter("header-command", "./transcendence.sh", ANIMATION_SPEED.TYPEWRITER_FAST);
  await new Promise((resolve) => setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT));

  // 2. Cacher le curseur du header et montrer le profil et menu nav
  const headerCursor = document.getElementById("header-cursor");
  const userProfile = document.getElementById("user-profile");
  const navMenu = document.getElementById("nav-menu");
  
  if (headerCursor) headerCursor.style.display = "none";
  
  if (userProfile) {
    userProfile.style.opacity = "1";
    userProfile.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }
  
  if (navMenu) {
    navMenu.style.opacity = "1";
    navMenu.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }

  // 3. Afficher ASCII art
  const asciiArt = document.getElementById("ascii-art");
  if (asciiArt) {
    asciiArt.style.opacity = "1";
    asciiArt.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }
  await new Promise((resolve) => setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT));

  // 4. Terminal prompt
  const terminalPrompt = document.getElementById("terminal-prompt");
  if (terminalPrompt) {
    terminalPrompt.style.opacity = "1";
    terminalPrompt.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }
  await new Promise((resolve) => setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT));

  await typeWriter("cat-command", "cat welcome.txt", ANIMATION_SPEED.TYPEWRITER_FAST);

  // 5. Cacher le curseur cat et afficher les messages
  const catCursor = document.getElementById("cat-cursor");
  if (catCursor) catCursor.style.display = "none";

  const welcomeMessages = document.getElementById("welcome-messages");
  if (welcomeMessages) {
    welcomeMessages.style.opacity = "1";
    welcomeMessages.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }

  // 6. Messages de bienvenue
  await typeLines([
    {
      id: "msg-1",
      text: "> Initialisation du système de jeu Pong 3D...",
      speed: ANIMATION_SPEED.TYPEWRITER_FAST,
    },
    { id: "msg-2", text: "> Connexion aux serveurs 42... [OK]", speed: ANIMATION_SPEED.TYPEWRITER_FAST },
    { id: "msg-3", text: "> Chargement des modules de jeu... [OK]", speed: ANIMATION_SPEED.TYPEWRITER_FAST },
    { id: "msg-4", text: "> Prêt pour le combat !", speed: ANIMATION_SPEED.TYPEWRITER_FAST },
  ]);

  await new Promise((resolve) => setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT));

  // 7. Available commands
  const commandMenu = document.getElementById("command-menu");
  if (commandMenu) {
    commandMenu.style.opacity = "1";
    commandMenu.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }
  await typeWriter("available-commands", "Available commands:", ANIMATION_SPEED.TYPEWRITER_FAST);

  await new Promise((resolve) => setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT));

  // 8. System info
  const systemInfo = document.getElementById("system-info");
  if (systemInfo) {
    systemInfo.style.opacity = "1";
    systemInfo.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }

  await new Promise((resolve) => setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT));

  // 9. Quick start
  const quickStart = document.getElementById("quick-start");
  if (quickStart) {
    quickStart.style.opacity = "1";
    quickStart.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }
  await typeWriter("quick-start-title", "Quick Start Guide:", ANIMATION_SPEED.TYPEWRITER_FAST);
}

function setupLogoutListener(): void {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      // Utiliser AuthManager.logout()
      console.log('Déconnexion en cours...');
      AuthManager.logout();
    });
  }
}
