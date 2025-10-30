import { FriendManager } from "./Friends";

let ws: WebSocket | null = null;

export function connectWebSocket(token: string) {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const url = `${protocol}://${window.location.host}/ws?token=${token}`;
  console.log(`🔄 Connexion WebSocket: ${url}`);

  try {

    if (ws)
      ws.close();

    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("🟢 WebSocket connecté");
  	  FriendManager.loadFriendsList();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
  	    FriendManager.loadFriendsList();
        handleWsMessage(data);
      } catch (error) {
        console.error("❌ Erreur parsing message WebSocket:", error);
      }
    };

    ws.onclose = (event) => {
      if (event.code != 1005) {
        console.log(`🔴 WebSocket fermé (code: ${event.code}), reconnexion dans 5s...`);
        setTimeout(() => connectWebSocket(token), 5000);
      } else {
        console.log(`🔴 WebSocket fermé (user logged out, code: ${event.code})`);
      }
    };

    ws.onerror = (err) => {
      console.error("❌ WebSocket erreur:", err);
    };
  } catch (error) {
    console.error("❌ Erreur création WebSocket:", error);
  }
}

function handleWsMessage(data: any) {
  if (data.type === "friend_online") {
    console.log(`👋 ${data.username} est en ligne`);
	FriendManager.updateFriendsStatus(data.userId, 1);
  } else if (data.type === "friend_offline") {
    console.log(`👋 ${data.username} est hors ligne`);
	FriendManager.updateFriendsStatus(data.userId, 0);
  } else if (data.type === "friends_online") {
  	console.log("📡 WS received message:", data);
	if (Array.isArray(data.friends)) {
        data.friends.forEach((friend: {id: number; status: number}) => {
		  FriendManager.updateFriendsStatus(friend.id, friend.status);
        });
    }
  }
}

// Fonction pour fermer proprement la connexion
export function disconnectWebSocket() {
  if (ws) {
    try{
      console.log("🔌 Fermeture de la connexion WebSocket...");
      ws.close();
      ws = null;
      console.log("🔌 Fermeture de la connexion WebSocket... ok");
    } catch(err) {
      console.error("Erreur logout:", err);
    }
  }
}

// Non utilise encore
export function sendWsMessage(msg: any) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  } else {
    console.warn("⚠️ WebSocket non connecté, impossible d'envoyer le message");
  }
}


