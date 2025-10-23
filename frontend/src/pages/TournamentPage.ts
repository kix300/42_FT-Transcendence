import { getRouter } from "../router";
import { AuthManager } from "../utils/auth";
import { createHeader, HeaderConfigs } from "../components/Header";
import { Header } from "../components/Header";
import { escapeHtml } from "../utils/sanitize";
import { PlayerSessionManager } from "../utils/playerSession";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Player {
  id: number;
  name: string;
  isBye: boolean;
  alias?: string; // Player's chosen alias for the tournament
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

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEYS = {
  TOURNAMENT: "currentTournament",
  RESULTS: "tournamentResults",
  CURRENT_MATCH: "currentMatch",
  ALIASES: "playerAliases",
} as const;

const API_ENDPOINTS = {
  MATCH_RESULT: "/api/matches",
  TOURNAMENT_WINNER: "/api/tournament/winner",
} as const;

// ============================================================================
// API COMMUNICATION
// ============================================================================

/**
 * Sends match result to backend server.
 */
export async function submitMatchResultToBackend(matchData: {
  matchId: number;
  player1Id: number;
  player1Name: string;
  player2Id: number;
  player2Name: string;
  winnerId: number;
  winnerName: string;
  score1: number;
  score2: number;
  tournamentId?: string;
}): Promise<void> {
  try {
    const response = await fetch(API_ENDPOINTS.MATCH_RESULT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        match_id: matchData.matchId,
        player1: {
          id: matchData.player1Id,
          name: matchData.player1Name,
        },
        player2: {
          id: matchData.player2Id,
          name: matchData.player2Name,
        },
        winner: {
          id: matchData.winnerId,
          name: matchData.winnerName,
        },
        score: {
          player1: matchData.score1,
          player2: matchData.score2,
        },
        tournament_id: matchData.tournamentId,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.warn(
        "Failed to submit match result to backend:",
        response.statusText,
      );
    }
  } catch (error) {
    console.error("Error submitting match result to backend:", error);
  }
}

/**
 * Sends tournament winner to backend server.
 */
export async function submitTournamentWinnerToBackend(winnerData: {
  winnerId: number;
  winnerName: string;
  playerCount: number;
  totalRounds: number;
  totalMatches: number;
  tournamentId?: string;
}): Promise<void> {
  try {
    const response = await fetch(API_ENDPOINTS.TOURNAMENT_WINNER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        winner: {
          id: winnerData.winnerId,
          name: winnerData.winnerName,
        },
        tournament: {
          id: winnerData.tournamentId,
          player_count: winnerData.playerCount,
          total_rounds: winnerData.totalRounds,
          total_matches: winnerData.totalMatches,
        },
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.warn(
        "Failed to submit tournament winner to backend:",
        response.statusText,
      );
    }
  } catch (error) {
    console.error("Error submitting tournament winner to backend:", error);
  }
}

// ============================================================================
// MATCH ID UTILITIES
// ============================================================================

/**
 * Calculates match ID from round and position within round.
 * IDs are sequential: Round 0 gets 0-N, Round 1 gets N+1-M, etc.
 */
function getMatchId(
  round: number,
  matchInRound: number,
  bracketSize: number,
): number {
  let startId = 0;
  for (let r = 0; r < round; r++) {
    startId += bracketSize / Math.pow(2, r + 1);
  }
  return startId + matchInRound;
}

/**
 * Calculates the parent match ID (next round) for a given match.
 */
function getParentMatchId(
  matchId: number,
  round: number,
  bracketSize: number,
): number {
  // Find which match in current round
  let startIdCurrentRound = 0;
  for (let r = 0; r < round; r++) {
    startIdCurrentRound += bracketSize / Math.pow(2, r + 1);
  }
  const matchInRound = matchId - startIdCurrentRound;

  // Find start ID of next round
  let startIdNextRound = 0;
  for (let r = 0; r <= round; r++) {
    startIdNextRound += bracketSize / Math.pow(2, r + 1);
  }

  // Two matches feed into one parent (pairs: 0-1, 2-3, etc.)
  return startIdNextRound + Math.floor(matchInRound / 2);
}

/**
 * Gets human-readable round name.
 */
function getRoundName(round: number, totalRounds: number): string {
  const roundsFromEnd = totalRounds - round - 1;

  if (roundsFromEnd === 0) return "FINALS";
  if (roundsFromEnd === 1) return "SEMI FINALS";
  if (roundsFromEnd === 2) return "QUARTER FINALS";
  return `ROUND ${round + 1}`;
}

// ============================================================================
// PLAYER GENERATION
// ============================================================================

/**
 * Generates player list with BYEs to fill bracket to power of 2.
 */
function generatePlayers(count: number): Player[] {
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(count)));
  const byesNeeded = bracketSize - count;

  const players: Player[] = [];

  // Real players
  for (let i = 1; i <= count; i++) {
    players.push({ id: i, name: `Player ${i}`, isBye: false });
  }

  // BYE players
  for (let i = 0; i < byesNeeded; i++) {
    players.push({ id: -(i + 1), name: "BYE", isBye: true });
  }

  // Shuffle for random seeding
  return shuffleArray(players);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================================================
// TOURNAMENT STRUCTURE
// ============================================================================

/**
 * Creates complete tournament bracket structure with all rounds and matches.
 */
function createTournamentStructure(players: Player[]): TournamentData {
  const bracketSize = players.length;
  const totalRounds = Math.log2(bracketSize);
  const matches = new Map<number, Match>();

  // Calculate real player count (excluding BYEs)
  const realPlayerCount = players.filter((p) => !p.isBye).length;

  // Create all matches for all rounds
  for (let round = 0; round < totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round + 1);

    for (let matchInRound = 0; matchInRound < matchesInRound; matchInRound++) {
      const match: Match = {
        id: getMatchId(round, matchInRound, bracketSize),
        round,
        matchInRound,
        player1: null,
        player2: null,
        winner: null,
        score1: 0,
        score2: 0,
        isCompleted: false,
      };

      // First round: assign players
      if (round === 0) {
        match.player1 = players[matchInRound * 2];
        match.player2 = players[matchInRound * 2 + 1];

        // Auto-complete BYE matches (but don't complete yet - wait for alias input)
        // We'll mark them differently to show they need alias input
        if (match.player1.isBye && !match.player2.isBye) {
          completeMatch(match, match.player2, 0, 1);
        } else if (match.player2.isBye && !match.player1.isBye) {
          completeMatch(match, match.player1, 1, 0);
        }
      }

      matches.set(match.id, match);
    }
  }

  // Propagate BYE winners through bracket
  propagateAllWinners(matches, totalRounds);

  return { playerCount: realPlayerCount, players, matches, totalRounds };
}

/**
 * Marks a match as completed with winner and scores.
 */
function completeMatch(
  match: Match,
  winner: Player,
  score1: number,
  score2: number,
): void {
  match.winner = winner;
  match.score1 = score1;
  match.score2 = score2;
  match.isCompleted = true;
}

// ============================================================================
// WINNER PROPAGATION
// ============================================================================

/**
 * Propagates all completed match winners to their parent matches.
 */
function propagateAllWinners(
  matches: Map<number, Match>,
  totalRounds: number,
): void {
  const bracketSize = Math.pow(2, totalRounds);

  for (let round = 0; round < totalRounds - 1; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round + 1);

    for (let matchInRound = 0; matchInRound < matchesInRound; matchInRound++) {
      const matchId = getMatchId(round, matchInRound, bracketSize);
      const match = matches.get(matchId);

      if (match?.isCompleted && match.winner) {
        propagateWinner(matches, match, totalRounds);
      }
    }
  }
}

/**
 * Propagates a single match winner to parent match, handling BYE auto-advancement.
 */
function propagateWinner(
  matches: Map<number, Match>,
  match: Match,
  totalRounds: number,
): void {
  if (match.round >= totalRounds - 1) return; // Already in finals

  const bracketSize = Math.pow(2, totalRounds);
  const parentMatchId = getParentMatchId(match.id, match.round, bracketSize);
  const parentMatch = matches.get(parentMatchId);

  if (!parentMatch || !match.winner) return;

  // Assign winner to parent match (even = player1, odd = player2)
  if (match.matchInRound % 2 === 0) {
    parentMatch.player1 = match.winner;
  } else {
    parentMatch.player2 = match.winner;
  }

  // Auto-complete parent if it has a BYE
  if (parentMatch.player1 && parentMatch.player2) {
    if (parentMatch.player1.isBye && !parentMatch.player2.isBye) {
      completeMatch(parentMatch, parentMatch.player2, 0, 1);
      propagateWinner(matches, parentMatch, totalRounds);
    } else if (parentMatch.player2.isBye && !parentMatch.player1.isBye) {
      completeMatch(parentMatch, parentMatch.player1, 1, 0);
      propagateWinner(matches, parentMatch, totalRounds);
    }
  }
}

/**
 * Records match result and propagates winner through bracket.
 */
function recordMatchResult(
  tournament: TournamentData,
  matchId: number,
  winnerId: number,
  score1: number,
  score2: number,
): void {
  const match = tournament.matches.get(matchId);
  if (!match?.player1 || !match?.player2) return;

  const winner = winnerId === match.player1.id ? match.player1 : match.player2;
  completeMatch(match, winner, score1, score2);
  propagateWinner(tournament.matches, match, tournament.totalRounds);
}

// ============================================================================
// SESSION STORAGE
// ============================================================================

/**
 * Saves tournament data to session storage.
 */
function saveTournamentToStorage(tournament: {
  playerCount: number;
  players: Player[];
}): void {
  sessionStorage.setItem(STORAGE_KEYS.TOURNAMENT, JSON.stringify(tournament));
}

/**
 * Rebuilds tournament from session storage, applying saved results.
 */
function rebuildTournamentFromStorage(savedData: any): TournamentData {
  const tournament = createTournamentStructure(savedData.players);

  const matchResults = JSON.parse(
    sessionStorage.getItem(STORAGE_KEYS.RESULTS) || "{}",
  );

  for (const matchIdStr in matchResults) {
    const result = matchResults[matchIdStr];
    if (result?.winner !== undefined) {
      const winnerId =
        typeof result.winner === "string"
          ? parseInt(result.winner)
          : result.winner;
      recordMatchResult(
        tournament,
        parseInt(matchIdStr),
        winnerId,
        result.score1,
        result.score2,
      );
    }
  }

  return tournament;
}

/**
 * Clears all tournament data from session storage.
 */
function clearTournamentStorage(): void {
  sessionStorage.removeItem(STORAGE_KEYS.TOURNAMENT);
  sessionStorage.removeItem(STORAGE_KEYS.RESULTS);
  sessionStorage.removeItem(STORAGE_KEYS.CURRENT_MATCH);
  sessionStorage.removeItem(STORAGE_KEYS.ALIASES);
  // Réinitialiser les sessions des joueurs
  PlayerSessionManager.disconnectAll();
}

/**
 * Saves player aliases to session storage.
 */
function saveAliasesToStorage(playerId: number, alias: string): void {
  const aliases = JSON.parse(
    sessionStorage.getItem(STORAGE_KEYS.ALIASES) || "{}",
  );
  aliases[playerId] = alias;
  sessionStorage.setItem(STORAGE_KEYS.ALIASES, JSON.stringify(aliases));
}

/**
 * Gets player's alias from storage or returns default name.
 */
function getPlayerAlias(player: Player | null): string {
  if (!player) return "TBD";
  if (player.isBye) return "BYE";

  const aliases = JSON.parse(
    sessionStorage.getItem(STORAGE_KEYS.ALIASES) || "{}",
  );
  return aliases[player.id] || player.name;
}

// ============================================================================
// HTML GENERATION
// ============================================================================

/**
 * Generates complete bracket HTML from tournament data.
 */
function generateBracketHTML(tournament: TournamentData): string {
  const { players, totalRounds } = tournament;
  const bracketSize = players.length;
  const byeCount = players.filter((p) => p.isBye).length;

  let html = `
    <div class="bg-gray-900 border border-green-400/30 p-6">
      <div class="text-green-300 font-bold mb-4">[${tournament.playerCount}-PLAYER BRACKET]</div>
      <div class="text-green-500 text-sm mb-4">Bracket size: ${bracketSize} | Rounds: ${totalRounds} | Byes: ${byeCount}</div>
      <div class="grid gap-4" style="grid-template-columns: repeat(${totalRounds}, 1fr);">
  `;

  // Generate each round column
  for (let round = 0; round < totalRounds; round++) {
    html += generateRoundHTML(tournament, round);
  }

  html += `
      </div>
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

/**
 * Generates HTML for a single round column.
 */
function generateRoundHTML(tournament: TournamentData, round: number): string {
  const bracketSize = tournament.players.length;
  const matchesInRound = bracketSize / Math.pow(2, round + 1);
  const roundName = getRoundName(round, tournament.totalRounds);

  let html = `<div class="space-y-4">`;
  html += `<div class="text-green-400 text-xs mb-2 text-center font-bold">${roundName}</div>`;

  // Add spacing for visual alignment
  if (round > 0) {
    html += `<div style="height: ${Math.pow(2, round) * 4}rem"></div>`;
  }

  // Generate match cards
  for (let matchInRound = 0; matchInRound < matchesInRound; matchInRound++) {
    const matchId = getMatchId(round, matchInRound, bracketSize);
    const match = tournament.matches.get(matchId);

    if (match) {
      html += generateMatchCardHTML(match);
    }

    // Add spacing between matches
    if (matchInRound < matchesInRound - 1 && round > 0) {
      html += `<div style="height: ${Math.pow(2, round + 1) * 4}rem"></div>`;
    }
  }

  html += `</div>`;
  return html;
}

/**
 * Generates HTML for a single match card.
 */
function generateMatchCardHTML(match: Match): string {
  const { player1, player2, score1, score2, isCompleted, winner } = match;

  // Use aliases for display
  const p1DisplayName = player1 ? getPlayerAlias(player1) : "TBD";
  const p2DisplayName = player2 ? getPlayerAlias(player2) : "TBD";

  const p1Name = player1
    ? player1.isBye
      ? `<span class="text-green-600">${escapeHtml(p1DisplayName)}</span>`
      : escapeHtml(p1DisplayName)
    : "TBD";
  const p2Name = player2
    ? player2.isBye
      ? `<span class="text-green-600">${escapeHtml(p2DisplayName)}</span>`
      : escapeHtml(p2DisplayName)
    : "TBD";

  const winnerNum =
    isCompleted && winner ? (player1 && winner.id === player1.id ? 1 : 2) : 0;
  const p1Class =
    winnerNum === 1 ? "text-green-300 font-bold" : "text-green-400";
  const p2Class =
    winnerNum === 2 ? "text-green-300 font-bold" : "text-green-400";

  const actionButton = generateActionButton(match);

  return `
    <div class="border border-green-400/50 bg-black/50 ${isCompleted ? "border-green-300" : ""}">
      <div class="text-green-500 text-xs px-2 py-1 border-b border-green-400/30">
        Match ${match.id} - ${getRoundName(match.round, 10)}
      </div>
      <div class="p-2 space-y-1">
        <div class="${p1Class} text-sm flex justify-between items-center">
          <span>${p1Name}</span>
          <span class="text-xs ${winnerNum === 1 ? "text-green-300 font-bold" : "text-green-500"}">${score1}</span>
        </div>
        <div class="border-t border-green-400/20"></div>
        <div class="${p2Class} text-sm flex justify-between items-center">
          <span>${p2Name}</span>
          <span class="text-xs ${winnerNum === 2 ? "text-green-300 font-bold" : "text-green-500"}">${score2}</span>
        </div>
        ${actionButton}
      </div>
    </div>
  `;
}

/**
 * Generates action button/status for match card.
 */
function generateActionButton(match: Match): string {
  const { player1, player2, isCompleted, winner } = match;

  if (isCompleted && winner) {
    const winnerDisplayName = getPlayerAlias(winner);
    return `<div class="text-green-300 text-xs mt-2 font-bold">✓ COMPLETED - ${escapeHtml(winnerDisplayName)} wins!</div>`;
  }

  // BYE matches in Round 1 - show button to enter alias
  if (
    match.round === 0 &&
    ((player1?.isBye && player2 && !player2.isBye) ||
      (player2?.isBye && player1 && !player1.isBye))
  ) {
    const activePlayer = player1?.isBye ? player2 : player1;
    const activePlayerDisplayName = activePlayer
      ? getPlayerAlias(activePlayer)
      : "";

    // Check if alias has already been set
    const aliases = JSON.parse(
      sessionStorage.getItem(STORAGE_KEYS.ALIASES) || "{}",
    );
    const hasAlias = activePlayer && aliases[activePlayer.id];

    if (!hasAlias && activePlayer) {
      return `
        <button
          class="start-match-btn w-full mt-2 bg-green-400/20 border border-green-400 px-3 py-1 hover:bg-green-400/30 transition-colors text-xs"
          data-match-id="${match.id}"
          data-match-round="${match.round}"
          data-player1-id="${player1?.id || -1}"
          data-player1-name="${escapeHtml(player1?.name || "")}"
          data-player2-id="${player2?.id || -1}"
          data-player2-name="${escapeHtml(player2?.name || "")}"
        >
          <span class="text-green-300">> ENTER ALIAS</span>
        </button>
      `;
    } else {
      return `<div class="text-green-300 text-xs mt-2">${escapeHtml(activePlayerDisplayName)} advances</div>`;
    }
  }

  // BYE matches in other rounds - just show advancement
  if (player1?.isBye && player2 && !player2.isBye) {
    const player2DisplayName = getPlayerAlias(player2);
    return `<div class="text-green-300 text-xs mt-2">${escapeHtml(player2DisplayName)} advances</div>`;
  }

  if (player2?.isBye && player1 && !player1.isBye) {
    const player1DisplayName = getPlayerAlias(player1);
    return `<div class="text-green-300 text-xs mt-2">${escapeHtml(player1DisplayName)} advances</div>`;
  }

  if (player1 && player2 && !player1.isBye && !player2.isBye) {
    const player1DisplayName = getPlayerAlias(player1);
    const player2DisplayName = getPlayerAlias(player2);
    return `
      <button
        class="start-match-btn w-full mt-2 bg-green-400/20 border border-green-400 px-3 py-1 hover:bg-green-400/30 transition-colors text-xs"
        data-match-id="${match.id}"
        data-match-round="${match.round}"
        data-player1-id="${player1.id}"
        data-player1-name="${escapeHtml(player1.name)}"
        data-player1-alias="${escapeHtml(player1DisplayName)}"
        data-player2-id="${player2.id}"
        data-player2-name="${escapeHtml(player2.name)}"
        data-player2-alias="${escapeHtml(player2DisplayName)}"
      >
        <span class="text-green-300">> START MATCH</span>
      </button>
    `;
  }

  return `<div class="text-gray-500 text-xs mt-2 italic">Waiting for players...</div>`;
}

// ============================================================================
// UI UPDATES
// ============================================================================

/**
 * Checks if tournament is complete and displays winner.
 */
function updateTournamentWinner(tournament: TournamentData): void {
  const finalMatchId = getMatchId(
    tournament.totalRounds - 1,
    0,
    tournament.players.length,
  );
  const finalMatch = tournament.matches.get(finalMatchId);

  if (finalMatch?.isCompleted && finalMatch.winner) {
    const winnerDisplayName = getPlayerAlias(finalMatch.winner);
    const winnerDisplay = document.getElementById("tournament-winner");
    if (winnerDisplay) {
      winnerDisplay.textContent = escapeHtml(winnerDisplayName);
      winnerDisplay.classList.add("animate-pulse");
    }

    // Submit tournament winner to backend (fire and forget)
    submitTournamentWinnerToBackend({
      winnerId: finalMatch.winner.id,
      winnerName: winnerDisplayName,
      playerCount: tournament.playerCount,
      totalRounds: tournament.totalRounds,
      totalMatches: tournament.matches.size,
    });

    // Show winner overlay
    showTournamentWinnerOverlay(finalMatch.winner, tournament);
  }
}

/**
 * Displays full-screen overlay celebrating tournament winner.
 */
function showTournamentWinnerOverlay(
  winner: Player,
  tournament: TournamentData,
): void {
  const body = document.querySelector("body");
  if (!body) return;

  // Don't show if overlay already exists
  if (document.getElementById("tournament-winner-overlay")) return;

  const winnerDisplayName = getPlayerAlias(winner);

  const overlayHtml = `
    <div id="tournament-winner-overlay" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div class="bg-gray-900 border-4 border-green-400 p-8 max-w-2xl w-full mx-4 shadow-2xl">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-5xl font-bold text-green-300 mb-4 animate-pulse">TOURNAMENT COMPLETE!</h1>
          <div class="h-1 bg-green-400 w-48 mx-auto mb-6"></div>
          <div class="text-green-500 text-sm mb-2">CHAMPION</div>
          <div class="text-6xl font-bold text-green-300 mb-4">${escapeHtml(winnerDisplayName)}</div>
        </div>

        <!-- Trophy Icon -->
        <div class="text-center mb-8">
          <div class="text-8xl">🏆</div>
        </div>

        <!-- Tournament Stats -->
        <div class="bg-black/50 border border-green-400/30 p-6 mb-6">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-green-500 text-xs mb-1">TOTAL PLAYERS</div>
              <div class="text-green-300 text-2xl font-bold">${tournament.playerCount}</div>
            </div>
            <div>
              <div class="text-green-500 text-xs mb-1">TOTAL ROUNDS</div>
              <div class="text-green-300 text-2xl font-bold">${tournament.totalRounds}</div>
            </div>
            <div>
              <div class="text-green-500 text-xs mb-1">TOTAL MATCHES</div>
              <div class="text-green-300 text-2xl font-bold">${tournament.matches.size}</div>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex gap-4 justify-center">
          <button id="new-tournament-overlay-btn" class="bg-green-400/20 border border-green-400 px-8 py-3 hover:bg-green-400/30 transition-colors">
            <span class="text-green-300 font-bold">> NEW TOURNAMENT</span>
          </button>
          <button id="return-home-overlay-btn" class="bg-gray-700/50 border border-gray-500 px-8 py-3 hover:bg-gray-700/70 transition-colors">
            <span class="text-gray-300 font-bold">> BACK TO TOURNAMENT</span>
          </button>
        </div>
      </div>
    </div>
  `;

  body.insertAdjacentHTML("beforeend", overlayHtml);

  // Setup button handlers
  const newTournamentBtn = document.getElementById(
    "new-tournament-overlay-btn",
  );
  const returnHomeBtn = document.getElementById("return-home-overlay-btn");

  if (newTournamentBtn) {
    newTournamentBtn.addEventListener("click", () => {
      clearTournamentStorage();
      const router = getRouter();
      if (router) {
        router.navigate("/tournament");
      }
    });
  }

  if (returnHomeBtn) {
    returnHomeBtn.addEventListener("click", () => {
      const overlay = document.getElementById("tournament-winner-overlay");
      if (overlay) overlay.remove();
    });
  }
}

/**
 * Shows alias input overlay for Round 1 matches.
 * Returns a promise that resolves with aliases when "Start Match" is clicked.
 */
function showAliasInputOverlay(
  match: Match,
): Promise<{ player1Alias: string; player2Alias: string } | null> {
  return new Promise((resolve) => {
    const body = document.querySelector("body");
    if (!body) {
      resolve(null);
      return;
    }

    // Don't show if overlay already exists
    if (document.getElementById("alias-input-overlay")) {
      resolve(null);
      return;
    }

    const player1Name = match.player1
      ? escapeHtml(match.player1.name)
      : "Player 1";
    const player2Name = match.player2
      ? escapeHtml(match.player2.name)
      : "Player 2";

    // Handle BYE matches - only one player needs to enter alias
    const isByeMatch = match.player1?.isBye || match.player2?.isBye;
    const activePlayer = match.player1?.isBye ? match.player2 : match.player1;
    const activePlayerName = activePlayer
      ? escapeHtml(activePlayer.name)
      : "Player";

    const overlayHtml = isByeMatch
      ? `
      <div id="alias-input-overlay" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
        <div class="bg-gray-900 border-4 border-green-400 p-8 max-w-2xl w-full mx-4 shadow-2xl">
          <!-- Header -->
          <div class="text-center mb-6">
            <h1 class="text-3xl font-bold text-green-300 mb-2">ENTER YOUR ALIAS</h1>
            <div class="h-1 bg-green-400 w-32 mx-auto"></div>
          </div>

          <!-- Match Info -->
          <div class="bg-black/50 border border-green-400/30 p-4 mb-6 text-center">
            <div class="text-green-500 text-xs mb-1">ROUND 1 - BYE MATCH</div>
            <div class="text-green-400 text-sm">Match #${match.id}</div>
            <div class="text-green-600 text-xs mt-2">You automatically advance to the next round</div>
          </div>

          <!-- Alias Input -->
          <div class="mb-6">
            <div class="mb-4">
              <label class="text-green-400 text-sm block mb-2">${activePlayerName} - Enter Your Alias:</label>
              <input
                type="text"
                id="player-alias-input"
                minlength="3"
                maxlength="20"
                placeholder="Your tournament alias..."
                required
                class="bg-black border border-green-400/50 text-green-300 px-4 py-3 w-full focus:outline-none focus:border-green-400 text-lg"
              />
              <div class="text-green-500 text-xs mt-1">3-20 characters required</div>
            </div>
          </div>

          <!-- Action Button -->
          <div class="text-center">
            <button id="start-match-with-alias-btn" class="bg-green-400/20 border border-green-400 px-8 py-3 hover:bg-green-400/30 transition-colors w-full">
              <span class="text-green-300 font-bold">> CONTINUE</span>
            </button>
          </div>
        </div>
      </div>
      `
      : `
      <div id="alias-input-overlay" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
        <div class="bg-gray-900 border-4 border-green-400 p-8 max-w-2xl w-full mx-4 shadow-2xl">
          <!-- Header -->
          <div class="text-center mb-6">
            <h1 class="text-3xl font-bold text-green-300 mb-2">ENTER YOUR ALIASES</h1>
            <div class="h-1 bg-green-400 w-32 mx-auto"></div>
          </div>

          <!-- Match Info -->
          <div class="bg-black/50 border border-green-400/30 p-4 mb-6 text-center">
            <div class="text-green-500 text-xs mb-1">ROUND 1</div>
            <div class="text-green-400 text-sm">Match #${match.id}</div>
          </div>

          <!-- Alias Inputs -->
          <div class="mb-6">
            <div class="mb-4">
              <label class="text-green-400 text-sm block mb-2">${player1Name} - Enter Your Alias:</label>
              <input
                type="text"
                id="player1-alias-input"
                minlength="3"
                maxlength="20"
                placeholder="Player 1 alias..."
                required
                class="bg-black border border-green-400/50 text-green-300 px-4 py-3 w-full focus:outline-none focus:border-green-400 text-lg"
              />
              <div class="text-green-500 text-xs mt-1">3-20 characters required</div>
            </div>
            <div class="h-1 bg-green-400/20 w-full my-4"></div>
            <div>
              <label class="text-green-400 text-sm block mb-2">${player2Name} - Enter Your Alias:</label>
              <input
                type="text"
                id="player2-alias-input"
                minlength="3"
                maxlength="20"
                placeholder="Player 2 alias..."
                required
                class="bg-black border border-green-400/50 text-green-300 px-4 py-3 w-full focus:outline-none focus:border-green-400 text-lg"
              />
              <div class="text-green-500 text-xs mt-1">3-20 characters required</div>
            </div>
          </div>

          <!-- Action Button -->
          <div class="text-center">
            <button id="start-match-with-alias-btn" class="bg-green-400/20 border border-green-400 px-8 py-3 hover:bg-green-400/30 transition-colors w-full">
              <span class="text-green-300 font-bold">> START MATCH</span>
            </button>
          </div>
        </div>
      </div>
      `;

    body.insertAdjacentHTML("beforeend", overlayHtml);

    const startBtn = document.getElementById("start-match-with-alias-btn");
    const player1Input = document.getElementById(
      "player1-alias-input",
    ) as HTMLInputElement;
    const player2Input = document.getElementById(
      "player2-alias-input",
    ) as HTMLInputElement;
    const playerInput = document.getElementById(
      "player-alias-input",
    ) as HTMLInputElement;

    if (startBtn) {
      startBtn.addEventListener("click", () => {
        let player1Alias = "";
        let player2Alias = "";

        if (isByeMatch) {
          const alias = playerInput?.value.trim() || "";

          // Validate alias (minimum 3 characters)
          if (alias.length < 3) {
            alert("Alias must be at least 3 characters long!");
            playerInput?.focus();
            return;
          }

          if (match.player1?.isBye) {
            player2Alias = alias;
          } else {
            player1Alias = alias;
          }
        } else {
          player1Alias = player1Input?.value.trim() || "";
          player2Alias = player2Input?.value.trim() || "";

          // Validate both aliases (minimum 3 characters)
          if (player1Alias.length < 3) {
            alert("Player 1 alias must be at least 3 characters long!");
            player1Input?.focus();
            return;
          }

          if (player2Alias.length < 3) {
            alert("Player 2 alias must be at least 3 characters long!");
            player2Input?.focus();
            return;
          }
        }

        // Remove overlay
        const overlay = document.getElementById("alias-input-overlay");
        if (overlay) overlay.remove();

        // Resolve with aliases
        resolve({ player1Alias, player2Alias });
      });
    }

    // Handle Enter key to submit
    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        startBtn?.click();
      }
    };

    if (isByeMatch && playerInput) {
      playerInput.addEventListener("keydown", handleEnter);
      playerInput.focus();
    } else {
      player1Input?.addEventListener("keydown", handleEnter);
      player2Input?.addEventListener("keydown", handleEnter);
      player1Input?.focus();
    }
  });
}

/**
 * Displays tournament bracket on page.
 */
function displayTournament(tournament: TournamentData): void {
  const tournamentForm = document.getElementById("tournament-form");
  const bracketContainer = document.getElementById("tournament-bracket");

  if (!tournamentForm || !bracketContainer) return;

  tournamentForm.style.display = "none";
  bracketContainer.innerHTML = generateBracketHTML(tournament);
  bracketContainer.classList.remove("hidden");

  addNewTournamentButton(bracketContainer);
  setupMatchStartButtons(tournament);
  updateTournamentWinner(tournament);
  animateBracketReveal();
}

/**
 * Adds "New Tournament" button to bracket.
 */
function addNewTournamentButton(bracketContainer: HTMLElement): void {
  const button = document.createElement("button");
  button.id = "new-tournament-btn";
  button.className =
    "bg-gray-700/50 border border-gray-500 px-6 py-3 hover:bg-gray-700/70 transition-colors mb-4";
  button.innerHTML =
    '<span class="text-gray-300 font-bold">> NEW TOURNAMENT</span>';
  button.addEventListener("click", () => {
    clearTournamentStorage();
    const router = getRouter();
    if (router) {
      router.navigate("/tournament");
    }
  });

  bracketContainer.parentElement?.insertBefore(button, bracketContainer);
}

/**
 * Animates bracket reveal.
 */
function animateBracketReveal(): void {
  const bracket = document.getElementById("tournament-bracket");
  if (bracket) {
    bracket.style.opacity = "0";
    bracket.style.transition = "opacity 0.5s";
    setTimeout(() => (bracket.style.opacity = "1"), 100);
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Sets up tournament creation button handler.
 */
function setupCreateTournamentButton(): void {
  const createBtn = document.getElementById("create-tournament-btn");
  const playerCountInput = document.getElementById(
    "player-count-input",
  ) as HTMLInputElement;

  if (!createBtn || !playerCountInput) return;

  createBtn.addEventListener("click", () => {
    const playerCount = parseInt(playerCountInput.value);

    if (isNaN(playerCount) || playerCount < 2 || playerCount > 16) {
      alert("Please enter a valid number of players (2-16)");
      return;
    }

    const players = generatePlayers(playerCount);
    const tournament = createTournamentStructure(players);

    saveTournamentToStorage({ playerCount, players });
    sessionStorage.removeItem(STORAGE_KEYS.RESULTS);
    // Réinitialiser les sessions des joueurs pour le nouveau tournoi
    PlayerSessionManager.disconnectAll();

    displayTournament(tournament);
  });
}

/**
 * Sets up match start button handlers using event delegation.
 */
function setupMatchStartButtons(tournament: TournamentData): void {
  const router = getRouter();
  const bracketContainer = document.getElementById("tournament-bracket");

  if (!router || !bracketContainer) return;

  // Remove old listener if exists
  const oldListener = (bracketContainer as any)._tournamentClickListener;
  if (oldListener) {
    bracketContainer.removeEventListener("click", oldListener);
  }

  const clickListener = async (event: Event) => {
    const target = event.target as HTMLElement;
    const button = target.closest(".start-match-btn") as HTMLButtonElement;

    if (button) {
      const matchId = button.getAttribute("data-match-id");
      const matchRound = button.getAttribute("data-match-round");
      const isRound1 = matchRound === "0";

      // Get match from tournament
      const match = tournament.matches.get(parseInt(matchId || "0"));
      if (!match) return;

      // Check if this is a BYE match
      const isByeMatch = match.player1?.isBye || match.player2?.isBye;

      // For Round 1 matches, show alias input overlay first
      if (isRound1) {
        const aliasData = await showAliasInputOverlay(match);

        if (aliasData) {
          // Save aliases to storage
          if (match.player1 && !match.player1.isBye) {
            saveAliasesToStorage(match.player1.id, aliasData.player1Alias);
          }
          if (match.player2 && !match.player2.isBye) {
            saveAliasesToStorage(match.player2.id, aliasData.player2Alias);
          }

          // Refresh the bracket to show updated aliases
          displayTournament(tournament);

          // If it's a BYE match, don't navigate to game - just return
          if (isByeMatch) {
            return;
          }
        } else {
          // User cancelled - don't proceed
          return;
        }
      }

      // Only navigate to game if it's not a BYE match
      if (!isByeMatch) {
        // Get current aliases (either just set or from previous rounds)
        const player1Alias =
          button.getAttribute("data-player1-alias") ||
          button.getAttribute("data-player1-name");
        const player2Alias =
          button.getAttribute("data-player2-alias") ||
          button.getAttribute("data-player2-name");

        const matchData = {
          matchId: button.getAttribute("data-match-id"),
          player1: {
            id: button.getAttribute("data-player1-id"),
            name: player1Alias,
          },
          player2: {
            id: button.getAttribute("data-player2-id"),
            name: player2Alias,
          },
          isTournamentMatch: true,
        };

        sessionStorage.setItem(
          STORAGE_KEYS.CURRENT_MATCH,
          JSON.stringify(matchData),
        );
        router.navigate("/game");
      }
    }
  };

  (bracketContainer as any)._tournamentClickListener = clickListener;
  bracketContainer.addEventListener("click", clickListener);
}

/**
 * Sets up navigation handlers (ESC key).
 */
function setupNavigationListeners(): void {
  const router = getRouter();
  if (!router) return;

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") router.navigate("/home");
  };

  window.addEventListener("keydown", handleEscape);
  (window as any).tournamentPageCleanup = () =>
    window.removeEventListener("keydown", handleEscape);
}

/**
 * Shows header elements with fade-in animation.
 */
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

// ============================================================================
// MAIN PAGE FUNCTION
// ============================================================================

/**
 * Main tournament page initialization.
 */
export async function TournamentPage(): Promise<void> {
  // if (!AuthManager.isAuthenticated()) {
  //   console.log("Utilisateur non authentifié, redirection vers login");
  //   const router = getRouter();
  //   if (router) {
  //     router.navigate("/login");
  //   }
  //   return;
  // }

  const isGuest = AuthManager.isGuest();

  const appDiv = document.querySelector<HTMLDivElement>("#app");
  if (!appDiv) return;

  // Apply body styles
  const body = document.querySelector("body");
  if (body) {
    body.className = "bg-black min-h-screen font-mono text-green-400";
  }

  // Create and inject page HTML
  // Create and inject page HTML
  const header = isGuest
    ? createHeader(HeaderConfigs.guest)
    : createHeader(HeaderConfigs.tournament);
  const headerHtml = await header.render();

  appDiv.innerHTML = `
    <div class="min-h-screen flex flex-col bg-black text-green-400 font-mono">
      ${headerHtml}
      <main class="flex-1 p-6 overflow-auto">
        <div class="max-w-7xl mx-auto">
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-green-300 mb-2">[TOURNAMENT SYSTEM]</h1>
            <p class="text-green-400 text-sm">> Single Elimination Bracket Generator</p>
          </div>
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
          <div id="tournament-bracket" class="hidden"></div>
        </div>
      </main>
      <footer class="border-t border-green-400/30 p-4">
        <div class="max-w-7xl mx-auto text-center text-green-500 text-sm">
          <span class="text-green-400">[Tournament System]</span> Ready to compete | Press ESC to return
        </div>
      </footer>
    </div>
  `;

  // Restore existing tournament or setup new one
  const existingTournament = sessionStorage.getItem(STORAGE_KEYS.TOURNAMENT);
  if (existingTournament) {
    try {
      const tournamentData = JSON.parse(existingTournament);
      const tournament = rebuildTournamentFromStorage(tournamentData);
      displayTournament(tournament);
    } catch (e) {
      console.error("Error restoring tournament:", e);
      setupCreateTournamentButton();
    }
  } else {
    setupCreateTournamentButton();
  }
  //hide tournament btn
  const routeTournament = document.getElementById("route-tournament");
  if (routeTournament) {
    routeTournament.style.display = "none";
  }

  setupNavigationListeners();
  Header.setupEventListeners();
  showHeaderElements();
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Cleanup function for page navigation.
 */
export function cleanupTournamentPage(): void {
  if ((window as any).tournamentPageCleanup) {
    (window as any).tournamentPageCleanup();
    delete (window as any).tournamentPageCleanup;
  }
}
