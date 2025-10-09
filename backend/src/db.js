import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import 'dotenv/config';

// crée ou ouvre le fichier database.db
const db = new Database("/data/database.db");

// crée la table si elle n'existe pas
// on refuse les doublons de username et de email
db.prepare("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, email TEXT UNIQUE, password TEXT, photo TEXT DEFAULT './uploads/avatar.png', wins INTEGER DEFAULT 0, losses INTEGER DEFAULT 0)").run();

// insère une donnée
try{
    const hashed1 = await bcrypt.hash(process.env.MDP1, 10);
    const hashed2 = await bcrypt.hash(process.env.MDP2, 10);
    const hashed3 = await bcrypt.hash(process.env.MDP3, 10);
    db.prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)").run("kimnguye", "kimnguye@42.fr", hashed1);
    db.prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)").run("kduroux", "kduroux@42.fr", hashed2);
    db.prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)").run("hgirard", "hgirard@42.fr", hashed3);
} catch (err) {
    if (err.code == "SQLITE_CONSTRAINT_UNIQUE"){
        console.log("Username or email already exists");
    }
    else {
        console.log("Internal server error");
    }
}


// lit les données et les affiche sur la console
const rows = db.prepare("SELECT * FROM users").all();
console.log(rows);

export default db;
