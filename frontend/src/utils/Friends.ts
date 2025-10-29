import { AuthManager } from "../utils/auth";
import { USERS_API, FRIENDS_API } from "../utils/apiConfig";
import { escapeHtml, sanitizeUrl } from "../utils/sanitize"; // ← AJOUTER CETTE
// Interface pour les utilisateurs recherchés
interface SearchedUser {
  id: number;
  username: string;
  email: string;
  photo: string;
}

// Interface pour les amis
interface Friend {
  id: number;
  username: string;
  photo: string;
  status?: number;
}

export class FriendManager {

  // Setup friends search listeners
  static setupFriendsListeners(): void {
    const searchInput = document.getElementById(
      "friend-search-input",
    ) as HTMLInputElement;
    const searchBtn = document.getElementById("friend-search-btn");

    // Search on button click
    searchBtn?.addEventListener("click", () => {
      const query = searchInput?.value.trim();
      if (query) {
        FriendManager.searchUsers(query);
      } else {
        // Hide search results if query is empty
        const searchResultsDiv = document.getElementById("search-results");
        if (searchResultsDiv) {
          searchResultsDiv.classList.add("hidden");
        }
      }
    });

    // Search on Enter key
    searchInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const query = searchInput.value.trim();
        if (query) {
          FriendManager.searchUsers(query);
        } else {
          // Hide search results if query is empty
          const searchResultsDiv = document.getElementById("search-results");
          if (searchResultsDiv) {
            searchResultsDiv.classList.add("hidden");
          }
        }
      }
    });
  }

  // Search users via API
  static async searchUsers(query: string): Promise<void> {
    const searchResultsDiv = document.getElementById("search-results");
    const searchResultsList = document.getElementById("search-results-list");

    if (!searchResultsDiv || !searchResultsList) return;

    try {
      searchResultsList.innerHTML =
        '<div class="text-green-400/50 text-sm">Searching...</div>';
      searchResultsDiv.classList.remove("hidden");

      const response = await AuthManager.fetchWithAuth(USERS_API.GET_ALL);

      if (response.ok) {
        const allUsers: SearchedUser[] = await response.json();

        // Filter users by search query (case insensitive)
        const users = allUsers.filter((user) =>
          user.username.toLowerCase().includes(query.toLowerCase()),
        );

        if (users.length === 0) {
          searchResultsList.innerHTML =
            '<div class="text-green-400/50 text-sm">No users found matching "' +
            query +
            '"</div>';
          return;
        }

        // Display search results
        searchResultsList.innerHTML = users
          .map(
            (user) => `
            <div class="bg-black border border-green-400/20 p-3 rounded flex items-center justify-between hover:border-green-400/40 transition-colors">
            <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full bg-green-400/20 border border-green-400/50 flex items-center justify-center overflow-hidden">
            ${
              user.photo
                ? `<img src="${sanitizeUrl(user.photo)}" alt="${escapeHtml(user.username)}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                          <span class="text-green-400 font-bold hidden">${escapeHtml(user.username.charAt(0).toUpperCase())}</span>`
                : `<span class="text-green-400 font-bold">${escapeHtml(user.username.charAt(0).toUpperCase())}</span>`
            }
            </div>
            <div>
             <div class="text-green-400 font-bold">${escapeHtml(user.username)}</div>
             <div class="text-green-500 text-xs">ID: #${user.id}</div>
            </div>
            </div>
            <button
            class="add-friend-btn bg-green-400/20 border border-green-400/50 text-green-400 px-4 py-1 rounded hover:bg-green-400/30 transition-colors text-sm"
            data-user-id="${user.id}"
            data-username="${escapeHtml(user.username)}"
            >
            [ADD]
            </button>
            </div>
            `,
          )
          .join("");

        // Add event listeners to Add buttons
        const addButtons =
          searchResultsList.querySelectorAll(".add-friend-btn");
        addButtons.forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            const userId = target.getAttribute("data-user-id");
            const username = target.getAttribute("data-username");
            if (userId && username) {
              FriendManager.addFriend(parseInt(userId), username);
            }
          });
        });
      } else {
        searchResultsList.innerHTML =
          '<div class="text-red-400 text-sm">Error searching users</div>';
      }
    } catch (error) {
      console.error("Error searching users:", error);
      searchResultsList.innerHTML =
        '<div class="text-red-400 text-sm">Network error</div>';
    }
  }

  // Add friend
  static async addFriend(userId: number, username: string): Promise<void> {
    try {
      const response = await AuthManager.fetchWithAuth(FRIENDS_API.ADD, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friendId: userId }),
      });

      if (response.ok) {
        FriendManager.showMessage(` Friend added ${username}`, "success");
        FriendManager.loadFriendsList(); // Refresh friends list
      } else {
        const errorData = await response.json();
        FriendManager.showMessage(
          `Failed to add friend: ${errorData.error || "Unknown error"}`,
          "error",
        );
      }
    } catch (error) {
      console.error("Error adding friend:", error);
      FriendManager.showMessage("Network error. Please try again.", "error");
    }
  }

  //Update friends list
  static updateFriendsStatus(userId: number, status: number){
	const friendElement = document.querySelector(`[data-user-id="${userId}"]`);
	if (!friendElement) return;

	const statusDot = friendElement.querySelector(".status-dot");
	const statusTextEl = friendElement.querySelector(".status-text");

	let statusColor = "";
	let statusText = "";

	switch (status) {
	case 0:
		statusColor = "bg-gray-500";
		statusText = "offline";
		break;
	case 1:
		statusColor = "bg-green-500";
		statusText = "online";
		break;
	case 2:
		statusColor = "bg-blue-500";
		statusText = "in game";
		break;
	default:
		statusColor = "bg-yellow-500";
		statusText = "not working";
	}

	if (statusDot) statusDot.className = `status-dot w-2 h-2 rounded-full ${statusColor}`;
	if (statusTextEl) statusTextEl.textContent = statusText;
  }

  // Load friends list
  static async loadFriendsList(): Promise<void> {
    const friendsList = document.getElementById("friends-list");

    if (!friendsList) return;

    try {
      const response = await AuthManager.fetchWithAuth(FRIENDS_API.GET_ALL);

      if (response.ok) {
        const friends: Friend[] = await response.json();

        if (friends.length === 0) {
          friendsList.innerHTML =
            '<div class="text-green-400/50 text-sm">No friends yet. Use the search bar to add friends!</div>';
          return;
        }

        // Display friends
        friendsList.innerHTML = friends
          .map(
            (friend) => {
				// Déterminer la couleur et le texte selon le statut
				let statusColor = "";
				let statusText = "";

				switch (friend.status) {
				case 0:
					statusColor = "bg-gray-500";
					statusText = "offline";
					break;
				case 1:
					statusColor = "bg-green-500";
					statusText = "online";
					break;
				case 2:
					statusColor = "bg-blue-500";
					statusText = "in game";
					break;
				default:
					statusColor = "bg-yellow-500";
					statusText = "not working";
				}

			return `
            <div class="bg-black border border-green-400/20 p-3 rounded flex items-center justify-between hover:border-green-400/40 transition-colors">
            <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full bg-green-400/20 border border-green-400/50 flex items-center justify-center overflow-hidden">
            ${
              friend.photo
                ? `<img src="${friend.photo}" alt="${friend.username}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
            <span class="text-green-400 font-bold hidden">${friend.username.charAt(0).toUpperCase()}</span>`
                : `<span class="text-green-400 font-bold">${friend.username.charAt(0).toUpperCase()}</span>`
            }
            </div>
            <div>
				<div class="text-green-400 font-bold">${friend.username}</div>
				<div class="flex items-center space-x-1 text-xs">
				<span class="status-dot w-2 h-2 rounded-full ${statusColor}"></span>
				<span class="status-text text-green-500 text-xs">${statusText}</span>
				</div>
            </div>
            </div>
            <div class="flex space-x-2">

            <button
            class="view-profile-btn bg-blue-400/20 border border-blue-400/50 text-blue-400 px-3 py-1 rounded hover:bg-blue-400/30 transition-colors text-sm"
            data-user-id="${friend.id}"
            >
            [VIEW]
            </button>

            <button
            class="remove-friend-btn bg-red-400/20 border border-red-400/50 text-red-400 px-3 py-1 rounded hover:bg-red-400/30 transition-colors text-sm"
            data-user-id="${friend.id}"
            data-username="${friend.username}"
            >
            [REMOVE]
            </button>
            </div>
            </div>
            `;
          })
          .join("");

        // Add event listeners
        const removeButtons =
          friendsList.querySelectorAll(".remove-friend-btn");
        removeButtons.forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            const userId = target.getAttribute("data-user-id");
            const username = target.getAttribute("data-username");
            if (userId && username) {
              FriendManager.removeFriend(username);
            }
          });
        });

        const viewButtons = friendsList.querySelectorAll(".view-profile-btn");
        viewButtons.forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            const userId = target.getAttribute("data-user-id");
            if (userId) {
              // TODO: Navigate to user's profile
              FriendManager.showMessage(
                `Viewing profile #${userId} - Feature coming soon!`,
                "info",
              );
            }
          });
        });
      } else {
        friendsList.innerHTML =
          '<div class="text-red-400 text-sm">Error loading friends</div>';
      }
    } catch (error) {
      console.error("Error loading friends:", error);
      friendsList.innerHTML =
        '<div class="text-red-400 text-sm">No friends available</div>';
    }
  }

  // Remove friend
  static async removeFriend(username: string): Promise<void> {
    if (
      !confirm(`Are you sure you want to remove ${username} from your friends?`)
    ) {
      return;
    }

    try {
      const response = await AuthManager.fetchWithAuth(
        `${FRIENDS_API.DELETE}/${username}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        FriendManager.showMessage(
          `Removed ${username} from friends`,
          "success",
        );
        FriendManager.loadFriendsList(); // Refresh friends list
      } else {
        const errorData = await response.json();
        FriendManager.showMessage(
          `Failed to remove friend: ${errorData.error || "Unknown error"}`,
          "error",
        );
      }
    } catch (error) {
      console.error("Error removing friend:", error);
      FriendManager.showMessage("Network error. Please try again.", "error");
    }
  }

  // Fonction pour afficher les messages
  static showMessage(
    message: string,
    type: "success" | "error" | "info",
  ): void {
    // Créer un container de messages s'il n'existe pas
    let messagesContainer = document.getElementById("home-messages");
    if (!messagesContainer) {
      messagesContainer = document.createElement("div");
      messagesContainer.id = "home-messages";
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
      type === "success"
        ? "[SUCCESS]"
        : type === "error"
          ? "[ERROR]"
          : "[INFO]";
    messageDiv.innerHTML = `<span class="font-bold">${prefix}</span> ${escapeHtml(message)}`;

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
}
