FROM node:18-alpine

#dir du container
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY server.js .
COPY public/ ./public/
VOLUME ["/app"]
EXPOSE 3000
USER node
CMD ["node", "server.js"]