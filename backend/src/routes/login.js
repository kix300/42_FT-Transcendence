import db from "../db.js";
import bcrypt from "bcrypt";
import { MSG } from "../msg.js";

export default async function loginRoutes(fastify, options) {
  fastify.post("/api/login", async (request, reply) => {
    const { username, password } = request.body;

    try {
      // Recherche l'utilisateur en base via l'email
      const user = db
        .prepare("SELECT * FROM users WHERE username = ?")
        .get(username);

      if (!user) {
        return reply.code(401).send({ error: MSG.USER_NOT_FOUND });
      }

      // Vérifie le mot de passe
      const passwordMatches = await bcrypt.compare(password, user.password);
      if (!passwordMatches) {
        return reply.code(401).send({ error: MSG.AUTHENTICATION_ERROR });
      }

      // Génère un token JWT
      const token = fastify.jwt.sign({ id: user.id, email: user.email });
      console.log("✅ Token généré :", token);

      db.prepare("UPDATE users SET status = 1 WHERE id = ?").run(user.id);
      db.prepare("UPDATE users SET last_login = datetime('now', 'localtime') WHERE id = ?").run(user.id);

      return reply.send({
        message: "Connexion réussie",
        token,
        user: { id: user.id, username: user.username },
      });
    } catch (err) {
      console.error(err);
      return reply.code(500).send({ error: MSG.INTERNAL_SERVER_ERROR });
    }
  });
}
