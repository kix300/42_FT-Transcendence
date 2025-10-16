import { getRouter } from "../router";
import { AUTH_API } from "../utils/apiConfig";
import { escapeHtml, sanitizeUrl } from "../utils/sanitize";
//@ts-ignore -- mon editeur me donnais une erreur alors que npm run build non
import registerPageHtml from "./html/RegisterPage.html?raw";

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

export async function RegisterPage(): Promise<void> {
  const appDiv = document.querySelector<HTMLDivElement>("#app");
  if (!appDiv) return;

  // Classes CSS pour le body
  const body = document.querySelector("body");
  if (body) {
    body.className = "bg-black min-h-screen font-mono text-green-400";
  }

  // Injecter le HTML
  const buildDate = `${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, "0")}.${String(new Date().getDate()).padStart(2, "0")}`;
  appDiv.innerHTML = registerPageHtml.replace("{{buildDate}}", buildDate);

  // Démarrer les animations
  startRegisterAnimations();

  // Setup event listeners
  setupRegisterEventListeners();
}

// Animation de typewriter pour les messages
async function typeWriter(
  element: HTMLElement,
  text: string,
  speed: number = ANIMATION_SPEED.TYPEWRITER_FAST,
): Promise<void> {
  return new Promise((resolve) => {
    let i = 0;
    element.textContent = "";
    const interval = setInterval(() => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(interval);
        resolve();
      }
    }, speed);
  });
}

// Animations de démarrage
// Animations de démarrage
async function startRegisterAnimations(): Promise<void> {
  // Animation du header
  const headerCommand = document.getElementById("header-command");
  if (headerCommand) {
    await typeWriter(
      headerCommand,
      "initializing registration system...",
      ANIMATION_SPEED.TYPEWRITER_SLOW,
    );
  }

  // Fade in du logo ASCII
  setTimeout(() => {
    const logo = document.getElementById("ascii-logo");
    if (logo) {
      logo.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_NORMAL}s ease-in-out`;
      logo.style.opacity = "1";
    }
  }, ANIMATION_SPEED.DELAY_MEDIUM);

  // Messages de boot
  const bootMessages = [
    "Loading registration modules...",
    "Checking password policies...",
    "Initializing email verification system...",
    "Setting up user validation...",
    "Registration system ready!",
  ];

  setTimeout(async () => {
    const bootContainer = document.getElementById("boot-messages");
    if (bootContainer) {
      bootContainer.style.opacity = "1";

      for (let i = 0; i < bootMessages.length; i++) {
        const bootElement = document.getElementById(`boot-${i + 1}`);
        if (bootElement) {
          await typeWriter(
            bootElement,
            `[${new Date().toLocaleTimeString()}] ${bootMessages[i]}`,
            ANIMATION_SPEED.TYPEWRITER_FAST,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
          );
        }
      }
    }
  }, 300);

  // Animation du terminal principal
  setTimeout(() => {
    const terminal = document.getElementById("register-terminal");
    if (terminal) {
      terminal.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_NORMAL}s ease-in-out`;
      terminal.style.opacity = "1";
    }
  }, 1200);

  // Animation des labels
  setTimeout(async () => {
    const labels = [
      { id: "register-prompt", text: "CREATE NEW ACCOUNT" },
      {
        id: "register-info",
        text: "Please fill in the required information to create your account.",
      },
      { id: "username-label", text: "new_user_identifier" },
      { id: "email-label", text: "contact_address" },
      { id: "password-label", text: "secure_passphrase" },
      { id: "confirm-password-label", text: "verify_passphrase" },
      { id: "photo-label", text: "profile_avatar" },
      { id: "oauth-title", text: "Alternative Registration Methods:" },
    ];

    for (const label of labels) {
      const element = document.getElementById(label.id);
      if (element) {
        await typeWriter(element, label.text, ANIMATION_SPEED.TYPEWRITER_FAST);
        await new Promise((resolve) =>
          setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
        );
      }
    }
  }, 1500);

  // Animation du panneau de statut
  setTimeout(() => {
    const statusPanel = document.getElementById("status-panel");
    if (statusPanel) {
      statusPanel.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_NORMAL}s ease-in-out`;
      statusPanel.style.opacity = "1";
    }
  }, 2500);
}

// Configuration des event listeners
function setupRegisterEventListeners(): void {
  const router = getRouter();
  if (!router) return;

  const registerForm = document.getElementById(
    "register-form",
  ) as HTMLFormElement;
  const backToLoginBtn = document.getElementById("back-to-login-btn");
  const oauth42Btn = document.getElementById("oauth-42-btn");

  // Handle register form submission
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleRegister();
    });
  }

  // Handle back to login button
  if (backToLoginBtn) {
    backToLoginBtn.addEventListener("click", () => {
      showMessage("Redirecting to login...", "info");
      setTimeout(() => router.navigate("/login"), 1000);
    });
  }

  // Handle OAuth 42
  if (oauth42Btn) {
    oauth42Btn.addEventListener("click", () => {
      showMessage("Redirecting to 42 OAuth registration...", "info");
      // TODO: Implement OAuth 42 registration redirect
      // window.location.href = "your-oauth-registration-endpoint";
    });
  }

  // Setup real-time validation
  setupRealTimeValidation();

  // Setup photo upload functionality
  setupPhotoUpload();

  // Add Enter key navigation between fields
  setupFieldNavigation();
}

// Validation en temps réel
function setupRealTimeValidation(): void {
  const usernameInput = document.getElementById("username") as HTMLInputElement;
  const emailInput = document.getElementById("email") as HTMLInputElement;
  const passwordInput = document.getElementById("password") as HTMLInputElement;
  const confirmPasswordInput = document.getElementById(
    "confirm-password",
  ) as HTMLInputElement;

  const usernameValidation = document.getElementById("username-validation");
  const emailValidation = document.getElementById("email-validation");
  const passwordValidation = document.getElementById("password-validation");

  // Username validation
  if (usernameInput && usernameValidation) {
    usernameInput.addEventListener("input", () => {
      const value = usernameInput.value.trim();
      if (value.length === 0) {
        usernameValidation.textContent = "PENDING";
        usernameValidation.className = "text-yellow-400";
      } else if (value.length < 3) {
        usernameValidation.textContent = "TOO SHORT";
        usernameValidation.className = "text-red-400";
      } else if (!/^[a-zA-Z0-9]+$/.test(value)) {
        usernameValidation.textContent = "INVALID CHARS";
        usernameValidation.className = "text-red-400";
      } else {
        usernameValidation.textContent = "VALID";
        usernameValidation.className = "text-green-300";
      }
    });
  }

  // Email validation
  if (emailInput && emailValidation) {
    emailInput.addEventListener("input", () => {
      const value = emailInput.value.trim();
      if (value.length === 0) {
        emailValidation.textContent = "PENDING";
        emailValidation.className = "text-yellow-400";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        emailValidation.textContent = "INVALID";
        emailValidation.className = "text-red-400";
      } else {
        emailValidation.textContent = "VALID";
        emailValidation.className = "text-green-300";
      }
    });
  }

  // Password validation
  if (passwordInput && passwordValidation) {
    passwordInput.addEventListener("input", () => {
      const value = passwordInput.value;
      if (value.length === 0) {
        passwordValidation.textContent = "PENDING";
        passwordValidation.className = "text-yellow-400";
      } else if (value.length < 8) {
        passwordValidation.textContent = "TOO SHORT";
        passwordValidation.className = "text-red-400";
      } else if (!/(?=.*[0-9])(?=.*[!@#$%^&*])/.test(value)) {
        passwordValidation.textContent = "WEAK";
        passwordValidation.className = "text-yellow-400";
      } else {
        passwordValidation.textContent = "STRONG";
        passwordValidation.className = "text-green-300";
      }
    });
  }

  // Confirm password validation
  if (confirmPasswordInput && passwordInput) {
    const checkPasswordMatch = () => {
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;

      if (confirmPassword.length > 0 && password !== confirmPassword) {
        confirmPasswordInput.style.borderColor = "#ef4444";
      } else {
        confirmPasswordInput.style.borderColor = "";
      }
    };

    confirmPasswordInput.addEventListener("input", checkPasswordMatch);
    passwordInput.addEventListener("input", checkPasswordMatch);
  }
}

// Setup photo upload functionality
function setupPhotoUpload(): void {
  const photoInput = document.getElementById(
    "profile-photo",
  ) as HTMLInputElement;
  const uploadBtn = document.getElementById("upload-photo-btn");
  const removeBtn = document.getElementById("remove-photo-btn");
  const photoPreview = document.getElementById("photo-preview");
  const photoInfo = document.getElementById("photo-info");

  if (!photoInput || !uploadBtn || !removeBtn || !photoPreview || !photoInfo)
    return;

  // Handle upload button click
  uploadBtn.addEventListener("click", () => {
    photoInput.click();
  });

  // Handle file selection
  photoInput.addEventListener("change", (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];

    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showMessage("Error: Please select a valid image file", "error");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showMessage("Error: Image must be less than 5MB", "error");
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        photoPreview.innerHTML = `<img src="${sanitizeUrl(result)}" alt="Preview" class="w-full h-full object-cover">`;
        photoInfo.textContent = `// ${escapeHtml(file.name)} (${(file.size / 1024).toFixed(1)}KB)`;
        removeBtn.classList.remove("hidden");
      };
      reader.readAsDataURL(file);

      showMessage(`Photo selected: ${escapeHtml(file.name)}`, "info");
    }
  });

  // Handle remove button
  removeBtn.addEventListener("click", () => {
    photoInput.value = "";
    photoPreview.innerHTML =
      '<span class="text-green-500 text-xs">NO IMG</span>';
    photoInfo.textContent = "// no file selected";
    removeBtn.classList.add("hidden");
    showMessage("Photo removed", "info");
  });
}

// Navigation entre les champs avec Enter
function setupFieldNavigation(): void {
  const fields = ["username", "email", "password", "confirm-password"];

  fields.forEach((fieldId, index) => {
    const field = document.getElementById(fieldId) as HTMLInputElement;
    if (field) {
      field.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (index < fields.length - 1) {
            const nextField = document.getElementById(
              fields[index + 1],
            ) as HTMLInputElement;
            if (nextField) nextField.focus();
          } else {
            const registerBtn = document.getElementById("register-btn");
            if (registerBtn) registerBtn.click();
          }
        }
      });
    }
  });
}

// Handle register logic
async function handleRegister(): Promise<void> {
  const router = getRouter();
  if (!router) return;

  const usernameInput = document.getElementById("username") as HTMLInputElement;
  const emailInput = document.getElementById("email") as HTMLInputElement;
  const passwordInput = document.getElementById("password") as HTMLInputElement;
  const confirmPasswordInput = document.getElementById(
    "confirm-password",
  ) as HTMLInputElement;
  const photoInput = document.getElementById(
    "profile-photo",
  ) as HTMLInputElement;

  const username = usernameInput?.value.trim();
  const email = emailInput?.value.trim();
  const password = passwordInput?.value;
  const confirmPassword = confirmPasswordInput?.value;

  const profilePhoto = photoInput?.files?.[0];

  // Validation côté client
  if (!username || !email || !password || !confirmPassword) {
    showMessage("Error: All required fields must be filled", "error");
    return;
  }

  if (username.length < 3 || username.length > 20) {
    showMessage("Error: Username must be between 3 and 20 characters", "error");
    return;
  }

  if (!/^[a-zA-Z0-9]+$/.test(username)) {
    showMessage(
      "Error: Username can only contain letters and numbers",
      "error",
    );
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showMessage("Error: Please enter a valid email address", "error");
    return;
  }

  if (password.length < 8) {
    showMessage("Error: Password must be at least 8 characters", "error");
    return;
  }

  if (password !== confirmPassword) {
    showMessage("Error: Passwords do not match", "error");
    return;
  }

  try {
    let response;

    // Use FormData for file upload
    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);
    if (profilePhoto) {
      console.log("Une photo a ete dectee", profilePhoto);
      formData.append("profilePhoto", profilePhoto);
    }
    response = await fetch(AUTH_API.REGISTER, {
      method: "POST",
      body: formData,
    });

    showMessage("Creating account...", "info");

    const data = await response.json();

    console.log("Response has been received from backend");

    if (response.ok) {
      showMessage("Account created successfully!", "success");
      if (data.token) {
        // Si le backend renvoie directement un token
        // Import AuthManager dynamically to avoid circular dependencies
        const { AuthManager } = await import("../utils/auth");
        AuthManager.setToken(data.token);

        setTimeout(() => {
          showMessage("Welcome! Redirecting to home page...", "success");
          setTimeout(() => router.navigate("/home"), 1000);
        }, 1000);
      } else {
        // Si pas de token direct, faire un login automatique
        showMessage("Did not recive tag", "error");
        // await performAutoLogin(username, password);
      }
    } else {
      showMessage(
        `Registration failed: ${escapeHtml(data.error || "Unknown error")}`,
        "error",
      );
    }
  } catch (error) {
    showMessage("Network error: Unable to connect to server", "error");
    console.error("Registration error:", error);
  }
}

// Affichage des messages
function showMessage(
  message: string,
  type: "success" | "error" | "info",
): void {
  const messagesContainer = document.getElementById("auth-messages");
  if (!messagesContainer) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = `p-2 border-l-4 ${
    type === "success"
      ? "border-green-400 bg-green-400/10 text-green-300"
      : type === "error"
        ? "border-red-400 bg-red-400/10 text-red-300"
        : "border-blue-400 bg-blue-400/10 text-blue-300"
  }`;

  const prefix =
    type === "success" ? "[SUCCESS]" : type === "error" ? "[ERROR]" : "[INFO]";
  messageDiv.innerHTML = `<span class="font-bold">${prefix}</span> ${escapeHtml(message)}`;

  // Clear previous messages
  messagesContainer.innerHTML = "";
  messagesContainer.appendChild(messageDiv);

  // Auto-remove after 5 seconds for non-error messages
  if (type !== "error") {
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 5000);
  }
}
