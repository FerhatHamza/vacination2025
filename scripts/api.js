const API_BASE = "https://vacination2025-api.ferhathamza17.workers.dev"; 

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
export async function saveDailyReport({ user_id, date, age_65_no_chronic, age_65_with_chronic, chronic_adults, chronic_children, pregnant_women, health_staff, pilgrims, others, total_vaccinated, vaccines_administered }) {
  return await request("/api/saveDaily", "POST", {
    user_id: user_id,
    date: date,
    age_65_no_chronic: age_65_no_chronic,
    age_65_with_chronic: age_65_with_chronic,
    chronic_adults: chronic_adults,
    chronic_children: chronic_children,
    pregnant_women: pregnant_women,
    health_staff: health_staff,
    pilgrims: pilgrims,
    others: others,
    total_vaccinated: total_vaccinated,
    vaccines_administered: vaccines_administered
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
export async function fetchReports(user_id) {
  return await request(`/api/getDailyReports?user_id=${user_id}`, "GET");
}

/*
    GET DAILY TOTAL 
*/

export async function getDailyTotal(userId) {
  return await request(`/api/dailyReports/totals?user_id=${userId}`, "GET");
}
export async function saveSetup(userId, centres, equipes, vaccines) {

  return await request("/api/setupCount", "POST", {
    user_id: userId,
    centres_count: centres,
    equipes_count: equipes,
    vaccines_received: vaccines,
  });
}

// ----------------------------
// ADMIN STATS
// ----------------------------
export async function getAdminStats() {
  return await request("/api/status", "GET");
}
export async function getAdminStats2() {
  return await request("/api/statusByUsername", "GET");
}
// ----------------------------
// HEALTH CHECK
// ----------------------------
export async function checkHealth() {
  return await request("/api/health", "GET");
}
