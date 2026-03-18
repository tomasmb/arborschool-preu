import { and, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  admissionsDatasets,
  careerOfferings,
  careers,
  offeringCutoffs,
  offeringWeights,
  universities,
} from "../db/schema";
import * as schema from "../db/schema";
import data from "./data/admissions-2026.json";

// ---------------------------------------------------------------------------
// Seed admissions dataset from DEMRE structured data.
//
// Data source (JSON):
//   scripts/data/admissions-2026.json
//   Generated from DEMRE "Oferta Definitiva Admisión 2026" (ponderations)
//   + DEMRE post-selection results "último seleccionado" (cutoffs)
//   via datosabiertos.mineduc.cl open data portal.
//
// Uses its own connection with extended timeouts for bulk remote seeding.
// ---------------------------------------------------------------------------

type DataFile = {
  datasetVersion: string;
  datasetSource: string;
  cutoffYear: number;
  universities: Record<string, { name: string; shortName: string }>;
  careers: Record<string, string>;
  offerings: {
    u: string;
    c: string;
    l: string;
    s: number;
    w: Record<string, number>;
    demreCode: string;
  }[];
};

const typed = data as unknown as DataFile;
const { datasetVersion, datasetSource, cutoffYear, offerings } = typed;
const uniLookup = typed.universities;
const careerLookup = typed.careers;

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const isPooler = url.includes("-pooler");
  const sql = postgres(url, {
    max: 1,
    prepare: !isPooler,
    idle_timeout: 0,
    connect_timeout: 60,
    connection: { statement_timeout: 60000 },
  });
  return { db: drizzle(sql, { schema }), sql };
}

const { db, sql: pgClient } = createDb();

// ---------------------------------------------------------------------------
// Upsert helpers
// ---------------------------------------------------------------------------

async function upsertDataset() {
  const existing = await db
    .select({ id: admissionsDatasets.id })
    .from(admissionsDatasets)
    .where(eq(admissionsDatasets.version, datasetVersion))
    .limit(1);

  if (existing.length > 0) return existing[0].id;

  const [created] = await db
    .insert(admissionsDatasets)
    .values({
      version: datasetVersion,
      source: datasetSource,
      publishedAt: new Date("2025-10-01"),
      isActive: true,
    })
    .returning({ id: admissionsDatasets.id });
  return created.id;
}

async function upsertUniversity(code: string) {
  const info = uniLookup[code];
  const existing = await db
    .select({ id: universities.id })
    .from(universities)
    .where(eq(universities.code, code))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(universities)
      .set({ name: info.name, shortName: info.shortName })
      .where(eq(universities.id, existing[0].id));
    return existing[0].id;
  }

  const [created] = await db
    .insert(universities)
    .values({ code, name: info.name, shortName: info.shortName })
    .returning({ id: universities.id });
  return created.id;
}

async function upsertCareer(code: string) {
  const name = careerLookup[code];
  const existing = await db
    .select({ id: careers.id })
    .from(careers)
    .where(eq(careers.code, code))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(careers)
      .set({ name })
      .where(eq(careers.id, existing[0].id));
    return existing[0].id;
  }

  const [created] = await db
    .insert(careers)
    .values({ code, name })
    .returning({ id: careers.id });
  return created.id;
}

async function upsertOffering(
  datasetId: string,
  universityId: string,
  careerId: string,
  location: string | null,
  externalCode: string | null
) {
  const conditions = [
    eq(careerOfferings.datasetId, datasetId),
    eq(careerOfferings.universityId, universityId),
    eq(careerOfferings.careerId, careerId),
  ];
  if (location) {
    conditions.push(eq(careerOfferings.location, location));
  } else {
    conditions.push(isNull(careerOfferings.location));
  }

  const existing = await db
    .select({ id: careerOfferings.id })
    .from(careerOfferings)
    .where(and(...conditions))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(careerOfferings)
      .set({ externalCode })
      .where(eq(careerOfferings.id, existing[0].id));
    return existing[0].id;
  }

  const [created] = await db
    .insert(careerOfferings)
    .values({ datasetId, universityId, careerId, location, externalCode })
    .returning({ id: careerOfferings.id });
  return created.id;
}

async function upsertCutoff(
  offeringId: string,
  admissionYear: number,
  cutoffScore: number
) {
  const existing = await db
    .select({ id: offeringCutoffs.id })
    .from(offeringCutoffs)
    .where(
      and(
        eq(offeringCutoffs.offeringId, offeringId),
        eq(offeringCutoffs.admissionYear, admissionYear)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(offeringCutoffs)
      .set({ cutoffScore: cutoffScore.toFixed(2) })
      .where(eq(offeringCutoffs.id, existing[0].id));
    return;
  }

  await db.insert(offeringCutoffs).values({
    offeringId,
    admissionYear,
    cutoffScore: cutoffScore.toFixed(2),
  });
}

async function replaceWeights(
  offeringId: string,
  weights: Record<string, number>
) {
  await db
    .delete(offeringWeights)
    .where(eq(offeringWeights.offeringId, offeringId));

  const rows = Object.entries(weights).map(([testCode, pct]) => ({
    offeringId,
    testCode,
    weightPercent: pct.toFixed(2),
  }));

  if (rows.length > 0) {
    await db.insert(offeringWeights).values(rows);
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateOfferings() {
  let valid = true;
  for (const o of offerings) {
    const sum = Object.values(o.w).reduce((acc, v) => acc + v, 0);
    if (sum !== 100) {
      console.error(
        `[VALIDATION] ${o.c} @ ${o.u} (${o.l}): weights sum ${sum}`
      );
      valid = false;
    }
  }
  return valid;
}

// ---------------------------------------------------------------------------
// Main — processes in batches to keep connection alive on remote DBs
// ---------------------------------------------------------------------------

const BATCH_SIZE = 100;

async function run() {
  if (!validateOfferings()) {
    throw new Error("Offering weights validation failed");
  }

  console.log(`[seed] Starting: ${offerings.length} offerings...`);

  const datasetId = await upsertDataset();

  const uniCache = new Map<string, string>();
  const careerCache = new Map<string, string>();

  for (let i = 0; i < offerings.length; i++) {
    const o = offerings[i];

    let universityId = uniCache.get(o.u);
    if (!universityId) {
      universityId = await upsertUniversity(o.u);
      uniCache.set(o.u, universityId);
    }

    let careerId = careerCache.get(o.c);
    if (!careerId) {
      careerId = await upsertCareer(o.c);
      careerCache.set(o.c, careerId);
    }

    const offeringId = await upsertOffering(
      datasetId,
      universityId,
      careerId,
      o.l || null,
      o.demreCode
    );
    await upsertCutoff(offeringId, cutoffYear, o.s);
    await replaceWeights(offeringId, o.w);

    if ((i + 1) % BATCH_SIZE === 0 || i + 1 === offerings.length) {
      console.log(`  ${i + 1}/${offerings.length}`);
    }
  }

  const uniCount = new Set(offerings.map((o) => o.u)).size;
  const careerCount = new Set(offerings.map((o) => o.c)).size;
  console.log(
    `[seed] Done: ${offerings.length} offerings ` +
      `(${uniCount} universities, ${careerCount} careers) ` +
      `for ${datasetVersion}`
  );
}

run()
  .then(() => pgClient.end().then(() => process.exit(0)))
  .catch((error) => {
    console.error("[seed] Failed:", error);
    pgClient.end().then(() => process.exit(1));
  });
