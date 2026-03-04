import { spawnSync } from "node:child_process";

const RELEASE_GATE_SCRIPTS = [
  "verify:student-portal-v1",
  "verify:lifecycle-reminder-dispatch",
  "verify:analytics-funnel-report",
  "verify:analytics-milestone-context",
  "verify:journey-routing-reliability",
  "verify:portal-journey-contract",
  "verify:recovery-cta-contract",
  "verify:diagnostic-api-auth-contract",
  "verify:email-lifecycle-contract",
] as const;

type ScriptStatus = {
  script: (typeof RELEASE_GATE_SCRIPTS)[number];
  status: "pass" | "fail";
};

function runVerificationScript(
  script: (typeof RELEASE_GATE_SCRIPTS)[number]
): ScriptStatus {
  const result = spawnSync("npm", ["run", script], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });

  return {
    script,
    status: result.status === 0 ? "pass" : "fail",
  };
}

function main() {
  const results = RELEASE_GATE_SCRIPTS.map(runVerificationScript);
  const failed = results.filter((result) => result.status === "fail");

  console.log(
    JSON.stringify(
      { status: failed.length === 0 ? "ok" : "failed", checks: results },
      null,
      2
    )
  );

  if (failed.length > 0) {
    process.exit(1);
  }
}

main();
