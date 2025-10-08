const Database = require("better-sqlite3");

// crée ou ouvre le fichier database.sqlite
const db = new Database("/data/database.sqlite");

// crée la table si elle n'existe pas
db.prepare("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, email TEXT, score INTEGER)").run();

// insère une donnée
db.prepare("INSERT INTO users (username, email, score) VALUES (?, ?, ?)").run("kimnguye", "kimnguye@42.fr", 0);
db.prepare("INSERT INTO users (username, email, score) VALUES (?, ?, ?)").run("kduroux", "kduroux@42.fr", 0);
db.prepare("INSERT INTO users (username, email, score) VALUES (?, ?, ?)").run("hgirard", "hgirard@42.fr", 0);

// lit les données et les affiche sur la console
const rows = db.prepare("SELECT * FROM users").all();
console.log(rows);

module.exports = db;
