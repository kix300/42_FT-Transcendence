import db from '../db.js';

/* Structure en mémoire : Map(userId -> connection) */
const onlineUsers = new Map();

export default async function webSocketRoutes (fastify) {

	fastify.get("/ws", { websocket: true }, (connection, request) => {
		try {
			const token = new URL(request.url, `https://${request.headers.host}`).searchParams.get("token");
			const user = fastify.jwt.verify(token);
			const userId = user.id;
			console.log("🟢 Connexion WebSocket d’un utilisateur :", userId);
			onlineUsers.set(userId, connection);

			// Notifier les amis que ce joueur est en ligne
			broadcastToFriends(userId, { type: "friend_online", userId });

			// Gérer les messages reçus
			connection.socket.on("message", (msg) => {
				console.log(`💬 Message reçu de ${userId}:`, msg.toString());
				connection.socket.send(JSON.stringify({ reply: "Message reçu !" }));
			});


			// Déconnexion
			connection.socket.on("close", () => {
				console.log("🔴 Connexion WebSocket fermée pour l'utilisateur :", userId);
				onlineUsers.delete(userId);
				broadcastToFriends(userId, { type: "friend_offline", userId });
			});

		} catch (err) {
			console.error("❌ Erreur WebSocket:", err.message);
			connection.socket.send(JSON.stringify({ error: "Invalid token" }));
			connection.socket.close();
		}
	});

	// Envoie un message à tous les amis connectés
	function broadcastToFriends(userId, message) {
		// Ici, tu peux récupérer les amis depuis ta BDD
		const friends = getFriends(userId);
		for (const friendId of friends) {
		const friendConnection = onlineUsers.get(friendId);
		if (friendConnection) {
			friendConnection.socket.send(JSON.stringify(message));
		}
		}
	}

	// Renvoie les IDs d’amis de l’utilisateur
	function getFriends(userId) {
		const row = db.prepare(`SELECT friend_id FROM friends WHERE user_id = ?`).all(userId);
		return row.map(row => row.friend_id);
	}
}