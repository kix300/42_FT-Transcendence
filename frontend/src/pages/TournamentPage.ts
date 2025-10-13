import { getRouter } from "../router";
import { AuthManager } from "../utils/auth";
import { createHeader, HeaderConfigs } from "../components/Header";
import { Header } from "../components/Header";

interface Player {
  id: number;
  name: string;
  isBye: boolean;
}
// @ts-ignore
interface Match {
  id: number;
  player1: Player | null;
  player2: Player | null;
  winner: Player | null;
}

export async function TournamentPage(): Promise<void> {
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

  // Classes CSS pour le body
  const body = document.querySelector("body");
  if (body) {
    body.className = "bg-black min-h-screen font-mono text-green-400";
  }

  // Créer le header
  const header = createHeader(HeaderConfigs.tournament);
  const headerHtml = await header.render();

  // HTML de la page tournoi
  const tournamentPageHtml = `
    <div class="min-h-screen flex flex-col bg-black text-green-400 font-mono">
      ${headerHtml}

      <!-- Main Content -->
      <main class="flex-1 p-6 overflow-auto">
        <div class="max-w-7xl mx-auto">
          <!-- Title -->
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-green-300 mb-2">[TOURNAMENT SYSTEM]</h1>
            <p class="text-green-400 text-sm">> Single Elimination Bracket Generator</p>
          </div>

          <!-- Create Tournament Form -->
          <div id="tournament-form" class="mb-8">
            <div class="bg-gray-900 border border-green-400/30 p-6 max-w-md">
              <div class="text-green-300 font-bold mb-4">> CREATE NEW TOURNAMENT</div>
              <div class="mb-4">
                <label class="text-green-400 text-sm block mb-2">Number of Players (2-16):</label>
                <input
                  type="number"
                  id="player-count-input"
                  min="2"
                  max="16"
                  value="8"
                  class="bg-black border border-green-400/50 text-green-300 px-3 py-2 w-full focus:outline-none focus:border-green-400"
                />
                <div class="text-green-500 text-xs mt-1">Players will be randomly seeded. Byes will be assigned if needed.</div>
              </div>
              <button id="create-tournament-btn" class="bg-green-400/20 border border-green-400 px-6 py-3 hover:bg-green-400/30 transition-colors w-full">
                <span class="text-green-300 font-bold">> START TOURNAMENT</span>
              </button>
            </div>
          </div>

          <!-- Tournament Bracket -->
          <div id="tournament-bracket" class="hidden">
            <!-- Dynamic bracket will be generated here -->
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

  // Check if there's an existing tournament to restore
  const existingTournament = sessionStorage.getItem("currentTournament");
  if (existingTournament) {
    try {
      const tournamentData = JSON.parse(existingTournament);
      restoreTournament(tournamentData);
    } catch (e) {
      console.error("Error restoring tournament:", e);
      setupCreateTournamentButton();
    }
  } else {
    // Setup event listeners for new tournament
    setupCreateTournamentButton();
  }

  setupNavigationListeners();
  
  // Ajouter les event listeners du header
  Header.setupEventListeners();
  
  // Rendre le header visible
  showHeaderElements();
}

function restoreTournament(tournamentData: any): void {
  const tournamentForm = document.getElementById("tournament-form");
  const bracketContainer = document.getElementById("tournament-bracket");

  if (!tournamentForm || !bracketContainer) return;

  // Hide the form
  tournamentForm.style.display = "none";

  // Generate bracket with saved data
  const bracketHtml = generateBracketWithResults(tournamentData);
  bracketContainer.innerHTML = bracketHtml;

  // Show the bracket
  bracketContainer.classList.remove("hidden");

  // Add a "New Tournament" button
  const newTournamentBtn = document.createElement("button");
  newTournamentBtn.id = "new-tournament-btn";
  newTournamentBtn.className = "bg-gray-700/50 border border-gray-500 px-6 py-3 hover:bg-gray-700/70 transition-colors mb-4";
  newTournamentBtn.innerHTML = '<span class="text-gray-300 font-bold">> NEW TOURNAMENT</span>';
  newTournamentBtn.addEventListener("click", () => {
    // Clear tournament data
    sessionStorage.removeItem("currentTournament");
    sessionStorage.removeItem("tournamentResults");
    sessionStorage.removeItem("currentMatch");

    // Reload the page
    window.location.reload();
  });

  // Insert the button before the bracket
  const mainContent = bracketContainer.parentElement;
  if (mainContent) {
    mainContent.insertBefore(newTournamentBtn, bracketContainer);
  }

  // Setup match start buttons
  setupMatchStartButtons();
}

function generateBracketWithResults(tournamentData: any): string {
  const { playerCount, players } = tournamentData;
  const bracketSize = players.length;
  const rounds = Math.log2(bracketSize);

  // Get match results from sessionStorage
  const matchResults = JSON.parse(sessionStorage.getItem("tournamentResults") || "{}");

  let html = `
    <div class="bg-gray-900 border border-green-400/30 p-6">
      <div class="text-green-300 font-bold mb-4">[${playerCount}-PLAYER BRACKET]</div>
      <div class="text-green-500 text-sm mb-4">Bracket size: ${bracketSize} | Rounds: ${rounds} | Byes: ${bracketSize - playerCount}</div>
  `;

  // Generate bracket grid
  html += `<div class="grid gap-4" style="grid-template-columns: repeat(${rounds}, 1fr);">`;

  // Generate each round
  for (let round = 0; round < rounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round + 1);
    const roundName = getRoundName(round, rounds);

    html += `<div class="space-y-4">`;
    html += `<div class="text-green-400 text-xs mb-2 text-center font-bold">${roundName}</div>`;

    if (round > 0) {
      const spacerHeight = Math.pow(2, round) * 4;
      html += `<div style="height: ${spacerHeight}rem"></div>`;
    }

    // Generate matches for this round
    for (let match = 0; match < matchesInRound; match++) {
      const matchId = Math.pow(2, round + 1) - 1 + match + 1;

      let player1: Player | null = null;
      let player2: Player | null = null;

      if (round === 0) {
        // First round - assign players from tournament data
        player1 = players[match * 2];
        player2 = players[match * 2 + 1];
      }

      // Check if this match has results
      const matchResult = matchResults[matchId];

      html += generateMatchCardWithResult(matchId, player1, player2, round, matchResult);

      if (match < matchesInRound - 1 && round > 0) {
        const spacingHeight = Math.pow(2, round + 1) * 4;
        html += `<div style="height: ${spacingHeight}rem"></div>`;
      }
    }

    html += `</div>`;
  }

  html += `</div>`;

  // Winner Display
  html += `
    <div class="mt-8 text-center">
      <div class="inline-block bg-green-400/20 border border-green-400 px-8 py-4">
        <div class="text-green-300 text-sm mb-2">TOURNAMENT WINNER</div>
        <div id="tournament-winner" class="text-green-400 font-bold text-xl">TBD</div>
      </div>
    </div>
  </div>
  `;

  return html;
}

function getNextPowerOfTwo(n: number): number {
  let power = 1;
  while (power < n) {
    power *= 2;
  }
  return power;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generatePlayers(count: number): Player[] {
  const bracketSize = getNextPowerOfTwo(count);
  const byesNeeded = bracketSize - count;

  const players: Player[] = [];

  // Create real players
  for (let i = 1; i <= count; i++) {
    players.push({
      id: i,
      name: `Player ${i}`,
      isBye: false
    });
  }

  // Add byes
  for (let i = 0; i < byesNeeded; i++) {
    players.push({
      id: -(i + 1),
      name: "BYE",
      isBye: true
    });
  }

  // Shuffle players randomly
  return shuffleArray(players);
}

function generateBracket(playerCount: number): string {
  const players = generatePlayers(playerCount);
  const bracketSize = players.length;
  const rounds = Math.log2(bracketSize);

  let html = `
    <div class="bg-gray-900 border border-green-400/30 p-6">
      <div class="text-green-300 font-bold mb-4">[${playerCount}-PLAYER BRACKET]</div>
      <div class="text-green-500 text-sm mb-4">Bracket size: ${bracketSize} | Rounds: ${rounds} | Byes: ${bracketSize - playerCount}</div>
  `;

  // Generate bracket grid
  html += `<div class="grid gap-4" style="grid-template-columns: repeat(${rounds}, 1fr);">`;

  // Generate each round
  for (let round = 0; round < rounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round + 1);
    const roundName = getRoundName(round, rounds);

    html += `<div class="space-y-4">`;
    html += `<div class="text-green-400 text-xs mb-2 text-center font-bold">${roundName}</div>`;

    if (round > 0) {
      const spacerHeight = Math.pow(2, round) * 4;
      html += `<div style="height: ${spacerHeight}rem"></div>`;
    }

    // Generate matches for this round
    for (let match = 0; match < matchesInRound; match++) {
      const matchId = Math.pow(2, round + 1) - 1 + match + 1;

      let player1: Player | null = null;
      let player2: Player | null = null;

      if (round === 0) {
        // First round - assign players
        player1 = players[match * 2];
        player2 = players[match * 2 + 1];
      }

      html += generateMatchCard(matchId, player1, player2, round);

      if (match < matchesInRound - 1 && round > 0) {
        const spacingHeight = Math.pow(2, round + 1) * 4;
        html += `<div style="height: ${spacingHeight}rem"></div>`;
      }
    }

    html += `</div>`;
  }

  html += `</div>`;

  // Winner Display
  html += `
    <div class="mt-8 text-center">
      <div class="inline-block bg-green-400/20 border border-green-400 px-8 py-4">
        <div class="text-green-300 text-sm mb-2">TOURNAMENT WINNER</div>
        <div id="tournament-winner" class="text-green-400 font-bold text-xl">TBD</div>
      </div>
    </div>
  </div>
  `;

  return html;
}

function getRoundName(round: number, totalRounds: number): string {
  const roundsFromEnd = totalRounds - round - 1;

  if (roundsFromEnd === 0) return "FINALS";
  if (roundsFromEnd === 1) return "SEMI FINALS";
  if (roundsFromEnd === 2) return "QUARTER FINALS";
  return `ROUND ${round + 1}`;
}

function generateMatchCard(matchId: number, player1: Player | null, player2: Player | null, round: number): string {
  return generateMatchCardWithResult(matchId, player1, player2, round, null);
}

//@ts-ignore
function generateMatchCardWithResult(matchId: number, player1: Player | null, player2: Player | null, round: number, matchResult: any): string {
  const p1Name = player1 ? (player1.isBye ? `<span class="text-green-600">${player1.name}</span>` : player1.name) : "TBD";
  const p2Name = player2 ? (player2.isBye ? `<span class="text-green-600">${player2.name}</span>` : player2.name) : "TBD";

  let p1Score = 0;
  let p2Score = 0;
  let hasResult = false;
  let winnerNum = 0;

  // Check if match has been played
  if (matchResult) {
    p1Score = matchResult.score1;
    p2Score = matchResult.score2;
    winnerNum = matchResult.winner;
    hasResult = true;
  }

  // Determine if this is an auto-win (one player is a bye)
  let actionButton = "";
  const bothPlayersReady = player1 && player2 && !player1.isBye && !player2.isBye;

  if (hasResult) {
    // Match has been played - show result
    actionButton = `<div class="text-green-300 text-xs mt-2 font-bold">✓ COMPLETED - ${matchResult.winnerName} wins!</div>`;
  } else if (player1 && player1.isBye && player2 && !player2.isBye) {
    actionButton = `<div class="text-green-300 text-xs mt-2">${player2.name} advances</div>`;
  } else if (player2 && player2.isBye && player1 && !player1.isBye) {
    actionButton = `<div class="text-green-300 text-xs mt-2">${player1.name} advances</div>`;
  } else if (bothPlayersReady) {
    // Only show start button if both players are real (not byes)
    const p1Id = player1.id;
    const p2Id = player2.id;
    actionButton = `
      <button
        class="start-match-btn w-full mt-2 bg-green-400/20 border border-green-400 px-3 py-1 hover:bg-green-400/30 transition-colors text-xs"
        data-match-id="${matchId}"
        data-player1-id="${p1Id}"
        data-player1-name="${player1.name}"
        data-player2-id="${p2Id}"
        data-player2-name="${player2.name}"
      >
        <span class="text-green-300">> START MATCH</span>
      </button>
    `;
  }

  // Highlight winner
  const p1Class = hasResult && winnerNum === 1 ? "text-green-300 font-bold" : "text-green-400";
  const p2Class = hasResult && winnerNum === 2 ? "text-green-300 font-bold" : "text-green-400";

  return `
    <div class="border border-green-400/50 bg-black/50 ${hasResult ? 'border-green-300' : ''}">
      <div class="text-green-500 text-xs px-2 py-1 border-b border-green-400/30">
        Match ${matchId}, round ${round}
      </div>
      <div class="p-2 space-y-1">
        <div class="${p1Class} text-sm flex justify-between items-center">
          <span>${p1Name}</span>
          <span class="text-xs ${winnerNum === 1 ? 'text-green-300 font-bold' : 'text-green-500'}">${p1Score}</span>
        </div>
        <div class="border-t border-green-400/20"></div>
        <div class="${p2Class} text-sm flex justify-between items-center">
          <span>${p2Name}</span>
          <span class="text-xs ${winnerNum === 2 ? 'text-green-300 font-bold' : 'text-green-500'}">${p2Score}</span>
        </div>
        ${actionButton}
      </div>
    </div>
  `;
}

function setupCreateTournamentButton(): void {
  const createBtn = document.getElementById("create-tournament-btn");
  const playerCountInput = document.getElementById("player-count-input") as HTMLInputElement;
  const tournamentForm = document.getElementById("tournament-form");
  const bracketContainer = document.getElementById("tournament-bracket");

  if (createBtn && playerCountInput && bracketContainer && tournamentForm) {
    createBtn.addEventListener("click", () => {
      let playerCount = parseInt(playerCountInput.value);

      // Validate input
      if (isNaN(playerCount) || playerCount < 2 || playerCount > 16) {
        alert("Please enter a valid number of players (2-16)");
        return;
      }

      // Generate players and save tournament state
      const players = generatePlayers(playerCount);
      const tournamentData = {
        playerCount,
        players
      };

      // Save tournament to sessionStorage
      sessionStorage.setItem("currentTournament", JSON.stringify(tournamentData));

      // Clear any previous results
      sessionStorage.removeItem("tournamentResults");

      // Generate bracket
      const bracketHtml = generateBracket(playerCount);
      bracketContainer.innerHTML = bracketHtml;

      // Show the bracket
      bracketContainer.classList.remove("hidden");

      // Hide the form
      tournamentForm.style.display = "none";

      // Animate bracket reveal
      animateBracketReveal();

      // Setup match start buttons
      setupMatchStartButtons();
    });
  }
}

function setupMatchStartButtons(): void {
  const router = getRouter();
  if (!router) return;

  // Use event delegation to handle dynamically created buttons
  const bracketContainer = document.getElementById("tournament-bracket");
  if (!bracketContainer) return;

  bracketContainer.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest(".start-match-btn") as HTMLButtonElement;

    if (button) {
      const matchId = button.getAttribute("data-match-id");
      const player1Id = button.getAttribute("data-player1-id");
      const player1Name = button.getAttribute("data-player1-name");
      const player2Id = button.getAttribute("data-player2-id");
      const player2Name = button.getAttribute("data-player2-name");

      // Store match data in sessionStorage for the game page to access
      const matchData = {
        matchId,
        player1: { id: player1Id, name: player1Name },
        player2: { id: player2Id, name: player2Name },
        isTournamentMatch: true
      };

      sessionStorage.setItem("currentMatch", JSON.stringify(matchData));

      // Navigate to game page
      router.navigate("/game");
    }
  });
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

function showHeaderElements(): void {
  // Rendre le profil utilisateur visible
  const userProfile = document.getElementById("user-profile");
  if (userProfile) {
    userProfile.style.opacity = "1";
    userProfile.style.transition = "opacity 0.3s";
  }
  
  // Rendre le menu de navigation visible
  const navMenu = document.getElementById("nav-menu");
  if (navMenu) {
    navMenu.style.opacity = "1";
    navMenu.style.transition = "opacity 0.3s";
  }
  
  // Optionnel : rendre les infos de debug visibles si nécessaire
  // const debugInfo = document.getElementById("debug-info");
  // if (debugInfo) {
  //   debugInfo.style.opacity = "1";
  //   debugInfo.style.display = "block";
  // }
}

// Cleanup function for when leaving the page
export function cleanupTournamentPage(): void {
  if ((window as any).tournamentPageCleanup) {
    (window as any).tournamentPageCleanup();
    delete (window as any).tournamentPageCleanup;
  }
}
