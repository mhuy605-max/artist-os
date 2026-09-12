import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useState, type FormEvent, type MouseEvent } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingState, formatDate } from "@/components/darkroom/Primitives";
import { StatusBadge } from "@/components/darkroom/StatusBadge";
import { ApiError } from "@/services/api/client";
import {
  collaborationApi,
  invitationInboxQueryKey,
  songMembersQueryKey,
} from "@/services/api/collaboration";
import {
  COLLABORATOR_ROLES,
  type CollaboratorRole,
  type Song,
  type SongInvitation,
  type SongMember,
} from "@/types";
import { type SongAccess, parseApiProblemTitle } from "../shared";

function roleLabel(role: string) {
  if (role === "OWNER") return "Owner";
  if (role === "EDITOR") return "Editor";
  if (role === "VIEWER") return "Viewer";
  return role;
}

function displayName(email: string, name?: string | null) {
  return name?.trim() || email;
}

function mutationErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return parseApiProblemTitle(error) || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function SongMembersDialog({ song, access }: { song: Song; access: SongAccess }) {
  const [open, setOpen] = useState(false);
  const songId = String(song.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Users className="h-4 w-4" />
          Members
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-border bg-background sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="uppercase">Members</DialogTitle>
          <DialogDescription>
            Song workspace access for {song.title}. Invitations require an existing DARKROOM
            account.
          </DialogDescription>
        </DialogHeader>
        <SongMembersContent songId={songId} access={access} />
      </DialogContent>
    </Dialog>
  );
}

function SongMembersContent({ songId, access }: { songId: string; access: SongAccess }) {
  const members = useQuery({
    queryKey: songMembersQueryKey(songId),
    queryFn: () => collaborationApi.getSongMembers(songId),
    retry: false,
  });
  const invitations = useQuery({
    queryKey: [...songMembersQueryKey(songId), "invitations"],
    queryFn: () => collaborationApi.getSongInvitations(songId),
    enabled: access.canManageMembers,
    retry: false,
  });

  if (members.isLoading) return <LoadingState label="Loading members" />;
  if (members.isError) {
    return (
      <ErrorState
        title="Members unavailable"
        detail="Song workspace members could not be loaded."
        onRetry={() => members.refetch()}
      />
    );
  }

  const rows = members.data ?? [];
  const owner = rows.find((member) => member.role === "OWNER");
  const collaborators = rows.filter((member) => member.role !== "OWNER");

  return (
    <div className="space-y-5">
      {access.canManageMembers ? null : <ReadOnlyMemberNotice />}

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="label-tech">Active access</p>
            <h3 className="mt-1 text-sm font-semibold uppercase">Workspace members</h3>
          </div>
          <span className="text-xs uppercase text-muted-foreground">
            {rows.length} {rows.length === 1 ? "member" : "members"}
          </span>
        </div>
        <div className="divide-y divide-border border border-border bg-panel">
          {owner ? <MemberRow member={owner} songId={songId} canManage={false} /> : null}
          {collaborators.length ? (
            collaborators.map((member) => (
              <MemberRow
                key={String(member.memberId ?? member.userId)}
                member={member}
                songId={songId}
                canManage={access.canManageMembers}
              />
            ))
          ) : owner ? null : (
            <EmptyState
              title="No members yet"
              detail="The owner will appear here when backend membership data is available."
            />
          )}
        </div>
      </section>

      {access.canManageMembers ? (
        <PendingInvitations
          songId={songId}
          invitations={invitations.data ?? []}
          isLoading={invitations.isLoading}
          isError={invitations.isError}
          onRetry={() => invitations.refetch()}
        />
      ) : null}

      {access.canManageMembers ? <InviteMemberForm songId={songId} /> : null}
    </div>
  );
}

function ReadOnlyMemberNotice() {
  return (
    <div className="border border-border bg-panel p-3 text-sm text-muted-foreground">
      You can view this song workspace roster. Only the owner can invite, remove, or change roles.
    </div>
  );
}

function InviteMemberForm({ songId }: { songId: string }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRole>("EDITOR");
  const [message, setMessage] = useState("");
  const invite = useMutation({
    mutationFn: () => collaborationApi.inviteSongMember(songId, { email: email.trim(), role }),
    onSuccess: () => {
      setEmail("");
      setRole("EDITOR");
      setMessage("Invitation created.");
      queryClient.invalidateQueries({ queryKey: songMembersQueryKey(songId) });
      queryClient.invalidateQueries({ queryKey: [...songMembersQueryKey(songId), "invitations"] });
      queryClient.invalidateQueries({ queryKey: invitationInboxQueryKey });
    },
    onError: (error) => {
      setMessage(mutationErrorMessage(error, "Invitation could not be created."));
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (invite.isPending) return;
    setMessage("");
    invite.mutate();
  }

  const locked = invite.isPending;

  return (
    <form className="border border-border bg-panel p-4" onSubmit={submit}>
      <div className="mb-3">
        <p className="label-tech">Invite</p>
        <h3 className="mt-1 text-sm font-semibold uppercase">Invite collaborator</h3>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_170px_auto] md:items-end">
        <div>
          <label className="label-tech" htmlFor="member-email">
            Existing account email
          </label>
          <Input
            id="member-email"
            className="mt-2"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setMessage("");
            }}
            placeholder="collaborator@example.com"
            maxLength={254}
            required
            disabled={locked}
          />
        </div>
        <div>
          <label className="label-tech">Role</label>
          <Select
            value={role}
            onValueChange={(value) => {
              setRole(value as CollaboratorRole);
              setMessage("");
            }}
            disabled={locked}
          >
            <SelectTrigger className="mt-2" aria-label="Invitation role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLLABORATOR_ROLES.map((value) => (
                <SelectItem key={value} value={value}>
                  {roleLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button disabled={locked}>{locked ? "Inviting" : "Invite collaborator"}</Button>
      </div>
      {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}

function MemberRow({
  member,
  songId,
  canManage,
}: {
  member: SongMember;
  songId: string;
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [removeOpen, setRemoveOpen] = useState(false);
  const memberId = member.memberId == null ? "" : String(member.memberId);
  const editable = canManage && member.role !== "OWNER" && memberId !== "";
  const updateRole = useMutation({
    mutationFn: (role: CollaboratorRole) =>
      collaborationApi.updateSongMemberRole(songId, memberId, { role }),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: songMembersQueryKey(songId) });
    },
    onError: (error) => {
      setMessage(mutationErrorMessage(error, "Role could not be changed."));
      queryClient.invalidateQueries({ queryKey: songMembersQueryKey(songId) });
    },
  });
  const remove = useMutation({
    mutationFn: () => collaborationApi.removeSongMember(songId, memberId),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: songMembersQueryKey(songId) });
      queryClient.invalidateQueries({ queryKey: ["songs"] });
    },
    onError: (error) => {
      setMessage(mutationErrorMessage(error, "Member could not be removed."));
      queryClient.invalidateQueries({ queryKey: songMembersQueryKey(songId) });
    },
  });

  async function confirmRemove(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (remove.isPending) return;

    await remove.mutateAsync().catch(() => undefined);
    setRemoveOpen(false);
  }

  const name = displayName(member.email, member.displayName);

  return (
    <div className="grid gap-3 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium" title={name}>
            {name}
          </p>
          <StatusBadge status={roleLabel(member.role)} />
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground" title={member.email}>
          {member.email}
        </p>
        <p className="mt-1 text-xs uppercase text-muted-foreground">
          {member.role === "OWNER" ? "Workspace owner" : `Joined ${formatDate(member.joinedAt)}`}
        </p>
        {message ? <p className="mt-2 text-xs text-muted-foreground">{message}</p> : null}
      </div>
      {editable ? (
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Select
            value={member.role === "VIEWER" ? "VIEWER" : "EDITOR"}
            onValueChange={(value) => updateRole.mutate(value as CollaboratorRole)}
            disabled={updateRole.isPending || remove.isPending}
          >
            <SelectTrigger className="h-9 w-36" aria-label={`Role for ${member.email}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLLABORATOR_ROLES.map((value) => (
                <SelectItem key={value} value={value}>
                  {roleLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AlertDialog
            open={removeOpen}
            onOpenChange={(nextOpen) => {
              if (!remove.isPending) setRemoveOpen(nextOpen);
            }}
          >
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={remove.isPending}>
                Remove
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove member?</AlertDialogTitle>
                <AlertDialogDescription>
                  {member.email} will lose access to this song workspace.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
                <AlertDialogAction disabled={remove.isPending} onClick={confirmRemove}>
                  {remove.isPending ? "Removing" : "Remove"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : null}
    </div>
  );
}

function PendingInvitations({
  songId,
  invitations,
  isLoading,
  isError,
  onRetry,
}: {
  songId: string;
  invitations: SongInvitation[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  if (isLoading) return <LoadingState label="Loading pending invitations" />;
  if (isError) {
    return (
      <ErrorState
        title="Invitations unavailable"
        detail="Pending invitations could not be loaded."
        onRetry={onRetry}
      />
    );
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="label-tech">Pending</p>
          <h3 className="mt-1 text-sm font-semibold uppercase">Invitations</h3>
        </div>
        <span className="text-xs uppercase text-muted-foreground">
          {invitations.length} pending
        </span>
      </div>
      {invitations.length ? (
        <div className="divide-y divide-border border border-border bg-panel">
          {invitations.map((invitation) => (
            <PendingInvitationRow
              key={String(invitation.id)}
              songId={songId}
              invitation={invitation}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No pending invitations"
          detail="Invitations for existing accounts will appear here until accepted, declined, or revoked."
        />
      )}
    </section>
  );
}

function PendingInvitationRow({
  songId,
  invitation,
}: {
  songId: string;
  invitation: SongInvitation;
}) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [revokeOpen, setRevokeOpen] = useState(false);
  const revoke = useMutation({
    mutationFn: () => collaborationApi.revokeSongInvitation(songId, String(invitation.id)),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: [...songMembersQueryKey(songId), "invitations"] });
      queryClient.invalidateQueries({ queryKey: invitationInboxQueryKey });
    },
    onError: (error) => {
      setMessage(mutationErrorMessage(error, "Invitation could not be revoked."));
      queryClient.invalidateQueries({ queryKey: [...songMembersQueryKey(songId), "invitations"] });
    },
  });

  async function confirmRevoke(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (revoke.isPending) return;

    await revoke.mutateAsync().catch(() => undefined);
    setRevokeOpen(false);
  }

  const name = displayName(invitation.invitedUser.email, invitation.invitedUser.displayName);

  return (
    <div className="grid gap-3 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium" title={name}>
            {name}
          </p>
          <StatusBadge status={roleLabel(invitation.role)} />
          <span className="border border-border px-2 py-1 text-[10px] uppercase text-muted-foreground">
            Pending invitation
          </span>
        </div>
        <p
          className="mt-1 truncate text-xs text-muted-foreground"
          title={invitation.invitedUser.email}
        >
          {invitation.invitedUser.email}
        </p>
        <p className="mt-1 text-xs uppercase text-muted-foreground">
          Invited {formatDate(invitation.createdAt)}
        </p>
        {message ? <p className="mt-2 text-xs text-muted-foreground">{message}</p> : null}
      </div>
      <AlertDialog
        open={revokeOpen}
        onOpenChange={(nextOpen) => {
          if (!revoke.isPending) setRevokeOpen(nextOpen);
        }}
      >
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={revoke.isPending}>
            Revoke
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              {invitation.invitedUser.email} will no longer be able to accept this invitation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoke.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={revoke.isPending} onClick={confirmRevoke}>
              {revoke.isPending ? "Revoking" : "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
