import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import "dotenv/config";
import { MSG } from "./msg.js";

// crée ou ouvre le fichier database.db
const db = new Database("/data/database.db");

/*****************************************************************/
/*                                                               */
/*                 TABLE USERS                                   */
/*                                                               */
/*****************************************************************/

// crée la table users si elle n'existe pas
// on refuse les doublons de username et de email
db.prepare(
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    photo TEXT DEFAULT './uploads/avatar.png',
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0)`,
).run();

// insère les 3 admins
try {
  const hashed1 = await bcrypt.hash(process.env.MDP1, 10);
  const hashed2 = await bcrypt.hash(process.env.MDP2, 10);
  const hashed3 = await bcrypt.hash(process.env.MDP3, 10);
  db.prepare(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
  ).run("kimnguye", "kimnguye@42.fr", hashed1);
  db.prepare(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
  ).run("kduroux", "kduroux@42.fr", hashed2);
  db.prepare(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
  ).run("hgirard", "hgirard@42.fr", hashed3);
} catch (err) {
  if (err.code == "SQLITE_CONSTRAINT_UNIQUE") {
    console.log("Username or email already exists");
  } else {
    console.log(MSG.INTERNAL_SERVER_ERROR);
  }
}

/* AJOUT COLONNE ROLE */

let columnExists = db
  .prepare("PRAGMA table_info(users)")
  .all()
  .some((col) => col.name === "role");

if (!columnExists) {
  db.prepare(
    "ALTER TABLE users ADD COLUMN role TEXT CHECK(role IN ('admin', 'user')) DEFAULT 'user'",
  ).run();
  console.log("✅ Colonne 'role' ajoutée !");
} else {
  console.log("ℹ️ La colonne 'role' existe déjà");
}

// mise a jour pour les utilisateurs deja existants
const admins = ["kimnguye", "kduroux", "hgirard"];
const placeholders = admins.map(() => "?").join(", ");
db.prepare(
  `UPDATE users SET role = 'admin' WHERE username IN (${placeholders})`,
).run(...admins);
db.prepare(`UPDATE users SET role = 'user' WHERE role IS NULL`).run();

/* AJOUT COLONNE 2FA */
const twoFaSecretExists = db
  .prepare("PRAGMA table_info(users)")
  .all()
  .some((col) => col.name === "two_fa_secret");
const twoFaEnabledExists = db
  .prepare("PRAGMA table_info(users)")
  .all()
  .some((col) => col.name === "two_fa_enabled");

if (!twoFaSecretExists) {
  db.prepare("ALTER TABLE users ADD COLUMN two_fa_secret TEXT").run();
  console.log("Colonne 'two_fa_secret' ajoutée !");
} else {
  console.log(" La colonne 'two_fa_secret' existe déjà.");
}

if (!twoFaEnabledExists) {
  db.prepare(
    "ALTER TABLE users ADD COLUMN two_fa_enabled BOOLEAN DEFAULT 0",
  ).run();
  console.log("Colonne 'two_fa_enabled' ajoutée !");
} else {
  console.log("La colonne 'two_fa_enabled' existe déjà.");
}

/* AJOUT COLONNE STATUS */

columnExists = db
  .prepare("PRAGMA table_info(users)")
  .all()
  .some((col) => col.name === "status");
if (!columnExists) {
  db.prepare(
    `ALTER TABLE users ADD COLUMN status INTEGER DEFAULT 0 CHECK(status IN (0,1,2))`,
  ).run();
  console.log("✅ Colonne 'status' ajoutée !");
} else {
  console.log("ℹ️ La colonne 'status' existe déjà");
}

// mise a jour pour les utilisateurs deja existants
db.prepare(`UPDATE users SET status = 0 WHERE status IS NULL`).run();

// lit les données et les affiche sur la console
const rows = db.prepare("SELECT * FROM users").all();
console.log(rows);

/*****************************************************************/
/*                                                               */
/*                 TABLE MATCHES                                 */
/*                                                               */
/*****************************************************************/

// crée la table si elle n'existe pas
db.prepare(
  `CREATE TABLE IF NOT EXISTS matches (
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
	)`,
).run();

/*****************************************************************/
/*                                                               */
/*                 TABLE FRIENDS                                 */
/*                                                               */
/*****************************************************************/

// crée la table si elle n'existe pas
db.prepare(
  `CREATE TABLE IF NOT EXISTS friends (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL,
	friend_id INTEGER NOT NULL,
 	status TEXT DEFAULT 'pending',
	FOREIGN KEY (user_id) REFERENCES users(id),
	FOREIGN KEY (friend_id) REFERENCES users(id),
  	UNIQUE(user_id, friend_id) -- interdire les doublons
	)`,
).run();

export default db;
