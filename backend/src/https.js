import Fastify from "fastify";

// --- Serveur HTTP pour redirection ---
export function serverHttpRedirect(httpPort = 80, httpsPort = 3000){

	const httpFastify = Fastify();

	httpFastify.all("/*", async (request, reply) => {
	const host = request.headers.host?.replace(/:\d+$/, ""); // retire le port si présent
	reply.redirect(301, `https://${host}:${httpsPort}${request.url}`);
	});

	httpFastify.listen({ port: httpPort, host: "0.0.0.0" }, (err) => {
	if (err) throw err;
	console.log("➡️ HTTP server running on port ${httpPort}, will redirect to HTTPS");
	});
}


// middleware
export function requireHttps(req, reply, done) {
  const isTls = !!req.raw.socket.encrypted || req.headers['x-forwarded-proto'] === 'https';
  if (!isTls) {
    // soit rediriger vers https, soit renvoyer une erreur
    return reply.code(403).send({ error: 'HTTPS required' });
  }
  done();
}

