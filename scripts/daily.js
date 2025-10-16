const apiBase = "https://paramedberriane-api.ferhathamza17.workers.dev";
checkAccess("coordinateur");

document.addEventListener("DOMContentLoaded", () => {
  initPage();
});

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

function initPage() {
  checkAccess("coordinateur");

  const etab = localStorage.getItem("etablissement");
  document.getElementById("etabName").textContent = etab;
  document.getElementById("today").textContent = new Date().toLocaleDateString("fr-DZ");

  // Pré-remplir la quantité reçue selon l'établissement
  const predefined = {
    "EHS Ghardaia": 200,
    "EPSP Ghardaia": 4000,
    "EPSP Metlili": 2000,
    "EPSP Guerrara": 2000,
    "EPSP Berriane": 800,
    "EPH Ghardaia": 400,
    "EPH Metlili": 200,
    "EPH Guerrara": 200,
    "EPH Berriane": 200,
  };
  document.getElementById("reçue").value = predefined[etab] || 0;

  loadHistory();
}

function calcTotal() {
  const ids = [
    "p65sain", "p65malade", "maladults", "malenfants",
    "enceintes", "sante", "pelerins", "autres"
  ];
  let total = ids.reduce((sum, id) => sum + (parseInt(document.getElementById(id).value) || 0), 0);
  document.getElementById("totalVaccines").textContent = total;

  const reçue = parseInt(document.getElementById("reçue").value);
  const restante = reçue - total;
  document.getElementById("administree").value = total;
  document.getElementById("restante").value = restante >= 0 ? restante : 0;
}

async function saveDailyData(e) {
  e.preventDefault();
  const etab = localStorage.getItem("etablissement");
  const date = new Date().toISOString().split("T")[0];

  const data = {
    etablissement: etab,
    date,
    centres: parseInt(document.getElementById("centres").value || 0),
    equipes: parseInt(document.getElementById("equipes").value || 0),
    p65sain: parseInt(document.getElementById("p65sain").value || 0),
    p65malade: parseInt(document.getElementById("p65malade").value || 0),
    maladults: parseInt(document.getElementById("maladults").value || 0),
    malenfants: parseInt(document.getElementById("malenfants").value || 0),
    enceintes: parseInt(document.getElementById("enceintes").value || 0),
    sante: parseInt(document.getElementById("sante").value || 0),
    pelerins: parseInt(document.getElementById("pelerins").value || 0),
    autres: parseInt(document.getElementById("autres").value || 0),
    total: parseInt(document.getElementById("totalVaccines").textContent || 0),
    reçue: parseInt(document.getElementById("reçue").value || 0),
    administree: parseInt(document.getElementById("administree").value || 0),
    restante: parseInt(document.getElementById("restante").value || 0),
  };

  const res = await fetch(`${apiBase}/api/saveDaily`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (res.ok) {
    alert("✅ Données enregistrées avec succès !");
    loadHistory();
  } else {
    alert("❌ Erreur d’enregistrement.");
  }
}

async function loadHistory() {
  const etab = localStorage.getItem("etablissement");
  const res = await fetch(`${apiBase}/api/history?etab=${encodeURIComponent(etab)}`);
  const data = await res.json();

  const tbody = document.querySelector("#historyTable tbody");
  tbody.innerHTML = "";
  data.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.date}</td>
      <td>${d.total}</td>
      <td>${d.administree}</td>
      <td>${d.restante}</td>
    `;
    tbody.appendChild(tr);
  });
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}
