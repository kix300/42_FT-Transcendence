//initialisation
const fastify = require('fastify')({ logger: true });
const path = require('path');
const fs = require('fs').promises;

//met root a public
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/'
});

//route / -> index.html
fastify.get('/', async (request, reply) => {
  return reply.sendFile('index.html');
});

fastify.get('/test', async (request, reply) => {
  return reply.sendFile('test.html');
});



// le server ecoute sur le port 3000
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();