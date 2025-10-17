import { getsetupCount, saveSetup, saveDailyReport, getDailyTotal, fetchReports } from './api.js';
import { logoutUser } from './auth.js';
const apiBase = "https://vacination2025-api.ferhathamza17.workers.dev";
checkAccess("coordinateur");

const centresElement = document.getElementById("centres")
const equipesElement = document.getElementById("equipes")
const vaccinesElement = document.getElementById("vaccines")
const saveDailyElement = document.getElementById("saveDaily")
const totalVaccines = document.getElementById("totalVaccines")
const administree = document.getElementById("administree")
const restanteEle = document.getElementById("restante")
const recue = document.getElementById("recue")

const stockData = {
  "DSP Ghardaia": 10000,
  "EHS Ghardaia": 200,
  "EPSP Ghardaia": 4000,
  "EPSP Metlili": 2000,
  "EPSP Guerrara": 2000,
  "EPSP Berriane": 800,
  "EPH Ghardaia": 400,
  "EPH Metlili": 200,
  "EPH Guerrara": 200,
  "EPH Berriane": 200
};


var totalVa = 0;
const logoutBtn = document.getElementById("logoutId");

logoutBtn.addEventListener('click', () => {
  logoutUser();
  window.location.href = "index.html";
});

const saveSetup2 = document.getElementById("saveSetup");

document.addEventListener("DOMContentLoaded", () => {
  initPage();

  const ids = [
    "p65sain", "p65malade", "maladults", "malenfants",
    "enceintes", "sante", "pelerins", "autres"
  ];

  // Loop through all input IDs and attach the same event listener
  ids.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("input", calcTotal); // "input" fires immediately on change
    }
  });
});

// save daily data
saveDailyElement.addEventListener("click", () => {
  saveDailyData();
});
const USER_KEY = "userSession";
const role = JSON.parse(localStorage.getItem(USER_KEY));

saveSetup2.addEventListener("click", async () => {

  const id = role.id;
  const cent = centresElement.value;
  const equip = document.getElementById("equipes").value;
  const vacc = document.getElementById("vaccines").value;


  const res = await saveSetup(id, cent, equip, vacc);
  if (res.success) {
    location.reload();
  }
  else { console.log(res) }
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

async function initPage() {
  checkAccess("coordinateur");
  calcTotal();
  loadHistory();
  const res = await getsetupCount();
  if (!res.exists) {

    centresElement.disabled = false;
    equipesElement.disabled = false;
    vaccinesElement.disabled = false;
    saveSetup2.hidden = false;
  } else {
    centresElement.value = res.data.centres_count;
    equipesElement.value = res.data.equipes_count;

    centresElement.disabled = true;
    equipesElement.disabled = true;
    saveSetup2.hidden = true;
  }

  const res2 = await getDailyTotal(role.id);
  if (res2.success) {


    totalVaccines.textContent = res2.data.grand_total == null ? '0' : res2.data.grand_total;
    administree.value = res2.data.grand_total == null ? '0' : res2.data.grand_total;
    totalVa = res2.data.grand_total;

  }

  const USER_KEY = "userSession";
  const user = JSON.parse(localStorage.getItem(USER_KEY));
  const etab = user.Etab;
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

  document.getElementById("recue").value = predefined[etab] || 0;
  vaccinesElement.value = predefined[etab] || 0;
  vaccinesElement.disabled = true;
  // loadHistory();
}

function calcTotal() {
  const ids = [
    "p65sain", "p65malade", "maladults", "malenfants",
    "enceintes", "sante", "pelerins", "autres"
  ];

  let total = ids.reduce((sum, id) => {
    const val = parseInt(document.getElementById(id)?.value) || 0;
    return sum + val;
  }, 0);

  document.getElementById("totalVaccinesAj").textContent = total;

  const recueInput = document.getElementById("recue");
  const administreeInput = document.getElementById("administree");
  const restanteInput = document.getElementById("restante");
  const recue = parseInt(recueInput?.value) || 0;

  total += parseInt(document.getElementById('totalVaccines').textContent);
  const restante = Math.max(0, recue - total);

  // ✅ تحديث القيم
  if (administreeInput) administreeInput.value = total;
  if (restanteInput) restanteInput.value = restante;

  // ✅ تحقق من وجود خلل
  if (recue - total < 0) {
    saveDailyElement.disabled = true; // تعطيل زر الحفظ
    saveDailyElement.classList.add('errorBtn');
    restanteInput.classList.add("error");
    showErrorMessage("La quantité utilisée dépasse la quantité reçue, veuillez vérifier les données ⚠️!");
  } else {
    saveDailyElement.disabled = false; // إعادة التفعيل
    saveDailyElement.classList.remove('errorBtn');
    restanteInput.classList.remove("error");
    hideErrorMessage();
  }
}



async function saveDailyData() {

  const user = JSON.parse(localStorage.getItem("userSession"));
  const etab = user.Etab
  const date = new Date().toISOString().split("T")[0];

  console.log('date is ', date);

  const existingReports = await fetchReports(user.id);
  console.log('existingReports is ', existingReports);
  if (existingReports.success) {
    const todayExists = existingReports.data.some(
      report => report.date === date
    );

    if (todayExists) {
      alert("⛔ Vous avez déjà enregistré les données pour aujourd’hui !");
      return;
    }
  }

  const age_65_no_chronic = document.getElementById("p65sain").value
  const age_65_with_chronic = document.getElementById("p65malade").value
  const chronic_adults = document.getElementById("maladults").value
  const chronic_children = document.getElementById("malenfants").value
  const pregnant_women = document.getElementById("enceintes").value
  const health_staff = document.getElementById("sante").value
  const pilgrims = document.getElementById("pelerins").value
  const others = document.getElementById("autres").value
  const total_vaccinated = document.getElementById("totalVaccinesAj").textContent
  const vaccines_administered = document.getElementById("administree").value

  const fields = [
    age_65_no_chronic,
    age_65_with_chronic,
    chronic_adults,
    chronic_children,
    pregnant_women,
    health_staff,
    pilgrims,
    others,
    vaccines_administered
  ];

  const invalidField = fields.some(f => {
    const trimmed = String(f).trim();
    if (trimmed === '') return true;
    const num = Number(trimmed);
    return isNaN(num) || num < 0;
  });

  if (invalidField) {
    alert('Veuillez saisir des valeurs valides (0 ou plus).');
    return;
  }
  const data = {
    user_id: user.id,
    date: date,
    age_65_no_chronic: parseInt(age_65_no_chronic),
    age_65_with_chronic: parseInt(age_65_with_chronic),
    chronic_adults: parseInt(chronic_adults),
    chronic_children: parseInt(chronic_children),
    pregnant_women: parseInt(pregnant_women),
    health_staff: parseInt(health_staff),
    pilgrims: parseInt(pilgrims),
    others: parseInt(others),
    total_vaccinated: parseInt(total_vaccinated),
    vaccines_administered: parseInt(vaccines_administered),
  };


  const res = await saveDailyReport(data);

  if (res.success) {
    alert("Données enregistrées avec succès !");
    location.reload();
    // loadHistory();
  } else {
    console.log(res);
    // alert("Erreur d’enregistrement.");
  }
}

async function loadHistory() {
  try {
    const user = JSON.parse(localStorage.getItem("userSession"));

    const response = await fetchReports(user.id);
    const result = response.data;


    if (!response.success) {
      alert('Failed to fetch reports');
      return;
    }

    const tableBody = document.querySelector('#reportsTable tbody');
    tableBody.innerHTML = ''; // clear previous data

    result.forEach(report => {
      const row = document.createElement('tr');

      row.innerHTML = `
            <td>${report.user_id || ''}</td>
            <td>${report.date || ''}</td>
            <td>${report.age_65_no_chronic || 0}</td>
            <td>${report.age_65_with_chronic || 0}</td>
            <td>${report.chronic_adults || 0}</td>
            <td>${report.chronic_children || 0}</td>
            <td>${report.pregnant_women || 0}</td>
            <td>${report.health_staff || 0}</td>
            <td>${report.pilgrims || 0}</td>
            <td>${report.others || 0}</td>
            <td>${report.total_vaccinated || 0}</td>
          `;

      tableBody.appendChild(row);
    });

  } catch (err) {
    console.error('Error fetching reports:', err);
  }
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}


// error handle 
function showErrorMessage(message) {
  let alertBox = document.getElementById("alert-box");
  if (!alertBox) {
    alertBox = document.createElement("div");
    alertBox.id = "alert-box";
    alertBox.style.cssText = `
      background: #ffe6e6;
      color: #b30000;
      padding: 12px;
      margin-top: 10px;
      border: 1px solid #ff9999;
      border-radius: 8px;
      text-align: center;
      font-weight: bold;
    `;
    document.getElementById("errors")?.prepend(alertBox);
  }
  alertBox.textContent = message;
  alertBox.style.display = "block";
}

function hideErrorMessage() {
  const alertBox = document.getElementById("alert-box");
  if (alertBox) alertBox.style.display = "none";
}
