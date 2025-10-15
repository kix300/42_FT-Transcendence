import db from '../db.js';

export default async function friendsRoutes(fastify, options) {

    //liste des amis de l'utilisateur connecte
    fastify.get("/api/friends/show", { preHandler: [fastify.authenticate] }, async () => {
        const userId = request.params.id;

        const friends = db.prepare(`
            SELECT u.id, u.username, u.photo
            FROM friends f
            JOIN users u ON f.friend_id = u.id
            WHERE f.user_id = ?
            `).run(userId);

        // db.prepare(`
        //     SELECT u.id, u.username, u.photo, f.status
        //     FROM friends f
        //     JOIN users u ON f.friend_id = u.id
        //     WHERE f.user_id = ? AND f.status = 'accepted';
        //     `).run(userId);

		reply.send(friends);
    });

    //ajouter un ami
    fastify.post("/api/friends/add", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const userId = request.params.id;
        const { username } = request.body;
        const friend = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
        if (!friend) {
            return { success: false, message: "/api/friends/add: Utilisateur introuvable" };
        }
        const friendId = friend.id;
        try {
            db.prepare("INSERT INTO friends (user_id, friend_id) VALUES (?, ?)").run(userId, friendId);
            return { success: true, message: "Demande d’ami envoyée !" };
        } catch (err) {
            // Gestion des erreurs SQLite (ex: doublon)
            if (err.code === 'SQLITE_CONSTRAINT') {
            return reply.status(400).send({ success: false, message: "Demande déjà existante" });
            }
            console.error("Erreur /api/friends/add:", err);
            return reply.status(500).send({ success: false, message: "Erreur serveur" });
        }
    });

    //accepter une demande
    fastify.patch("/api/friends/accept", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const userId = request.params.id;
        const friend = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
        if (!friend) {
            return { success: false, message: "/api/friends/accept: Utilisateur introuvable" };
        }
        const friendId = friend.id;
        db.prepare("UPDATE friends SET status = 'accepted' WHERE user_id = ? AND friend_id = ?").run(friendId, userId);
        return { success: true };
    });

}
