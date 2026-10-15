export type Role = "creator" | "editor" | "admin";

export type AiJobStatus =
  | "queued"
  | "transcribing"
  | "analyzing"
  | "rendering"
  | "done"
  | "failed";

export interface AiJob {
  id: string;
  owner_id: string;
  source_r2_key: string;
  source_bytes: number;
  status: AiJobStatus;
  idempotency_key: string;
  attempts: number;
}
