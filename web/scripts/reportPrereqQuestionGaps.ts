/**
 * Pilot report: count distinct students blocked per base atom (prereq without
 * medium/high generated questions). Run against prod/staging with DATABASE_URL.
 *
 *   DATABASE_URL="..." npx tsx scripts/reportPrereqQuestionGaps.ts
 */

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL ?? "");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const rows = await sql<
    { base_atom_id: string; student_count: string; atom_title: string | null }[]
  >`
    SELECT
      e.base_atom_id,
      COUNT(DISTINCT e.user_id)::text AS student_count,
      a.title AS atom_title
    FROM prereq_question_gap_events e
    LEFT JOIN atoms a ON a.id = e.base_atom_id
    GROUP BY e.base_atom_id, a.title
    ORDER BY COUNT(DISTINCT e.user_id) DESC, e.base_atom_id
  `;

  console.log(
    "Base atom (prereq sin ítems med/altos) → alumnos distintos bloqueados\n"
  );
  for (const r of rows) {
    console.log(
      `${r.base_atom_id}\t${r.student_count}\t${r.atom_title ?? ""}`
    );
  }
  console.log(`\nTotal filas: ${rows.length}`);

  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
