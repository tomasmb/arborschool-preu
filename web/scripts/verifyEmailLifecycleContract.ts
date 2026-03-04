import assert from "node:assert/strict";
import { readSource } from "./verifyFileUtils";

const WAITLIST_LANGUAGE_PATTERNS = [
  /te avisamos/i,
  /cuando lancemos/i,
  /lanzamiento/i,
  /waitlist/i,
  /lista de espera/i,
  /beta cerrada/i,
];

function assertNoWaitlistLanguage(file: string, source: string) {
  for (const pattern of WAITLIST_LANGUAGE_PATTERNS) {
    assert(
      !pattern.test(source),
      `${file} contains deprecated waitlist/launch language (${pattern})`
    );
  }
}

function countOccurrences(source: string, fragment: string): number {
  return source.split(fragment).length - 1;
}

function assertSingleSprintCtaBuilder(file: string, source: string) {
  const occurrences = countOccurrences(source, "buildEmailStartSprintUrl(");
  assert(
    occurrences >= 1 && occurrences <= 2,
    `${file} must use one canonical sprint CTA URL builder for html/text variants`
  );
}

function assertSprintCtaCopy(file: string, source: string) {
  assert(
    source.includes("Comenzar sprint de hoy"),
    `${file} must include sprint CTA copy`
  );
}

function assertStudyLinkDestinationContract() {
  const linksSource = readSource("lib/email/links.ts");
  assert(
    linksSource.includes('new URL("/portal/study", EMAIL_CONFIG.baseUrl)'),
    "Email sprint CTA deep link must target /portal/study"
  );
  assert(
    linksSource.includes("EMAIL_LINK_INTENT_START_FIRST_SPRINT"),
    "Email sprint CTA deep link must preserve start-first-sprint intent"
  );
}

function verifyTemplate(file: string) {
  const source = readSource(file);
  assertNoWaitlistLanguage(file, source);
  assertSingleSprintCtaBuilder(file, source);
  assertSprintCtaCopy(file, source);
}

function main() {
  verifyTemplate("lib/email/confirmationEmail.ts");
  verifyTemplate("lib/email/followupEmail.ts");
  assertStudyLinkDestinationContract();

  const result = {
    status: "ok",
    checks: {
      noWaitlistLanguage: "pass",
      sprintCtaCopyContract: "pass",
      sprintCtaLinkContract: "pass",
    },
  };
  console.log(JSON.stringify(result, null, 2));
}

main();
