import { getRouter } from "../router";
import { AuthManager } from "../utils/auth";
import { Header } from "../components/Header";
import { createHeader, HeaderConfigs } from "../components/Header";
import { PROFILE_API } from "../utils/apiConfig";
//@ts-ignore -- mon editeur me donnais une erreur alors que npm run build non
import profilePageHtml from "./html/ProfilePage.html?raw";

// Interface pour l'historique des matchs
interface Match {
  id: number;
  player1_id: number;
  player2_id: number;
  winner_id: number;
  player1_score?: number;
  player2_score?: number;
  is_tournament: boolean;
  date: string;
}

// Interface pour les données utilisateur étendues
interface UserProfile {
  id: number;
  username: string;
  email: string;
  photo: string;
  created_at?: string;
  last_login?: string;
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
  };
  matches: Match[];
  level?: number;
  achievements?: string[];
}

// Interface pour les données du profil à éditer
interface EditProfileData {
  username?: string;
  email?: string;
  password?: string;
  currentPassword: string;
}

// Variable globale pour contrôler la vitesse d'écriture des animations
const ANIMATION_SPEED = {
  TYPEWRITER_FAST: 0,
  TYPEWRITER_NORMAL: 15,
  TYPEWRITER_SLOW: 20,
  DELAY_SHORT: 0,
  DELAY_MEDIUM: 100,
  DELAY_LONG: 150,
  TRANSITION_FAST: 0,
  TRANSITION_NORMAL: 0.5,
};

function buildProfileHtml(
  headerHtml: string,
  userProfile: UserProfile | null,
): string {
  let html = profilePageHtml;

  const avatar = userProfile?.photo
    ? `<img src="${userProfile.photo}" alt="${userProfile.username}" class="w-full h-full object-cover rounded-full" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
       <span class="text-green-400 text-3xl font-bold hidden">${(userProfile?.username || "U").charAt(0).toUpperCase()}</span>`
    : `<span class="text-green-400 text-3xl font-bold">${(userProfile?.username || "U").charAt(0).toUpperCase()}</span>`;

  const winRate = userProfile?.stats.totalMatches
    ? Math.round(
        ((userProfile.stats.wins || 0) / userProfile.stats.totalMatches) * 100,
      )
    : 0;

  html = html.replace("{{header}}", headerHtml);
  html = html.replace("{{avatar}}", avatar);
  html = html.replace("{{username}}", userProfile?.username || "Unknown User");
  html = html.replace("{{userId}}", userProfile?.id?.toString() || "N/A");
  html = html.replace("{{email}}", userProfile?.email || "Not provided");
  html = html.replace("{{level}}", userProfile?.level?.toString() || "1");
  html = html.replace(
    "{{memberSince}}",
    userProfile?.created_at
      ? new Date(userProfile.created_at).toLocaleDateString()
      : "Recently",
  );
  html = html.replace(
    "{{totalMatches}}",
    userProfile?.stats.totalMatches?.toString() || "0",
  );
  html = html.replace("{{wins}}", userProfile?.stats.wins?.toString() || "0");
  html = html.replace("{{winRate}}", winRate.toString());
  html = html.replace(
    "{{currentLevel}}",
    userProfile?.level?.toString() || "1",
  );
  html = html.replace(
    "{{lastLogin}}",
    userProfile?.last_login
      ? new Date(userProfile.last_login).toLocaleString()
      : "Now",
  );
  html = html.replace("{{footerUsername}}", userProfile?.username || "Unknown");

  return html;
}

export async function ProfilePage(): Promise<void> {
  // Vérifier l'authentification AVANT d'afficher la page
  if (!AuthManager.isAuthenticated()) {
    console.log("Utilisateur non authentifié, redirection vers login");
    const router = getRouter();
    if (router) {
      router.navigate("/login");
    }
    return;
  }

  const appDiv = document.querySelector<HTMLDivElement>("#app");
  if (!appDiv) return;

  // Récupérer les informations utilisateur depuis le backend
  let userProfile: UserProfile | null = null;
  try {
    console.log("Authentification...");
    const response = await AuthManager.fetchWithAuth(PROFILE_API.GET_ME);
    if (response.ok) {
      console.log("Début de ProfilePage");
      const data = await response.json();
      userProfile = {
        ...data.user,
        stats: data.stats,
        matches: data.matches,
      };
      console.log("✅ Ok, userProfile is set!");
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
  }

  // Classes CSS pour le body
  const body = document.querySelector("body");
  if (body) {
    body.className = "bg-black min-h-screen font-mono text-green-400";
  }

  // Créer le header
  const header = createHeader(HeaderConfigs.profile);
  const headerHtml = await header.render();

  // HTML de la page profil
  const finalHtml = buildProfileHtml(headerHtml, userProfile);
  appDiv.innerHTML = finalHtml;

  // Démarrer les animations
  startProfileAnimations();

  // Setup event listeners
  setupProfileListeners();

  // Ajouter les event listeners du header
  Header.setupEventListeners();
}

// Animation typewriter
async function typeWriter(
  elementId: string,
  text: string,
  speed: number = ANIMATION_SPEED.TYPEWRITER_FAST,
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = "";

  for (let i = 0; i < text.length; i++) {
    element.textContent += text.charAt(i);
    await new Promise((resolve) => setTimeout(resolve, speed));
  }
}

// Animations de la page profil
async function startProfileAnimations(): Promise<void> {
  // 1. Header command
  await typeWriter(
    "header-command",
    "cat user_profile.txt",
    ANIMATION_SPEED.TYPEWRITER_FAST,
  );
  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

  // 2. Cacher le curseur et afficher le menu nav
  const headerCursor = document.getElementById("header-cursor");
  const navMenu = document.getElementById("nav-menu");

  if (headerCursor) headerCursor.style.display = "none";
  if (navMenu) {
    navMenu.style.opacity = "1";
    navMenu.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }

  // 3. Afficher les sections une par une
  const sections = [
    "profile-header",
    "game-stats",
    "recent-activity",
    "settings",
  ];

  for (const sectionId of sections) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.opacity = "1";
      section.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
      await new Promise((resolve) =>
        setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
      );
    }
  }
}

// La navigation est gérée par le routeur
// Le logout est géré par le Header

function setupProfileListeners(): void {
  const editPhotoBtn = document.getElementById("change-photo-btn");
  const photoInput = document.getElementById("photo-input") as HTMLInputElement;

  if (editPhotoBtn && photoInput) {
    editPhotoBtn.addEventListener("click", () => {
      photoInput.click(); // Ouvrir le sélecteur de fichier
    });

    // Gérer l'upload de photo
    photoInput.addEventListener("change", async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        await handlePhotoUpload(file);
      }
    });
  }

  // Edit profile button
  const editProfileBtn = document.getElementById("edit-profile-btn");
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      showEditProfileModal();
    });
  }

  // Settings buttons
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;

    if (target.textContent?.includes("[ENABLE]")) {
      console.log("Enable 2FA clicked");
      // TODO: Implémenter l'activation 2FA
    }
  });
}

// Modal pour éditer le profil complet
function showEditProfileModal(): void {
  const modalHtml = `
    <div id="edit-profile-modal" class="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
      <div class="bg-gray-900 border border-green-400/30 p-6 rounded max-w-md w-full mx-4">
        <h3 class="text-green-300 font-bold mb-4 text-xl">[EDIT PROFILE]</h3>

        <form id="edit-profile-form">
          <!-- Username -->
          <div class="mb-4">
            <label class="block text-green-500 text-sm mb-2" for="new-username">
              Username (optional):
            </label>
            <input
              type="text"
              id="new-username"
              name="username"
              class="w-full bg-black border border-green-400/30 text-green-400 p-3 rounded focus:border-green-400 focus:outline-none"
              placeholder="Leave empty to keep current username"
              minlength="3"
              maxlength="20"
            />
          </div>

          <!-- Email -->
          <div class="mb-4">
            <label class="block text-green-500 text-sm mb-2" for="new-email">
              Email (optional):
            </label>
            <input
              type="email"
              id="new-email"
              name="email"
              class="w-full bg-black border border-green-400/30 text-green-400 p-3 rounded focus:border-green-400 focus:outline-none"
              placeholder="Leave empty to keep current email"
              maxlength="100"
            />
          </div>

          <!-- New Password -->
          <div class="mb-4">
            <label class="block text-green-500 text-sm mb-2" for="new-password">
              New Password (optional):
            </label>
            <input
              type="password"
              id="new-password"
              name="password"
              class="w-full bg-black border border-green-400/30 text-green-400 p-3 rounded focus:border-green-400 focus:outline-none"
              placeholder="Leave empty to keep current password"
              minlength="6"
            />
          </div>

          <!-- Confirm New Password -->
          <div class="mb-4" id="confirm-password-section" style="display: none;">
            <label class="block text-green-500 text-sm mb-2" for="confirm-password">
              Confirm New Password:
            </label>
            <input
              type="password"
              id="confirm-password"
              name="confirmPassword"
              class="w-full bg-black border border-green-400/30 text-green-400 p-3 rounded focus:border-green-400 focus:outline-none"
              placeholder="Confirm your new password"
            />
          </div>

          <!-- Current Password (required for validation) -->
          <div class="mb-4">
            <label class="block text-green-500 text-sm mb-2" for="current-password">
              Current Password <span class="text-red-400">*</span>:
            </label>
            <input
              type="password"
              id="current-password"
              name="currentPassword"
              class="w-full bg-black border border-green-400/30 text-green-400 p-3 rounded focus:border-green-400 focus:outline-none"
              placeholder="Enter your current password to confirm changes"
              required
            />
          </div>

          <div id="profile-error" class="text-red-400 text-sm mb-4 hidden"></div>

          <div class="flex space-x-4">
            <button
              type="submit"
              class="flex-1 bg-green-400/20 border border-green-400/50 text-green-400 py-2 px-4 rounded hover:bg-green-400/30 transition-colors"
            >
              [SAVE CHANGES]
            </button>
            <button
              type="button"
              id="cancel-edit-profile"
              class="flex-1 bg-red-400/20 border border-red-400/50 text-red-400 py-2 px-4 rounded hover:bg-red-400/30 transition-colors"
            >
              [CANCEL]
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Ajouter la modal au DOM
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Event listeners pour la modal
  const modal = document.getElementById("edit-profile-modal");
  const form = document.getElementById("edit-profile-form") as HTMLFormElement;
  const cancelBtn = document.getElementById("cancel-edit-profile");
  const errorDiv = document.getElementById("profile-error");
  const newPasswordInput = document.getElementById(
    "new-password",
  ) as HTMLInputElement;
  const confirmPasswordSection = document.getElementById(
    "confirm-password-section",
  );

  // Afficher/masquer la confirmation du mot de passe
  newPasswordInput?.addEventListener("input", () => {
    if (newPasswordInput.value.trim() !== "") {
      confirmPasswordSection!.style.display = "block";
      const confirmPasswordInput = document.getElementById(
        "confirm-password",
      ) as HTMLInputElement;
      confirmPasswordInput.required = true;
    } else {
      confirmPasswordSection!.style.display = "none";
      const confirmPasswordInput = document.getElementById(
        "confirm-password",
      ) as HTMLInputElement;
      confirmPasswordInput.required = false;
      confirmPasswordInput.value = "";
    }
  });

  // Fermer la modal
  const closeModal = () => {
    modal?.remove();
  };

  // Cancel button
  cancelBtn?.addEventListener("click", closeModal);

  // Fermer en cliquant à l'extérieur
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Fermer avec Escape
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", handleEscape);
    }
  };
  document.addEventListener("keydown", handleEscape);

  // Soumission du formulaire
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const currentPassword = formData.get("currentPassword") as string;
    // Validation côté client
    if (!currentPassword.trim()) {
      showError(errorDiv, "Current password is required");
      return;
    }

    // Vérifier que les champs ne sont pas vides s'ils sont remplis
    if (username && username.trim().length < 3) {
      showError(errorDiv, "Username must be at least 3 characters long");
      return;
    }

    if (username && !/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
      showError(
        errorDiv,
        "Username can only contain letters, numbers, _ and -",
      );
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showError(errorDiv, "Please enter a valid email address");
      return;
    }

    if (password && password.length < 6) {
      showError(errorDiv, "New password must be at least 6 characters long");
      return;
    }

    if (password && password !== confirmPassword) {
      showError(errorDiv, "New passwords do not match");
      return;
    }

    // Vérifier qu'au moins un champ est modifié
    if (!username?.trim() && !email?.trim() && !password?.trim()) {
      showError(errorDiv, "Please provide at least one field to update");
      return;
    }

    try {
      // Préparer le body de la requête
      const requestBody: EditProfileData = {
        currentPassword: currentPassword.trim(),
      };

      if (username?.trim()) requestBody.username = username.trim();
      if (email?.trim()) requestBody.email = email.trim();
      if (password?.trim()) requestBody.password = password.trim();

      // Envoyer la requête au backend
      const response = await AuthManager.fetchWithAuth(PROFILE_API.UPDATE_ME, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        console.log("✅ Profile updated successfully");
        closeModal();

        // Recharger la page profil pour afficher les nouvelles données
        const router = getRouter();
        if (router) {
          router.navigate("/profile");
        }
      } else {
        const errorData = await response.json();
        showError(errorDiv, errorData.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showError(errorDiv, "Network error. Please try again.");
    }
  });

  // Focus sur le premier champ
  const usernameInput = document.getElementById(
    "new-username",
  ) as HTMLInputElement;
  usernameInput?.focus();
}

// fonction pour gérer l'upload de photo
async function handlePhotoUpload(file: File): Promise<void> {
  // Validation du fichier
  if (!file.type.startsWith("image/")) {
    showMessage("Error: Please select a valid image file", "error");
    return;
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    showMessage("Error: Image must be less than 5MB", "error");
    return;
  }

  try {
    showMessage(`Uploading photo: ${file.name}...`, "info");

    // Créer FormData pour l'upload (comme dans Register)
    const formData = new FormData();
    formData.append("profilePhoto", file);

    const response = await AuthManager.fetchWithAuth(
      PROFILE_API.UPDATE_AVATAR,
      {
        method: "PATCH",
        body: formData, // Pas de Content-Type header, le navigateur le définit automatiquement
      },
    );

    if (response.ok) {
      showMessage("✅ Photo updated successfully", "success");

      // Recharger la page pour voir la nouvelle photo
      setTimeout(() => {
        const router = getRouter();
        if (router) {
          router.navigate("/profile");
        }
      }, 1000);
    } else {
      const errorData = await response.json();
      showMessage(
        `Upload failed: ${errorData.error || "Unknown error"}`,
        "error",
      );
    }
  } catch (error) {
    console.error("Error uploading photo:", error);
    showMessage("Network error. Please try again.", "error");
  } finally {
    // Reset file input
    const photoInput = document.getElementById(
      "photo-input",
    ) as HTMLInputElement;
    if (photoInput) photoInput.value = "";
  }
}

// Fonction pour afficher les messages (comme dans Register)
function showMessage(
  message: string,
  type: "success" | "error" | "info",
): void {
  // Créer un container de messages s'il n'existe pas
  let messagesContainer = document.getElementById("profile-messages");
  if (!messagesContainer) {
    messagesContainer = document.createElement("div");
    messagesContainer.id = "profile-messages";
    messagesContainer.className = "fixed top-4 right-4 z-50 space-y-2";
    document.body.appendChild(messagesContainer);
  }

  const messageDiv = document.createElement("div");
  messageDiv.className = `p-3 border-l-4 max-w-sm bg-gray-900 border border-green-400/30 ${
    type === "success"
      ? "border-l-green-400 text-green-300"
      : type === "error"
        ? "border-l-red-400 text-red-300"
        : "border-l-blue-400 text-blue-300"
  }`;

  const prefix =
    type === "success" ? "[SUCCESS]" : type === "error" ? "[ERROR]" : "[INFO]";
  messageDiv.innerHTML = `<span class="font-bold">${prefix}</span> ${message}`;

  messagesContainer.appendChild(messageDiv);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.remove();
    }
    // Remove container if empty
    if (messagesContainer && messagesContainer.children.length === 0) {
      messagesContainer.remove();
    }
  }, 5000);
}

// Fonction helper pour afficher les erreurs
function showError(errorDiv: HTMLElement | null, message: string): void {
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove("hidden");

    // Cacher l'erreur après 5 secondes
    setTimeout(() => {
      errorDiv.classList.add("hidden");
    }, 5000);
  }
}
