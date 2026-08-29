/** Canonical domain types for DARKROOM SYSTEM. */

/** Backend-allowed Song statuses (exact values submitted to the API). */
export const SONG_STATUSES = [
  "Idea",
  "Demo",
  "Recording",
  "Mixing",
  "Mastering",
  "ReleasePreparation",
  "ContentCampaign",
  "Released",
  "Analytics",
] as const;

export type SongStatus = (typeof SONG_STATUSES)[number];

export const SONG_STATUS_LABELS: Record<SongStatus, string> = {
  Idea: "Idea",
  Demo: "Demo",
  Recording: "Recording",
  Mixing: "Mixing",
  Mastering: "Mastering",
  ReleasePreparation: "Release Preparation",
  ContentCampaign: "Content Campaign",
  Released: "Released",
  Analytics: "Analytics",
};

/** Lifecycle order used for progress indicators. */
export const SONG_LIFECYCLE: SongStatus[] = [
  "Idea",
  "Demo",
  "Recording",
  "Mixing",
  "Mastering",
  "ReleasePreparation",
  "ContentCampaign",
  "Released",
];

/** Song as returned by the real ASP.NET Core API. */
export interface Song {
  id: string | number;
  title: string;
  status: string;
  createdAt: string;
}

export interface SongPayload {
  title: string;
  status: SongStatus;
}

/* ---------- Mocked (backend not implemented yet) ---------- */

export interface SongMeta {
  songId: string;
  artist: string;
  bpm: number;
  songKey: string;
  genre: string;
  notes: string;
  releaseDate?: string;
  lastUpdated: string;
  progress: number;
  collaborators: string[];
}

export const AUDIO_ASSET_TYPES = ["Demo", "Recording", "Mix", "Master"] as const;

export type AudioAssetType = (typeof AUDIO_ASSET_TYPES)[number];

export const AUDIO_ASSET_STATUSES = ["Draft", "Review", "Approved", "Final"] as const;

export type AudioAssetStatus = (typeof AUDIO_ASSET_STATUSES)[number];

/** Audio asset metadata as returned by the real ASP.NET Core API. */
export interface AudioAsset {
  id: string | number;
  songId: string | number;
  type: AudioAssetType;
  fileName: string;
  version: number;
  status: AudioAssetStatus;
  durationSeconds?: number | null;
  fileSizeBytes?: number | null;
  uploadedAt: string;
  isCurrent: boolean;
}

export interface AudioAssetPayload {
  type: AudioAssetType;
  fileName: string;
  version: number;
  status: AudioAssetStatus;
  durationSeconds?: number | null;
  fileSizeBytes?: number | null;
  isCurrent: boolean;
}

export const VISUAL_ASSET_TYPES = [
  "CoverArt",
  "MusicVideo",
  "Visualizer",
  "SpotifyCanvas",
  "PromoAsset",
  "SocialContent",
] as const;

export type VisualAssetType = (typeof VISUAL_ASSET_TYPES)[number];

export const VISUAL_ASSET_TYPE_LABELS: Record<VisualAssetType, string> = {
  CoverArt: "Cover Art",
  MusicVideo: "Music Video",
  Visualizer: "Visualizer",
  SpotifyCanvas: "Spotify Canvas",
  PromoAsset: "Promo Asset",
  SocialContent: "Social Content",
};

export const VISUAL_ASSET_STATUSES = [
  "Draft",
  "InProgress",
  "Review",
  "Approved",
  "Final",
] as const;

export type VisualAssetStatus = (typeof VISUAL_ASSET_STATUSES)[number];

export const VISUAL_ASSET_STATUS_LABELS: Record<VisualAssetStatus, string> = {
  Draft: "Draft",
  InProgress: "In Progress",
  Review: "Review",
  Approved: "Approved",
  Final: "Final",
};

/** Visual asset metadata as returned by the real ASP.NET Core API. */
export interface VisualAsset {
  id: string | number;
  songId: string | number;
  type: VisualAssetType;
  fileName: string;
  version: number;
  status: VisualAssetStatus;
  width?: number | null;
  height?: number | null;
  fileSizeBytes?: number | null;
  uploadedAt: string;
  isCurrent: boolean;
}

export interface VisualAssetPayload {
  type: VisualAssetType;
  fileName: string;
  version: number;
  status: VisualAssetStatus;
  width?: number | null;
  height?: number | null;
  fileSizeBytes?: number | null;
  isCurrent: boolean;
}

export const RELEASE_TYPES = ["Single"] as const;

export type ReleaseType = (typeof RELEASE_TYPES)[number];

export const RELEASE_TYPE_LABELS: Record<ReleaseType, string> = {
  Single: "Single",
};

export const RELEASE_STATUSES = [
  "Planning",
  "Preparing",
  "Ready",
  "Scheduled",
  "Released",
] as const;

export type ReleaseStatus = (typeof RELEASE_STATUSES)[number];

export const RELEASE_STATUS_LABELS: Record<ReleaseStatus, string> = {
  Planning: "Planning",
  Preparing: "Preparing",
  Ready: "Ready",
  Scheduled: "Scheduled",
  Released: "Released",
};

export const RELEASE_PLATFORMS = [
  "Spotify",
  "AppleMusic",
  "YouTube",
  "YouTubeMusic",
  "SoundCloud",
  "TikTok",
  "Other",
] as const;

export type ReleasePlatform = (typeof RELEASE_PLATFORMS)[number];

export const RELEASE_PLATFORM_LABELS: Record<ReleasePlatform, string> = {
  Spotify: "Spotify",
  AppleMusic: "Apple Music",
  YouTube: "YouTube",
  YouTubeMusic: "YouTube Music",
  SoundCloud: "SoundCloud",
  TikTok: "TikTok",
  Other: "Other",
};

/** Release planning metadata as returned by the real ASP.NET Core API. */
export interface Release {
  id: string | number;
  songId: string | number;
  releaseDate?: string | null;
  releaseType: ReleaseType;
  distributor?: string | null;
  isrc?: string | null;
  upc?: string | null;
  status: ReleaseStatus;
  platforms: ReleasePlatform[];
  createdAt: string;
  updatedAt: string;
}

export interface ReleasePayload {
  releaseDate?: string | null;
  releaseType: ReleaseType;
  distributor?: string | null;
  isrc?: string | null;
  upc?: string | null;
  status: ReleaseStatus;
  platforms: ReleasePlatform[];
}

export interface MockAudioAsset {
  id: string;
  songId: string;
  stage: AudioAssetType;
  filename: string;
  version: string;
  uploadedAt: string;
  uploader: string;
  status: "Draft" | "Review" | "Approved" | "Current";
  sizeMb: number;
  duration: string;
  current: boolean;
  note?: string;
}

export type VisualCategory =
  "Cover Art" | "Music Video" | "Visualizer" | "Spotify Canvas" | "Promo Assets" | "Social Content";

export type AssetState = "Missing" | "In Progress" | "Review" | "Approved" | "Final";

export interface MockVisualAsset {
  id: string;
  songId: string;
  category: VisualCategory;
  filename: string;
  state: AssetState;
  version: string;
  creator: string;
  lastUpdated: string;
}

export type ReleaseStage = "Planning" | "Preparing" | "Ready" | "Scheduled" | "Released";

export interface ReleaseInfo {
  songId: string;
  releaseDate: string;
  distributor: string;
  isrc: string;
  upc: string;
  releaseType: "Single" | "EP" | "Album";
  platforms: string[];
  stage: ReleaseStage;
  checklist: { item: string; done: boolean }[];
}

export type ContentType =
  | "Teaser"
  | "Snippet"
  | "Music Video"
  | "Visualizer"
  | "Behind The Scenes"
  | "TikTok"
  | "Instagram Reel"
  | "YouTube Short"
  | "Artwork Post";

export type ContentStage =
  "Idea" | "Planned" | "In Production" | "Editing" | "Ready" | "Scheduled" | "Published";

export interface ContentItem {
  id: string;
  songId: string;
  title: string;
  type: ContentType;
  stage: ContentStage;
  owner: string;
  scheduledFor?: string;
  platform: string;
}

export type CreditRole =
  | "Artist"
  | "Featured Artist"
  | "Producer"
  | "Songwriter"
  | "Recording Engineer"
  | "Mix Engineer"
  | "Mastering Engineer"
  | "Director"
  | "Designer";

export interface Credit {
  id: string;
  songId: string;
  name: string;
  role: CreditRole;
  contact: string;
  status: "Confirmed" | "Pending" | "Invited";
  /** Planned feature — not backed by any system yet. */
  plannedSplit?: number;
}

export interface AnalyticsSnapshot {
  songId: string;
  views: number;
  likes: number;
  comments: number;
  watchTimeHours: number;
  subscriberGrowth: number;
  velocity: { label: string; value: number }[];
  topContent: { title: string; platform: string; views: number }[];
}

export interface ActivityEvent {
  id: string;
  songId?: string;
  songTitle?: string;
  actor: string;
  action: string;
  at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: "Owner" | "Admin" | "Artist" | "Producer" | "Engineer" | "Manager" | "Collaborator";
  email: string;
  projects: string[];
  lastActivity: string;
}

export type CalendarEventKind =
  "Release" | "Teaser" | "Artwork" | "Music Video" | "Content" | "Milestone";

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  kind: CalendarEventKind;
  song: string;
}
