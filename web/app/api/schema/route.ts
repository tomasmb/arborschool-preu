import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

/**
 * GET /api/schema
 *
 * Returns the full live database schema as JSON.
 * Queries information_schema so it always reflects the current DB state.
 *
 * Useful for external services (AI tools, documentation generators, etc.)
 * that need to understand the database structure.
 *
 * Response shape:
 * {
 *   tables: { name, columns: [{ name, type, nullable, default, maxLength }] }[],
 *   enums: { name, values: string[] }[],
 *   foreignKeys: { table, column, referencedTable, referencedColumn }[],
 *   indexes: { name, table, columns: string[], isUnique }[]
 * }
 */
export async function GET() {
  try {
    const [tables, enums, foreignKeys, indexes] = await Promise.all([
      fetchTablesAndColumns(),
      fetchEnums(),
      fetchForeignKeys(),
      fetchIndexes(),
    ]);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      tables,
      enums,
      foreignKeys,
      indexes,
    });
  } catch (error) {
    console.error("[Schema API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch database schema" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Query helpers — each fetches one aspect of the schema from information_schema
// ---------------------------------------------------------------------------

/** Fetch all public tables with their columns, types, and constraints */
async function fetchTablesAndColumns() {
  const rows = await db.execute<{
    table_name: string;
    column_name: string;
    data_type: string;
    udt_name: string;
    is_nullable: string;
    column_default: string | null;
    character_maximum_length: number | null;
  }>(sql`
    SELECT
      c.table_name,
      c.column_name,
      c.data_type,
      c.udt_name,
      c.is_nullable,
      c.column_default,
      c.character_maximum_length
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_name = c.table_name
      AND t.table_schema = c.table_schema
    WHERE c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
    ORDER BY c.table_name, c.ordinal_position
  `);

  // Group columns by table
  const tableMap = new Map<
    string,
    {
      name: string;
      type: string;
      nullable: boolean;
      default: string | null;
      maxLength: number | null;
    }[]
  >();

  for (const row of rows) {
    const columns = tableMap.get(row.table_name) ?? [];
    columns.push({
      name: row.column_name,
      // Use udt_name for user-defined types (enums), data_type otherwise
      type: row.data_type === "USER-DEFINED" ? row.udt_name : row.data_type,
      nullable: row.is_nullable === "YES",
      default: row.column_default,
      maxLength: row.character_maximum_length,
    });
    tableMap.set(row.table_name, columns);
  }

  return Array.from(tableMap.entries()).map(([name, columns]) => ({
    name,
    columns,
  }));
}

/** Fetch all custom enum types and their allowed values */
async function fetchEnums() {
  const rows = await db.execute<{
    enum_name: string;
    enum_value: string;
  }>(sql`
    SELECT
      t.typname AS enum_name,
      e.enumlabel AS enum_value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
    ORDER BY t.typname, e.enumsortorder
  `);

  // Group values by enum name
  const enumMap = new Map<string, string[]>();
  for (const row of rows) {
    const values = enumMap.get(row.enum_name) ?? [];
    values.push(row.enum_value);
    enumMap.set(row.enum_name, values);
  }

  return Array.from(enumMap.entries()).map(([name, values]) => ({
    name,
    values,
  }));
}

/** Fetch all foreign key relationships */
async function fetchForeignKeys() {
  const rows = await db.execute<{
    table_name: string;
    column_name: string;
    referenced_table: string;
    referenced_column: string;
  }>(sql`
    SELECT
      kcu.table_name,
      kcu.column_name,
      ccu.table_name AS referenced_table,
      ccu.column_name AS referenced_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
      AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY kcu.table_name, kcu.column_name
  `);

  return rows.map((row) => ({
    table: row.table_name,
    column: row.column_name,
    referencedTable: row.referenced_table,
    referencedColumn: row.referenced_column,
  }));
}

/** Fetch all indexes (excluding primary keys, which are implicit) */
async function fetchIndexes() {
  const rows = await db.execute<{
    index_name: string;
    table_name: string;
    column_name: string;
    is_unique: boolean;
  }>(sql`
    SELECT
      i.relname AS index_name,
      t.relname AS table_name,
      a.attname AS column_name,
      ix.indisunique AS is_unique
    FROM pg_index ix
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN pg_attribute a
      ON a.attrelid = t.oid
      AND a.attnum = ANY(ix.indkey)
    WHERE n.nspname = 'public'
      AND NOT ix.indisprimary
    ORDER BY t.relname, i.relname
  `);

  // Group columns by index name
  const indexMap = new Map<
    string,
    { table: string; columns: string[]; isUnique: boolean }
  >();

  for (const row of rows) {
    const entry = indexMap.get(row.index_name) ?? {
      table: row.table_name,
      columns: [],
      isUnique: row.is_unique,
    };
    entry.columns.push(row.column_name);
    indexMap.set(row.index_name, entry);
  }

  return Array.from(indexMap.entries()).map(([name, info]) => ({
    name,
    table: info.table,
    columns: info.columns,
    isUnique: info.isUnique,
  }));
}
