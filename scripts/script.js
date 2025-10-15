import { loginUser, logoutUser, getCurrentUser, isAuthenticated } from "./auth.js";
const loginBtn = document.getElementById("loginBtn");
const errorP = document.getElementById("error");

loginBtn.addEventListener('click', login)

async function login() {
  const etablissement = document.getElementById("etablissement").value;
  const password = document.getElementById("password").value;

  if (!etablissement || !password) {
    alert("Veuillez remplir tous les champs !");
    return;
  }

  try {
    console.log(etablissement, password);
    const user = await loginUser(etablissement, password);
    console.log("✅ Logged in:", user);
  } catch (error) {
    errorP.textContent  = error.message;
    console.error("❌ Login failed:", error.message);
  }
  
}

function checkAccess(requiredRole) {
  const role = localStorage.getItem("role");
  const etab = localStorage.getItem("etablissement");

  if (!role || !etab) {
    alert("Session expirée. Veuillez vous reconnecter.");
    window.location.href = "index.html";
    return;
  }

  if (requiredRole === "admin" && role !== "admin") {
    alert("Accès réservé à l'administrateur !");
    window.location.href = "index.html";
  }

  if (requiredRole === "coordinateur" && role !== "coordinateur") {
    alert("Accès réservé aux coordinateurs !");
    window.location.href = "index.html";
  }
}
