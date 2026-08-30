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

export const CONTENT_TYPES = [
  "Teaser",
  "Snippet",
  "MusicVideo",
  "Visualizer",
  "BehindTheScenes",
  "TikTok",
  "InstagramReel",
  "YouTubeShort",
  "ArtworkPost",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  Teaser: "Teaser",
  Snippet: "Snippet",
  MusicVideo: "Music Video",
  Visualizer: "Visualizer",
  BehindTheScenes: "Behind The Scenes",
  TikTok: "TikTok",
  InstagramReel: "Instagram Reel",
  YouTubeShort: "YouTube Short",
  ArtworkPost: "Artwork Post",
};

export const CONTENT_STATUSES = [
  "Idea",
  "Planned",
  "InProduction",
  "Editing",
  "Ready",
  "Scheduled",
  "Published",
] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  Idea: "Idea",
  Planned: "Planned",
  InProduction: "In Production",
  Editing: "Editing",
  Ready: "Ready",
  Scheduled: "Scheduled",
  Published: "Published",
};

export const CONTENT_PLATFORMS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "YouTubeShorts",
  "Spotify",
  "CrossPlatform",
  "Other",
] as const;

export type ContentPlatform = (typeof CONTENT_PLATFORMS)[number];

export const CONTENT_PLATFORM_LABELS: Record<ContentPlatform, string> = {
  Instagram: "Instagram",
  TikTok: "TikTok",
  YouTube: "YouTube",
  YouTubeShorts: "YouTube Shorts",
  Spotify: "Spotify",
  CrossPlatform: "Cross Platform",
  Other: "Other",
};

export interface ContentItem {
  id: string | number;
  songId: string | number;
  title: string;
  type: ContentType;
  status: ContentStatus;
  platform?: ContentPlatform | null;
  ownerName?: string | null;
  dueDate?: string | null;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentItemPayload {
  title: string;
  type: ContentType;
  status: ContentStatus;
  platform?: ContentPlatform | null;
  ownerName?: string | null;
  dueDate?: string | null;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  notes?: string | null;
}

export type MockContentType =
  | "Teaser"
  | "Snippet"
  | "Music Video"
  | "Visualizer"
  | "Behind The Scenes"
  | "TikTok"
  | "Instagram Reel"
  | "YouTube Short"
  | "Artwork Post";

export type MockContentStage =
  "Idea" | "Planned" | "In Production" | "Editing" | "Ready" | "Scheduled" | "Published";

export interface MockContentItem {
  id: string;
  songId: string;
  title: string;
  type: MockContentType;
  stage: MockContentStage;
  owner: string;
  scheduledFor?: string;
  platform: string;
}

export const CREDIT_ROLES = [
  "Artist",
  "FeaturedArtist",
  "Producer",
  "Songwriter",
  "RecordingEngineer",
  "MixEngineer",
  "MasteringEngineer",
  "Director",
  "Designer",
] as const;

export type CreditRole = (typeof CREDIT_ROLES)[number];

export const CREDIT_ROLE_LABELS: Record<CreditRole, string> = {
  Artist: "Artist",
  FeaturedArtist: "Featured Artist",
  Producer: "Producer",
  Songwriter: "Songwriter",
  RecordingEngineer: "Recording Engineer",
  MixEngineer: "Mix Engineer",
  MasteringEngineer: "Mastering Engineer",
  Director: "Director",
  Designer: "Designer",
};

export const CREDIT_STATUSES = ["Pending", "Confirmed"] as const;

export type CreditStatus = (typeof CREDIT_STATUSES)[number];

export interface Credit {
  id: string | number;
  songId: string | number;
  contributorName: string;
  role: CreditRole;
  contact?: string | null;
  status: CreditStatus;
  splitPercentage?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreditPayload {
  contributorName: string;
  role: CreditRole;
  contact?: string | null;
  status: CreditStatus;
  splitPercentage?: number | null;
  notes?: string | null;
}

export interface MockCredit {
  id: string;
  songId: string;
  name: string;
  role: string;
  contact: string;
  status: "Confirmed" | "Pending" | "Invited";
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
