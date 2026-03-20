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

  const [careerSaving, setCareerSaving] = useState(false);
  const [careerError, setCareerError] = useState<string | null>(null);

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
  const careerSaveSeqRef = useRef(0);

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

  const updateScoreTarget = useCallback(
    (testCode: string, value: string) => {
      setScoreTargets((prev) => ({ ...prev, [testCode]: value }));
      setIsDirty(true);
    },
    []
  );

  const updateProfileScore = useCallback(
    (scoreType: string, value: string) => {
      setProfileScores((prev) => ({ ...prev, [scoreType]: value }));
      setIsDirty(true);
    },
    []
  );

  /**
   * Persists career interests via the dedicated endpoint.
   * Uses a sequence counter to discard stale responses when
   * multiple saves race (e.g. rapid add-then-remove).
   */
  const saveCareerInterests = useCallback(
    async (interests: CareerInterestWithPosition[]) => {
      const seq = ++careerSaveSeqRef.current;
      setCareerSaving(true);
      setCareerError(null);

      const payload = interests.map((ci, i) => ({
        offeringId: ci.offeringId,
        priority: i + 1,
      }));

      try {
        const res = await fetch("/api/student/objectives/careers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ careerInterests: payload }),
        });

        const json = await res.json();
        if (!mountedRef.current) return;
        if (seq !== careerSaveSeqRef.current) return;

        if (!json.success) {
          setCareerError(json.error ?? "Error al guardar carreras");
          return;
        }

        setCareerInterests(
          json.data.careerInterests as CareerInterestWithPosition[]
        );
      } catch {
        if (mountedRef.current && seq === careerSaveSeqRef.current) {
          setCareerError("Error de conexión al guardar carreras");
        }
      } finally {
        if (mountedRef.current && seq === careerSaveSeqRef.current) {
          setCareerSaving(false);
        }
      }
    },
    []
  );

  const addCareerInterest = useCallback(
    (offeringId: string) => {
      if (!offeringId) return;
      if (careerInterests.some((ci) => ci.offeringId === offeringId)) return;
      if (careerInterests.length >= 5) return;

      const option = options.find((o) => o.offeringId === offeringId);
      if (!option) return;

      const updated = [
        ...careerInterests,
        {
          goalId: `new-${Date.now()}`,
          offeringId,
          priority: careerInterests.length + 1,
          careerName: option.careerName,
          universityName: option.universityName,
          location: null,
          lastCutoff: option.lastCutoff,
          cutoffYear: option.cutoffYear,
          position: null,
        },
      ];
      setCareerInterests(updated);
      saveCareerInterests(updated);
    },
    [careerInterests, options, saveCareerInterests]
  );

  const removeCareerInterest = useCallback(
    (offeringId: string) => {
      const filtered = careerInterests
        .filter((ci) => ci.offeringId !== offeringId)
        .map((ci, i) => ({ ...ci, priority: i + 1 }));
      setCareerInterests(filtered);
      saveCareerInterests(filtered);
    },
    [careerInterests, saveCareerInterests]
  );

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

    try {
      const res = await fetch("/api/student/objectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scoreTargets: scoreTargetPayload,
          profileScores: profilePayload,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Error al guardar");
        return;
      }

      // Refresh career positions since they depend on score targets
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
  }, [scoreTargets, profileScores]);

  return {
    loading,
    saving,
    loadError,
    error,
    infoMessage,
    isDirty,
    careerSaving,
    careerError,
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
