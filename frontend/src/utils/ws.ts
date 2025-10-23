// KIM
// let ws: WebSocket | null = null;

// export function connectWebSocket(token: string) {
//   const protocol = location.protocol === "wss";
//   ws = new WebSocket(`${protocol}://${location.host}/ws?token=${token}`);

//   ws.onopen = () => {
//     console.log("🟢 WebSocket connecté");
//   };

//   ws.onmessage = (event) => {
//     const data = JSON.parse(event.data);
//     handleWsMessage(data);
//   };

//   ws.onclose = () => {
//     console.log("🔴 WebSocket fermé, tentative de reconnexion dans 5s...");
//     setTimeout(() => connectWebSocket(token), 5000);
//   };

//   ws.onerror = (err) => {
//     console.error("❌ WebSocket erreur:", err);
//   };
// }

// function handleWsMessage(data: any) {
//   // traiter friend_online / friend_offline
//   console.log("WS message:", data);
// }

// export function sendWsMessage(msg: any) {
//   if (ws && ws.readyState === WebSocket.OPEN) {
//     ws.send(JSON.stringify(msg));
//   }
// }

// CORRECTION DEEPSEEK -> flemme de fix a la main c'est juste pour que ca ne bloque pas mon test
let ws: WebSocket | null = null;

export function connectWebSocket(token: string) {
  // CORRECTION : Choisir le bon protocole WebSocket
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const url = `${protocol}://${window.location.host}/ws?token=${token}`;

  console.log(`🔄 Connexion WebSocket: ${url}`);

  try {
    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("🟢 WebSocket connecté");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWsMessage(data);
      } catch (error) {
        console.error("❌ Erreur parsing message WebSocket:", error);
      }
    };

    ws.onclose = (event) => {
      console.log(
        `🔴 WebSocket fermé (code: ${event.code}), reconnexion dans 5s...`,
      );
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
  // Traiter friend_online / friend_offline
  console.log("WS message:", data);

  // Exemple de gestion des événements
  if (data.type === "friend_online") {
    console.log(`👋 ${data.username} est en ligne`);
    // Mettre à jour l'interface utilisateur
  } else if (data.type === "friend_offline") {
    console.log(`👋 ${data.username} est hors ligne`);
    // Mettre à jour l'interface utilisateur
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
    ws.close();
    ws = null;
  }
}
