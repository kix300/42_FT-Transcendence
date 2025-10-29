//import
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyJwt from "@fastify/jwt";
import fs from "fs";
import path from "path";
import "dotenv/config";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { requireHttps } from "./https.js";
import fastifyWebsocket from "@fastify/websocket";
import db from "./db.js";
import blockchainService from "./services/blockchainService.js";

//port
const porthttps = 3000;

//import routes
import registerRoutes from "./routes/register.js";
import loginRoutes from "./routes/login.js";
import userRoutes from "./routes/users.js";
import matchesRoutes from "./routes/matches.js";
import friendsRoutes from "./routes/friends.js";
import webSocketRoutes from "./routes/websocket.js";
import twoFaRoutes from "./routes/twofa.js";
import blockchainRoutes from "./routes/blockchain.js";
// import oauthRoutes from './routes/oauth.js';

// https config
const __dirname = dirname(fileURLToPath(import.meta.url));
const fastify = Fastify({
  https: {
    key: fs.readFileSync(path.join(__dirname, "./https/server.key")),
    cert: fs.readFileSync(path.join(__dirname, "./https/server.crt")),
  },
  logger: true,
});

// Mettre tous le monde hors ligne lors d'un redemarrage du serveur
db.prepare("UPDATE users SET status = 0").run();
console.log("Toutes les connexions réinitialisées (status = 0)");

// Clé secrète JWT
fastify.register(fastifyJwt, { secret: process.env.JWT_PWD });

// Décorateur pour vérifier le token facilement dans les routes
fastify.decorate("authenticate", async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    console.error("❌ Erreur JWT:", err.message);
    reply.code(401).send({ error: "Unauthorized" });
  }
});

// Websocket
await fastify.register(fastifyWebsocket, {server: fastify.server});
await fastify.register(webSocketRoutes);
console.log("✅ WebSocket routes registered");

// Enregistrer les routes
fastify.register(registerRoutes);
fastify.register(loginRoutes);
fastify.register(userRoutes);
fastify.register(matchesRoutes);
fastify.register(friendsRoutes);
fastify.register(twoFaRoutes);
fastify.register(blockchainRoutes);
// fastify.register(oauthRoutes);

// Plugin pour fichiers statiques
fastify.register(fastifyStatic, {
  root: path.join(__dirname, "public/dist"),
});

// Servir les fichiers statiques du répertoire 'uploads'
fastify.register(fastifyStatic, {
  root: path.join(process.cwd(), "uploads"),
  prefix: "/uploads/",
  decorateReply: false,
});

// Renvoie la route '/' a public/dist/index.html
fastify.get("/", async (request, reply) => {
  return reply.sendFile("index.html");
});

// Proteger toutes les routes avec https
fastify.addHook("preHandler", requireHttps);

// fonction asynchrone pour demarrer le server
const start = async () => {
  try {
    // Initialize blockchain service
    try {
      await blockchainService.initialize();
      console.log("✅ Blockchain service initialized");
    } catch (err) {
      console.error("⚠️ Failed to initialize blockchain service:", err.message);
      console.log("Server will continue without blockchain functionality");
    }

    await fastify.listen({ port: porthttps, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Catch-all route pour servir public/dist/index.html
fastify.setNotFoundHandler((request, reply) => {
  reply.sendFile("index.html");
});

export default fastify;

start();
