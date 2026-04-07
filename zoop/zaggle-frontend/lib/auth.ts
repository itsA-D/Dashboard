const REFRESH_COOKIE = "zaggle_refresh_token";

let accessToken: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setRefreshToken(token: string | null) {
  if (typeof document === "undefined") {
    return;
  }

  if (!token) {
    document.cookie = `${REFRESH_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`;
    return;
  }

  document.cookie = `${REFRESH_COOKIE}=${token}; Max-Age=${60 * 60 * 24 * 7}; path=/; SameSite=Lax`;
}

export function getRefreshToken() {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${REFRESH_COOKIE}=`));

  return match?.split("=")[1] ?? null;
}

export function clearSessionTokens() {
  setAccessToken(null);
  setRefreshToken(null);
}
