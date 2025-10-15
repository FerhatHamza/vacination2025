// ✨ Connect to your Cloudflare Worker API
const API_BASE = "https://paramedberriane-api.ferhathamza17.workers.dev"; // ✅ تأكد من استخدام https://

const API = {
  // جلب الإحصائيات العامة (لـ admin.html)
  getStats: async () => {
    const resp = await fetch(`${API_BASE}/api/stats`);
    if (!resp.ok) throw new Error("Erreur lors du chargement des stats");
    return await resp.json();
  },

  // جلب قائمة القاعات
  getClasses: async () => {
    const resp = await fetch(`${API_BASE}/api/classes`);
    if (!resp.ok) throw new Error("Erreur lors du chargement des classes");
    return await resp.json();
  },

  // جلب الطلاب حسب رقم القاعة
  getStudentsByClass: async (cls) => {
    const resp = await fetch(`${API_BASE}/api/students?class=${cls}`);
    if (!resp.ok) throw new Error("Erreur lors du chargement des étudiants");
    return await resp.json();
  },

  // حفظ الغياب والحضور
  saveAttendance: async (classNum, students) => {
    console.log(students);
    const resp = await fetch(`${API_BASE}/api/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ class: classNum, students }),
    });
    if (!resp.ok) throw new Error("Erreur lors de l'enregistrement des présences");
    return await resp.json();
  },

  getReady2: async () => {
    const resp2 = await fetch(`${API_BASE}/api/choices/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!resp2.ok) throw new Error("Erreur tarzi");
    return await resp2.json();
  },
  // GET REDY 
  getReady: async () => {
    const resp = await fetch(`${API_BASE}/api/attendance/all`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    
    if (!resp.ok) throw new Error("Erreur tarzi");
    
    return await resp.json();
  },
};
