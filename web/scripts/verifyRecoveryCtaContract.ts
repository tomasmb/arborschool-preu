import { readFileSync } from "node:fs";
import path from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function assertContains(
  source: string,
  fragment: string,
  message: string
): void {
  assert(source.includes(fragment), message);
}

function assertGoalsRetryWiring() {
  const hookSource = readSource("app/portal/goals/usePortalGoals.ts");
  assertContains(
    hookSource,
    "useGoalsLoader(state, loadRetryVersion);",
    "Goals loader must be wired to retry version state"
  );
  assertContains(
    hookSource,
    "useGoalsSimulator(state, simulatorRetryVersion);",
    "Goals simulator must be wired to retry version state"
  );
  assertContains(
    hookSource,
    "const retryLoadGoals = useCallback(() => {",
    "Goals hook must expose load retry callback"
  );
  assertContains(
    hookSource,
    "const retrySimulation = useCallback(() => {",
    "Goals hook must expose simulator retry callback"
  );
  assertContains(
    hookSource,
    "retryLoadGoals,",
    "Goals hook return payload must include retryLoadGoals"
  );
  assertContains(
    hookSource,
    "retrySimulation,",
    "Goals hook return payload must include retrySimulation"
  );
}

function assertGoalsRecoveryPanels() {
  const planningFlowSource = readSource(
    "app/portal/goals/PlanningModeFlow.tsx"
  );
  assertContains(
    planningFlowSource,
    "if (loadError)",
    "Planning flow must distinguish loadError from validation/save errors"
  );
  assertContains(
    planningFlowSource,
    "<InlineRecoveryPanel",
    "Planning flow error state must render inline recovery panel"
  );
  assertContains(
    planningFlowSource,
    "onRetry={onRetryLoadGoals}",
    "Planning flow error state must wire retry action"
  );

  const goalsEditorSource = readSource(
    "app/portal/goals/GoalsEditorSection.tsx"
  );
  assertContains(
    goalsEditorSource,
    "if (loadError)",
    "Goals editor must show recovery panel only for loadError"
  );
  assertContains(
    goalsEditorSource,
    "<InlineRecoveryPanel",
    "Goals editor error state must render inline recovery panel"
  );
  assertContains(
    goalsEditorSource,
    "onRetry={onRetryLoadGoals}",
    "Goals editor error state must wire retry action"
  );

  const simulatorSource = readSource("app/portal/goals/SimulatorSection.tsx");
  assertContains(
    simulatorSource,
    "<InlineRecoveryPanel",
    "Simulator error state must render inline recovery panel"
  );
  assertContains(
    simulatorSource,
    "onRetry={onRetrySimulation}",
    "Simulator error state must wire retry action"
  );

  const goalsPageSource = readSource("app/portal/goals/page.tsx");
  assertContains(
    goalsPageSource,
    "loadError={portalGoals.loadError}",
    "Goals page must pass loadError into planning/goals sections"
  );
  assertContains(
    goalsPageSource,
    "onRetryLoadGoals={portalGoals.retryLoadGoals}",
    "Goals page must pass retry callback into planning/goals sections"
  );
  assertContains(
    goalsPageSource,
    "onRetrySimulation={portalGoals.retrySimulation}",
    "Goals page must pass simulator retry callback into simulator section"
  );
}

function assertSharedRecoveryPanelUsage() {
  const nextActionSource = readSource("app/portal/NextActionSection.tsx");
  assertContains(
    nextActionSource,
    "<InlineRecoveryPanel",
    "Next action error state should use shared inline recovery panel"
  );

  const componentIndexSource = readSource("app/portal/components/index.ts");
  assertContains(
    componentIndexSource,
    'export { InlineRecoveryPanel } from "./InlineRecoveryPanel";',
    "Portal component index must export inline recovery panel"
  );
}

function main() {
  assertGoalsRetryWiring();
  assertGoalsRecoveryPanels();
  assertSharedRecoveryPanelUsage();

  console.log(
    JSON.stringify(
      {
        status: "ok",
        checks: {
          goalsRetryWiring: "pass",
          goalsRecoveryPanels: "pass",
          sharedRecoveryPanelUsage: "pass",
        },
      },
      null,
      2
    )
  );
}

main();
