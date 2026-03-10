import { and, eq } from "drizzle-orm";
import { db } from "../db";
import {
  admissionsDatasets,
  careerOfferings,
  careers,
  offeringCutoffs,
  offeringWeights,
  universities,
} from "../db/schema";

type SeedOffering = {
  careerCode: string;
  careerName: string;
  universityCode: string;
  universityName: string;
  cutoffScore: number;
  cutoffYear: number;
  weights: Record<string, number>;
};

const DATASET_VERSION = "admission-2026-v1";
const DATASET_SOURCE = "DEMRE + Acceso Mineduc (curated)";
const DATASET_PUBLISHED_AT = new Date("2026-01-15T00:00:00.000Z");

const OFFERINGS: SeedOffering[] = [
  {
    careerCode: "medicina",
    careerName: "Medicina",
    universityCode: "puc",
    universityName: "Pontificia Universidad Catolica de Chile",
    cutoffScore: 958.4,
    cutoffYear: 2025,
    weights: { M1: 35, NEM: 10, RANKING: 25, CL: 10, CIENCIAS: 20 },
  },
  {
    careerCode: "medicina",
    careerName: "Medicina",
    universityCode: "uch",
    universityName: "Universidad de Chile",
    cutoffScore: 931.15,
    cutoffYear: 2025,
    weights: { M1: 30, NEM: 10, RANKING: 20, CL: 10, CIENCIAS: 30 },
  },
  {
    careerCode: "ingenieria-comercial",
    careerName: "Ingenieria Comercial",
    universityCode: "puc",
    universityName: "Pontificia Universidad Catolica de Chile",
    cutoffScore: 826.3,
    cutoffYear: 2025,
    weights: { M1: 40, NEM: 10, RANKING: 20, CL: 20, HISTORIA: 10 },
  },
  {
    careerCode: "ingenieria-civil",
    careerName: "Ingenieria Civil / Plan Comun",
    universityCode: "uch",
    universityName: "Universidad de Chile",
    cutoffScore: 833.85,
    cutoffYear: 2025,
    weights: { M1: 45, NEM: 10, RANKING: 20, CL: 10, CIENCIAS: 15 },
  },
  {
    careerCode: "derecho",
    careerName: "Derecho",
    universityCode: "uch",
    universityName: "Universidad de Chile",
    cutoffScore: 851.2,
    cutoffYear: 2025,
    weights: { M1: 10, NEM: 20, RANKING: 20, CL: 40, HISTORIA: 10 },
  },
  {
    careerCode: "psicologia",
    careerName: "Psicologia",
    universityCode: "puc",
    universityName: "Pontificia Universidad Catolica de Chile",
    cutoffScore: 766.2,
    cutoffYear: 2025,
    weights: { M1: 20, NEM: 10, RANKING: 20, CL: 20, CIENCIAS: 30 },
  },
];

async function upsertDataset() {
  const existing = await db
    .select({ id: admissionsDatasets.id })
    .from(admissionsDatasets)
    .where(eq(admissionsDatasets.version, DATASET_VERSION))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const [created] = await db
    .insert(admissionsDatasets)
    .values({
      version: DATASET_VERSION,
      source: DATASET_SOURCE,
      publishedAt: DATASET_PUBLISHED_AT,
      isActive: true,
    })
    .returning({ id: admissionsDatasets.id });

  return created.id;
}

async function upsertUniversity(code: string, name: string) {
  const existing = await db
    .select({ id: universities.id })
    .from(universities)
    .where(eq(universities.code, code))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const [created] = await db
    .insert(universities)
    .values({ code, name, shortName: code.toUpperCase() })
    .returning({ id: universities.id });

  return created.id;
}

async function upsertCareer(code: string, name: string) {
  const existing = await db
    .select({ id: careers.id })
    .from(careers)
    .where(eq(careers.code, code))
    .limit(1);

  if (existing.length > 0) {
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
  careerId: string
) {
  const existing = await db
    .select({ id: careerOfferings.id })
    .from(careerOfferings)
    .where(
      and(
        eq(careerOfferings.datasetId, datasetId),
        eq(careerOfferings.universityId, universityId),
        eq(careerOfferings.careerId, careerId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const [created] = await db
    .insert(careerOfferings)
    .values({ datasetId, universityId, careerId })
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

async function upsertWeights(
  offeringId: string,
  weights: Record<string, number>
) {
  for (const [testCode, weightPercent] of Object.entries(weights)) {
    const existing = await db
      .select({ id: offeringWeights.id })
      .from(offeringWeights)
      .where(
        and(
          eq(offeringWeights.offeringId, offeringId),
          eq(offeringWeights.testCode, testCode)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(offeringWeights)
        .set({ weightPercent: weightPercent.toFixed(2) })
        .where(eq(offeringWeights.id, existing[0].id));
      continue;
    }

    await db.insert(offeringWeights).values({
      offeringId,
      testCode,
      weightPercent: weightPercent.toFixed(2),
    });
  }
}

async function run() {
  const datasetId = await upsertDataset();

  for (const offering of OFFERINGS) {
    const universityId = await upsertUniversity(
      offering.universityCode,
      offering.universityName
    );
    const careerId = await upsertCareer(
      offering.careerCode,
      offering.careerName
    );
    const offeringId = await upsertOffering(datasetId, universityId, careerId);
    await upsertCutoff(offeringId, offering.cutoffYear, offering.cutoffScore);
    await upsertWeights(offeringId, offering.weights);
  }

  console.log(
    `[seedAdmissionsDataset] Seeded ${OFFERINGS.length} offerings for ${DATASET_VERSION}`
  );
}

run().catch((error) => {
  console.error("[seedAdmissionsDataset] Failed:", error);
  process.exit(1);
});
