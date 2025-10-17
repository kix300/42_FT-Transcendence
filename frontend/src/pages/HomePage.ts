import { AuthManager } from "../utils/auth";
import { FriendManager } from "../utils/Friends";
import { Header } from "../components/Header";
import { createHeader, HeaderConfigs } from "../components/Header";
//@ts-ignore -- mon editeur me donnais une erreur alors que npm run build non
import homePageHtml from "./html/HomePage.html?raw";
//@ts-ignore -- mon editeur me donnais une erreur alors que npm run build non
import homePageGuestHtml from "./html/HomePageGuest.html?raw";

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

export async function HomePage(): Promise<void> {
  const appDiv = document.querySelector<HTMLDivElement>("#app");
  if (!appDiv) return;

  const isGuest = AuthManager.isGuest();
  if (isGuest) {
    await renderGuestHomePage(appDiv);
  } else {
    await renderAuthenticatedHomePage(appDiv);
  }
  // Page d'accueil pour les guests
  async function renderGuestHomePage(appDiv: HTMLDivElement): Promise<void> {
    const body = document.querySelector("body");
    if (body) {
      body.className = "bg-black min-h-screen font-mono text-green-400";
    }
    const header = createHeader(HeaderConfigs.profile);
    const headerHtml = await header.render();

    // Injecter le HTML dans le conteneur
    const buildDate = `${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, "0")}.${String(new Date().getDate()).padStart(2, "0")}`;
    const finalHtml = homePageGuestHtml
      .replace("{{header}}", headerHtml)
      .replace("{{buildDate}}", buildDate);

    appDiv.innerHTML = finalHtml;

    // Démarrer les animations
    startTypewriterAnimations();

    // Ajouter les event listeners pour la navigation
    Header.setupEventListeners();
  }

  async function renderAuthenticatedHomePage(
    appDiv: HTMLDivElement,
  ): Promise<void> {
    // Classes CSS pour le body et conteneur principal
    const body = document.querySelector("body");
    if (body) {
      body.className = "bg-black min-h-screen font-mono text-green-400";
    }
    // Créer le header
    const header = createHeader(HeaderConfigs.profile);
    const headerHtml = await header.render();

    // Injecter le HTML dans le conteneur
    const buildDate = `${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, "0")}.${String(new Date().getDate()).padStart(2, "0")}`;
    const finalHtml = homePageHtml
      .replace("{{header}}", headerHtml)
      .replace("{{buildDate}}", buildDate);

    appDiv.innerHTML = finalHtml;

    // Démarrer les animations
    startTypewriterAnimations();

    // Ajouter les event listeners pour la navigation
    Header.setupEventListeners();

    // Navigation des boutons redondans
    // setupHomePageNavigation();

    // Friends search functionality
    FriendManager.setupFriendsListeners();
    FriendManager.loadFriendsList();
  }
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

// Animation de ligne par ligne
async function typeLines(
  lines: { id: string; text: string; speed?: number }[],
): Promise<void> {
  for (const line of lines) {
    await typeWriter(
      line.id,
      line.text,
      line.speed || ANIMATION_SPEED.TYPEWRITER_FAST,
    );
    await new Promise((resolve) =>
      setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
    );
  }
}

// Démarrer toutes les animations en séquence
async function startTypewriterAnimations(): Promise<void> {
  // 1. Header command
  await typeWriter(
    "header-command",
    "./transcendence.sh",
    ANIMATION_SPEED.TYPEWRITER_FAST,
  );
  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

  // 2. Cacher le curseur du header et montrer le profil et menu nav
  const headerCursor = document.getElementById("header-cursor");
  const userProfile = document.getElementById("user-profile");
  const navMenu = document.getElementById("nav-menu");
  const homeroute = document.getElementById("route-home");

  if (headerCursor) headerCursor.style.display = "none";

  if (userProfile) {
    userProfile.style.opacity = "1";
    userProfile.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }

  if (homeroute) {
    homeroute.style.display = "none";
  }

  if (navMenu) {
    navMenu.style.opacity = "1";
    navMenu.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }

  // 3. Afficher ASCII art
  const asciiArt = document.getElementById("ascii-art");
  if (asciiArt) {
    asciiArt.style.opacity = "1";
    asciiArt.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }
  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

  // 4. Terminal prompt
  const terminalPrompt = document.getElementById("terminal-prompt");
  if (terminalPrompt) {
    terminalPrompt.style.opacity = "1";
    terminalPrompt.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }
  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

  await typeWriter(
    "cat-command",
    "cat welcome.txt",
    ANIMATION_SPEED.TYPEWRITER_FAST,
  );

  // 5. Cacher le curseur cat et afficher les messages
  const catCursor = document.getElementById("cat-cursor");
  if (catCursor) catCursor.style.display = "none";

  const welcomeMessages = document.getElementById("welcome-messages");
  if (welcomeMessages) {
    welcomeMessages.style.opacity = "1";
    welcomeMessages.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }

  // 6. Messages de bienvenue
  await typeLines([
    {
      id: "msg-1",
      text: "> Initialisation du système de jeu Pong 3D...",
      speed: ANIMATION_SPEED.TYPEWRITER_FAST,
    },
    {
      id: "msg-2",
      text: "> Connexion aux serveurs 42... [OK]",
      speed: ANIMATION_SPEED.TYPEWRITER_FAST,
    },
    {
      id: "msg-3",
      text: "> Chargement des modules de jeu... [OK]",
      speed: ANIMATION_SPEED.TYPEWRITER_FAST,
    },
    {
      id: "msg-4",
      text: "> Prêt pour le combat !",
      speed: ANIMATION_SPEED.TYPEWRITER_FAST,
    },
  ]);

  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

  // 7. Available commands
  const commandMenu = document.getElementById("command-menu");
  if (commandMenu) {
    commandMenu.style.opacity = "1";
    commandMenu.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }
  await typeWriter(
    "available-commands",
    "Available commands:",
    ANIMATION_SPEED.TYPEWRITER_FAST,
  );

  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

  // 8. System info
  const systemInfo = document.getElementById("system-info");
  if (systemInfo) {
    systemInfo.style.opacity = "1";
    systemInfo.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }

  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

  // 9. Friends section
  const friendsSection = document.getElementById("friends-section");
  if (friendsSection) {
    friendsSection.style.opacity = "1";
    friendsSection.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }

  await new Promise((resolve) =>
    setTimeout(resolve, ANIMATION_SPEED.DELAY_SHORT),
  );

  // 10. Quick start
  const quickStart = document.getElementById("History");
  if (quickStart) {
    quickStart.style.opacity = "1";
    quickStart.style.transition = `opacity ${ANIMATION_SPEED.TRANSITION_FAST}s`;
  }
  await typeWriter(
    "History-title",
    "History:",
    ANIMATION_SPEED.TYPEWRITER_FAST,
  );
}
