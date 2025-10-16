//@ts-ignore
import { Engine } from "@babylonjs/core/Engines/engine";
import { Game } from "../Game";
import { getRouter } from "../router";
import { AuthManager } from "../utils/auth";
import { submitMatchResultToBackend } from "./TournamentPage";
//@ts-ignore
import gamePageCompleteHtml from "./html/GamePage.html?raw";
import { createHeader, HeaderConfigs, Header } from "../components/Header";
//@ts-ignore
import gamePageOverlayHtml from "./html/GamePage-overlay.html?raw";

export async function GamePage(): Promise<void> {
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

  // Apply terminal-like styles
  const body = document.querySelector("body");
  if (body) {
    body.className =
      "bg-black min-h-screen font-mono text-green-400 flex items-center justify-center";
  }

  if (appDiv) {
    appDiv.className = "container mx-auto p-4 flex flex-col h-screen";

    // Create and render the shared header
    const header = createHeader(HeaderConfigs.game);
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
    // Show header elements with fade-in animation
    function showHeaderElements(): void {
      const userProfile = document.getElementById("user-profile");
      const navMenu = document.getElementById("nav-menu");

      if (userProfile) {
        userProfile.style.opacity = "1";
        userProfile.style.transition = "opacity 0.3s";
      }

      if (navMenu) {
        navMenu.style.opacity = "1";
        navMenu.style.transition = "opacity 0.3s";
      }
    }

    // Dans la fonction GamePage(), après Header.setupEventListeners();
    showHeaderElements();
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
  let matchData = null;
  if (matchDataStr) {
    try {
      matchData = JSON.parse(matchDataStr);
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
          "bg-yellow-400/20 border border-yellow-400/50 text-yellow-300 px-4 py-1 hover:bg-yellow-400/30 transition-colors text-sm";
      } else {
        // Mettre en pause
        engine.stopRenderLoop();
        pauseBtn.textContent = "[Resume]";
        pauseBtn.className =
          "bg-green-400/20 border border-green-400/50 text-green-300 px-4 py-1 hover:bg-green-400/30 transition-colors text-sm";
      }
      isPaused = !isPaused;
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      // Redémarrer le jeu (recharger la page de jeu)
      window.location.reload();
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
  const player1Name = matchData?.player1?.name || "Player 1";
  const player2Name = matchData?.player2?.name || "Player 2";
  const winnerName = winner === 1 ? player1Name : player2Name;

  // Create overlay HTML from template
  const matchInfoHtml = matchData?.isTournamentMatch
    ? `
    <div class="bg-black/50 border border-green-400/30 p-4 mb-6 text-center">
      <div class="text-green-500 text-xs mb-1">TOURNAMENT MATCH</div>
      <div class="text-green-400 text-sm">Match #${matchData.matchId}</div>
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
    .replace("{{winnerName}}", winnerName)
    .replace("{{player1Name}}", player1Name)
    .replace("{{score1}}", score1.toString())
    .replace(
      "{{winnerClass1}}",
      winner === 1 ? "text-green-300" : "text-green-600",
    )
    .replace("{{player2Name}}", player2Name)
    .replace("{{score2}}", score2.toString())
    .replace(
      "{{winnerClass2}}",
      winner === 2 ? "text-green-300" : "text-green-600",
    )
    .replace("{{matchInfo}}", matchInfoHtml)
    .replace("{{actionButton}}", actionButtonHtml);

  body.insertAdjacentHTML("beforeend", overlayHtml);

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

      // Remove the overlay
      const overlay = document.getElementById("game-end-overlay");
      if (overlay) {
        overlay.remove();
      }

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
      window.location.reload();
    });
  }

  if (returnHomeBtn) {
    returnHomeBtn.addEventListener("click", () => {
      sessionStorage.removeItem("currentMatch");

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
