import { logoutUser } from "./auth.js";
import { getAdminStats, getAdminStats2, summaryByPeriod } from "./api.js";

const tauxVaccinations = document.getElementById("tauxVaccinations");
const totalVaccines = document.getElementById("totalVaccines");
const totalRestante = document.getElementById("totalRestante");
const logoutBtn = document.getElementById("logoutId");


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
<<<<<<< Updated upstream
  await getStatus(); // loads charts + stats
  await renderEtabTable(); // fills the table
  await renderStockInitialTable();
=======
  const [status, table] = await Promise.all([
    getStatus(),
    renderEtabTable()
  ]);
  return { status, table };
>>>>>>> Stashed changes
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
  const total = Number(result.summary.total_vaccinated) || 0;
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


function getUtilisationColor(value) {
  const percent = Math.min(Math.max(value, 0), 1);
  const hue = percent * 120; // 0 (red) → 120 (green)
  return { css: `hsl(${hue}, 100%, 45%)` };
}

function getTextColor({ r, g, b }) {
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 140 ? "#000" : "#fff"; // black for light bg, white for dark
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

      const summaryRes = await summaryByPeriod();
      const summaryData = summaryRes.data;
      console.log('summaryData:: ', summaryData.users);


      if (!summaryData || !Array.isArray(summaryData.users)) {
        console.warn("⚠️ Aucun utilisateur trouvé dans summaryData");
        return;
      }

      summaryData.users.forEach(item => {
        const row = document.createElement("tr");
        const received = vaccinesReceived[item.username] || 0;
        const utilisation = received > 0 ? item.grandTotal_total_vaccinated / received : 0;

        const colorData = getUtilisationColor(utilisation)
        const textColor = getTextColor(colorData);

        row.innerHTML = `
          <td>${item.username}</td>
          <td>${item.summary.today}</td>
          <td>${item.summary.threeDaysLater}</td>
          <td>${item.summary.thisWeek}</td>
          <td>${item.summary.thisMonth}</td>
          <td>${item.grandTotal_total_vaccinated}</td>
          <td style="
            font-weight: bold;
            background-color: ${colorData.css};;
            color: ${textColor};
            text-align: center;
            border-radius: 6px;
            transition: 0.3s ease;
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


<<<<<<< Updated upstream











// 📈 Charts rendering
=======
>>>>>>> Stashed changes
function dessinerGraphiques(data) {
  if (!data || !data.etabs || !data.categories) {
    console.error("❌ Données invalides passées à dessinerGraphiques");
    return;
  }

  const creerGraphique = (id, type, chartData, options = {}) => {
    const ctx = document.getElementById(id);
    if (!ctx) {
      console.warn(`⚠️ Élément #${id} non trouvé`);
      return;
    }

    // تدمير المخطط السابق إذا موجود
    if (ctx.chartInstance) {
      ctx.chartInstance.destroy();
    }

    const defaults = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: { size: 13 },
          bodyFont: { size: 13 },
          padding: 12,
          cornerRadius: 8
        }
      }
    };

    ctx.chartInstance = new Chart(ctx, {
      type,
      data: chartData,
      options: { ...defaults, ...options },
    });
  };

  // 🏥 رسم بياني للمؤسسات - أعمدة أفقية
  const maxEtab = Math.max(...data.etabs.map(e => e.total));
  const etabColors = data.etabs.map(etab => {
    const percentage = etab.total / maxEtab;
    return getUtilisationColor(percentage).css;
  });

  creerGraphique(
    "chartEtab",
    "bar",
    {
      labels: data.etabs.map(e => e.nom),
      datasets: [
        {
          label: "Personnes vaccinées",
          data: data.etabs.map(e => e.total),
          backgroundColor: etabColors,
          borderColor: etabColors.map(color => color.replace('rgb', 'rgba').replace(')', ', 1)')),
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    {
      indexAxis: 'y', // أعمدة أفقية
      plugins: {
        title: {
          display: true,
          text: "Nombre de personnes vaccinées par établissement",
          font: { size: 16, weight: 'bold' },
          padding: 20
        },
        legend: { display: false }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            font: { size: 12 }
          },
          grid: { color: 'rgba(0,0,0,0.1)' }
        },
        y: {
          ticks: {
            font: { size: 13 },
            autoSkip: false
          },
          grid: { display: false }
        }
      }
    }
  );

  // 👥 رسم بياني للفئات - دائري مع تدرج لوني
  const categoriesArray = Object.entries(data.categories);
  const totalCategories = Object.values(data.categories).reduce((a, b) => a + b, 0);

  // ألوان متدرجة للفئات المختلفة
  const categoryColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
  ];

  creerGraphique(
    "chartCategories",
    "doughnut", // دائري مجوف
    {
      labels: categoriesArray.map(([name]) => name),
      datasets: [
        {
          data: categoriesArray.map(([, value]) => value),
          backgroundColor: categoryColors,
          borderColor: 'white',
          borderWidth: 3,
          hoverBorderWidth: 4,
          hoverOffset: 8
        },
      ],
    },
    {
      plugins: {
        title: {
          display: true,
          text: "Répartition par catégorie de population",
          font: { size: 16, weight: 'bold' },
          padding: 20
        },
        legend: {
          position: 'right',
          labels: {
            generateLabels: function (chart) {
              const data = chart.data;
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const percentage = ((value / totalCategories) * 100).toFixed(1);
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].borderColor[i],
                  lineWidth: data.datasets[0].borderWidth,
                  pointStyle: 'circle',
                  hidden: false,
                  index: i
                };
              });
            }
          }
        }
      },
      cutout: '50%', // لجعل الرسم بياني مجوفاً
      animation: {
        animateScale: true,
        animateRotate: true
      }
    }
  );

  // 📊 إضافة إحصائيات إضافية
  afficherStatistiques(data);
}

function afficherStatistiques(data) {
  const statsContainer = document.getElementById('statsContainer');
  if (!statsContainer) return;

  const totalVaccines = data.etabs.reduce((sum, etab) => sum + etab.total, 0);
  const etablissementsCount = data.etabs.length;
  const categoriesCount = Object.keys(data.categories).length;

  statsContainer.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">${totalVaccines.toLocaleString()}</div>
        <div class="stat-label">Total vaccinés</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${etablissementsCount}</div>
        <div class="stat-label">Établissements</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${categoriesCount}</div>
        <div class="stat-label">Catégories</div>
      </div>
    </div>
  `;
}

// إضافة CSS للتحسين البصري
const style = document.createElement('style');
style.textContent = `
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin: 2rem 0;
  }
  
  .stat-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1.5rem;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  }
  
  .stat-number {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  
  .stat-label {
    font-size: 0.9rem;
    opacity: 0.9;
  }
  
  .chart-container {
    position: relative;
    margin: 2rem 0;
    padding: 1rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
`;
document.head.appendChild(style);