import { getRouter } from "../router";
import { AuthManager } from "../utils/auth";
import { Header } from "../components/Header";
import { createHeader, HeaderConfigs } from "../components/Header";
import { USERS_API, FRIENDS_API } from "../utils/apiConfig";

// Interface pour les utilisateurs recherchés
interface SearchedUser {
  id: number;
  username: string;
  email: string;
  photo: string;
}

// Interface pour les amis
interface Friend {
  id: number;
  username: string;
  photo: string;
  status?: string;
}

// Variable globale pour contrôler la vitesse d'écriture des animations
const ANIMATION_SPEED = {
  TYPEWRITER_FAST: 0, // Vitesse rapide pour les commandes
  TYPEWRITER_NORMAL: 15, // Vitesse normale pour les textes
  TYPEWRITER_SLOW: 20, // Vitesse lente pour les titres
  DELAY_SHORT: 0, // Délai court entre les animations
  DELAY_MEDIUM: 100, // Délai moyen
  DELAY_LONG: 150, // Délai long
  TRANSITION_FAST: 0, // Transition rapide
  TRANSITION_NORMAL: 0.5, // Transition normale
};

export async function HomePage(): Promise<void> {
  // Vérifier l'authentification AVANT d'afficher la page
  if (!AuthManager.isAuthenticated()) {
    console.log("Utilisateur non authentifié, redirection vers login");
    const router = getRouter();
    if (router) {
      router.navigate("/login");
    }
    return;
  }

  const appDiv = document.querySelector<HTMLDivElement>("#app");
  if (!appDiv) return;

  // Classes CSS pour le body et conteneur principal
  const body = document.querySelector("body");
  if (body) {
    body.className = "bg-black min-h-screen font-mono text-green-400";
  }
  // Créer le header
  const header = createHeader(HeaderConfigs.profile);
  const headerHtml = await header.render();

  // HTML de la page d'accueil
  const homePageHtml = `
    <div class="min-h-screen flex flex-col bg-black text-green-400 font-mono">
      ${headerHtml}

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
            </div>
          </div>

          <!-- Friends Section -->
          <div class="bg-gray-900 border border-green-400/30 p-6 mb-8" id="friends-section" style="opacity: 0;">
            <h2 class="text-green-300 font-bold mb-4 text-xl">[FRIENDS]</h2>

            <!-- Search Bar -->
            <div class="mb-6">
              <div class="flex space-x-2">
                <input
                  type="text"
                  id="friend-search-input"
                  placeholder="Search users by username..."
                  class="flex-1 bg-black border border-green-400/30 text-green-400 p-3 rounded focus:border-green-400 focus:outline-none"
                />
                <button
                  id="friend-search-btn"
                  class="bg-green-400/20 border border-green-400/50 text-green-400 px-6 py-2 rounded hover:bg-green-400/30 transition-colors"
                >
                  [SEARCH]
                </button>
              </div>

              <!-- Search Results -->
              <div id="search-results" class="mt-4 space-y-2 hidden">
                <div class="text-green-500 text-sm mb-2">[SEARCH RESULTS]</div>
                <div id="search-results-list" class="space-y-2 max-h-60 overflow-y-auto"></div>
              </div>
            </div>

            <!-- Friends List -->
            <div class="mb-4">
              <h3 class="text-green-500 font-bold mb-3">[YOUR FRIENDS]</h3>
              <div id="friends-list" class="space-y-2">
                <div class="text-green-400/50 text-sm">Loading friends...</div>
              </div>
            </div>
          </div>

          <!-- Quick start -->
          <div class="bg-gray-900 border border-green-400/30 p-6" id="History" style="opacity: 0;">
            <div class="text-green-300 mb-4" id="History-title"></div>
            <div class="text-green-400 space-y-2">
              <div><span class="text-green-500">$</span> Ready to play? Look at your match:</div
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
  Header.setupEventListeners();

  // Navigation des boutons redondans
  setupHomePageNavigation();

  // Friends search functionality
  setupFriendsListeners();
  loadFriendsList();
}

function setupHomePageNavigation(): void {
  // Boutons de navigation dans le contenu principal
  const navigationButtons = document.querySelectorAll("[data-route]");

  navigationButtons.forEach((button) => {
    // Skip les boutons du header qui sont déjà gérés par Header.setupEventListeners()
    if (button.closest("header")) return;

    button.addEventListener("click", (e) => {
      e.preventDefault();
      const route = button.getAttribute("data-route");

      if (route) {
        console.log(`Navigation vers: ${route}`);
        import("../router").then(({ getRouter }) => {
          const router = getRouter();
          if (router) {
            router.navigate(route);
          }
        });
      }
    });
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
    await typeWriter(
      line.id,
      line.text,
      line.speed || ANIMATION_SPEED.TYPEWRITER_FAST,
    );
    await new Promise((resolve) =>
      setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
    );
  }
}

// Démarrer toutes les animations en séquence
async function startTypewriterAnimations(): Promise<void> {
  // 1. Header command
  await typeWriter(
    "header-command",
    "./transcendence.sh",
    ANIMATION_SPEED.TYPEWRITER_FAST,
  );
  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

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
  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

  // 4. Terminal prompt
  const terminalPrompt = document.getElementById("terminal-prompt");
  if (terminalPrompt) {
    terminalPrompt.style.opacity = "1";
    terminalPrompt.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }
  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

  await typeWriter(
    "cat-command",
    "cat welcome.txt",
    ANIMATION_SPEED.TYPEWRITER_FAST,
  );

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
    {
      id: "msg-2",
      text: "> Connexion aux serveurs 42... [OK]",
      speed: ANIMATION_SPEED.TYPEWRITER_FAST,
    },
    {
      id: "msg-3",
      text: "> Chargement des modules de jeu... [OK]",
      speed: ANIMATION_SPEED.TYPEWRITER_FAST,
    },
    {
      id: "msg-4",
      text: "> Prêt pour le combat !",
      speed: ANIMATION_SPEED.TYPEWRITER_FAST,
    },
  ]);

  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

  // 7. Available commands
  const commandMenu = document.getElementById("command-menu");
  if (commandMenu) {
    commandMenu.style.opacity = "1";
    commandMenu.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }
  await typeWriter(
    "available-commands",
    "Available commands:",
    ANIMATION_SPEED.TYPEWRITER_FAST,
  );

  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

  // 8. System info
  const systemInfo = document.getElementById("system-info");
  if (systemInfo) {
    systemInfo.style.opacity = "1";
    systemInfo.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }

  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

  // 9. Friends section
  const friendsSection = document.getElementById("friends-section");
  if (friendsSection) {
    friendsSection.style.opacity = "1";
    friendsSection.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }

  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

  // 10. Quick start
  const quickStart = document.getElementById("History");
  if (quickStart) {
    quickStart.style.opacity = "1";
    quickStart.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }
  await typeWriter(
    "History-title",
    "History:",
    ANIMATION_SPEED.TYPEWRITER_FAST,
  );
}

// Setup friends search listeners
function setupFriendsListeners(): void {
  const searchInput = document.getElementById(
    "friend-search-input",
  ) as HTMLInputElement;
  const searchBtn = document.getElementById("friend-search-btn");

  // Search on button click
  searchBtn?.addEventListener("click", () => {
    const query = searchInput?.value.trim();
    if (query) {
      searchUsers(query);
    } else {
      // Hide search results if query is empty
      const searchResultsDiv = document.getElementById("search-results");
      if (searchResultsDiv) {
        searchResultsDiv.classList.add("hidden");
      }
    }
  });

  // Search on Enter key
  searchInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const query = searchInput.value.trim();
      if (query) {
        searchUsers(query);
      } else {
        // Hide search results if query is empty
        const searchResultsDiv = document.getElementById("search-results");
        if (searchResultsDiv) {
          searchResultsDiv.classList.add("hidden");
        }
      }
    }
  });
}

// Search users via API
async function searchUsers(query: string): Promise<void> {
  const searchResultsDiv = document.getElementById("search-results");
  const searchResultsList = document.getElementById("search-results-list");

  if (!searchResultsDiv || !searchResultsList) return;

  try {
    searchResultsList.innerHTML =
      '<div class="text-green-400/50 text-sm">Searching...</div>';
    searchResultsDiv.classList.remove("hidden");

    const response = await AuthManager.fetchWithAuth(USERS_API.GET_ALL);

    if (response.ok) {
      const allUsers: SearchedUser[] = await response.json();

      // Filter users by search query (case insensitive)
      const users = allUsers.filter((user) =>
        user.username.toLowerCase().includes(query.toLowerCase()),
      );

      if (users.length === 0) {
        searchResultsList.innerHTML =
          '<div class="text-green-400/50 text-sm">No users found matching "' +
          query +
          '"</div>';
        return;
      }

      // Display search results
      searchResultsList.innerHTML = users
        .map(
          (user) => `
        <div class="bg-black border border-green-400/20 p-3 rounded flex items-center justify-between hover:border-green-400/40 transition-colors">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full bg-green-400/20 border border-green-400/50 flex items-center justify-center overflow-hidden">
              ${
                user.photo
                  ? `<img src="${user.photo}" alt="${user.username}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                   <span class="text-green-400 font-bold hidden">${user.username.charAt(0).toUpperCase()}</span>`
                  : `<span class="text-green-400 font-bold">${user.username.charAt(0).toUpperCase()}</span>`
              }
            </div>
            <div>
              <div class="text-green-400 font-bold">${user.username}</div>
              <div class="text-green-500 text-xs">ID: #${user.id}</div>
            </div>
          </div>
          <button
            class="add-friend-btn bg-green-400/20 border border-green-400/50 text-green-400 px-4 py-1 rounded hover:bg-green-400/30 transition-colors text-sm"
            data-user-id="${user.id}"
            data-username="${user.username}"
          >
            [ADD]
          </button>
        </div>
      `,
        )
        .join("");

      // Add event listeners to Add buttons
      const addButtons = searchResultsList.querySelectorAll(".add-friend-btn");
      addButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const target = e.target as HTMLElement;
          const userId = target.getAttribute("data-user-id");
          const username = target.getAttribute("data-username");
          if (userId && username) {
            addFriend(parseInt(userId), username);
          }
        });
      });
    } else {
      searchResultsList.innerHTML =
        '<div class="text-red-400 text-sm">Error searching users</div>';
    }
  } catch (error) {
    console.error("Error searching users:", error);
    searchResultsList.innerHTML =
      '<div class="text-red-400 text-sm">Network error</div>';
  }
}

// Add friend
async function addFriend(userId: number, username: string): Promise<void> {
  try {
    const response = await AuthManager.fetchWithAuth(FRIENDS_API.ADD, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ friendId: userId }),
    });

    if (response.ok) {
      showMessage(` Friend added ${username}`, "success");
      loadFriendsList(); // Refresh friends list
    } else {
      const errorData = await response.json();
      showMessage(
        `Failed to add friend: ${errorData.error || "Unknown error"}`,
        "error",
      );
    }
  } catch (error) {
    console.error("Error adding friend:", error);
    showMessage("Network error. Please try again.", "error");
  }
}

// Load friends list
async function loadFriendsList(): Promise<void> {
  const friendsList = document.getElementById("friends-list");

  if (!friendsList) return;

  try {
    const response = await AuthManager.fetchWithAuth(FRIENDS_API.GET_ALL);

    if (response.ok) {
      const friends: Friend[] = await response.json();

      if (friends.length === 0) {
        friendsList.innerHTML =
          '<div class="text-green-400/50 text-sm">No friends yet. Use the search bar to add friends!</div>';
        return;
      }

      // Display friends
      friendsList.innerHTML = friends
        .map(
          (friend) => `
        <div class="bg-black border border-green-400/20 p-3 rounded flex items-center justify-between hover:border-green-400/40 transition-colors">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full bg-green-400/20 border border-green-400/50 flex items-center justify-center overflow-hidden">
              ${
                friend.photo
                  ? `<img src="${friend.photo}" alt="${friend.username}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                   <span class="text-green-400 font-bold hidden">${friend.username.charAt(0).toUpperCase()}</span>`
                  : `<span class="text-green-400 font-bold">${friend.username.charAt(0).toUpperCase()}</span>`
              }
            </div>
            <div>
              <div class="text-green-400 font-bold">${friend.username}</div>
              ${friend.status ? `<div class="text-green-500 text-xs">${friend.status}</div>` : ""}
            </div>
          </div>
          <div class="flex space-x-2">
            <button
              class="view-profile-btn bg-blue-400/20 border border-blue-400/50 text-blue-400 px-3 py-1 rounded hover:bg-blue-400/30 transition-colors text-sm"
              data-user-id="${friend.id}"
            >
              [VIEW]
            </button>
            <button
              class="remove-friend-btn bg-red-400/20 border border-red-400/50 text-red-400 px-3 py-1 rounded hover:bg-red-400/30 transition-colors text-sm"
              data-user-id="${friend.id}"
              data-username="${friend.username}"
            >
              [REMOVE]
            </button>
          </div>
        </div>
      `,
        )
        .join("");

      // Add event listeners
      const removeButtons = friendsList.querySelectorAll(".remove-friend-btn");
      removeButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const target = e.target as HTMLElement;
          const userId = target.getAttribute("data-user-id");
          const username = target.getAttribute("data-username");
          if (userId && username) {
            removeFriend(username);
          }
        });
      });

      const viewButtons = friendsList.querySelectorAll(".view-profile-btn");
      viewButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const target = e.target as HTMLElement;
          const userId = target.getAttribute("data-user-id");
          if (userId) {
            // TODO: Navigate to user's profile
            showMessage(
              `Viewing profile #${userId} - Feature coming soon!`,
              "info",
            );
          }
        });
      });
    } else {
      friendsList.innerHTML =
        '<div class="text-red-400 text-sm">Error loading friends</div>';
    }
  } catch (error) {
    console.error("Error loading friends:", error);
    friendsList.innerHTML =
      '<div class="text-red-400 text-sm">No friends available</div>';
  }
}

// Remove friend
async function removeFriend(username: string): Promise<void> {
  if (
    !confirm(`Are you sure you want to remove ${username} from your friends?`)
  ) {
    return;
  }

  try {
    const response = await AuthManager.fetchWithAuth(FRIENDS_API.DELETE, {
      method: "DELETE",
    });

    if (response.ok) {
      showMessage(`Removed ${username} from friends`, "success");
      loadFriendsList(); // Refresh friends list
    } else {
      const errorData = await response.json();
      showMessage(
        `Failed to remove friend: ${errorData.error || "Unknown error"}`,
        "error",
      );
    }
  } catch (error) {
    console.error("Error removing friend:", error);
    showMessage("Network error. Please try again.", "error");
  }
}

// Fonction pour afficher les messages
function showMessage(
  message: string,
  type: "success" | "error" | "info",
): void {
  // Créer un container de messages s'il n'existe pas
  let messagesContainer = document.getElementById("home-messages");
  if (!messagesContainer) {
    messagesContainer = document.createElement("div");
    messagesContainer.id = "home-messages";
    messagesContainer.className = "fixed top-4 right-4 z-50 space-y-2";
    document.body.appendChild(messagesContainer);
  }

  const messageDiv = document.createElement("div");
  messageDiv.className = `p-3 border-l-4 max-w-sm bg-gray-900 border border-green-400/30 ${
    type === "success"
      ? "border-l-green-400 text-green-300"
      : type === "error"
        ? "border-l-red-400 text-red-300"
        : "border-l-blue-400 text-blue-300"
  }`;

  const prefix =
    type === "success" ? "[SUCCESS]" : type === "error" ? "[ERROR]" : "[INFO]";
  messageDiv.innerHTML = `<span class="font-bold">${prefix}</span> ${message}`;

  messagesContainer.appendChild(messageDiv);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.remove();
    }
    // Remove container if empty
    if (messagesContainer && messagesContainer.children.length === 0) {
      messagesContainer.remove();
    }
  }, 5000);
}
