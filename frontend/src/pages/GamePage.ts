import { Engine } from "@babylonjs/core/Engines/engine";
import { Game } from "../Game";
import { getRouter } from "../router";
import { AuthManager } from "../utils/auth";
import { submitMatchResultToBackend } from "./TournamentPage";

export async function GamePage(): Promise<void> {
      // Vérifier l'authentification AVANT d'afficher la page
    // if (!AuthManager.isAuthenticated()) {
    //   console.log('Utilisateur non authentifié, redirection vers login');
    //   const router = getRouter();
    //   if (router) {
    //     router.navigate("/login");
    //   }
    //   return;
    // }
  const appDiv = document.querySelector<HTMLDivElement>("#app");
  if (!appDiv) return;

  // Classes CSS pour le body (similaire à l'original)
  const bodyClasses: string[] = ["bg-gray-100", "overflow-hidden"];
  const appDivClasses: string[] = ["w-screen", "h-screen"];

  // Style le body
  const body = document.querySelector("body");
  if (body) {
    body.className = ""; // Reset les classes existantes
    for (const value of bodyClasses) {
      body.classList.add(value);
    }
  }

  // Style le #app div et ajoute le canvas
  if (appDiv) {
    appDiv.className = ""; // Reset les classes existantes
    for (const value of appDivClasses) {
      appDiv.classList.add(value);
    }
    const canvasHtml = `<canvas id="renderCanvas" class="w-full h-full block focus:outline-none"></canvas>`;
    appDiv.innerHTML = canvasHtml;
  }

  // Insérer le Header et Footer fixes
  if (body) {
    // --- HEADER (avec navigation vers d'autres pages) ---
    const headerHtml = `
    <header id="page-header" class="fixed top-0 left-0 right-0 z-10
                            bg-white/50 backdrop-blur-sm shadow-md
                            transform -translate-y-full
                            transition-transform duration-300 ease-in-out">
      <nav class="container mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex-shrink-0">
          <a href="#" data-route="/" class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-sm">T</span>
            </div>
            <span class="font-bold text-gray-800">Transcendence</span>
          </a>
        </div>
        <ul class="flex space-x-6">
          <li><a href="#" data-route="/" class="font-medium text-gray-800 px-4 py-2 rounded-lg shadow-md transition-all duration-300 ease-in-out hover:bg-white/80 hover:shadow-xl hover:-translate-y-1">Accueil</a></li>
          <li><a href="#" data-route="/tournament" class="font-medium text-gray-800 px-4 py-2 rounded-lg shadow-md transition-all duration-300 ease-in-out hover:bg-white/80 hover:shadow-xl hover:-translate-y-1">Tournaments</a></li>
          <li><a href="#" data-route="/dashboard" class="font-medium text-gray-800 px-4 py-2 rounded-lg shadow-md transition-all duration-300 ease-in-out hover:bg-white/80 hover:shadow-xl hover:-translate-y-1">Dashboard</a></li>
          <li><a href="#" class="font-medium text-gray-800 px-4 py-2 rounded-lg shadow-md transition-all duration-300 ease-in-out hover:bg-white/80 hover:shadow-xl hover:-translate-y-1">3 Players</a></li>
          <li><a href="#" class="font-medium text-gray-800 px-4 py-2 rounded-lg shadow-md transition-all duration-300 ease-in-out hover:bg-white/80 hover:shadow-xl hover:-translate-y-1">2 Players</a></li>
        </ul>
        <div class="flex items-center space-x-2">
          <button id="pause-btn" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm transition-colors">
            Pause
          </button>
          <button id="restart-btn" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition-colors">
            Restart
          </button>
        </div>
      </nav>
    </header>`;

    // --- FOOTER ---
    const footerHtml = `
    <footer id="page-footer" class="fixed bottom-0 left-0 right-0 z-10
                           bg-gray-800/50 backdrop-blur-sm
                           transform translate-y-full
                           transition-transform duration-300 ease-in-out">
      <div class="container mx-auto px-4 text-center py-4">
        <div class="flex justify-between items-center text-white">
          <div class="text-sm">
            <span>Contrôles: </span>
            <span class="text-cyan-300">Joueur 1: W/S</span>
            <span class="mx-2">|</span>
            <span class="text-green-300">Joueur 2: ↑/↓</span>
          </div>
          <p class="text-sm">&copy; ${new Date().getFullYear()} Transcendence. Pong 3D Game.</p>
        </div>
      </div>
    </footer>`;

    body.insertAdjacentHTML("beforeend", headerHtml);
    body.insertAdjacentHTML("beforeend", footerHtml);
  }

  // Gestion de la visibilité de l'UI avec le mouvement de la souris
  const header = document.getElementById("page-header");
  const footer = document.getElementById("page-footer");

  if (header && footer) {
    // État initial caché
    header.classList.add("-translate-y-full");
    footer.classList.add("translate-y-full");

    const threshold = 80; // pixels depuis le bord

    const mouseMoveHandler = (event: MouseEvent) => {
      const mouseY = event.clientY;
      const screenHeight = window.innerHeight;

      // Afficher/Masquer Header
      if (mouseY < threshold) {
        header.classList.add("translate-y-0");
        header.classList.remove("-translate-y-full");
      } else {
        header.classList.add("-translate-y-full");
        header.classList.remove("translate-y-0");
      }

      // Afficher/Masquer Footer
      if (mouseY > screenHeight - threshold) {
        footer.classList.add("translate-y-0");
        footer.classList.remove("translate-y-full");
      } else {
        footer.classList.add("translate-y-full");
        footer.classList.remove("translate-y-0");
      }
    };

    window.addEventListener("mousemove", mouseMoveHandler);

    // Nettoyer l'event listener quand on quitte la page
    (window as any).gamePageCleanup = () => {
      window.removeEventListener("mousemove", mouseMoveHandler);
    };
  }

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

  const headerNav = document.querySelector('header nav ul');
  if (headerNav) {
    const buttons = headerNav.querySelectorAll('a');
    buttons.forEach((button) => {
      const text = button.textContent?.trim();
      if (text === '2 Players') {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          game.switchToTwoPlayerMode();
        });
      } else if (text === '3 Players') {
        button.addEventListener('click', (e) => {
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
        pauseBtn.textContent = "Pause";
        pauseBtn.className =
          "bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm transition-colors";
      } else {
        // Mettre en pause
        engine.stopRenderLoop();
        pauseBtn.textContent = "Resume";
        pauseBtn.className =
          "bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm transition-colors";
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
function showGameEndOverlay(winner: number, score1: number, score2: number, matchData: any): void {
  const body = document.querySelector("body");
  if (!body) return;

  // Get player names from match data or use defaults
  const player1Name = matchData?.player1?.name || "Player 1";
  const player2Name = matchData?.player2?.name || "Player 2";
  const winnerName = winner === 1 ? player1Name : player2Name;

  // Create overlay HTML
  const overlayHtml = `
    <div id="game-end-overlay" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div class="bg-gray-900 border-4 border-green-400 p-8 max-w-2xl w-full mx-4 shadow-2xl">
        <!-- Header -->
        <div class="text-center mb-6">
          <h1 class="text-4xl font-bold text-green-300 mb-2">GAME OVER</h1>
          <div class="h-1 bg-green-400 w-32 mx-auto"></div>
        </div>

        <!-- Winner announcement -->
        <div class="text-center mb-8">
          <div class="text-green-500 text-sm mb-2">WINNER</div>
          <div class="text-5xl font-bold text-green-300 mb-4">${winnerName}</div>
          <div class="text-green-400 text-lg">🏆 Victory!</div>
        </div>

        <!-- Final scores -->
        <div class="bg-black/50 border border-green-400/30 p-6 mb-8">
          <div class="text-green-300 text-center text-sm mb-4 font-bold">FINAL SCORE</div>
          <div class="flex justify-around items-center">
            <div class="text-center">
              <div class="text-green-400 text-sm mb-2">${player1Name}</div>
              <div class="text-6xl font-bold ${winner === 1 ? 'text-green-300' : 'text-green-600'}">${score1}</div>
            </div>
            <div class="text-green-500 text-3xl">-</div>
            <div class="text-center">
              <div class="text-green-400 text-sm mb-2">${player2Name}</div>
              <div class="text-6xl font-bold ${winner === 2 ? 'text-green-300' : 'text-green-600'}">${score2}</div>
            </div>
          </div>
        </div>

        <!-- Match info -->
        ${matchData?.isTournamentMatch ? `
          <div class="bg-black/50 border border-green-400/30 p-4 mb-6 text-center">
            <div class="text-green-500 text-xs mb-1">TOURNAMENT MATCH</div>
            <div class="text-green-400 text-sm">Match #${matchData.matchId}</div>
          </div>
        ` : ''}

        <!-- Action buttons -->
        <div class="flex gap-4 justify-center">
          ${matchData?.isTournamentMatch ? `
            <button id="return-to-tournament-btn" class="bg-green-400/20 border border-green-400 px-6 py-3 hover:bg-green-400/30 transition-colors">
              <span class="text-green-300 font-bold">> BACK TO TOURNAMENT</span>
            </button>
          ` : `
            <button id="play-again-btn" class="bg-green-400/20 border border-green-400 px-6 py-3 hover:bg-green-400/30 transition-colors">
              <span class="text-green-300 font-bold">> PLAY AGAIN</span>
            </button>
          `}
          <button id="return-home-btn" class="bg-gray-700/50 border border-gray-500 px-6 py-3 hover:bg-gray-700/70 transition-colors">
            <span class="text-gray-300 font-bold">> HOME</span>
          </button>
        </div>
      </div>
    </div>
  `;

  body.insertAdjacentHTML("beforeend", overlayHtml);

  // Setup button handlers
  const returnToTournamentBtn = document.getElementById("return-to-tournament-btn");
  const playAgainBtn = document.getElementById("play-again-btn");
  const returnHomeBtn = document.getElementById("return-home-btn");

  if (returnToTournamentBtn) {
    returnToTournamentBtn.addEventListener("click", () => {
      // Store match result before navigating back
      if (matchData) {
        const winnerId = winner === 1 ? matchData.player1.id : matchData.player2.id;
        const results = JSON.parse(sessionStorage.getItem("tournamentResults") || "{}");
        results[matchData.matchId] = {
          winner: winnerId,
          score1,
          score2,
          winnerName,
          player1Name,
          player2Name
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
