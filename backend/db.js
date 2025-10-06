const Database = require("better-sqlite3");

// crée (ou ouvre) un fichier database.sqlite
const db = new Database("/data/database.sqlite");

// crée la table si elle n'existe pas
db.prepare("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, score INTEGER)").run();

// insère une donnée
db.prepare("INSERT INTO users (username, score) VALUES (?, ?)").run("bob", 100);

// lit les données
const rows = db.prepare("SELECT * FROM users").all();
console.log(rows);

module.exports = db;
