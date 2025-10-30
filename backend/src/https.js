
// Check HTTPS connexion
export function requireHttps(req, reply, done) {
  const isTls = !!req.raw.socket.encrypted || req.headers['x-forwarded-proto'] === 'https';
  if (!isTls) {
    // soit rediriger vers https, soit renvoyer une erreur
    return reply.code(403).send({ error: 'HTTPS required' });
  }
  done();
}

// Only valid JWT can use WS connexion
export function verifyWsAuth(fastify, connection, request) {
  try {
    const token = new URL(request.url, `https://${request.headers.host}`).searchParams.get("token");
    if (!token) throw new Error("Missing token");
    const user = fastify.jwt.verify(token);
    if (!user || !user.id) throw new Error("Invalid token");
    return user;
  } catch (err) {
	console.error("❌ WebSocket auth failed:", err.message);
    connection.send(JSON.stringify({ error: err.message }));
    connection.close();
    return null;
  }
}