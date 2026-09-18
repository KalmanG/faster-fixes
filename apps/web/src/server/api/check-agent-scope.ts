export type AgentScope =
  | "feedbacks:read"
  | "feedbacks:update_status"
  | "feedbacks:create"
  | "reviewers:manage";

export function hasScope(tokenScopes: string[], required: AgentScope): boolean {
  return tokenScopes.includes(required);
}
