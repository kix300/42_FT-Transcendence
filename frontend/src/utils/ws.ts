let ws: WebSocket | null = null;

export function connectWebSocket(token: string) {
  const protocol = location.protocol === "wss";
  ws = new WebSocket(`${protocol}://${location.host}/ws?token=${token}`);

  ws.onopen = () => {
    console.log("🟢 WebSocket connecté");
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleWsMessage(data);
  };

  ws.onclose = () => {
    console.log("🔴 WebSocket fermé, tentative de reconnexion dans 5s...");
    setTimeout(() => connectWebSocket(token), 5000);
  };

  ws.onerror = (err) => {
    console.error("❌ WebSocket erreur:", err);
  };
}

function handleWsMessage(data: any) {
  // traiter friend_online / friend_offline
  console.log("WS message:", data);
}

export function sendWsMessage(msg: any) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}