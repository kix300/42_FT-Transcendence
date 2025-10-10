
export async function verifyAuth(router: any): Promise<boolean>{
  
  console.log("🕵️ Verification de l'authentification:");
  
  const token = localStorage.getItem("auth_token");
  if (!token) {
	router.navigate("/login");
	return false;
  }

  try {
    const response = await fetch("/api/me", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      // Token expiré ou invalide
      console.warn("⚠️ Token expiré ou invalide");
      localStorage.removeItem("auth_token");
	  router.navigate("/login");
	  return false;
    }
	console.log("✅ Token valide:", token);
	return true;
  } catch (error) {
    console.error("Erreur de vérification du token :", error);
    localStorage.removeItem("auth_token");
    router.navigate("/login");
	return false;
  }
}
