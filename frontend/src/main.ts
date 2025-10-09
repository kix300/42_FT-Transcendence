import "./style.css";
import { createRouter } from "./router";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { GamePage } from "./pages/GamePage";

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
  });

  router.addRoute({
    path: "/home",
    name: "home",
    component: HomePage,
  });

  router.addRoute({
    path: "/game",
    name: "game",
    component: GamePage,
  });

  // Démarrer le router avec la route initiale
  // Si on est déjà sur une route spécifique, l'utiliser, sinon aller au login
  const currentPath = window.location.pathname;
  const validPaths = ["/", "/home", "/game"];
  const startPath = validPaths.includes(currentPath) ? currentPath : "/";

  router.start(startPath);
}
// Démarrer l'application quand le DOM est prêt
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}