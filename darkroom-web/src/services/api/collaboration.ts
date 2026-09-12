import { http } from "./client";
import type {
  InvitationInboxItem,
  InviteSongMemberPayload,
  SongInvitation,
  SongMember,
  UpdateSongMemberRolePayload,
} from "@/types";

export const invitationInboxQueryKey = ["invitations"];

export function songMembersQueryKey(songId: string) {
  return ["songs", songId, "members"];
}

export const collaborationApi = {
  getSongMembers(songId: string): Promise<SongMember[]> {
    return http.get<SongMember[]>(`/api/songs/${songId}/members`);
  },

  inviteSongMember(songId: string, payload: InviteSongMemberPayload): Promise<SongInvitation> {
    return http.post<SongInvitation>(`/api/songs/${songId}/invitations`, payload);
  },

  getSongInvitations(songId: string): Promise<SongInvitation[]> {
    return http.get<SongInvitation[]>(`/api/songs/${songId}/invitations`);
  },

  revokeSongInvitation(songId: string, invitationId: string): Promise<SongInvitation> {
    return http.post<SongInvitation>(`/api/songs/${songId}/invitations/${invitationId}/revoke`, {});
  },

  updateSongMemberRole(
    songId: string,
    memberId: string,
    payload: UpdateSongMemberRolePayload,
  ): Promise<SongMember> {
    return http.patch<SongMember>(`/api/songs/${songId}/members/${memberId}`, payload);
  },

  removeSongMember(songId: string, memberId: string): Promise<void> {
    return http.delete<void>(`/api/songs/${songId}/members/${memberId}`);
  },

  getInvitations(): Promise<InvitationInboxItem[]> {
    return http.get<InvitationInboxItem[]>("/api/invitations");
  },

  acceptInvitation(invitationId: string): Promise<SongInvitation> {
    return http.post<SongInvitation>(`/api/invitations/${invitationId}/accept`, {});
  },

  declineInvitation(invitationId: string): Promise<SongInvitation> {
    return http.post<SongInvitation>(`/api/invitations/${invitationId}/decline`, {});
  },
};
