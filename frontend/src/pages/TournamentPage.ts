import { getRouter } from "../router";

export async function TournamentPage(): Promise<void> {
  const appDiv = document.querySelector<HTMLDivElement>("#app");
  if (!appDiv) return;

  // Classes CSS pour le body
  const body = document.querySelector("body");
  if (body) {
    body.className = "bg-black min-h-screen font-mono text-green-400";
  }

  // HTML de la page tournoi
  const tournamentPageHtml = `
    <div class="min-h-screen flex flex-col bg-black text-green-400 font-mono">
      <!-- Header -->
      <header class="border-b border-green-400/30 p-4">
        <div class="flex items-center justify-between max-w-7xl mx-auto">
          <div class="flex items-center">
            <span class="text-green-400 mr-2">[tournament@transcendence]$</span>
            <span class="text-green-300 font-bold">./bracket_viewer.sh</span>
          </div>
          <div class="flex space-x-6">
            <a href="#" data-route="/home" class="hover:text-green-300 transition-colors">> home</a>
            <a href="#" data-route="/game" class="hover:text-green-300 transition-colors">> game</a>
            <a href="#" data-route="/tournament" class="hover:text-green-300 transition-colors">> tournament</a>
            <a href="#" data-route="/dashboard" class="hover:text-green-300 transition-colors">> dashboard</a>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 p-6 overflow-auto">
        <div class="max-w-7xl mx-auto">
          <!-- Title -->
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-green-300 mb-2">[TOURNAMENT SYSTEM]</h1>
            <p class="text-green-400 text-sm">> 16-Player Single Elimination Bracket</p>
          </div>

          <!-- Create Tournament Button -->
          <div class="mb-8">
            <button id="create-tournament-btn" class="bg-green-400/20 border border-green-400 px-6 py-3 hover:bg-green-400/30 transition-colors">
              <span class="text-green-300 font-bold">> CREATE NEW TOURNAMENT</span>
            </button>
          </div>

          <!-- Tournament Bracket -->
          <div id="tournament-bracket" class="hidden">
            <div class="bg-gray-900 border border-green-400/30 p-6">
              <div class="text-green-300 font-bold mb-4">[16-PLAYER BRACKET]</div>

              <!-- Bracket Grid -->
              <div class="grid grid-cols-4 gap-4">

                <!-- Round 1 (Round of 16) -->
                <div class="space-y-4">
                  <div class="text-green-400 text-xs mb-2 text-center font-bold">ROUND 1</div>
                  ${generateMatches(1, 8)}
                </div>

                <!-- Quarter Finals -->
                <div class="space-y-4">
                  <div class="text-green-400 text-xs mb-2 text-center font-bold">QUARTER FINALS</div>
                  <div class="mt-8">
                    ${generateMatches(9, 4, true)}
                  </div>
                </div>

                <!-- Semi Finals -->
                <div class="space-y-4">
                  <div class="text-green-400 text-xs mb-2 text-center font-bold">SEMI FINALS</div>
                  <div class="mt-16">
                    ${generateMatches(13, 2, true, 2)}
                  </div>
                </div>

                <!-- Finals -->
                <div class="space-y-4">
                  <div class="text-green-400 text-xs mb-2 text-center font-bold">FINALS</div>
                  <div class="mt-32">
                    ${generateMatches(15, 1, true, 3)}
                  </div>
                </div>

              </div>

              <!-- Winner Display -->
              <div class="mt-8 text-center">
                <div class="inline-block bg-green-400/20 border border-green-400 px-8 py-4">
                  <div class="text-green-300 text-sm mb-2">TOURNAMENT WINNER</div>
                  <div id="tournament-winner" class="text-green-400 font-bold text-xl">TBD</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="border-t border-green-400/30 p-4">
        <div class="max-w-7xl mx-auto text-center text-green-500 text-sm">
          <span class="text-green-400">[Tournament System]</span> Ready to compete | Press ESC to return
        </div>
      </footer>
    </div>
  `;

  // Injecter le HTML dans le conteneur
  appDiv.innerHTML = tournamentPageHtml;

  // Setup event listeners
  setupCreateTournamentButton();
  setupNavigationListeners();
}

function generateMatches(startId: number, count: number, spacing: boolean = false, spacingMultiplier: number = 1): string {
  let html = '';
  for (let i = 0; i < count; i++) {
    const matchId = startId + i;
    const player1Id = (startId === 1) ? (i * 2 + 1) : 'TBD';
    const player2Id = (startId === 1) ? (i * 2 + 2) : 'TBD';

    if (spacing && i > 0) {
      const spacerHeight = 16 * spacingMultiplier;
      html += `<div style="height: ${spacerHeight}rem"></div>`;
    }

    html += `
      <div class="border border-green-400/50 bg-black/50">
        <div class="text-green-500 text-xs px-2 py-1 border-b border-green-400/30">
          Match ${matchId}
        </div>
        <div class="p-2 space-y-1">
          <div class="text-green-400 text-sm flex justify-between items-center">
            <span>Player ${player1Id}</span>
            <span class="text-xs text-green-500">0</span>
          </div>
          <div class="border-t border-green-400/20"></div>
          <div class="text-green-400 text-sm flex justify-between items-center">
            <span>Player ${player2Id}</span>
            <span class="text-xs text-green-500">0</span>
          </div>
        </div>
      </div>
    `;
  }
  return html;
}

function setupCreateTournamentButton(): void {
  const createBtn = document.getElementById("create-tournament-btn");
  const bracket = document.getElementById("tournament-bracket");

  if (createBtn && bracket) {
    createBtn.addEventListener("click", () => {
      // Show the bracket
      bracket.classList.remove("hidden");
      bracket.classList.add("animate-fadeIn");

      // Hide the create button
      createBtn.style.display = "none";

      // Simulate bracket animation
      animateBracketReveal();
    });
  }
}

function animateBracketReveal(): void {
  const bracket = document.getElementById("tournament-bracket");
  if (bracket) {
    bracket.style.opacity = "0";
    bracket.style.transition = "opacity 0.5s";

    setTimeout(() => {
      bracket.style.opacity = "1";
    }, 100);
  }
}

function setupNavigationListeners(): void {
  const router = getRouter();
  if (!router) return;

  // Handle ESC key to go back
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      router.navigate("/home");
    }
  };
  window.addEventListener("keydown", handleEscape);

  // Store cleanup function
  (window as any).tournamentPageCleanup = () => {
    window.removeEventListener("keydown", handleEscape);
  };
}

// Cleanup function for when leaving the page
export function cleanupTournamentPage(): void {
  if ((window as any).tournamentPageCleanup) {
    (window as any).tournamentPageCleanup();
    delete (window as any).tournamentPageCleanup;
  }
}
