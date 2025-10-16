import { getsetupCount, saveSetup } from './api.js';
import { logoutUser } from './auth.js';

const apiBase = "https://vacination2025-api.ferhathamza17.workers.dev";
const USER_KEY = "userSession";

// تحقق من الصلاحيات عند التحميل
checkAccess("coordinateur");

const logoutBtn = document.getElementById("logoutId");
const saveSetup2 = document.getElementById("saveSetup");

document.addEventListener("DOMContentLoaded", () => {
  initPage();
});

logoutBtn.addEventListener('click', () => {
  logoutUser();
  window.location.href = "index.html";
});

saveSetup2.addEventListener("click", async () => {
  try {
    const user = JSON.parse(localStorage.getItem(USER_KEY));
    if (!user) {
      alert("Utilisateur non connecté");
      return;
    }

    const countSetup = await getsetupCount();
    if (countSetup.total == 0) {
      const centres = parseInt(document.getElementById("centres").value) || 0;
      const equipes = parseInt(document.getElementById("equipes").value) || 0;
      const vaccines = parseInt(document.getElementById("vaccines").value) || 0;

      // تحقق من القيم المدخلة
      if (centres < 0 || equipes < 0 || vaccines < 0) {
        alert("Les valeurs ne peuvent pas être négatives");
        return;
      }

      const res = await saveSetup(user.id, centres, equipes, vaccines);
      if (res.success) { 
        alert("Configuration enregistrée avec succès!");
      } else {
        alert("Erreur lors de l'enregistrement: " + (res.error || "Erreur inconnue"));
      }
    } else {
      alert("Configuration déjà effectuée");
    }
  } catch (error) {
    console.error("Error in saveSetup:", error);
    alert("Erreur lors de l'enregistrement de la configuration");
  }
});

function checkAccess(requiredRole) {
  const user = JSON.parse(localStorage.getItem(USER_KEY));

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  if (requiredRole === "admin" && user.role !== "admin") {
    window.location.href = "index.html";
  }

  if (requiredRole === "coordinateur" && user.role !== "coordinateur") {
    window.location.href = "index.html";
  }
}

function initPage() {
  checkAccess("coordinateur");

  const user = JSON.parse(localStorage.getItem(USER_KEY));
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const etab = user.etab;
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

  // إضافة event listeners لحساب المجموع تلقائياً
  const inputIds = [
    "p65sain", "p65malade", "maladults", "malenfants",
    "enceintes", "sante", "pelerins", "autres", "recue"
  ];

  inputIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', calcTotal);
    }
  });
}

function calcTotal() {
  const ids = [
    "p65sain", "p65malade", "maladults", "malenfants",
    "enceintes", "sante", "pelerins", "autres"
  ];
  
  let total = 0;
  ids.forEach(id => {
    total += parseInt(document.getElementById(id).value) || 0;
  });
  
  document.getElementById("totalVaccines").textContent = total;

  const recue = parseInt(document.getElementById("recue").value) || 0;
  const restante = recue - total;
  
  document.getElementById("administree").value = total;
  document.getElementById("restante").value = restante >= 0 ? restante : 0;
}

async function saveDailyData(e) {
  e.preventDefault();
  
  try {
    const user = JSON.parse(localStorage.getItem(USER_KEY));
    if (!user) {
      alert("Utilisateur non connecté");
      return;
    }

    const etab = user.etab;
    const date = new Date().toISOString().split("T")[0];

    // تجميع بيانات اللقاحات في كائن واحد
    const vaccines = {
      p65sain: parseInt(document.getElementById("p65sain").value) || 0,
      p65malade: parseInt(document.getElementById("p65malade").value) || 0,
      maladults: parseInt(document.getElementById("maladults").value) || 0,
      malenfants: parseInt(document.getElementById("malenfants").value) || 0,
      enceintes: parseInt(document.getElementById("enceintes").value) || 0,
      sante: parseInt(document.getElementById("sante").value) || 0,
      pelerins: parseInt(document.getElementById("pelerins").value) || 0,
      autres: parseInt(document.getElementById("autres").value) || 0
    };

    const data = {
      etab: etab,
      date: date,
      centres: parseInt(document.getElementById("centres").value) || 0,
      equipes: parseInt(document.getElementById("equipes").value) || 0,
      vaccines: vaccines,
      quantiteAdministree: parseInt(document.getElementById("administree").value) || 0
    };

    // التحقق من البيانات قبل الإرسال
    if (data.centres < 0 || data.equipes < 0 || data.quantiteAdministree < 0) {
      alert("Les nombres ne peuvent pas être négatifs");
      return;
    }

    const res = await fetch(`${apiBase}/api/saveDaily`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (res.ok && result.success) {
      alert("Données enregistrées avec succès !");
      // يمكنك إعادة تعيين النموذج هنا إذا أردت
      // resetForm();
    } else {
      alert("Erreur d'enregistrement: " + (result.error || "Erreur inconnue"));
    }
  } catch (error) {
    console.error("Error saving daily data:", error);
    alert("Erreur lors de l'enregistrement des données");
  }
}

// دالة مساعدة لإعادة تعيين النموذج (اختياري)
function resetForm() {
  const inputs = document.querySelectorAll('input[type="number"]');
  inputs.forEach(input => {
    if (input.id !== 'recue') { // لا تعيد تعيين الكمية المستلمة
      input.value = '';
    }
  });
  document.getElementById("totalVaccines").textContent = "0";
  document.getElementById("administree").value = "0";
  document.getElementById("restante").value = document.getElementById("recue").value;
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}
