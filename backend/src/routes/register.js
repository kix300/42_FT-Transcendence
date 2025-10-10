import bcrypt from "bcrypt";
import db from "../db.js";
import multipart from "@fastify/multipart";
import fs from "fs";
import path from "path";

export default async function registerRoutes(fastify ){
	fastify.register(multipart);
    fastify.post("/api/register", async(request, reply) => {
		let username, email, password;
		let avatarPath = './uploads/avatar.png';
		let avatar;

		const parts = request.parts();
		for await (const part of parts) {
			if (part.file) {
				avatar = part;
			} else {
				if (part.fieldname === "username") username = part.value;
				if (part.fieldname === "email") email = part.value;
				if (part.fieldname === "password") password = part.value;
			}
		}
		if (avatar)
		{
			const uploadsDir = path.join(process.cwd(), 'uploads');
			const newFilename = Date.now() + '_' + avatar.filename;
			const filePath = path.join(uploadsDir, newFilename);
			const writeStream = fs.createWriteStream(filePath);
			await avatar.file.pipe(writeStream);
			await new Promise((resolve, reject) => {
				writeStream.on('finish', resolve);
				writeStream.on('error', reject);
			});
			console.log('Fichier uploadé:', filePath);
			avatarPath = `./uploads/${newFilename}`;
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
                reply.code(500).send({error: "Internal server error"});
            }
        }
    });
}
