"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type School = {
  id: string;
  name: string;
  slug: string;
  contactEmail: string | null;
  createdAt: string;
};

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSchools = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/schools");
      const data = await res.json();
      if (data.success) setSchools(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchools();
  }, [loadSchools]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contactEmail: contactEmail.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Error creating school");
        return;
      }
      setName("");
      setContactEmail("");
      setNotes("");
      setShowForm(false);
      await loadSchools();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-bold text-gray-900">
            Colegios
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Administra colegios y sus dominios de acceso.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary text-sm"
        >
          {showForm ? "Cancelar" : "Nuevo colegio"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="card-section space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del colegio
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Colegio San Ignacio"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email de contacto
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="input-field"
              placeholder="admin@colegio.cl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas internas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field min-h-[80px]"
              placeholder="Convenio firmado en marzo 2026..."
            />
          </div>
          {error && (
            <p className="text-sm text-error">{error}</p>
          )}
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {saving ? "Creando..." : "Crear colegio"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="card-section animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : schools.length === 0 ? (
        <div className="card-section text-center py-12">
          <p className="text-gray-500">No hay colegios registrados aún.</p>
        </div>
      ) : (
        <div className="card-section divide-y divide-gray-100">
          {schools.map((school) => (
            <Link
              key={school.id}
              href={`/admin/schools/${school.id}`}
              className="flex items-center justify-between py-3 px-1
                hover:bg-gray-50 rounded-lg transition-colors -mx-1"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {school.name}
                </p>
                {school.contactEmail && (
                  <p className="text-xs text-gray-500">
                    {school.contactEmail}
                  </p>
                )}
              </div>
              <svg
                className="w-4 h-4 text-gray-400 shrink-0 ml-3"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
