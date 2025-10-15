const API_BASE = "https://your-worker-url.workers.dev"; // ⬅️ Replace with your actual Worker URL

// Helper for JSON requests
async function request(endpoint, method = "GET", body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

// ----------------------------
// AUTHENTICATION
// ----------------------------
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
