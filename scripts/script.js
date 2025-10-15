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
    "EHS Ghardaia": "m8#Qp6Lw",
    "EPSP Ghardaia": "7Xr%2bNk",
    "EPSP Metlili": "hP4&z9Yq",
    "EPSP Guerrara": "!T6sV2mB",
    "EPSP Berriane": "R3#kH8uS",
    "EPH Ghardaia": "n5$Gq7Zj",
    "EPH Metlili": "Yt9^4pLm",
    "EPH Guerrara": "2b@Vw6Qx",
    "EPH Berriane": "cK7*R2hZ",
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
