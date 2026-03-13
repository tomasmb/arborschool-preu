import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { accessGrantTypeEnum } from "./enums";
import { users } from "./users";

/**
 * Access control tables: Schools and Access Grants.
 * Controls which users get full platform access (vs free tier).
 */

// ------------------------------------------------------------------------------
// SCHOOLS — Organizations that purchase platform access
// ------------------------------------------------------------------------------

export const schools = pgTable("schools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  contactEmail: varchar("contact_email", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ------------------------------------------------------------------------------
// ACCESS GRANTS — Individual emails or domain patterns that unlock full access
// ------------------------------------------------------------------------------

export const accessGrants = pgTable(
  "access_grants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: accessGrantTypeEnum("type").notNull(),
    value: varchar("value", { length: 255 }).notNull(),
    schoolId: uuid("school_id").references(() => schools.id, {
      onDelete: "cascade",
    }),
    grantedBy: uuid("granted_by")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_access_grants_type_value").on(table.type, table.value),
    index("idx_access_grants_school").on(table.schoolId),
    index("idx_access_grants_type").on(table.type),
  ]
);
