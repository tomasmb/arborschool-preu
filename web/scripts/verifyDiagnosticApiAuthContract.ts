import assert from "node:assert/strict";
import { readSource } from "./verifyFileUtils";

type DiagnosticApiContract = {
  file: string;
  method: "GET" | "POST";
};

const DIAGNOSTIC_API_CONTRACTS: DiagnosticApiContract[] = [
  { file: "app/api/diagnostic/start/route.ts", method: "POST" },
  { file: "app/api/diagnostic/response/route.ts", method: "POST" },
  { file: "app/api/diagnostic/complete/route.ts", method: "POST" },
  { file: "app/api/diagnostic/profile/route.ts", method: "POST" },
  { file: "app/api/diagnostic/question/route.ts", method: "GET" },
  { file: "app/api/diagnostic/review/route.ts", method: "POST" },
  { file: "app/api/diagnostic/learning-routes/route.ts", method: "POST" },
];

function assertContains(source: string, fragment: string, message: string) {
  assert(source.includes(fragment), message);
}

function verifyDiagnosticRouteAuth(contract: DiagnosticApiContract) {
  const source = readSource(contract.file);

  assertContains(
    source,
    "requireAuthenticatedStudentUser",
    `${contract.file} must import and use requireAuthenticatedStudentUser`
  );
  assertContains(
    source,
    "authResult.unauthorizedResponse",
    `${contract.file} must short-circuit unauthorized diagnostic access`
  );
  assertContains(
    source,
    `export async function ${contract.method}`,
    `${contract.file} must expose ${contract.method} route handler`
  );
}

function verifyRegisterEndpointDeprecation() {
  const source = readSource("app/api/diagnostic/register/route.ts");
  assertContains(
    source,
    "{ status: 410 }",
    "Diagnostic register endpoint must remain deprecated with HTTP 410"
  );
}

function main() {
  for (const contract of DIAGNOSTIC_API_CONTRACTS) {
    verifyDiagnosticRouteAuth(contract);
  }
  verifyRegisterEndpointDeprecation();

  console.log(
    JSON.stringify(
      {
        status: "ok",
        checks: {
          diagnosticApiAuthGuards: "pass",
          diagnosticRegisterDeprecated: "pass",
        },
      },
      null,
      2
    )
  );
}

main();
