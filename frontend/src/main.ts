import "./style.css";
import { createRouter } from "./router";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { HomePage } from "./pages/HomePage";
import { GamePage } from "./pages/GamePage";
import { TournamentPage } from "./pages/TournamentPage";
import { ProfilePage } from "./pages/ProfilePage";
import { UsersPage } from "./pages/UsersPage";
import { AuthManager } from './utils/auth';


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
  // router.addRoute({
  //   path: "/",
  //   name: "home",
  //   component: HomePage,
  // });

  // router.addRoute({
  //   path: "/login",
  //   name: "login",
  //   component: LoginPage,
  // });

  // router.addRoute({
  //   path: "/register",
  //   name: "register",
  //   component: RegisterPage,
  // });

  // router.addRoute({
  //   path: "/home",
  //   name: "home",
  //   component: HomePage,
  // });

  router.addRoute({
    path: "/game",
    name: "game",
    component: GamePage,
  });

  router.addRoute({
    path: "/tournament",
    name: "tournament",
    component: TournamentPage,
  });

  // router.addRoute({
  //   path: "/profile",
  //   name: "profile",
  //   component: ProfilePage,
  // });

  // router.addRoute({
  //   path: "/users",
  //   name: "users",
  //   component: UsersPage,
  // });

  // Vérifier l'authentification au démarrage
  // const currentPath = window.location.pathname;
  // const protectedPaths = ["/home", "/game", "/tournament", "/profile", "/users"];

  // if (protectedPaths.includes(currentPath)) {
  //   // Si on est sur une page protégée, vérifier l'auth
  //   const isAuthenticated = AuthManager.isAuthenticated();

  //   if (!isAuthenticated) {
  //     // Pas d'auth valide, rediriger vers login
  //     router.start("/login");
  //     return;
  //   }
  // }

  // // Démarrer avec la route actuelle ou login par défaut
  // const validPaths = ["/", "/login", "/register", "/home", "/game", "/tournament", "/profile", "/users"];
  // const startPath = validPaths.includes(currentPath) ? currentPath : "/";

  // router.start(startPath);
  router.start("/game");
}
// Démarrer l'application quand le DOM est prêt
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}