import { http } from "./client";

export const googleDriveConnectionQueryKey = ["google-drive", "connection"];

export type GoogleDriveConnectionStatus = {
  connected: boolean;
  email?: string | null;
  status?: "Connected" | "ReauthRequired" | string | null;
  connectedAt?: string | null;
};

export type GoogleDriveConnectResponse = {
  authorizationUrl: string;
};

export const googleDriveApi = {
  getStatus: () => http.get<GoogleDriveConnectionStatus>("/api/integrations/google-drive/status"),
  connect: () =>
    http.post<GoogleDriveConnectResponse>("/api/integrations/google-drive/connect", {}),
  disconnect: () =>
    http.post<{ disconnected: boolean }>("/api/integrations/google-drive/disconnect", {}),
};

export function openGoogleAuthorizationUrl(authorizationUrl: string) {
  window.location.assign(authorizationUrl);
}
