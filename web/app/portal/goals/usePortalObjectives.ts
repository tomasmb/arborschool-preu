"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CareerPositionResult } from "@/lib/student/careerPositioning";
import type { GoalOption, PlanningProfileDraft } from "./types";

type JourneyState =
  | "planning_required"
  | "diagnostic_in_progress"
  | "activation_ready"
  | "active_learning";

type CareerInterestWithPosition = {
  goalId: string;
  offeringId: string;
  priority: number;
  careerName: string;
  universityName: string;
  location: string | null;
  lastCutoff: number | null;
  cutoffYear: number | null;
  position: CareerPositionResult | null;
};

export type ObjectivesPayload = {
  dataset: {
    id: string;
    version: string;
    source: string;
    publishedAt: string;
  } | null;
  scoreTargets: { testCode: string; score: number }[];
  profileScores: { scoreType: string; score: number }[];
  careerInterests: CareerInterestWithPosition[];
  options: GoalOption[];
  planningProfile: {
    examDate: string | null;
    weeklyMinutesTarget: number;
    timezone: string;
    reminderInApp: boolean;
    reminderEmail: boolean;
  } | null;
  journeyState: JourneyState;
};

export type ScoreTargetDraft = Record<string, string>;
export type ProfileScoreDraft = Record<string, string>;

export function usePortalObjectives() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [dataset, setDataset] = useState<ObjectivesPayload["dataset"]>(null);
  const [options, setOptions] = useState<GoalOption[]>([]);
  const [journeyState, setJourneyState] = useState<JourneyState | null>(null);
  const [planningProfile, setPlanningProfile] =
    useState<ObjectivesPayload["planningProfile"]>(null);

  const [scoreTargets, setScoreTargets] = useState<ScoreTargetDraft>({});
  const [profileScores, setProfileScores] = useState<ProfileScoreDraft>({});
  const [careerInterests, setCareerInterests] = useState<
    CareerInterestWithPosition[]
  >([]);

  const [retryVersion, setRetryVersion] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load objectives from API
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch("/api/student/objectives");
        const json = await res.json();
        if (cancelled || !mountedRef.current) return;

        if (!json.success) {
          setLoadError(json.error ?? "Error al cargar objetivos");
          return;
        }

        const data = json.data as ObjectivesPayload;
        setDataset(data.dataset);
        setOptions(data.options);
        setJourneyState(data.journeyState);
        setPlanningProfile(data.planningProfile);

        const targets: ScoreTargetDraft = {};
        for (const t of data.scoreTargets) {
          targets[t.testCode] = String(Math.round(t.score));
        }
        setScoreTargets(targets);

        const profile: ProfileScoreDraft = {};
        for (const p of data.profileScores) {
          profile[p.scoreType] = String(Math.round(p.score));
        }
        setProfileScores(profile);

        setCareerInterests(data.careerInterests);
        setIsDirty(false);
      } catch {
        if (!cancelled && mountedRef.current) {
          setLoadError("Error de conexión al cargar objetivos");
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [retryVersion]);

  const retryLoad = useCallback(() => {
    setRetryVersion((v) => v + 1);
  }, []);

  const updateScoreTarget = useCallback((testCode: string, value: string) => {
    setScoreTargets((prev) => ({ ...prev, [testCode]: value }));
    setIsDirty(true);
  }, []);

  const updateProfileScore = useCallback((scoreType: string, value: string) => {
    setProfileScores((prev) => ({ ...prev, [scoreType]: value }));
    setIsDirty(true);
  }, []);

  const addCareerInterest = useCallback(
    (offeringId: string) => {
      if (!offeringId) return;
      if (careerInterests.some((ci) => ci.offeringId === offeringId)) return;
      if (careerInterests.length >= 5) return;

      const option = options.find((o) => o.offeringId === offeringId);
      if (!option) return;

      setCareerInterests((prev) => [
        ...prev,
        {
          goalId: `new-${Date.now()}`,
          offeringId,
          priority: prev.length + 1,
          careerName: option.careerName,
          universityName: option.universityName,
          location: null,
          lastCutoff: option.lastCutoff,
          cutoffYear: option.cutoffYear,
          position: null,
        },
      ]);
      setIsDirty(true);
    },
    [careerInterests, options]
  );

  const removeCareerInterest = useCallback((offeringId: string) => {
    setCareerInterests((prev) => {
      const filtered = prev.filter((ci) => ci.offeringId !== offeringId);
      return filtered.map((ci, i) => ({ ...ci, priority: i + 1 }));
    });
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    setInfoMessage(null);

    const scoreTargetPayload = Object.entries(scoreTargets)
      .filter(([, v]) => v.trim() !== "")
      .map(([testCode, value]) => ({
        testCode,
        score: Number(value),
      }));

    const profilePayload = Object.entries(profileScores)
      .filter(([, v]) => v.trim() !== "")
      .map(([scoreType, value]) => ({
        scoreType,
        score: Number(value),
      }));

    const interestsPayload = careerInterests.map((ci, i) => ({
      offeringId: ci.offeringId,
      priority: i + 1,
    }));

    try {
      const res = await fetch("/api/student/objectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scoreTargets: scoreTargetPayload,
          profileScores: profilePayload,
          careerInterests: interestsPayload,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Error al guardar");
        return;
      }

      const data = json.data as ObjectivesPayload;
      setCareerInterests(data.careerInterests);
      setIsDirty(false);
      setInfoMessage("Objetivos guardados");
      setTimeout(() => setInfoMessage(null), 3000);
    } catch {
      setError("Error de conexión al guardar");
    } finally {
      setSaving(false);
    }
  }, [scoreTargets, profileScores, careerInterests]);

  return {
    loading,
    saving,
    loadError,
    error,
    infoMessage,
    isDirty,
    dataset,
    options,
    journeyState,
    planningProfile,
    scoreTargets,
    profileScores,
    careerInterests,
    retryLoad,
    updateScoreTarget,
    updateProfileScore,
    addCareerInterest,
    removeCareerInterest,
    handleSave,
  };
}
