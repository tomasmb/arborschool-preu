type QueryParamValue = string | string[] | undefined;

export type QueryParamsRecord = Record<string, QueryParamValue>;

function appendQueryParam(
  searchParams: URLSearchParams,
  key: string,
  value: QueryParamValue
): void {
  if (typeof value === "string") {
    searchParams.append(key, value);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      searchParams.append(key, item);
    }
  }
}

export function toUrlSearchParams(
  queryParams?: QueryParamsRecord
): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (!queryParams) {
    return searchParams;
  }

  for (const [key, value] of Object.entries(queryParams)) {
    appendQueryParam(searchParams, key, value);
  }

  return searchParams;
}

export function appendSearchParamsToPath(
  pathname: string,
  queryParams?: QueryParamsRecord
): string {
  const queryString = toUrlSearchParams(queryParams).toString();
  if (!queryString) {
    return pathname;
  }

  return `${pathname}?${queryString}`;
}

export function resolveSafeCallbackUrl(
  callbackUrl: string | undefined,
  fallback = "/auth/post-login"
): string {
  if (
    !callbackUrl ||
    !callbackUrl.startsWith("/") ||
    callbackUrl.startsWith("//") ||
    callbackUrl.startsWith("/auth/signin")
  ) {
    return fallback;
  }

  return callbackUrl;
}

export function buildSignInUrlWithCallback(
  callbackUrl: string | undefined,
  fallback = "/auth/post-login"
): string {
  const safeCallbackUrl = resolveSafeCallbackUrl(callbackUrl, fallback);
  const query = new URLSearchParams({
    callbackUrl: safeCallbackUrl,
  });

  return `/auth/signin?${query.toString()}`;
}
