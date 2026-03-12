"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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
  subscriptionStatus: string;
  createdAt: string;
};

export default function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [school, setSchool] = useState<School | null>(null);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Grant form state
  const [grantType, setGrantType] = useState<"email" | "domain">("domain");
  const [grantValue, setGrantValue] = useState("");
  const [addingGrant, setAddingGrant] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [schoolRes, grantsRes, studentsRes] = await Promise.all([
        fetch(`/api/admin/schools/${id}`),
        fetch(`/api/admin/access-grants?schoolId=${id}`),
        fetch(`/api/admin/schools/${id}/students`),
      ]);

      const schoolData = await schoolRes.json();
      const grantsData = await grantsRes.json();
      const studentsData = await studentsRes.json();

      if (schoolData.success) setSchool(schoolData.data);
      if (grantsData.success) setGrants(grantsData.data);
      if (studentsData.success) setStudents(studentsData.data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      await loadData();
    } finally {
      setAddingGrant(false);
    }
  }

  async function handleDeleteGrant(grantId: string) {
    await fetch(`/api/admin/access-grants?id=${grantId}`, {
      method: "DELETE",
    });
    await loadData();
  }

  async function handleDeleteSchool() {
    if (!confirm("¿Eliminar este colegio y todos sus accesos?")) return;
    await fetch(`/api/admin/schools/${id}`, { method: "DELETE" });
    router.push("/admin/schools");
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
                      py-0.5 rounded ${
                        grant.type === "domain"
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
        <h2 className="text-base font-semibold text-gray-900">
          Estudiantes ({students.length})
        </h2>

        {students.length === 0 ? (
          <p className="text-sm text-gray-400">
            Aún no hay estudiantes registrados con los dominios de este
            colegio.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2 font-medium">Nombre</th>
                  <th className="pb-2 font-medium">Email</th>
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
                    <td className="py-2">
                      <span
                        className={`text-[10px] uppercase font-semibold
                          px-1.5 py-0.5 rounded ${
                            s.subscriptionStatus === "active"
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
        )}
      </section>
    </div>
  );
}
