const accessTokenKey = "artist-os.access-token";

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function getAccessToken() {
  if (!canUseSessionStorage()) return null;
  return window.sessionStorage.getItem(accessTokenKey);
}

export function setAccessToken(token: string) {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(accessTokenKey, token);
}

export function clearAccessToken() {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(accessTokenKey);
}
