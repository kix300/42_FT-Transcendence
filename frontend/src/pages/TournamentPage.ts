import { getRouter } from "../router";
import { AuthManager } from "../utils/auth";
import { createHeader, HeaderConfigs } from "../components/Header";
import { Header } from "../components/Header";

interface Player {
  id: number;
  name: string;
  isBye: boolean;
}

interface Match {
  id: number;
  round: number;
  matchInRound: number;
  player1: Player | null;
  player2: Player | null;
  winner: Player | null;
  score1: number;
  score2: number;
  isCompleted: boolean;
}

interface TournamentData {
  playerCount: number;
  players: Player[];
  matches: Map<number, Match>;
  totalRounds: number;
}

export async function TournamentPage(): Promise<void> {
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

// Helper function to get parent match ID (match in next round)
function getParentMatchId(matchId: number, round: number, bracketSize: number): number {
  // Calculate which match in current round this is
  let startIdOfCurrentRound = 0;
  for (let r = 0; r < round; r++) {
    startIdOfCurrentRound += bracketSize / Math.pow(2, r + 1);
  }
  const matchInRound = matchId - startIdOfCurrentRound;

  // Calculate the start ID for the next round
  let startIdOfNextRound = 0;
  for (let r = 0; r <= round; r++) {
    startIdOfNextRound += bracketSize / Math.pow(2, r + 1);
  }

  // Two matches feed into one parent (even/odd pairs)
  const parentMatchInRound = Math.floor(matchInRound / 2);

  return startIdOfNextRound + parentMatchInRound;
}

// Helper function to get match ID from round and position
// Match IDs are assigned sequentially: first round gets IDs 0-N, second round gets N+1 to N+M, etc.
function getMatchId(round: number, matchInRound: number, bracketSize: number): number {
  // Calculate the starting ID for this round
  // Round 0 starts at 0
  // Round 1 starts after all round 0 matches
  // Round 2 starts after all round 0 and round 1 matches, etc.
  let startId = 0;
  for (let r = 0; r < round; r++) {
    // Number of matches in round r
    const matchesInThisRound = bracketSize / Math.pow(2, r + 1);
    startId += matchesInThisRound;
  }
  return startId + matchInRound;
}

// Helper function to create tournament structure
function createTournamentStructure(players: Player[]): TournamentData {
  const bracketSize = players.length;
  const totalRounds = Math.log2(bracketSize);
  const matches = new Map<number, Match>();

  // Create all matches for all rounds
  for (let round = 0; round < totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round + 1);

    for (let matchInRound = 0; matchInRound < matchesInRound; matchInRound++) {
      const matchId = getMatchId(round, matchInRound, bracketSize);

      const match: Match = {
        id: matchId,
        round: round,
        matchInRound: matchInRound,
        player1: null,
        player2: null,
        winner: null,
        score1: 0,
        score2: 0,
        isCompleted: false
      };

      // For first round, assign players directly
      if (round === 0) {
        match.player1 = players[matchInRound * 2];
        match.player2 = players[matchInRound * 2 + 1];

        // Auto-complete BYE matches
        if (match.player1.isBye && !match.player2.isBye) {
          match.winner = match.player2;
          match.score1 = 0;
          match.score2 = 1;
          match.isCompleted = true;
        } else if (match.player2.isBye && !match.player1.isBye) {
          match.winner = match.player1;
          match.score1 = 1;
          match.score2 = 0;
          match.isCompleted = true;
        }
      }

      matches.set(matchId, match);
    }
  }

  // Propagate BYE winners to next round
  propagateAllWinners(matches, totalRounds);

  return {
    playerCount: players.length,
    players: players,
    matches: matches,
    totalRounds: totalRounds
  };
}

// Propagate winners from completed matches to their parent matches
function propagateAllWinners(matches: Map<number, Match>, totalRounds: number): void {
  // Process rounds in order, so BYE winners cascade properly
  const bracketSize = Math.pow(2, totalRounds);

  for (let round = 0; round < totalRounds - 1; round++) {
    // Calculate how many matches are in this round
    const matchesInRound = bracketSize / Math.pow(2, round + 1);

    for (let matchInRound = 0; matchInRound < matchesInRound; matchInRound++) {
      const matchId = getMatchId(round, matchInRound, bracketSize);
      const match = matches.get(matchId);

      if (match && match.isCompleted && match.winner) {
        propagateWinnerToParent(matches, match, totalRounds);
      }
    }
  }
}

// Helper function to propagate a single winner to their parent match
function propagateWinnerToParent(matches: Map<number, Match>, match: Match, totalRounds: number): void {
  if (match.round >= totalRounds - 1) return; // Already in finals

  const bracketSize = Math.pow(2, totalRounds);
  const parentMatchId = getParentMatchId(match.id, match.round, bracketSize);
  const parentMatch = matches.get(parentMatchId);

  if (!parentMatch || !match.winner) return;

  // Determine if this match feeds player1 or player2 of parent
  // Even matches (0, 2, 4...) feed player1, odd matches (1, 3, 5...) feed player2
  if (match.matchInRound % 2 === 0) {
    parentMatch.player1 = match.winner;
  } else {
    parentMatch.player2 = match.winner;
  }

  // If parent match now has both players and one is a BYE, auto-complete it
  if (parentMatch.player1 && parentMatch.player2) {
    if (parentMatch.player1.isBye && !parentMatch.player2.isBye) {
      parentMatch.winner = parentMatch.player2;
      parentMatch.score1 = 0;
      parentMatch.score2 = 1;
      parentMatch.isCompleted = true;
      // Recursively propagate
      propagateWinnerToParent(matches, parentMatch, totalRounds);
    } else if (parentMatch.player2.isBye && !parentMatch.player1.isBye) {
      parentMatch.winner = parentMatch.player1;
      parentMatch.score1 = 1;
      parentMatch.score2 = 0;
      parentMatch.isCompleted = true;
      // Recursively propagate
      propagateWinnerToParent(matches, parentMatch, totalRounds);
    }
  }
}

// Record match result and propagate winner
function recordMatchResult(tournamentData: TournamentData, matchId: number, winnerId: number, score1: number, score2: number): void {
  const match = tournamentData.matches.get(matchId);
  if (!match || !match.player1 || !match.player2) return;

  // Determine winner
  const winner = winnerId === match.player1.id ? match.player1 : match.player2;

  match.winner = winner;
  match.score1 = score1;
  match.score2 = score2;
  match.isCompleted = true;

  // Propagate winner to next round using helper function
  propagateWinnerToParent(tournamentData.matches, match, tournamentData.totalRounds);
}

function restoreTournament(tournamentData: any): void {
  const tournamentForm = document.getElementById("tournament-form");
  const bracketContainer = document.getElementById("tournament-bracket");

  if (!tournamentForm || !bracketContainer) return;

  // Hide the form
  tournamentForm.style.display = "none";

  // Rebuild tournament structure from saved data
  const tournament = rebuildTournamentFromStorage(tournamentData);

  // Generate bracket with current state
  const bracketHtml = generateBracketFromTournament(tournament);
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
  setupMatchStartButtons(tournament);

  // Check for tournament winner
  checkAndDisplayTournamentWinner(tournament);
}

function rebuildTournamentFromStorage(savedData: any): TournamentData {
  // Create initial tournament structure
  const tournament = createTournamentStructure(savedData.players);

  // Apply saved match results if they exist
  const matchResults = JSON.parse(sessionStorage.getItem("tournamentResults") || "{}");

  for (const matchIdStr in matchResults) {
    const matchId = parseInt(matchIdStr);
    const result = matchResults[matchIdStr];

    if (result && result.winner !== undefined) {
      // Ensure winner ID is a number (could be string from sessionStorage)
      const winnerId = typeof result.winner === 'string' ? parseInt(result.winner) : result.winner;
      recordMatchResult(tournament, matchId, winnerId, result.score1, result.score2);
    }
  }

  return tournament;
}

function checkAndDisplayTournamentWinner(tournament: TournamentData): void {
  // Check if final match (last round) is completed
  const bracketSize = tournament.players.length;
  const finalMatchId = getMatchId(tournament.totalRounds - 1, 0, bracketSize);
  const finalMatch = tournament.matches.get(finalMatchId);

  if (finalMatch && finalMatch.isCompleted && finalMatch.winner) {
    const winnerDisplay = document.getElementById("tournament-winner");
    if (winnerDisplay) {
      winnerDisplay.textContent = finalMatch.winner.name;
      winnerDisplay.classList.add("animate-pulse");
    }
  }
}

function generateBracketFromTournament(tournament: TournamentData): string {
  const bracketSize = tournament.players.length;
  const rounds = tournament.totalRounds;
  const byeCount = tournament.players.filter(p => p.isBye).length;

  let html = `
    <div class="bg-gray-900 border border-green-400/30 p-6">
      <div class="text-green-300 font-bold mb-4">[${tournament.playerCount}-PLAYER BRACKET]</div>
      <div class="text-green-500 text-sm mb-4">Bracket size: ${bracketSize} | Rounds: ${rounds} | Byes: ${byeCount}</div>
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
    for (let matchInRound = 0; matchInRound < matchesInRound; matchInRound++) {
      const matchId = getMatchId(round, matchInRound, bracketSize);
      const match = tournament.matches.get(matchId);

      if (match) {
        html += generateMatchCardFromMatch(match);
      }

      if (matchInRound < matchesInRound - 1 && round > 0) {
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


function getRoundName(round: number, totalRounds: number): string {
  const roundsFromEnd = totalRounds - round - 1;

  if (roundsFromEnd === 0) return "FINALS";
  if (roundsFromEnd === 1) return "SEMI FINALS";
  if (roundsFromEnd === 2) return "QUARTER FINALS";
  return `ROUND ${round + 1}`;
}

function generateMatchCardFromMatch(match: Match): string {
  const player1 = match.player1;
  const player2 = match.player2;

  const p1Name = player1 ? (player1.isBye ? `<span class="text-green-600">${player1.name}</span>` : player1.name) : "TBD";
  const p2Name = player2 ? (player2.isBye ? `<span class="text-green-600">${player2.name}</span>` : player2.name) : "TBD";

  const p1Score = match.score1;
  const p2Score = match.score2;
  const hasResult = match.isCompleted;

  // Determine which player won (1 or 2)
  let winnerNum = 0;
  if (hasResult && match.winner) {
    if (player1 && match.winner.id === player1.id) {
      winnerNum = 1;
    } else if (player2 && match.winner.id === player2.id) {
      winnerNum = 2;
    }
  }

  // Determine if this is an auto-win (one player is a bye)
  let actionButton = "";
  const bothPlayersReady = player1 && player2 && !player1.isBye && !player2.isBye;

  if (hasResult) {
    // Match has been played - show result
    const winnerName = match.winner ? match.winner.name : "Unknown";
    actionButton = `<div class="text-green-300 text-xs mt-2 font-bold">✓ COMPLETED - ${winnerName} wins!</div>`;
  } else if (player1 && player1.isBye && player2 && !player2.isBye) {
    actionButton = `<div class="text-green-300 text-xs mt-2">${player2.name} advances</div>`;
  } else if (player2 && player2.isBye && player1 && !player1.isBye) {
    actionButton = `<div class="text-green-300 text-xs mt-2">${player1.name} advances</div>`;
  } else if (bothPlayersReady) {
    // Only show start button if both players are real (not byes)
    actionButton = `
      <button
        class="start-match-btn w-full mt-2 bg-green-400/20 border border-green-400 px-3 py-1 hover:bg-green-400/30 transition-colors text-xs"
        data-match-id="${match.id}"
        data-player1-id="${player1.id}"
        data-player1-name="${player1.name}"
        data-player2-id="${player2.id}"
        data-player2-name="${player2.name}"
      >
        <span class="text-green-300">> START MATCH</span>
      </button>
    `;
  } else if (!player1 || !player2) {
    // Waiting for previous matches
    actionButton = `<div class="text-gray-500 text-xs mt-2 italic">Waiting for players...</div>`;
  }

  // Highlight winner
  const p1Class = hasResult && winnerNum === 1 ? "text-green-300 font-bold" : "text-green-400";
  const p2Class = hasResult && winnerNum === 2 ? "text-green-300 font-bold" : "text-green-400";

  return `
    <div class="border border-green-400/50 bg-black/50 ${hasResult ? 'border-green-300' : ''}">
      <div class="text-green-500 text-xs px-2 py-1 border-b border-green-400/30">
        Match ${match.id} - ${getRoundName(match.round, 10)}
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

      // Generate players and create tournament structure
      const players = generatePlayers(playerCount);
      const tournament = createTournamentStructure(players);

      // Save tournament to sessionStorage (for restoration)
      const tournamentData = {
        playerCount,
        players
      };
      sessionStorage.setItem("currentTournament", JSON.stringify(tournamentData));

      // Clear any previous results
      sessionStorage.removeItem("tournamentResults");

      // Generate bracket HTML
      const bracketHtml = generateBracketFromTournament(tournament);
      bracketContainer.innerHTML = bracketHtml;

      // Show the bracket
      bracketContainer.classList.remove("hidden");

      // Hide the form
      tournamentForm.style.display = "none";

      // Animate bracket reveal
      animateBracketReveal();

      // Setup match start buttons
      setupMatchStartButtons(tournament);

      // Check for tournament winner (in case all BYE matches)
      checkAndDisplayTournamentWinner(tournament);
    });
  }
}

function setupMatchStartButtons(tournament: TournamentData): void {
  const router = getRouter();
  if (!router) return;

  // Use event delegation to handle dynamically created buttons
  const bracketContainer = document.getElementById("tournament-bracket");
  if (!bracketContainer) return;

  // Remove existing listener if any
  const oldListener = (bracketContainer as any)._tournamentClickListener;
  if (oldListener) {
    bracketContainer.removeEventListener("click", oldListener);
  }

  // Create new listener
  const clickListener = (event: Event) => {
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
  };

  // Store listener reference
  (bracketContainer as any)._tournamentClickListener = clickListener;
  bracketContainer.addEventListener("click", clickListener);
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
