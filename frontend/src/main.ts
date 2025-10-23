import "./style.css";
import { createRouter } from "./router";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { HomePage } from "./pages/HomePage";
import { GamePage, cleanupGamePage } from "./pages/GamePage";
import { TournamentPage } from "./pages/TournamentPage";
import { ProfilePage } from "./pages/ProfilePage";
import { UsersPage } from "./pages/UsersPage";
import { AuthManager } from './utils/auth';
import { connectWebSocket } from './utils/ws';

const token = AuthManager.getToken();
if (token) {
  connectWebSocket(token);
}

// Initialiser l'application
function initApp(): void {
  const appDiv = document.querySelector<HTMLDivElement>("#app");
  if (!appDiv) {
    console.error("Element #app not found!");
    return;
  }

  // Creer le router
  const router = createRouter(appDiv);

  // Enregistrer les routes
  router.addRoute({
    path: "/",
    name: "login",
    component: LoginPage,
    isPublic: true,
  });

  router.addRoute({
    path: "/login",
    name: "login",
    component: LoginPage,
    isPublic: true,
  });

  router.addRoute({
    path: "/register",
    name: "register",
    component: RegisterPage,
    isPublic: true,
  });

  router.addRoute({
    path: "/home",
    name: "home",
    component: HomePage,
    isPublic: true,
  });

  router.addRoute({
    path: "/game",
    name: "game",
    component: GamePage,
    cleanup: cleanupGamePage,
    isPublic: true,
  });

  router.addRoute({
    path: "/tournament",
    name: "tournament",
    component: TournamentPage,
    isPublic: true,
  });

  router.addRoute({
    path: "/profile",
    name: "profile",
    component: ProfilePage,
    requiresAuth: true,
  });

  router.addRoute({
    path: "/users",
    name: "users",
    component: UsersPage,
    requiresAuth: true,
  });

  // Vérifier l'authentification au démarrage
  const currentPath = window.location.pathname;
  const isAuthenticated = AuthManager.isAuthenticated();

  // Si pas authentifié et pas sur login/register, activer le mode guest
  if (
    !isAuthenticated &&
    currentPath !== "/login" &&
    currentPath !== "/register"
  ) {
    AuthManager.enableGuestMode();
  }
  // // Démarrer avec la route actuelle ou login par défaut
  const validPaths = [
    "/",
    "/login",
    "/register",
    "/home",
    "/game",
    "/tournament",
    "/profile",
    "/users",
  ];
  const startPath = validPaths.includes(currentPath) ? currentPath : "/";

  router.start(startPath);
}
// Démarrer l'application quand le DOM est prêt
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
