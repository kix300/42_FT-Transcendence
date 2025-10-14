//import
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyJwt from "@fastify/jwt";
import fs from "fs";
import path from "path";
import 'dotenv/config';
import { fileURLToPath } from "url";
import { dirname } from "path";
import { requireHttps } from './https.js';
import { serverHttpRedirect } from "./https.js";

//import routes
import registerRoutes from './routes/register.js';
import loginRoutes from './routes/login.js';
import userRoutes from './routes/users.js';
import statsRoutes from './routes/stats.js';
// import oauthRoutes from './routes/oauth.js';

// https config
const __dirname = dirname(fileURLToPath(import.meta.url));
const fastify = Fastify({
	http2: true,
	https: {
		key: fs.readFileSync(path.join(__dirname, "./https/server.key")),
		cert: fs.readFileSync(path.join(__dirname, "./https/server.crt")),
	},
	logger: true,
});

// Servir les fichiers statiques du répertoire 'dist' (créé par npm run build)
// Cela inclut index.html, et les assets (JS, CSS)
fastify.register(fastifyStatic, {
  root: path.join(__dirname, "public/dist"),
});

// Servir les fichiers statiques du répertoire 'uploads'
fastify.register(fastifyStatic, {
  root: path.join(process.cwd(), 'uploads'),
  prefix: '/uploads/',
  decorateReply: false,
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
fastify.register(statsRoutes);
// fastify.register(oauthRoutes);

// Renvoie la route '/' a public/dist/index.html 
fastify.get("/", async (request, reply) => {
  return reply.sendFile("index.html");
});

// Proteger toutes les routes avec https
fastify.addHook('preHandler', requireHttps);

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
startHttpRedirect(80, 3000);
