export default {
  async fetch(request, env) {
    const db = env.DB;
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // ✅ CORS setup
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // or "http://127.0.0.1:5500" if you want to restrict
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // ✅ Preflight handler (important!)
    if (method === "OPTIONS") {
      return new Response("OK", { headers: corsHeaders });
    }

    // ✅ Helper for JSON response
    function json(data, status = 200) {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    function error(message, status = 400) {
      return json({ success: false, error: message }, status);
    }

    try {
      /*
            LOGIN API 
      */
      if (path === "/api/login" && method === "POST") {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
          return json({ error: "username and password required" }, 400);
        }

        // Look up the user
        const user = await db
          .prepare("SELECT * FROM users WHERE username = ?")
          .bind(username)
          .first();

        if (!user) {
          return json({ error: "User not found" }, 404);
        }

        // Check password (for demo purposes only, no hashing)
        if (user.password !== password) {
          return json({ error: "Invalid password" }, 401);
        }

        // Successful login
        return json(
          {
            success: true,
            message: "Login successful",
            user: { id: user.id, name: user.name, role: user.role, Etab: user.etab },
          },
          200
        );
      }

      if (path === "/api/admin/stats" && method === "GET") {
        // --- Check Authorization ---
        // const authHeader = request.headers.get("Authorization");
        // if (!authHeader || !authHeader.startsWith("Bearer ")) {
        //   return error("Accès non autorisé", 401);
        // }

        // --- Static Received Doses per Establishment ---
        const recues = {
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

        // --- Get all rows from vaccination table ---
        const rows = await db.prepare("SELECT * FROM vaccination").all();
        console.log('1 :: ');
        const stats = {};
        const categories = {
          "≥65 ans sains": 0,
          "≥65 ans malades": 0,
          "Chroniques adultes": 0,
          "Chroniques enfants": 0,
          "Femmes enceintes": 0,
          "Santé": 0,
          "Pèlerins": 0,
          "Autres": 0
        };

        // --- Loop over rows ---
        for (const r of rows.results || []) {
          try {
            const data = JSON.parse(r.data || "{}");
            const etab = r.etab || "Inconnu";
            const total = Object.values(data).reduce(
              (a, b) => a + (Number(b) || 0),
              0
            );

            if (!stats[etab]) {
              stats[etab] = {
                total: 0,
                administree: 0,
                centres: 0,
                equipes: 0
              };
            }

            stats[etab].total += total;
            stats[etab].administree += Number(r.quantiteAdministree || 0);
            stats[etab].centres += Number(r.centres || 0);
            stats[etab].equipes += Number(r.equipes || 0);

            // --- Category accumulation ---
            categories["≥65 ans sains"] += Number(data.p65sain || data.age65sain || 0);
            categories["≥65 ans malades"] += Number(data.p65malade || data.age65malade || 0);
            categories["Chroniques adultes"] += Number(data.maladults || data.chroniquesAdultes || 0);
            categories["Chroniques enfants"] += Number(data.malenfants || data.chroniquesEnfants || 0);
            categories["Femmes enceintes"] += Number(data.enceintes || data.femmes || 0);
            categories["Santé"] += Number(data.sante || 0);
            categories["Pèlerins"] += Number(data.pelerins || 0);
            categories["Autres"] += Number(data.autres || 0);
          } catch (parseError) {
            console.error("Error parsing data for row:", r.id, parseError);
          }
        }

        // --- Calculate establishment stats ---
        const etabs = Object.keys(recues).map((name) => {
          const total = stats[name]?.total || 0;
          const administree = stats[name]?.administree || 0;
          const recue = recues[name];
          const restante = Math.max(0, recue - administree);
          const utilisation = recue > 0 ? Math.round((administree / recue) * 100) : 0;
          return {
            nom: name,
            total,
            recue,
            administree,
            restante,
            utilisation,
            centres: stats[name]?.centres || 0,
            equipes: stats[name]?.equipes || 0
          };
        });

        // --- Totals ---
        const totalRecue = Object.values(recues).reduce((a, b) => a + b, 0);
        const totalAdmin = etabs.reduce((a, b) => a + b.administree, 0);
        const totalRestante = Math.max(0, totalRecue - totalAdmin);
        const totalVaccines = etabs.reduce((a, b) => a + b.total, 0);
        const totalUtilisation =
          totalRecue > 0 ? Math.round((totalAdmin / totalRecue) * 100) : 0;

        // --- Return Response ---
        return json({
          success: true,
          summary: {
            totalRecue,
            totalAdmin,
            totalRestante,
            totalVaccines,
            totalUtilisation
          },
          etabs,
          categories,
          lastUpdated: new Date().toISOString()
        });
      }

      if (path === "/api/saveDaily" && method === "POST") {
        try {
          const body = await request.json();
          const {
            user_id,
            date,
            age_65_no_chronic,
            age_65_with_chronic,
            chronic_adults,
            chronic_children,
            pregnant_women,
            health_staff,
            pilgrims,
            others,
            total_vaccinated,
            vaccines_administered
          } = body;

          // ✅ Basic validation
          if (!user_id || !date) {
            return error("Missing required fields: user_id or date", 400);
          }

          // ✅ Insert into daily_reports table (matches your schema exactly)
          await db.prepare(
            `INSERT INTO daily_reports (
                  user_id, date,
                  age_65_no_chronic, age_65_with_chronic,
                  chronic_adults, chronic_children,
                  pregnant_women, health_staff,
                  pilgrims, others,
                  total_vaccinated, vaccines_administered
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              user_id, date,
              age_65_no_chronic, age_65_with_chronic,
              chronic_adults, chronic_children,
              pregnant_women, health_staff,
              pilgrims, others,
              total_vaccinated, vaccines_administered
            )
            .run();

          return json({ success: true, message: "Daily report saved successfully" });

        } catch (err) {
          return json({ error: err.message || err, msg: 'save error' }, 500);
        }
      }
      if (path === "/api/getDailyReports" && method === "GET") {
        try {
          const url = new URL(request.url);
          const userId = url.searchParams.get("user_id"); // get user_id from query

          if (!userId) {
            return json({ error: "Missing user_id parameter" }, 400);
          }

          // Fetch reports for this specific user
          const reports = await db.prepare(
            `SELECT * FROM daily_reports WHERE user_id = ? ORDER BY date DESC`
          ).bind(userId).all();

          return json({ success: true, data: reports.results || [] });

        } catch (err) {
          return json({ error: err.message || err, msg: 'fetch error' }, 500);
        }
      }

      // ✅ Route: /api/setupCount
      if (path === "/api/setupCount" && method === "POST") {
        try {
          const body = await request.json();
          const { user_id, centres_count, equipes_count, vaccines_received } = body;

          // ✅ التحقق من وجود بيانات مسبقة
          const existing = await db.prepare(`SELECT COUNT(*) as count FROM setup`).first();

          if (existing.count > 0) {
            return json({
              success: false,
              message: "Setup already exists. You cannot add more.",
            });
          }

          // ✅ إدخال البيانات لأول مرة
          await db
            .prepare(
              `INSERT INTO setup (user_id, centres_count, equipes_count, vaccines_received)
                  VALUES (?, ?, ?, ?)`
            )
            .bind(user_id, centres_count, equipes_count, vaccines_received)
            .run();

          return json({ success: true, message: "Setup saved successfully" });
        } catch (err) {
          return error("Failed to save setup: " + err.message, 500);
        }
      }

      // ✅ Route: GET /api/setupCount → لعرض المعلومات
      if (path === "/api/setupCount" && method === "GET") {
        try {
          const row = await db.prepare(`SELECT * FROM setup LIMIT 1`).first();
          if (!row) {
            return json({ success: true, exists: false, data: null });
          }
          return json({ success: true, exists: true, data: row });
        } catch (err) {
          return error("Failed to fetch setup: " + err.message, 500);
        }
      }

      if (path === "/api/dailyReports/totals" && method === "GET") {
        try {
          const urlParams = new URL(request.url).searchParams;
          const userId = urlParams.get("user_id"); // get user_id from query params

          if (!userId) {
            return new Response(JSON.stringify({ error: "user_id is required" }), {
              headers: { "Content-Type": "application/json" },
              status: 400
            });
          }

          const query = `
                SELECT 
                  SUM(age_65_no_chronic) AS total_age_65_no_chronic,
                  SUM(age_65_with_chronic) AS total_age_65_with_chronic,
                  SUM(chronic_adults) AS total_chronic_adults,
                  SUM(chronic_children) AS total_chronic_children,
                  SUM(pregnant_women) AS total_pregnant_women,
                  SUM(health_staff) AS total_health_staff,
                  SUM(pilgrims) AS total_pilgrims,
                  SUM(others) AS total_others,
                  SUM(total_vaccinated) AS total_vaccinated,
                  SUM(vaccines_administered) AS total_vaccines_administered,
                  (
                    SUM(age_65_no_chronic) +
                    SUM(age_65_with_chronic) +
                    SUM(chronic_adults) +
                    SUM(chronic_children) +
                    SUM(pregnant_women) +
                    SUM(health_staff) +
                    SUM(pilgrims) +
                    SUM(others) 
                  ) AS grand_total
                FROM daily_reports
                WHERE user_id = ?
              `;

          const { results } = await db.prepare(query).bind(userId).run();

          return json({ success: true, data: results[0] });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500
          });
        }
      }


      if (path === "/api/status" && method === "GET") {
        try {
          const urlParams = new URL(request.url).searchParams;


          // ✅ جلب المجاميع الخاصة بالمستخدم
          const query = `
                SELECT
                  COALESCE(SUM(age_65_no_chronic), 0) AS total_age_65_no_chronic,
                  COALESCE(SUM(age_65_with_chronic), 0) AS total_age_65_with_chronic,
                  COALESCE(SUM(chronic_adults), 0) AS total_chronic_adults,
                  COALESCE(SUM(chronic_children), 0) AS total_chronic_children,
                  COALESCE(SUM(pregnant_women), 0) AS total_pregnant_women,
                  COALESCE(SUM(health_staff), 0) AS total_health_staff,
                  COALESCE(SUM(pilgrims), 0) AS total_pilgrims,
                  COALESCE(SUM(others), 0) AS total_others,
                  COALESCE(SUM(total_vaccinated), 0) AS total_vaccinated,
                  COALESCE(SUM(vaccines_administered), 0) AS total_vaccines_administered,
                  (
                    COALESCE(SUM(age_65_no_chronic), 0) +
                    COALESCE(SUM(age_65_with_chronic), 0) +
                    COALESCE(SUM(chronic_adults), 0) +
                    COALESCE(SUM(chronic_children), 0) +
                    COALESCE(SUM(pregnant_women), 0) +
                    COALESCE(SUM(health_staff), 0) +
                    COALESCE(SUM(pilgrims), 0) +
                    COALESCE(SUM(others), 0)
                  ) AS grand_total
                FROM daily_reports
              `;

          const { results } = await db.prepare(query).all();

          return json({
            success: true,
            summary: results[0] || {},
            message: "User status fetched successfully"
          });
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: "Failed to fetch status: " + err.message }),
            { headers: { "Content-Type": "application/json" }, status: 500 }
          );
        }
      }

      if (path === "/api/statusByUsername" && method === "GET") {
        try {
          const query = `
                SELECT 
                  u.username,
                  (
                    COALESCE(SUM(d.age_65_no_chronic), 0) +
                    COALESCE(SUM(d.age_65_with_chronic), 0) +
                    COALESCE(SUM(d.chronic_adults), 0) +
                    COALESCE(SUM(d.chronic_children), 0) +
                    COALESCE(SUM(d.pregnant_women), 0) +
                    COALESCE(SUM(d.health_staff), 0) +
                    COALESCE(SUM(d.pilgrims), 0) +
                    COALESCE(SUM(d.others), 0)
                  ) AS grand_total
                FROM users u
                LEFT JOIN daily_reports d ON u.id = d.user_id
                GROUP BY u.username
                ORDER BY u.username ASC
              `;

          const { results } = await db.prepare(query).all();

          return json({
            success: true,
            data: results,
            message: "Grand totals grouped by username fetched successfully"
          });
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: "Failed to fetch status: " + err.message }),
            { headers: { "Content-Type": "application/json" }, status: 500 }
          );
        }
      }
      // Example route: POST /users
      // if (path === "/users" && method === "POST") {

      // }



      // Fallback for unknown routes
      return json({ error: "Not Found response" }, 404);
    } catch (err) {
      return json({ error: err, msg: 'this is error' }, 500);
    }
  },
};
