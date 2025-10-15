
// ====================================================================================
// Fichier de Configuration des Points d'Accès de l'API
// ====================================================================================
// Ce fichier centralise tous les points d'accès (endpoints) de l'API backend.
// Modifiez les valeurs ici pour qu'elles correspondent à votre configuration backend.
// ====================================================================================

const API_BASE_URL = '/api';

// ------------------------------------------------------------------------------------
// AUTHENTIFICATION
// ------------------------------------------------------------------------------------
// Points d'accès liés à l'enregistrement, la connexion et la gestion des sessions.
// ------------------------------------------------------------------------------------
export const AUTH_API = {
  /**
   * @method POST
   * @description Enregistre un nouvel utilisateur.
   * @body { username, email, password, profilePhoto? }
   */
  REGISTER: `${API_BASE_URL}/register`,

  /**
   * @method POST
   * @description Connecte un utilisateur.
   * @body { username, password }
   * @returns { token, user }
   */
  LOGIN: `${API_BASE_URL}/login`,

  /**
   * @method POST
   * @description Valide le token d'authentification actuel.
   * @headers { Authorization: 'Bearer <token>' }
   */
  VALIDATE_TOKEN: `${API_BASE_URL}/validate-token`,
};


// ------------------------------------------------------------------------------------
// GESTION DU PROFIL UTILISATEUR (Connecté)
// ------------------------------------------------------------------------------------
// Points d'accès pour que l'utilisateur connecté gère son propre profil.
// ------------------------------------------------------------------------------------
export const PROFILE_API = {
  /**
   * @method GET
   * @description Récupère les informations du profil de l'utilisateur connecté (moi).
   * @returns { user, stats, matches }
   */
  GET_ME: `${API_BASE_URL}/me`,

  /**
   * @method PATCH
   * @description Met à jour les informations du profil de l'utilisateur connecté.
   * @body { username?, email?, password?, currentPassword }
   */
  UPDATE_ME: `${API_BASE_URL}/me`,

  /**
   * @method PATCH
   * @description Met à jour l'avatar de l'utilisateur connecté.
   * @body FormData { profilePhoto }
   */
  UPDATE_AVATAR: `${API_BASE_URL}/me/avatar`,
};


// ------------------------------------------------------------------------------------
// GESTION DES UTILISATEURS (Admin & Recherche)
// ------------------------------------------------------------------------------------
// Points d'accès pour lister, créer, et gérer les utilisateurs.
// ------------------------------------------------------------------------------------
export const USERS_API = {
  /**
   * @method GET
   * @description Récupère la liste de tous les utilisateurs.
   */
  GET_ALL: `${API_BASE_URL}/users`,

  /**
   * @method POST
   * @description Crée un nouvel utilisateur (typiquement pour les admins).
   * @body { username, email, password, role? }
   */
  CREATE: `${API_BASE_URL}/users`,

  /**
   * @method PUT
   * @description Met à jour un utilisateur spécifique par son ID.
   * @param id - L'ID de l'utilisateur à modifier.
   */
  UPDATE: (id: number) => `${API_BASE_URL}/users/${id}`,

  /**
   * @method DELETE
   * @description Supprime un utilisateur spécifique par son ID.
   * @param id - L'ID de l'utilisateur à supprimer.
   */
  DELETE: (id: number) => `${API_BASE_URL}/users/${id}`,
};


// ------------------------------------------------------------------------------------
// GESTION DES AMIS
// ------------------------------------------------------------------------------------
// Points d'accès pour la gestion de la liste d'amis.
// ------------------------------------------------------------------------------------
export const FRIENDS_API = {
  /**
   * @method GET
   * @description Récupère la liste d'amis de l'utilisateur connecté.
   */
  GET_ALL: `${API_BASE_URL}/friends`,

  /**
   * @method POST
   * @description Ajoute un ami.
   * @body { friendId }
   */
  ADD: `${API_BASE_URL}/friends`,

  /**
   * @method DELETE
   * @description Supprime un ami par son ID.
   * @param id - L'ID de l'ami à supprimer.
   */
  DELETE: (id: number) => `${API_BASE_URL}/friends/${id}`,
};
