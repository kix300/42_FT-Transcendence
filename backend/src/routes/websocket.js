import db from '../db.js';
import { verifyWsAuth } from '../https.js'

const PING_INTERVAL = 30000;	// 30 secondes
const onlineUsers = new Map();	// Map(userId -> connection)

//WebSocketRoutes handler
export default async function webSocketRoutes (fastify) {
	fastify.get("/ws", { websocket: true }, (connection, request) => {
		try {
			//Check token
			const user = verifyWsAuth(fastify, connection, request);
			if (!user) return ;
			console.log("💬  Check token... OK");

			//status online
			const userId = user.id;
			onlineUsers.set(userId, connection);
			db.prepare("UPDATE users SET status = 1 WHERE id = ?").run(user.id);
			console.log("🟢 Connexion WebSocket Secure de l’utilisateur #", userId);
			//Notifier mes amis que je suis connecte
			broadcastToFriends(userId, { type: "friend_online", userId });

			//Mettre ma liste d'amis a jour lorsque je me connecte
			const friends = getFriends(userId);
			const onlineFriends = friends.map(fid => ({
				id: fid,
				status: onlineUsers.has(fid)?1 : 0
			}));
			if (connection && connection.socket){
				connection.socket.send(
					JSON.stringify({
						type: "friends_online",
						friends: onlineFriends
					})
				);
				console.log("💬  Mettre a jour la liste d'amis... OK");
			}
			else{
				console.log("💬  Connexion non etablie");
			}

			// Gestion du ping (recevoir pong == connexion ok)
    		connection.isAlive = true;
			connection.socket.on("pong", () => {
			connection.isAlive = true;
			console.log(`🏓 Pong recu de #${userId}`);
			});

			// Gérer les messages reçus
			connection.socket.on("message", (msg) => {
				console.log(`💬 Message reçu de ${userId}:`, msg.toString());
				connection.socket.send(JSON.stringify({ reply: "Message reçu !" }));
			});

			// Déconnexion
			connection.socket.on("close", () => {
				onlineUsers.delete(userId);
				db.prepare("UPDATE users SET status = 0 WHERE id = ?").run(userId);
				console.log("🔴 Connexion WebSocket Secure fermée pour l'utilisateur #", userId);
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
			handleDisconnect(userId);
		} else {
			conn.isAlive = false;
			if (conn && conn.socket)
				conn.socket.ping();
			else
				onlineUsers.delete(userId);
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
				if (fconn && fconn.socket) {
				console.log(`📨 Envoi WS à l’ami #${friendId}`);
				fconn.socket.send(JSON.stringify(message));
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

	function handleDisconnect(userId) {
	const conn = onlineUsers.get(userId);
	//fermer socket et retirer de la liste onlineUsers
	if (conn && conn.socket) {
		conn.socket.terminate();
		onlineUsers.delete(userId);
	}

	db.prepare("UPDATE users SET status = 0 WHERE id = ?").run(userId);
	console.log(`⚰️ Déconnexion forcée de l’utilisateur #${userId} (timeout ping)`);
	broadcastToFriends(userId, { type: "friend_offline", userId });
	}
};
