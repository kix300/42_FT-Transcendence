
// Check HTTPS connexion
export function requireHttps(req, reply, done) {
  const isTls = !!req.raw.socket.encrypted || req.headers['x-forwarded-proto'] === 'https';
  if (!isTls) {
    // soit rediriger vers https, soit renvoyer une erreur
    return reply.code(403).send({ error: 'HTTPS required' });
  }
  done();
}

