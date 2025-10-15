import db from '../db.js';

export default async function matchesRoutes(fastify) {

  // Enregistrer un match dans la db
  fastify.post("/api/matches",  { preHandler: [fastify.authenticate] }, async (request, reply) => {
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
