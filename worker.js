export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Database reference
    const db = env.DB; // D1 database binding
    const headers = { "Content-Type": "application/json" };

    // Helper to send JSON
    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), { headers, status });

    // Parse body
    let body = {};
    if (method !== "GET") {
      try {
        body = await request.json();
      } catch {}
    }

    // --------------------------
    // LOGIN ENDPOINT
    // --------------------------
    if (path === "/api/login" && method === "POST") {
      const { username, password } = body;

      const user = await db
        .prepare("SELECT * FROM users WHERE username = ? AND password = ?")
        .bind(username, password)
        .first();

      if (!user) return json({ error: "Utilisateur ou mot de passe invalide" }, 401);

      return json({
        id: user.id,
        role: user.role,
        etab: user.etab,
      });
    }

    // --------------------------
    // SAVE DAILY REPORT
    // --------------------------
    if (path === "/api/saveDaily" && method === "POST") {
      const {
        etab,
        date,
        centres,
        equipes,
        vaccines,
        quantiteAdministree,
      } = body;

      // Check if existing entry for that day
      const existing = await db
        .prepare("SELECT id FROM vaccination WHERE etab = ? AND date = ?")
        .bind(etab, date)
        .first();

      if (existing) {
        await db
          .prepare(
            `UPDATE vaccination SET 
              centres=?, equipes=?, data=?, quantiteAdministree=?
            WHERE id=?`
          )
          .bind(
            centres,
            equipes,
            JSON.stringify(vaccines),
            quantiteAdministree,
            existing.id
          )
          .run();
      } else {
        await db
          .prepare(
            `INSERT INTO vaccination (etab, date, centres, equipes, data, quantiteAdministree)
             VALUES (?, ?, ?, ?, ?, ?)`
          )
          .bind(etab, date, centres, equipes, JSON.stringify(vaccines), quantiteAdministree)
          .run();
      }

      return json({ success: true });
    }

    // --------------------------
    // GET HISTORY FOR ONE ETAB
    // --------------------------
    if (path === "/api/history" && method === "GET") {
      const etab = url.searchParams.get("etab");
      const rows = await db
        .prepare("SELECT * FROM vaccination WHERE etab = ? ORDER BY date DESC")
        .bind(etab)
        .all();

      return json(rows.results || []);
    }

    // --------------------------
    // ADMIN GLOBAL STATS
    // --------------------------
    if (path === "/api/admin/stats" && method === "GET") {
      // Fixed received doses
      const reçues = {
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

      const rows = await db.prepare("SELECT * FROM vaccination").all();
      const stats = {};

      rows.results.forEach(r => {
        const data = JSON.parse(r.data);
        const etab = r.etab;
        const total =
          Object.values(data).reduce((a, b) => a + Number(b || 0), 0);

        if (!stats[etab]) {
          stats[etab] = {
            total: 0,
            administree: 0,
          };
        }

        stats[etab].total += total;
        stats[etab].administree += Number(r.quantiteAdministree || 0);
      });

      const etabs = Object.keys(reçues).map(name => {
        const total = stats[name]?.total || 0;
        const administree = stats[name]?.administree || 0;
        const reçue = reçues[name];
        const restante = reçue - administree;
        return { nom: name, total, reçue, administree, restante };
      });

      // Aggregate categories
      const categories = {
        "≥65 ans sains": 0,
        "≥65 ans malades": 0,
        "Chroniques adultes": 0,
        "Chroniques enfants": 0,
        "Femmes enceintes": 0,
        "Santé": 0,
        "Pèlerins": 0,
        "Autres": 0,
      };

      rows.results.forEach(r => {
        const d = JSON.parse(r.data);
        categories["≥65 ans sains"] += Number(d.age65sain || 0);
        categories["≥65 ans malades"] += Number(d.age65malade || 0);
        categories["Chroniques adultes"] += Number(d.chroniquesAdultes || 0);
        categories["Chroniques enfants"] += Number(d.chroniquesEnfants || 0);
        categories["Femmes enceintes"] += Number(d.femmes || 0);
        categories["Santé"] += Number(d.sante || 0);
        categories["Pèlerins"] += Number(d.pelerins || 0);
        categories["Autres"] += Number(d.autres || 0);
      });

      const totalReçue = Object.values(reçues).reduce((a, b) => a + b, 0);
      const totalAdmin = etabs.reduce((a, b) => a + b.administree, 0);
      const totalRestante = totalReçue - totalAdmin;
      const totalVaccines = etabs.reduce((a, b) => a + b.total, 0);

      return json({
        totalReçue,
        totalAdmin,
        totalRestante,
        totalVaccines,
        etabs,
        categories,
      });
    }

    // Default 404
    return json({ error: "Not found" }, 404);
  },
};
