import { logoutUser } from "./auth.js";
import { getAdminStats, getAdminStats2 } from "./api.js";

const tauxVaccinations = document.getElementById("tauxVaccinations");
const totalVaccines = document.getElementById("totalVaccines");
const totalRestante = document.getElementById("totalRestante");
const logoutBtn = document.getElementById("logoutId");

checkAccess("admin");

logoutBtn.addEventListener("click", () => {
  logoutUser();
  window.location.href = "index.html";
});

document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
});

// 🧩 Access control
function checkAccess(requiredRole) {
  const USER_KEY = "userSession";
  const role = JSON.parse(localStorage.getItem(USER_KEY));

  if (!role || role.role !== requiredRole) {
    window.location.href = "index.html";
  }
}

// 🧠 Main init
async function initDashboard() {
  checkAccess("admin");
  await getStatus(); // loads charts + stats
  await renderEtabTable(); // fills the table
}

// 📊 Render charts + global numbers
async function getStatus() {
  const result = await getAdminStats();
  const response2 = await getAdminStats2();

  if (!result.success || !result.summary) {
    alert("Impossible de charger les statistiques globales");
    return;
  }

  // Update summary cards
  const total = Number(result.summary.total_vaccines_administered) || 0;
  const target = Number(result.summary.total_vaccines_received) || 10000;
  const restante = target - total;
  const percentage = (total / target) * 100;

  totalVaccines.textContent = total.toLocaleString();
  totalRestante.textContent = restante.toLocaleString();
  tauxVaccinations.textContent = `${percentage.toFixed(2)}%`;

  // Draw charts
  dessinerGraphiques({
    etabs: response2.data.map(r => ({
      nom: r.username,
      total: r.grand_total
    })),
    categories: {
      "≥65 ans sains": result.summary.total_age_65_no_chronic,
      "≥65 ans malades": result.summary.total_age_65_with_chronic,
      "Chroniques adultes": result.summary.total_chronic_adults,
      "Chroniques enfants": result.summary.total_chronic_children,
      "Femmes enceintes": result.summary.total_pregnant_women,
      "Santé": result.summary.total_health_staff,
      "Pèlerins": result.summary.total_pilgrims,
      "Autres": result.summary.total_others
    }
  });
}







async function renderEtabTable() {
  try {
    // Fetch global and per-etab data
    const [globalStats, perEtabStats] = await Promise.all([
      getAdminStats(),
      getAdminStats2()
    ]);

    const tableBody = document.querySelector("#vaccTable tbody");
    tableBody.innerHTML = "";

    // Hardcoded received doses
    const vaccinesReceived = {
      "DPS Ghardaia": 200,
      "EHS Ghardaia": 200,
      "EPH Berriane": 200,
      "EPH Ghardaia": 400,
      "EPH Guerrara": 200,
      "EPH Metlili": 200,
      "EPSP Berriane": 800,
      "EPSP Ghardaia": 4000,
      "EPSP Guerrara": 2000,
      "EPSP Metlili": 2000
    };

    if (perEtabStats.success && Array.isArray(perEtabStats.data)) {
      perEtabStats.data.forEach(item => {
        const etab = item.username;
        const vaccinated = item.grand_total || 0;
        const received = vaccinesReceived[etab] || 0;

        const utilisation = received > 0 ? vaccinated / received : 0;

        // color logic
        let bgColor = "#f8d7da"; // red by default
        let textColor = "#000";
        
        if (utilisation >= 2 / 3) {
          bgColor = "#d4edda"; // green background
        } else if (utilisation >= 2 / 5) {
          bgColor = "#fff3cd"; // yellow background
        }
        
        // Build the row
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${etab}</td>
          <td>${vaccinated}</td>
          <td>—</td>
          <td>—</td>
          <td>—</td>
          <td style="
            font-weight: bold; 
            background-color: ${bgColor};
            color: ${textColor};
            text-align: center;
          ">
            ${(utilisation * 100).toFixed(1)} %
          </td>
        `;
        tableBody.appendChild(row);
      });
    }
  } catch (error) {
    console.error("Erreur lors du rendu du tableau:", error);
  }
}

document.addEventListener("DOMContentLoaded", renderEtabTable);






// 📈 Charts rendering
function dessinerGraphiques(data) {
  if (!data || !data.etabs || !data.categories) {
    console.error("❌ Données invalides passées à dessinerGraphiques");
    return;
  }

  const creerGraphique = (id, type, chartData, options = {}) => {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    if (ctx.chartInstance) ctx.chartInstance.destroy();

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

  // 1️⃣ Par établissement
  creerGraphique(
    "chartEtab",
    "bar",
    {
      labels: data.etabs.map(e => e.nom),
      datasets: [
        {
          label: "Personnes vaccinées",
          data: data.etabs.map(e => e.total),
          backgroundColor: "rgba(54, 162, 235, 0.7)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    },
    {
      title: "Nombre de personnes vaccinées par établissement",
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    }
  );

  // 2️⃣ Par catégories
  creerGraphique(
    "chartCategories",
    "pie",
    {
      labels: Object.keys(data.categories),
      datasets: [
        {
          data: Object.values(data.categories),
          backgroundColor: [
            "#4e79a7",
            "#f28e2b",
            "#e15759",
            "#76b7b2",
            "#59a14f",
            "#edc949",
            "#af7aa1",
            "#ff9da7",
          ],
        },
      ],
    },
    { title: "Répartition par catégorie" }
  );
}
