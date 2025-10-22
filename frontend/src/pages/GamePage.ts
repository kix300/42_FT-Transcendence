//@ts-ignore
import { Engine } from "@babylonjs/core/Engines/engine";
import { Game } from "../Game";
import { AuthManager } from "../utils/auth";
import { escapeHtml } from "../utils/sanitize";
import { submitMatchResultToBackend } from "./TournamentPage";
//@ts-ignore
import gamePageCompleteHtml from "./html/GamePage.html?raw";
import { createHeader, HeaderConfigs, Header } from "../components/Header";
import { PlayerSessionManager } from "../utils/playerSession";
//@ts-ignore
import gamePageOverlayHtml from "./html/GamePage-overlay.html?raw";
//@ts-ignore
import loginModalHtml from "./html/GamePageLoginModal.html?raw";
import { PROFILE_API } from "../utils/apiConfig";

// Types pour les données des joueurs
interface PlayerData {
  id?: number;
  username: string;
  avatar?: string;
  isGuest: boolean;
  stats?: {
    totalMatches: number;
    wins: number;
    losses: number;
  };
}
// Ajouter l'interface au début du fichier, après les autres interfaces
interface MatchData {
  matchId: string;
  player1: {
    id: string;
    name: string;
  };
  player2: {
    id: string;
    name: string;
  };
  isTournamentMatch: boolean;
}

export async function GamePage(): Promise<void> {
  const isGuest = AuthManager.isGuest();
  const appDiv = document.querySelector<HTMLDivElement>("#app");
  if (!appDiv) return;
  // let userProfile: UserProfile | null = null;

  // Apply terminal-like styles
  const body = document.querySelector("body");
  if (body) {
    body.className = "bg-black min-h-screen font-mono text-green-400";
  }

  if (appDiv) {
    appDiv.className = "w-full flex flex-col h-screen";
    // Create and render the shared header
    const header = isGuest
      ? createHeader(HeaderConfigs.guest)
      : createHeader(HeaderConfigs.game);
    const headerHtml = await header.render();

    // Prepare the complete page content with build date replacement
    const buildDate = `${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, "0")}.${String(new Date().getDate()).padStart(2, "0")}`;
    const pageContentHtml = gamePageCompleteHtml.replace(
      "{{buildDate}}",
      buildDate,
    );

    // Assemble the page
    appDiv.innerHTML = headerHtml + pageContentHtml;

    // Setup event listeners for the shared header
    Header.setupEventListeners();

    setupPlayerEventListeners();

    showHeaderElements();

    // Si l'utilisateur est déjà connecté, afficher son profil sur Player 1
    if (AuthManager.isAuthenticated() && !AuthManager.isGuest()) {
      const profileData = await fetchUserProfile();

      if (profileData) {
        // Afficher le profil du joueur
        displayPlayerProfile(1, profileData);
      }
    }
  }

  // Fonction pour afficher le profil d'un joueur
  function displayPlayerProfile(
    playerNum: number,
    playerData: PlayerData,
  ): void {
    const buttonsDiv = document.getElementById(`player${playerNum}-buttons`);
    const infoDiv = document.getElementById(`player${playerNum}-info`);
    const usernameDiv = document.getElementById(`player${playerNum}-username`);
    const statusDiv = document.getElementById(`player${playerNum}-status`);
    const avatarDiv = document.getElementById(`player${playerNum}-avatar`);
    const guestMessageDiv = document.getElementById(
      `player${playerNum}-guest-message`,
    );
    const winsDiv = document.getElementById(`player${playerNum}-wins`);

    if (buttonsDiv && infoDiv && usernameDiv && statusDiv && avatarDiv) {
      // Cacher les boutons
      buttonsDiv.classList.add("hidden");

      // Afficher les infos
      infoDiv.classList.remove("hidden");

      // Gérer le message guest
      if (guestMessageDiv) {
        if (playerData.isGuest) {
          guestMessageDiv.classList.remove("hidden");
        } else {
          guestMessageDiv.classList.add("hidden");
        }
      }

      // Mettre à jour le username
      usernameDiv.textContent = escapeHtml(playerData.username);

      // Mettre à jour le status
      if (playerData.isGuest) {
        statusDiv.textContent = "Guest Mode";
        statusDiv.className = "text-cyan-400 text-xs";
      } else {
        statusDiv.textContent = "Connected";
        statusDiv.className = "text-green-400 text-xs";
      }

      // Mettre à jour les stats (wins depuis le backend)
      if (winsDiv && playerData.stats) {
        winsDiv.textContent = playerData.stats.wins.toString();
      }

      // Mettre à jour l'avatar
      if (playerData.avatar && !playerData.isGuest) {
        avatarDiv.innerHTML = `<img src="${escapeHtml(playerData.avatar)}" alt="Avatar" class="w-full h-full object-cover" />`;
      } else if (!playerData.isGuest) {
        // Utiliser l'initiale du username
        const initial = playerData.username.charAt(0).toUpperCase();
        avatarDiv.innerHTML = `<span class="text-green-400 text-xl font-bold">${escapeHtml(initial)}</span>`;
      } else {
        // Mode guest
        avatarDiv.innerHTML = `<span class="text-cyan-400 text-xl">👤</span>`;
      }
      // Sauvegarder dans la session
      PlayerSessionManager.savePlayer({
        slotNumber: playerNum,
        id: playerData.id,
        username: playerData.username,
        avatar: playerData.avatar,
        isGuest: playerData.isGuest,
        connectedAt: Date.now(),
      });
    }
  }

  // Fonction pour déconnecter un joueur
  function disconnectPlayer(playerNum: number): void {
    const buttonsDiv = document.getElementById(`player${playerNum}-buttons`);
    const infoDiv = document.getElementById(`player${playerNum}-info`);

    if (buttonsDiv && infoDiv) {
      // Afficher les boutons
      buttonsDiv.classList.remove("hidden");

      // Cacher les infos
      infoDiv.classList.add("hidden");
      // Supprimer de la session
      PlayerSessionManager.disconnectPlayer(playerNum);
    }
  }

  // Fonction pour récupérer le profil depuis l'API
  async function fetchUserProfile(): Promise<PlayerData | null> {
    try {
      const response = await AuthManager.fetchWithAuth(PROFILE_API.GET_ME);

      if (!response.ok) {
        console.error("Failed to fetch user profile");
        return null;
      }

      const data = await response.json();

      return {
        id: data.user.id,
        username: data.user.username,
        avatar: data.user.photo,
        isGuest: false,
        stats: {
          totalMatches: data.stats.totalMatches,
          wins: data.stats.wins,
          losses: data.stats.losses,
        },
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  // Fonction pour afficher le modal de connexion
  function showLoginModal(playerNum: number): void {
    const body = document.querySelector("body");
    if (!body) return;

    // Créer le HTML du modal
    const modalHtml = loginModalHtml.replace(
      "{{playerNum}}",
      playerNum.toString(),
    );
    body.insertAdjacentHTML("beforeend", modalHtml);

    const modal = document.getElementById("login-modal");
    const loginForm = document.getElementById("login-form") as HTMLFormElement;
    const cancelBtn = document.getElementById("cancel-login");
    const goToRegisterBtn = document.getElementById("go-to-register");
    const loginError = document.getElementById("login-error");

    // Fermer le modal
    const closeModal = () => {
      if (modal) {
        modal.remove();
      }
    };

    // Afficher une erreur
    const showLoginError = (message: string) => {
      if (loginError) {
        loginError.textContent = message;
        loginError.classList.remove("hidden");
      }
    };

    // Cacher l'erreur
    const hideLoginError = () => {
      if (loginError) {
        loginError.classList.add("hidden");
      }
    };

    // Gérer la soumission du formulaire
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideLoginError();

        const formData = new FormData(loginForm);
        const username = formData.get("username") as string;
        const password = formData.get("password") as string;

        if (!username || !password) {
          showLoginError("Please fill in all required fields.");
          return;
        }

        try {
          // Authentification temporaire SANS modifier le token global
          // (valable pour Player 1 ET Player 2)
          const response = await fetch("/api/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
          });

          if (!response.ok) {
            showLoginError("Invalid username or password.");
            return;
          }

          const data = await response.json();

          // Récupérer les infos complètes du profil avec le token temporaire
          const profileResponse = await fetch("/api/me", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${data.token}`,
              "Content-Type": "application/json",
            },
          });

          if (!profileResponse.ok) {
            showLoginError("Failed to fetch user profile.");
            return;
          }

          const profileFullData = await profileResponse.json();

          // Créer les données du joueur
          const profileData: PlayerData = {
            id: profileFullData.user.id,
            username: profileFullData.user.username,
            avatar: profileFullData.user.photo,
            isGuest: false,
          };

          // Afficher le profil du joueur
          displayPlayerProfile(playerNum, profileData);
          closeModal();
          console.log(
            `Player ${playerNum} logged in successfully as ${profileData.username}`,
          );
        } catch (error) {
          console.error("Login error:", error);
          showLoginError("An error occurred during login. Please try again.");
        }
      });
    }

    // Gérer l'annulation
    if (cancelBtn) {
      cancelBtn.addEventListener("click", closeModal);
    }

    // Gérer la navigation vers Register
    if (goToRegisterBtn) {
      goToRegisterBtn.addEventListener("click", () => {
        closeModal();
        import("../router").then(({ getRouter }) => {
          const router = getRouter();
          if (router) {
            router.navigate("/register");
          }
        });
      });
    }

    // Fermer en cliquant à l'extérieur
    if (modal) {
      modal.addEventListener("click", (e: MouseEvent) => {
        if (e.target === modal) {
          closeModal();
        }
      });
    }

    // Fermer avec Escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", handleEscape);
      }
    };
    document.addEventListener("keydown", handleEscape);

    // Focus sur le champ username
    const usernameInput = document.getElementById(
      "login-username",
    ) as HTMLInputElement;
    if (usernameInput) {
      usernameInput.focus();
    }
  }

  // setupEventListeners
  function setupPlayerEventListeners(): void {
    // LoginP1
    const loginP1Btn = document.getElementById("player1-login-btn");
    if (loginP1Btn) {
      loginP1Btn.addEventListener("click", async () => {
        console.log("Login Player 1");

        // Vérifier si l'utilisateur est déjà connecté globalement
        if (AuthManager.isAuthenticated() && !AuthManager.isGuest()) {
          const profileData = await fetchUserProfile();
          if (profileData) {
            displayPlayerProfile(1, profileData);
          }
        } else {
          // Afficher le modal de connexion
          showLoginModal(1);
        }
      });
    }

    // LoginP2
    const loginP2Btn = document.getElementById("player2-login-btn");
    if (loginP2Btn) {
      loginP2Btn.addEventListener("click", async () => {
        console.log("Login Player 2");
        // Afficher le modal de connexion
        showLoginModal(2);
      });
    }

    // guestP1
    const guestP1Btn = document.getElementById("player1-guest-btn");
    if (guestP1Btn) {
      guestP1Btn.addEventListener("click", () => {
        console.log("Guest Player 1");
        displayPlayerProfile(1, {
          username: "Guest Player 1",
          isGuest: true,
        });
      });
    }

    // guestP2
    const guestP2Btn = document.getElementById("player2-guest-btn");
    if (guestP2Btn) {
      guestP2Btn.addEventListener("click", () => {
        console.log("Guest Player 2");
        displayPlayerProfile(2, {
          username: "Guest Player 2",
          isGuest: true,
        });
      });
    }

    // Disconnect buttons
    const disconnectP1Btn = document.getElementById("player1-disconnect-btn");
    if (disconnectP1Btn) {
      disconnectP1Btn.addEventListener("click", () => {
        disconnectPlayer(1);
      });
    }

    const disconnectP2Btn = document.getElementById("player2-disconnect-btn");
    if (disconnectP2Btn) {
      disconnectP2Btn.addEventListener("click", () => {
        disconnectPlayer(2);
      });
    }
  }

  // Show header elements with fade-in animation
  function showHeaderElements(): void {
    const userProfile = document.getElementById("user-profile");
    const navMenu = document.getElementById("nav-menu");
    const routeGame = document.getElementById("route-game");

    if (routeGame) {
      routeGame.style.display = "none";
    }

    if (userProfile) {
      userProfile.style.opacity = "1";
      userProfile.style.transition = "opacity 0.3s";
    }

    if (navMenu) {
      navMenu.style.opacity = "1";
      navMenu.style.transition = "opacity 0.3s";
    }
  }
  // Header and footer are now part of the appDiv innerHTML.
  // The mouse move logic is no longer needed.

  // Logique du jeu
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
  if (!canvas) {
    console.error("Canvas not found!");
    return;
  }

  const engine = new Engine(canvas, true);
  const game = new Game(engine, canvas);

  // Check if this is a tournament match
  const matchDataStr = sessionStorage.getItem("currentMatch");
  let matchData: MatchData | null = null;
  if (matchDataStr) {
    try {
      matchData = JSON.parse(matchDataStr) as MatchData;
      // Si c'est un match de tournoi, configurer les joueurs et désactiver le mode 3 joueurs
      if (matchData?.isTournamentMatch) {
        // Modifier les titres des panneaux avec les noms des joueurs du tournoi
        const player1Title = document.querySelector(".w-64:first-child h3");
        const player2Title = document.querySelector(".w-64:last-child h3");

        if (player1Title) {
          player1Title.textContent = `> ${matchData.player1.name}`;
        }

        if (player2Title) {
          player2Title.textContent = `> ${matchData.player2.name}`;
        }

        // Désactiver le bouton 3 joueurs et afficher le match ID à la place
        const controlsContainer = document.getElementById("game-controls");
        if (controlsContainer) {
          const buttons = controlsContainer.querySelectorAll("a");
          buttons.forEach((button) => {
            const text = button.textContent?.trim();
            if (text === "[3 Players]") {
              // Remplacer le bouton 3 joueurs par l'affichage du match ID
              button.outerHTML = `
                <div class="bg-green-400/20 border border-green-400/50 text-green-300 px-4 py-2 text-sm rounded font-medium">
                  <span class="text-green-500">MATCH #${escapeHtml(matchData!.matchId)}</span>
                </div>
              `;
            }
          });
        }
      }
    } catch (e) {
      console.error("Error parsing match data:", e);
    }
  }

  // Set up game end callback
  game.setGameEndCallback((winner: number, score1: number, score2: number) => {
    showGameEndOverlay(winner, score1, score2, matchData);
  });

  const controlsContainer = document.getElementById("game-controls");
  if (controlsContainer) {
    const buttons = controlsContainer.querySelectorAll("a");
    buttons.forEach((button) => {
      const text = button.textContent?.trim();
      if (text === "[2 Players]") {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          game.switchToTwoPlayerMode();
        });
      } else if (text === "[3 Players]") {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          game.switchToThreePlayerMode();
        });
      }
    });
  }

  // Démarrer le jeu
  game.start();

  // Gestion du redimensionnement
  const resizeHandler = () => {
    engine.resize();
  };
  window.addEventListener("resize", resizeHandler);

  // Gestion des boutons de contrôle du jeu
  const pauseBtn = document.getElementById("pause-btn");
  const restartBtn = document.getElementById("restart-btn");

  let isPaused = false;

  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      if (isPaused) {
        // Reprendre le jeu
        engine.runRenderLoop(() => {
          game.update();
          game.scene.render();
        });
        pauseBtn.textContent = "[Pause]";
        pauseBtn.className =
          "bg-yellow-400/20 border border-yellow-400/50 text-yellow-300 px-4 py-2 hover:bg-yellow-400/30 transition-colors text-sm rounded font-medium min-w-[100px] whitespace-nowrap";
      } else {
        // Mettre en pause
        engine.stopRenderLoop();
        pauseBtn.textContent = "[Resume]";
        pauseBtn.className =
          "bg-green-400/20 border border-green-400/50 text-green-300 px-4 py-2 hover:bg-green-400/30 transition-colors text-sm rounded font-medium min-w-[100px] whitespace-nowrap";
      }
      isPaused = !isPaused;
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      // Restart le jeu via router (SPA style)
      import("../router").then(({ getRouter }) => {
        const router = getRouter();
        if (router) {
          router.navigate("/game");
        }
      });
    });
  }

  // Stocker les références pour le nettoyage
  (window as any).gamePageCleanupFunctions = [
    () => window.removeEventListener("resize", resizeHandler),
    () => engine.dispose(),
    () => {
      if ((window as any).gamePageCleanup) {
        (window as any).gamePageCleanup();
      }
    },
  ];
}

// Fonction de nettoyage pour quand on quitte la page
export function cleanupGamePage(): void {
  if ((window as any).gamePageCleanupFunctions) {
    (window as any).gamePageCleanupFunctions.forEach((cleanup: Function) => {
      try {
        cleanup();
      } catch (error) {
        console.warn("Error during game page cleanup:", error);
      }
    });
    delete (window as any).gamePageCleanupFunctions;
  }
}

// Show game end overlay with final scores
function showGameEndOverlay(
  winner: number,
  score1: number,
  score2: number,
  matchData: any,
): void {
  const body = document.querySelector("body");
  if (!body) return;

  // Get player names from match data or use defaults
  const player1Name = escapeHtml(matchData?.player1?.name || "Player 1");
  const player2Name = escapeHtml(matchData?.player2?.name || "Player 2");
  const winnerName = winner === 1 ? player1Name : player2Name;

  // Create overlay HTML from template
  const matchInfoHtml = matchData?.isTournamentMatch
    ? `
    <div class="bg-black/50 border border-green-400/30 p-4 mb-6 text-center">
      <div class="text-green-500 text-xs mb-1">TOURNAMENT MATCH</div>
      <div class="text-green-400 text-sm">Match #${escapeHtml(matchData.matchId)}</div>
    </div>
  `
    : "";

  const actionButtonHtml = matchData?.isTournamentMatch
    ? `
      <button id="return-to-tournament-btn" class="bg-green-400/20 border border-green-400 px-6 py-3 hover:bg-green-400/30 transition-colors">
        <span class="text-green-300 font-bold">> BACK TO TOURNAMENT</span>
      </button>
    `
    : `
      <button id="play-again-btn" class="bg-green-400/20 border border-green-400 px-6 py-3 hover:bg-green-400/30 transition-colors">
        <span class="text-green-300 font-bold">> PLAY AGAIN</span>
      </button>
    `;

  const overlayHtml = gamePageOverlayHtml
    .replace("{{winnerName}}", escapeHtml(winnerName))
    .replace("{{player1Name}}", escapeHtml(player1Name))
    .replace("{{score1}}", score1.toString())
    .replace(
      "{{winnerClass1}}",
      winner === 1 ? "text-green-300" : "text-green-600",
    )
    .replace("{{player2Name}}", escapeHtml(player2Name))
    .replace("{{score2}}", score2.toString())
    .replace(
      "{{winnerClass2}}",
      winner === 2 ? "text-green-300" : "text-green-600",
    )
    .replace("{{matchInfo}}", matchInfoHtml)
    .replace("{{actionButton}}", actionButtonHtml);
  body.insertAdjacentHTML("beforeend", overlayHtml);

  // Récupérer l'overlay depuis le DOM
  const overlay = document.getElementById("game-end-overlay");

  // Fermer la modal
  const closeModal = () => {
    if (overlay) {
      overlay.remove();
    }
  };
  // Fermer en cliquant à l'extérieur
  if (overlay) {
    overlay.addEventListener("click", (e: MouseEvent) => {
      if (e.target === overlay) {
        closeModal();
      }
    });
  }

  // Fermer avec Escape
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", handleEscape);
    }
  };
  document.addEventListener("keydown", handleEscape);
  // Setup button handlers
  const returnToTournamentBtn = document.getElementById(
    "return-to-tournament-btn",
  );
  const playAgainBtn = document.getElementById("play-again-btn");
  const returnHomeBtn = document.getElementById("return-home-btn");

  if (returnToTournamentBtn) {
    returnToTournamentBtn.addEventListener("click", () => {
      // Store match result before navigating back
      if (matchData) {
        const winnerId =
          winner === 1 ? matchData.player1.id : matchData.player2.id;
        const results = JSON.parse(
          sessionStorage.getItem("tournamentResults") || "{}",
        );
        results[matchData.matchId] = {
          winner: winnerId,
          score1,
          score2,
          winnerName,
          player1Name,
          player2Name,
        };
        sessionStorage.setItem("tournamentResults", JSON.stringify(results));

        // Submit match result to backend (fire and forget)
        submitMatchResultToBackend({
          matchId: parseInt(matchData.matchId),
          player1Id: parseInt(matchData.player1.id),
          player1Name: player1Name,
          player2Id: parseInt(matchData.player2.id),
          player2Name: player2Name,
          winnerId: parseInt(winnerId),
          winnerName: winnerName,
          score1: score1,
          score2: score2,
        });
      }

      // Clear current match data
      sessionStorage.removeItem("currentMatch");

      closeModal();

      // Navigate back to tournament using the router
      import("../router").then(({ getRouter }) => {
        const router = getRouter();
        if (router) {
          router.navigate("/tournament");
        } else {
          window.location.href = "/tournament";
        }
      });
    });
  }
  if (playAgainBtn) {
    playAgainBtn.addEventListener("click", () => {
      if (!matchData?.isTournamentMatch) {
        sendNormalMatchResult(winner, score1, score2);
      }
      closeModal();

      // Restart le jeu via router (SPA style)
      import("../router").then(({ getRouter }) => {
        const router = getRouter();
        if (router) {
          router.navigate("/game");
        }
      });
    });
  }

  if (returnHomeBtn) {
    returnHomeBtn.addEventListener("click", () => {
      if (!matchData?.isTournamentMatch) {
        ``;
        sendNormalMatchResult(winner, score1, score2);
      }
      sessionStorage.removeItem("currentMatch");
      closeModal();

      // Navigate back to home using the router
      import("../router").then(({ getRouter }) => {
        const router = getRouter();
        if (router) {
          router.navigate("/home");
        } else {
          window.location.href = "/home";
        }
      });
    });
  }
}
async function sendNormalMatchResult(
  winner: number,
  score1: number,
  score2: number,
): Promise<void> {
  try {
    // Récupérer les joueurs depuis PlayerSessionManager
    const player1 = PlayerSessionManager.getPlayer(1);
    const player2 = PlayerSessionManager.getPlayer(2);

    if (!player1 || !player2) {
      console.warn("Cannot save match: players not found");
      return;
    }

    if (!player1.id && !player2.id) {
      console.warn("Cannot save match: both players are guests");
      return;
    }

    const winnerId = winner === 1 ? player1.id : player2.id;

    const matchData = {
      player1_id: player1.id || null, // null si guest
      player2_id: player2.id || null, // null si guest
      player1_score: score1,
      player2_score: score2,
      winner_id: winnerId,
      is_tournament: false,
    };

    // Envoyer au backend
    const response = await fetch("/api/matches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(AuthManager.isAuthenticated() && !AuthManager.isGuest()
          ? { Authorization: `Bearer ${AuthManager.getToken()}` }
          : {}),
      },
      body: JSON.stringify(matchData),
    });

    if (!response.ok) {
      console.warn("Failed to save match result:", response.statusText);
    } else {
      console.log("Match result saved successfully");
    }
  } catch (error) {
    console.error("Error saving match result:", error);
  }
}
