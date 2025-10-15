import db from '../db.js';

export default async function statsRoutes(fastify) {

  //Récupérer les stats dun joueur
  fastify.get("/api/stats",  { preHandler: [fastify.authenticate] }, async (request, reply) => {
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

  //enregistrer une stat a la fin dun match
  fastify.post("/api/matches", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const {
        player1_id,
        player2_id,
        score_player1,
        score_player2,
        winner_id,
        is_tournament,
        tournament_id,
        match_datetime
      } = req.body;

      // ✅ Validation basique
      if (!player1_id || !player2_id || winner_id === undefined) {
        return res.status(400).json({ error: "Champs obligatoires manquants" });
      }

      if (winner_id !== player1_id && winner_id !== player2_id) {
        return res.status(400).json({ error: "Le gagnant doit être l'un des deux joueurs" });
      }

      // 🗄️ Simuler un enregistrement en base
      const newMatch = {
        id: Math.floor(Math.random() * 10000),
        player1_id,
        player2_id,
        score_player1,
        score_player2,
        winner_id,
        is_tournament: !!is_tournament,
        tournament_id: is_tournament ? tournament_id : null,
        match_datetime: match_datetime || new Date().toISOString()
      };

      console.log("🆕 Match enregistré :", newMatch);

      // Réponse
      res.status(201).json({
        status: "success",
        match: newMatch,
        message: "Match enregistré avec succès"
      });

    } catch (error) {
      console.error("Erreur lors de la création du match :", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });
}
