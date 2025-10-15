import { getRouter } from "../router";
import { AuthManager } from "../utils/auth";
//@ts-ignore -- mon editeur me donnais une erreur alors que npm run build non
import loginPageHtml from "./html/LoginPage.html?raw";

// Variable globale pour contrôler la vitesse d'écriture des animations
const ANIMATION_SPEED = {
  TYPEWRITER_FAST: 0, // Vitesse rapide pour les commandes
  TYPEWRITER_NORMAL: 15, // Vitesse normale pour les textes
  TYPEWRITER_SLOW: 20, // Vitesse lente pour les titres
  DELAY_SHORT: 0, // Délai court entre les animations
  DELAY_MEDIUM: 100, // Délai moyen
  DELAY_LONG: 150, // Délai long
  TRANSITION_FAST: 0, // Transition rapide
  TRANSITION_NORMAL: 0.5, // Transition normale
};

export async function LoginPage(): Promise<void> {
  const appDiv = document.querySelector<HTMLDivElement>("#app");
  if (!appDiv) return;

  // Classes CSS pour le body
  const body = document.querySelector("body");
  if (body) {
    body.className = "bg-black min-h-screen font-mono text-green-400";
  }

  // Injecter le HTML
  const buildDate = `${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, "0")}.${String(new Date().getDate()).padStart(2, "0")}`;
  appDiv.innerHTML = loginPageHtml.replace("{{buildDate}}", buildDate);

  // Démarrer les animations
  startLoginAnimations();

  // Setup event listeners
  setupLoginEventListeners();
}

// Animation typewriter pour le login
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

// Démarrer les animations de login
async function startLoginAnimations(): Promise<void> {
  // 1. Header command
  await typeWriter(
    "header-command",
    "./authenticate_user.sh --secure",
    ANIMATION_SPEED.TYPEWRITER_FAST,
  );
  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

  // Cacher le curseur header
  const headerCursor = document.getElementById("header-cursor");
  if (headerCursor) headerCursor.style.display = "none";

  // 2. ASCII Logo
  const asciiLogo = document.getElementById("ascii-logo");
  if (asciiLogo) {
    asciiLogo.style.opacity = "1";
    asciiLogo.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }
  await new Promise((resolve) => setTimeout(resolve, 200));

  // 3. Boot messages
  const bootMessages = document.getElementById("boot-messages");
  if (bootMessages) {
    bootMessages.style.opacity = "1";
    bootMessages.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
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
    await typeWriter(boot.id, boot.text, ANIMATION_SPEED.TYPEWRITER_FAST);
    await new Promise((resolve) =>
      setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
    );
  }

  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

  // 4. Login terminal
  const loginTerminal = document.getElementById("login-terminal");
  if (loginTerminal) {
    loginTerminal.style.opacity = "1";
    loginTerminal.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }

  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

  // 5. Login prompt and form labels
  await typeWriter(
    "login-prompt",
    "=== SECURE LOGIN TERMINAL ===",
    ANIMATION_SPEED.TYPEWRITER_FAST,
  );
  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

  await typeWriter(
    "login-info",
    "Please enter your 42 credentials to access the system",
    ANIMATION_SPEED.TYPEWRITER_FAST,
  );
  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

  await typeWriter(
    "username-label",
    "input required",
    ANIMATION_SPEED.TYPEWRITER_FAST,
  );
  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

  await typeWriter(
    "password-label",
    "input required",
    ANIMATION_SPEED.TYPEWRITER_FAST,
  );
  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

  await typeWriter(
    "oauth-title",
    "Alternative authentication methods:",
    ANIMATION_SPEED.TYPEWRITER_FAST,
  );
  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

  // 6. Status panel
  const statusPanel = document.getElementById("status-panel");
  if (statusPanel) {
    statusPanel.style.opacity = "1";
    statusPanel.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
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
      showMessage("Redirecting to registration...", "info");
      setTimeout(() => router.navigate("/register"), 1000);
    });
  }

  // Handle guest button
  if (guestBtn) {
    guestBtn.addEventListener("click", () => {
      showMessage("Entering as guest...", "info");
      setTimeout(() => router.navigate("/home"), 1000);
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
  const remember = rememberInput?.checked || false;

  // Basic validation
  if (!username || !password) {
    showMessage("Error: Username and password are required", "error");
    return;
  }

  showMessage("Authenticating...", "info");

  const success = await AuthManager.login({ username, password, remember });

  if (success) {
    // Rediriger vers la page d'accueil après login réussi
    setTimeout(() => router.navigate("/home"), 1500);
  } else {
    alert("Login failed");
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
