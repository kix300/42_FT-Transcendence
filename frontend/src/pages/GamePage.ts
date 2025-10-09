import { Engine } from "@babylonjs/core/Engines/engine";
import { Game } from "../Game";

export async function GamePage(): Promise<void> {
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
          <li><a href="#" data-route="/tournament" class="font-medium text-gray-800 px-4 py-2 rounded-lg shadow-md transition-all duration-300 ease-in-out hover:bg-white/80 hover:shadow-xl hover:-translate-y-1">Tournois</a></li>
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
