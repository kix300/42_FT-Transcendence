const fastify = require("fastify")({ logger: true });
const bcrypt = require("bcrypt");


fastify.post("/api/register", async(requestAnimationFrame, reply) => {
    const {username, email, password} = request.body;

    try{
        db.prepare().run(username, email, password);
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