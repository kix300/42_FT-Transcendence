import { getRouter } from "../router";
import { AuthManager } from "../utils/auth";
import { FriendManager } from "../utils/Friends";
import { Header } from "../components/Header";
import { escapeHtml } from "../utils/sanitize";
import { createHeader, HeaderConfigs } from "../components/Header";
//@ts-ignore -- mon editeur me donnais une erreur alors que npm run build non
import homePageHtml from "./html/HomePage.html?raw";
//@ts-ignore -- mon editeur me donnais une erreur alors que npm run build non
import homePageGuestHtml from "./html/HomePageGuest.html?raw";
//@ts-ignore -- mon editeur me donnais une erreur alors que npm run build non
import profilePageMatchHistory from "./html/ProfilePageMatchHistory.html?raw";

// Interface pour l'historique des matchs
interface Match {
  id: number;
  player1_id: number;
  player2_id: number;
  winner_id: number;
  player1_score?: number;
  player2_score?: number;
  is_tournament: number; // 0 ou 1 (SQLite boolean)
  date: string;
  player1_name?: string;
  player2_name?: string;
  winner_name?: string;
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

export async function HomePage(): Promise<void> {
  const appDiv = document.querySelector<HTMLDivElement>("#app");
  if (!appDiv) return;

  const isGuest = AuthManager.isGuest();
  if (isGuest) {
    await renderGuestHomePage(appDiv);
  } else {
    await renderAuthenticatedHomePage(appDiv);
  }
  // Page d'accueil pour les guests
  async function renderGuestHomePage(appDiv: HTMLDivElement): Promise<void> {
    const body = document.querySelector("body");
    if (body) {
      body.className = "bg-black min-h-screen font-mono text-green-400";
    }
    const header = createHeader(HeaderConfigs.guest);
    const headerHtml = await header.render();

    // Injecter le HTML dans le conteneur
    const buildDate = `${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, "0")}.${String(new Date().getDate()).padStart(2, "0")}`;
    const finalHtml = homePageGuestHtml
      .replace("{{header}}", headerHtml)
      .replace("{{buildDate}}", buildDate);

    appDiv.innerHTML = finalHtml;

    // Démarrer les animations
    startTypewriterAnimations();

    setupHomePageNavigation();
    // Ajouter les event listeners pour la navigation
    Header.setupEventListeners();
  }

  async function renderAuthenticatedHomePage(
    appDiv: HTMLDivElement,
  ): Promise<void> {
    // Classes CSS pour le body et conteneur principal
    const body = document.querySelector("body");
    if (body) {
      body.className = "bg-black min-h-screen font-mono text-green-400";
    }
    // Créer le header
    const header = createHeader(HeaderConfigs.profile);
    const headerHtml = await header.render();

    // Injecter le HTML dans le conteneur
    const buildDate = `${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, "0")}.${String(new Date().getDate()).padStart(2, "0")}`;
    const finalHtml = homePageHtml
      .replace("{{header}}", headerHtml)
      .replace("{{matchHistory}}", profilePageMatchHistory)
      .replace("{{buildDate}}", buildDate);

    appDiv.innerHTML = finalHtml;

    // Démarrer les animations
    startTypewriterAnimations();

    // Ajouter les event listeners pour la navigation
    Header.setupEventListeners();

    // Navigation des boutons redondans
    setupHomePageNavigation();

    // Friends search functionality
    FriendManager.setupFriendsListeners();
    FriendManager.loadFriendsList();
    // Charger l'historique des matchs
    await fetchAndDisplayMatchHistory();
  }
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
        const router = getRouter();
        if (router) {
          router.navigate(route);
        }
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
  const homeRoute = document.getElementById("route-home");

  if (headerCursor) headerCursor.style.display = "none";

  if (userProfile) {
    userProfile.style.opacity = "1";
    userProfile.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }

  if (homeRoute) {
    homeRoute.style.display = "none";
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
  const quickStart = document.getElementById("match-history-section");
  if (quickStart) {
    quickStart.style.opacity = "1";
    quickStart.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }
  await typeWriter(
    "match-history-section-title",
    "match-history-section:",
    ANIMATION_SPEED.TYPEWRITER_FAST,
  );
}
// Fonction pour récupérer et afficher l'historique des matchs
async function fetchAndDisplayMatchHistory(): Promise<void> {
  try {
    const response = await fetch("/api/matches", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(AuthManager.isAuthenticated() && !AuthManager.isGuest()
          ? { Authorization: `Bearer ${AuthManager.getToken()}` }
          : {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Failed to fetch match history:",
        response.status,
        errorText,
      );
      displayMatchHistory([]);
      return;
    }

    const data = await response.json();
    // Afficher les matchs dans le UI
    displayMatchHistory(data.matches);
    setupMatchHistoryFilters(data.matches);
  } catch (error) {
    console.error("❌ Error fetching match history:", error);
    displayMatchHistory([]);
  }
}

// Fonction pour afficher l'historique des matchs dans le UI
function displayMatchHistory(matches: Match[], filter: string = "all"): void {
  const historyList = document.getElementById("match-history-list");
  if (!historyList) return;

  // Filtrer les matchs
  let filteredMatches = matches;
  if (filter === "tournament") {
    filteredMatches = matches.filter((m) => m.is_tournament === 1);
  } else if (filter === "normal") {
    filteredMatches = matches.filter((m) => m.is_tournament === 0);
  }

  if (filteredMatches.length === 0) {
    historyList.innerHTML = `
      <div class="text-green-400/50 text-sm text-center py-8">
        ${filter === "all" ? "No matches played yet" : `No ${filter} matches found`}
      </div>
    `;
    return;
  }

  const html = filteredMatches
    .map((match) => {
      const winnerBadge =
        match.is_tournament === 1
          ? '<span class="text-yellow-400 text-xs">🏆 TOURNAMENT</span>'
          : '<span class="text-cyan-400 text-xs">🎮 MATCH</span>';

      return `
      <div class="border border-green-400/30 bg-black/50 p-4 rounded hover:border-green-400/50 transition-colors">
        <div class="flex justify-between items-start mb-2">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-green-400 font-bold">${escapeHtml(match.player1_name || "Player 1")}</span>
              <span class="text-green-400/50 text-sm">${match.player1_score ?? 0}</span>
              <span class="text-green-400/30">-</span>
              <span class="text-green-400/50 text-sm">${match.player2_score ?? 0}</span>
              <span class="text-green-400 font-bold">${escapeHtml(match.player2_name || "Player 2")}</span>
            </div>
            <div class="text-xs text-green-400/70">
              Winner: <span class="text-green-300">${escapeHtml(match.winner_name || "Unknown")}</span>
            </div>
          </div>
          <div class="text-right">
            ${winnerBadge}
            <div class="text-xs text-green-400/50 mt-1">
              ${new Date(match.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  historyList.innerHTML = html;
}

// Setup des filtres pour l'historique
function setupMatchHistoryFilters(matches: Match[]): void {
  const filterAll = document.getElementById("filter-all");
  const filterTournament = document.getElementById("filter-tournament");
  const filterNormal = document.getElementById("filter-normal");

  const updateActiveFilter = (activeBtn: HTMLElement | null) => {
    [filterAll, filterTournament, filterNormal].forEach((btn) => {
      if (btn) {
        btn.classList.remove("bg-green-400/20", "border-green-400/50");
        btn.classList.add(
          "bg-gray-800",
          "border-green-400/30",
          "text-green-400/70",
        );
      }
    });
    if (activeBtn) {
      activeBtn.classList.remove(
        "bg-gray-800",
        "border-green-400/30",
        "text-green-400/70",
      );
      activeBtn.classList.add("bg-green-400/20", "border-green-400/50");
    }
  };

  filterAll?.addEventListener("click", () => {
    displayMatchHistory(matches, "all");
    updateActiveFilter(filterAll);
  });

  filterTournament?.addEventListener("click", () => {
    displayMatchHistory(matches, "tournament");
    updateActiveFilter(filterTournament);
  });

  filterNormal?.addEventListener("click", () => {
    displayMatchHistory(matches, "normal");
    updateActiveFilter(filterNormal);
  });
}
