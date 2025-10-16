const apiBase = "https://paramedberriane-api.ferhathamza17.workers.dev";

document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
});


function checkAccess(requiredRole) {
  console.log("its verify");
  const role = localStorage.getItem("role");
  const etab = localStorage.getItem("etablissement");

  if (!role || !etab) {
    window.location.href = "index.html";
    return;
  }

  if (requiredRole === "admin" && role !== "admin") {
    window.location.href = "index.html";
  }

  if (requiredRole === "coordinateur" && role !== "coordinateur") {
    window.location.href = "index.html";
  }
}

async function initDashboard() {
  checkAccess("admin");

  const res = await fetch(`${apiBase}/api/admin/stats`);
  const data = await res.json();

  // --- Totals ---
  document.getElementById("totalReçue").textContent = data.totalReçue;
  document.getElementById("totalAdmin").textContent = data.totalAdmin;
  document.getElementById("totalRestante").textContent = data.totalRestante;
  document.getElementById("totalVaccines").textContent = data.totalVaccines;

  // --- Table ---
  const tbody = document.querySelector("#tableDetails tbody");
  tbody.innerHTML = "";
  data.etabs.forEach(e => {
    const tr = document.createElement("tr");
    const rate = e.reçue ? Math.round((e.administree / e.reçue) * 100) : 0;
    tr.innerHTML = `
      <td>${e.nom}</td>
      <td>${e.total}</td>
      <td>${e.reçue}</td>
      <td>${e.administree}</td>
      <td>${e.restante}</td>
      <td>${rate}%</td>
    `;
    tbody.appendChild(tr);
  });

  // --- Charts ---
  drawCharts(data);
}

function drawCharts(data) {
  // 1️⃣ Bar chart per établissement
  const ctx1 = document.getElementById("chartEtab");
  new Chart(ctx1, {
    type: "bar",
    data: {
      labels: data.etabs.map(e => e.nom),
      datasets: [
        {
          label: "Personnes vaccinées",
          data: data.etabs.map(e => e.total),
          backgroundColor: "rgba(54, 162, 235, 0.7)",
        },
      ],
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
    },
  });

  // 2️⃣ Pie chart for vaccinated categories
  const ctx2 = document.getElementById("chartCategories");
  new Chart(ctx2, {
    type: "pie",
    data: {
      labels: Object.keys(data.categories),
      datasets: [
        {
          data: Object.values(data.categories),
          backgroundColor: [
            "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f", "#edc949", "#af7aa1", "#ff9da7"
          ],
        },
      ],
    },
  });
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}
