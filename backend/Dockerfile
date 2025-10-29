FROM node:18-bullseye

WORKDIR	/app

COPY	package*.json ./

RUN		apt-get update && apt-get install -y python3 make g++ openssl \
	&&	npm install

COPY	public/ ./public/
COPY	--chmod=755 src/ .

COPY	uploads/ ./uploads/
RUN		chown -R 1000:1000 ./uploads/

#	Créer un dossier pour la base SQLite et donner les droits à node
RUN		mkdir -p /data && chown -R 1000:1000 /data

RUN		mkdir -p ./https

#generate auto-signed SSL certificate with private key in 4096 bits
#subj: subject of the certificate, CN: Common Name, certificate for localhost
#certificate lasts 365 days
#x509: auto-signed certificate
#no DES: the private key is not crypted by a password.

RUN openssl req -x509 -nodes -newkey rsa:4096 \
    -keyout ./https/server.key \
    -out ./https/server.crt \
    -days 365 \
    -subj "/CN=$DOMAIN_NAME" \
	&& chown -R 1000:1000 ./https \
	&& chmod 600 ./https/server.key ./https/server.crt

EXPOSE	3000

USER	node

CMD		["node", "server.js"]
