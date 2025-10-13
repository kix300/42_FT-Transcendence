import db from '../db.js';

export default async function statsRoutes(fastify) {
  fastify.get("/api/stats/:userId", async (request, reply) => {
    const userId = request.user.id;

    if (!userId) {
      return reply.code(400).send({ error: "Invalid user ID" });
    }

    try {
      // Récupère tous les matchs où l'utilisateur a joué
      const matches = db
        .prepare(
          `SELECT *
           FROM matches
           WHERE player1_id = ? OR player2_id = ?
           ORDER BY date DESC`
        )
        .all(userId, userId);

      // Calculer quelques stats simples
      const totalMatches = matches.length;
      const wins = matches.filter(m => m.winner_id === userId).length;
      const losses = totalMatches - wins;

      return reply.send({
        stats: { totalMatches, wins, losses },
        matches,
      });
    } catch (err) {
      console.error(err);
      return reply.code(500).send({ error: "Internal server error" });
    }
  });
}
