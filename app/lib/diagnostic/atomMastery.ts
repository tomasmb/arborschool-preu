/**
 * Atom Mastery Computation with Transitivity
 *
 * Single source of truth for computing atom mastery with transitivity.
 * Used by both:
 * - Signup flow (saving to DB)
 * - Learning routes algorithm (calculating unlock potential)
 *
 * Rules:
 * - If atom X is mastered → all prerequisites of X are also mastered (recursively)
 * - If atom X is not mastered → only X is marked as not mastered (no cascade)
 * - Atoms not directly tested and not inferred → marked as not_started
 * - Direct test results are NEVER overridden by inferred mastery
 */

import { db } from "@/db";
import { atoms } from "@/db/schema";

// ============================================================================
// TYPES
// ============================================================================

export interface AtomWithPrereqs {
  id: string;
  prerequisiteIds: string[] | null;
}

export interface DirectResult {
  atomId: string;
  mastered: boolean;
}

export type MasterySource = "direct" | "inferred" | "not_tested";

export interface MasteryState {
  atomId: string;
  mastered: boolean;
  source: MasterySource;
}

/** @deprecated Use MasteryState instead */
export type FullMasteryResult = MasteryState;

// ============================================================================
// DATA LOADING
// ============================================================================

/**
 * Fetches all atoms from the database with their prerequisite IDs.
 * Returns as array (for backward compatibility).
 */
export async function fetchAllAtoms(): Promise<AtomWithPrereqs[]> {
  const allAtoms = await db
    .select({
      id: atoms.id,
      prerequisiteIds: atoms.prerequisiteIds,
    })
    .from(atoms);

  return allAtoms;
}

/**
 * Computes full atom mastery for all atoms using transitivity.
 *
 * Algorithm:
 * 1. Build a map of all atoms and their prerequisites
 * 2. Start with directly tested atoms from diagnostic
 * 3. For each mastered atom, recursively mark all prerequisites as mastered
 * 4. All remaining atoms are marked as not mastered (not_started)
 *
 * @param directResults - Array of atoms directly tested in diagnostic with results
 * @param allAtoms - All atoms in the database with their prerequisites
 * @returns Full mastery mapping for all atoms
 */
export function computeFullAtomMastery(
  directResults: DirectResult[],
  allAtoms: AtomWithPrereqs[]
): FullMasteryResult[] {
  // Build atom lookup map
  const atomMap = new Map<string, AtomWithPrereqs>();
  for (const atom of allAtoms) {
    atomMap.set(atom.id, atom);
  }

  // Track mastery status for each atom
  // true = mastered, false = not mastered, undefined = not yet determined
  const masteryStatus = new Map<string, boolean>();
  const masterySource = new Map<string, "direct" | "inferred" | "not_tested">();

  // Step 1: Mark directly tested atoms
  for (const result of directResults) {
    masteryStatus.set(result.atomId, result.mastered);
    masterySource.set(result.atomId, "direct");
  }

  // Step 2: For mastered atoms, recursively mark all prerequisites as mastered
  // Use DFS to traverse prerequisites
  const visited = new Set<string>();

  function markPrerequisitesAsMastered(atomId: string): void {
    if (visited.has(atomId)) return;
    visited.add(atomId);

    const atom = atomMap.get(atomId);
    if (!atom || !atom.prerequisiteIds) return;

    for (const prereqId of atom.prerequisiteIds) {
      // Only mark as mastered if not already marked as directly tested (not mastered)
      // If a prerequisite was directly tested as not mastered, keep that result
      const currentStatus = masteryStatus.get(prereqId);
      const currentSource = masterySource.get(prereqId);

      // If prerequisite was directly tested, don't override
      if (currentSource === "direct") {
        // Still traverse its prerequisites if it was mastered
        if (currentStatus === true) {
          markPrerequisitesAsMastered(prereqId);
        }
        continue;
      }

      // Mark as inferred mastered
      masteryStatus.set(prereqId, true);
      masterySource.set(prereqId, "inferred");

      // Recursively mark its prerequisites
      markPrerequisitesAsMastered(prereqId);
    }
  }

  // Apply transitivity for all mastered atoms
  for (const result of directResults) {
    if (result.mastered) {
      markPrerequisitesAsMastered(result.atomId);
    }
  }

  // Step 3: Build final results - all atoms not marked as mastered are not_started
  const results: FullMasteryResult[] = [];

  for (const atom of allAtoms) {
    const status = masteryStatus.get(atom.id);
    const source = masterySource.get(atom.id);

    if (status === true) {
      results.push({
        atomId: atom.id,
        mastered: true,
        source: source || "inferred",
      });
    } else if (source === "direct") {
      // Directly tested as not mastered
      results.push({
        atomId: atom.id,
        mastered: false,
        source: "direct",
      });
    } else {
      // Not tested and not inferred - mark as not mastered
      results.push({
        atomId: atom.id,
        mastered: false,
        source: "not_tested",
      });
    }
  }

  return results;
}

/**
 * Computes and returns full atom mastery with transitivity.
 * This is the main entry point for the signup flow.
 *
 * @param directResults - Atoms directly tested in diagnostic
 * @returns Full mastery mapping for all 229 atoms
 */
export async function computeFullMasteryWithTransitivity(
  directResults: DirectResult[]
): Promise<MasteryState[]> {
  const allAtoms = await fetchAllAtoms();
  return computeFullAtomMastery(directResults, allAtoms);
}

// ============================================================================
// MAP-BASED API (for questionUnlock algorithm)
// ============================================================================

/**
 * Computes mastery state and returns as a Map for O(1) lookups.
 * Used by the question unlock algorithm for efficient queries.
 *
 * @param directResults - Atoms directly tested in diagnostic
 * @param allAtoms - Map of all atoms (pass to avoid re-fetching)
 * @returns Map of atomId -> MasteryState
 */
export function computeMasteryAsMap(
  directResults: DirectResult[],
  allAtoms: Map<string, AtomWithPrereqs>
): Map<string, MasteryState> {
  const masteryMap = new Map<string, MasteryState>();

  // Step 1: Mark directly tested atoms
  for (const result of directResults) {
    masteryMap.set(result.atomId, {
      atomId: result.atomId,
      mastered: result.mastered,
      source: "direct",
    });
  }

  // Step 2: Apply transitivity for mastered atoms
  const visited = new Set<string>();

  function markPrerequisitesAsMastered(atomId: string): void {
    if (visited.has(atomId)) return;
    visited.add(atomId);

    const atom = allAtoms.get(atomId);
    if (!atom || !atom.prerequisiteIds) return;

    for (const prereqId of atom.prerequisiteIds) {
      const current = masteryMap.get(prereqId);

      // Don't override direct test results
      if (current?.source === "direct") {
        if (current.mastered) {
          markPrerequisitesAsMastered(prereqId);
        }
        continue;
      }

      // Mark as inferred mastered
      masteryMap.set(prereqId, {
        atomId: prereqId,
        mastered: true,
        source: "inferred",
      });

      markPrerequisitesAsMastered(prereqId);
    }
  }

  for (const result of directResults) {
    if (result.mastered) {
      markPrerequisitesAsMastered(result.atomId);
    }
  }

  // Step 3: All remaining atoms are not_tested
  for (const [atomId] of allAtoms) {
    if (!masteryMap.has(atomId)) {
      masteryMap.set(atomId, {
        atomId,
        mastered: false,
        source: "not_tested",
      });
    }
  }

  return masteryMap;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets the set of mastered atom IDs from a mastery map.
 */
export function getMasteredAtomIds(
  masteryMap: Map<string, MasteryState>
): Set<string> {
  const mastered = new Set<string>();
  for (const [atomId, state] of masteryMap) {
    if (state.mastered) {
      mastered.add(atomId);
    }
  }
  return mastered;
}

/**
 * Gets the set of non-mastered atom IDs from a mastery map.
 */
export function getNonMasteredAtomIds(
  masteryMap: Map<string, MasteryState>
): Set<string> {
  const nonMastered = new Set<string>();
  for (const [atomId, state] of masteryMap) {
    if (!state.mastered) {
      nonMastered.add(atomId);
    }
  }
  return nonMastered;
}
