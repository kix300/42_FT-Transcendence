import db from "../db.js";
import bcrypt from "bcrypt";
import websocket from "@fastify/websocket";
import { authenticator } from "otplib";

export default async function loginRoutes(fastify, options) {
  fastify.post("/api/login", async (request, reply) => {
    const { username, password } = request.body;

    try {
      // Recherche l'utilisateur en base via l'email
      const user = db
        .prepare("SELECT * FROM users WHERE username = ?")
        .get(username);

      if (!user) {
        return reply.code(401).send({ error: "Utilisateur non trouvé" });
      }

      // Vérifie le mot de passe
      const passwordMatches = await bcrypt.compare(password, user.password);
      if (!passwordMatches) {
        return reply.code(401).send({ error: "Mot de passe incorrect" });
      }
      // verification 2FA
      if (user.two_fa_enabled) {
        // Si la 2FA est activée mais pas de token fourni
        if (!twoFaToken) {
          return reply.code(403).send({
            error: "2FA requis",
            requires2FA: true, // Signal au frontend
          });
        }

        // Vérifie le code TOTP
        const isValid = authenticator.verify({
          token: twoFaToken,
          secret: user.two_fa_secret,
        });

        if (!isValid) {
          return reply.code(401).send({ error: "Code 2FA invalide" });
        }
      }

      // Génère un token JWT
      const token = fastify.jwt.sign({ id: user.id, email: user.email });
      console.log("✅ Token généré :", token);

      db.prepare("UPDATE users SET status = 1 WHERE id = ?").run(user.id);

      return reply.send({
        message: "Connexion réussie",
        token,
        user: { id: user.id, username: user.username },
      });
    } catch (err) {
      console.error(err);
      return reply.code(500).send({ error: "Erreur interne" });
    }
  });
}
