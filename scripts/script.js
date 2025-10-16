import { loginUser, logoutUser, getCurrentUser, isAuthenticated } from "./auth.js";
const loginBtn = document.getElementById("loginBtn");
const errorP = document.getElementById("errorId");

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
    if (user.role === "admin") {
      window.location.href = "dashboard.html";
    } else {
      window.location.href = "daily.html";
    }

  } catch (error) {
    errorP.textContent = error.message;
    console.error("❌ Login failed:", error.message);
  }

}

function checkAccess(requiredRole) {
  const USER_KEY = "userSession";
  const role = JSON.parse(localStorage.getItem(USER_KEY));

  if (!role) {
    window.location.href = "index.html";
    return;
  }

  if (requiredRole === "admin" && role.role !== "admin") {
    window.location.href = "index.html";
  }

  if (requiredRole === "coordinateur" && role.role !== "coordinateur") {
    window.location.href = "index.html";
  }
}
