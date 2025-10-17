import db from '../db.js';
import { verifyWsAuth } from '../https.js'

const onlineUsers = new Map();	// Map(userId -> connection)
const PING_INTERVAL = 30000;	// 30 secondes

export default async function webSocketRoutes (fastify) {

	fastify.get("/ws", { websocket: true }, (connection, request) => {
		try {
			//Check token
			const user = verifyWsAuth(fastify, connection, request);
			if (!user) return ;

			const userId = user.id;
			console.log("🟢 Connexion WebSocket Secure de l’utilisateur #", userId);
			db.prepare("UPDATE users SET status = 1 WHERE id = ?").run(user.id);
			onlineUsers.set(userId, connection);
			broadcastToFriends(userId, { type: "friend_online", userId });

			// === Gestion du ping ===
    		connection.isAlive = true;

			// Quand on reçoit un pong, on sait que la connexion est vivante
			connection.socket.on("pong", () => {
			connection.isAlive = true;
			});

			// Gérer les messages reçus
			connection.socket.on("message", (msg) => {
				console.log(`💬 Message reçu de ${userId}:`, msg.toString());
				connection.socket.send(JSON.stringify({ reply: "Message reçu !" }));
			});

			// Déconnexion
			connection.socket.on("close", () => {
				console.log("🔴 Connexion WebSocket Secure fermée pour l'utilisateur #", userId);
				db.prepare("UPDATE users SET status = 0 WHERE id = ?").run(userId);
				onlineUsers.delete(userId);
				broadcastToFriends(userId, { type: "friend_offline", userId });
			});

		} catch (err) {
			console.error("❌ Erreur WebSocket:", err.message);
			connection.socket.send(JSON.stringify({ error: "Invalid token" }));
			connection.socket.close();
		}
	});

	// === Vérifie régulièrement que les connexions sont vivantes ===
	setInterval(() => {
		for (const [userId, conn] of onlineUsers.entries()) {
		if (!conn.isAlive) {
			// Connexion morte : fermer et mettre à jour la BDD
			handleDisconnect(userId);
		} else {
			conn.isAlive = false;
			conn.socket.ping();
		}
		}
	}, PING_INTERVAL);

	// Envoie un message à tous les amis connectés
	function broadcastToFriends(userId, message) {
		try {
		const friends = getFriends(userId);
		for (const friendId of friends) {
			const friendConnection = onlineUsers.get(friendId);
			if (friendConnection) {
			friendConnection.socket.send(JSON.stringify(message));
			}
		}
		} catch (err) {
		console.error("Erreur lors de la notification des amis :", err.message);
		}
	}

	// Renvoie les IDs d’amis de l’utilisateur
	function getFriends(userId) {
		const rows = db.prepare(`SELECT friend_id FROM friends WHERE user_id = ?`).all(userId);
		return rows.map(r => r.friend_id);
	}
}