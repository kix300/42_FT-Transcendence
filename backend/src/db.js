import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import 'dotenv/config';

// crée ou ouvre le fichier database.db
const db = new Database("/data/database.db");



/*****************************************************************/ 
/*                                                               */ 
/*                 TABLE USERS                                   */ 
/*                                                               */ 
/*****************************************************************/ 


// crée la table users si elle n'existe pas
// on refuse les doublons de username et de email
db.prepare(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password TEXT NOT NULL,
  photo TEXT DEFAULT './uploads/avatar.png',
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0
  )`).run();

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


// ajoute la colonne role
const columnExists = db
  .prepare("PRAGMA table_info(users)").all()
  .some(col => col.name === "role");

if (!columnExists) {
  db.prepare("ALTER TABLE users ADD COLUMN role TEXT CHECK(role IN ('admin', 'user')) DEFAULT 'user'").run();
  console.log("✅ Colonne 'role' ajoutée !");
} else {
  console.log("ℹ️ La colonne 'role' existe déjà, rien à faire.");
}

// mise a jour du role pour les utilisateurs deja existants
const admins = ['kimnguye', 'kduroux', 'hgirard'];
const placeholders = admins.map(() => '?').join(', ');

db.prepare(`UPDATE users SET role = 'admin' WHERE username IN (${placeholders})`).run(...admins);
db.prepare(`UPDATE users SET role = 'user' WHERE role IS NULL`).run();


// lit les données et les affiche sur la console
const rows = db.prepare("SELECT * FROM users").all();
console.log(rows);



/*****************************************************************/ 
/*                                                               */ 
/*                 TABLE MATCHES                                 */ 
/*                                                               */ 
/*****************************************************************/ 


// crée la table si elle n'existe pas
db.prepare(`CREATE TABLE IF NOT EXISTS matches (
	id INTEGER PRIMARY KEY,
	player1_id INTEGER NOT NULL,
	player2_id INTEGER NOT NULL,
	winner_id INTEGER NOT NULL,
	player1_score INTEGER,
	player2_score INTEGER,
  tournament_winner_id INTEGER,
	is_tournament BOOLEAN DEFAULT 0, --0 = false, 1 = true
	date DATETIME TEXT DEFAULT (datetime('now', 'localtime')),
	FOREIGN KEY (player1_id) REFERENCES users(id),
	FOREIGN KEY (player2_id) REFERENCES users(id),
	FOREIGN KEY (winner_id) REFERENCES users(id)
	)`).run();



/*inserer une nouvelle stat*/
// db.prepare(`
//   INSERT INTO matches (player1_id, player2_id, winner_id, score, is_tournament)
//   VALUES (?, ?, ?, ?, ?)
// `).run(player1_id, player2_id, winner_id, "3-2", true);


/*recuperer lhistorique dun joueur*/
// const matches = db.prepare(`
//   SELECT m.*, 
//          u1.username AS player1_name,
//          u2.username AS player2_name,
//          uw.username AS winner_name
//   FROM matches m
//   JOIN users u1 ON m.player1_id = u1.id
//   JOIN users u2 ON m.player2_id = u2.id
//   JOIN users uw ON m.winner_id = uw.id
//   WHERE m.player1_id = ? OR m.player2_id = ?
//   ORDER BY m.played_at DESC
// `).all(userId, userId);




export default db;
