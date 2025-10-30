import db from "../db.js";
import bcrypt from 'bcrypt';
import multipart from '@fastify/multipart';
import path from 'path';
import { pipeline } from "stream/promises";
import fs from "fs";
import { MSG } from "../msg.js";

export default async function usersRoutes(fastify, options) {

	fastify.register(multipart);


	/************************************/
	/*                                  */
	/*           USERS PAGE             */
	/*                                  */
	/************************************/

    //liste des utilisateurs (pour utilisateur connecte)
    fastify.get("/api/users", { preHandler: [fastify.authenticate] }, async () => {
		try{
			const users = db.prepare("SELECT * FROM users WHERE id != 0").all();
			if (users.length === 0)
				return reply.status(404).send({ message: "Aucun utilisateur trouvé." });
			return users;
		} catch(err) {
			console.error("Erreur lors de la récupération des utilisateurs:", err);
    		reply.status(500).send({ message: MSG.INTERNAL_SERVER_ERROR });
		}
	});

    //ajouter un user (pour admin)
    fastify.post("/api/users", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { username } = req.body;
	if (req.user.role !== 'admin'){
		return reply.status(403).send({ error: MSG.FORBIDEN_ACCES });
	} 
    try {
        db.prepare("INSERT INTO users (username) VALUES (?)").run(username);
        return { success: true };
    } catch {
        return reply.status(400).send({ error: "Utilisateur déjà existant" });
    }
    });

	//supprimer un user pour admin)
	fastify.delete("/api/users/:id", { preHandler: [fastify.authenticate] }, async (req, reply) => {
		const { id } = req.params;

		if (req.user.role !== 'admin') {
			return reply.status(403).send({ error: MSG.FORBIDEN_ACCES  });
		}
		try {
			const result = db.prepare("DELETE FROM users WHERE id = ?").run(id);
			if (result.changes === 0) {
				return reply.status(404).send({ error: MSG.USER_NOT_FOUND });
			}
			return { success: true };
		} catch (error) {
			return reply.status(400).send({ error: 'Erreur lors de la suppression de l\'utilisateur' });
		}
	});


	/************************************/
	/*                                  */
	/*           VIEW PROFILE           */
	/*                                  */
	/************************************/

	/* View others profile, accessible only for logged-in users */
	fastify.get("/api/user/:id", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        //on recupere id de l'utilisateur qu'on veut voir (a modifier avec ce que Killian dira)
        const userId = request.params.id;

		//table users
        const user = db
            .prepare("SELECT * FROM users_public WHERE id = ?")
            .get(userId);
        if (!user) {
            return reply.code(404).send({ error: MSG.USER_NOT_FOUND });
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



	/************************************/
	/*                                  */
	/*           MY PROFILE	            */
	/*                                  */
	/************************************/


    //récupérer les infos de l'utilisateur connecte
    fastify.get("/api/me", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        // le token contient l'id de l'utilisateur connecté
        const userId = request.user.id;

		//table users
        const user = db
            .prepare("SELECT * FROM users_public WHERE id = ?")
            .get(userId);
        if (!user) {
            return reply.code(404).send({ error: MSG.USER_NOT_FOUND });
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

    // modifier les infos de l'utilisateur connecté
    fastify.patch("/api/me", { preHandler: [fastify.authenticate] }, async (request, reply) => {
		const userId = request.user.id;
        const {currentPassword, username, email, password} = request.body;

		//check user existence in database
		const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
		if (!user) {
		return reply.code(404).send({ error: MSG.USER_NOT_FOUND });
		}

		//check password
		const passwordMatches = await bcrypt.compare(currentPassword, user.password);
		if (!passwordMatches) {
		return reply.code(401).send({ error: 'Mot de passe incorrect' });
		}

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
        reply.code(500).send({ error: "Erreur dans la mise a jour des donnees (backend Kim va corriger)" });
        }
    });

	// modifier la photo de l'utilisateur connecté
	fastify.patch("/api/me/avatar", { preHandler: [fastify.authenticate] }, async (request, reply) => {
		const userId = request.user.id;
		const uploadsDir = path.join(process.cwd(), "uploads");
		let avatarFile;

		try {
		avatarFile = await request.file();
		} catch {
		return reply.code(400).send({ error: "No file uploaded" });
		}

		if (!avatarFile) return reply.code(400).send({ error: "No file uploaded" });

		// Récupérer l'utilisateur actuel
		const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
		if (!user) return reply.code(404).send({ error: MSG.USER_NOT_FOUND });

		// Supprimer l'ancienne photo si ce n'est pas l'avatar par défaut
		if (user.photo && user.photo !== "./uploads/avatar.png" && fs.existsSync(user.photo)) {
		fs.unlinkSync(user.photo);
		}

		// Enregistrer le nouveau fichier
		const newFilename = Date.now() + "_" + avatarFile.filename;
		const filePath = path.join(uploadsDir, newFilename);
		await pipeline(avatarFile.file, fs.createWriteStream(filePath));
		console.log('Fichier uploadé:',  path.join(uploadsDir, avatarFile.filename));
		
		db.prepare("UPDATE users SET photo = ? WHERE id = ?").run(`./uploads/${newFilename}`, userId);

		return reply.send({ message: "Avatar updated successfully", photo: `./uploads/${newFilename}` });
	});
}

	