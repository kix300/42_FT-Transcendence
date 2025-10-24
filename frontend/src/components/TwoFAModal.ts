import { getRouter } from "../router";
import { AuthManager } from "../utils/auth";
import { TWOFA_API } from "../utils/apiConfig";
import { escapeHtml } from "../utils/sanitize";
import twoFAModalHtml from "./../pages/html/TwoFAModal.html?raw";

export class TwoFAModal {
  modalElement: HTMLElement | null = null;
  private token: string = "";

  constructor() {
    this.injectHTML();
  }

  // Injecter le HTML du modal dans le DOM
  private injectHTML(): void {
    // Vérifie si le modal n'existe pas déjà
    if (document.getElementById("qr-modal")) {
      return;
    }

    // Crée un conteneur temporaire
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = twoFAModalHtml;

    // Ajoute le modal au body
    document.body.appendChild(tempDiv.firstElementChild as HTMLElement);
    this.modalElement = document.getElementById("qr-modal");
  }

  // Afficher le modal avec le QR code register
  public showregister(
    qrCodeDataURL: string,
    secret: string,
    token: string,
  ): void {
    this.token = token;

    const modal = document.getElementById("qr-modal");
    const qrImg = document.getElementById("qr-code-img") as HTMLImageElement;
    const secretDiv = document.getElementById("2fa-secret");
    const verifyBtn = document.getElementById("verify-2fa-btn");
    const skipBtn = document.getElementById("skip-2fa-btn");
    const codeInput = document.getElementById(
      "2fa-verify-code",
    ) as HTMLInputElement;

    if (skipBtn) skipBtn.style.display = "none";

    if (!modal || !qrImg || !secretDiv) {
      console.error("Modal elements not found");
      return;
    }

    // Réinitialiser l'input et les messages
    if (codeInput) codeInput.value = "";
    this.clearMessage();

    // Afficher le QR code et le secret
    qrImg.src = qrCodeDataURL;
    secretDiv.textContent = secret;

    // Afficher le modal
    modal.classList.remove("hidden");

    // Supprimer les anciens event listeners
    const newVerifyBtn = verifyBtn?.cloneNode(true) as HTMLElement;
    // const newSkipBtn = skipBtn?.cloneNode(true) as HTMLElement;
    verifyBtn?.parentNode?.replaceChild(newVerifyBtn, verifyBtn);
    // skipBtn?.parentNode?.replaceChild(newSkipBtn, skipBtn);

    // Bouton de vérification
    newVerifyBtn?.addEventListener("click", () => this.verify());

    // Bouton skip
    // newSkipBtn?.addEventListener("click", () => this.skip());

    // Permettre la validation avec Enter
    codeInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.verify();
      }
    });
  }

  // Afficher le modal avec le QR code register
  public showlogin(token: string): void {
    this.token = token;
    const modal = document.getElementById("qr-modal");
    const qrImg = document.getElementById("qr-code-img") as HTMLImageElement;
    const qrImg2 = document.getElementById("qr-code-img2");
    const secretDiv = document.getElementById("2fa-secret");
    const verifyBtn = document.getElementById("verify-2fa-btn");
    const skipBtn = document.getElementById("skip-2fa-btn");
    const step1 = document.getElementById("step1");
    const step2 = document.getElementById("step2");
    const manual = document.getElementById("manual");
    const codeInput = document.getElementById(
      "2fa-verify-code",
    ) as HTMLInputElement;

    if (!modal || !qrImg || !secretDiv) {
      console.error("Modal elements not found");
      return;
    }

    if (manual) manual.style.display = "none";
    if (step2) step2.style.display = "none";
    if (step1) step1.style.display = "none";
    if (qrImg2) qrImg2.style.display = "none";
    qrImg.style.display = "none";
    secretDiv.style.display = "none";

    // Réinitialiser l'input et les messages
    if (codeInput) codeInput.value = "";
    this.clearMessage();

    modal.classList.remove("hidden");

    // Supprimer les anciens event listeners
    const newVerifyBtn = verifyBtn?.cloneNode(true) as HTMLElement;
    const newSkipBtn = skipBtn?.cloneNode(true) as HTMLElement;
    verifyBtn?.parentNode?.replaceChild(newVerifyBtn, verifyBtn);
    skipBtn?.parentNode?.replaceChild(newSkipBtn, skipBtn);

    // Bouton de vérification
    newVerifyBtn?.addEventListener("click", () => this.verify());

    // Bouton skip
    newSkipBtn?.addEventListener("click", () => this.skip());

    // Permettre la validation avec Enter
    codeInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        //ici on veux verifier si cést bon ou non notre token en fonction d'autre chose que le token
        this.verify();
      }
    });
  }

  // Vérifier le code 2FA
  private async verify(): Promise<void> {
    const codeInput = document.getElementById(
      "2fa-verify-code",
    ) as HTMLInputElement;
    const code = codeInput?.value.trim();

    if (!code || code.length !== 6) {
      this.showMessage("Error: Please enter a 6-digit code", "error");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      this.showMessage("Error: Code must contain only numbers", "error");
      return;
    }

    try {
      const response = await fetch(`${TWOFA_API.VERIFY}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: code }),
      });

      const data = await response.json();

      if (response.ok) {
        this.showMessage("2FA enabled successfully! Redirecting...", "success");
        //stocker le token
        AuthManager.setToken(this.token, 0 || false);
        if (data.user) {
          AuthManager.setUser(data.user);
        }
        setTimeout(() => {
          this.hide();
          const router = getRouter();
          if (router) {
            router.navigate("/home");
          }
        }, 1500);
      } else {
        this.showMessage(
          `Error: ${escapeHtml(data.error || "Invalid code")}`,
          "error",
        );
      }
    } catch (error) {
      this.showMessage("Network error", "error");
      console.error("2FA verification error:", error);
      AuthManager.logout();
    }
  }

  // Afficher le modal pour désactiver la 2FA (demande de code)
  public showdisable(token: string): void {
    this.token = token;

    const modal = document.getElementById("qr-modal");
    const qrImg = document.getElementById("qr-code-img");
    const secretDiv = document.getElementById("2fa-secret");
    const verifyBtn = document.getElementById("verify-2fa-btn");
    const step1 = document.getElementById("step1");
    const step2 = document.getElementById("step2");
    const manual = document.getElementById("manual");
    const codeInput = document.getElementById(
      "2fa-verify-code",
    ) as HTMLInputElement;

    if (!modal) {
      console.error("Modal elements not found");
      return;
    }

    // Afficher uniquement la partie de verification (pas de QR ni de secret)
    if (manual) manual.style.display = "none";
    if (step2) step2.style.display = "none";
    if (step1) step1.style.display = "none";
    if (qrImg) qrImg.style.display = "none";
    if (secretDiv) secretDiv.style.display = "none";

    if (codeInput) codeInput.value = "";
    this.clearMessage();

    modal.classList.remove("hidden");

    // Supprimer les anciens event listeners
    const newVerifyBtn = verifyBtn?.cloneNode(true) as HTMLElement;
    verifyBtn?.parentNode?.replaceChild(newVerifyBtn, verifyBtn);

    // Bouton de vérification -> appelle disable()
    newVerifyBtn?.addEventListener("click", () => this.disable());

    // Permettre la validation avec Enter
    codeInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.disable();
      }
    });
  }

  // Désactiver la 2FA en backend après vérification du code
  private async disable(): Promise<void> {
    const codeInput = document.getElementById(
      "2fa-verify-code",
    ) as HTMLInputElement;
    const code = codeInput?.value.trim();

    if (!code || code.length !== 6) {
      this.showMessage("Error: Please enter a 6-digit code", "error");
      return;
    }

    if (!/^[0-9]{6}$/.test(code)) {
      this.showMessage("Error: Code must contain only numbers", "error");
      return;
    }

    try {
      const response = await fetch(`${TWOFA_API.DISABLE}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: code }),
      });

      const data = await response.json();

      if (response.ok) {
        this.showMessage("2FA disabled successfully", "success");
        // Notifier l'application que 2FA a été désactivée
        try {
          document.dispatchEvent(new CustomEvent("twofa-disabled"));
        } catch (e) {
          console.warn("Could not dispatch twofa-disabled event", e);
        }
        setTimeout(() => this.hide(), 1200);
      } else {
        this.showMessage(
          `Error: ${escapeHtml(data.error || "Invalid code")}`,
          "error",
        );
      }
    } catch (error) {
      this.showMessage("Network error", "error");
      console.error("2FA disable error:", error);
    }
  }

  // Passer sans activer 2FA
  private skip(): void {
    this.hide();
    AuthManager.logout();
    // const router = getRouter();
    // if (router) {
    //   router.navigate("/login");
    // }
  }

  // Afficher un message dans le modal
  private showMessage(
    message: string,
    type: "success" | "error" | "info",
  ): void {
    const messageDiv = document.getElementById("qr-modal-message");
    if (!messageDiv) return;

    const colors = {
      success: "text-green-400",
      error: "text-red-400",
      info: "text-yellow-400",
    };

    messageDiv.innerHTML = `<div class="${colors[type]}">> ${escapeHtml(message)}</div>`;
  }

  // Effacer le message
  private clearMessage(): void {
    const messageDiv = document.getElementById("qr-modal-message");
    if (messageDiv) {
      messageDiv.innerHTML = "";
    }
  }

  // Cacher le modal
  public hide(): void {
    const modal = document.getElementById("qr-modal");
    if (modal) {
      modal.classList.add("hidden");
    }
  }
}
