"use client";

import { SWRConfig } from "swr";
import type { ReactNode } from "react";
import type { ApiEnvelope } from "@/lib/student/apiClientEnvelope";
import { resolveApiErrorMessage } from "@/lib/student/apiClientEnvelope";

/**
 * Shared fetcher for SWR. Sends credentials (cookies) with every
 * request, parses the ApiEnvelope, and throws on failure so SWR
 * surfaces the error through its `error` return value.
 */
export async function portalFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  const payload = (await res.json()) as ApiEnvelope<T>;

  if (!res.ok || !payload.success) {
    throw new Error(resolveApiErrorMessage(payload, "Error al cargar datos"));
  }

  return payload.data;
}

export function PortalSWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: portalFetcher,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 5000,
        errorRetryCount: 2,
      }}
    >
      {children}
    </SWRConfig>
  );
}
