import blockchainService from '../services/blockchainService.js';

/**
 * Blockchain routes for tournament recording
 */
export default async function blockchainRoutes(fastify, options) {

  /**
   * POST /api/tournament/winner
   * Record tournament winner on the blockchain
   */
  fastify.post('/api/tournament/winner', {
    schema: {
      body: {
        type: 'object',
        required: ['winner', 'tournament'],
        properties: {
          winner: {
            type: 'object',
            required: ['id', 'name'],
            properties: {
              id: { type: 'number' },
              name: { type: 'string' }
            }
          },
          tournament: {
            type: 'object',
            required: ['player_count', 'total_rounds', 'total_matches'],
            properties: {
              player_count: { type: 'number' },
              total_rounds: { type: 'number' },
              total_matches: { type: 'number' }
            }
          }
        }
      }
    },
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const { winner, tournament } = request.body;

      // Record tournament on blockchain
      const result = await blockchainService.recordTournament({
        winnerUsername: winner.name,
        playerCount: tournament.player_count,
        totalRounds: tournament.total_rounds,
        totalMatches: tournament.total_matches
      });

      if (result.success) {
        reply.code(200).send({
          success: true,
          message: 'Tournament recorded on blockchain',
          data: {
            tournamentId: result.tournamentId,
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber
          }
        });
      } else {
        reply.code(500).send({
          success: false,
          message: 'Failed to record tournament on blockchain',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in /api/tournament/winner:', error);
      reply.code(500).send({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  });

  /**
   * GET /api/tournament/blockchain/:id
   * Get tournament data from blockchain
   */
  fastify.get('/api/tournament/blockchain/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    },
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const tournament = await blockchainService.getTournament(parseInt(id));

      reply.code(200).send({
        success: true,
        data: tournament
      });
    } catch (error) {
      console.error('Error fetching tournament from blockchain:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to fetch tournament from blockchain',
        error: error.message
      });
    }
  });

  /**
   * GET /api/tournament/blockchain/count
   * Get total number of tournaments on blockchain
   */
  fastify.get('/api/tournament/blockchain/count', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const count = await blockchainService.getTournamentCount();

      reply.code(200).send({
        success: true,
        count
      });
    } catch (error) {
      console.error('Error fetching tournament count:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to fetch tournament count',
        error: error.message
      });
    }
  });

  /**
   * GET /api/blockchain/status
   * Check blockchain service status
   */
  fastify.get('/api/blockchain/status', async (request, reply) => {
    reply.code(200).send({
      initialized: blockchainService.isReady(),
      message: blockchainService.isReady()
        ? 'Blockchain service is ready'
        : 'Blockchain service is not initialized'
    });
  });
}
