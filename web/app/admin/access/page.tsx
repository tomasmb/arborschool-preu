"use client";

import { useCallback, useEffect, useState } from "react";

type Grant = {
  id: string;
  type: "email" | "domain";
  value: string;
  schoolId: string | null;
  schoolName: string | null;
  createdAt: string;
};

type School = {
  id: string;
  name: string;
};

export default function AccessPage() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [grantType, setGrantType] = useState<"email" | "domain">("email");
  const [grantValue, setGrantValue] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [grantsRes, schoolsRes] = await Promise.all([
        fetch("/api/admin/access-grants"),
        fetch("/api/admin/schools"),
      ]);
      const grantsData = await grantsRes.json();
      const schoolsData = await schoolsRes.json();
      if (grantsData.success) setGrants(grantsData.data);
      if (schoolsData.success) setSchools(schoolsData.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    let value = grantValue.trim().toLowerCase();
    if (grantType === "domain" && !value.startsWith("@")) {
      value = `@${value}`;
    }

    try {
      const res = await fetch("/api/admin/access-grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: grantType,
          value,
          schoolId: schoolId || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Error adding access");
        return;
      }
      setGrantValue("");
      setSchoolId("");
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(grantId: string) {
    await fetch(`/api/admin/access-grants?id=${grantId}`, {
      method: "DELETE",
    });
    await loadData();
  }

  const emailGrants = grants.filter((g) => g.type === "email");
  const domainGrants = grants.filter((g) => g.type === "domain");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-serif font-bold text-gray-900">
          Accesos
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Agrega emails individuales o dominios completos para dar acceso a la
          plataforma.
        </p>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="card-section space-y-4">
        <h2 className="text-sm font-semibold text-gray-800">
          Nuevo acceso
        </h2>
        <div className="flex flex-wrap items-end gap-3">
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
              <option value="email">Email individual</option>
              <option value="domain">Dominio completo</option>
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
                  : "estudiante@gmail.com"
              }
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Colegio (opcional)
            </label>
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className="input-field text-sm py-2"
            >
              <option value="">Sin colegio</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={saving || !grantValue.trim()}
            className="btn-primary text-sm py-2 disabled:opacity-50"
          >
            {saving ? "Agregando..." : "Agregar"}
          </button>
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
      </form>

      {loading ? (
        <div className="card-section animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          {/* Domain grants */}
          <section className="card-section space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">
              Dominios ({domainGrants.length})
            </h2>
            {domainGrants.length === 0 ? (
              <p className="text-xs text-gray-400">
                Sin dominios registrados.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {domainGrants.map((g) => (
                  <GrantRow
                    key={g.id}
                    grant={g}
                    onDelete={() => handleDelete(g.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Email grants */}
          <section className="card-section space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">
              Emails individuales ({emailGrants.length})
            </h2>
            {emailGrants.length === 0 ? (
              <p className="text-xs text-gray-400">
                Sin emails individuales registrados.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {emailGrants.map((g) => (
                  <GrantRow
                    key={g.id}
                    grant={g}
                    onDelete={() => handleDelete(g.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function GrantRow({
  grant,
  onDelete,
}: {
  grant: Grant;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`text-[10px] uppercase font-semibold px-1.5 py-0.5
            rounded shrink-0 ${
              grant.type === "domain"
                ? "bg-blue-50 text-blue-700"
                : "bg-purple-50 text-purple-700"
            }`}
        >
          {grant.type}
        </span>
        <span className="text-sm text-gray-800 truncate">{grant.value}</span>
        {grant.schoolName && (
          <span className="text-xs text-gray-400 truncate">
            ({grant.schoolName})
          </span>
        )}
      </div>
      <button
        onClick={onDelete}
        className="text-xs text-gray-400 hover:text-error transition-colors
          shrink-0 ml-3"
      >
        Eliminar
      </button>
    </div>
  );
}
