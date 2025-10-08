//variables
const fastify = require("fastify")({ logger: true });
const path = require("path");
const db = require("./db.js");

// Servir les fichiers statiques du répertoire 'dist' (créé par npm run build)
// Cela inclut index.html, et les assets (JS, CSS)
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public/dist"),
  // En ne mettant pas de préfixe, les requêtes sont mappées directement
  // à la structure de fichiers dans 'public/dist'.
  // Par exemple, une requête pour /assets/some.js servira public/dist/assets/some.js
});

// Route /pong -> index.html dans public/dist/
fastify.get("/", async (request, reply) => {
  return reply.sendFile("index.html");
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

// fonction asynchrone pour demarrer le server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
