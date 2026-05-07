/**
 * Pilot Data Extraction Script
 * Extracts usage metrics from the production database for the pilot program.
 * READ-ONLY queries only — no mutations.
 *
 * Filters: Only Liceo Antonio Varas students (school_id match).
 * Excludes: Team accounts, testers, and non-liceo users.
 */
import postgres from "postgres";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: Set DATABASE_URL env var");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 30,
  ssl: "require",
});

async function extract() {
  console.log("🔌 Connecting to production database...");
  const [{ now }] = await sql`SELECT NOW() as now`;
  console.log(`✅ Connected! Server time: ${now}\n`);

  // Get Liceo school ID
  const [school] = await sql`
    SELECT id, name, slug FROM schools WHERE slug = 'liceo-antonio-varas'
  `;
  if (!school) {
    console.error("❌ Liceo Antonio Varas not found in schools table");
    process.exit(1);
  }
  const schoolId = school.id;
  console.log(`🏫 School: ${school.name} (${schoolId})\n`);

  // Total liceo students
  const [{ count: totalStudents }] = await sql`
    SELECT COUNT(*) as count FROM users
    WHERE school_id = ${schoolId} AND role = 'student'
  `;

  // Students by curso
  const studentsByCurso = await sql`
    SELECT curso, COUNT(*) as count FROM users
    WHERE school_id = ${schoolId} AND role = 'student'
    GROUP BY curso ORDER BY curso
  `;

  // Registration dates (liceo only)
  const studentsByDate = await sql`
    SELECT DATE(created_at) as reg_date, COUNT(*) as count
    FROM users
    WHERE school_id = ${schoolId} AND role = 'student'
    GROUP BY DATE(created_at) ORDER BY reg_date
  `;

  // Test attempts (liceo students only)
  const [{ count: totalAttempts }] = await sql`
    SELECT COUNT(*) as count FROM test_attempts ta
    JOIN users u ON ta.user_id = u.id
    WHERE u.school_id = ${schoolId} AND u.role = 'student'
  `;
  const [{ count: completedAttempts }] = await sql`
    SELECT COUNT(*) as count FROM test_attempts ta
    JOIN users u ON ta.user_id = u.id
    WHERE u.school_id = ${schoolId} AND u.role = 'student'
      AND ta.completed_at IS NOT NULL
  `;

  // Attempts per student
  const attemptsPerUser = await sql`
    SELECT
      u.email, u.first_name, u.last_name, u.curso,
      COUNT(ta.id) as attempts,
      COUNT(CASE WHEN ta.completed_at IS NOT NULL THEN 1 END) as completed,
      MIN(ta.paes_score_min) as min_paes,
      MAX(ta.paes_score_max) as max_paes,
      MIN(ta.started_at) as first_attempt,
      MAX(ta.started_at) as last_attempt
    FROM users u
    LEFT JOIN test_attempts ta ON ta.user_id = u.id
    WHERE u.school_id = ${schoolId} AND u.role = 'student'
    GROUP BY u.id, u.email, u.first_name, u.last_name, u.curso
    ORDER BY attempts DESC, u.last_name
  `;

  // Atom mastery (liceo only)
  const masteryOverview = await sql`
    SELECT am.status, COUNT(*) as count
    FROM atom_mastery am
    JOIN users u ON am.user_id = u.id
    WHERE u.school_id = ${schoolId} AND u.role = 'student'
    GROUP BY am.status ORDER BY count DESC
  `;

  const masteryPerUser = await sql`
    SELECT
      u.email, u.first_name, u.last_name, u.curso,
      COUNT(am.atom_id) as total_atoms_touched,
      COUNT(CASE WHEN am.is_mastered THEN 1 END) as mastered,
      COUNT(CASE WHEN am.status = 'in_progress' THEN 1 END) as in_progress,
      COUNT(CASE WHEN am.status = 'not_started' THEN 1 END) as not_started
    FROM users u
    LEFT JOIN atom_mastery am ON am.user_id = u.id
    WHERE u.school_id = ${schoolId} AND u.role = 'student'
    GROUP BY u.id, u.email, u.first_name, u.last_name, u.curso
    HAVING COUNT(am.atom_id) > 0
    ORDER BY mastered DESC
  `;

  // Study sessions (liceo only)
  const [{ count: totalSessions }] = await sql`
    SELECT COUNT(*) as count FROM atom_study_sessions ass
    JOIN users u ON ass.user_id = u.id
    WHERE u.school_id = ${schoolId} AND u.role = 'student'
  `;

  const sessionsByStatus = await sql`
    SELECT ass.status, COUNT(*) as count
    FROM atom_study_sessions ass
    JOIN users u ON ass.user_id = u.id
    WHERE u.school_id = ${schoolId} AND u.role = 'student'
    GROUP BY ass.status ORDER BY count DESC
  `;

  const sessionsPerUser = await sql`
    SELECT
      u.email, u.first_name, u.last_name, u.curso,
      COUNT(ass.id) as total_sessions,
      COUNT(CASE WHEN ass.status = 'mastered' THEN 1 END) as mastered_sessions,
      SUM(ass.total_questions) as total_questions_answered,
      SUM(ass.correct_questions) as total_correct,
      MIN(ass.started_at) as first_session,
      MAX(ass.started_at) as last_session
    FROM users u
    INNER JOIN atom_study_sessions ass ON ass.user_id = u.id
    WHERE u.school_id = ${schoolId} AND u.role = 'student'
    GROUP BY u.id, u.email, u.first_name, u.last_name, u.curso
    ORDER BY total_sessions DESC
  `;

  // Sprints (liceo only)
  const [{ count: totalSprints }] = await sql`
    SELECT COUNT(*) as count FROM student_study_sprints sss
    JOIN users u ON sss.user_id = u.id
    WHERE u.school_id = ${schoolId} AND u.role = 'student'
  `;

  // Weekly missions (liceo only)
  const [{ count: totalMissions }] = await sql`
    SELECT COUNT(*) as count FROM student_weekly_missions swm
    JOIN users u ON swm.user_id = u.id
    WHERE u.school_id = ${schoolId} AND u.role = 'student'
  `;

  // Streaks (liceo only)
  const streaks = await sql`
    SELECT u.email, u.first_name, u.last_name, u.curso,
      u.current_streak, u.max_streak, u.last_streak_date
    FROM users u
    WHERE u.school_id = ${schoolId} AND u.role = 'student'
      AND (u.current_streak > 0 OR u.max_streak > 0)
    ORDER BY u.max_streak DESC
  `;

  // Activity timeline (liceo, last 60 days)
  const activityTimeline = await sql`
    SELECT
      DATE(ass.started_at) as activity_date,
      COUNT(DISTINCT ass.user_id) as active_users,
      COUNT(*) as sessions
    FROM atom_study_sessions ass
    JOIN users u ON ass.user_id = u.id
    WHERE u.school_id = ${schoolId} AND u.role = 'student'
      AND ass.started_at >= NOW() - INTERVAL '60 days'
    GROUP BY DATE(ass.started_at) ORDER BY activity_date
  `;

  // Diagnostic activity timeline (test attempts)
  const diagnosticTimeline = await sql`
    SELECT
      DATE(ta.started_at) as activity_date,
      COUNT(DISTINCT ta.user_id) as active_users,
      COUNT(*) as attempts
    FROM test_attempts ta
    JOIN users u ON ta.user_id = u.id
    WHERE u.school_id = ${schoolId} AND u.role = 'student'
      AND ta.started_at >= NOW() - INTERVAL '60 days'
    GROUP BY DATE(ta.started_at) ORDER BY activity_date
  `;

  // PAES scores from completed tests (liceo only)
  const paesScores = await sql`
    SELECT
      ta.id, u.email, u.first_name, u.last_name, u.curso,
      ta.test_id, ta.total_questions, ta.correct_answers,
      ta.score_percentage, ta.paes_score_min, ta.paes_score_max,
      ta.stage_1_score, ta.stage_2_difficulty, ta.completed_at
    FROM test_attempts ta
    JOIN users u ON ta.user_id = u.id
    WHERE u.school_id = ${schoolId} AND u.role = 'student'
      AND ta.completed_at IS NOT NULL
    ORDER BY ta.completed_at DESC
  `;

  // Compile
  const data = {
    extractedAt: new Date().toISOString(),
    school: { name: school.name, slug: school.slug },
    summary: {
      totalStudents: Number(totalStudents),
      totalTestAttempts: Number(totalAttempts),
      completedTestAttempts: Number(completedAttempts),
      totalStudySessions: Number(totalSessions),
      totalSprints: Number(totalSprints),
      totalMissions: Number(totalMissions),
    },
    studentsByCurso,
    studentsByDate,
    attemptsPerUser,
    masteryOverview,
    masteryPerUser,
    sessionsByStatus,
    sessionsPerUser,
    streaks,
    activityTimeline,
    diagnosticTimeline,
    paesScores,
  };

  const outPath = join(__dirname, "..", "pilot-data.json");
  writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`💾 Data saved to: ${outPath}`);
  console.log(`\n📊 Summary (Liceo only):`);
  console.log(`   Students: ${totalStudents}`);
  console.log(`   Diagnostics: ${completedAttempts}/${totalAttempts}`);
  console.log(`   Study sessions: ${totalSessions}`);
  console.log(`   Sprints: ${totalSprints}`);

  await sql.end();
  console.log("🔌 Done.");
}

extract().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
