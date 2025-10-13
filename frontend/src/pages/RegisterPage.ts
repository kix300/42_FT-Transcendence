import { getRouter } from "../router";

// Variable globale pour contrôler la vitesse d'écriture des animations
const ANIMATION_SPEED = {
  TYPEWRITER_FAST: 0,    // Vitesse rapide pour les commandes
  TYPEWRITER_NORMAL: 15,  // Vitesse normale pour les textes
  TYPEWRITER_SLOW: 20,    // Vitesse lente pour les titres
  DELAY_SHORT: 0,        // Délai court entre les animations
  DELAY_MEDIUM: 100,      // Délai moyen
  DELAY_LONG: 150,        // Délai long
  TRANSITION_FAST: 0,   // Transition rapide
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

  // HTML de la page de register
  const registerPageHtml = `
    <div class="min-h-screen flex flex-col bg-black text-green-400 font-mono">
      <!-- Terminal Header -->
      <header class="p-4 border-b border-green-400/30">
        <div class="max-w-4xl mx-auto">
          <div class="flex items-center">
            <span class="text-green-400 mr-2">[system@42register]$</span>
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
 ██████  ██████  ███████  █████  ████████ ███████
██      ██   ██ ██      ██   ██    ██    ██
██      ██████  █████   ███████    ██    █████
██      ██   ██ ██      ██   ██    ██    ██
 ██████ ██   ██ ███████ ██   ██    ██    ███████

███    ██ ███████ ██     ██      █████   ██████  ██████  ██████  ██    ██ ███    ██ ████████
████   ██ ██      ██     ██     ██   ██ ██      ██      ██    ██ ██    ██ ████   ██    ██
██ ██  ██ █████   ██  █  ██     ███████ ██      ██      ██    ██ ██    ██ ██ ██  ██    ██
██  ██ ██ ██      ██ ███ ██     ██   ██ ██      ██      ██    ██ ██    ██ ██  ██ ██    ██
██   ████ ███████  ███ ███      ██   ██  ██████  ██████  ██████   ██████  ██   ████    ██
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

          <!-- Register Terminal Window -->
          <div class="bg-gray-900 border border-green-400/50 shadow-lg" id="register-terminal" style="opacity: 0;">
            <!-- Terminal Title Bar -->
            <div class="bg-gray-800 border-b border-green-400/30 px-4 py-2 flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div class="text-green-400 text-sm">42register-terminal v2.1.0</div>
            </div>

            <!-- Terminal Content -->
            <div class="p-6">
              <!-- Register Prompt -->
              <div class="mb-6">
                <div class="text-green-300 mb-2" id="register-prompt"></div>
                <div class="text-green-400 text-sm mb-4" id="register-info"></div>
              </div>

              <!-- Register Form -->
              <form id="register-form" class="space-y-4">
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
                      minlength="3"
                      maxlength="20"
                      required
                    />
                  </div>
                  <div class="text-xs text-green-500/70 ml-4">// 3-20 characters, alphanumeric only</div>
                </div>

                <!-- Email Field -->
                <div class="space-y-2">
                  <div class="flex items-center">
                    <span class="text-green-500 mr-2">email@42school:~$</span>
                    <span class="text-green-300" id="email-label"></span>
                  </div>
                  <div class="flex items-center bg-black border border-green-400/30 p-2">
                    <span class="text-green-500 mr-2">></span>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      class="bg-transparent text-green-400 font-mono flex-1 outline-none placeholder-green-400/50"
                      placeholder="enter email..."
                      autocomplete="email"
                      required
                    />
                  </div>
                  <div class="text-xs text-green-500/70 ml-4">// valid email address required</div>
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
                      autocomplete="new-password"
                      minlength="8"
                      required
                    />
                  </div>
                  <div class="text-xs text-green-500/70 ml-4">// min 8 chars, include numbers and special chars</div>
                </div>

                <!-- Confirm Password Field -->
                <div class="space-y-2">
                  <div class="flex items-center">
                    <span class="text-green-500 mr-2">confirm@42school:~$</span>
                    <span class="text-green-300" id="confirm-password-label"></span>
                  </div>
                  <div class="flex items-center bg-black border border-green-400/30 p-2">
                    <span class="text-green-500 mr-2">></span>
                    <input
                      type="password"
                      id="confirm-password"
                      name="confirm-password"
                      class="bg-transparent text-green-400 font-mono flex-1 outline-none placeholder-green-400/50"
                      placeholder="confirm password..."
                      autocomplete="new-password"
                      required
                    />
                  </div>
                  <div class="text-xs text-green-500/70 ml-4">// must match password above</div>
                </div>



                <!-- Profile Photo Upload -->
                <div class="space-y-2">
                  <div class="flex items-center">
                    <span class="text-green-500 mr-2">avatar@42school:~$</span>
                    <span class="text-green-300" id="photo-label"></span>
                  </div>

                  <!-- Photo Preview Area -->
                  <div class="bg-black border border-green-400/30 p-4">
                    <div class="flex items-center space-x-4">
                      <!-- Preview Image -->
                      <div class="flex-shrink-0">
                        <div id="photo-preview" class="w-16 h-16 border border-green-400/50 bg-gray-800 flex items-center justify-center">
                          <span class="text-green-500 text-xs">NO IMG</span>
                        </div>
                      </div>

                      <!-- Upload Controls -->
                      <div class="flex-1">
                        <input
                          type="file"
                          id="profile-photo"
                          name="profile-photo"
                          accept="image/*"
                          class="hidden"
                        />
                        <div class="space-y-2">
                          <button
                            type="button"
                            id="upload-photo-btn"
                            class="bg-black border border-green-400/30 text-green-400 px-3 py-1 hover:bg-green-400/10 transition-colors text-sm"
                          >
                            ./upload_avatar.sh --select
                          </button>
                          <button
                            type="button"
                            id="remove-photo-btn"
                            class="bg-black border border-red-400/30 text-red-400 px-3 py-1 hover:bg-red-400/10 transition-colors text-sm ml-2 hidden"
                          >
                            ./remove_avatar.sh
                          </button>
                        </div>
                        <div id="photo-info" class="text-xs text-green-500/70 mt-1">// no file selected</div>
                      </div>
                    </div>
                  </div>
                  <div class="text-xs text-green-500/70 ml-4">// optional, max 5MB (jpg, png, gif)</div>
                </div>

                <!-- Terms Acceptance -->
                <div class="flex items-start space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="terms"
                    name="terms"
                    class="w-4 h-4 text-green-400 bg-black border border-green-400/30 rounded focus:ring-green-400 mt-1"
                    required
                  />
                  <label for="terms" class="text-green-400 text-sm">
                    --accept-terms: I agree to the
                    <a href="#" class="text-green-300 underline hover:text-green-200">Terms of Service</a>
                    and
                    <a href="#" class="text-green-300 underline hover:text-green-200">Privacy Policy</a>
                  </label>
                </div>

                <!-- Register Buttons -->
                <div class="pt-4 space-y-3">
                  <button
                    type="submit"
                    id="register-btn"
                    class="w-full bg-black border border-green-400/50 text-green-400 py-3 px-4 hover:bg-green-400/10 transition-colors flex items-center justify-center"
                  >
                    <span class="mr-2">></span>
                    <span>./create_account.sh --register</span>
                  </button>

                  <div class="flex space-x-3">
                    <button
                      type="button"
                      id="back-to-login-btn"
                      class="flex-1 bg-black border border-green-400/30 text-green-400 py-2 px-4 hover:bg-green-400/10 transition-colors text-sm"
                    >
                      ./login.sh --existing-user
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
                    <span>./oauth_42.sh --register</span>
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
                <div>Registration API: <span class="text-green-300">ONLINE</span></div>
                <div>Database: <span class="text-green-300">CONNECTED</span></div>
                <div>Response Time: <span class="text-green-300">52ms</span></div>
              </div>
            </div>

            <div class="bg-gray-900 border border-green-400/30 p-3">
              <div class="text-green-300 text-sm font-bold mb-1">[SECURITY]</div>
              <div class="text-green-400 text-xs">
                <div>Password Hash: <span class="text-green-300">BCRYPT</span></div>
                <div>Email Verify: <span class="text-green-300">ENABLED</span></div>
                <div>Rate Limit: <span class="text-green-300">ACTIVE</span></div>
              </div>
            </div>

            <div class="bg-gray-900 border border-green-400/30 p-3">
              <div class="text-green-300 text-sm font-bold mb-1">[VALIDATION]</div>
              <div class="text-green-400 text-xs">
                <div>Username: <span id="username-validation" class="text-yellow-400">PENDING</span></div>
                <div>Email: <span id="email-validation" class="text-yellow-400">PENDING</span></div>
                <div>Password: <span id="password-validation" class="text-yellow-400">PENDING</span></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="border-t border-green-400/30 p-4">
        <div class="max-w-4xl mx-auto text-center text-green-500 text-xs">
          <span class="text-green-400">[System Info]</span> Transcendence v1.0.0 | École 42 | Build ${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, "0")}.${String(new Date().getDate()).padStart(2, "0")}
        </div>
      </footer>
    </div>
  `;

  // Injecter le HTML
  appDiv.innerHTML = registerPageHtml;

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
    await typeWriter(headerCommand, "initializing registration system...", ANIMATION_SPEED.TYPEWRITER_SLOW);
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
          await new Promise((resolve) => setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT));
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
        await new Promise((resolve) => setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT));
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
        photoPreview.innerHTML = `<img src="${result}" alt="Preview" class="w-full h-full object-cover">`;
        photoInfo.textContent = `// ${file.name} (${(file.size / 1024).toFixed(1)}KB)`;
        removeBtn.classList.remove("hidden");
      };
      reader.readAsDataURL(file);

      showMessage(`Photo selected: ${file.name}`, "info");
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
  const termsInput = document.getElementById("terms") as HTMLInputElement;
  const photoInput = document.getElementById("profile-photo") as HTMLInputElement;

  const username = usernameInput?.value.trim();
  const email = emailInput?.value.trim();
  const password = passwordInput?.value;
  const confirmPassword = confirmPasswordInput?.value;
  const termsAccepted = termsInput?.checked;
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

  if (!termsAccepted) {
    showMessage("Error: You must accept the terms of service", "error");
    return;
  }

  // TODO: Replace with actual registration API call
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
	response = await fetch("/api/register", {
	method: "POST",
	body: formData,
	});

 	showMessage("Creating account...", "info");

    const data = await response.json();

 	console.log("Response has been received from backend");

    if (response.ok) {
      showMessage(
        "Account created successfully!",
        "success",
      );
    if (data.token) {
        // Si le backend renvoie directement un token        
        // Import AuthManager dynamically to avoid circular dependencies
        const { AuthManager } = await import('../utils/auth');
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
        `Registration failed: ${data.error || "Unknown error"}`,
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
  messageDiv.innerHTML = `<span class="font-bold">${prefix}</span> ${message}`;

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
