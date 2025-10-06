FROM node:18-alpine

#dir du container
WORKDIR	/app

COPY	package*.json ./
COPY	public/ ./public/
COPY	server.js .

RUN		npm install

VOLUME	["/app"]

EXPOSE	3000

USER	node

CMD		["node", "server.js"]