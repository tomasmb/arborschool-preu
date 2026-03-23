"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isValidScore } from "@/lib/student/constants";
import type { CareerPositionResult } from "@/lib/student/careerPositioning";
import type { GoalOption } from "./types";

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

export type FieldSaveStatus =
  | "idle"
  | "saving"
  | "saved"
  | "error";

const DEBOUNCE_MS = 1500;
const SAVED_DISPLAY_MS = 2000;
const POSITION_REFRESH_MS = 2000;

// -----------------------------------------------------------------------
// Per-field auto-save via PATCH
// -----------------------------------------------------------------------

async function patchField(
  key: string,
  score: number,
  isProfile: boolean
): Promise<boolean> {
  const body = isProfile
    ? { scoreType: key, score }
    : { testCode: key, score };

  try {
    const res = await fetch("/api/student/objectives", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const PROFILE_KEYS = new Set(["NEM", "RANKING"]);

// -----------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------

export function usePortalObjectives() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [careerSaving, setCareerSaving] = useState(false);
  const [careerError, setCareerError] = useState<string | null>(null);

  const [dataset, setDataset] = useState<ObjectivesPayload["dataset"]>(null);
  const [options, setOptions] = useState<GoalOption[]>([]);
  const [journeyState, setJourneyState] = useState<JourneyState | null>(
    null
  );
  const [planningProfile, setPlanningProfile] =
    useState<ObjectivesPayload["planningProfile"]>(null);

  const [scoreTargets, setScoreTargets] = useState<ScoreTargetDraft>({});
  const [profileScores, setProfileScores] = useState<ProfileScoreDraft>(
    {}
  );
  const [careerInterests, setCareerInterests] = useState<
    CareerInterestWithPosition[]
  >([]);

  const [fieldStatus, setFieldStatus] = useState<
    Record<string, FieldSaveStatus>
  >({});

  const [positionsRefreshing, setPositionsRefreshing] = useState(false);

  const [retryVersion, setRetryVersion] = useState(0);
  const mountedRef = useRef(true);
  const careerSaveSeqRef = useRef(0);
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {}
  );
  const savedTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {}
  );
  const posRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      for (const t of Object.values(debounceTimers.current)) clearTimeout(t);
      for (const t of Object.values(savedTimers.current)) clearTimeout(t);
      if (posRefreshTimer.current) clearTimeout(posRefreshTimer.current);
    };
  }, []);

  // ---- Load objectives ----

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

  // ---- Refresh career positions after score changes ----

  const schedulePositionsRefresh = useCallback(() => {
    if (posRefreshTimer.current) clearTimeout(posRefreshTimer.current);
    posRefreshTimer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/student/objectives");
        const json = await res.json();
        if (!mountedRef.current || !json.success) return;
        const data = json.data as ObjectivesPayload;
        setCareerInterests(data.careerInterests);
      } catch {
        /* non-critical — positions will refresh on next load */
      } finally {
        if (mountedRef.current) setPositionsRefreshing(false);
      }
    }, POSITION_REFRESH_MS);
  }, []);

  // ---- Per-field auto-save ----

  const saveField = useCallback(
    async (key: string, value: string) => {
      const parsed = Math.round(Number(value));
      if (!value.trim() || !isValidScore(parsed)) return;

      setFieldStatus((prev) => ({ ...prev, [key]: "saving" }));

      const ok = await patchField(key, parsed, PROFILE_KEYS.has(key));

      if (!mountedRef.current) return;

      if (ok) {
        setFieldStatus((prev) => ({ ...prev, [key]: "saved" }));
        if (savedTimers.current[key]) {
          clearTimeout(savedTimers.current[key]);
        }
        savedTimers.current[key] = setTimeout(() => {
          if (mountedRef.current) {
            setFieldStatus((prev) => ({ ...prev, [key]: "idle" }));
          }
        }, SAVED_DISPLAY_MS);
        schedulePositionsRefresh();
      } else {
        setFieldStatus((prev) => ({ ...prev, [key]: "error" }));
        setPositionsRefreshing(false);
      }
    },
    [schedulePositionsRefresh]
  );

  const debounceSave = useCallback(
    (key: string, value: string) => {
      if (debounceTimers.current[key]) {
        clearTimeout(debounceTimers.current[key]);
      }
      debounceTimers.current[key] = setTimeout(() => {
        saveField(key, value);
      }, DEBOUNCE_MS);
    },
    [saveField]
  );

  const updateScoreTarget = useCallback(
    (testCode: string, value: string) => {
      setScoreTargets((prev) => ({ ...prev, [testCode]: value }));
      if (value.trim()) setPositionsRefreshing(true);
      debounceSave(testCode, value);
    },
    [debounceSave]
  );

  const updateProfileScore = useCallback(
    (scoreType: string, value: string) => {
      setProfileScores((prev) => ({ ...prev, [scoreType]: value }));
      if (value.trim()) setPositionsRefreshing(true);
      debounceSave(scoreType, value);
    },
    [debounceSave]
  );

  // ---- Career auto-save (unchanged) ----

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
          setCareerError(
            json.error ?? "Error al guardar carreras"
          );
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
      if (careerInterests.some((ci) => ci.offeringId === offeringId)) {
        return;
      }
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

  return {
    loading,
    loadError,
    fieldStatus,
    careerSaving,
    careerError,
    positionsRefreshing,
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
  };
}
