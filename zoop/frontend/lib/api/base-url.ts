const DEFAULT_BASE_URL = "/api/proxy";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizeRelativeBase(raw: string) {
  const value = trimTrailingSlash(raw);

  if (value === "/api" || value === "/api/v1") {
    return "/api/proxy";
  }

  if (value === "/api/proxy" || value === "/api/proxy/v1") {
    return "/api/proxy";
  }

  return value;
}

function normalizeAbsoluteBase(raw: string) {
  const value = trimTrailingSlash(raw);

  if (value.endsWith("/api/v1")) {
    return value;
  }

  if (value.endsWith("/api")) {
    return `${value}/v1`;
  }

  return `${value}/api/v1`;
}

export function resolveApiBaseUrl(rawValue?: string) {
  if (!rawValue || !rawValue.trim()) {
    return DEFAULT_BASE_URL;
  }

  const value = rawValue.trim();

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return normalizeAbsoluteBase(value);
  }

  return normalizeRelativeBase(value);
}
