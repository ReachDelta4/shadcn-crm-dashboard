export interface ActivityLog {
  id: string;
  type: "user" | "contact" | "lead" | "deal" | "task" | "email";
  description: string;
  user: string;
  entity?: string;
  timestamp: string;
  details?: Record<string, unknown>;
}
