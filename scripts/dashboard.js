import { logoutUser } from "./auth.js";
import { getAdminStats, getAdminStats2 } from "./api.js";

const tauxVaccinations = document.getElementById("tauxVaccinations")
const totalVaccines = document.getElementById("totalVaccines")
const totalRestante = document.getElementById("totalRestante")

const apiBase = "https://vacination2025-api.ferhathamza17.workers.dev";
checkAccess("admin");
const logoutBtn = document.getElementById("logoutId");

logoutBtn.addEventListener('click', () => {
  logoutUser();
  window.location.href = "index.html";
});

document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
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

async function initDashboard() {
  checkAccess("admin");
  getStatus();
  renderEtabTable();
  // const data = await getAdminStats();
  // console.log('data is: ', data);

  // --- Totals ---
  // document.getElementById("totalReçue").textContent = data.summary.totalRecue;
  // document.getElementById("totalAdmin").textContent = data.summary.totalAdmin;
  // document.getElementById("totalRestante").textContent = data.summary.totalRestante;
  // document.getElementById("totalVaccines").textContent = data.summary.totalVaccines;

  // // --- Table ---
  // const tbody = document.querySelector("#tableDetails tbody");
  // tbody.innerHTML = "";
  // data.etabs.forEach(e => {
  //   const tr = document.createElement("tr");
  //   const rate = e.reçue ? Math.round((e.administree / e.reçue) * 100) : 0;
  //   tr.innerHTML = `
  //     <td>${e.nom}</td>
  //     <td>${e.total}</td>
  //     <td>${e.reçue}</td>
  //     <td>${e.administree}</td>
  //     <td>${e.restante}</td>
  //     <td>${rate}%</td>
  //   `;
  //   tbody.appendChild(tr);
  // });

  // // --- Charts ---
  // drawCharts(data);
}

function dessinerGraphiques(data) {
  if (!data || !data.etabs || !data.categories) {
    console.error("❌ Données invalides passées à dessinerGraphiques");
    return;
  }

  // Fonction utilitaire pour créer un graphique en toute sécurité
  const creerGraphique = (id, type, chartData, options = {}) => {
    const ctx = document.getElementById(id);
    if (!ctx) return;

    // Détruire le graphique précédent s’il existe
    if (ctx.chartInstance) {
      ctx.chartInstance.destroy();
    }

    ctx.chartInstance = new Chart(ctx, {
      type,
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          title: { display: !!options.title, text: options.title },
        },
        ...options,
      },
    });
  };

  // 📊 1️⃣ Graphique en barres – Total par établissement
  creerGraphique("chartEtab", "bar", {
    labels: data.etabs.map(e => e.nom),
    datasets: [
      {
        label: "Total des personnes vaccinées",
        data: data.etabs.map(e => e.total),
        backgroundColor: "rgba(54, 162, 235, 0.7)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  }, {
    title: "Nombre de personnes vaccinées par établissement",
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  });

  // 🥧 2️⃣ Graphique en secteurs – Répartition par catégories
  creerGraphique("chartCategories", "pie", {
    labels: Object.keys(data.categories),
    datasets: [
      {
        label: "Catégories de personnes",
        data: Object.values(data.categories),
        backgroundColor: [
          "#4e79a7", "#f28e2b", "#e15759", "#76b7b2",
          "#59a14f", "#edc949", "#af7aa1", "#ff9da7",
        ],
        borderColor: "#fff",
        borderWidth: 1,
      },
    ],
  }, {
    title: "Répartition des personnes vaccinées par catégorie",
  });
}

// function drawCharts(data) {
//   // 1️⃣ Bar chart per établissement
//   const ctx1 = document.getElementById("chartEtab");
//   new Chart(ctx1, {
//     type: "bar",
//     data: {
//       labels: data.etabs.map(e => e.nom),
//       datasets: [
//         {
//           label: "Personnes vaccinées",
//           data: data.etabs.map(e => e.total),
//           backgroundColor: "rgba(54, 162, 235, 0.7)",
//         },
//       ],
//     },
//     options: {
//       responsive: true,
//       scales: { y: { beginAtZero: true } },
//     },
//   });

//   // 2️⃣ Pie chart for vaccinated categories
//   const ctx2 = document.getElementById("chartCategories");
//   new Chart(ctx2, {
//     type: "pie",
//     data: {
//       labels: Object.keys(data.categories),
//       datasets: [
//         {
//           data: Object.values(data.categories),
//           backgroundColor: [
//             "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f", "#edc949", "#af7aa1", "#ff9da7"
//           ],
//         },
//       ],
//     },
//   });
// }

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}


async function getStatus() {
  const response = await getAdminStats();
  const result = response;
  const response2 = await getAdminStats2();
  console.log('response2 status:: ', response2);
  dessinerGraphiques({
    etabs: response2.data.map(r => ({
      nom: r.username,
      total: r.grand_total
    })),
    categories: {
      '≥65 ans sains': result.summary.total_age_65_no_chronic,
      '≥65 ans malades': result.summary.total_age_65_with_chronic,
      'Chroniques adultes': result.summary.total_chronic_adults,
      'Chroniques enfants': result.summary.total_chronic_children,
      'Femmes enceintes': result.summary.total_pregnant_women,
      'Santé': result.summary.total_health_staff,
      'Pèlerins': result.summary.total_pilgrims,
      'Autres': result.summary.total_others
    }
  });


async function renderEtabTable() {
  const response = await getAdminStats2();
  const etabs = response.data;
  const tableContainer = document.createElement("section");
  tableContainer.className = "table-section";
  tableContainer.innerHTML = `
    <h3>Statistiques par Établissement</h3>
    <table class="etab-table">
      <thead>
        <tr>
          <th>Établissement</th>
          <th>Aujourd’hui</th>
          <th>3 derniers jours</th>
          <th>Cette semaine</th>
          <th>Ce mois-ci</th>
          <th>% Utilisation</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;
  document.querySelector(".container").appendChild(tableContainer);

  const tbody = tableContainer.querySelector("tbody");
  etabs.forEach(e => {
    const ratio = e.vaccines_received ? e.grand_total / e.vaccines_received : 0;
    let colorClass = ratio >= 2/3 ? "green" : ratio >= 2/5 ? "yellow" : "red";
    const row = document.createElement("tr");
    row.className = colorClass;
    row.innerHTML = `
      <td>${e.username}</td>
      <td>${e.today_total ?? 0}</td>
      <td>${e.last3days_total ?? 0}</td>
      <td>${e.week_total ?? 0}</td>
      <td>${e.month_total ?? 0}</td>
      <td>${(ratio * 100).toFixed(1)}%</td>
    `;
    tbody.appendChild(row);
  });
}







  




  if (!response.success || !result.summary) {
    alert('Failed to fetch reports');
    return;
  }

  const total = Number(result.summary.total_vaccines_administered) || 0;
  const target = 10000; // الهدف الكلي
  const restante = target - total;
  const percentage = (total / target) * 100;

  totalVaccines.textContent = total.toLocaleString(); // عرض الرقم منسق
  totalRestante.textContent = restante.toLocaleString();
  console.log(percentage);
  tauxVaccinations.textContent = `${percentage.toFixed(2)}%`; // عرض النسبة بشكل جميل
}










