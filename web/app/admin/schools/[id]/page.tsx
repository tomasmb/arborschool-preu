"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";

const STUDENTS_PAGE_SIZE = 25;

type School = {
  id: string;
  name: string;
  slug: string;
  contactEmail: string | null;
  notes: string | null;
};

type Grant = {
  id: string;
  type: "email" | "domain";
  value: string;
  createdAt: string;
};

type Student = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  curso: string | null;
  subscriptionStatus: string;
  createdAt: string;
};

type BulkImportSummary = {
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; email?: string; message: string }>;
};

type StudentsListMeta = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export default function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [school, setSchool] = useState<School | null>(null);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsMeta, setStudentsMeta] = useState<StudentsListMeta | null>(
    null,
  );
  const [studentPage, setStudentPage] = useState(1);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Grant form state
  const [grantType, setGrantType] = useState<"email" | "domain">("domain");
  const [grantValue, setGrantValue] = useState("");
  const [addingGrant, setAddingGrant] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);

  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<
    | { kind: "error"; message: string }
    | { kind: "success"; summary: BulkImportSummary }
    | null
  >(null);

  useLayoutEffect(() => {
    setStudentPage(1);
    setStudents([]);
    setStudentsMeta(null);
  }, [id]);

  const loadSchoolAndGrants = useCallback(async () => {
    const [schoolRes, grantsRes] = await Promise.all([
      fetch(`/api/admin/schools/${id}`),
      fetch(`/api/admin/access-grants?schoolId=${id}`),
    ]);

    const schoolData = await schoolRes.json();
    const grantsData = await grantsRes.json();

    if (schoolData.success) setSchool(schoolData.data);
    if (grantsData.success) setGrants(grantsData.data);
  }, [id]);

  const loadStudents = useCallback(
    async (page: number, signal?: AbortSignal) => {
      const res = await fetch(
        `/api/admin/schools/${id}/students?page=${page}&limit=${STUDENTS_PAGE_SIZE}`,
        { signal },
      );
      const studentsData = await res.json();
      if (studentsData.success && studentsData.data) {
        setStudents(studentsData.data.items);
        setStudentsMeta({
          total: studentsData.data.total,
          page: studentsData.data.page,
          pageSize: studentsData.data.pageSize,
          totalPages: studentsData.data.totalPages,
        });
      }
    },
    [id],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await loadSchoolAndGrants();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, loadSchoolAndGrants]);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setStudentsLoading(true);
      try {
        await loadStudents(studentPage, ac.signal);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
      } finally {
        setStudentsLoading(false);
      }
    })();
    return () => ac.abort();
  }, [id, studentPage, loadStudents]);

  async function handleAddGrant(e: React.FormEvent) {
    e.preventDefault();
    setAddingGrant(true);
    setGrantError(null);

    const value =
      grantType === "domain" && !grantValue.startsWith("@")
        ? `@${grantValue.trim()}`
        : grantValue.trim();

    try {
      const res = await fetch("/api/admin/access-grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: grantType,
          value,
          schoolId: id,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setGrantError(data.error ?? "Error adding grant");
        return;
      }
      setGrantValue("");
      await loadSchoolAndGrants();
      await loadStudents(studentPage);
    } finally {
      setAddingGrant(false);
    }
  }

  async function handleDeleteGrant(grantId: string) {
    await fetch(`/api/admin/access-grants?id=${grantId}`, {
      method: "DELETE",
    });
    await loadSchoolAndGrants();
    await loadStudents(studentPage);
  }

  async function handleDeleteSchool() {
    if (!confirm("¿Eliminar este colegio y todos sus accesos?")) return;
    await fetch(`/api/admin/schools/${id}`, { method: "DELETE" });
    router.push("/admin/schools");
  }

  async function handleBulkStudentsFile(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBulkUploading(true);
    setBulkFeedback(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/admin/schools/${id}/students/bulk`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!data.success) {
        setBulkFeedback({
          kind: "error",
          message: data.error ?? "No se pudo procesar el archivo",
        });
        return;
      }
      setBulkFeedback({ kind: "success", summary: data.data });
      const onFirstPage = studentPage === 1;
      setStudentPage(1);
      if (onFirstPage) {
        await loadStudents(1);
      }
    } catch {
      setBulkFeedback({
        kind: "error",
        message: "Error de red al subir el archivo",
      });
    } finally {
      setBulkUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded" />
        <div className="h-32 bg-gray-100 rounded-2xl" />
        <div className="h-48 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="card-section text-center py-12">
        <p className="text-gray-500">Colegio no encontrado.</p>
        <Link href="/admin/schools" className="btn-secondary text-sm mt-4">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/schools"
            className="text-xs text-primary hover:underline"
          >
            &larr; Colegios
          </Link>
          <h1 className="text-xl font-serif font-bold text-gray-900 mt-1">
            {school.name}
          </h1>
          {school.contactEmail && (
            <p className="text-sm text-gray-500">{school.contactEmail}</p>
          )}
          {school.notes && (
            <p className="text-xs text-gray-400 mt-1">{school.notes}</p>
          )}
        </div>
        <button
          onClick={handleDeleteSchool}
          className="text-xs text-error hover:underline"
        >
          Eliminar
        </button>
      </div>

      {/* Access Grants */}
      <section className="card-section space-y-4">
        <h2 className="text-base font-semibold text-gray-900">
          Accesos ({grants.length})
        </h2>

        <form
          onSubmit={handleAddGrant}
          className="flex flex-wrap items-end gap-3"
        >
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tipo
            </label>
            <select
              value={grantType}
              onChange={(e) =>
                setGrantType(e.target.value as "email" | "domain")
              }
              className="input-field text-sm py-2"
            >
              <option value="domain">Dominio</option>
              <option value="email">Email</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {grantType === "domain" ? "Dominio" : "Email"}
            </label>
            <input
              type={grantType === "email" ? "email" : "text"}
              value={grantValue}
              onChange={(e) => setGrantValue(e.target.value)}
              className="input-field text-sm py-2"
              placeholder={
                grantType === "domain"
                  ? "@colegio.cl"
                  : "estudiante@colegio.cl"
              }
              required
            />
          </div>
          <button
            type="submit"
            disabled={addingGrant || !grantValue.trim()}
            className="btn-primary text-sm py-2 disabled:opacity-50"
          >
            {addingGrant ? "Agregando..." : "Agregar"}
          </button>
        </form>

        {grantError && (
          <p className="text-sm text-error">{grantError}</p>
        )}

        {grants.length === 0 ? (
          <p className="text-sm text-gray-400">
            Sin accesos configurados. Agrega un dominio o email arriba.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {grants.map((grant) => (
              <div
                key={grant.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] uppercase font-semibold px-1.5
                      py-0.5 rounded ${grant.type === "domain"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-purple-50 text-purple-700"
                      }`}
                  >
                    {grant.type}
                  </span>
                  <span className="text-sm text-gray-800">{grant.value}</span>
                </div>
                <button
                  onClick={() => handleDeleteGrant(grant.id)}
                  className="text-xs text-gray-400 hover:text-error
                    transition-colors"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Students */}
      <section className="card-section space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-900">
            Estudiantes (
            {studentsMeta !== null
              ? studentsMeta.total
              : studentsLoading
                ? "…"
                : 0}
            )
          </h2>
          <div className="flex flex-col items-end gap-1">
            <label
              className={`btn-secondary text-sm py-2 cursor-pointer ${bulkUploading ? "pointer-events-none opacity-50" : ""
                }`}
            >
              <input
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="sr-only"
                disabled={bulkUploading}
                onChange={handleBulkStudentsFile}
              />
              {bulkUploading ? "Procesando…" : "Carga masiva"}
            </label>
            <p className="text-[10px] text-gray-400 max-w-[240px] text-right">
              Excel: «Nombres», «Apellidos», «Email» y opcionalmente «Curso»
              (1.ª fila encabezados). También «Nombre completo» + «Email».
            </p>
          </div>
        </div>

        {bulkFeedback?.kind === "error" && (
          <p className="text-sm text-error">{bulkFeedback.message}</p>
        )}

        {bulkFeedback?.kind === "success" && (
          <div
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2
              text-sm text-gray-800 space-y-1"
          >
            <p>
              <span className="font-medium text-emerald-700">
                {bulkFeedback.summary.created} creados
              </span>
              {", "}
              <span className="font-medium text-blue-700">
                {bulkFeedback.summary.updated} actualizados
              </span>
              {bulkFeedback.summary.skipped > 0 && (
                <>
                  {", "}
                  <span className="text-gray-500">
                    {bulkFeedback.summary.skipped} filas vacías omitidas
                  </span>
                </>
              )}
              .
            </p>
            {bulkFeedback.summary.errors.length > 0 && (
              <ul className="text-xs text-amber-800 space-y-0.5 mt-2 max-h-40 overflow-y-auto">
                {bulkFeedback.summary.errors.map((err, i) => (
                  <li key={`${err.row}-${i}`}>
                    Fila {err.row}
                    {err.email ? ` (${err.email})` : ""}: {err.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {studentsMeta === null && studentsLoading ? (
          <p className="text-sm text-gray-400">Cargando estudiantes…</p>
        ) : studentsMeta !== null && studentsMeta.total === 0 ? (
          <p className="text-sm text-gray-400">
            Aún no hay estudiantes registrados con los dominios de este
            colegio.
          </p>
        ) : studentsMeta !== null && studentsMeta.total > 0 ? (
          <div className="space-y-3">
            <div
              className={`overflow-x-auto transition-opacity ${studentsLoading ? "opacity-60" : ""
                }`}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b">
                    <th className="pb-2 font-medium">Nombre</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Curso</th>
                    <th className="pb-2 font-medium">Estado</th>
                    <th className="pb-2 font-medium">Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2">
                        {[s.firstName, s.lastName].filter(Boolean).join(" ") ||
                          "—"}
                      </td>
                      <td className="py-2 text-gray-600">{s.email}</td>
                      <td className="py-2 text-gray-600">{s.curso ?? "—"}</td>
                      <td className="py-2">
                        <span
                          className={`text-[10px] uppercase font-semibold
                          px-1.5 py-0.5 rounded ${s.subscriptionStatus === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                            }`}
                        >
                          {s.subscriptionStatus}
                        </span>
                      </td>
                      <td className="py-2 text-gray-400">
                        {new Date(s.createdAt).toLocaleDateString("es-CL")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {studentsMeta.totalPages > 1 && (
              <div
                className="flex flex-wrap items-center justify-between gap-3
                  text-sm text-gray-600"
              >
                <p className="text-xs text-gray-500">
                  Página {studentsMeta.page} de {studentsMeta.totalPages} (
                  {studentsMeta.total} en total)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={studentPage <= 1 || studentsLoading}
                    onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                    className="btn-secondary text-xs py-1.5 px-3
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={
                      studentPage >= studentsMeta.totalPages || studentsLoading
                    }
                    onClick={() =>
                      setStudentPage((p) =>
                        Math.min(studentsMeta.totalPages, p + 1),
                      )
                    }
                    className="btn-secondary text-xs py-1.5 px-3
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
