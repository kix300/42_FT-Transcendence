FROM node:18-bullseye

WORKDIR	/app

COPY	package*.json ./

RUN		apt-get update && apt-get install -y python3 make g++ \
	&&	npm install


COPY	public/ ./public/
COPY	server.js .
COPY	db.js .

# Créer un dossier pour la base SQLite et donner les droits à node
RUN		mkdir -p /data && chown -R 1000:1000 /data

EXPOSE	3000

USER	node

CMD		["node", "server.js"]