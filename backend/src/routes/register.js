import bcrypt from "bcrypt";
import db from "../db.js";

export default async function registerRoutes(fastify ){
    fastify.post("/api/register", async(request, reply) => {
        const {username, email, password, photo} = request.body;

        try{
            const hashedPassword = await bcrypt.hash(password, 10);
			if (photo){
            	db.prepare('INSERT INTO users (username, email, password, photo) VALUES (?, ?, ?, ?)').run(username, email, hashedPassword, photo);
			} else {

				db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, hashedPassword);
			}
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
