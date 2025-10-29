// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title TournamentRegistry
 * @dev Smart contract to store tournament scores on the blockchain
 * @notice This contract records Pong tournament winners immutably on Avalanche
 */
contract TournamentRegistry {
    struct Tournament {
        uint256 id;
        uint256 timestamp;
        string winnerUsername;
        uint8 playerCount;
        uint8 totalRounds;
        uint8 totalMatches;
    }

    mapping(uint256 => Tournament) public tournaments;
    uint256 public tournamentCount;


    function recordTournament(
        string memory winnerUsername,
        uint8 playerCount,
        uint8 totalRounds,
        uint8 totalMatches
    ) public returns (uint256) {
        tournamentCount++;

        tournaments[tournamentCount] = Tournament({
            id: tournamentCount,
            timestamp: block.timestamp,
            winnerUsername: winnerUsername,
            playerCount: playerCount,
            totalRounds: totalRounds,
            totalMatches: totalMatches
        });

        return tournamentCount;
    }

    function getTournament(uint256 tournamentId)
        public
        view
        returns (Tournament memory)
    {
        return tournaments[tournamentId];
    }
}
