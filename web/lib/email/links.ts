import {
  EMAIL_LINK_INTENT_PARAM,
  EMAIL_LINK_INTENT_START_FIRST_STUDY,
  EMAIL_LINK_SOURCE_PARAM,
  EMAIL_LINK_SOURCE_VALUE,
} from "@/lib/student/journeyRouting";
import { EMAIL_CONFIG } from "./service";

type StartStudyEmailOrigin = "confirmation" | "followup";

const EMAIL_LINK_ORIGIN_PARAM = "origin";

export function buildEmailStartStudyUrl(
  origin: StartStudyEmailOrigin
): string {
  const url = new URL("/portal/study", EMAIL_CONFIG.baseUrl);
  url.searchParams.set(EMAIL_LINK_SOURCE_PARAM, EMAIL_LINK_SOURCE_VALUE);
  url.searchParams.set(
    EMAIL_LINK_INTENT_PARAM,
    EMAIL_LINK_INTENT_START_FIRST_STUDY
  );
  url.searchParams.set(EMAIL_LINK_ORIGIN_PARAM, origin);

  return url.toString();
}
