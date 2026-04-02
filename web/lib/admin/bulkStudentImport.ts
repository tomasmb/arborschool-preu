import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";
import { users } from "@/db/schema";

export type BulkImportRowError = {
  row: number;
  email?: string;
  message: string;
};

export type BulkImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: BulkImportRowError[];
};

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

function pickColumn(keys: string[], candidates: string[]): string | undefined {
  const normalizedKeys = keys.map((k) => ({
    orig: k,
    norm: normalizeHeader(k),
  }));

  for (const cand of candidates) {
    for (const { orig, norm } of normalizedKeys) {
      if (norm === cand) {
        return orig;
      }
    }
  }

  for (const cand of candidates) {
    for (const { orig, norm } of normalizedKeys) {
      if (norm.includes(cand)) {
        return orig;
      }
    }
  }

  return undefined;
}

/** Solo igualdad exacta del encabezado normalizado (evita que «nombre» matchee «nombre completo»). */
function pickColumnExact(keys: string[], candidates: string[]): string | undefined {
  const normalizedKeys = keys.map((k) => ({
    orig: k,
    norm: normalizeHeader(k),
  }));

  for (const cand of candidates) {
    for (const { orig, norm } of normalizedKeys) {
      if (norm === cand) {
        return orig;
      }
    }
  }

  return undefined;
}

export type BulkColumnMapping =
  | {
      kind: "nombres_apellidos";
      emailKey: string;
      nombresKey: string;
      apellidosKey: string;
      cursoKey: string | null;
    }
  | {
      kind: "full_name";
      emailKey: string;
      fullNameKey: string;
      cursoKey: string | null;
    };

export function resolveBulkImportColumns(
  keys: string[],
): BulkColumnMapping | { error: string } {
  const emailKey = pickColumn(keys, [
    "correo electronico",
    "e-mail",
    "email",
    "correo",
    "mail",
  ]);

  if (!emailKey) {
    return {
      error:
        "Falta una columna de correo. Usa encabezados como «Email» o «Correo».",
    };
  }

  const cursoKey = pickColumnExact(keys, ["curso"]) ?? null;

  const nombresKey =
    pickColumnExact(keys, ["nombres", "nombre"]) ??
    pickColumn(keys, ["primer nombre", "first name", "given name"]);
  const apellidosKey =
    pickColumnExact(keys, ["apellidos", "apellido"]) ??
    pickColumn(keys, ["last name", "surname", "family name"]);

  if (nombresKey && apellidosKey && nombresKey !== apellidosKey) {
    return {
      kind: "nombres_apellidos",
      emailKey,
      nombresKey,
      apellidosKey,
      cursoKey,
    };
  }

  const fullNameKey = pickColumn(keys, [
    "nombre completo",
    "nombre y apellido",
    "full name",
    "nombre del estudiante",
    "nombre",
    "name",
    "estudiante",
  ]);

  if (fullNameKey) {
    return { kind: "full_name", emailKey, fullNameKey, cursoKey };
  }

  return {
    error:
      "Se esperan columnas «Nombres» y «Apellidos» más «Email» (o «Nombre completo» y «Email» como alternativa).",
  };
}

const PERSON_NAME_LOCALE = "es";

/** Primera letra de cada palabra en mayúscula y el resto en minúsculas. */
function capitalizePersonName(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  const t = value.trim();
  if (!t) {
    return null;
  }
  return t
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLocaleLowerCase(PERSON_NAME_LOCALE);
      if (!lower) {
        return word;
      }
      const first = lower[0];
      const rest = lower.slice(1);
      return first.toLocaleUpperCase(PERSON_NAME_LOCALE) + rest;
    })
    .join(" ");
}

export function parseFullName(full: string): {
  firstName: string | null;
  lastName: string | null;
} {
  const t = full.trim();
  if (!t) {
    return { firstName: null, lastName: null };
  }

  const parts = t.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function normalizeEmail(raw: unknown): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  const s = String(raw).trim().toLowerCase();
  if (!s || !s.includes("@")) {
    return null;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
    return null;
  }
  return s;
}

const CURSO_MAX_LEN = 20;

function parseCursoCell(raw: unknown): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  const s = String(raw).trim();
  if (!s) {
    return null;
  }
  return s.length <= CURSO_MAX_LEN ? s : s.slice(0, CURSO_MAX_LEN);
}

export async function importBulkStudentsFromRows(
  db: PostgresJsDatabase<typeof schema>,
  rows: Record<string, unknown>[],
  schoolId: string,
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  if (rows.length === 0) {
    result.errors.push({ row: 0, message: "El archivo no tiene filas de datos." });
    return result;
  }

  const keys = Object.keys(rows[0]).filter((k) => k.trim().length > 0);
  const mapping = resolveBulkImportColumns(keys);
  if ("error" in mapping) {
    result.errors.push({ row: 1, message: mapping.error });
    return result;
  }

  const seenInFile = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const excelRow = i + 2;
    const row = rows[i];
    const email = normalizeEmail(row[mapping.emailKey]);

    let firstName: string | null;
    let lastName: string | null;
    let hasAnyNameText: boolean;

    if (mapping.kind === "nombres_apellidos") {
      const nRaw = row[mapping.nombresKey];
      const aRaw = row[mapping.apellidosKey];
      const n =
        nRaw === null || nRaw === undefined ? "" : String(nRaw).trim();
      const a =
        aRaw === null || aRaw === undefined ? "" : String(aRaw).trim();
      firstName = n.length > 0 ? n : null;
      lastName = a.length > 0 ? a : null;
      hasAnyNameText = Boolean(firstName || lastName);
    } else {
      const nameRaw = row[mapping.fullNameKey];
      const fullName =
        nameRaw === null || nameRaw === undefined ? "" : String(nameRaw).trim();
      const parsed = parseFullName(fullName);
      firstName = parsed.firstName;
      lastName = parsed.lastName;
      hasAnyNameText = Boolean(firstName || lastName);
    }

    firstName = capitalizePersonName(firstName);
    lastName = capitalizePersonName(lastName);

    if (!email && !hasAnyNameText) {
      result.skipped++;
      continue;
    }

    if (!email) {
      result.errors.push({
        row: excelRow,
        message: "Falta un email válido.",
      });
      continue;
    }

    if (seenInFile.has(email)) {
      result.errors.push({
        row: excelRow,
        email,
        message: "Este correo está duplicado en el archivo.",
      });
      continue;
    }
    seenInFile.add(email);

    if (!hasAnyNameText) {
      result.errors.push({
        row: excelRow,
        email,
        message:
          mapping.kind === "nombres_apellidos"
            ? "Falta texto en «Nombres» o «Apellidos» (al menos uno es obligatorio)."
            : "Falta el nombre completo.",
      });
      continue;
    }

    const curso =
      mapping.cursoKey !== null
        ? parseCursoCell(row[mapping.cursoKey])
        : undefined;

    const [existing] = await db
      .select({
        id: users.id,
        role: users.role,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      if (existing.role === "admin") {
        result.errors.push({
          row: excelRow,
          email,
          message: "No se puede asociar un usuario administrador desde la carga masiva.",
        });
        continue;
      }

      await db
        .update(users)
        .set({
          schoolId,
          firstName,
          lastName,
          subscriptionStatus: "active",
          updatedAt: new Date(),
          ...(mapping.cursoKey !== null ? { curso } : {}),
        })
        .where(eq(users.id, existing.id));

      result.updated++;
      continue;
    }

    await db.insert(users).values({
      email,
      role: "student",
      firstName,
      lastName,
      schoolId,
      subscriptionStatus: "active",
      ...(mapping.cursoKey !== null ? { curso } : {}),
    });

    result.created++;
  }

  return result;
}
