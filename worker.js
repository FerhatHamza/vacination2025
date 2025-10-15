export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Database reference
    const db = env.DB;
    
    // CORS headers for cross-origin requests
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json"
    };

    // Handle preflight requests
    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Helper to send JSON responses
    const json = (data, status = 200) => 
      new Response(JSON.stringify(data), { 
        status, 
        headers: corsHeaders 
      });

    // Helper for error responses
    const error = (message, status = 400) => 
      json({ error: message, success: false }, status);

    // Parse request body with validation
    async function parseBody(request) {
      try {
        const contentType = request.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error("Invalid content type");
        }
        return await request.json();
      } catch (err) {
        throw new Error("Invalid JSON body");
      }
    }

    // Validate required fields
    function validateFields(body, requiredFields) {
      const missing = requiredFields.filter(field => 
        body[field] === undefined || body[field] === null || body[field] === ""
      );
      
      if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(", ")}`);
      }
    }

    try {
      // --------------------------
      // LOGIN ENDPOINT
      // --------------------------
      if (path === "/api/login" && method === "POST") {
        const body = await parseBody(request);
        validateFields(body, ["username", "password"]);

        const { username, password } = body;

        // In production, you should hash passwords and compare hashes
        const user = await db
          .prepare("SELECT id, username, role, etab FROM users WHERE username = ? AND password = ?")
          .bind(username, password)
          .first();

        if (!user) {
          return error("Utilisateur ou mot de passe invalide", 401);
        }

        // Log login attempt for security
        await db
          .prepare("INSERT INTO auth_logs (username, success, timestamp) VALUES (?, ?, ?)")
          .bind(username, 1, new Date().toISOString())
          .run();

        return json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            etab: user.etab,
          }
        });
      }

      // --------------------------
      // SAVE DAILY REPORT
      // --------------------------
      if (path === "/api/saveDaily" && method === "POST") {
        const body = await parseBody(request);
        validateFields(body, ["etab", "date", "centres", "equipes", "vaccines"]);

        const {
          etab,
          date,
          centres,
          equipes,
          vaccines,
          quantiteAdministree = 0,
        } = body;

        // Validate date format
        if (!isValidDate(date)) {
          return error("Format de date invalide. Utilisez YYYY-MM-DD");
        }

        // Validate numbers are positive
        if (centres < 0 || equipes < 0 || quantiteAdministree < 0) {
          return error("Les nombres ne peuvent pas être négatifs");
        }

        // Validate vaccines object structure
        if (!isValidVaccinesData(vaccines)) {
          return error("Données de vaccination invalides");
        }

        // Calculate total vaccines from the data
        const totalVaccines = Object.values(vaccines).reduce((sum, count) => 
          sum + (Number(count) || 0), 0
        );

        // Check if existing entry for that day
        const existing = await db
          .prepare("SELECT id FROM vaccination WHERE etab = ? AND date = ?")
          .bind(etab, date)
          .first();

        try {
          if (existing) {
            await db
              .prepare(
                `UPDATE vaccination SET 
                  centres = ?, equipes = ?, data = ?, quantiteAdministree = ?, updated_at = ?
                WHERE id = ?`
              )
              .bind(
                centres,
                equipes,
                JSON.stringify(vaccines),
                quantiteAdministree,
                new Date().toISOString(),
                existing.id
              )
              .run();
          } else {
            await db
              .prepare(
                `INSERT INTO vaccination (etab, date, centres, equipes, data, quantiteAdministree, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`
              )
              .bind(
                etab, 
                date, 
                centres, 
                equipes, 
                JSON.stringify(vaccines), 
                quantiteAdministree,
                new Date().toISOString()
              )
              .run();
          }

          // Log the data modification
          await db
            .prepare("INSERT INTO data_logs (etab, date, action, timestamp) VALUES (?, ?, ?, ?)")
            .bind(etab, date, existing ? "UPDATE" : "CREATE", new Date().toISOString())
            .run();

          return json({ 
            success: true, 
            message: existing ? "Rapport mis à jour" : "Rapport enregistré",
            totalVaccines 
          });

        } catch (dbError) {
          console.error("Database error:", dbError);
          return error("Erreur de base de données lors de la sauvegarde", 500);
        }
      }

      // --------------------------
      // GET HISTORY FOR ONE ETAB
      // --------------------------
      if (path === "/api/history" && method === "GET") {
        const etab = url.searchParams.get("etab");
        
        if (!etab) {
          return error("Paramètre 'etab' requis");
        }

        const limit = Math.min(parseInt(url.searchParams.get("limit")) || 30, 100); // Max 100 records
        const offset = parseInt(url.searchParams.get("offset")) || 0;

        try {
          const rows = await db
            .prepare("SELECT * FROM vaccination WHERE etab = ? ORDER BY date DESC LIMIT ? OFFSET ?")
            .bind(etab, limit, offset)
            .all();

          // Parse JSON data for each row
          const history = (rows.results || []).map(row => ({
            ...row,
            data: JSON.parse(row.data)
          }));

          // Get total count for pagination
          const countResult = await db
            .prepare("SELECT COUNT(*) as total FROM vaccination WHERE etab = ?")
            .bind(etab)
            .first();

          return json({
            success: true,
            data: history,
            pagination: {
              total: countResult.total,
              limit,
              offset
            }
          });

        } catch (dbError) {
          console.error("Database error:", dbError);
          return error("Erreur lors de la récupération de l'historique", 500);
        }
      }

      // --------------------------
      // ADMIN GLOBAL STATS
      // --------------------------
      if (path === "/api/admin/stats" && method === "GET") {
        // Authorization check - in production, add JWT verification
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return error("Accès non autorisé", 401);
        }

        // Fixed received doses - consider moving to database configuration
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

        try {
          const rows = await db.prepare("SELECT * FROM vaccination").all();
          const stats = {};

          rows.results.forEach(r => {
            try {
              const data = JSON.parse(r.data);
              const etab = r.etab;
              const total = Object.values(data).reduce((a, b) => a + (Number(b) || 0), 0);

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
            } catch (parseError) {
              console.error("Error parsing data for row:", r.id, parseError);
            }
          });

          const etabs = Object.keys(reçues).map(name => {
            const total = stats[name]?.total || 0;
            const administree = stats[name]?.administree || 0;
            const reçue = reçues[name];
            const restante = Math.max(0, reçue - administree);
            const utilisation = reçue > 0 ? Math.round((administree / reçue) * 100) : 0;
            
            return { 
              nom: name, 
              total, 
              reçue, 
              administree, 
              restante,
              utilisation,
              centres: stats[name]?.centres || 0,
              equipes: stats[name]?.equipes || 0
            };
          });

          // Aggregate categories with proper field mapping
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
            try {
              const d = JSON.parse(r.data);
              categories["≥65 ans sains"] += Number(d.p65sain || d.age65sain || 0);
              categories["≥65 ans malades"] += Number(d.p65malade || d.age65malade || 0);
              categories["Chroniques adultes"] += Number(d.maladults || d.chroniquesAdultes || 0);
              categories["Chroniques enfants"] += Number(d.malenfants || d.chroniquesEnfants || 0);
              categories["Femmes enceintes"] += Number(d.enceintes || d.femmes || 0);
              categories["Santé"] += Number(d.sante || 0);
              categories["Pèlerins"] += Number(d.pelerins || 0);
              categories["Autres"] += Number(d.autres || 0);
            } catch (parseError) {
              console.error("Error parsing categories for row:", r.id);
            }
          });

          const totalReçue = Object.values(reçues).reduce((a, b) => a + b, 0);
          const totalAdmin = etabs.reduce((a, b) => a + b.administree, 0);
          const totalRestante = Math.max(0, totalReçue - totalAdmin);
          const totalVaccines = etabs.reduce((a, b) => a + b.total, 0);
          const totalUtilisation = totalReçue > 0 ? Math.round((totalAdmin / totalReçue) * 100) : 0;

          return json({
            success: true,
            summary: {
              totalReçue,
              totalAdmin,
              totalRestante,
              totalVaccines,
              totalUtilisation
            },
            etabs,
            categories,
            lastUpdated: new Date().toISOString()
          });

        } catch (dbError) {
          console.error("Database error in stats:", dbError);
          return error("Erreur lors du calcul des statistiques", 500);
        }
      }

      // --------------------------
      // HEALTH CHECK ENDPOINT
      // --------------------------
      if (path === "/api/health" && method === "GET") {
        try {
          // Test database connection
          await db.prepare("SELECT 1").first();
          return json({ 
            status: "healthy", 
            timestamp: new Date().toISOString(),
            database: "connected"
          });
        } catch (error) {
          return json({ 
            status: "unhealthy", 
            timestamp: new Date().toISOString(),
            database: "disconnected"
          }, 503);
        }
      }

      // Default 404
      return error("Endpoint non trouvé", 404);

    } catch (error) {
      console.error("Unhandled error:", error);
      return json({ 
        error: "Erreur interne du serveur", 
        success: false 
      }, 500);
    }
  },
};

// Validation helper functions
function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

function isValidVaccinesData(vaccines) {
  if (typeof vaccines !== "object" || vaccines === null) return false;
  
  // Check if all values are numbers
  return Object.values(vaccines).every(value => 
    typeof value === "number" && value >= 0
  );
}
