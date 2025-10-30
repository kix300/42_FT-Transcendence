import db from '../db.js';
import {MSG} from '../msg.js';

export default async function matchesRoutes(fastify) {

  // Enregistrer un match dans la db
  fastify.post("/api/matches",  { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const {
        player1_id,
        player2_id,
        player1_score,
        player2_score,
        winner_id,
        is_tournament
      } = request.body;

      // Check valeur manquante ou incoherente
      if (player1_id == null || player2_id == null || winner_id == null) {
        return reply.code(400).send({ error: "Champs obligatoires manquants" });
      }
      if (winner_id !== player1_id && winner_id !== player2_id) {
        return reply.code(400).send({ error: "Le gagnant doit être l'un des deux joueurs" });
      }

      // 🗄️ Inserer dans la base de donnees
      const result = db.prepare(`
        INSERT INTO matches (player1_id, player2_id, winner_id, player1_score, player2_score, is_tournament)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(player1_id, player2_id, winner_id, player1_score, player2_score, is_tournament ? 1 : 0);

      console.log("✅ Match enregistré :", result.lastInsertRowid);

      // Réponse
      reply.code(201).send({
        status: "success",
        // match: db.lastID,
        message: "Match enregistré avec succès"
      });

    } catch (error) {
      console.error("Erreur lors de la création du match :", error);
      reply.code(500).send({ error: MSG.INTERNAL_SERVER_ERROR });
    }
  });

  /*recuperer lhistorique dun joueur (nimporte qui peut voir)*/
  fastify.get("/api/matches", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;
      
      const matches = db.prepare(`
        SELECT m.*, 
              u1.username AS player1_name,
              u2.username AS player2_name,
              uw.username AS winner_name
        FROM matches m
        JOIN users u1 ON m.player1_id = u1.id
        JOIN users u2 ON m.player2_id = u2.id
        JOIN users uw ON m.winner_id = uw.id
        WHERE m.player1_id = ? OR m.player2_id = ?
        ORDER BY m.date DESC
        LIMIT 50
      `).all(userId, userId);
      
      return reply.send({ matches });
    } catch (error) {
      console.error("Erreur lors de la récupération des matchs :", error);
      return reply.code(500).send({ error: "Erreur serveur" });
    }
  });
}
