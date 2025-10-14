import { getRouter } from "../router";
import { AuthManager } from "../utils/auth";
import { Header } from "../components/Header";
import { createHeader, HeaderConfigs } from "../components/Header";

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
  }
  matches: Match[];
  level?: number;
  achievements?: string[];
}

interface EditModalConfig {
  id: string;
  title: string;
  label: string;
  placeholder: string;
  fieldName: string;
  apiField: string;
  inputType?: string;
  minLength?: number;
  maxLength?: number;
  validation?: (value: string) => string | null; // Retourne null si valide, message d'erreur sinon
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

export async function ProfilePage(): Promise<void> {
  // Vérifier l'authentification AVANT d'afficher la page
  if (!AuthManager.isAuthenticated()) {
    console.log('Utilisateur non authentifié, redirection vers login');
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
	console.log('Authentification...');
    const response = await AuthManager.fetchWithAuth('/api/me');
    if (response.ok) {
	  console.log('Début de ProfilePage');
      const data = await response.json();
	  userProfile = {
		...data.user,
		stats: data.stats,
		matches: data.matches
      };
	  console.log("✅ Ok, userProfile is set!");
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
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
  const profilePageHtml = `
    <div class="min-h-screen flex flex-col bg-black text-green-400 font-mono">
      ${headerHtml}

      <!-- Main content -->
      <main class="flex-1 p-6">
        <div class="max-w-4xl mx-auto">
          <!-- Profile Header -->
          <div class="mb-8" id="profile-header" style="opacity: 0;">
            <div class="flex items-center space-x-6 bg-gray-900 border border-green-400/30 p-6 rounded">
              <!-- Avatar -->
              <div class="w-24 h-24 rounded-full bg-green-400/20 border-2 border-green-400/50 flex items-center justify-center overflow-hidden">
                ${userProfile?.photo ? 
                  `<img src="${userProfile.photo}" alt="${userProfile.username}" class="w-full h-full object-cover rounded-full" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                   <span class="text-green-400 text-3xl font-bold hidden">${(userProfile?.username || 'U').charAt(0).toUpperCase()}</span>` :
                  `<span class="text-green-400 text-3xl font-bold">${(userProfile?.username || 'U').charAt(0).toUpperCase()}</span>`
                }
              </div>
              
     <!-- User Info -->
              <div class="flex-1">
                <h1 class="text-2xl font-bold text-green-300 mb-2">${userProfile?.username || 'Unknown User'}</h1>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-green-500">User ID:</span> 
                    <span class="text-green-400">#${userProfile?.id || 'N/A'}</span>
                  </div>
                  <div>
                    <span class="text-green-500">Email:</span> 
                    <span class="text-green-400">${userProfile?.email || 'Not provided'}</span>
                  </div>
                  <div>
                    <span class="text-green-500">Level:</span> 
                    <span class="text-green-400">${userProfile?.level || '1'}</span>
                  </div>
                  <div>
                    <span class="text-green-500">Member since:</span> 
                    <span class="text-green-400">${userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Recently'}</span>
                  </div>
                </div>
              </div>
              
              <!-- Edit Button -->
              <div class="flex flex-col space-y-2">
                <button id="change-photo-btn" class="bg-blue-400/10 border border-blue-400/30 px-4 py-2 rounded hover:bg-blue-400/20 transition-colors">
                  <span class="text-blue-400">Change Photo</span>
                </button>
                <input type="file" id="photo-input" accept="image/*" class="hidden" />
              </div>
            </div>
          </div>

          <!-- Stats Section -->
          <div class="grid md:grid-cols-2 gap-6 mb-8">
            <!-- Game Stats -->
            <div class="bg-gray-900 border border-green-400/30 p-6 rounded" id="game-stats" style="opacity: 0;">
              <h2 class="text-green-300 font-bold mb-4 text-xl">[GAME STATISTICS]</h2>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-green-500">Games Played:</span>
                  <span class="text-green-400 font-mono">${userProfile?.stats.totalMatches || '0'}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-green-500">Games Won:</span>
                  <span class="text-green-400 font-mono">${userProfile?.stats.wins || '0'}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-green-500">Win Rate:</span>
                  <span class="text-green-400 font-mono">${userProfile?.stats.totalMatches ? Math.round((userProfile.stats.wins || 0) / userProfile.stats.totalMatches * 100) : 0}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-green-500">Current Level:</span>
                  <span class="text-green-400 font-mono">Level ${userProfile?.level || '1'}</span>
                </div>
              </div>
            </div>

            <!-- Recent Activity -->
            <div class="bg-gray-900 border border-green-400/30 p-6 rounded" id="recent-activity" style="opacity: 0;">
              <h2 class="text-green-300 font-bold mb-4 text-xl">[RECENT ACTIVITY]</h2>
              <div class="space-y-3 text-sm">
                <div class="flex items-center space-x-2">
                  <span class="text-green-500">●</span>
                  <span class="text-green-400">Last login: ${userProfile?.last_login ? new Date(userProfile.last_login).toLocaleString() : 'Now'}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-green-500">●</span>
                  <span class="text-green-400">Profile updated: Recently</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-green-500">●</span>
                  <span class="text-green-400">Tournament participation: Coming soon</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Friends Section -->
          <div class="bg-gray-900 border border-green-400/30 p-6 rounded mb-8" id="achievements" style="opacity: 0;">
            <h2 class="text-green-300 font-bold mb-4 text-xl">[ACHIEVEMENTS]</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-black border border-green-400/20 p-4 rounded">
                <div class="text-green-400 font-bold">First Victory</div>
                <div class="text-green-500 text-sm">Win your first game</div>
              </div>
              <div class="bg-black border border-green-400/20 p-4 rounded opacity-50">
                <div class="text-green-400 font-bold">Speed Demon</div>
                <div class="text-green-500 text-sm">Win 10 games in a row</div>
              </div>
              <div class="bg-black border border-green-400/20 p-4 rounded opacity-50">
                <div class="text-green-400 font-bold">Tournament Champion</div>
                <div class="text-green-500 text-sm">Win a tournament</div>
              </div>
            </div>
          </div>

          <!-- Settings Section -->
          <div class="bg-gray-900 border border-green-400/30 p-6 rounded" id="settings" style="opacity: 0;">
            <h2 class="text-green-300 font-bold mb-4 text-xl">[ACCOUNT SETTINGS]</h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-3 bg-black border border-green-400/20 rounded">
                <div>
                  <div class="text-green-400 font-medium">Change Username</div>
                  <div class="text-green-500 text-sm">Update your account username</div>
                </div>
                <button id="edit-username-btn" class="text-green-300 hover:text-green-400 transition-colors">
                  <span class="text-sm">[EDIT]</span>
                </button>
              </div>

              <div class="flex items-center justify-between p-3 bg-black border border-green-400/20 rounded">
                <div>
                  <div class="text-green-400 font-medium">Change Mail</div>
                  <div class="text-green-500 text-sm">Update your account mail</div>
                </div>
                <button id="edit-mail-btn" class="text-green-300 hover:text-green-400 transition-colors">
                  <span class="text-sm">[EDIT]</span>
                </button>
              </div>

              <div class="flex items-center justify-between p-3 bg-black border border-green-400/20 rounded">
                <div>
                  <div class="text-green-400 font-medium">Change Password</div>
                  <div class="text-green-500 text-sm">Update your account password</div>
                </div>
                <button id="edit-psswd-btn" class="text-green-300 hover:text-green-400 transition-colors">
                  <span class="text-sm">[EDIT]</span>
                </button>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-black border border-green-400/20 rounded">
                <div>
                  <div class="text-green-400 font-medium">Two-Factor Authentication</div>
                  <div class="text-green-500 text-sm">Secure your account with 2FA</div>
                </div>
                <button class="text-green-300 hover:text-green-400 transition-colors">
                  <span class="text-sm">[ENABLE]</span>
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="border-t border-green-400/30 p-4">
        <div class="max-w-6xl mx-auto text-center text-green-500 text-sm">
          <span class="text-green-400">[Profile Page]</span> Transcendence v1.0.0 | User: ${userProfile?.username || 'Unknown'}
        </div>
      </footer>
    </div>
  `;

  // Injecter le HTML
  appDiv.innerHTML = profilePageHtml;

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
  await typeWriter("header-command", "cat user_profile.txt", ANIMATION_SPEED.TYPEWRITER_FAST);
  await new Promise((resolve) => setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT));

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
    "achievements",
    "settings"
  ];

  for (const sectionId of sections) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.opacity = "1";
      section.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
      await new Promise((resolve) => setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT));
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
  }
  
  // Edit username button
  const editUsernameBtn = document.getElementById("edit-username-btn");
  if (editUsernameBtn) {
    editUsernameBtn.addEventListener("click", () => {
      showEditModal({
        id: 'username',
        title: '[EDIT USERNAME]',
        label: 'New Username:',
        placeholder: 'Enter new username',
        fieldName: 'username',
        apiField: 'username',
        minLength: 3,
        maxLength: 20,
        validation: (value) => {
          if (value.length < 3) return 'Username must be at least 3 characters long';
          if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Username can only contain letters, numbers, _ and -';
          return null;
        }
      });
    });
  }
  
  const editMailBtn = document.getElementById("edit-mail-btn");
  if (editMailBtn) {
    editMailBtn.addEventListener("click", () => {
      showEditModal({
        id: 'mail',
        title: '[EDIT MAIL]',
        label: 'New Mail:',
        placeholder: 'Enter new email',
        fieldName: 'mail',
        apiField: 'email',
        inputType: 'email',
        maxLength: 100,
        validation: (value) => {
          if (value.length < 3) return 'Email must be at least 3 characters long';
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
          return null;
        }
      });
    });
  }
  
  const editPasswordBtn = document.getElementById("edit-psswd-btn");
  if (editPasswordBtn) {
    editPasswordBtn.addEventListener("click", () => {
      showEditModal({
        id: 'password',
        title: '[EDIT PASSWORD]',
        label: 'New Password:',
        placeholder: 'Enter new password',
        fieldName: 'password',
        apiField: 'password',
        inputType: 'password',
        minLength: 6,
        maxLength: 50,
        validation: (value) => {
          if (value.length < 6) return 'Password must be at least 6 characters long';
          return null;
        }
      });
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


// Fonction générique pour afficher une modal d'édition
function showEditModal(config: EditModalConfig): void {
  const modalHtml = `
    <div id="edit-${config.id}-modal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div class="bg-gray-900 border border-green-400/30 p-6 rounded max-w-md w-full mx-4">
        <h3 class="text-green-300 font-bold mb-4 text-xl">${config.title}</h3>
        
        <form id="edit-${config.id}-form">
          <div class="mb-4">
            <label class="block text-green-500 text-sm mb-2" for="new-${config.id}">
              ${config.label}
            </label>
            <input 
              type="${config.inputType || 'text'}" 
              id="new-${config.id}" 
              name="${config.fieldName}"
              class="w-full bg-black border border-green-400/30 text-green-400 p-3 rounded focus:border-green-400 focus:outline-none"
              placeholder="${config.placeholder}"
              required
              ${config.minLength ? `minlength="${config.minLength}"` : ''}
              ${config.maxLength ? `maxlength="${config.maxLength}"` : ''}
            />
          </div>
          
          <div id="${config.id}-error" class="text-red-400 text-sm mb-4 hidden"></div>
          
          <div class="flex space-x-4">
            <button 
              type="submit" 
              class="flex-1 bg-green-400/20 border border-green-400/50 text-green-400 py-2 px-4 rounded hover:bg-green-400/30 transition-colors"
            >
              [SAVE]
            </button>
            <button 
              type="button" 
              id="cancel-edit-${config.id}"
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
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Event listeners pour la modal
  const modal = document.getElementById(`edit-${config.id}-modal`);
  const form = document.getElementById(`edit-${config.id}-form`) as HTMLFormElement;
  const cancelBtn = document.getElementById(`cancel-edit-${config.id}`);
  const errorDiv = document.getElementById(`${config.id}-error`);

  // Fermer la modal
  const closeModal = () => {
    modal?.remove();
  };

  // Cancel button
  cancelBtn?.addEventListener('click', closeModal);

  // Fermer en cliquant à l'extérieur
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Fermer avec Escape
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  // Soumission du formulaire
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const newValue = formData.get(config.fieldName) as string;

    // Validation personnalisée
    if (config.validation) {
      const validationError = config.validation(newValue.trim());
      if (validationError) {
        showError(errorDiv, validationError);
        return;
      }
    }

    try {
      // Préparer le body de la requête
      const requestBody = {
        [config.apiField]: newValue.trim()
      };

      // Envoyer la requête au backend
      const response = await AuthManager.fetchWithAuth('/api/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        console.log(`✅ ${config.id} updated successfully`);
        closeModal();
        
        // Recharger la page profil pour afficher les nouvelles données
        const router = getRouter();
        if (router) {
          router.navigate('/profile');
        }
      } else {
        const errorData = await response.json();
        showError(errorDiv, errorData.error || `Failed to update ${config.id}`);
      }
    } catch (error) {
      console.error(`Error updating ${config.id}:`, error);
      showError(errorDiv, 'Network error. Please try again.');
    }
  });

  // Focus sur le champ de saisie
  const input = document.getElementById(`new-${config.id}`) as HTMLInputElement;
  input?.focus();
}

// Fonction helper pour afficher les erreurs
function showError(errorDiv: HTMLElement | null, message: string): void {
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    
    // Cacher l'erreur après 5 secondes
    setTimeout(() => {
      errorDiv.classList.add('hidden');
    }, 5000);
  }
}
