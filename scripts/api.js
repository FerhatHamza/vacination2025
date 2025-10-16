const API_BASE = "https://vacination2025-api.ferhathamza17.workers.dev"; // ⬅️ Replace with your actual Worker URL

// Helper for JSON requests
async function request(endpoint, method = "GET", body = null) {
  const headers = { 
    "Content-Type": "application/json" 
  };

  const options = { 
    method, 
    headers 
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    
    if (!response.ok) {
      // إذا كان الرد غير ناجح، حاول تحليل JSON للخطأ
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || "Request failed" };
      }
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

export async function login(username, password) {
  return await request("/api/login", "POST", { username, password });
}

// ----------------------------
// DAILY REPORT
// ----------------------------
export async function saveDailyReport({ etab, date, centres, equipes, vaccines, quantiteAdministree }) {
  return await request("/api/saveDaily", "POST", {
    etab,
    date,
    centres,
    equipes,
    vaccines,
    quantiteAdministree
  });
}

// ----------------------------
// HISTORY
// ----------------------------
export async function getHistory(etab, limit = 30, offset = 0) {
  const params = new URLSearchParams({ etab, limit, offset });
  return await request(`/api/history?${params.toString()}`, "GET");
}

// ----------------------------
// Setup count
// ----------------------------
export async function getsetupCount() {
  return await request(`/api/setupCount`, "GET");
}
export async function saveSetup({userId, centres, equipes, vaccines}) {
  return await request("/api/setup", "POST", {
    userId,
    centres,
    equipes,
    vaccines,
  });
}

// ----------------------------
// ADMIN STATS
// ----------------------------
export async function getAdminStats(token) {
  return await request("/api/admin/stats", "GET", null, token);
}

// ----------------------------
// HEALTH CHECK
// ----------------------------
export async function checkHealth() {
  return await request("/api/health", "GET");
}
