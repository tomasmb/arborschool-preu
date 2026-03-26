"use client";

import { useState } from "react";
import useSWR from "swr";
import { signOut } from "next-auth/react";
import { PageShell } from "@/app/portal/components";
import { SWR_KEYS } from "@/app/portal/swrKeys";

type ProfileData = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  journeyState: string;
};

type ReminderPrefs = {
  reminderInApp: boolean;
  reminderEmail: boolean;
};

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-48 bg-gray-100 rounded" />
          <div className="h-4 w-64 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-10 w-full bg-gray-100 rounded-xl" />
          <div className="h-10 w-full bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function useProfileData() {
  const { data: profile, isLoading: profileLoading } =
    useSWR<ProfileData>(SWR_KEYS.profile);
  const {
    data: reminders,
    isLoading: remindersLoading,
    mutate: mutateReminders,
  } = useSWR<ReminderPrefs>(SWR_KEYS.reminders);

  const [saving, setSaving] = useState(false);

  async function updateReminders(patch: Partial<ReminderPrefs>) {
    setSaving(true);
    try {
      const res = await fetch("/api/student/reminders/preferences", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data.success) {
        void mutateReminders(
          { reminderInApp: data.data.reminderInApp,
            reminderEmail: data.data.reminderEmail },
          false
        );
      }
    } catch {
      // Ignore
    } finally {
      setSaving(false);
    }
  }

  return {
    profile: profile ?? null,
    reminders: reminders ?? null,
    loading: profileLoading || remindersLoading,
    saving,
    updateReminders,
  };
}

function AccountSection({ profile }: { profile: ProfileData }) {
  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    "Estudiante";

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-4">
      <h2 className="text-lg font-serif font-semibold text-primary">
        Tu cuenta
      </h2>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full
              bg-gradient-to-br from-primary/20 to-primary/5
              ring-2 ring-primary/10
              flex items-center justify-center text-primary
              font-bold text-lg"
          >
            {(profile.firstName?.[0] ?? profile.email[0]).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-800">{displayName}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function NotificationsSection({
  reminders,
  saving,
  onUpdate,
}: {
  reminders: ReminderPrefs | null;
  saving: boolean;
  onUpdate: (patch: Partial<ReminderPrefs>) => void;
}) {
  const inApp = reminders?.reminderInApp ?? true;
  const email = reminders?.reminderEmail ?? true;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-4">
      <h2 className="text-lg font-serif font-semibold text-primary">
        Notificaciones
      </h2>
      <div className="space-y-3">
        <label
          className="flex items-center justify-between rounded-xl
            border border-gray-200 px-4 py-3 cursor-pointer
            hover:bg-gray-50 transition-colors"
        >
          <div>
            <p className="text-sm font-medium text-gray-800">
              Recordatorios en la app
            </p>
            <p className="text-xs text-gray-500">
              Te avisamos cuando es hora de estudiar
            </p>
          </div>
          <input
            type="checkbox"
            checked={inApp}
            disabled={saving}
            onChange={(e) => onUpdate({ reminderInApp: e.target.checked })}
            className="accent-primary w-5 h-5"
          />
        </label>
        <label
          className="flex items-center justify-between rounded-xl
            border border-gray-200 px-4 py-3 cursor-pointer
            hover:bg-gray-50 transition-colors"
        >
          <div>
            <p className="text-sm font-medium text-gray-800">
              Recordatorios por email
            </p>
            <p className="text-xs text-gray-500">
              Recibe un email cuando tengas mini-clases pendientes
            </p>
          </div>
          <input
            type="checkbox"
            checked={email}
            disabled={saving}
            onChange={(e) => onUpdate({ reminderEmail: e.target.checked })}
            className="accent-primary w-5 h-5"
          />
        </label>
      </div>
    </section>
  );
}

function SignOutSection() {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="btn-secondary text-red-600 border-red-200
          hover:bg-red-50 hover:text-red-700"
      >
        Cerrar sesión
      </button>
    </section>
  );
}

function HelpSection() {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-3">
      <h2 className="text-lg font-serif font-semibold text-primary">Ayuda</h2>
      <p className="text-sm text-gray-600">¿Tienes dudas o necesitas ayuda?</p>
      <a
        href="mailto:contacto@arbor.school"
        className="btn-secondary inline-flex items-center gap-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
          />
        </svg>
        contacto@arbor.school
      </a>
    </section>
  );
}

export default function ProfilePage() {
  const { profile, reminders, loading, saving, updateReminders } =
    useProfileData();

  return (
    <PageShell title="Perfil" subtitle="Tu cuenta y preferencias.">
      {loading ? (
        <ProfileSkeleton />
      ) : (
        <div className="space-y-4">
          {profile ? <AccountSection profile={profile} /> : null}
          <NotificationsSection
            reminders={reminders}
            saving={saving}
            onUpdate={updateReminders}
          />
          <HelpSection />
          <SignOutSection />
        </div>
      )}
    </PageShell>
  );
}
