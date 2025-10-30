import db from '../db.js';
import { verifyWsAuth } from '../https.js'

const PING_INTERVAL = 30000;	// 30 secondes
const onlineUsers = new Map();	// Map(userId -> connection)

//WebSocketRoutes handler
export default async function webSocketRoutes (fastify) {
	fastify.get("/ws", { websocket: true }, (connection, request) => {
		try {
			//check token
			const user = verifyWsAuth(fastify, connection, request);
			if (!user) return ;
			const userId = user.id;

			//status online
			onlineUsers.set(userId, connection);
			db.prepare("UPDATE users SET status = 1 WHERE id = ?").run(user.id);
			console.log("🟢 Connexion WebSocket Secure de l’utilisateur #", userId);
			broadcastToFriends(userId, { type: "friend_online", userId });

			//Mettre ma liste d'amis a jour
			const friends = getFriends(userId);
			const onlineFriends = friends.map(fid => ({
				id: fid,
				status: onlineUsers.has(fid) ? 1 : 0,
			}));
			if (connection){
				connection.send(
					JSON.stringify({
						type: "friends_online",
						friends: onlineFriends
					})
				);
				console.log("💬  Mise a jour la liste d'amis... OK");
			}
			else{
				console.log("💬  Connexion non etablie");
			}

			// Gestion du ping (recevoir pong == connexion ok)
    		connection.isAlive = true;
			connection.on("pong", () => {
			const user = verifyWsAuth(fastify, connection, request);
			if (!user)
				handleDisconnect(userId);
			else
				connection.isAlive = true;
				console.log(`🏓 Pong recu de #${userId}`);
			});

			// Gérer les messages reçus
			connection.on("message", (msg) => {
				console.log(`💬 Message reçu de ${userId}:`, msg.toString());
				connection.send(JSON.stringify({ reply: "Message reçu !" }));
			});

			// Déconnexion
			connection.on("close", () => {
				onlineUsers.delete(userId);
				db.prepare("UPDATE users SET status = 0 WHERE id = ?").run(userId);
				console.log("🔴 Connexion WebSocket Secure fermée pour l'utilisateur #", userId);
				broadcastToFriends(userId, { type: "friend_offline", userId });
			});

		} catch (err) {
			console.error("❌ Erreur WebSocket:", err.message);
			connection.send(JSON.stringify({ error: "Invalid token" }));
			connection.close();
		}
	});

	// === Vérifie régulièrement que les connexions sont vivantes ===
	setInterval(() => {
		for (const [userId, conn] of onlineUsers.entries()) {
			if (!conn){
				console.warn(`Suppression de connexion invalide pour #${userId}`);
				onlineUsers.delete(userId);
				continue ;
			}
			if (!conn.isAlive) {
				handleDisconnect(userId);
			} else {
				conn.isAlive = false;
				conn.ping();
			}
		}
	}, PING_INTERVAL);

	// Envoie un message à tous les amis connectés
	function broadcastToFriends(userId, message) {
		try {
			console.log(`📢 broadcastToFriends envoye par #${userId}`, message);
			const friends = getFriends(userId);
			console.log(`👥 Amis trouvés :`, friends);
			for (const friendId of friends) {
				const fconn = onlineUsers.get(friendId);
				if (fconn) {
				console.log(`📨 Envoi WS à l’ami #${friendId}`);
				fconn.send(JSON.stringify(message));
				}
			}
		} catch (err) {
		console.error("Erreur lors de la notification des amis :", err.message);
		}
	}

	// Renvoie les IDs des amis de l’utilisateur
	// Les users qui ont ajoute userId comme ami plus exactement
	function getFriends(userId) {
		const rows = db.prepare(`SELECT user_id FROM friends WHERE friend_id = ?`).all(userId);
		return rows.map(r => r.user_id);
	}

	function handleDisconnect(userId) {
	const conn = onlineUsers.get(userId);
	//fermer socket et retirer de la liste onlineUsers
	if (conn) {
		conn.terminate();
		onlineUsers.delete(userId);
	}
	db.prepare("UPDATE users SET status = 0 WHERE id = ?").run(userId);
	console.log(`💀 Déconnexion forcée de user #${userId} (timeout ping)`);
	broadcastToFriends(userId, { type: "friend_offline", userId });
	}
};
