import db from "../db.js";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { MSG } from "../msg.js"

export default async function twoFaRoutes(fastify, options) {
  // ============================================
  // 1️⃣ ACTIVER LA 2FA (générer le QR code)
  // ============================================
  fastify.post(
    "/api/2fa/enable",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.id;

      try {
        // Récupère l'utilisateur
        const user = db.prepare("SELECT * FROM users_public WHERE id = ?").get(userId);

        if (!user) {
          return reply.code(404).send({ error: MSG.USER_NOT_FOUND });
        }

        // Vérifie si 2FA est déjà activé
        if (user.two_fa_enabled) {
          return reply.code(400).send({ error: "2FA déjà activé" });
        }

        // Génère un secret unique pour cet utilisateur
        const secret = authenticator.generateSecret();

        // Crée l'URL pour le QR code
        // Format: otpauth://totp/AppName:username?secret=SECRET&issuer=AppName
        const otpauth = authenticator.keyuri(
          user.username, // Nom de compte
          "FT-Transcendence", // Nom de l'app
          secret, // Le secret
        );

        // Génère le QR code en base64 (image)
        const qrCodeDataURL = await QRCode.toDataURL(otpauth);

        // Sauvegarde le secret en DB (mais pas encore activé)
        db.prepare("UPDATE users SET two_fa_secret = ? WHERE id = ?").run(
          secret,
          userId,
        );

        // Renvoie le QR code au frontend
        return reply.send({
          message: "Scannez ce QR code avec Google Authenticator",
          qrCode: qrCodeDataURL, // Image base64
          secret: secret, // Au cas où l'utilisateur veut entrer manuellement
        });
      } catch (err) {
        console.error(err);
        return reply
          .code(500)
          .send({ error: "Erreur lors de la génération du QR code" });
      }
    },
  );

  // ============================================
  // 2️⃣ VÉRIFIER LE CODE ET ACTIVER LA 2FA
  // ============================================
  fastify.post(
    "/api/2fa/verify",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.id;
      const { token } = request.body; // Le code à 6 chiffres entré par l'utilisateur

      try {
        const user = db.prepare("SELECT * FROM users_public WHERE id = ?").get(userId);

        if (!user || !user.two_fa_secret) {
          return reply.code(400).send({
            error: "Aucun secret 2FA trouvé. Activez d'abord la 2FA.",
          });
        }

        // Vérifie que le code est correct
        const isValid = authenticator.verify({
          token: token,
          secret: user.two_fa_secret,
        });

        if (!isValid) {
          return reply.code(401).send({ error: "Code invalide" });
        }

        // Active la 2FA
        db.prepare("UPDATE users SET two_fa_enabled = 1 WHERE id = ?").run(
          userId,
        );

        return reply.send({ message: "2FA activée avec succès !" });
      } catch (err) {
        console.error(err);
        return reply
          .code(500)
          .send({ error: "Erreur lors de la vérification" });
      }
    },
  );

  // ============================================
  // 3️⃣ DÉSACTIVER LA 2FA
  // ============================================
  fastify.post(
    "/api/2fa/disable",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.id;
      const { token } = request.body;

      try {
        const user = db.prepare("SELECT * FROM users_public WHERE id = ?").get(userId);

        if (!user || !user.two_fa_enabled) {
          return reply.code(400).send({ error: "2FA non activée" });
        }

        // Vérifie le code avant de désactiver (sécurité)
        const isValid = authenticator.verify({
          token: token,
          secret: user.two_fa_secret,
        });

        if (!isValid) {
          return reply.code(401).send({ error: "Code invalide" });
        }

        // Désactive et supprime le secret
        db.prepare(
          "UPDATE users SET two_fa_enabled = 0, two_fa_secret = NULL WHERE id = ?",
        ).run(userId);

        return reply.send({ message: "2FA désactivée" });
      } catch (err) {
        console.error(err);
        return reply
          .code(500)
          .send({ error: "Erreur lors de la désactivation" });
      }
    },
  );

  // ============================================
  // LE STATUT 2FA (PUBLIC - pour le login)
  // ============================================
  fastify.post("/api/2fa/check-status", async (request, reply) => {
    const { username } = request.body;

    if (!username) {
      return reply.code(400).send({ error: "Username requis" });
    }

    try {
      const user = db
        .prepare(
          "SELECT two_fa_enabled FROM users WHERE username = ? OR email = ?",
        )
        .get(username, username);

      if (!user) {
        // Pour la sécurité, on retourne false même si l'user n'existe pas
        return reply.send({
          twoFactorEnabled: false,
          userExists: false,
        });
      }

      return reply.send({
        twoFactorEnabled: Boolean(user.two_fa_enabled),
        userExists: true,
      });
    } catch (err) {
      console.error(err);
      return reply.code(500).send({ error: "Erreur lors de la vérification" });
    }
  });

  // ============================================
  // VÉRIFIER LE STATUT 2FA (PRIVÉ - pour les users connectés)
  // ============================================
  fastify.get(
    "/api/2fa/status",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.id;

      try {
        const user = db
          .prepare("SELECT two_fa_enabled FROM users WHERE id = ?")
          .get(userId);

        if (!user) {
          return reply.code(404).send({ error: "Utilisateur non trouvé" });
        }

        return reply.send({
          twoFactorEnabled: Boolean(user.two_fa_enabled),
          hasBackupCodes: user.backup_codes !== null,
        });
      } catch (err) {
        console.error(err);
        return reply
          .code(500)
          .send({ error: "Erreur lors de la vérification" });
      }
    },
  );
}
