import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { atoms } from "./content";

/**
 * Pilot / analytics: records when a student hits an atom whose prerequisite(s)
 * lack generated medium/high questions, so the prereq scan cannot verify them.
 * One row per (user, target atom being studied, base prereq atom with no items).
 */
export const prereqQuestionGapEvents = pgTable(
  "prereq_question_gap_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    targetAtomId: varchar("target_atom_id", { length: 50 })
      .references(() => atoms.id)
      .notNull(),
    baseAtomId: varchar("base_atom_id", { length: 50 })
      .references(() => atoms.id)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_prereq_gap_user_target_base").on(
      table.userId,
      table.targetAtomId,
      table.baseAtomId
    ),
    index("idx_prereq_gap_base_atom").on(table.baseAtomId),
    index("idx_prereq_gap_user").on(table.userId),
  ]
);
