// ============================================================================
// ENUMS — sinkronkan dengan PostgreSQL ENUMs di Phase 1
// ============================================================================

export type UserRole = "hunter" | "leader" | "admin";

export type EventStatus = "upcoming" | "active" | "completed" | "cancelled";

export type CatchType =
  | "sapu_sapu"
  | "sampah_anorganik"
  | "sampah_organik"
  | "sampah_b3";

export type LedgerType = "earned" | "redeemed" | "adjusted" | "expired";

// ============================================================================
// CORE ENTITIES
// ============================================================================

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  total_points: number;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  river_name: string;

  latitude: number;
  longitude: number;
  radius_meters: number;

  start_time: string;
  end_time: string;

  leader_id: string;
  leader_pin_hash: string;
  qr_token: string;

  status: EventStatus;
  max_participants: number | null;
  created_at: string;
  updated_at: string;
}

export type EventPublic = Omit<Event, "leader_pin_hash" | "qr_token">;

export interface RestorationLog {
  id: string;
  event_id: string;
  hunter_id: string;
  leader_id: string;

  hunter_lat: number;
  hunter_lng: number;
  distance_meters: number;
  gps_verified: boolean;

  catch_type: CatchType;
  weight_kg: number;
  photo_url: string | null;

  points_awarded: number;
  notes: string | null;
  created_at: string;
}

export interface UserPoint {
  id: string;
  user_id: string;
  log_id: string | null;

  ledger_type: LedgerType;
  points: number;
  balance_after: number;

  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ============================================================================
// INSERT / UPDATE VARIANTS
// ============================================================================

export type ProfileUpdate = Partial<
  Pick<Profile, "username" | "full_name" | "avatar_url" | "phone">
>;

export type EventInsert = Omit<
  Event,
  "id" | "qr_token" | "leader_pin_hash" | "created_at" | "updated_at"
> & {
  leader_pin: string;
};

export type RestorationLogInsert = Omit<
  RestorationLog,
  "id" | "created_at" | "distance_meters" | "gps_verified" | "points_awarded"
>;

// ============================================================================
// CLAIM FLOW PAYLOADS
// ============================================================================

export interface ClaimRequest {
  event_id: string;
  qr_token: string;
  leader_pin: string;
  hunter_lat: number;
  hunter_lng: number;
  catch_type: CatchType;
  weight_kg: number;
}

export interface ClaimResponse {
  success: boolean;
  log?: RestorationLog;
  points_awarded?: number;
  new_balance?: number;
  error?:
    | "GPS_OUT_OF_RANGE"
    | "INVALID_PIN"
    | "INVALID_QR"
    | "EVENT_INACTIVE"
    | "UNKNOWN";
  message?: string;
}

// ============================================================================
// COMPOSITE TYPES (untuk joined queries via Supabase select)
// ============================================================================

export interface EventWithLeader extends EventPublic {
  leader: Pick<Profile, "id" | "username" | "full_name" | "avatar_url">;
  participant_count?: number;
}

export interface RestorationLogWithRelations extends RestorationLog {
  event: Pick<Event, "id" | "title" | "river_name">;
  hunter: Pick<Profile, "id" | "username" | "avatar_url">;
  leader: Pick<Profile, "id" | "username" | "full_name">;
}
