import { getRouter } from "../router";
import { AuthManager } from "../utils/auth";
import { createHeader, HeaderConfigs } from "../components/Header";
import { Header } from "../components/Header";

// Interface pour les données utilisateur
interface User {
  id: number;
  username: string;
  email: string;
  photo?: string;
  created_at?: string;
  last_login?: string;
  role?: string;
  status?: 'online' | 'offline' | 'in_game';
}

// Interface pour créer/modifier un utilisateur
interface UserFormData {
  username: string;
  email: string;
  password?: string;
  role?: string;
}

export async function UsersPage(): Promise<void> {
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

  // Classes CSS pour le body
  const body = document.querySelector("body");
  if (body) {
    body.className = "bg-black min-h-screen font-mono text-green-400";
  }

  // Créer le header
  const header = createHeader(HeaderConfigs.users);
  const headerHtml = await header.render();

  // HTML de la page des utilisateurs
  const usersPageHtml = `
    <div class="min-h-screen flex flex-col bg-black text-green-400 font-mono">
      ${headerHtml}

      <!-- Main content -->
      <main class="flex-1 p-6">
        <div class="max-w-6xl mx-auto">
          <!-- Page title -->
          <div class="mb-6">
            <h1 class="text-2xl text-green-300 mb-2">[USER MANAGEMENT SYSTEM]</h1>
            <p class="text-green-500">Administration des utilisateurs du système Transcendence</p>
          </div>

          <!-- Loading state -->
          <div id="loading-state" class="text-center py-8">
            <div class="text-green-400">
              <div class="animate-pulse">Chargement des données utilisateurs...</div>
              <div class="mt-2 text-green-500 text-sm">$ SELECT * FROM users;</div>
            </div>
          </div>

          <!-- Error state -->
          <div id="error-state" class="hidden bg-red-900/20 border border-red-500/30 p-4 mb-6">
            <div class="text-red-400 font-bold">[ERROR]</div>
            <div id="error-message" class="text-red-300 text-sm mt-1"></div>
          </div>

          <!-- Controls -->
          <div id="controls-section" class="hidden mb-6">
            <div class="flex flex-wrap gap-4 items-center justify-between">
              <div class="flex gap-4">
                <button id="add-user-btn" class="bg-green-900/30 border border-green-400/50 px-4 py-2 hover:bg-green-400/10 transition-colors">
                  <span class="text-green-300">+ Nouveau utilisateur</span>
                </button>
                <button id="refresh-btn" class="bg-gray-900 border border-green-400/30 px-4 py-2 hover:bg-green-400/10 transition-colors">
                  <span class="text-green-400">Actualiser</span>
                </button>
              </div>
              
              <div class="flex gap-4 items-center">
                <span class="text-green-500 text-sm">Filtrer:</span>
                <select id="status-filter" class="bg-gray-900 border border-green-400/30 px-3 py-1 text-green-400">
                  <option value="">Tous les statuts</option>
                  <option value="online">En ligne</option>
                  <option value="offline">Hors ligne</option>
                  <option value="in_game">En jeu</option>
                </select>
                <input 
                  type="text" 
                  id="search-input" 
                  placeholder="Rechercher par nom..."
                  class="bg-gray-900 border border-green-400/30 px-3 py-1 text-green-400 placeholder-green-500/50"
                />
              </div>
            </div>
          </div>

          <!-- Users table -->
          <div id="users-section" class="hidden">
            <div class="bg-gray-900 border border-green-400/30 overflow-hidden">
              <!-- Table header -->
              <div class="bg-green-400/10 border-b border-green-400/30 p-4">
                <div class="grid grid-cols-6 gap-4 text-green-300 font-bold text-sm">
                  <div>ID</div>
                  <div>UTILISATEUR</div>
                  <div>EMAIL</div>
                  <div>STATUT</div>
                  <div>DERNIÈRE CONNEXION</div>
                  <div class="text-center">ACTIONS</div>
                </div>
              </div>
              
              <!-- Table body -->
              <div id="users-list" class="divide-y divide-green-400/10">
                <!-- Users will be populated here -->
              </div>
            </div>
            
            <!-- Stats -->
            <div id="users-stats" class="mt-4 grid grid-cols-4 gap-4">
              <div class="bg-gray-900 border border-green-400/30 p-3 text-center">
                <div class="text-green-300 font-bold" id="total-users">0</div>
                <div class="text-green-500 text-sm">Total utilisateurs</div>
              </div>
              <div class="bg-gray-900 border border-green-400/30 p-3 text-center">
                <div class="text-green-300 font-bold" id="online-users">0</div>
                <div class="text-green-500 text-sm">En ligne</div>
              </div>
              <div class="bg-gray-900 border border-green-400/30 p-3 text-center">
                <div class="text-green-300 font-bold" id="offline-users">0</div>
                <div class="text-green-500 text-sm">Hors ligne</div>
              </div>
              <div class="bg-gray-900 border border-green-400/30 p-3 text-center">
                <div class="text-green-300 font-bold" id="ingame-users">0</div>
                <div class="text-green-500 text-sm">En jeu</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- User Modal -->
      <div id="user-modal" class="hidden fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div class="bg-gray-900 border border-green-400/30 p-6 w-full max-w-md mx-4">
          <div class="flex justify-between items-center mb-4">
            <h3 id="modal-title" class="text-green-300 font-bold"></h3>
            <button id="close-modal" class="text-green-500 hover:text-green-300">✕</button>
          </div>
          
          <form id="user-form" class="space-y-4">
            <div>
              <label class="block text-green-500 text-sm mb-1">Nom d'utilisateur</label>
              <input 
                type="text" 
                id="form-username" 
                required 
                class="w-full bg-black border border-green-400/30 px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none"
              />
            </div>
            
            <div>
              <label class="block text-green-500 text-sm mb-1">Email</label>
              <input 
                type="email" 
                id="form-email" 
                required 
                class="w-full bg-black border border-green-400/30 px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none"
              />
            </div>
            
            <div id="password-field">
              <label class="block text-green-500 text-sm mb-1">Mot de passe</label>
              <input 
                type="password" 
                id="form-password" 
                class="w-full bg-black border border-green-400/30 px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none"
              />
              <div class="text-green-500/70 text-xs mt-1" id="password-hint">Laisser vide pour ne pas changer</div>
            </div>
            
            <div>
              <label class="block text-green-500 text-sm mb-1">Rôle</label>
              <select 
                id="form-role" 
                class="w-full bg-black border border-green-400/30 px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none"
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
            
            <div class="flex gap-3 pt-4">
              <button 
                type="submit" 
                class="flex-1 bg-green-900/30 border border-green-400/50 py-2 text-green-300 hover:bg-green-400/10 transition-colors"
              >
                <span id="submit-text">Enregistrer</span>
              </button>
              <button 
                type="button" 
                id="cancel-modal" 
                class="flex-1 bg-gray-800 border border-gray-600 py-2 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Footer -->
      <footer class="border-t border-green-400/30 p-4">
        <div class="max-w-6xl mx-auto text-center text-green-500 text-sm">
          <span class="text-green-400">[Users Management]</span> Transcendence Admin Panel v1.0.0
        </div>
      </footer>
    </div>
  `;

  // Injecter le HTML dans le conteneur
  appDiv.innerHTML = usersPageHtml;

  // Initialiser la page
  await initializeUsersPage();

  // Ajouter les event listeners
  setupEventListeners();
}

// Variables globales pour la gestion des utilisateurs
let allUsers: User[] = [];
let filteredUsers: User[] = [];
let currentEditingUser: User | null = null;

async function initializeUsersPage(): Promise<void> {
  await loadUsers();
}

async function loadUsers(): Promise<void> {
  const loadingState = document.getElementById("loading-state");
  const errorState = document.getElementById("error-state");
  const controlsSection = document.getElementById("controls-section");
  const usersSection = document.getElementById("users-section");

  try {
    // Afficher l'état de chargement
    if (loadingState) loadingState.classList.remove("hidden");
    if (errorState) errorState.classList.add("hidden");

    // Récupérer les utilisateurs depuis l'API
    const response = await AuthManager.fetchWithAuth('/api/users');
    
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    const users: User[] = await response.json();
    allUsers = users;
    filteredUsers = [...users];

    // Masquer le chargement et afficher le contenu
    if (loadingState) loadingState.classList.add("hidden");
    if (controlsSection) controlsSection.classList.remove("hidden");
    if (usersSection) usersSection.classList.remove("hidden");

    // Afficher les utilisateurs
    displayUsers();
    updateStats();

  } catch (error) {
    console.error('Erreur lors du chargement des utilisateurs:', error);
    
    // Afficher l'erreur
    if (loadingState) loadingState.classList.add("hidden");
    if (errorState) {
      errorState.classList.remove("hidden");
      const errorMessage = document.getElementById("error-message");
      if (errorMessage) {
        errorMessage.textContent = error instanceof Error ? error.message : 'Erreur inconnue';
      }
    }
  }
}

function displayUsers(): void {
  const usersList = document.getElementById("users-list");
  if (!usersList) return;

  if (filteredUsers.length === 0) {
    usersList.innerHTML = `
      <div class="p-8 text-center text-green-500">
        Aucun utilisateur trouvé
      </div>
    `;
    return;
  }

  usersList.innerHTML = filteredUsers.map(user => `
    <div class="grid grid-cols-6 gap-4 p-4 hover:bg-green-400/5 transition-colors items-center">
      <div class="text-green-400 font-mono">#${user.id}</div>
      
      <div class="flex items-center space-x-3">
                <div class="w-8 h-8 rounded-full bg-green-400/20 border border-green-400/50 flex items-center justify-center overflow-hidden">
                  ${user?.photo ? 
                    `<img src="${user.photo}" alt="${user.username}" class="w-full h-full object-cover rounded-full" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                     <span class="text-green-400 text-sm font-bold hidden">${(user?.username || 'U').charAt(0).toUpperCase()}</span>` :
                    `<span class="text-green-400 text-sm font-bold">${(user?.username || 'U').charAt(0).toUpperCase()}</span>`
                  }
                </div>
        <span class="text-green-300 font-medium">${user.username}</span>
      </div>
      
      <div class="text-green-400 text-sm font-mono">${user.email}</div>
      
      <div>
        <span class="px-2 py-1 text-xs rounded ${getStatusColor(user.status || 'offline')}">
          ${getStatusText(user.status || 'offline')}
        </span>
      </div>
      
      <div class="text-green-500 text-sm">
        ${user.last_login ? formatDate(user.last_login) : 'Jamais'}
      </div>
      
      <div class="flex space-x-2 justify-center">
        <button 
          onclick="editUser(${user.id})" 
          class="px-3 py-1 bg-blue-900/30 border border-blue-400/50 text-blue-300 text-sm hover:bg-blue-400/10 transition-colors"
        >
          Modifier
        </button>
        <button 
          onclick="deleteUser(${user.id})" 
          class="px-3 py-1 bg-red-900/30 border border-red-400/50 text-red-300 text-sm hover:bg-red-400/10 transition-colors"
        >
          Supprimer
        </button>
      </div>
    </div>
  `).join('');
}

function updateStats(): void {
  const totalUsers = document.getElementById("total-users");
  const onlineUsers = document.getElementById("online-users");
  const offlineUsers = document.getElementById("offline-users");
  const ingameUsers = document.getElementById("ingame-users");

  const stats = {
    total: allUsers.length,
    online: allUsers.filter(u => u.status === 'online').length,
    offline: allUsers.filter(u => u.status === 'offline').length,
    ingame: allUsers.filter(u => u.status === 'in_game').length,
  };

  if (totalUsers) totalUsers.textContent = stats.total.toString();
  if (onlineUsers) onlineUsers.textContent = stats.online.toString();
  if (offlineUsers) offlineUsers.textContent = stats.offline.toString();
  if (ingameUsers) ingameUsers.textContent = stats.ingame.toString();
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'online': return 'bg-green-900/30 border border-green-400/50 text-green-300';
    case 'in_game': return 'bg-yellow-900/30 border border-yellow-400/50 text-yellow-300';
    case 'offline':
    default: return 'bg-gray-700/30 border border-gray-500/50 text-gray-300';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'online': return 'En ligne';
    case 'in_game': return 'En jeu';
    case 'offline':
    default: return 'Hors ligne';
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function filterUsers(): void {
  const statusFilter = (document.getElementById("status-filter") as HTMLSelectElement)?.value || '';
  const searchInput = (document.getElementById("search-input") as HTMLInputElement)?.value.toLowerCase() || '';

  filteredUsers = allUsers.filter(user => {
    const matchesStatus = !statusFilter || user.status === statusFilter;
    const matchesSearch = !searchInput || 
      user.username.toLowerCase().includes(searchInput) ||
      user.email.toLowerCase().includes(searchInput);
    
    return matchesStatus && matchesSearch;
  });

  displayUsers();
}

function setupEventListeners(): void {
  // Importer les event listeners du header
  Header.setupEventListeners();

  // Controls
  const addUserBtn = document.getElementById("add-user-btn");
  const refreshBtn = document.getElementById("refresh-btn");
  const statusFilter = document.getElementById("status-filter");
  const searchInput = document.getElementById("search-input");

  if (addUserBtn) {
    addUserBtn.addEventListener("click", () => openUserModal());
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => loadUsers());
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", filterUsers);
  }

  if (searchInput) {
    searchInput.addEventListener("input", filterUsers);
  }

  // Modal
  const closeModal = document.getElementById("close-modal");
  const cancelModal = document.getElementById("cancel-modal");
  const userForm = document.getElementById("user-form");

  if (closeModal) {
    closeModal.addEventListener("click", closeUserModal);
  }

  if (cancelModal) {
    cancelModal.addEventListener("click", closeUserModal);
  }

  if (userForm) {
    userForm.addEventListener("submit", handleUserSubmit);
  }

  // Rendre les fonctions globales pour les boutons inline
  (window as any).editUser = editUser;
  (window as any).deleteUser = deleteUser;
}

function openUserModal(user?: User): void {
  const modal = document.getElementById("user-modal");
  const modalTitle = document.getElementById("modal-title");
  const submitText = document.getElementById("submit-text");
  const passwordHint = document.getElementById("password-hint");

  if (!modal) return;

  currentEditingUser = user || null;

  // Configuration du modal selon le mode (ajout/modification)
  if (user) {
    // Mode modification
    if (modalTitle) modalTitle.textContent = `Modifier l'utilisateur: ${user.username}`;
    if (submitText) submitText.textContent = "Mettre à jour";
    if (passwordHint) passwordHint.style.display = "block";
    
    // Préremplir les champs
    (document.getElementById("form-username") as HTMLInputElement).value = user.username;
    (document.getElementById("form-email") as HTMLInputElement).value = user.email;
    (document.getElementById("form-password") as HTMLInputElement).value = "";
    (document.getElementById("form-role") as HTMLSelectElement).value = user.role || "user";
  } else {
    // Mode ajout
    if (modalTitle) modalTitle.textContent = "Ajouter un nouvel utilisateur";
    if (submitText) submitText.textContent = "Créer";
    if (passwordHint) passwordHint.style.display = "none";
    
    // Vider les champs
    (document.getElementById("form-username") as HTMLInputElement).value = "";
    (document.getElementById("form-email") as HTMLInputElement).value = "";
    (document.getElementById("form-password") as HTMLInputElement).value = "";
    (document.getElementById("form-password") as HTMLInputElement).required = true;
    (document.getElementById("form-role") as HTMLSelectElement).value = "user";
  }

  modal.classList.remove("hidden");
}

function closeUserModal(): void {
  const modal = document.getElementById("user-modal");
  if (modal) {
    modal.classList.add("hidden");
  }
  currentEditingUser = null;
}

async function handleUserSubmit(event: Event): Promise<void> {
  event.preventDefault();

  const formData: UserFormData = {
    username: (document.getElementById("form-username") as HTMLInputElement).value,
    email: (document.getElementById("form-email") as HTMLInputElement).value,
    password: (document.getElementById("form-password") as HTMLInputElement).value,
    role: (document.getElementById("form-role") as HTMLSelectElement).value,
  };

  try {
    let response: Response;

    if (currentEditingUser) {
      // Modification
      if (!formData.password) {
        delete formData.password; // Ne pas envoyer le mot de passe s'il est vide
      }
      
      response = await AuthManager.fetchWithAuth(`/api/users/${currentEditingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
    } else {
      // Création
      response = await AuthManager.fetchWithAuth('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
    }

    if (response.ok) {
      closeUserModal();
      await loadUsers(); // Recharger la liste
    } else {
      const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
      alert(`Erreur: ${errorData.message || 'Impossible de sauvegarder l\'utilisateur'}`);
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    alert('Erreur de connexion');
  }
}

function editUser(userId: number): void {
  const user = allUsers.find(u => u.id === userId);
  if (user) {
    openUserModal(user);
  }
}

async function deleteUser(userId: number): Promise<void> {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;

  if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.username}" ?`)) {
    return;
  }

  try {
    const response = await AuthManager.fetchWithAuth(`/api/users/${userId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      await loadUsers(); // Recharger la liste
    } else {
      const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
      alert(`Erreur: ${errorData.message || 'Impossible de supprimer l\'utilisateur'}`);
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    alert('Erreur de connexion');
  }
}
