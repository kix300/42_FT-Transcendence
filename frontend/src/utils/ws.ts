import { FriendManager } from "./Friends";

let ws: WebSocket | null = null;

export function connectWebSocket(token: string) {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const url = `${protocol}://${window.location.host}/ws?token=${token}`;
  console.log(`🔄 Connexion WebSocket: ${url}`);

  try {
    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("🟢 WebSocket connecté");
  	  FriendManager.loadFriendsList(); // Refresh friends list
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
  	    FriendManager.loadFriendsList(); // Refresh friends list
        handleWsMessage(data);
      } catch (error) {
        console.error("❌ Erreur parsing message WebSocket:", error);
      }
    };

    ws.onclose = (event) => {
      console.log(`🔴 WebSocket fermé (code: ${event.code}), reconnexion dans 5s...`);
      setTimeout(() => connectWebSocket(token), 5000);
    };

    ws.onerror = (err) => {
      console.error("❌ WebSocket erreur:", err);
    };
  } catch (error) {
    console.error("❌ Erreur création WebSocket:", error);
  }
}

function handleWsMessage(data: any) {
  console.log("📡 WS received message:", data);

  // Exemple de gestion des événements
  if (data.type === "friend_online") {
    console.log(`👋 ${data.username} est en ligne`);
    // Mettre à jour l'interface utilisateur
	FriendManager.updateFriendsStatus(data.userId, 1);
  } else if (data.type === "friend_offline") {
    console.log(`👋 ${data.username} est hors ligne`);
    // Mettre à jour l'interface utilisateur
	FriendManager.updateFriendsStatus(data.userId, 0);
  } else if (data.type === "friends_online") {
  	console.log(`👋 ${data.username}: liste des amis connectes recue`);
	if (Array.isArray(data.friends)) {
        data.friends.forEach((friend: {id: number; status: number}) => {
		  FriendManager.updateFriendsStatus(friend.id, friend.status);
        });
    }
  }
}

export function sendWsMessage(msg: any) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  } else {
    console.warn("⚠️ WebSocket non connecté, impossible d'envoyer le message");
  }
}

// Fonction utilitaire pour vérifier l'état
export function isWebSocketConnected(): boolean {
  return ws !== null && ws.readyState === WebSocket.OPEN;
}

// Fonction pour fermer proprement la connexion
export function disconnectWebSocket() {
  if (ws) {
	console.log("🔌 Fermeture de la connexion WebSocket...");
    ws.close();
    ws = null;
  }
}


