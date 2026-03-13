"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Stats = {
  totalUsers: number;
  activeUsers: number;
  freeUsers: number;
  totalSchools: number;
  totalGrants: number;
  recentUsers: Array<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    subscriptionStatus: string;
    createdAt: string;
  }>;
};

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href?: string;
}) {
  const content = (
    <div
      className={`card-section ${href ? "hover:shadow-lg cursor-pointer" : ""}`}
    >
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        if (data.success) setStats(data.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="card-section animate-pulse h-20"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card-section text-center py-12">
        <p className="text-gray-500">Error cargando estadísticas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-serif font-bold text-gray-900">
        Dashboard
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total usuarios" value={stats.totalUsers} />
        <StatCard
          label="Con acceso"
          value={stats.activeUsers}
          href="/admin/access"
        />
        <StatCard label="Plan gratuito" value={stats.freeUsers} />
        <StatCard
          label="Colegios"
          value={stats.totalSchools}
          href="/admin/schools"
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/schools" className="btn-primary text-sm">
          Gestionar colegios
        </Link>
        <Link href="/admin/access" className="btn-secondary text-sm">
          Gestionar accesos
        </Link>
      </div>

      {/* Recent users */}
      <section className="card-section space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">
          Últimos registros
        </h2>
        {stats.recentUsers.length === 0 ? (
          <p className="text-xs text-gray-400">Sin usuarios registrados.</p>
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
                {stats.recentUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2">
                      {[u.firstName, u.lastName]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </td>
                    <td className="py-2 text-gray-600">{u.email}</td>
                    <td className="py-2">
                      <span
                        className={`text-[10px] uppercase font-semibold
                          px-1.5 py-0.5 rounded ${
                            u.subscriptionStatus === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                      >
                        {u.subscriptionStatus}
                      </span>
                    </td>
                    <td className="py-2 text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString("es-CL")}
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
