import { getRouter } from "../router";

export async function LoginPage(): Promise<void> {
  const appDiv = document.querySelector<HTMLDivElement>("#app");
  if (!appDiv) return;

  // Classes CSS pour le body
  const body = document.querySelector("body");
  if (body) {
    body.className = "bg-black min-h-screen font-mono text-green-400";
  }

  // HTML de la page de login
  const loginPageHtml = `
    <div class="min-h-screen flex flex-col bg-black text-green-400 font-mono">
      <!-- Terminal Header -->
      <header class="p-4 border-b border-green-400/30">
        <div class="max-w-4xl mx-auto">
          <div class="flex items-center">
            <span class="text-green-400 mr-2">[system@42auth]$</span>
            <span id="header-command" class="text-green-300 font-bold"></span>
            <span id="header-cursor" class="text-green-300 animate-pulse">_</span>
          </div>
        </div>
      </header>

      <!-- Main Terminal Content -->
      <main class="flex-1 flex items-center justify-center p-6">
        <div class="max-w-4xl w-full">

          <!-- ASCII Art Logo -->
          <div class="mb-8 text-center">
            <pre id="ascii-logo" class="text-green-400 text-xs md:text-sm leading-tight opacity-0">
 ███████ ██████      █████  ██    ██ ████████ ██   ██
 ██      ██   ██    ██   ██ ██    ██    ██    ██   ██
 ███████ ██████     ███████ ██    ██    ██    ███████
      ██ ██   ██    ██   ██ ██    ██    ██    ██   ██
 ███████ ██   ██    ██   ██  ██████     ██    ██   ██

████████ ██████   █████  ███    ██ ███████  ██████ ███████ ███    ██ ██████  ███████ ███    ██  ██████ ███████
   ██    ██   ██ ██   ██ ████   ██ ██      ██      ██      ████   ██ ██   ██ ██      ████   ██ ██      ██
   ██    ██████  ███████ ██ ██  ██ ███████ ██      █████   ██ ██  ██ ██   ██ █████   ██ ██  ██ ██      █████
   ██    ██   ██ ██   ██ ██  ██ ██      ██ ██      ██      ██  ██ ██ ██   ██ ██      ██  ██ ██ ██      ██
   ██    ██   ██ ██   ██ ██   ████ ███████  ██████ ███████ ██   ████ ██████  ███████ ██   ████  ██████ ███████
            </pre>
          </div>

          <!-- System Boot Messages -->
          <div class="mb-8" id="boot-messages" style="opacity: 0;">
            <div id="boot-1" class="text-green-400 mb-1"></div>
            <div id="boot-2" class="text-green-400 mb-1"></div>
            <div id="boot-3" class="text-green-400 mb-1"></div>
            <div id="boot-4" class="text-green-400 mb-1"></div>
            <div id="boot-5" class="text-green-400 mb-1"></div>
          </div>

          <!-- Login Terminal Window -->
          <div class="bg-gray-900 border border-green-400/50 shadow-lg" id="login-terminal" style="opacity: 0;">
            <!-- Terminal Title Bar -->
            <div class="bg-gray-800 border-b border-green-400/30 px-4 py-2 flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div class="text-green-400 text-sm">42auth-terminal v2.1.0</div>
            </div>

            <!-- Terminal Content -->
            <div class="p-6">
              <!-- Login Prompt -->
              <div class="mb-6">
                <div class="text-green-300 mb-2" id="login-prompt"></div>
                <div class="text-green-400 text-sm mb-4" id="login-info"></div>
              </div>

              <!-- Login Form -->
              <form id="login-form" class="space-y-4">
                <!-- Username Field -->
                <div class="space-y-2">
                  <div class="flex items-center">
                    <span class="text-green-500 mr-2">username@42school:~$</span>
                    <span class="text-green-300" id="username-label"></span>
                  </div>
                  <div class="flex items-center bg-black border border-green-400/30 p-2">
                    <span class="text-green-500 mr-2">></span>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      class="bg-transparent text-green-400 font-mono flex-1 outline-none placeholder-green-400/50"
                      placeholder="enter username..."
                      autocomplete="username"
                    />
                  </div>
                </div>

                <!-- Password Field -->
                <div class="space-y-2">
                  <div class="flex items-center">
                    <span class="text-green-500 mr-2">password@42school:~$</span>
                    <span class="text-green-300" id="password-label"></span>
                  </div>
                  <div class="flex items-center bg-black border border-green-400/30 p-2">
                    <span class="text-green-500 mr-2">></span>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      class="bg-transparent text-green-400 font-mono flex-1 outline-none placeholder-green-400/50"
                      placeholder="enter password..."
                      autocomplete="current-password"
                    />
                  </div>
                </div>

                <!-- Remember Me -->
                <div class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    name="remember"
                    class="w-4 h-4 text-green-400 bg-black border border-green-400/30 rounded focus:ring-green-400"
                  />
                  <label for="remember" class="text-green-400 text-sm">--keep-session-alive</label>
                </div>

                <!-- Login Buttons -->
                <div class="pt-4 space-y-3">
                  <button
                    type="submit"
                    id="login-btn"
                    class="w-full bg-black border border-green-400/50 text-green-400 py-3 px-4 hover:bg-green-400/10 transition-colors flex items-center justify-center"
                  >
                    <span class="mr-2">></span>
                    <span>./authenticate.sh --login</span>
                  </button>

                  <div class="flex space-x-3">
                    <button
                      type="button"
                      id="register-btn"
                      class="flex-1 bg-black border border-green-400/30 text-green-400 py-2 px-4 hover:bg-green-400/10 transition-colors text-sm"
                    >
                      ./register.sh --new-user
                    </button>
                    <button
                      type="button"
                      id="guest-btn"
                      class="flex-1 bg-black border border-green-400/30 text-green-400 py-2 px-4 hover:bg-green-400/10 transition-colors text-sm"
                    >
                      ./guest_access.sh
                    </button>
                  </div>
                </div>

                <!-- OAuth Section -->
                <div class="pt-4 border-t border-green-400/30">
                  <div class="text-green-300 text-sm mb-3" id="oauth-title"></div>
                  <button
                    type="button"
                    id="oauth-42-btn"
                    class="w-full bg-black border border-green-400/30 text-green-400 py-2 px-4 hover:bg-green-400/10 transition-colors text-sm flex items-center justify-center"
                  >
                    <span class="mr-2">></span>
                    <span>./oauth_42.sh --authenticate</span>
                  </button>
                </div>

                <!-- Error/Success Messages -->
                <div id="auth-messages" class="mt-4 space-y-1 text-sm"></div>
              </form>
            </div>
          </div>

          <!-- System Status -->
          <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4" id="status-panel" style="opacity: 0;">
            <div class="bg-gray-900 border border-green-400/30 p-3">
              <div class="text-green-300 text-sm font-bold mb-1">[SERVER STATUS]</div>
              <div class="text-green-400 text-xs">
                <div>Auth Server: <span class="text-green-300">ONLINE</span></div>
                <div>Database: <span class="text-green-300">CONNECTED</span></div>
                <div>Response Time: <span class="text-green-300">45ms</span></div>
              </div>
            </div>

            <div class="bg-gray-900 border border-green-400/30 p-3">
              <div class="text-green-300 text-sm font-bold mb-1">[SECURITY]</div>
              <div class="text-green-400 text-xs">
                <div>SSL: <span class="text-green-300">ENABLED</span></div>
                <div>2FA: <span class="text-green-300">AVAILABLE</span></div>
                <div>Encryption: <span class="text-green-300">AES-256</span></div>
              </div>
            </div>

            <div class="bg-gray-900 border border-green-400/30 p-3">
              <div class="text-green-300 text-sm font-bold mb-1">[USERS ONLINE]</div>
              <div class="text-green-400 text-xs">
                <div>Active Sessions: <span class="text-green-300">127</span></div>
                <div>Queue Position: <span class="text-green-300">-</span></div>
                <div>Last Login: <span class="text-green-300">Never</span></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="border-t border-green-400/30 p-4">
        <div class="max-w-4xl mx-auto text-center text-green-500 text-xs">
          <span class="text-green-400">[Auth System]</span> Secure Authentication Portal | École 42 | Build 2024.01.15
        </div>
      </footer>
    </div>
  `;

  // Injecter le HTML
  appDiv.innerHTML = loginPageHtml;

  // Démarrer les animations
  startLoginAnimations();

  // Setup event listeners
  setupLoginEventListeners();
}

// Animation typewriter pour le login
async function typeWriter(
  elementId: string,
  text: string,
  speed: number = 20,
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = "";

  for (let i = 0; i < text.length; i++) {
    element.textContent += text.charAt(i);
    await new Promise((resolve) => setTimeout(resolve, speed));
  }
}

// Démarrer les animations de login
async function startLoginAnimations(): Promise<void> {
  // 1. Header command
  await typeWriter("header-command", "./authenticate_user.sh --secure", 30);
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Cacher le curseur header
  const headerCursor = document.getElementById("header-cursor");
  if (headerCursor) headerCursor.style.display = "none";

  // 2. ASCII Logo
  const asciiLogo = document.getElementById("ascii-logo");
  if (asciiLogo) {
    asciiLogo.style.opacity = "1";
    asciiLogo.style.transition = "opacity 1s";
  }
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 3. Boot messages
  const bootMessages = document.getElementById("boot-messages");
  if (bootMessages) {
    bootMessages.style.opacity = "1";
    bootMessages.style.transition = "opacity 0.3s";
  }

  const bootSequence = [
    {
      id: "boot-1",
      text: "[INFO] Initializing secure authentication system...",
    },
    { id: "boot-2", text: "[INFO] Loading encryption modules... OK" },
    { id: "boot-3", text: "[INFO] Connecting to 42 OAuth servers... OK" },
    { id: "boot-4", text: "[INFO] Verifying SSL certificates... OK" },
    { id: "boot-5", text: "[READY] Authentication system ready for login" },
  ];

  for (const boot of bootSequence) {
    await typeWriter(boot.id, boot.text, 15);
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  await new Promise((resolve) => setTimeout(resolve, 300));

  // 4. Login terminal
  const loginTerminal = document.getElementById("login-terminal");
  if (loginTerminal) {
    loginTerminal.style.opacity = "1";
    loginTerminal.style.transition = "opacity 0.8s";
  }

  await new Promise((resolve) => setTimeout(resolve, 200));

  // 5. Login prompt and form labels
  await typeWriter("login-prompt", "=== SECURE LOGIN TERMINAL ===", 20);
  await new Promise((resolve) => setTimeout(resolve, 150));

  await typeWriter(
    "login-info",
    "Please enter your 42 credentials to access the system",
    15,
  );
  await new Promise((resolve) => setTimeout(resolve, 200));

  await typeWriter("username-label", "input required", 20);
  await new Promise((resolve) => setTimeout(resolve, 150));

  await typeWriter("password-label", "input required", 20);
  await new Promise((resolve) => setTimeout(resolve, 200));

  await typeWriter("oauth-title", "Alternative authentication methods:", 15);
  await new Promise((resolve) => setTimeout(resolve, 200));

  // 6. Status panel
  const statusPanel = document.getElementById("status-panel");
  if (statusPanel) {
    statusPanel.style.opacity = "1";
    statusPanel.style.transition = "opacity 0.5s";
  }

  // Focus sur le premier input
  const usernameInput = document.getElementById("username") as HTMLInputElement;
  if (usernameInput) {
    usernameInput.focus();
  }
}

// Setup event listeners pour le login
function setupLoginEventListeners(): void {
  const router = getRouter();
  if (!router) return;

  const loginForm = document.getElementById("login-form") as HTMLFormElement;
  const loginBtn = document.getElementById("login-btn");
  const registerBtn = document.getElementById("register-btn");
  const guestBtn = document.getElementById("guest-btn");
  const oauth42Btn = document.getElementById("oauth-42-btn");

  // Handle login form submission
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleLogin();
    });
  }

  // Handle register button
  if (registerBtn) {
    registerBtn.addEventListener("click", () => {
      showMessage("Registration feature not implemented yet", "info");
      // TODO: Implement registration logic or navigate to register page
      // router.navigate("/register");
    });
  }

  // Handle guest access
  if (guestBtn) {
    guestBtn.addEventListener("click", () => {
      showMessage("Logging in as guest...", "info");
      // TODO: Implement guest login logic
      setTimeout(() => router.navigate("/"), 1000);
    });
  }

  // Handle OAuth 42
  if (oauth42Btn) {
    oauth42Btn.addEventListener("click", () => {
      showMessage("Redirecting to 42 OAuth...", "info");
      // TODO: Implement OAuth 42 redirect
      // window.location.href = "your-oauth-endpoint";
    });
  }

  // Add Enter key navigation between fields
  const usernameInput = document.getElementById("username") as HTMLInputElement;
  const passwordInput = document.getElementById("password") as HTMLInputElement;

  if (usernameInput && passwordInput) {
    usernameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        passwordInput.focus();
      }
    });

    passwordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && loginBtn) {
        e.preventDefault();
        loginBtn.click();
      }
    });
  }
}

// Handle login logic
async function handleLogin(): Promise<void> {
  const router = getRouter();
  if (!router) return;

  const usernameInput = document.getElementById("username") as HTMLInputElement;
  const passwordInput = document.getElementById("password") as HTMLInputElement;
  const rememberInput = document.getElementById("remember") as HTMLInputElement;

  const username = usernameInput?.value.trim();
  const password = passwordInput?.value;
  const remember = rememberInput?.checked;

  // Basic validation
  if (!username || !password) {
    showMessage("Error: Username and password are required", "error");
    return;
  }

  showMessage("Authenticating...", "info");

  // TODO: Replace with actual authentication logic
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'},
      body: JSON.stringify({
        username,
        password,
        remember
      })
    });

    const data = await response.json();

    if (response.ok) {
      // Store JWT token
      localStorage.setItem('auth_token', data.token);
      if (remember) {
        localStorage.setItem('remember_login', 'true');
      }

      showMessage("Authentication successful! Redirecting...", "success");
      setTimeout(() => router.navigate("/home"), 1500);
    } else {
      showMessage(`Authentication failed: ${data.error}`, "error");
    }
  } catch (error) {
    showMessage("Network error: Unable to connect to server", "error");
  }
}


// Show messages in terminal style
function showMessage(
  message: string,
  type: "info" | "error" | "success",
): void {
  const messagesContainer = document.getElementById("auth-messages");
  if (!messagesContainer) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = "terminal-message";

  let prefix = "";
  let colorClass = "";

  switch (type) {
    case "info":
      prefix = "[INFO]";
      colorClass = "text-blue-400";
      break;
    case "error":
      prefix = "[ERROR]";
      colorClass = "text-red-400";
      break;
    case "success":
      prefix = "[SUCCESS]";
      colorClass = "text-green-300";
      break;
  }

  messageDiv.innerHTML = `<span class="${colorClass}">${prefix}</span> ${message}`;

  // Clear previous messages of same type
  messagesContainer.innerHTML = "";
  messagesContainer.appendChild(messageDiv);

  // Auto-clear success/info messages after 5 seconds
  if (type !== "error") {
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 5000);
  }
}
