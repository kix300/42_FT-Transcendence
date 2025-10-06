//variables
const fastify	= require('fastify')({ logger: true });
const path		= require('path');
const db		= require("./db.js");

//met root a public
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/'
});

//route / -> index.html
fastify.get('/', async (request, reply) => {
  return reply.sendFile('index.html');
});

fastify.get('/test', async (request, reply) => {
  return reply.sendFile('test.html');
});

// API test simple pour les utilisateurs
fastify.get("/api/users", async () => db.prepare("SELECT * FROM users").all());

fastify.post("/api/users", async (req, reply) => {
  const { username } = req.body;
  try {
    db.prepare("INSERT INTO users (username) VALUES (?)").run(username);
    return { success: true };
  } catch {
    return reply.status(400).send({ error: "Utilisateur déjà existant" });
  }
});

// le server ecoute sur le port 3000
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();