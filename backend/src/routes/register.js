import bcrypt from "bcrypt";
import db from "../db.js";
import multipart from "@fastify/multipart";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { MSG } from "../msg";

export default async function registerRoutes(fastify){
	fastify.register(multipart);
    fastify.post("/api/register", async(request, reply) => {
		let username, email, password;
		let avatarPath = './uploads/avatar.png';
		let avatar;
		const uploadsDir = path.join(process.cwd(), 'uploads');

		const parts = request.parts();
		for await (const part of parts) {
			if (part.file) {
				avatar = part;
				const newFilename = Date.now() + '_' + avatar.filename;
				const filePath = path.join(uploadsDir, newFilename);
				avatarPath = `./uploads/${newFilename}`;
				await pipeline(avatar.file, fs.createWriteStream(filePath));
			}
			else if (part.fieldname === "username") username = part.value;
			else if (part.fieldname === "email") email = part.value;
			else if (part.fieldname === "password") password = part.value;
		}
		console.log('✅ On va enregistrer un nouveau user: ', username);
		if (avatar)
		{
			console.log('Fichier uploadé:',  path.join(uploadsDir, avatar.filename));
		}
		
        try{
            const hashedPassword = await bcrypt.hash(password, 10);
            db.prepare('INSERT INTO users (username, email, password, photo) VALUES (?, ?, ?, ?)').run(username, email, hashedPassword, avatarPath);
            reply.code(201).send({message:"User created successfully"});
        } catch (err) {
            if (err.code == "SQLITE_CONSTRAINT_UNIQUE"){
                reply.code(400).send({error: "Username or email already exists"});
            }
            else {
                console.error(err);
                reply.code(500).send({error: MSG.INTERNAL_SERVER_ERROR});
            }
        }
    });
}
