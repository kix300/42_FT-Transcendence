import db from '../db.js';
import bcrypt from 'bcrypt';

export default async function loginRoutes(fastify, options) {
  fastify.post('/api/login', async (request, reply) => {
    const { username, password } = request.body;

    try {
		// Recherche l'utilisateur en base via l'email
		const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

		if (!user) {
		return reply.code(401).send({ error: 'Utilisateur non trouvé' });
		}

		// Vérifie le mot de passe
		const passwordMatches = await bcrypt.compare(password, user.password);
		if (!passwordMatches) {
		return reply.code(401).send({ error: 'Mot de passe incorrect' });
		}

      	// Génère un token JWT
    	const token = fastify.jwt.sign({ id: user.id, email: user.email});
		console.log("✅ Token généré :", token);

      	// Pour plus tard: gérer la session ICI
		
		return reply.send({ 
			message: 'Connexion réussie',
			token,
			user: { id: user.id, username: user.username },
			});
    } catch (err) {
      console.error(err);
      return reply.code(500).send({ error: 'Erreur interne' });
    }
  });
}
