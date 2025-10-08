import db from "../db.js";

// liste des users 
export default async function usersRoutes(fastify, options) {

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
}



