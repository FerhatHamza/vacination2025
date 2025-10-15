function login() {
  const etablissement = document.getElementById("etablissement").value;
  const password = document.getElementById("password").value;

  if (!etablissement || !password) {
    alert("Veuillez remplir tous les champs !");
    return;
  }

  // Admin
  if (etablissement === "Admin" && password === "admin") {
    localStorage.setItem("role", "admin");
    localStorage.setItem("etablissement", "Admin");
    window.location.href = "dashboard.html";
    return;
  }

  // Coordinateurs and their passwords
  const credentials = {
    "EHS Ghardaia": "ehs2025",
    "EPSP Ghardaia": "epspghardaia2025",
    "EPSP Metlili": "epspmetlili2025",
    "EPSP Guerrara": "epspguerrara2025",
    "EPSP Berriane": "epspberriane2025",
    "EPH Ghardaia": "ephghardaia2025",
    "EPH Metlili": "ephmetlili2025",
    "EPH Guerrara": "ephguerrara2025",
    "EPH Berriane": "ephberriane2025",
  };

  if (credentials[etablissement] && credentials[etablissement] === password) {
    localStorage.setItem("role", "coordinateur");
    localStorage.setItem("etablissement", etablissement);
    window.location.href = "daily.html";
  } else {
    alert("Identifiants incorrects !");
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
