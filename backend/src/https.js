import Fastify from "fastify";


// Rediriger les requetes http vers https
const httpServer = Fastify();
httpServer.all("/*", (req, reply) => {
  const host = req.headers.host?.replace(/:\d+$/, ""); // Retire le port s’il existe
  reply.redirect(301, `https://${host}${req.url}`);
});

httpServer.listen({ port: 80, host: "0.0.0.0" })
  .then(() => console.log("HTTP -> HTTPS redirect server listening on port 80"))
  .catch(err => {
    console.error("Error starting HTTP redirect server:", err);
    process.exit(1);
  });

// middleware
export function requireHttps(req, reply, done) {
  const isTls = !!req.raw.socket.encrypted || req.headers['x-forwarded-proto'] === 'https';
  if (!isTls) {
    // soit rediriger vers https, soit renvoyer une erreur
    return reply.code(403).send({ error: 'HTTPS required' });
  }
  done();
}

