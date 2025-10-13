// Simple SPA Router pour gérer la navigation entre les pages
export interface Route {
  path: string;
  name: string;
  component: () => Promise<void> | void;
  cleanup?: () => void; // Fonction optionnelle de nettoyage
}

export class Router {
  private routes: Map<string, Route> = new Map();
  private currentRoute: string = "/";
  private appContainer: HTMLElement;
  private isPopstateNavigation = false;


  constructor(appContainer: HTMLElement) {
    this.appContainer = appContainer;
    this.initializeRouter();
  }

  // Enregistrer une nouvelle route
  addRoute(route: Route): void {
    this.routes.set(route.path, route);
  }

  // Naviguer vers une route
  async navigate(path: string): Promise<void> {
    const route = this.routes.get(path);
    if (!route) {
      console.error(`Route not found: ${path}`);
      return;
    }

    try {
      // Nettoyer la page actuelle
      this.cleanup();

     // Mettre à jour l'URL seulement si ce n'est PAS une navigation popstate
      if (!this.isPopstateNavigation) {
        if (path === this.currentRoute) {
          // Même page : remplacer l'entrée actuelle
          window.history.replaceState({ path }, "", path);
        } else {
          // Nouvelle page : ajouter à l'historique
          window.history.pushState({ path }, "", path);
        }
      }
      this.currentRoute = path;


      // Charger la nouvelle page
      await route.component();
    } catch (error) {
      console.error(`Error loading route ${path}:`, error);
    } finally{
      this.isPopstateNavigation = false;     
    }
  }

  // Nettoyer la page actuelle
  private cleanup(): void {
    // Appeler la fonction de nettoyage de la route actuelle si elle existe
    const currentRoute = this.routes.get(this.currentRoute);
    if (currentRoute?.cleanup) {
      try {
        currentRoute.cleanup();
      } catch (error) {
        console.error(`Error during cleanup for route ${this.currentRoute}:`, error);
      }
    }

    // Arrêter les animations/timers si nécessaire
    this.appContainer.innerHTML = "";
  }

  // Initialiser le router
  private initializeRouter(): void {
    // Gérer les boutons précédent/suivant du navigateur
    window.addEventListener("popstate", (event) => {
      const path = event.state?.path || "/";
      this.isPopstateNavigation = true;
      this.navigate(path);
    });

    // Gérer les clics sur les liens internes
    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest("a[data-route]");

      if (link) {
        event.preventDefault();
        const path = link.getAttribute("data-route");
        if (path) {
          this.navigate(path);
        }
      }
    });
  }

  // Obtenir la route actuelle
  getCurrentRoute(): string {
    return this.currentRoute;
  }

  // Démarrer le router avec la route initiale
  start(initialPath: string = "/"): void {
    const path = window.location.pathname || initialPath;
    this.navigate(path);
  }
}

// Instance globale du router
let routerInstance: Router | null = null;

export function createRouter(appContainer: HTMLElement): Router {
  if (!routerInstance) {
    routerInstance = new Router(appContainer);
  }
  return routerInstance;
}

export function getRouter(): Router | null {
  return routerInstance;
}
