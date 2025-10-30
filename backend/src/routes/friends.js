import db from '../db.js';
import { MSG } from "../msg.js";

export default async function friendsRoutes(fastify, options) {

    //liste des amis de l'utilisateur connecte
    fastify.get("/api/friends/show", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const userId = request.user.id;

        try {
            const friends = db.prepare(`
            SELECT u.id, u.username, u.photo, u.status
            FROM friends f
            JOIN users u ON f.friend_id = u.id
            WHERE f.user_id = ?
            `).all(userId);
            reply.send(friends);
        } catch (err) {
            console.error("Erreur lors de la récupération des amis :", err);
            reply.status(500).send({ success: false, message: MSG.INTERNAL_SERVER_ERROR });
        }

		/* Code si amitie bilaterale */
        // db.prepare(`
        //     SELECT u.id, u.username, u.photo, f.status
        //     FROM friends f
        //     JOIN users u ON f.friend_id = u.id
        //     WHERE f.user_id = ? AND f.status = 'accepted';
        //     `).run(userId);


    });

    //ajouter un ami
    fastify.post("/api/friends/add", {
		preHandler: [fastify.authenticate],
		schema: { body: { type: "object", required: ["friendId"], 
				properties: { friendId: { type: "integer", minimum: 1 },},
		},},
	}, async (request, reply) => {
		const { friendId } = request.body;
        const userId = request.user.id;


        const friend = db.prepare("SELECT username FROM users_public WHERE id = ?").get(friendId);
        if (!friend) {
            return { success: false, message: MSG.USER_NOT_FOUND };
        }
        try {
            db.prepare("INSERT INTO friends (user_id, friend_id) VALUES (?, ?)").run(userId, friendId);
            return { success: true, message: "Demande d’ami envoyée !" };
        } catch (err) {
            // Gestion des erreurs SQLite (ex: doublon)
            if (err.code === 'SQLITE_CONSTRAINT') {
            return reply.status(400).send({ success: false, message: "Demande déjà existante" });
            }
            console.error("Erreur /api/friends/add:", err);
            return reply.status(500).send({ success: false, message: MSG.INTERNAL_SERVER_ERROR });
        }
    });

	/* Code si amitie bilaterale */
    //accepter une demande
    fastify.patch("/api/friends/accept", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const userId = request.user.id;
        const friend = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
        if (!friend) {
            return { success: false, message: MSG.USER_NOT_FOUND };
        }
        const friendId = friend.id;
        db.prepare("UPDATE friends SET status = 'accepted' WHERE user_id = ? AND friend_id = ?").run(friendId, userId);
        return { success: true };
    });

    //supprimer un ami
    fastify.delete("/api/friends/delete/:friend", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
        const userId = request.user.id;
        const friend = db.prepare(`SELECT id FROM users WHERE username = ?`).get(request.params.friend);
        const friendId = friend.id;
        if (!friendId){
            return reply.code(404).send({error: "Utilisateur introuvable"});
        }
        console.log(`userId: ${userId}, friendId: ${friendId}`);
        // Vérifie si l'ami existe dans la table friends
        const friendship = db
            .prepare("SELECT user_id, friend_id FROM friends WHERE (user_id = ? AND friend_id = ?)")
            .get(userId, friendId);

        if (!friendship) {
            return reply.code(404).send({ error: "Amitié non trouvée" });
        }

        // Delete le friend
        db.prepare("DELETE FROM friends WHERE (user_id = ? AND friend_id = ?)")
            .run(userId, friendId);

        return reply.send({ success: true, message: "Ami supprimé avec succès" });
        } catch (err) {
        console.error(err);
        return reply.code(500).send({ error: MSG.INTERNAL_SERVER_ERROR });
        }
    });

}
