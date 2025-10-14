import db from "../db.js";


export default async function usersRoutes(fastify, options) {

    //liste des utilisateurs
    fastify.get("/api/users", async () => db.prepare("SELECT * FROM users").all());

    //ajouter un user
    fastify.post("/api/users", async (req, reply) => {
    const { username } = req.body;
    try {
        db.prepare("INSERT INTO users (username) VALUES (?)").run(username);
        return { success: true };
    } catch {
        return reply.status(400).send({ error: "Utilisateur déjà existant" });
    }
    });

    //Info de lutilisateur connecte
    fastify.get("/api/me", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        // le token contient l'id de l'utilisateur connecté
        const userId = request.user.id;

		//table users
        const user = db
            .prepare("SELECT * FROM users WHERE id = ?")
            .get(userId);
        if (!user) {
            return reply.code(404).send({ error: "Utilisateur introuvable" });
        }

		//table matches
    	const matches = db
        .prepare(`SELECT * FROM matches 
                  WHERE player1_id = ? OR player2_id = ? 
                  ORDER BY date DESC`)
        .all(userId, userId);

		//stats
		const stats = {
			totalMatches: matches.length,
			wins: matches.filter(m => m.winner_id === userId).length,
			losses: matches.filter(m => m.winner_id !== userId).length
		};
		reply.send({
			user,
			stats,
			matches
		});
    });

    //modifier ses infos
    fastify.patch("/api/me", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const userId = request.user.id;
        const {username, email, password} = request.body;

        try {
        const updates = [];
        const values = [];

        if (username) {
            updates.push("username = ?");
            values.push(username);
        }

        if (email) {
            updates.push("email = ?");
            values.push(email);
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push("password = ?");
            values.push(hashedPassword);
        }

        if (updates.length === 0) {
            return reply.code(400).send({ error: "Aucune donnée à mettre à jour" });
        }

        values.push(userId);

        db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`)
            .run(...values);

        reply.send({ message: "Profil mis à jour avec succès" });
        } catch (err) {
        console.error(err);
        reply.code(500).send({ error: "Erreur serveur" });
        }
    });

}

//modifier sa photo
export async function avatarRoutes(fastify) {
	fastify.register(multipart);

	fastify.patch("/api/me/avatar", async (request, reply) => {
		const userId = request.params.id;
		const uploadsDir = path.join(process.cwd(), "uploads");
		let avatarFile;

		try {
		avatarFile = await request.file();
		} catch {
		return reply.code(400).send({ error: "No file uploaded" });
		}

		if (!avatarFile) return reply.code(400).send({ error: "No file uploaded" });

		// Récupérer l'utilisateur actuel
		const user = fastify.db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
		if (!user) return reply.code(404).send({ error: "User not found" });

		// Supprimer l'ancienne photo si ce n'est pas l'avatar par défaut
		if (user.photo && user.photo !== "./uploads/avatar.png" && fs.existsSync(user.photo)) {
		fs.unlinkSync(user.photo);
		}

		// Enregistrer le nouveau fichier
		const newFilename = Date.now() + "_" + avatarFile.filename;
		const filePath = path.join(uploadsDir, newFilename);
		await pipeline(avatarFile.file, fs.createWriteStream(filePath));

		// Mettre à jour la BDD
		fastify.db.prepare("UPDATE users SET photo = ? WHERE id = ?").run(`./uploads/${newFilename}`, userId);

		return reply.send({ message: "Avatar updated successfully", photo: `./uploads/${newFilename}` });
	});
}