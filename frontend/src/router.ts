// Simple SPA Router pour gérer la navigation entre les pages
export interface Route {
  path: string;
  name: string;
  component: () => Promise<void> | void;
}

export class Router {
  private routes: Map<string, Route> = new Map();
  private currentRoute: string = "/";
  private appContainer: HTMLElement;

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

    // Nettoyer la page actuelle
    this.cleanup();

    // Mettre à jour l'URL sans recharger la page
    window.history.pushState({ path }, "", path);
    this.currentRoute = path;

    // Charger la nouvelle page
    try {
      await route.component();
    } catch (error) {
      console.error(`Error loading route ${path}:`, error);
    }
  }

  // Nettoyer la page actuelle
  private cleanup(): void {
    // Arrêter les animations/timers si nécessaire
    this.appContainer.innerHTML = "";

    // Supprimer les event listeners globaux s'ils existent
  }

  // Initialiser le router
  private initializeRouter(): void {
    // Gérer les boutons précédent/suivant du navigateur
    window.addEventListener("popstate", (event) => {
      const path = event.state?.path || "/";
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
