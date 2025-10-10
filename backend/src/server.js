//import
import Fastify from 'fastify';
import fastifyStatic from "@fastify/static";
import fastifyJwt from "@fastify/jwt";
import 'dotenv/config';
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

//import routes
import registerRoutes from './routes/register.js';
import loginRoutes from './routes/login.js';
import userRoutes from './routes/users.js';
// import oauthRoutes from './routes/oauth.js';

//variables
const fastify = Fastify({ logger: true });
const __dirname = dirname(fileURLToPath(import.meta.url));

// Servir les fichiers statiques du répertoire 'dist' (créé par npm run build)
// Cela inclut index.html, et les assets (JS, CSS)
fastify.register(fastifyStatic, {
  root: path.join(__dirname, "public/dist"),
  // En ne mettant pas de préfixe, les requêtes sont mappées directement à la structure de fichiers dans 'public/dist'.
  // Par exemple, une requête pour /assets/some.js servira public/dist/assets/some.js
});

// Clé secrète JWT
fastify.register(fastifyJwt, {
  secret: process.env.JWT_PWD ,
});

// décorateur pour vérifier le token facilement dans les routes
fastify.decorate("authenticate", async (request, reply) => {
  try {
	console.log("🪪 Header Authorization reçu:", request.headers.authorization);
    await request.jwtVerify();
  } catch (err) {
	 console.error("❌ Erreur JWT:", err.message);
    reply.code(401).send({ error: "Unauthorized" });
  }
});

export default fastify;

// Enregistrer les routes
fastify.register(registerRoutes);
fastify.register(loginRoutes);
fastify.register(userRoutes);
// fastify.register(oauthRoutes);

// Renvoie la route '/' a public/dist/index.html 
fastify.get("/", async (request, reply) => {
  return reply.sendFile("index.html");
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

// ⚙️ Catch-all route pour servir public/dist/index.html
fastify.setNotFoundHandler((request, reply) => {
  reply.sendFile('index.html'); 
});


start();
